import { DiaryEntry, ImportantEvent } from '../types';
import { getStoredEvents, saveEvents } from './storage';
import { getStoredDiaryEntries, saveAllDiaryEntries } from './diaryStorage';

export interface NaoVaultBackupPayload {
  app: 'nao';
  version: string;
  backupDate: string;
  ownerEmail: string;
  diaryEntries: DiaryEntry[];
  events: ImportantEvent[];
}

const GOOGLE_CLIENT_ID_STORAGE_KEY = 'nao_google_client_id';

export function getSavedGoogleClientId(): string {
  return localStorage.getItem(GOOGLE_CLIENT_ID_STORAGE_KEY) || '';
}

export function saveGoogleClientId(clientId: string): void {
  localStorage.setItem(GOOGLE_CLIENT_ID_STORAGE_KEY, clientId.trim());
}

/**
 * Creates a complete snapshot of all Diary entries and Milestones
 */
export function generateVaultBackupPayload(ownerEmail = 'rounaksingh05555@gmail.com'): NaoVaultBackupPayload {
  const diaryEntries = getStoredDiaryEntries();
  const events = getStoredEvents();

  return {
    app: 'nao',
    version: '1.1.0',
    backupDate: new Date().toISOString(),
    ownerEmail,
    diaryEntries,
    events,
  };
}

/**
 * Restores a complete vault snapshot from JSON
 */
export function restoreVaultBackupPayload(payload: NaoVaultBackupPayload): { 
  success: boolean; 
  diaryCount: number; 
  eventCount: number; 
  error?: string 
} {
  try {
    if (!payload || !payload.app || payload.app !== 'nao') {
      return { success: false, diaryCount: 0, eventCount: 0, error: 'Invalid backup file: missing nao signature' };
    }

    let diaryCount = 0;
    if (Array.isArray(payload.diaryEntries)) {
      saveAllDiaryEntries(payload.diaryEntries);
      diaryCount = payload.diaryEntries.length;
    }

    let eventCount = 0;
    if (Array.isArray(payload.events)) {
      saveEvents(payload.events);
      eventCount = payload.events.length;
    }

    return {
      success: true,
      diaryCount,
      eventCount,
    };
  } catch (err: any) {
    return { success: false, diaryCount: 0, eventCount: 0, error: err.message || 'Restore failed' };
  }
}

/**
 * Downloads the full vault JSON directly onto the device (ready to drop into Google Drive)
 */
export function downloadVaultBackupForGoogleDrive(ownerEmail = 'rounaksingh05555@gmail.com'): void {
  const payload = generateVaultBackupPayload(ownerEmail);
  const jsonStr = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `nao-google-drive-backup-${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
