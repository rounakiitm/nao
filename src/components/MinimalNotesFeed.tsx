import React, { useState, useMemo } from 'react';
import { 
  Search, 
  MoreVertical, 
  Plus, 
  Paperclip, 
  Calendar, 
  Sparkles, 
  Clock, 
  Heart, 
  Cake, 
  Star, 
  Cloud, 
  Check,
  FolderPlus,
  Layers,
  ChevronRight,
  X
} from 'lucide-react';
import { DiaryEntry, ImportantEvent } from '../types';
import { getNextOccurrence, getMilestoneLabel } from '../lib/dateUtils';
import { BulkDiaryImportModal } from './BulkDiaryImportModal';

interface MinimalNotesFeedProps {
  entries: DiaryEntry[];
  events: ImportantEvent[];
  onOpenAddDiary: (defaultDate?: string, category?: string) => void;
  onEditDiary: (entry: DiaryEntry) => void;
  onDeleteDiary: (id: string) => void;
  onOpenAddEvent: () => void;
  onEditEvent: (event: ImportantEvent) => void;
  onOpenControlCenter: (tab?: string) => void;
  onDataChanged: () => void;
}

const DEFAULT_FOLDERS = ['my baby', 'All notes', 'Milestones', 'Favourites'];

export const MinimalNotesFeed: React.FC<MinimalNotesFeedProps> = ({
  entries,
  events,
  onOpenAddDiary,
  onEditDiary,
  onDeleteDiary,
  onOpenAddEvent,
  onEditEvent,
  onOpenControlCenter,
  onDataChanged,
}) => {
  const [selectedFolder, setSelectedFolder] = useState<string>('my baby');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);

  // Calculate folder counts
  const folderCounts = useMemo(() => {
    let myBabyCount = 0;
    let favCount = 0;

    entries.forEach((e) => {
      // Default to "my baby" if no category is assigned or if category is "my baby"
      if (!e.category || e.category.toLowerCase() === 'my baby') {
        myBabyCount++;
      }
      if (e.isFavorite) {
        favCount++;
      }
    });

    return {
      all: entries.length,
      myBaby: myBabyCount,
      milestones: events.length,
      favorites: favCount,
    };
  }, [entries, events]);

  // Filter entries according to folder and search
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      // Folder filter
      if (selectedFolder === 'my baby') {
        const cat = (entry.category || 'my baby').toLowerCase();
        if (cat !== 'my baby') return false;
      } else if (selectedFolder === 'Favourites') {
        if (!entry.isFavorite) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inContent = entry.content.toLowerCase().includes(q);
        const inTitle = (entry.title || '').toLowerCase().includes(q);
        const inDate = entry.date.includes(q);
        if (!inContent && !inTitle && !inDate) return false;
      }

      return true;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [entries, selectedFolder, searchQuery]);

  // Upcoming milestones sorted by days remaining
  const sortedMilestones = useMemo(() => {
    const now = new Date();
    return events
      .map((ev) => ({ event: ev, occ: getNextOccurrence(ev, now) }))
      .sort((a, b) => a.occ.daysRemaining - b.occ.daysRemaining);
  }, [events]);

  // Helper to format date like "13 November" or "Today"
  const formatNoteDate = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      const today = new Date();
      const isToday = 
        dateObj.getDate() === today.getDate() &&
        dateObj.getMonth() === today.getMonth() &&
        dateObj.getFullYear() === today.getFullYear();

      if (isToday) return 'Today';

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const isYesterday = 
        dateObj.getDate() === yesterday.getDate() &&
        dateObj.getMonth() === yesterday.getMonth() &&
        dateObj.getFullYear() === yesterday.getFullYear();

      if (isYesterday) return 'Yesterday';

      return dateObj.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto pb-28 pt-2 sm:pt-4 px-3 sm:px-0 select-none">
      
      {/* Top Header - Ultra Minimal OnePlus Style */}
      <div className="flex items-center justify-between py-2 sm:py-3 mb-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {selectedFolder === 'Milestones' ? 'Milestones' : 'Notes'}
            </h1>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-500/30 text-[10px] text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Synced</span>
            </div>
          </div>
          <p className="text-[11px] text-zinc-400 font-medium">
            {selectedFolder === 'Milestones' 
              ? `${events.length} sacred dates & anniversaries`
              : `${folderCounts.myBaby} memories • Private & Permanent`}
          </p>
        </div>

        {/* Right Header Icons */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Search Toggle */}
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className={`p-2 rounded-xl transition-all ${
              isSearchOpen ? 'bg-amber-400/20 text-amber-400' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
            title="Search notes"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Bulk Paste 250+ days button */}
          <button
            onClick={() => setIsBulkImportOpen(true)}
            className="p-2 text-zinc-400 hover:text-amber-400 hover:bg-zinc-800/60 rounded-xl transition-all"
            title="Bulk paste notes (250+ days at once)"
          >
            <Layers className="w-5 h-5" />
          </button>

          {/* 3-Dots Menu Button -> Control Center */}
          <button
            onClick={() => onOpenControlCenter()}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/60 rounded-xl transition-all"
            title="Settings, Google Drive backup & themes"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Expandable Search Input */}
      {isSearchOpen && (
        <div className="mb-4 relative animate-in fade-in slide-in-from-top-2 duration-150">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search notes, dates, or memories..."
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

      {/* Folder Chips / Notebook Tabs Bar (Horizontal Scrollable) */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-3 border-b border-zinc-800/60">
        {/* 'my baby' Folder */}
        <button
          onClick={() => setSelectedFolder('my baby')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            selectedFolder === 'my baby'
              ? 'bg-amber-400 text-zinc-950 shadow-md shadow-amber-400/20'
              : 'bg-[#18181c] text-zinc-400 hover:text-zinc-200 border border-zinc-800'
          }`}
        >
          <span>my baby</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
            selectedFolder === 'my baby' ? 'bg-zinc-950/20 text-zinc-950 font-bold' : 'bg-zinc-800 text-zinc-400'
          }`}>
            {folderCounts.myBaby}
          </span>
        </button>

        {/* 'All notes' Folder */}
        <button
          onClick={() => setSelectedFolder('All notes')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            selectedFolder === 'All notes'
              ? 'bg-amber-400 text-zinc-950 shadow-md shadow-amber-400/20'
              : 'bg-[#18181c] text-zinc-400 hover:text-zinc-200 border border-zinc-800'
          }`}
        >
          <span>All notes</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
            selectedFolder === 'All notes' ? 'bg-zinc-950/20 text-zinc-950 font-bold' : 'bg-zinc-800 text-zinc-400'
          }`}>
            {folderCounts.all}
          </span>
        </button>

        {/* 'Milestones & Dates' Folder */}
        <button
          onClick={() => setSelectedFolder('Milestones')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            selectedFolder === 'Milestones'
              ? 'bg-amber-400 text-zinc-950 shadow-md shadow-amber-400/20'
              : 'bg-[#18181c] text-zinc-400 hover:text-zinc-200 border border-zinc-800'
          }`}
        >
          <span>Milestones</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
            selectedFolder === 'Milestones' ? 'bg-zinc-950/20 text-zinc-950 font-bold' : 'bg-zinc-800 text-zinc-400'
          }`}>
            {folderCounts.milestones}
          </span>
        </button>

        {/* 'Favourites' Folder */}
        <button
          onClick={() => setSelectedFolder('Favourites')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            selectedFolder === 'Favourites'
              ? 'bg-amber-400 text-zinc-950 shadow-md shadow-amber-400/20'
              : 'bg-[#18181c] text-zinc-400 hover:text-zinc-200 border border-zinc-800'
          }`}
        >
          <Star className="w-3 h-3 fill-current" />
          <span>Favourites</span>
          {folderCounts.favorites > 0 && (
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              selectedFolder === 'Favourites' ? 'bg-zinc-950/20 text-zinc-950 font-bold' : 'bg-zinc-800 text-zinc-400'
            }`}>
              {folderCounts.favorites}
            </span>
          )}
        </button>
      </div>

      {/* Main Feed Content */}
      {selectedFolder === 'Milestones' ? (
        /* MILESTONES FEED VIEW */
        <div className="space-y-3">
          {sortedMilestones.length === 0 ? (
            <div className="text-center py-16 px-4 bg-[#141417] rounded-3xl border border-zinc-800/80 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 text-amber-400 flex items-center justify-center mx-auto text-xl">
                🎂
              </div>
              <h3 className="text-sm font-bold text-zinc-200">No milestones yet</h3>
              <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                Add birthdays, anniversaries, and sacred recurring dates to keep them forever.
              </p>
              <button
                onClick={onOpenAddEvent}
                className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-bold rounded-xl transition-all"
              >
                + Add Milestone
              </button>
            </div>
          ) : (
            sortedMilestones.map(({ event, occ }) => {
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
      ) : (
        /* NOTES & MEMORIES FEED VIEW - MATCHING ONEPLUS NOTES EXACTLY */
        <div className="space-y-2.5">
          {filteredEntries.length === 0 ? (
            <div className="text-center py-16 px-4 bg-[#141417] rounded-3xl border border-zinc-800/80 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 text-amber-400 flex items-center justify-center mx-auto text-xl">
                📝
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-zinc-200">
                  {searchQuery ? 'No matching notes' : `No notes in "${selectedFolder}"`}
                </h3>
                <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                  {searchQuery
                    ? 'Try different keywords or clear the search.'
                    : 'Start writing your daily memories, or bulk paste 250+ days from your Notes app!'}
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  onClick={() => onOpenAddDiary(undefined, selectedFolder)}
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-300 active:scale-95 text-zinc-950 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Write Note</span>
                </button>

                <button
                  onClick={() => setIsBulkImportOpen(true)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-200 text-xs font-medium rounded-xl border border-zinc-700 transition-all flex items-center gap-1.5"
                >
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  <span>Bulk Paste Notes</span>
                </button>
              </div>
            </div>
          ) : (
            filteredEntries.map((entry) => {
              const hasPhotos = entry.photos && entry.photos.length > 0;
              const firstPhoto = hasPhotos ? entry.photos[0] : null;

              return (
                <div
                  key={entry.id}
                  onClick={() => onEditDiary(entry)}
                  className="bg-[#18181c] hover:bg-[#202025] active:scale-[0.99] border border-zinc-800/80 rounded-2xl p-4 transition-all cursor-pointer flex justify-between items-start gap-3 shadow-xs"
                >
                  {/* Left Column: Date, Content Snippet, Meta */}
                  <div className="flex-1 min-w-0 space-y-1">
                    {/* Date Header */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-zinc-100 tracking-tight">
                        {formatNoteDate(entry.date)}
                      </span>
                      {entry.title && (
                        <span className="text-xs text-zinc-400 font-semibold truncate">
                          • {entry.title}
                        </span>
                      )}
                    </div>

                    {/* Note Snippet Preview (Clamped 2 lines) */}
                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed break-words">
                      {entry.content}
                    </p>

                    {/* Meta indicator row */}
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

                  {/* Right Column: Photo Thumbnail (If exists) */}
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
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Floating Action Button (1-Tap Note / Milestone Creator) */}
      <button
        onClick={() => {
          if (selectedFolder === 'Milestones') {
            onOpenAddEvent();
          } else {
            onOpenAddDiary(undefined, selectedFolder);
          }
        }}
        className="fixed bottom-20 sm:bottom-8 right-5 sm:right-8 z-40 w-14 h-14 rounded-full bg-amber-400 hover:bg-amber-300 active:scale-90 text-zinc-950 flex items-center justify-center shadow-2xl shadow-amber-400/30 transition-all border border-amber-300/40"
        title="Create new note or memory"
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
