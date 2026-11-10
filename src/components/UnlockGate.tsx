import React, { useState } from 'react';
import { 
  Lock, 
  KeyRound, 
  Mail, 
  User, 
  ShieldCheck, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  Fingerprint, 
  ArrowLeft 
} from 'lucide-react';
import { 
  verifyAndUnlock, 
  getStoredAuthState, 
  unlockWithPinOrMaster, 
  unlockWithBiometricSession, 
  isBiometricsConfigured,
  getDevicePin
} from '../lib/storage';
import { authenticateWithBiometrics } from '../lib/biometrics';
import { VaultAuthState } from '../types';
import naoLogo from '../assets/logo.png';

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
  const storedAuth = getStoredAuthState();
  const [isInvitationMode, setIsInvitationMode] = useState(!storedAuth);

  // Quick Unlock States
  const [quickPasscode, setQuickPasscode] = useState('');
  const [showQuickPasscode, setShowQuickPasscode] = useState(false);
  const [quickError, setQuickError] = useState<string | null>(null);
  const [bioLoading, setBioLoading] = useState(false);

  // Full Invitation States
  const [name, setName] = useState('');
  const [email, setEmail] = useState(prefillEmail);
  const [passcode, setPasscode] = useState(prefillPasscode);
  const [showPasscode, setShowPasscode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasBiometrics = isBiometricsConfigured();
  const hasPin = Boolean(getDevicePin());

  // Handle Quick Biometric Unlock (Android Fingerprint / Face ID)
  const handleBiometricUnlock = async () => {
    setQuickError(null);
    setBioLoading(true);
    try {
      const res = await authenticateWithBiometrics();
      if (res.success) {
        const unlockRes = unlockWithBiometricSession();
        if (unlockRes.success && unlockRes.auth) {
          onUnlockSuccess(unlockRes.auth);
          return;
        }
      }
      setQuickError(res.error || 'Biometric verification unsuccessful.');
    } catch (e: any) {
      setQuickError('Biometric error. Please enter your PIN or Passcode.');
    } finally {
      setBioLoading(false);
    }
  };

  // Handle Quick PIN or Passcode Unlock
  const handleQuickUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPasscode.trim()) {
      setQuickError('Please enter your PIN or Passcode.');
      return;
    }

    const res = unlockWithPinOrMaster(quickPasscode);
    if (res.success && res.auth) {
      onUnlockSuccess(res.auth);
    } else {
      setQuickError(res.error || 'Incorrect PIN or Passcode.');
    }
  };

  // Handle Full Invitation Form
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
    setName('Rounak');
    setEmail('rounaksingh05555@gmail.com');
    setPasscode('FAMILY2026');
    const res = verifyAndUnlock('rounaksingh05555@gmail.com', 'FAMILY2026', 'Rounak');
    if (res.success && res.auth) {
      onUnlockSuccess(res.auth);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Banner with Authentic 3D Infinity Logo */}
        <div className="bg-[#181424] p-8 text-white text-center space-y-3 relative overflow-hidden">
          <div className="absolute inset-0 bg-radial from-purple-900/30 via-transparent to-transparent pointer-events-none" />

          <div className="w-20 h-20 rounded-2xl overflow-hidden mx-auto shadow-xl shadow-purple-950/60 border border-purple-800/40 relative z-10 bg-[#181424]">
            <img 
              src={naoLogo} 
              alt="nao logo" 
              className="w-full h-full object-cover" 
            />
          </div>

          <div className="relative z-10">
            <h1 className="text-3xl font-black tracking-tight text-white">nao</h1>
            <p className="text-xs text-amber-200/80 mt-1">Sacred Personal Milestone Vault</p>
          </div>
        </div>

        {/* View 1: Quick Unlock on Known Device */}
        {!isInvitationMode && storedAuth ? (
          <div className="p-8 space-y-5">
            <div className="text-center space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-900 border border-purple-200 text-xs font-semibold">
                <Lock className="w-3.5 h-3.5 text-purple-600" />
                <span>Vault Locked</span>
              </div>
              <h3 className="text-base font-bold text-slate-800 mt-2">
                Welcome back, {storedAuth.userName}
              </h3>
              <p className="text-xs text-slate-500">
                {storedAuth.role === 'owner' ? '👑 Owner' : '👤 Family Member'} • {storedAuth.userEmail}
              </p>
            </div>

            {quickError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                {quickError}
              </div>
            )}

            {/* Android / Device Biometric Quick Unlock */}
            {hasBiometrics && (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleBiometricUnlock}
                  disabled={bioLoading}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 hover:from-purple-800 hover:to-indigo-900 text-white rounded-2xl shadow-lg shadow-purple-950/30 flex items-center justify-center gap-3 font-bold text-xs transition-all border border-purple-700/50"
                >
                  <Fingerprint className="w-5 h-5 text-amber-400" />
                  <span>{bioLoading ? 'Scanning Fingerprint...' : 'Unlock with Fingerprint / Face ID'}</span>
                </button>
                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-200" />
                  <span className="flex-shrink mx-3 text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                    Or enter {hasPin ? 'PIN / Passcode' : 'Passcode'}
                  </span>
                  <div className="flex-grow border-t border-slate-200" />
                </div>
              </div>
            )}

            {/* PIN or Master Passcode form */}
            <form onSubmit={handleQuickUnlockSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {hasPin ? 'Device PIN or Master Passcode' : 'Master Passcode'}
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showQuickPasscode ? 'text' : 'password'}
                    required
                    placeholder={hasPin ? 'Enter 4-digit PIN or Passcode' : 'Enter passcode from Rounak'}
                    value={quickPasscode}
                    onChange={(e) => setQuickPasscode(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-amber-500 outline-none font-mono tracking-wider"
                  />
                  <button
                    type="button"
                    onClick={() => setShowQuickPasscode(!showQuickPasscode)}
                    className="absolute right-3 top-2.5 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                    title={showQuickPasscode ? 'Hide passcode' : 'Show passcode'}
                    aria-label={showQuickPasscode ? 'Hide passcode' : 'Show passcode'}
                  >
                    {showQuickPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-950/20 transition-all flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Unlock Vault</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setIsInvitationMode(true)}
                className="text-xs text-purple-700 hover:text-purple-900 font-semibold hover:underline"
              >
                Switch account or enter invitation link
              </button>
            </div>
          </div>
        ) : (
          /* View 2: Full Invitation Gate (New Device or Switching Accounts) */
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

            {storedAuth && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setIsInvitationMode(false)}
                  className="text-xs text-slate-600 hover:text-slate-900 font-medium inline-flex items-center gap-1 hover:underline"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Quick Unlock for {storedAuth.userName}</span>
                </button>
              </div>
            )}

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
                    placeholder="e.g. Your Name"
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
                    placeholder="example@gmail.com"
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
                    type={showPasscode ? 'text' : 'password'}
                    required
                    placeholder="Enter passcode from Rounak"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-amber-500 outline-none font-mono tracking-wider"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasscode(!showPasscode)}
                    className="absolute right-3 top-2.5 p-1 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                    title={showPasscode ? 'Hide passcode' : 'Show passcode'}
                    aria-label={showPasscode ? 'Hide passcode' : 'Show passcode'}
                  >
                    {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  (Default passcode is <code className="bg-slate-100 px-1 py-0.5 rounded">FAMILY2026</code>)
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
                👑 First time on this device? Enter as Rounak (Owner)
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};