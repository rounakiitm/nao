import { SyncStatus } from '../types';
import { getStoredEvents, saveEvents, getMasterPasscode } from './storage';
import { getSupabaseClient } from './supabase';

type SyncCallback = (status: SyncStatus) => void;

class SyncEngine {
  private listeners: Set<SyncCallback> = new Set();
  private broadcastChannel: BroadcastChannel | null = null;
  private isSyncing = false;
  private lastSyncAt: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      // 1. Cross-window / Cross-tab Broadcast Channel
      try {
        this.broadcastChannel = new BroadcastChannel('nao_vault_sync_channel');
        this.broadcastChannel.onmessage = (event) => {
          if (event.data && event.data.type === 'VAULT_UPDATED') {
            this.handleRemoteChange();
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel not supported in this environment');
      }

      // 2. Network connectivity listeners
      window.addEventListener('online', () => {
        console.log('[nao Sync] Network connection restored. Auto-syncing...');
        this.triggerSync();
      });

      window.addEventListener('offline', () => {
        console.log('[nao Sync] Device went offline. Working from local storage.');
        this.emitStatus();
      });

      // 3. Storage event listener (syncs across browser tabs on the same origin)
      window.addEventListener('storage', (e) => {
        if (e.key === 'important_dates_events') {
          this.handleRemoteChange();
        }
      });
    }
  }

  /**
   * Subscribe to live sync status updates.
   */
  public subscribe(callback: SyncCallback): () => void {
    this.listeners.add(callback);
    callback(this.getStatus());
    return () => this.listeners.delete(callback);
  }

  /**
   * Get current sync status.
   */
  public getStatus(): SyncStatus {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    const client = getSupabaseClient();
    return {
      isOnline,
      isSyncing: this.isSyncing,
      lastSyncAt: this.lastSyncAt,
      mode: client ? 'cloud-synced' : 'offline-local',
    };
  }

  private emitStatus() {
    const status = this.getStatus();
    this.listeners.forEach((cb) => cb(status));
  }

  /**
   * Called whenever user adds, edits, or deletes an event locally.
   * Notifies all open windows/tabs and pushes to cloud if configured.
   */
  public notifyVaultChanged(): void {
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: 'VAULT_UPDATED',
        timestamp: Date.now(),
      });
    }
    this.triggerSync();
  }

  /**
   * Triggers an automatic sync cycle (called on reconnect, startup, or edits).
   */
  public async triggerSync(): Promise<void> {
    if (this.isSyncing) return;
    this.isSyncing = true;
    this.emitStatus();

    try {
      const client = getSupabaseClient();
      if (client && navigator.onLine) {
        // Cloud Sync via Supabase
        const { data: cloudEvents, error } = await client
          .from('events')
          .select('*')
          .order('date', { ascending: true });

        if (!error && cloudEvents && cloudEvents.length > 0) {
          // Merge or update local events
          const localEvents = getStoredEvents();
          const localIds = new Set(localEvents.map((e) => e.id));
          const toAdd = cloudEvents.filter((ce: any) => !localIds.has(ce.id));
          
          if (toAdd.length > 0) {
            saveEvents([...toAdd, ...localEvents]);
          }
        }
      }

      this.lastSyncAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (err) {
      console.warn('[nao Sync] Auto-sync notice:', err);
    } finally {
      this.isSyncing = false;
      this.emitStatus();
    }
  }

  private handleRemoteChange() {
    this.lastSyncAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    this.emitStatus();
    // Dispatch custom event for App to re-render
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('nao_vault_refreshed'));
    }
  }
}

export const syncEngine = new SyncEngine();
