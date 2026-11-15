import React from 'react';
import { BookOpen, Calendar, Settings, ShieldCheck, MoreVertical, Sparkles } from 'lucide-react';

interface BottomNavBarProps {
  activeTab: 'notes' | 'milestones' | 'calendar' | 'vault';
  setActiveTab: (tab: 'notes' | 'milestones' | 'calendar' | 'vault') => void;
  onOpenControlCenter: (tab?: string) => void;
  notesCount: number;
  milestonesCount: number;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  setActiveTab,
  onOpenControlCenter,
  notesCount,
  milestonesCount,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-[#101014]/95 backdrop-blur-xl border-t border-zinc-800/80 px-4 py-2 flex items-center justify-around max-w-lg mx-auto sm:rounded-t-3xl shadow-2xl">
      {/* Notes / Diary Tab */}
      <button
        onClick={() => setActiveTab('notes')}
        className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all ${
          activeTab === 'notes'
            ? 'text-amber-400 font-bold'
            : 'text-zinc-500 hover:text-zinc-300 font-medium'
        }`}
      >
        <div className="relative">
          <BookOpen className="w-5 h-5 stroke-[2.2]" />
          {notesCount > 0 && (
            <span className="absolute -top-1 -right-2 px-1 py-0.2 text-[9px] font-black rounded-full bg-amber-400 text-zinc-950">
              {notesCount > 99 ? '99+' : notesCount}
            </span>
          )}
        </div>
        <span className="text-[11px] tracking-tight">Notes</span>
      </button>

      {/* Milestones / Dates Tab */}
      <button
        onClick={() => setActiveTab('milestones')}
        className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all ${
          activeTab === 'milestones'
            ? 'text-amber-400 font-bold'
            : 'text-zinc-500 hover:text-zinc-300 font-medium'
        }`}
      >
        <div className="relative">
          <Calendar className="w-5 h-5 stroke-[2.2]" />
          {milestonesCount > 0 && (
            <span className="absolute -top-1 -right-2 px-1 py-0.2 text-[9px] font-black rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
              {milestonesCount}
            </span>
          )}
        </div>
        <span className="text-[11px] tracking-tight">Milestones</span>
      </button>

      {/* Vault / Settings Tab (Opens Control Center) */}
      <button
        onClick={() => onOpenControlCenter()}
        className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all ${
          activeTab === 'vault'
            ? 'text-amber-400 font-bold'
            : 'text-zinc-500 hover:text-zinc-300 font-medium'
        }`}
      >
        <MoreVertical className="w-5 h-5 stroke-[2.2]" />
        <span className="text-[11px] tracking-tight">Vault</span>
      </button>
    </nav>
  );
};
