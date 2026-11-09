import React, { useState } from 'react';
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
  AlertTriangle 
} from 'lucide-react';
import { exportBackupJSON, importBackupJSON } from '../lib/storage';
import { getSupabaseConfig, saveSupabaseConfig, SUPABASE_SQL_SCHEMA } from '../lib/supabase';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataRestored: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onDataRestored,
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

