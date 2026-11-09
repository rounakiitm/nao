import React, { useState } from 'react';
import { 
  CalendarHeart, 
  Users, 
  Settings, 
  Plus, 
  Download, 
  Bell, 
  Sparkles, 
  User, 
  ChevronDown, 
  Check, 
  ShieldAlert,
  LogOut 
} from 'lucide-react';
import { InAppNotification, CurrentUser } from '../types';

interface HeaderProps {
  activeTab: 'dashboard' | 'calendar' | 'all';
  setActiveTab: (tab: 'dashboard' | 'calendar' | 'all') => void;
  onOpenAddModal: () => void;
  onOpenAccessModal: () => void;
  onOpenSettingsModal: () => void;
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
  notifications,
  canInstall,
  onInstallApp,
  currentUser,
  onSwitchUser,
}) => {
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-rose-500 flex items-center justify-center shadow-md shadow-brand-500/20 text-white">
              <CalendarHeart className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-slate-900 leading-tight">Important Dates</h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-brand-50 text-brand-700 rounded border border-brand-200">
                  {currentUser.role === 'owner' ? '👑 Owner' : '👤 Member'}
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Dedicated personal memory & reminder vault</p>
            </div>
          </div>

          {/* Navigation Tabs (Desktop & Tablet) */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'calendar'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Calendar View
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'all'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Dates
            </button>
          </nav>

          {/* Actions & User State */}
          <div className="flex items-center space-x-2">
            {canInstall && (
              <button
                onClick={onInstallApp}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-lg border border-brand-200 transition-colors"
                title="Install app on your device"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install App</span>
              </button>
            )}

            {/* Notifications Menu */}
            <div className="relative">
              <button
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                title="Reminders & Notifications"
              >
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
                )}
              </button>

              {showNotifMenu && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-brand-600" />
                      <h4 className="text-sm font-bold text-slate-800">Due Reminders</h4>
                    </div>
                    <span className="text-xs text-slate-500">{notifications.length} upcoming</span>
                  </div>

                  <div className="mt-3 max-h-72 overflow-y-auto space-y-2">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-6">No reminders due right now.</p>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`p-2.5 rounded-xl border text-xs ${
                            notif.days_remaining === 0
                              ? 'bg-rose-50 border-rose-200 text-rose-900 font-medium'
                              : notif.days_remaining <= 3
                              ? 'bg-amber-50 border-amber-200 text-amber-900'
                              : 'bg-slate-50 border-slate-200 text-slate-800'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-semibold">{notif.title}</span>
                            <span className="text-[10px] text-slate-500">{notif.date_string}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Access Control Button (Visible to Owner) */}
            {currentUser.role === 'owner' && (
              <button
                onClick={onOpenAccessModal}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                title="Manage Access & Invitations"
              >
                <Users className="w-5 h-5" />
              </button>
            )}

            {/* Settings Button */}
            <button
              onClick={onOpenSettingsModal}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              title="Settings & Backup"
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* User Profile / Account Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-1.5 p-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-[11px]">
                  {currentUser.email[0].toUpperCase()}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50 text-xs space-y-2">
                  <div className="p-2 bg-slate-50 rounded-xl">
                    <span className="block text-[11px] text-slate-400">Current Account</span>
                    <span className="font-bold text-slate-800 truncate block">{currentUser.email}</span>
                    <span className="text-[10px] font-semibold text-brand-600">
                      {currentUser.role === 'owner' ? '👑 Owner (All privileges)' : '👤 Invited Member (Shared view)'}
                    </span>
                  </div>

                  <div className="pt-1">
                    <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Switch Role (Blueprint Demo):
                    </span>
                    <div className="space-y-1">
                      <button
                        onClick={() => { setShowUserMenu(false); onSwitchUser('owner@example.com'); }}
                        className="w-full text-left p-2 rounded-lg hover:bg-slate-100 flex items-center justify-between text-slate-700 font-medium"
                      >
                        <span>👑 Owner (owner@example.com)</span>
                        {currentUser.role === 'owner' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                      </button>
                      <button
                        onClick={() => { setShowUserMenu(false); onSwitchUser('priya.family@gmail.com'); }}
                        className="w-full text-left p-2 rounded-lg hover:bg-slate-100 flex items-center justify-between text-slate-700 font-medium"
                      >
                        <span>👤 Invited Member (priya.family@...)</span>
                        {currentUser.role === 'member' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                      </button>
                      <button
                        onClick={() => { setShowUserMenu(false); onSwitchUser('uninvited.person@gmail.com'); }}
                        className="w-full text-left p-2 rounded-lg hover:bg-rose-50 flex items-center justify-between text-rose-600 font-medium"
                      >
                        <span className="flex items-center gap-1.5">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          Test Uninvited Access
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Add Date Button (Only Owner or authorized members) */}
            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 active:bg-brand-800 rounded-xl shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Date</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sub-nav */}
      <div className="md:hidden flex border-t border-slate-200 bg-slate-50 px-2 py-1.5 justify-around">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg ${
            activeTab === 'dashboard' ? 'bg-white shadow text-slate-900' : 'text-slate-500'
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab('calendar')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg ${
            activeTab === 'calendar' ? 'bg-white shadow text-slate-900' : 'text-slate-500'
          }`}
        >
          Calendar
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg ${
            activeTab === 'all' ? 'bg-white shadow text-slate-900' : 'text-slate-500'
          }`}
        >
          All Dates
        </button>
      </div>
    </header>
  );
};
