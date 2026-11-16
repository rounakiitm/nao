import React, { useState, useMemo, useEffect } from 'react';
import { 
  Sparkles, 
  Search, 
  Plus, 
  Calendar as CalendarIcon, 
  BookOpen, 
  MoreVertical, 
  Clock, 
  Heart, 
  Cake, 
  MapPin, 
  Paperclip, 
  X, 
  Layers, 
  Camera, 
  ChevronRight, 
  Smile, 
  Lock, 
  Check, 
  Edit3,
  CalendarHeart
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ImportantEvent, DiaryEntry, CurrentUser } from '../types';
import { getNextOccurrence, getMilestoneLabel } from '../lib/dateUtils';
import { NaoLogo } from './NaoLogo';
import { BulkDiaryImportModal } from './BulkDiaryImportModal';

interface NaoHomeProps {
  currentUser: CurrentUser;
  events: ImportantEvent[];
  diaryEntries: DiaryEntry[];
  onOpenAddDiary: (defaultDate?: string) => void;
  onEditDiary: (entry: DiaryEntry) => void;
  onDeleteDiary: (id: string) => void;
  onOpenAddEvent: () => void;
  onEditEvent: (event: ImportantEvent) => void;
  onOpenControlCenter: (tab?: string) => void;
  onOpenAI: (event: ImportantEvent) => void;
  onDataChanged: () => void;
}

