import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Users, 
  Shield, 
  Palette, 
  HardDrive, 
  Bell, 
  QrCode, 
  Info, 
  Lock, 
  Check, 
  Download, 
  Upload, 
  Smartphone, 
  Fingerprint, 
  KeyRound, 
  Eye, 
  EyeOff, 
  Sparkles, 
  ChevronRight, 
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Plus,
  RefreshCw,
  Copy,
  Layers,
  Cloud
} from 'lucide-react';
import { CurrentUser, Member, ImportantEvent, DiaryEntry, VaultAuthState, LinkedDevice } from '../types';
import { 
  getUserProfile, 
  saveUserProfile, 
  UserProfile, 
  AVATAR_OPTIONS 
} from '../lib/profileManager';
import { 
  AVAILABLE_THEMES, 
  getSavedTheme, 
  applyTheme, 
  ThemeId 
} from '../lib/themeManager';
import { 
  getMasterPasscode, 
  setMasterPasscode, 
  getDevicePin, 
  setDevicePin, 
  isBiometricsConfigured, 
  setBiometricsConfigured 
} from '../lib/storage';
import { 
  isBiometricsSupported, 
  registerBiometrics, 
  removeBiometricCredential 
} from '../lib/biometrics';
import { 
  downloadVaultBackupForGoogleDrive, 
  restoreVaultBackupPayload 
} from '../lib/googleDriveSync';
import { getLinkedDevices } from '../lib/deviceManager';
import { syncEngine } from '../lib/syncEngine';

interface ControlCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: CurrentUser;
  onSwitchUser: (email: string) => void;
  onLockVault: () => void;
  members: Member[];
  onInviteMember: (email: string, name: string, role: 'owner' | 'member') => void;
  onRevokeMember: (id: string) => void;
  eventsCount: number;
  diaryEntriesCount: number;
  onDataRestored: () => void;
  onOpenLinkedDevicesModal: () => void;
  initialTab?: TabId;
}

export type TabId = 
  | 'profile' 
  | 'accounts' 
  | 'security' 
  | 'themes' 
  | 'storage' 
  | 'notifications' 
  | 'devices' 
  | 'about';

