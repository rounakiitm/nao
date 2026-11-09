import React, { useState } from 'react';
import { Lock, KeyRound, Mail, User, ShieldCheck, ArrowRight } from 'lucide-react';
import { verifyAndUnlock } from '../lib/storage';
import { VaultAuthState } from '../types';

interface UnlockGateProps {
  onUnlockSuccess: (auth: VaultAuthState) => void;
  prefillEmail?: string;
  prefillPasscode?: string;
}

export const UnlockGate: React.FC<UnlockGateProps> = ({
  onUnlockSuccess,
  prefillEmail = '',
  prefillPasscode = '',
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState(prefillEmail);
  const [passcode, setPasscode] = useState(prefillPasscode);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !passcode.trim()) {
      setError('Please provide your email and the invitation passcode.');
      return;
    }

    const res = verifyAndUnlock(email, passcode, name);
    if (res.success && res.auth) {
      onUnlockSuccess(res.auth);
    } else {
      setError(res.error || 'Invalid passcode or email.');
    }
  };

  const handleQuickOwnerUnlock = () => {
    setName('Owner');
    setEmail('owner@example.com');
    setPasscode('FAMILY2026');
    const res = verifyAndUnlock('owner@example.com', 'FAMILY2026', 'Owner');
    if (res.success && res.auth) {
      onUnlockSuccess(res.auth);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Banner with Authentic 3D Infinity Logo */}
        <div className="bg-[#181424] p-8 text-white text-center space-y-3 relative overflow-hidden">
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute inset-0 bg-radial from-purple-900/30 via-transparent to-transparent pointer-events-none" />

          <div className="w-20 h-20 rounded-2xl overflow-hidden mx-auto shadow-xl shadow-purple-950/60 border border-purple-800/40 relative z-10 bg-[#181424]">
            <img src="/icon-192.png" alt="nao logo" className="w-full h-full object-cover" />
          </div>

          <div className="relative z-10">
            <h1 className="text-3xl font-black tracking-tight text-white">nao</h1>
            <p className="text-xs text-amber-200/80 mt-1">Sacred Personal Milestone Vault</p>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-8 space-y-5">
          <div className="space-y-1 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>Invitation Required</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Please enter your details and the family passcode to unlock nao.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Your Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Priya"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Your Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  placeholder="e.g. priya.family@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Family Invitation Passcode *
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  placeholder="Enter passcode from owner"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-amber-500 outline-none font-mono tracking-wider"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                (Default owner passcode is <code className="bg-slate-100 px-1 py-0.5 rounded">FAMILY2026</code>)
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-950/20 transition-all flex items-center justify-center gap-2 mt-4"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Unlock & Open nao</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Owner Unlock button */}
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={handleQuickOwnerUnlock}
              className="text-xs text-purple-700 hover:text-purple-900 font-semibold hover:underline"
            >
              👑 First time on this laptop? Enter as Owner
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
