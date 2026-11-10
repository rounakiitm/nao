import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Calendar, 
  MapPin, 
  Image as ImageIcon, 
  Edit3, 
  Trash2, 
  X, 
  Sparkles, 
  Download, 
  Upload, 
  Filter, 
  ChevronRight,
  ZoomIn
} from 'lucide-react';
import { DiaryEntry, DiaryMood } from '../types';
import { exportDiaryJSON, importDiaryJSON } from '../lib/diaryStorage';

interface DailyDiaryViewProps {
  entries: DiaryEntry[];
  onOpenAddModal: (defaultDate?: string) => void;
  onEditEntry: (entry: DiaryEntry) => void;
  onDeleteEntry: (id: string) => void;
  onDataChanged: () => void;
}

const MOOD_MAP: Record<DiaryMood, { label: string; emoji: string; bg: string }> = {
  great: { label: 'Great', emoji: '🌟', bg: 'bg-amber-50 text-amber-900 border-amber-200' },
  happy: { label: 'Happy', emoji: '😊', bg: 'bg-emerald-50 text-emerald-900 border-emerald-200' },
  peaceful: { label: 'Peaceful', emoji: '🕊️', bg: 'bg-indigo-50 text-indigo-900 border-indigo-200' },
  thoughtful: { label: 'Thoughtful', emoji: '💭', bg: 'bg-purple-50 text-purple-900 border-purple-200' },
  challenging: { label: 'Challenging', emoji: '💪', bg: 'bg-rose-50 text-rose-900 border-rose-200' },
};

