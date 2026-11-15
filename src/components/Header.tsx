import React, { useState } from 'react';
import { 
  Users, 
  Settings, 
  Plus, 
  Download, 
  Bell, 
  Sparkles, 
  ChevronDown, 
  Check, 
  ShieldAlert,
  Lock,
  QrCode,
  MoreVertical,
  BookOpen,
  Calendar as CalendarIcon,
  LayoutDashboard
} from 'lucide-react';
import { InAppNotification, CurrentUser, SyncStatus } from '../types';
import { syncEngine } from '../lib/syncEngine';
import { NaoLogo } from './NaoLogo';
import { getUserProfile } from '../lib/profileManager';

interface HeaderProps {
  activeTab: 'notes' | 'milestones' | 'calendar' | 'dashboard';
  setActiveTab: (tab: 'notes' | 'milestones' | 'calendar' | 'dashboard') => void;
  onOpenAddModal: () => void;
  onOpenAccessModal: () => void;
  onOpenSettingsModal: () => void;
  onOpenControlCenter: (tab?: string) => void;
  onOpenLinkedDevicesModal: () => void;
  onLockVault: () => void;
  notifications: InAppNotification[];
  canInstall: boolean;
  onInstallApp: () => void;
  currentUser: CurrentUser;
  onSwitchUser: (email: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenAddModal,
  onOpenAccessModal,
  onOpenSettingsModal,
  onOpenControlCenter,
  onOpenLinkedDevicesModal,
  onLockVault,
  notifications,
  canInstall,
  onInstallApp,
  currentUser,
  onSwitchUser,
}) => {
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(() => syncEngine.getStatus());
  const profile = getUserProfile();

  React.useEffect(() => {
    return syncEngine.subscribe(setSyncStatus);
  }, []);

  return (
    <header className="hidden md:block sticky top-0 z-30 bg-[#101014]/90 backdrop-blur-md border-b border-zinc-800/80 text-zinc-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('notes')}>
            <div className="w-9 h-9 rounded-xl overflow-hidden shadow-md border border-zinc-700/60 bg-[#181424] flex items-center justify-center flex-shrink-0">
              <NaoLogo className="w-full h-full" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight text-white leading-tight">nao</h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-amber-400/10 text-amber-400 rounded border border-amber-400/20">
                  {currentUser.role === 'owner' ? '👑 Owner' : '👤 Member'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-medium">Sacred notes, dates & memories</p>
            </div>
          </div>

          {/* Navigation Tabs (Desktop) */}
          <nav className="flex items-center space-x-1 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => setActiveTab('notes')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'notes'
                  ? 'bg-amber-400 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Notes & Diary</span>
            </button>
            <button
              onClick={() => setActiveTab('milestones')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'milestones'
                  ? 'bg-amber-400 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Milestones</span>
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'calendar'
                  ? 'bg-amber-400 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Calendar
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'dashboard'
                  ? 'bg-amber-400 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>
          </nav>

          {/* Actions & User State */}
          <div className="flex items-center space-x-2">
            {canInstall && (
              <button
                onClick={onInstallApp}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-400 bg-amber-400/10 hover:bg-amber-400/20 rounded-lg border border-amber-400/20 transition-colors"
                title="Install nao on your device"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install</span>
              </button>
            )}

            {/* Notifications Menu */}
            <div className="relative">
              <button
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                className="relative p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                title="Reminders & Notifications"
              >
                <Bell className="w-4 h-4" />
                {notifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                )}
              </button>

              {showNotifMenu && (
                <div className="absolute right-0 mt-2 w-80 bg-[#18181c] rounded-2xl shadow-2xl border border-zinc-700 p-4 z-50 animate-in fade-in">
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <h4 className="text-sm font-bold text-zinc-100">Due Reminders</h4>
                    </div>
                    <span className="text-xs text-zinc-400">{notifications.length} upcoming</span>
                  </div>

                  <div className="mt-3 max-h-72 overflow-y-auto space-y-2">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-zinc-400 text-center py-6">No reminders due right now.</p>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className="p-2.5 rounded-xl border border-zinc-700 bg-zinc-900/60 text-xs text-zinc-200"
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-semibold">{notif.title}</span>
                            <span className="text-[10px] text-zinc-400">{notif.date_string}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Linked Devices Status Pill */}
            <button
              onClick={onOpenLinkedDevicesModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium transition-all"
              title="Linked Devices"
            >
              <QrCode className="w-3.5 h-3.5 text-amber-400" />
              <span className={`w-1.5 h-1.5 rounded-full ${syncStatus.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span>{syncStatus.isOnline ? 'Synced' : 'Offline'}</span>
            </button>

            {/* User Profile Avatar / Quick Link */}
            <button
              onClick={() => onOpenControlCenter('profile')}
              className="flex items-center gap-1.5 p-1 rounded-xl border border-zinc-800 hover:border-amber-400/40 transition-all"
              title="Profile & Owner Settings"
            >
              <div className="w-7 h-7 rounded-lg bg-zinc-800 text-amber-300 flex items-center justify-center font-bold text-xs">
                {profile.avatar || '👑'}
              </div>
            </button>

            {/* 3-DOTS MENU BUTTON -> Vault Control Center */}
            <button
              onClick={() => onOpenControlCenter()}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl border border-zinc-800 transition-all"
              title="Vault Settings, Themes, Google Drive & Passcodes"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
