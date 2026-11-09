import React, { useState } from 'react';
import { X, UserPlus, ShieldCheck, Mail, CheckCircle2, Ban, AlertCircle } from 'lucide-react';
import { Member } from '../types';

interface ManageAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  onInvite: (email: string) => void;
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

    onInvite(email);
    setEmailInput('');
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in fade-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-brand-50 text-brand-600 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Manage Access & Invitations</h2>
              <p className="text-xs text-slate-500">Only invited email addresses can access shared dates</p>
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
          
          {/* Invite Form */}
          <form onSubmit={handleInviteSubmit} className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Invite by Email
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="family.member@gmail.com"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all whitespace-nowrap"
              >
                <UserPlus className="w-4 h-4" />
                Invite
              </button>
            </div>
            {errorMsg && <p className="text-xs text-rose-500">{errorMsg}</p>}
          </form>

          {/* Members List */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center justify-between">
              <span>Authorized People ({members.length})</span>
            </h3>

            <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
              {members.map((member) => (
                <div key={member.id} className="p-3 bg-white flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-600">
                      {member.email[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-900">{member.email}</span>
                        {member.role === 'owner' && (
                          <span className="text-[10px] bg-brand-50 text-brand-700 px-1.5 py-0.5 rounded font-bold border border-brand-200">
                            Owner
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {member.status === 'active' ? (
                          <span className="text-emerald-600 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Active access
                          </span>
                        ) : (
                          <span className="text-rose-500 inline-flex items-center gap-1">
                            <Ban className="w-3 h-3" /> Access revoked
                          </span>
                        )}
                      </span>
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
                          onClick={() => onInvite(member.email)}
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

          {/* Blueprint Rule explanation callout */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
              <AlertCircle className="w-4 h-4 text-brand-600" />
              <span>How Invitation & Privacy Security Works</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500">
              When connected to Supabase, database Row-Level Security (RLS) automatically verifies user email allowlists on the PostgreSQL server. Uninvited users cannot query or access any shared data even if they know the URL. Private dates remain strictly visible only to the owner.
            </p>
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