export const DailyDiaryView: React.FC<DailyDiaryViewProps> = ({
  entries,
  onOpenAddModal,
  onEditEntry,
  onDeleteEntry,
  onDataChanged,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMood, setSelectedMood] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  // Available Years
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    entries.forEach((e) => {
      if (e.date) years.add(e.date.slice(0, 4));
    });
    return Array.from(years).sort().reverse();
  }, [entries]);

  // Total Photos Count
  const totalPhotosCount = useMemo(() => {
    return entries.reduce((acc, curr) => acc + (curr.photos?.length || 0), 0);
  }, [entries]);

  // Filtered Entries
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      if (selectedMood !== 'all' && entry.mood !== selectedMood) return false;
      if (selectedYear !== 'all' && !entry.date.startsWith(selectedYear)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inContent = entry.content.toLowerCase().includes(q);
        const inTitle = (entry.title || '').toLowerCase().includes(q);
        const inLocation = (entry.location || '').toLowerCase().includes(q);
        const inDate = entry.date.includes(q);
        if (!inContent && !inTitle && !inLocation && !inDate) return false;
      }
      return true;
    });
  }, [entries, searchQuery, selectedMood, selectedYear]);

  // Format display date
  const formatEntryDate = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      return dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const getRelativeDateBadge = (dateStr: string) => {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (dateStr === today) return 'Today';
    if (dateStr === yesterday) return 'Yesterday';
    return null;
  };

  const handleExport = () => {
    const jsonStr = exportDiaryJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nao_daily_diary_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importDiaryJSON(content);
      if (res.success) {
        setImportMessage(`Successfully imported ${res.count} diary days!`);
        onDataChanged();
        setTimeout(() => setImportMessage(null), 4000);
      } else {
        setImportMessage(`Import error: ${res.error}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-950 via-indigo-950 to-purple-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-purple-950/20 border border-purple-800/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-semibold backdrop-blur-xs">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Sacred Daily Diary</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Every day has a story.
            </h2>
            <p className="text-xs sm:text-sm text-purple-200/80 max-w-lg leading-relaxed">
              Capture your daily notes, memories, and photos. Kept private, permanent, and accessible on all your devices.
            </p>
          </div>

          {/* Quick Stats & Action */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 text-center">
              <span className="block text-xl font-black text-amber-300">{entries.length}</span>
              <span className="text-[10px] text-purple-200 uppercase tracking-wider font-semibold">Days Written</span>
            </div>

            <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 text-center">
              <span className="block text-xl font-black text-amber-300">{totalPhotosCount}</span>
              <span className="text-[10px] text-purple-200 uppercase tracking-wider font-semibold">Photos</span>
            </div>

            <button
              onClick={() => onOpenAddModal()}
              className="px-4 py-3 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950 font-bold rounded-2xl text-xs shadow-md transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Write Today's Diary</span>
            </button>
          </div>
        </div>
      </div>

      {/* Import Status Alert */}
      {importMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-medium">
          {importMessage}
        </div>
      )}

      {/* Controls & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3 justify-between">
          
          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search thoughts, memories, keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-500 outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Backup & Import actions */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleExport}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
              title="Download backup of all diary entries"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>

            <label className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Import Previous Days</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Mood & Year Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">Filter:</span>
          
          <button
            onClick={() => setSelectedMood('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              selectedMood === 'all'
                ? 'bg-purple-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Moods
          </button>

          {(['great', 'happy', 'peaceful', 'thoughtful', 'challenging'] as DiaryMood[]).map((m) => (
            <button
              key={m}
              onClick={() => setSelectedMood(m === selectedMood ? 'all' : m)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                selectedMood === m
                  ? 'bg-purple-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{MOOD_MAP[m].emoji}</span>
              <span className="capitalize">{m}</span>
            </button>
          ))}

          {availableYears.length > 1 && (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="ml-auto px-2.5 py-1 bg-slate-100 rounded-lg text-xs font-medium border-none outline-none text-slate-700"
            >
              <option value="all">All Years</option>
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>{yr}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Diary Timeline Feed */}
      {filteredEntries.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto text-2xl shadow-xs">
            📖
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800">
              {searchQuery ? 'No matching diary reflections' : 'No diary entries yet'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery 
                ? 'Try a different search keyword or clear filters to see more days.'
                : 'Start documenting your daily journey with photos and thoughts today!'}
            </p>
          </div>
          <button
            onClick={() => onOpenAddModal()}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Write Entry</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEntries.map((entry) => {
            const relBadge = getRelativeDateBadge(entry.date);
            const moodInfo = entry.mood ? MOOD_MAP[entry.mood] : null;

            return (
              <article
                key={entry.id}
                className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs hover:border-purple-200 transition-all space-y-3.5"
              >
                {/* Entry Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm sm:text-base font-bold text-slate-900">
                        {formatEntryDate(entry.date)}
                      </span>

                      {relBadge && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-200">
                          {relBadge}
                        </span>
                      )}

                      {moodInfo && (
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${moodInfo.bg}`}>
                          <span>{moodInfo.emoji}</span>
                          <span className="capitalize">{moodInfo.label}</span>
                        </span>
                      )}

                      {entry.location && (
                        <span className="text-[11px] text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{entry.location}</span>
                        </span>
                      )}
                    </div>

                    {entry.title && (
                      <h4 className="text-sm font-bold text-purple-950 pt-0.5">
                        {entry.title}
                      </h4>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditEntry(entry)}
                      className="p-1.5 text-slate-400 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                      title="Edit reflection"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Delete this diary entry?')) {
                          onDeleteEntry(entry.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete reflection"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Entry Text Content */}
                <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-sans">
                  {entry.content}
                </div>

                {/* Photos Gallery */}
                {entry.photos && entry.photos.length > 0 && (
                  <div className="pt-2">
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      <ImageIcon className="w-3.5 h-3.5 text-purple-600" />
                      <span>Memories ({entry.photos.length})</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                      {entry.photos.map((photo, pIdx) => (
                        <div
                          key={pIdx}
                          onClick={() => setLightboxPhoto(photo)}
                          className="relative group rounded-2xl overflow-hidden border border-slate-200 aspect-square bg-slate-100 cursor-pointer shadow-xs hover:shadow-md transition-all"
                        >
                          <img
                            src={photo}
                            alt={`Photo from ${entry.date}`}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <ZoomIn className="w-5 h-5 drop-shadow-md" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* Lightbox / Fullscreen Image Viewer */}
      {lightboxPhoto && (
        <div
          onClick={() => setLightboxPhoto(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={lightboxPhoto}
              alt="Enlarged memory"
              className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl mx-auto"
            />
            <button
              onClick={() => setLightboxPhoto(null)}
              className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/90 text-white rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

