import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { CalendarView } from './components/CalendarView';
import { AllDatesView } from './components/AllDatesView';
import { EventModal } from './components/EventModal';
import { ManageAccessModal } from './components/ManageAccessModal';
import { SettingsModal } from './components/SettingsModal';
import { InstallPrompt } from './components/InstallPrompt';
import { 
  getStoredEvents, 
  addOrUpdateEvent, 
  deleteEvent, 
  getStoredMembers, 
  inviteMember, 
  revokeMember,
  calculateDueNotifications 
} from './lib/storage';
import { ImportantEvent, Member, InAppNotification } from './types';

export const App: React.FC = () => {
  const [events, setEvents] = useState<ImportantEvent[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar' | 'all'>('dashboard');
  
  // Modals
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ImportantEvent | null>(null);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Notifications
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);

  // PWA install prompt
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  // Load initial data
  const refreshData = () => {
    const loadedEvents = getStoredEvents();
    setEvents(loadedEvents);
    setMembers(getStoredMembers());
    setNotifications(calculateDueNotifications(loadedEvents));
  };

  useEffect(() => {
    refreshData();

    // Register service worker if supported
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('ServiceWorker registered with scope:', reg.scope);
          })
          .catch((err) => {
            console.log('ServiceWorker registration failed:', err);
          });
      });
    }

    // Listen for PWA install prompt
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

  const handleInvite = (email: string) => {
    const updated = inviteMember(email);
    setMembers(updated);
  };

  const handleRevoke = (id: string) => {
    const updated = revokeMember(id);
    setMembers(updated);
  };

  const handleOpenAdd = () => {
    setEditingEvent(null);
    setIsEventModalOpen(true);
  };

  const handleOpenEdit = (event: ImportantEvent) => {
    setEditingEvent(event);
    setIsEventModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddModal={handleOpenAdd}
        onOpenAccessModal={() => setIsAccessModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        notifications={notifications}
        canInstall={Boolean(deferredPrompt)}
        onInstallApp={handleInstallApp}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'dashboard' && (
          <Dashboard
            events={events}
            onEdit={handleOpenEdit}
            onDelete={handleDeleteEvent}
            onOpenAddModal={handleOpenAdd}
            onSwitchToCalendar={() => setActiveTab('calendar')}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarView
            events={events}
            onEdit={handleOpenEdit}
            onDelete={handleDeleteEvent}
            onOpenAddModal={handleOpenAdd}
          />
        )}

        {activeTab === 'all' && (
          <AllDatesView
            events={events}
            onEdit={handleOpenEdit}
            onDelete={handleDeleteEvent}
            onOpenAddModal={handleOpenAdd}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-center text-xs text-slate-400">
        <p>Important Dates • Private Personal Milestones Application • Free & Installable</p>
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

      {/* PWA Install Banner */}
      {showInstallPrompt && (
        <InstallPrompt
          onInstall={handleInstallApp}
          onDismiss={() => setShowInstallPrompt(false)}
        />
      )}
    </div>
  );
};

export default App;