export const ControlCenterModal: React.FC<ControlCenterModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSwitchUser,
  onLockVault,
  members,
  onInviteMember,
  onRevokeMember,
  eventsCount,
  diaryEntriesCount,
  onDataRestored,
  onOpenLinkedDevicesModal,
  initialTab = 'profile',
}) => {
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);
  const [profile, setProfile] = useState<UserProfile>(() => getUserProfile());
  const [currentTheme, setCurrentTheme] = useState<ThemeId>(() => getSavedTheme());
  const [profileSaved, setProfileSaved] = useState(false);

  // Security state
  const [masterPasscodeVal, setMasterPasscodeVal] = useState(() => getMasterPasscode());
  const [showMasterPasscode, setShowMasterPasscode] = useState(false);
  const [masterSaved, setMasterSaved] = useState(false);

  const [devicePinVal, setDevicePinVal] = useState(() => getDevicePin() || '');
  const [showDevicePin, setShowDevicePin] = useState(false);
  const [pinSaved, setPinSaved] = useState(false);

  const [biometricsSupported, setBiometricsSupported] = useState(false);
  const [biometricsActive, setBiometricsActive] = useState(() => isBiometricsConfigured());
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [biometricError, setBiometricError] = useState<string | null>(null);

  // Members state
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Notifications state
  const [notificationStatus, setNotificationStatus] = useState<string>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'unsupported';
  });

  // Storage / Backup status
  const [storageStatusMsg, setStorageStatusMsg] = useState<string | null>(null);

  // Linked devices
  const [linkedDevices, setLinkedDevices] = useState<LinkedDevice[]>(() => getLinkedDevices());

  useEffect(() => {
    if (isOpen) {
      setProfile(getUserProfile());
      setCurrentTheme(getSavedTheme());
      isBiometricsSupported().then(setBiometricsSupported);
      setBiometricsActive(isBiometricsConfigured());
      setMasterPasscodeVal(getMasterPasscode());
      setDevicePinVal(getDevicePin() || '');
      setLinkedDevices(getLinkedDevices());
      if (initialTab) setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  // Profile save handler
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    saveUserProfile(profile);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  };

  // Master Passcode save handler
  const handleSaveMasterPasscode = (e: React.FormEvent) => {
    e.preventDefault();
    if (masterPasscodeVal.trim()) {
      setMasterPasscode(masterPasscodeVal.trim());
      setMasterSaved(true);
      setTimeout(() => setMasterSaved(false), 2500);
    }
  };

  // Device PIN save handler
  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    setDevicePin(devicePinVal.trim() ? devicePinVal.trim() : null);
    setPinSaved(true);
    setTimeout(() => setPinSaved(false), 2500);
  };

  // Biometrics toggle handler
  const handleToggleBiometrics = async () => {
    setBiometricError(null);
    setBiometricLoading(true);

    try {
      if (biometricsActive) {
        removeBiometricCredential();
        setBiometricsActive(false);
      } else {
        const res = await registerBiometrics(profile.name || 'Owner', profile.email || 'rounaksingh05555@gmail.com');
        if (res.success) {
          setBiometricsConfigured(true);
          setBiometricsActive(true);
        } else {
          setBiometricError(res.error || 'Biometric authentication was cancelled.');
        }
      }
    } catch (err: any) {
      setBiometricError(err.message || 'Failed to toggle biometrics.');
    } finally {
      setBiometricLoading(false);
    }
  };

  // Theme switch handler
  const handleSelectTheme = (tId: ThemeId) => {
    setCurrentTheme(tId);
    applyTheme(tId);
  };

  // Google Drive backup
  const handleGoogleDriveBackup = () => {
    downloadVaultBackupForGoogleDrive(profile.email || 'rounaksingh05555@gmail.com');
    setStorageStatusMsg('☁️ Complete Vault backup downloaded! Upload it to your Google Drive to keep it safe forever.');
    setTimeout(() => setStorageStatusMsg(null), 5000);
  };

  // Google Drive restore
  const handleGoogleDriveRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const payload = JSON.parse(event.target?.result as string);
        const res = restoreVaultBackupPayload(payload);
        if (res.success) {
          setStorageStatusMsg(`🎉 Restored ${res.diaryCount} diary days and ${res.eventCount} milestones from Google Drive backup!`);
          onDataRestored();
          setTimeout(() => setStorageStatusMsg(null), 5000);
        } else {
          setStorageStatusMsg(`Restore error: ${res.error || 'Invalid file structure'}`);
        }
      } catch (err: any) {
        setStorageStatusMsg(`Could not read backup file: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  // Add Member
  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberEmail.trim()) return;
    onInviteMember(newMemberEmail.trim(), newMemberName.trim() || newMemberEmail.split('@')[0], 'member');
    setNewMemberEmail('');
    setNewMemberName('');
  };

  // Copy invite link
  const handleCopyInviteLink = () => {
    const code = getMasterPasscode();
    const url = `${window.location.origin}${window.location.pathname}?invite=${encodeURIComponent(code)}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Push notifications
  const handleRequestPush = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support notifications.');
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      setNotificationStatus(perm);
      if (perm === 'granted') {
        new Notification('nao Reminders Active! 🎉', {
          body: 'You will receive reminders for your milestones and diary alerts.',
          icon: './favicon.png'
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const navItems: { id: TabId; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'profile', label: 'Profile & Identity', icon: <User className="w-4 h-4" /> },
    { id: 'accounts', label: 'Family & Permissions', icon: <Users className="w-4 h-4" />, badge: `${members.length + 1}` },
    { id: 'security', label: 'Security & Biometrics', icon: <Shield className="w-4 h-4" /> },
    { id: 'themes', label: 'Themes & Appearance', icon: <Palette className="w-4 h-4" /> },
    { id: 'storage', label: 'Media & Google Drive', icon: <HardDrive className="w-4 h-4" /> },
    { id: 'devices', label: 'Linked Devices (QR)', icon: <QrCode className="w-4 h-4" />, badge: `${linkedDevices.length}` },
    { id: 'notifications', label: 'Reminders & Alerts', icon: <Bell className="w-4 h-4" /> },
    { id: 'about', label: 'About & App Guide', icon: <Info className="w-4 h-4" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full h-[92vh] max-h-[850px] shadow-2xl border border-slate-200 overflow-hidden flex flex-col md:flex-row">
        
        {/* Left Navigation Sidebar (Desktop) / Top bar (Mobile) */}
        <div className="w-full md:w-64 bg-slate-50 border-r border-slate-200 flex flex-col flex-shrink-0">
          
          {/* User Profile Mini Header */}
          <div className="p-4 border-b border-slate-200 bg-gradient-to-br from-purple-950 to-indigo-950 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-xl shadow-inner">
                  {profile.avatar}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-white truncate">{profile.name}</h3>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    👑 Owner
                  </span>
                </div>
              </div>

              {/* Close Button on Mobile */}
              <button
                onClick={onClose}
                className="md:hidden p-1.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-[11px] text-purple-200/80 truncate mt-2 font-mono">
              {profile.email}
            </p>
          </div>

          {/* Navigation Links */}
          <div className="p-2 flex-1 overflow-y-auto space-y-1 flex md:flex-col overflow-x-auto md:overflow-x-visible">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap md:whitespace-normal ${
                    isActive
                      ? 'bg-purple-900 text-white shadow-sm shadow-purple-900/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={isActive ? 'text-amber-300' : 'text-slate-500'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Lock Button at bottom */}
          <div className="p-3 border-t border-slate-200 hidden md:block">
            <button
              onClick={() => { onClose(); onLockVault(); }}
              className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Lock Vault Now</span>
            </button>
          </div>
        </div>

        {/* Right Main Content Panel */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          
          {/* Panel Header */}
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white/80 backdrop-blur-md">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {navItems.find((n) => n.id === activeTab)?.label}
              </h2>
              <p className="text-xs text-slate-500">
                Customization, permissions, and security controls for your nao vault
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => { onClose(); onLockVault(); }}
                className="md:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-xl"
                title="Lock Vault"
              >
                <Lock className="w-4 h-4 text-purple-700" />
              </button>
              <button
                onClick={onClose}
                className="hidden md:flex p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Panel Scrollable Body */}
          <div className="p-6 overflow-y-auto flex-1 space-y-6">

            {/* TAB 1: PROFILE & IDENTITY */}
            {activeTab === 'profile' && (
              <form onSubmit={handleSaveProfile} className="space-y-6 max-w-xl">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Owner Avatar</h4>
                  <div className="flex flex-wrap items-center gap-2.5">
                    {AVATAR_OPTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setProfile((p) => ({ ...p, avatar: emoji }))}
                        className={`w-12 h-12 rounded-2xl text-2xl flex items-center justify-center transition-all ${
                          profile.avatar === emoji
                            ? 'bg-purple-100 border-2 border-purple-600 scale-105 shadow-sm'
                            : 'bg-slate-50 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1">Your Full Name</label>
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-600 outline-none"
                      placeholder="e.g. Rounak"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1">Owner Email (Google Account)</label>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-600 outline-none font-mono"
                      placeholder="rounaksingh05555@gmail.com"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      This Google email is authorized as the Master Vault Owner.
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1">Bio / Vault Keeper Note</label>
                    <textarea
                      value={profile.bio}
                      onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
                      rows={3}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-600 outline-none"
                      placeholder="A personal note or life philosophy..."
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-purple-900 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-950/20 transition-all"
                  >
                    Save Profile Changes
                  </button>
                  {profileSaved && (
                    <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                      <Check className="w-4 h-4" /> Profile Updated!
                    </span>
                  )}
                </div>
              </form>
            )}

            {/* TAB 2: ACCOUNTS & PERMISSIONS */}
            {activeTab === 'accounts' && (
              <div className="space-y-6 max-w-xl">
                <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-purple-950 block">Quick Family Invite Link</span>
                    <span className="text-[11px] text-purple-700">Share this link with authorized family members</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyInviteLink}
                    className="px-3.5 py-2 bg-purple-900 hover:bg-purple-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-amber-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
                  </button>
                </div>

                {/* Add New Member Form */}
                <form onSubmit={handleAddMember} className="p-4 border border-slate-200 rounded-2xl space-y-3 bg-slate-50/50">
                  <h4 className="text-xs font-bold text-slate-900">Authorize New Member / Family</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Name (e.g. Priya)"
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                    />
                    <input
                      type="email"
                      placeholder="Email address"
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl"
                  >
                    + Authorize Member
                  </button>
                </form>

                {/* Member List */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Authorized Accounts</h4>
                  
                  {/* Owner Card */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-950 text-amber-300 font-bold flex items-center justify-center text-xs">
                        👑
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">{profile.name} (You)</span>
                        <span className="text-[11px] text-slate-500 font-mono">{profile.email}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-900 rounded-md">
                      👑 Owner
                    </span>
                  </div>

                  {/* Members */}
                  {members.map((m) => (
                    <div key={m.id} className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs">
                          {(m.name || 'Member')[0].toUpperCase()}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-900 block">{m.name}</span>
                          <span className="text-[11px] text-slate-500 font-mono">{m.email}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                          👤 Member
                        </span>
                        <button
                          onClick={() => onRevokeMember(m.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Revoke access"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: SECURITY & BIOMETRICS */}
            {activeTab === 'security' && (
              <div className="space-y-6 max-w-xl">
                
                {/* 1. Android Biometrics */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                        <Fingerprint className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">Android Fingerprint & Face Unlock</h4>
                        <p className="text-[11px] text-slate-500">Fast biometric unlock on your OnePlus 13R or laptop</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleToggleBiometrics}
                      disabled={biometricLoading || !biometricsSupported}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        biometricsActive
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-purple-900 hover:bg-purple-800 text-white'
                      }`}
                    >
                      {biometricLoading ? 'Testing...' : biometricsActive ? 'Active ✓' : 'Enable'}
                    </button>
                  </div>
                  {biometricError && (
                    <p className="text-xs text-rose-600 bg-rose-50 p-2 rounded-xl border border-rose-200">
                      {biometricError}
                    </p>
                  )}
                </div>

                {/* 2. Device 4-Digit PIN */}
                <form onSubmit={handleSavePin} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Quick 4-Digit Device PIN</h4>
                      <p className="text-[11px] text-slate-500">Quick unlock code for this specific phone/laptop</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <div className="relative flex-1">
                      <input
                        type={showDevicePin ? 'text' : 'password'}
                        value={devicePinVal}
                        onChange={(e) => setDevicePinVal(e.target.value)}
                        placeholder="e.g. 1234 (leave blank to disable)"
                        maxLength={8}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowDevicePin(!showDevicePin)}
                        className="absolute right-3 top-2.5 text-slate-400"
                      >
                        {showDevicePin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl"
                    >
                      Save PIN
                    </button>
                  </div>
                  {pinSaved && (
                    <span className="text-xs text-emerald-600 font-semibold block">Device PIN saved!</span>
                  )}
                </form>

                {/* 3. Owner Master Passcode */}
                <form onSubmit={handleSaveMasterPasscode} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Owner Master Vault Passcode</h4>
                      <p className="text-[11px] text-slate-500">Your master secret key that unlocks the vault anywhere</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <div className="relative flex-1">
                      <input
                        type={showMasterPasscode ? 'text' : 'password'}
                        value={masterPasscodeVal}
                        onChange={(e) => setMasterPasscodeVal(e.target.value)}
                        placeholder="Owner master password"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowMasterPasscode(!showMasterPasscode)}
                        className="absolute right-3 top-2.5 text-slate-400"
                      >
                        {showMasterPasscode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl"
                    >
                      Save Passcode
                    </button>
                  </div>
                  {masterSaved && (
                    <span className="text-xs text-emerald-600 font-semibold block">Master passcode updated!</span>
                  )}
                </form>

              </div>
            )}

            {/* TAB 4: THEMES & APPEARANCE */}
            {activeTab === 'themes' && (
              <div className="space-y-5 max-w-xl">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Choose Your Sacred Aesthetic</h4>
                  <p className="text-xs text-slate-500">Live preview & tap to activate any luxury theme</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {AVAILABLE_THEMES.map((th) => {
                    const isSelected = currentTheme === th.id;
                    return (
                      <div
                        key={th.id}
                        onClick={() => handleSelectTheme(th.id)}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-purple-600 bg-purple-50/50 shadow-md scale-[1.02]'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xl">{th.emoji}</span>
                          {isSelected && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-900 text-white">
                              Active
                            </span>
                          )}
                        </div>
                        <h5 className="font-bold text-xs text-slate-900">{th.name}</h5>
                        <p className="text-[11px] text-slate-500 mt-0.5">{th.tagline}</p>
                        
                        {/* Swatches */}
                        <div className="flex items-center gap-1.5 mt-3">
                          <span className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: th.primaryColor }} />
                          <span className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: th.accentColor }} />
                          <span className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: th.headerBg }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 5: MEDIA & STORAGE */}
            {activeTab === 'storage' && (
              <div className="space-y-6 max-w-xl">
                
                {/* Stats Breakdown */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                    <span className="block text-xl font-black text-purple-950">{diaryEntriesCount}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Diary Days</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                    <span className="block text-xl font-black text-purple-950">{eventsCount}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Milestones</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                    <span className="block text-xl font-black text-emerald-600">Active</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">IndexedDB</span>
                  </div>
                </div>

                {/* Google Drive Vault Backup */}
                <div className="p-5 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                        <Cloud className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-blue-950">Google Drive Vault Backup</h4>
                        <span className="text-[11px] text-blue-800 font-mono">{profile.email}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-blue-900/80 leading-relaxed">
                    Back up your complete vault (all 250+ diary reflections, photos, and milestone dates) to your personal Google Drive for 100% permanent security.
                  </p>

                  <div className="flex flex-wrap gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={handleGoogleDriveBackup}
                      className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Google Drive Backup</span>
                    </button>

                    <label className="px-4 py-2.5 bg-white hover:bg-slate-50 text-blue-900 border border-blue-200 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-all">
                      <Upload className="w-3.5 h-3.5 text-blue-600" />
                      <span>Restore from Google Drive</span>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleGoogleDriveRestore}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {storageStatusMsg && (
                    <p className="text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 font-medium">
                      {storageStatusMsg}
                    </p>
                  )}
                </div>

              </div>
            )}

            {/* TAB 6: LINKED DEVICES (QR SYNC) */}
            {activeTab === 'devices' && (
              <div className="space-y-6 max-w-xl">
                <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-purple-900 text-amber-300 flex items-center justify-center">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-purple-950">WhatsApp-Style QR Device Linking</h4>
                      <p className="text-[11px] text-purple-700">Link your laptop, tablet, or secondary phone instantly</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => { onClose(); onOpenLinkedDevicesModal(); }}
                    className="px-3.5 py-2 bg-purple-900 hover:bg-purple-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                  >
                    Open QR Scanner
                  </button>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Currently Linked Devices</h4>
                  {linkedDevices.length === 0 ? (
                    <p className="text-xs text-slate-500 py-4 text-center bg-slate-50 rounded-2xl border border-slate-200">
                      No other devices paired yet. Click above to link your laptop or tablet with a quick QR scan!
                    </p>
                  ) : (
                    linkedDevices.map((d) => (
                      <div key={d.id} className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <Smartphone className="w-4 h-4 text-slate-600" />
                          <div>
                            <span className="text-xs font-bold text-slate-900 block">{d.name}</span>
                            <span className="text-[10px] text-slate-400">Last active: {d.lastSeenAt || d.pairedAt}</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Active & Synced
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 7: NOTIFICATIONS */}
            {activeTab === 'notifications' && (
              <div className="space-y-4 max-w-xl">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Milestone Reminders</h4>
                      <p className="text-[11px] text-slate-500">
                        Status: <strong className="text-purple-700 capitalize">{notificationStatus}</strong>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleRequestPush}
                      className="px-4 py-2 bg-purple-900 hover:bg-purple-800 text-white text-xs font-bold rounded-xl"
                    >
                      {notificationStatus === 'granted' ? 'Send Test Alert' : 'Enable Reminders'}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    nao delivers morning reminders for birthdays, anniversaries, and personal milestones so you never miss a meaningful date.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 8: ABOUT & GUIDE */}
            {activeTab === 'about' && (
              <div className="space-y-5 max-w-xl">
                <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm">nao • Sacred Milestone Vault</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-amber-400 text-slate-950 font-bold rounded">
                      v1.2.0
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Dedicated, private personal vault for birthdays, anniversaries, and daily diary reflections.
                  </p>
                </div>

                {/* Important Help Cards for User's exact issues */}
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
                  <h4 className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>Why did my Laptop show "localhost refused to connect"?</span>
                  </h4>
                  <p className="text-xs text-amber-900/90 leading-relaxed">
                    If you installed the app while testing on <code>localhost:5173</code>, that was running through a temporary terminal dev server.
                    <br /><br />
                    The real, permanent version is hosted at:
                    <br />
                    <strong className="text-purple-950 font-mono text-xs block mt-1">https://rounakiitm.github.io/nao/</strong>
                    Open this URL on your laptop and click <strong>"Install nao"</strong> in the browser bar. The GitHub Pages version is cached by our Service Worker and runs <strong>100% offline</strong> with no server needed!
                  </p>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl space-y-2">
                  <h4 className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-blue-600" />
                    <span>How to get the clean App Icon without the Brave Badge on Phone</span>
                  </h4>
                  <p className="text-xs text-blue-900/90 leading-relaxed">
                    Android places a browser badge (like the Brave lion) when a page is added as a simple <em>Home Screen shortcut</em> rather than a system <em>WebAPK</em>.
                    <br /><br />
                    <strong>How to install the native app:</strong>
                    <br />
                    1. Open <strong>https://rounakiitm.github.io/nao/</strong> in <strong>Google Chrome</strong> (or Brave with WebAPK enabled).
                    <br />
                    2. Tap the in-app <strong>"Install nao"</strong> button.
                    <br />
                    3. Android creates a true native APK: it appears in your <strong>App Drawer</strong>, in phone <strong>Settings → Apps</strong>, and has <strong>no browser badge</strong>!
                  </p>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
};
