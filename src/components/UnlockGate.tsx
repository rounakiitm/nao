import React, { useState } from 'react';
import { CalendarHeart, Lock, KeyRound, Mail, User, ShieldCheck, ArrowRight } from 'lucide-react';
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
        
        {/* Banner */}
        <div className="bg-gradient-to-tr from-brand-700 to-rose-600 p-8 text-white text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center mx-auto shadow-inner text-white">
            <CalendarHeart className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Important Dates</h1>
            <p className="text-xs text-brand-100 mt-1">Private & Sacred Personal Reminder Vault</p>
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
              Please enter your details and the family passcode to unlock this application.
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
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
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
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
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
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-500 outline-none font-mono tracking-wider"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                (Default owner passcode is <code className="bg-slate-100 px-1 py-0.5 rounded">FAMILY2026</code>)
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-500/20 transition-all flex items-center justify-center gap-2 mt-4"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Unlock & Open Vault</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Owner Unlock button */}
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={handleQuickOwnerUnlock}
              className="text-xs text-brand-600 hover:text-brand-800 font-medium hover:underline"
            >
              👑 First time on this laptop? Enter as Owner
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

