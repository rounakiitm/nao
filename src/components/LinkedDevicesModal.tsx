import React, { useState, useEffect } from 'react';
import { 
  X, 
  QrCode, 
  Smartphone, 
  Laptop, 
  Tablet, 
  Monitor, 
  Check, 
  Copy, 
  Share2, 
  RefreshCw, 
  ShieldCheck, 
  LogOut, 
  Wifi, 
  WifiOff, 
  Plus, 
  Clock 
} from 'lucide-react';
import QRCode from 'qrcode';
import { getStoredEvents, getMasterPasscode } from '../lib/storage';
import { getLinkedDevices, unlinkDevice, getCurrentDevice } from '../lib/deviceManager';
import { syncEngine } from '../lib/syncEngine';
import { CurrentUser, LinkedDevice, SyncStatus } from '../types';

interface LinkedDevicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: CurrentUser;
}

export const LinkedDevicesModal: React.FC<LinkedDevicesModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [devices, setDevices] = useState<LinkedDevice[]>([]);
  const [showPairingScreen, setShowPairingScreen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [pairingUrl, setPairingUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(() => syncEngine.getStatus());
  const [manualSyncing, setManualSyncing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDevices(getLinkedDevices());
      const unsubscribe = syncEngine.subscribe((status) => {
        setSyncStatus(status);
      });
      return () => unsubscribe();
    }
  }, [isOpen]);

  // Generate pairing payload & QR Code
  useEffect(() => {
    if (!isOpen) return;

    try {
      const events = getStoredEvents();
      const masterPasscode = getMasterPasscode();

      const payload = {
        ownerEmail: currentUser.email,
        ownerName: currentUser.display_name || 'Rounak',
        masterPasscode,
        events,
        timestamp: Date.now(),
      };

      const jsonStr = JSON.stringify(payload);
      const encoded = window.btoa(unescape(encodeURIComponent(jsonStr)));
      
      const baseUrl = window.location.origin + window.location.pathname;
      const fullPairUrl = `${baseUrl}?pair=${encodeURIComponent(encoded)}`;
      setPairingUrl(fullPairUrl);

      QRCode.toDataURL(fullPairUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: '#1e1136',
          light: '#ffffff',
        },
      }).then((url) => {
        setQrDataUrl(url);
      });
    } catch (e) {
      console.error('Failed to generate pairing QR code', e);
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(pairingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsAppShare = () => {
    const text = `nao Device Link for ${currentUser.display_name}:\nOpen this link on your Laptop, Tablet, or 2nd Phone to sync your vault:\n\n${pairingUrl}`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  const handleManualSync = async () => {
    setManualSyncing(true);
    await syncEngine.triggerSync();
    setDevices(getLinkedDevices());
    setTimeout(() => setManualSyncing(false), 800);
  };

  const handleUnlink = (deviceId: string) => {
    if (window.confirm('Are you sure you want to log out this device from your vault?')) {
      const updated = unlinkDevice(deviceId);
      setDevices(updated);
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'phone':
        return <Smartphone className="w-5 h-5 text-purple-600" />;
      case 'tablet':
        return <Tablet className="w-5 h-5 text-indigo-600" />;
      case 'laptop':
        return <Laptop className="w-5 h-5 text-blue-600" />;
      case 'desktop':
      default:
        return <Monitor className="w-5 h-5 text-slate-700" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in fade-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Linked Devices</h2>
              <p className="text-xs text-slate-500">Multi-Device Sync • Always Connected</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {/* Sync & Connectivity Status Banner */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              {syncStatus.isOnline ? (
                <Wifi className="w-4 h-4 text-emerald-600" />
              ) : (
                <WifiOff className="w-4 h-4 text-amber-500" />
              )}
              <div>
                <span className="font-semibold text-slate-800 block">
                  {syncStatus.isOnline ? 'Internet Connected' : 'Offline Mode (Local Cache)'}
                </span>
                <span className="text-[11px] text-slate-500">
                  {syncStatus.lastSyncAt ? `Last refreshed: ${syncStatus.lastSyncAt}` : 'Auto-refreshes on internet connection'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleManualSync}
              disabled={manualSyncing || !syncStatus.isOnline}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold transition-all disabled:opacity-50"
              title="Refresh and sync data now"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-purple-600 ${manualSyncing ? 'animate-spin' : ''}`} />
              <span>{manualSyncing ? 'Syncing...' : 'Sync Now'}</span>
            </button>
          </div>

          {/* View Toggle: List vs QR Pairing */}
          {!showPairingScreen ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Connected Devices ({devices.length})
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Devices linked to {currentUser.email}. Stays connected until you log out.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPairingScreen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-900 hover:bg-purple-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-400" />
                  <span>Link New Device</span>
                </button>
              </div>

              {/* Devices List */}
              <div className="space-y-2">
                {devices.map((device) => (
                  <div
                    key={device.id}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                      device.isCurrentDevice
                        ? 'bg-purple-50/60 border-purple-200'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-xs">
                        {getDeviceIcon(device.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800">{device.name}</span>
                          {device.isCurrentDevice && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-800 border border-purple-200">
                              This Device
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                          <span className="flex items-center gap-1 text-emerald-600 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Connected
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            Active
                          </span>
                        </div>
                      </div>
                    </div>

                    {!device.isCurrentDevice && (
                      <button
                        type="button"
                        onClick={() => handleUnlink(device.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                        title="Log out this device"
                      >
                        <LogOut className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Multi-Device Info Box */}
              <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-100 text-xs space-y-1.5 text-slate-600">
                <div className="flex items-center gap-1.5 font-bold text-purple-900">
                  <ShieldCheck className="w-4 h-4 text-purple-700" />
                  <span>Automatic Auto-Refresh</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Your phones, tablets, and laptops share your vault. As soon as any linked device connects to the internet, it refreshes automatically to match your main vault. You remain permanently logged in on your desktop and devices until you explicitly click log out.
                </p>
              </div>
            </div>
          ) : (
            /* QR Pairing Screen */
            <div className="space-y-4 text-center">
              <div className="flex items-center justify-between pb-1">
                <button
                  type="button"
                  onClick={() => setShowPairingScreen(false)}
                  className="text-xs text-slate-500 hover:text-slate-800 font-medium hover:underline"
                >
                  ← Back to Linked Devices
                </button>
                <span className="text-xs font-bold text-purple-900">Scan to Pair</span>
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-800">
                  Link an Additional Phone, Tablet or Laptop
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Scan this QR code with your camera or send the pairing link to connect and keep it in sync always!
                </p>
              </div>

              {/* QR Code Container */}
              <div className="inline-block p-4 bg-white rounded-2xl border-2 border-purple-900/20 shadow-lg shadow-purple-950/10">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="Pairing QR Code" className="w-56 h-56 mx-auto rounded-lg" />
                ) : (
                  <div className="w-56 h-56 flex items-center justify-center text-slate-400 text-xs">
                    Generating QR Code...
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleWhatsAppShare}
                  className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Send via WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied Link!' : 'Copy Link'}</span>
                </button>
              </div>
            </div>
          )}

        </div>

        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
