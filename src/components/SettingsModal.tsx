import React, { useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  Upload, 
  Bell, 
  Database, 
  Copy, 
  Check, 
  Shield, 
  Smartphone, 
  CheckCircle,
  AlertTriangle,
  Fingerprint,
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
  Lock
} from 'lucide-react';
import { 
  exportBackupJSON, 
  importBackupJSON,
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
import { getSupabaseConfig, saveSupabaseConfig, SUPABASE_SQL_SCHEMA } from '../lib/supabase';
import { CurrentUser } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataRestored: () => void;
  currentUser?: CurrentUser;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onDataRestored,
  currentUser,
}) => {
  const [copiedSql, setCopiedSql] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [notificationStatus, setNotificationStatus] = useState<string>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'unsupported';
  });

  const [supabaseUrl, setSupabaseUrl] = useState(() => getSupabaseConfig().url);
  const [supabaseKey, setSupabaseKey] = useState(() => getSupabaseConfig().anonKey);
  const [configSaved, setConfigSaved] = useState(false);

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

  useEffect(() => {
    if (isOpen) {
      isBiometricsSupported().then((supported) => setBiometricsSupported(supported));
      setBiometricsActive(isBiometricsConfigured());
      setMasterPasscodeVal(getMasterPasscode());
      setDevicePinVal(getDevicePin() || '');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleExport = () => {
    const jsonStr = exportBackupJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `important_dates_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importBackupJSON(content);
      if (res.success) {
        setImportStatus(`Successfully restored ${res.count} dates!`);
        onDataRestored();
      } else {
        setImportStatus(`Restore error: ${res.error}`);
      }
    };
    reader.readAsText(file);
  };

  const handleRequestPush = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support desktop/mobile notifications.');
      return;
    }

    try {
      const perm = await Notification.requestPermission();
      setNotificationStatus(perm);

      if (perm === 'granted') {
        // Send a test notification
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.ready;
          reg.showNotification('Notifications Activated! 🎉', {
            body: 'You will receive reminders for your birthdays and important dates.',
            icon: '/calendar-heart.svg',
            badge: '/calendar-heart.svg'
          });
        } else {
          new Notification('Notifications Activated! 🎉', {
            body: 'You will receive reminders for your birthdays and important dates.',
            icon: '/calendar-heart.svg'
          });
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleSaveSupabaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseConfig(supabaseUrl, supabaseKey);
    setConfigSaved(true);
    setTimeout(() => setConfigSaved(false), 2000);
  };

  const handleSaveMasterPasscode = (e: React.FormEvent) => {
    e.preventDefault();
    if (masterPasscodeVal.trim()) {
      setMasterPasscode(masterPasscodeVal.trim());
      setMasterSaved(true);
      setTimeout(() => setMasterSaved(false), 2500);
    }
  };

  const handleSaveDevicePin = (e: React.FormEvent) => {
    e.preventDefault();
    setDevicePin(devicePinVal.trim() || null);
    setPinSaved(true);
    setTimeout(() => setPinSaved(false), 2500);
  };

  const handleToggleBiometrics = async () => {
    setBiometricError(null);
    if (biometricsActive) {
      removeBiometricCredential();
      setBiometricsConfigured(false);
      setBiometricsActive(false);
    } else {
      setBiometricLoading(true);
      try {
        const res = await registerBiometrics(
          currentUser?.display_name || 'Rounak',
          currentUser?.email || 'rounaksingh05555@gmail.com'
        );
        if (res.success) {
          setBiometricsConfigured(true);
          setBiometricsActive(true);
        } else {
          setBiometricError(res.error || 'Failed to setup biometrics.');
        }
      } catch (err: any) {
        setBiometricError(err.message || 'Biometric enrollment error.');
      } finally {
        setBiometricLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-100 animate-in fade-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-base font-bold text-slate-900">Settings & Configuration</h2>
            <p className="text-xs text-slate-500">Backups, push reminders, and cloud sync</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Section: Security, Master Passcode & Device Biometrics */}
          <div className="space-y-4 p-4 rounded-2xl bg-purple-50/50 border border-purple-100">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-purple-700" />
                <span>Security, Passcode & Biometrics</span>
              </h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-200">
                Private Vault
              </span>
            </div>

            {/* 1. Android / Device Biometric Unlock */}
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Fingerprint className="w-5 h-5 text-purple-600" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Device Biometrics (Fingerprint / Face ID)</h4>
                    <p className="text-[11px] text-slate-500">
                      {biometricsSupported 
                        ? 'Unlock instantly using your Android fingerprint or phone screen lock.' 
                        : 'Biometric hardware not detected on this browser/device.'}
                    </p>
                  </div>
                </div>
                {biometricsSupported && (
                  <button
                    type="button"
                    onClick={handleToggleBiometrics}
                    disabled={biometricLoading}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      biometricsActive
                        ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                        : 'bg-purple-900 hover:bg-purple-800 text-white shadow-sm'
                    }`}
                  >
                    {biometricLoading
                      ? 'Prompting...'
                      : biometricsActive
                      ? 'Disable'
                      : 'Enable on this Phone'}
                  </button>
                )}
              </div>
              {biometricsActive && (
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Fingerprint / Biometric Unlock is active on this device.</span>
                </div>
              )}
              {biometricError && (
                <div className="text-[11px] text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-200">
                  {biometricError}
                </div>
              )}
            </div>

            {/* 2. Personal Device Quick PIN */}
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-slate-600" />
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Personal Device Quick PIN</h4>
                  <p className="text-[11px] text-slate-500">
                    Set a quick 4-digit PIN stored only on this device for fast unlocking.
                  </p>
                </div>
              </div>
              <form onSubmit={handleSaveDevicePin} className="flex gap-2 items-center pt-1">
                <div className="relative flex-1">
                  <input
                    type={showDevicePin ? 'text' : 'password'}
                    placeholder="e.g. 1234 (optional)"
                    value={devicePinVal}
                    onChange={(e) => setDevicePinVal(e.target.value)}
                    maxLength={8}
                    className="w-full px-3 py-1.5 pr-8 rounded-lg border border-slate-200 text-xs font-mono tracking-wider focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowDevicePin(!showDevicePin)}
                    className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600"
                  >
                    {showDevicePin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-medium transition-colors"
                >
                  Save PIN
                </button>
                {pinSaved && (
                  <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Saved!
                  </span>
                )}
              </form>
            </div>

            {/* 3. Owner Master Passcode (Owner Only) */}
            {currentUser?.role === 'owner' && (
              <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-amber-600" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Family Master Passcode (Owner Key)</h4>
                    <p className="text-[11px] text-slate-500">
                      The authorization key given to family members to unlock the vault.
                    </p>
                  </div>
                </div>
                <form onSubmit={handleSaveMasterPasscode} className="flex gap-2 items-center pt-1">
                  <div className="relative flex-1">
                    <input
                      type={showMasterPasscode ? 'text' : 'password'}
                      required
                      placeholder="e.g. FAMILY2026"
                      value={masterPasscodeVal}
                      onChange={(e) => setMasterPasscodeVal(e.target.value)}
                      className="w-full px-3 py-1.5 pr-8 rounded-lg border border-slate-200 text-xs font-mono tracking-wider focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowMasterPasscode(!showMasterPasscode)}
                      className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600"
                    >
                      {showMasterPasscode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-medium transition-colors shadow-sm"
                  >
                    Update Key
                  </button>
                  {masterSaved && (
                    <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Updated!
                    </span>
                  )}
                </form>
              </div>
            )}
          </div>

          {/* Section 1: Backup & Restore */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Download className="w-4 h-4 text-brand-600" />
              <span>Data Backup & Restore</span>
            </h3>
            <p className="text-xs text-slate-500">
              Download your complete database of dates and memories as a portable JSON file, or restore from a previous backup.
            </p>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleExport}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition-colors"
              >
                <Download className="w-4 h-4" />
                Export Backup (JSON)
              </button>

              <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold cursor-pointer transition-colors">
                <Upload className="w-4 h-4" />
                <span>Restore from JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportFile}
                  className="hidden"
                />
              </label>
            </div>

            {importStatus && (
              <p className="text-xs text-emerald-600 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 font-medium">
                {importStatus}
              </p>
            )}
          </div>

          {/* Section 2: Push Notifications */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-rose-500" />
              <span>Push Reminders & Alerts</span>
            </h3>
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div>
                <span className="text-xs font-semibold text-slate-800 block">Device Notification Status</span>
                <span className="text-[11px] text-slate-500 capitalize">
                  Current permission: <strong className="text-brand-600">{notificationStatus}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={handleRequestPush}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
              >
                {notificationStatus === 'granted' ? 'Send Test Alert' : 'Enable Notifications'}
              </button>
            </div>
          </div>

          {/* Section 3: Supabase Cloud Database & RLS */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Database className="w-4 h-4 text-emerald-600" />
                <span>Supabase Cloud Sync (Optional)</span>
              </h3>
              <button
                type="button"
                onClick={handleCopySql}
                className="text-[11px] text-brand-600 hover:text-brand-800 font-medium inline-flex items-center gap-1"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedSql ? 'SQL Copied!' : 'Copy PostgreSQL RLS Script'}
              </button>
            </div>
            
            <p className="text-xs text-slate-500">
              The app operates 100% offline out-of-the-box. To synchronize between your Android and Laptop, connect your free Supabase project:
            </p>

            <form onSubmit={handleSaveSupabaseConfig} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Supabase Project URL
                </label>
                <input
                  type="text"
                  placeholder="https://xyzcompany.supabase.co"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Supabase Anon Key
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
                >
                  Save Supabase Settings
                </button>
                {configSaved && (
                  <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Saved!
                  </span>
                )}
              </div>
            </form>
          </div>

          {/* Section 4: Installation Tips for Android & Laptop */}
          <div className="p-4 bg-brand-50/60 rounded-2xl border border-brand-100 text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-brand-900">
              <Smartphone className="w-4 h-4 text-brand-600" />
              <span>How to Install on Android & Laptop</span>
            </div>
            <ul className="list-disc pl-4 space-y-1 text-brand-950 text-[11px]">
              <li><strong>On Android (Chrome)</strong>: Open the app URL, tap the three dots (⋮) menu in Chrome, and choose <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</li>
              <li><strong>On Laptop (Chrome / Edge)</strong>: Look for the install icon ⊕ in the right corner of the address bar, or click "Install App" in the app header.</li>
            </ul>
          </div>

        </div>

        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