export const NaoHome: React.FC<NaoHomeProps> = ({
  currentUser,
  events,
  diaryEntries,
  onOpenAddDiary,
  onEditDiary,
  onDeleteDiary,
  onOpenAddEvent,
  onEditEvent,
  onOpenControlCenter,
  onOpenAI,
  onDataChanged,
}) => {
  const [activeSection, setActiveSection] = useState<'diary' | 'milestones'>('diary');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);

  // Today's date calculations
  const now = new Date();
  const todayISO = now.toISOString().slice(0, 10);

  // Time-aware greeting
  const greeting = useMemo(() => {
    const hour = now.getHours();
    const name = currentUser.display_name || 'Rounak';
    if (hour >= 5 && hour < 12) return `Good morning, ${name} ☀️`;
    if (hour >= 12 && hour < 17) return `Good afternoon, ${name} ✨`;
    if (hour >= 17 && hour < 22) return `Good evening, ${name} 🌙`;
    return `Quiet night, ${name} 🌌`;
  }, [currentUser.display_name]);

  const formattedTodayDate = useMemo(() => {
    return now.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }, []);

  // Events with occurrences
  const eventsWithOcc = useMemo(() => {
    return events
      .map((ev) => ({ event: ev, occ: getNextOccurrence(ev, now) }))
      .sort((a, b) => a.occ.daysRemaining - b.occ.daysRemaining);
  }, [events]);

  const todayEvents = useMemo(() => {
    return eventsWithOcc.filter((item) => item.occ.isToday);
  }, [eventsWithOcc]);

  const nextUpcomingEvent = useMemo(() => {
    return eventsWithOcc.find((item) => !item.occ.isToday);
  }, [eventsWithOcc]);

  // Today's diary entry (if already written)
  const todayDiaryEntry = useMemo(() => {
    return diaryEntries.find((e) => e.date === todayISO);
  }, [diaryEntries, todayISO]);

  // Trigger celebratory confetti if today has an event
  useEffect(() => {
    if (todayEvents.length > 0) {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.55 },
        colors: ['#fbbf24', '#f43f5e', '#a855f7', '#38bdf8'],
      });
    }
  }, [todayEvents.length]);

  // Filtered diary entries
  const filteredDiary = useMemo(() => {
    return diaryEntries
      .filter((entry) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          entry.content.toLowerCase().includes(q) ||
          (entry.title || '').toLowerCase().includes(q) ||
          entry.date.includes(q)
        );
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [diaryEntries, searchQuery]);

  // Filtered milestones
  const filteredMilestones = useMemo(() => {
    return eventsWithOcc.filter(({ event }) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        event.title.toLowerCase().includes(q) ||
        (event.person_name || '').toLowerCase().includes(q) ||
        (event.notes || '').toLowerCase().includes(q)
      );
    });
  }, [eventsWithOcc, searchQuery]);

  // Helper to format past date
  const formatPastDate = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      const isYesterday = 
        new Date(now.getTime() - 86400000).toISOString().slice(0, 10) === dateStr;

      if (isYesterday) return 'Yesterday';

      return dateObj.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-0 pb-24 pt-2 select-none space-y-6">
      
      {/* ── TOP APPBAT: IDENTITY & CONTROLS ── */}
      <header className="flex items-center justify-between py-2 border-b border-zinc-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl overflow-hidden border border-amber-400/30 bg-[#161224] p-1 flex items-center justify-center shadow-xs">
            <NaoLogo className="w-full h-full" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-black tracking-tight text-white">nao</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-amber-400/10 text-amber-400 border border-amber-400/20">
                Vault
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {/* Subtle Online / Sync Pill */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-[10px] text-emerald-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="hidden sm:inline">Synced</span>
          </div>

          {/* Search Toggle */}
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className={`p-2 rounded-xl transition-all ${
              isSearchOpen ? 'bg-amber-400/20 text-amber-400' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
            title="Search diary & dates"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Bulk Paste 250+ days button */}
          <button
            onClick={() => setIsBulkImportOpen(true)}
            className="p-2 text-zinc-400 hover:text-amber-400 hover:bg-zinc-800/60 rounded-xl transition-all"
            title="Bulk paste notes (250+ days)"
          >
            <Layers className="w-4 h-4" />
          </button>

          {/* 3-Dots Menu Button -> Control Center */}
          <button
            onClick={() => onOpenControlCenter()}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/60 rounded-xl transition-all"
            title="Vault settings, Google Drive backup & themes"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Expandable Search Input */}
      {isSearchOpen && (
        <div className="relative animate-in fade-in slide-in-from-top-2 duration-150">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search diary thoughts, memories, or dates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
            className="w-full bg-[#18181c] border border-zinc-700/80 rounded-2xl pl-10 pr-9 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400/80 transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* ── TODAY'S GENTLE SANCTUARY ── */}
      <section className="space-y-3">
        {/* Warm Greeting & Today's Date */}
        <div className="space-y-0.5">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            {greeting}
          </h2>
          <p className="text-xs text-zinc-400 font-medium">
            {formattedTodayDate}
          </p>
        </div>

        {/* ── 1. IS ANYTHING SPECIAL TODAY? ── */}
        {todayEvents.length > 0 ? (
          <div className="p-4 rounded-3xl bg-gradient-to-r from-rose-950/60 via-purple-950/40 to-amber-950/50 border border-rose-500/40 shadow-xl shadow-rose-950/20 space-y-2 animate-in fade-in">
            <div className="flex items-center gap-2">
              <span className="text-2xl animate-bounce">🎉</span>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-rose-300">
                  Today's Special Celebration
                </span>
                {todayEvents.map(({ event, occ }) => (
                  <h3 key={event.id} className="text-base sm:text-lg font-black text-white">
                    {event.category === 'Birthday' ? '🎂' : '💍'} {event.title}
                    {event.person_name && ` (${event.person_name})`}
                  </h3>
                ))}
              </div>
            </div>

            {todayEvents.map(({ event, occ }) => {
              const label = getMilestoneLabel(event, occ.yearsCount);
              return (
                <div key={event.id} className="flex items-center justify-between pt-1 border-t border-white/10 text-xs">
                  <span className="text-rose-200 font-semibold">{label || 'A sacred day to celebrate!'}</span>
                  <button
                    onClick={() => onOpenAI(event)}
                    className="px-3 py-1 bg-white/10 hover:bg-white/20 active:scale-95 text-rose-200 font-bold rounded-xl transition-all flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Greeting Ideas</span>
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          /* Peaceful indicator + next upcoming milestone */
          <div className="px-3.5 py-2 rounded-2xl bg-[#141418] border border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>A quiet, peaceful day today</span>
            </div>

            {nextUpcomingEvent && (
              <span className="text-[11px] text-zinc-500">
                Next: <strong className="text-zinc-300">{nextUpcomingEvent.event.title}</strong> in {nextUpcomingEvent.occ.daysRemaining}d
              </span>
            )}
          </div>
        )}

        {/* ── 2. TODAY'S DIARY / REFLECTION CARD ── */}
        {todayDiaryEntry ? (
          /* Already written today */
          <div 
            onClick={() => onEditDiary(todayDiaryEntry)}
            className="p-4 rounded-3xl bg-[#18181c] hover:bg-[#202025] active:scale-[0.99] border border-zinc-800/90 transition-all cursor-pointer shadow-xs space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">✨</span>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Today's Story Captured
                </span>
              </div>
              <span className="text-[11px] text-zinc-500 font-medium flex items-center gap-1">
                <Edit3 className="w-3 h-3 text-zinc-400" />
                <span>Tap to edit</span>
              </span>
            </div>

            <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed">
              {todayDiaryEntry.content}
            </p>

            {todayDiaryEntry.photos && todayDiaryEntry.photos.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pt-1">
                {todayDiaryEntry.photos.map((photo, i) => (
                  <div key={i} className="w-14 h-14 rounded-xl overflow-hidden border border-zinc-700/60 flex-shrink-0">
                    <img src={photo} alt="Today's memory" className="w-full h-full object-cover" />
                  </div>
                ))}
                <span className="text-[10px] text-zinc-500 font-medium pl-1">
                  📎 {todayDiaryEntry.photos.length} photo{todayDiaryEntry.photos.length > 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        ) : (
          /* Not written yet today: Calm invitation card */
          <div 
            onClick={() => onOpenAddDiary(todayISO)}
            className="p-4 rounded-3xl bg-gradient-to-br from-[#1c1828] to-[#14121d] border border-amber-400/20 hover:border-amber-400/40 active:scale-[0.99] transition-all cursor-pointer shadow-lg space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
                  <span>📖</span>
                  <span>Capture Today's Memory</span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Record your thoughts, feelings, and today's photo for your loved one.
                </p>
              </div>

              <div className="w-10 h-10 rounded-2xl bg-amber-400 text-zinc-950 flex items-center justify-center font-bold shadow-md shadow-amber-400/20 flex-shrink-0">
                <Plus className="w-5 h-5 stroke-[2.5]" />
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ── SECTION SWITCHER TABS ── */}
      <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-2">
        <button
          onClick={() => setActiveSection('diary')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeSection === 'diary'
              ? 'bg-amber-400 text-zinc-950 shadow-md shadow-amber-400/20'
              : 'bg-[#18181c] text-zinc-400 hover:text-zinc-200 border border-zinc-800'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Daily Journey</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
            activeSection === 'diary' ? 'bg-zinc-950/20 text-zinc-950' : 'bg-zinc-800 text-zinc-400'
          }`}>
            {diaryEntries.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSection('milestones')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeSection === 'milestones'
              ? 'bg-amber-400 text-zinc-950 shadow-md shadow-amber-400/20'
              : 'bg-[#18181c] text-zinc-400 hover:text-zinc-200 border border-zinc-800'
          }`}
        >
          <CalendarHeart className="w-3.5 h-3.5" />
          <span>Sacred Dates</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
            activeSection === 'milestones' ? 'bg-zinc-950/20 text-zinc-950' : 'bg-zinc-800 text-zinc-400'
          }`}>
            {events.length}
          </span>
        </button>
      </div>

      {/* ── SECTION CONTENT ── */}
      {activeSection === 'diary' ? (
        /* DAILY JOURNEY / MEMORIES TIMELINE */
        <div className="space-y-3">
          {filteredDiary.length === 0 ? (
            <div className="text-center py-12 px-4 bg-[#141418] rounded-3xl border border-zinc-800/80 space-y-3">
              <span className="text-2xl">📖</span>
              <h4 className="text-sm font-bold text-zinc-200">
                {searchQuery ? 'No matching memories found' : 'Your journal is ready'}
              </h4>
              <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                {searchQuery 
                  ? 'Try searching a different word or date.'
                  : 'Start writing your daily memories, or bulk paste your past days anytime.'}
              </p>
              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  onClick={() => onOpenAddDiary()}
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-bold rounded-xl transition-all"
                >
                  Write Entry
                </button>
                <button
                  onClick={() => setIsBulkImportOpen(true)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-xl border border-zinc-700 transition-all flex items-center gap-1.5"
                >
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  <span>Bulk Paste Notes</span>
                </button>
              </div>
            </div>
          ) : (
            filteredDiary.map((entry) => {
              const hasPhotos = entry.photos && entry.photos.length > 0;
              const firstPhoto = hasPhotos ? entry.photos[0] : null;

              return (
                <article
                  key={entry.id}
                  onClick={() => onEditDiary(entry)}
                  className="bg-[#18181c] hover:bg-[#202025] active:scale-[0.99] border border-zinc-800/80 rounded-2xl p-4 transition-all cursor-pointer flex justify-between items-start gap-3 shadow-xs"
                >
                  {/* Left Column: Date, Content Snippet, Meta */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-zinc-100 tracking-tight">
                        {formatPastDate(entry.date)}
                      </span>
                      {entry.title && (
                        <span className="text-xs text-zinc-400 font-semibold truncate">
                          • {entry.title}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed break-words">
                      {entry.content}
                    </p>

                    <div className="flex items-center gap-2 pt-1">
                      {hasPhotos && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-zinc-500 font-medium">
                          <Paperclip className="w-3 h-3 text-amber-400" />
                          <span>{entry.photos.length} photo{entry.photos.length > 1 ? 's' : ''}</span>
                        </span>
                      )}

                      {entry.location && (
                        <span className="text-[10px] text-zinc-500">
                          📍 {entry.location}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Photo Thumbnail */}
                  {firstPhoto && (
                    <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl overflow-hidden flex-shrink-0 border border-zinc-700/60 bg-zinc-900 shadow-xs">
                      <img
                        src={firstPhoto}
                        alt="Thumbnail"
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>
      ) : (
        /* SACRED DATES & MILESTONES */
        <div className="space-y-3">
          {filteredMilestones.length === 0 ? (
            <div className="text-center py-12 px-4 bg-[#141418] rounded-3xl border border-zinc-800/80 space-y-3">
              <span className="text-2xl">🎂</span>
              <h4 className="text-sm font-bold text-zinc-200">No dates recorded yet</h4>
              <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                Add birthdays, anniversaries, and sacred recurring dates to keep them close to heart.
              </p>
              <button
                onClick={onOpenAddEvent}
                className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-bold rounded-xl transition-all"
              >
                + Add Important Date
              </button>
            </div>
          ) : (
            filteredMilestones.map(({ event, occ }) => {
              const milestoneLabel = getMilestoneLabel(event, occ.yearsCount);
              const isToday = occ.isToday;

              return (
                <div
                  key={event.id}
                  onClick={() => onEditEvent(event)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 active:scale-[0.99] ${
                    isToday
                      ? 'bg-rose-950/40 border-rose-500/50 shadow-md shadow-rose-950/30'
                      : 'bg-[#18181c] hover:bg-[#202025] border-zinc-800/80'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base">
                        {event.category === 'Birthday' ? '🎂' : event.category === 'Anniversary' ? '💍' : '✨'}
                      </span>
                      <h4 className="text-sm font-bold text-zinc-100">
                        {event.title}
                      </h4>
                      {isToday && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold uppercase animate-pulse">
                          Today!
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-zinc-400">
                      {event.person_name && `For ${event.person_name} • `}
                      {occ.nextDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      {event.notes && ` • "${event.notes}"`}
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className={`block text-xs font-bold ${
                      isToday ? 'text-rose-400' : occ.daysRemaining <= 7 ? 'text-amber-400' : 'text-zinc-400'
                    }`}>
                      {isToday ? 'Today' : `In ${occ.daysRemaining} days`}
                    </span>
                    {milestoneLabel && (
                      <span className="text-[10px] text-zinc-500 font-medium">
                        {milestoneLabel}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Floating Action Button (1-Tap Note / Milestone Creator) */}
      <button
        onClick={() => {
          if (activeSection === 'milestones') {
            onOpenAddEvent();
          } else {
            onOpenAddDiary();
          }
        }}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-amber-400 hover:bg-amber-300 active:scale-90 text-zinc-950 flex items-center justify-center shadow-2xl shadow-amber-400/30 transition-all border border-amber-300/40"
        title="Add new memory or date"
      >
        <Plus className="w-7 h-7 stroke-[2.5]" />
      </button>

      {/* Bulk Diary Import Modal */}
      <BulkDiaryImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        onImportComplete={onDataChanged}
      />
    </div>
  );
};
