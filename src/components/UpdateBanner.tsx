import React from 'react';
import { Sparkles, RefreshCw, X } from 'lucide-react';

interface UpdateBannerProps {
  onUpdate: () => void;
  onDismiss: () => void;
}

export const UpdateBanner: React.FC<UpdateBannerProps> = ({ onUpdate, onDismiss }) => {
  return (
    <div className="fixed top-20 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-4 rounded-2xl shadow-2xl border border-indigo-500/30 animate-in slide-in-from-top-4 duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="p-2 bg-brand-500/20 text-brand-400 rounded-xl">
          <Sparkles className="w-5 h-5 animate-pulse" />
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">New Update Available</h4>
            <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500 text-white rounded font-bold">New</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            A new version with latest improvements & features is ready. Your saved dates remain completely safe.
          </p>
          <div className="pt-2 flex items-center gap-2">
            <button
              onClick={onUpdate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Update Now</span>
            </button>
            <button
              onClick={onDismiss}
              className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              Later
            </button>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="text-slate-400 hover:text-white p-1 rounded-full transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

