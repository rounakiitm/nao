import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { CalendarView } from './components/CalendarView';
import { AllDatesView } from './components/AllDatesView';
import { EventModal } from './components/EventModal';
import { ManageAccessModal } from './components/ManageAccessModal';
import { SettingsModal } from './components/SettingsModal';
import { InstallPrompt } from './components/InstallPrompt';
import { UpdateBanner } from './components/UpdateBanner';
import { UnlockGate } from './components/UnlockGate';
import { AIAssistantModal } from './components/AIAssistantModal';
import { 
  getStoredEvents, 
  addOrUpdateEvent, 
  deleteEvent, 
  getStoredMembers, 
  inviteMember, 
  revokeMember,
  calculateDueNotifications,
  getVaultAuth,
  saveVaultAuth,
  verifyAndUnlock,
  getMasterPasscode
} from './lib/storage';
import { ImportantEvent, Member, InAppNotification, VaultAuthState } from './types';

export const App: React.FC = () => {
  const [authState, setAuthState] = useState<VaultAuthState | null>(() => getVaultAuth());
  const [events, setEvents] = useState<ImportantEvent[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar' | 'all'>('dashboard');
  
  // Modals
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ImportantEvent | null>(null);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // AI Assistant Modal
  const [aiModalEvent, setAiModalEvent] = useState<ImportantEvent | null>(null);

  // Notifications
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);

  // PWA install prompt
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  // PWA Update notification
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [showUpdateBanner, setShowUpdateBanner] = useState(false);

  // URL Invite params
  const [urlInvitePasscode, setUrlInvitePasscode] = useState<string>('');
  const [urlInviteEmail, setUrlInviteEmail] = useState<string>('');

  // Check URL parameters for 1-click invitation
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const inviteParam = params.get('invite');
    const emailParam = params.get('email');

    if (inviteParam) {
      setUrlInvitePasscode(inviteParam);
      if (emailParam) setUrlInviteEmail(emailParam);

      // Auto verify if passcode matches
      const masterCode = getMasterPasscode();
      if (inviteParam.trim() === masterCode) {
        const targetEmail = emailParam ? emailParam.trim() : 'family.member@gmail.com';
        const res = verifyAndUnlock(targetEmail, inviteParam, emailParam ? emailParam.split('@')[0] : 'Family Member');
        if (res.success && res.auth) {
          setAuthState(res.auth);
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    }
  }, []);

  // Load initial data
  const refreshData = () => {
    const loadedEvents = getStoredEvents();
    setEvents(loadedEvents);
    setMembers(getStoredMembers());
    setNotifications(calculateDueNotifications(loadedEvents));
  };

  useEffect(() => {
    refreshData();

    // Register service worker and listen for updates
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            if (reg.waiting) {
              setWaitingWorker(reg.waiting);
              setShowUpdateBanner(true);
            }

            reg.addEventListener('updatefound', () => {
              const newWorker = reg.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    setWaitingWorker(newWorker);
                    setShowUpdateBanner(true);
                  }
                });
              }
            });
          })
          .catch((err) => {
            console.log('ServiceWorker registration error:', err);
          });
      });

      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }

    // PWA install listener
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleApplyUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    } else {
      window.location.reload();
    }
    setShowUpdateBanner(false);
  };

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    }
  };

  const handleSaveEvent = (event: ImportantEvent) => {
    const updated = addOrUpdateEvent(event);
    setEvents(updated);
    setNotifications(calculateDueNotifications(updated));
  };

  const handleDeleteEvent = (id: string) => {
    if (window.confirm('Are you sure you want to delete this date?')) {
      const updated = deleteEvent(id);
      setEvents(updated);
      setNotifications(calculateDueNotifications(updated));
    }
  };

  const handleInvite = (email: string, name?: string) => {
    const updated = inviteMember(email, name);
    setMembers(updated);
  };

  const handleRevoke = (id: string) => {
    const updated = revokeMember(id);
    setMembers(updated);
  };

  const handleSwitchUser = (email: string) => {
    const masterCode = getMasterPasscode();
    const res = verifyAndUnlock(email, masterCode);
    if (res.success && res.auth) {
      setAuthState(res.auth);
    }
  };

  const handleSignOut = () => {
    saveVaultAuth(null);
    setAuthState(null);
  };

  // If app is locked on this device, show UnlockGate
  if (!authState || !authState.isUnlocked) {
    return (
      <UnlockGate
        onUnlockSuccess={(auth) => setAuthState(auth)}
        prefillEmail={urlInviteEmail}
        prefillPasscode={urlInvitePasscode}
      />
    );
  }

  // Filter events: Invited members see ONLY "shared" events. Owner sees both "shared" and "private".
  const visibleEvents = authState.role === 'owner' 
    ? events 
    : events.filter(e => e.visibility === 'shared');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddModal={() => { setEditingEvent(null); setIsEventModalOpen(true); }}
        onOpenAccessModal={() => setIsAccessModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        notifications={notifications}
        canInstall={Boolean(deferredPrompt)}
        onInstallApp={handleInstallApp}
        currentUser={{
          email: authState.userEmail,
          role: authState.role,
          display_name: authState.userName,
        }}
        onSwitchUser={handleSwitchUser}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'dashboard' && (
          <Dashboard
            events={visibleEvents}
            onEdit={(ev) => { setEditingEvent(ev); setIsEventModalOpen(true); }}
            onDelete={handleDeleteEvent}
            onOpenAddModal={() => { setEditingEvent(null); setIsEventModalOpen(true); }}
            onSwitchToCalendar={() => setActiveTab('calendar')}
            onOpenAI={(ev) => setAiModalEvent(ev)}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarView
            events={visibleEvents}
            onEdit={(ev) => { setEditingEvent(ev); setIsEventModalOpen(true); }}
            onDelete={handleDeleteEvent}
            onOpenAddModal={() => { setEditingEvent(null); setIsEventModalOpen(true); }}
            onOpenAI={(ev) => setAiModalEvent(ev)}
          />
        )}

        {activeTab === 'all' && (
          <AllDatesView
            events={visibleEvents}
            onEdit={(ev) => { setEditingEvent(ev); setIsEventModalOpen(true); }}
            onDelete={handleDeleteEvent}
            onOpenAddModal={() => { setEditingEvent(null); setIsEventModalOpen(true); }}
            onOpenAI={(ev) => setAiModalEvent(ev)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-center text-xs text-slate-400">
        <div className="flex items-center justify-center gap-4">
          <span>Important Dates • Private Vault • Lifelong & Offline</span>
          <button
            onClick={handleSignOut}
            className="text-slate-500 hover:text-rose-600 underline font-medium"
          >
            Lock Vault / Sign Out
          </button>
        </div>
      </footer>

      {/* Modals */}
      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => {
          setIsEventModalOpen(false);
          setEditingEvent(null);
        }}
        onSave={handleSaveEvent}
        initialEvent={editingEvent}
      />

      <ManageAccessModal
        isOpen={isAccessModalOpen}
        onClose={() => setIsAccessModalOpen(false)}
        members={members}
        onInvite={handleInvite}
        onRevoke={handleRevoke}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onDataRestored={refreshData}
      />

      {/* AI Assistant Modal */}
      <AIAssistantModal
        isOpen={Boolean(aiModalEvent)}
        onClose={() => setAiModalEvent(null)}
        event={aiModalEvent}
      />

      {/* PWA Install Banner */}
      {showInstallPrompt && (
        <InstallPrompt
          onInstall={handleInstallApp}
          onDismiss={() => setShowInstallPrompt(false)}
        />
      )}

      {/* Instant Update Available Banner */}
      {showUpdateBanner && (
        <UpdateBanner
          onUpdate={handleApplyUpdate}
          onDismiss={() => setShowUpdateBanner(false)}
        />
      )}
    </div>
  );
};

export default App;
