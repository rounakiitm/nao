import React from 'react';
import { Download, X, Smartphone } from 'lucide-react';

interface InstallPromptProps {
  onInstall: () => void;
  onDismiss: () => void;
}

export const InstallPrompt: React.FC<InstallPromptProps> = ({ onInstall, onDismiss }) => {
  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-40 bg-slate-900 text-white p-4 rounded-3xl shadow-2xl border border-slate-700 animate-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="p-2.5 bg-brand-500 rounded-2xl text-white">
          <Smartphone className="w-5 h-5" />
        </div>
        <div className="flex-1 space-y-1">
          <h4 className="text-sm font-bold">Install as an App</h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            Install on your phone or laptop for offline access, instant notifications, and a dedicated app icon.
          </p>
          <div className="pt-2 flex items-center gap-2">
            <button
              onClick={onInstall}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white text-slate-900 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install Now</span>
            </button>
            <button
              onClick={onDismiss}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="text-slate-400 hover:text-white p-1 rounded-full"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
