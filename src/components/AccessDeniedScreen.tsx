import React, { useState } from 'react';
import { ShieldAlert, Mail, ArrowRight, CalendarHeart, Lock } from 'lucide-react';
import { CurrentUser } from '../types';

interface AccessDeniedScreenProps {
  currentUser: CurrentUser;
  onSwitchUser: (email: string) => void;
}

export const AccessDeniedScreen: React.FC<AccessDeniedScreenProps> = ({
  currentUser,
  onSwitchUser,
}) => {
  const [inputEmail, setInputEmail] = useState('');

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputEmail.trim()) {
      onSwitchUser(inputEmail.trim());
      setInputEmail('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden text-center p-8 space-y-6">
        
        {/* Top Logo */}
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto text-rose-600 shadow-sm">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold">
            <Lock className="w-3.5 h-3.5" />
            <span>Invite-Only Access Enforced</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Access Restricted</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            The email <strong className="text-slate-800 font-semibold">{currentUser.email}</strong> is not on the authorized guest list for this personal dates vault.
          </p>
        </div>

        {/* Security explanation */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs text-slate-600 space-y-1">
          <p className="font-semibold text-slate-800">Why am I seeing this?</p>
          <p className="text-[11px] text-slate-500">
            Per the security blueprint, this app is private and non-public. Database row-level security (RLS) ensures only emails explicitly invited by the owner can view shared dates.
          </p>
        </div>

        {/* Sign in with invited email */}
        <form onSubmit={handleSignIn} className="space-y-3 pt-2">
          <label className="block text-xs font-semibold text-slate-700 text-left uppercase tracking-wider">
            Sign In with an Invited Email
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="email"
              required
              placeholder="e.g. priya.family@gmail.com"
              value={inputEmail}
              onChange={(e) => setInputEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Verify & Enter Vault</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Fast-Switch Buttons */}
        <div className="pt-4 border-t border-slate-100 text-xs text-slate-400">
          <p className="mb-2 font-medium">Quick switch for testing:</p>
          <div className="flex justify-center gap-2">
            <button
              onClick={() => onSwitchUser('owner@example.com')}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition-colors"
            >
              👑 Owner
            </button>
            <button
              onClick={() => onSwitchUser('priya.family@gmail.com')}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition-colors"
            >
              👤 Invited Member
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

