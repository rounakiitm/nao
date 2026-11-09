import React, { useState } from 'react';
import { 
  X, 
  UserPlus, 
  ShieldCheck, 
  Mail, 
  CheckCircle2, 
  Ban, 
  KeyRound, 
  Copy, 
  Check, 
  Share2,
  Lock,
  MessageCircle
} from 'lucide-react';
import { Member } from '../types';
import { getMasterPasscode, setMasterPasscode, generateOneClickInviteLink } from '../lib/storage';

interface ManageAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  onInvite: (email: string, name?: string) => void;
  onRevoke: (id: string) => void;
}

export const ManageAccessModal: React.FC<ManageAccessModalProps> = ({
  isOpen,
  onClose,
  members,
  onInvite,
  onRevoke,
}) => {
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [passcodeInput, setPasscodeInput] = useState(() => getMasterPasscode());
  const [passcodeSaved, setPasscodeSaved] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const email = emailInput.trim().toLowerCase();
    if (!email) return;

    if (!email.includes('@') || !email.includes('.')) {
      setErrorMsg('Please enter a valid email address');
      return;
    }

    onInvite(email, nameInput.trim() || undefined);
    setEmailInput('');
    setNameInput('');
    setErrorMsg('');
  };

  const handleSavePasscode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcodeInput.trim()) return;
    setMasterPasscode(passcodeInput.trim());
    setPasscodeSaved(true);
    setTimeout(() => setPasscodeSaved(false), 2000);
  };

  const handleCopyInviteLink = () => {
    const link = generateOneClickInviteLink();
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleWhatsAppInvite = () => {
    const link = generateOneClickInviteLink();
    const text = encodeURIComponent(
      `Hey! I've set up our family's private Important Dates app for remembering birthdays and anniversaries.\n\nOpen this link to unlock and install it on your phone:\n${link}\n\nPasscode: ${passcodeInput}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-100 animate-in fade-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-brand-50 text-brand-600 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Family Access & Invitation Gate</h2>
              <p className="text-xs text-slate-500">Only authorized family members can access and install this app</p>
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
          
          {/* SECTION 1: MASTER FAMILY PASSCODE & 1-CLICK LINK */}
          <div className="bg-brand-50/50 p-4 rounded-2xl border border-brand-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-brand-600" />
                <span className="text-xs font-bold text-slate-900">Family Invitation Passcode</span>
              </div>
              <span className="text-[10px] text-brand-700 bg-brand-100 px-2 py-0.5 rounded-full font-semibold">
                Owner Secret
              </span>
            </div>

            <form onSubmit={handleSavePasscode} className="flex gap-2">
              <input
                type="text"
                value={passcodeInput}
                onChange={(e) => setPasscodeInput(e.target.value)}
                placeholder="Set a secret passcode"
                className="flex-1 px-3 py-2 bg-white rounded-xl border border-brand-200 text-xs font-mono font-bold tracking-wider focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button
                type="submit"
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors"
              >
                {passcodeSaved ? 'Saved!' : 'Update Code'}
              </button>
            </form>

            <div className="pt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleCopyInviteLink}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors shadow-sm"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                {copiedLink ? 'Link Copied!' : 'Copy 1-Click Invite Link'}
              </button>

              <button
                type="button"
                onClick={handleWhatsAppInvite}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Invite via WhatsApp</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              When a family member opens the link, it automatically authorizes their device and lets them install the app!
            </p>
          </div>

          {/* SECTION 2: ADD MEMBER TO ALLOWLIST */}
          <form onSubmit={handleInviteSubmit} className="space-y-3">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Add Family Member to Allowlist
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Name (e.g. Sister, Mom)"
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 outline-none"
              />
              <div className="flex gap-2">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="Email (e.g. priya@gmail.com)"
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 outline-none"
                />
                <button
                  type="submit"
                  className="px-3 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all whitespace-nowrap"
                >
                  <UserPlus className="w-4 h-4" />
                </button>
              </div>
            </div>
            {errorMsg && <p className="text-xs text-rose-500">{errorMsg}</p>}
          </form>

          {/* SECTION 3: AUTHORIZED MEMBERS LIST */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center justify-between">
              <span>Authorized Family Members ({members.length})</span>
            </h3>

            <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
              {members.map((member) => (
                <div key={member.id} className="p-3 bg-white flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-600">
                      {(member.name || member.email)[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-900">
                          {member.name || member.email}
                        </span>
                        {member.role === 'owner' ? (
                          <span className="text-[10px] bg-brand-50 text-brand-700 px-1.5 py-0.5 rounded font-bold border border-brand-200">
                            👑 Owner
                          </span>
                        ) : (
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                            👤 Member
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 block truncate max-w-xs">{member.email}</span>
                    </div>
                  </div>

                  {member.role !== 'owner' && (
                    <div>
                      {member.status === 'active' ? (
                        <button
                          type="button"
                          onClick={() => onRevoke(member.id)}
                          className="px-2.5 py-1 text-xs text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 transition-colors"
                        >
                          Revoke
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onInvite(member.email, member.name)}
                          className="px-2.5 py-1 text-xs text-emerald-600 hover:bg-emerald-50 rounded-lg border border-emerald-200 transition-colors"
                        >
                          Re-activate
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>

        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
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
