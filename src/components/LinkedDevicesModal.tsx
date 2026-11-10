import React, { useState, useEffect } from 'react';
import { 
  X, 
  QrCode, 
  Smartphone, 
  Laptop, 
  Check, 
  Copy, 
  Share2, 
  RefreshCw, 
  ShieldCheck, 
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import QRCode from 'qrcode';
import { getStoredEvents, getMasterPasscode } from '../lib/storage';
import { CurrentUser } from '../types';

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
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [pairingUrl, setPairingUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMobileDevice(/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent));
    }
  }, []);

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
      // Base64 encoding UTF-8 safe
      const encoded = window.btoa(unescape(encodeURIComponent(jsonStr)));
      
      const baseUrl = window.location.origin + window.location.pathname;
      const fullPairUrl = `${baseUrl}?pair=${encodeURIComponent(encoded)}`;
      setPairingUrl(fullPairUrl);

      // Generate visual QR code
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
    const text = `nao Device Link for ${currentUser.display_name}:\nOpen this link on your Laptop / Desktop to sync your vault:\n\n${pairingUrl}`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
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
              <p className="text-xs text-slate-500">Multi-Device Sync • Just like WhatsApp Web</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Active Devices Overview */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Device Status</span>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-800 font-semibold">
                {isMobileDevice ? <Smartphone className="w-4 h-4 text-purple-600" /> : <Laptop className="w-4 h-4 text-purple-600" />}
                <span>This Device ({isMobileDevice ? 'Android Phone / Mobile' : 'Laptop / Desktop'})</span>
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active & Synced
              </span>
            </div>
          </div>

          {/* WhatsApp-Style QR Code Pairing */}
          <div className="space-y-3 text-center">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-800">
                {isMobileDevice ? 'Link Your Laptop / Desktop' : 'Link Your Android Phone'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Scan this QR code with your camera or send the pairing link to open nao on your other device with all your dates synced!
              </p>
            </div>

            {/* QR Code Canvas */}
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
            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                <span>Send to Laptop on WhatsApp</span>
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

          {/* How WhatsApp Multi-Device Works */}
          <div className="p-4 bg-purple-50/60 rounded-2xl border border-purple-100 text-xs space-y-2.5">
            <div className="flex items-center gap-2 font-bold text-purple-900">
              <ShieldCheck className="w-4 h-4 text-purple-700" />
              <span>How Multi-Device Linking Works</span>
            </div>
            <ul className="space-y-1.5 text-slate-600 text-[11px] list-disc pl-4">
              <li>
                <strong>One-Time Pairing</strong>: Scanning the QR code or clicking the link copies your milestones and authenticates your laptop as <strong>Owner (Rounak)</strong> immediately.
              </li>
              <li>
                <strong>24/7 Cloud Sync</strong>: Connect your free Supabase cloud in <strong>Settings (⚙️)</strong> so changes made on your phone update on your laptop in real-time, even when you are away from home.
              </li>
            </ul>
          </div>

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
