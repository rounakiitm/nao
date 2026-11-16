import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Undo2, 
  Redo2, 
  MoreVertical, 
  ImagePlus, 
  Smile, 
  Calendar as CalendarIcon, 
  X, 
  Trash2, 
  Heart, 
  Folder, 
  MapPin, 
  Check, 
  Sparkles 
} from 'lucide-react';
import { DiaryEntry, DiaryMood } from '../types';
import { compressDiaryPhoto } from '../lib/diaryStorage';

interface DiaryEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: DiaryEntry) => void;
  onDelete?: (id: string) => void;
  initialEntry?: DiaryEntry | null;
  defaultDate?: string;
  defaultCategory?: string;
}

const MOODS: { id: DiaryMood; label: string; emoji: string }[] = [
  { id: 'great', label: 'Great', emoji: '🌟' },
  { id: 'happy', label: 'Happy', emoji: '😊' },
  { id: 'peaceful', label: 'Peaceful', emoji: '🕊️' },
  { id: 'thoughtful', label: 'Thoughtful', emoji: '💭' },
  { id: 'challenging', label: 'Challenging', emoji: '💪' },
];

export const DiaryEntryModal: React.FC<DiaryEntryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialEntry,
  defaultDate,
  defaultCategory,
}) => {
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<DiaryMood>('peaceful');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState<string>('my baby');
  const [photos, setPhotos] = useState<string[]>([]);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  
  // Toolbar dropdown toggles
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Undo / Redo history stack
  const [history, setHistory] = useState<{ title: string; content: string }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const contentInputRef = useRef<HTMLTextAreaElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Format date & time header like OnePlus Notes: "17/11/2026, 3:38 am"
  const formattedDateTime = React.useMemo(() => {
    try {
      const now = new Date();
      let d = now;
      if (date && date !== now.toISOString().slice(0, 10)) {
        const [y, m, day] = date.split('-').map(Number);
        d = new Date(y, m - 1, day, now.getHours(), now.getMinutes());
      }
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const hours = d.getHours();
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'pm' : 'am';
      const formattedHours = hours % 12 || 12;
      return `${day}/${month}/${year}, ${formattedHours}:${minutes} ${ampm}`;
    } catch {
      return date;
    }
  }, [date]);

  // Word count
  const wordCount = React.useMemo(() => {
    const trimmed = content.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).length;
  }, [content]);

  useEffect(() => {
    if (isOpen) {
      if (initialEntry) {
        setDate(initialEntry.date);
        setTitle(initialEntry.title || '');
        setContent(initialEntry.content);
        setMood(initialEntry.mood || 'peaceful');
        setLocation(initialEntry.location || '');
        setCategory(initialEntry.category || 'my baby');
        setPhotos(initialEntry.photos || []);
        setHistory([{ title: initialEntry.title || '', content: initialEntry.content }]);
        setHistoryIndex(0);
      } else {
        const todayStr = defaultDate || new Date().toISOString().slice(0, 10);
        setDate(todayStr);
        setTitle('');
        setContent('');
        setMood('peaceful');
        setLocation('');
        setCategory(defaultCategory || 'my baby');
        setPhotos([]);
        setHistory([{ title: '', content: '' }]);
        setHistoryIndex(0);
      }

      setShowMoodPicker(false);
      setShowDatePicker(false);
      setShowFolderPicker(false);
      setShowMenu(false);

      // Focus textarea immediately on mobile
      setTimeout(() => {
        if (contentInputRef.current) {
          contentInputRef.current.focus();
        }
      }, 100);
    }
  }, [initialEntry, defaultDate, defaultCategory, isOpen]);

  if (!isOpen) return null;

  // History tracking for Undo / Redo
  const recordHistory = (newTitle: string, newContent: string) => {
    const nextHistory = history.slice(0, historyIndex + 1);
    nextHistory.push({ title: newTitle, content: newContent });
    if (nextHistory.length > 40) nextHistory.shift();
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    recordHistory(val, content);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    recordHistory(title, val);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setTitle(prev.title);
      setContent(prev.content);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setTitle(next.title);
      setContent(next.content);
    }
  };

  // Photos
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingPhoto(true);
    try {
      const newPhotoUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('image/')) {
          const compressed = await compressDiaryPhoto(file);
          newPhotoUrls.push(compressed);
        }
      }
      setPhotos((prev) => [...prev, ...newPhotoUrls]);
    } catch (err) {
      console.error('Failed to process photos', err);
    } finally {
      setIsProcessingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  // Save entry
  const handleSave = () => {
    if (!content.trim() && !title.trim() && photos.length === 0) {
      onClose();
      return;
    }

    const entry: DiaryEntry = {
      id: initialEntry ? initialEntry.id : `diary-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      date,
      title: title.trim(),
      content: content.trim(),
      mood,
      location: location.trim(),
      category: category.trim() || 'my baby',
      photos,
      created_at: initialEntry ? initialEntry.created_at : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    onSave(entry);
    onClose();
  };

  // Back button: auto-saves if not empty
  const handleBack = () => {
    if (content.trim() || title.trim() || photos.length > 0) {
      handleSave();
    } else {
      onClose();
    }
  };

  const handleDelete = () => {
    if (initialEntry && onDelete) {
      if (window.confirm('Are you sure you want to delete this diary entry?')) {
        onDelete(initialEntry.id);
        onClose();
      }
    }
  };

  const currentMoodObj = MOODS.find((m) => m.id === mood) || MOODS[2];

  return (
    <div className="fixed inset-0 z-50 bg-[#000000] text-zinc-100 flex flex-col h-full w-full select-text animate-in fade-in duration-100">
      
      {/* ── TOP ACTION BAR (Matches OnePlus Notes: ← ↶ ↷ ⋮ Done) ── */}
      <header className="flex items-center justify-between px-3 py-3 border-b border-zinc-900 bg-[#000000] select-none">
        
        {/* Left: Back button */}
        <button
          type="button"
          onClick={handleBack}
          className="p-2 text-zinc-200 hover:text-white active:scale-95 rounded-full transition-all"
          title="Back & save"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Center: Undo & Redo */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className={`p-2 rounded-full transition-colors ${
              historyIndex > 0 ? 'text-zinc-200 hover:text-white hover:bg-zinc-800' : 'text-zinc-700 cursor-not-allowed'
            }`}
            title="Undo"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          
          <button
            type="button"
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className={`p-2 rounded-full transition-colors ${
              historyIndex < history.length - 1 ? 'text-zinc-200 hover:text-white hover:bg-zinc-800' : 'text-zinc-700 cursor-not-allowed'
            }`}
            title="Redo"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          {/* 3-dots Menu Toggle */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-full transition-colors"
              title="More options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {/* Menu Dropdown */}
            {showMenu && (
              <div className="absolute left-0 mt-1 w-48 bg-[#18181c] border border-zinc-800 rounded-2xl shadow-2xl py-1 z-30 animate-in fade-in">
                <button
                  type="button"
                  onClick={() => {
                    setShowDatePicker(true);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2.5 text-xs text-zinc-200 hover:bg-zinc-800/80 flex items-center gap-2 text-left"
                >
                  <CalendarIcon className="w-3.5 h-3.5 text-amber-400" />
                  <span>Change Diary Date</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowFolderPicker(true);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2.5 text-xs text-zinc-200 hover:bg-zinc-800/80 flex items-center gap-2 text-left"
                >
                  <Folder className="w-3.5 h-3.5 text-purple-400" />
                  <span>Change Notebook / Folder</span>
                </button>

                {initialEntry && onDelete && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      handleDelete();
                    }}
                    className="w-full px-4 py-2.5 text-xs text-rose-400 hover:bg-rose-950/40 flex items-center gap-2 text-left border-t border-zinc-800/60"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Entry</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Done Button */}
        <button
          type="button"
          onClick={handleSave}
          className="px-4 py-1.5 text-amber-400 hover:text-amber-300 font-bold text-sm tracking-wide rounded-xl active:scale-95 transition-all"
        >
          Done
        </button>
      </header>

      {/* ── SUBHEADER LINE: Timestamp | Folder | Mood ── */}
      <div className="px-5 py-2 flex flex-wrap items-center justify-between text-xs text-zinc-400 select-none border-b border-zinc-900/60 gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Timestamp (Tappable to change date) */}
          <button
            type="button"
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="hover:text-zinc-200 flex items-center gap-1 transition-colors font-mono"
            title="Tap to change date"
          >
            <span>{formattedDateTime}</span>
          </button>

          <span className="text-zinc-700">|</span>

          {/* Folder / Notebook Name (Tappable to switch or rename) */}
          <button
            type="button"
            onClick={() => setShowFolderPicker(!showFolderPicker)}
            className="hover:text-amber-400 flex items-center gap-1 transition-colors font-medium text-zinc-300"
            title="Tap to change notebook"
          >
            <span>{category}</span>
          </button>
        </div>

        {/* Mood Pill */}
        <button
          type="button"
          onClick={() => setShowMoodPicker(!showMoodPicker)}
          className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-[11px] transition-colors"
          title="Change mood"
        >
          <span>{currentMoodObj.emoji}</span>
          <span className="text-[10px] text-zinc-400">{currentMoodObj.label}</span>
        </button>
      </div>

      {/* Inline Date Picker Drawer if tapped */}
      {showDatePicker && (
        <div className="px-5 py-2.5 bg-[#121215] border-b border-zinc-800 flex items-center gap-3 animate-in slide-in-from-top-2">
          <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
            Entry Date:
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setShowDatePicker(false);
            }}
            style={{ colorScheme: 'dark' }}
            className="px-3 py-1 bg-zinc-900 text-white border border-zinc-700 rounded-xl text-xs font-semibold focus:border-amber-400 outline-none"
          />
          <button
            type="button"
            onClick={() => setShowDatePicker(false)}
            className="text-xs text-zinc-400 hover:text-white"
          >
            Close
          </button>
        </div>
      )}

      {/* Inline Folder Picker Drawer if tapped */}
      {showFolderPicker && (
        <div className="px-5 py-2.5 bg-[#121215] border-b border-zinc-800 flex items-center gap-2 flex-wrap animate-in slide-in-from-top-2">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Notebook:</span>
          {['my baby', 'Daily Journey', 'Random', 'Milestones'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setCategory(cat);
                setShowFolderPicker(false);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
                category === cat ? 'bg-amber-400 text-zinc-950 font-bold' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              {cat}
            </button>
          ))}
          <input
            type="text"
            placeholder="Custom folder..."
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-2 py-0.5 bg-zinc-900 text-white border border-zinc-700 rounded-lg text-xs w-28 focus:border-amber-400 outline-none"
          />
          <button
            type="button"
            onClick={() => setShowFolderPicker(false)}
            className="text-xs text-zinc-400 hover:text-white"
          >
            Done
          </button>
        </div>
      )}

      {/* Inline Mood Selector Drawer if tapped */}
      {showMoodPicker && (
        <div className="px-5 py-2.5 bg-[#121215] border-b border-zinc-800 flex items-center gap-2 overflow-x-auto animate-in slide-in-from-top-2">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mr-1">Mood:</span>
          {MOODS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                setMood(m.id);
                setShowMoodPicker(false);
              }}
              className={`px-3 py-1 rounded-xl text-xs flex items-center gap-1.5 transition-all ${
                mood === m.id
                  ? 'bg-amber-400 text-zinc-950 font-bold shadow-sm'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              <span>{m.emoji}</span>
              <span>{m.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* ── WRITING CANVAS (Pure, edge-to-edge, distraction-free sheet) ── */}
      <main className="flex-1 flex flex-col w-full overflow-y-auto px-5 pt-4 pb-20 space-y-3">
        
        {/* Title Input (matches Image 2 bold 'Title' placeholder) */}
        <input
          ref={titleInputRef}
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder="Title"
          className="w-full bg-transparent border-none outline-none text-2xl sm:text-3xl font-bold tracking-tight text-white placeholder:text-zinc-600 focus:ring-0 p-0"
        />

        {/* Main Note Body Textarea (full height, amber caret) */}
        <textarea
          ref={contentInputRef}
          value={content}
          onChange={handleContentChange}
          placeholder="Write your note here..."
          className="flex-1 w-full bg-transparent border-none outline-none text-base sm:text-lg leading-relaxed text-zinc-100 placeholder:text-zinc-700 focus:ring-0 p-0 resize-none font-sans min-h-[350px]"
          style={{
            caretColor: '#f59e0b',
          }}
        />

        {/* Attached Photos Gallery (rendered directly inside the note) */}
        {photos.length > 0 && (
          <div className="pt-4 border-t border-zinc-900 space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              Attached Memories ({photos.length})
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
              {photos.map((url, idx) => (
                <div
                  key={idx}
                  className="relative group rounded-2xl overflow-hidden border border-zinc-800 aspect-square bg-zinc-900"
                >
                  <img
                    src={url}
                    alt={`Attachment ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(idx)}
                    className="absolute top-1.5 right-1.5 p-1 bg-black/80 hover:bg-rose-600 text-white rounded-full transition-colors"
                    title="Remove photo"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ── BOTTOM DOCKED TOOLBAR (above keyboard / bottom of screen) ── */}
      <footer className="fixed bottom-0 inset-x-0 bg-[#000000]/95 backdrop-blur-md border-t border-zinc-900 px-4 py-2.5 flex items-center justify-between select-none z-20">
        
        {/* Left tools: Photo, Mood, Calendar, Location */}
        <div className="flex items-center gap-1 sm:gap-2">
          
          {/* Add Photo Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessingPhoto}
            className="p-2 text-zinc-300 hover:text-amber-400 hover:bg-zinc-800/80 rounded-xl transition-colors flex items-center gap-1.5 text-xs"
            title="Add photos"
          >
            <ImagePlus className="w-5 h-5 text-amber-400" />
            <span className="hidden sm:inline font-medium">Add Photo</span>
          </button>

          {/* Secret File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoUpload}
            className="hidden"
          />

          {/* Quick Mood Button */}
          <button
            type="button"
            onClick={() => setShowMoodPicker(!showMoodPicker)}
            className="p-2 text-zinc-300 hover:text-amber-400 hover:bg-zinc-800/80 rounded-xl transition-colors"
            title="Day's Mood"
          >
            <Smile className="w-5 h-5 text-zinc-400" />
          </button>

          {/* Calendar Date Shortcut */}
          <button
            type="button"
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="p-2 text-zinc-300 hover:text-amber-400 hover:bg-zinc-800/80 rounded-xl transition-colors"
            title="Change Date"
          >
            <CalendarIcon className="w-5 h-5 text-zinc-400" />
          </button>

          {/* Processing Photo Spinner */}
          {isProcessingPhoto && (
            <span className="text-[11px] text-amber-400 animate-pulse pl-1">
              Adding photo...
            </span>
          )}
        </div>

        {/* Right tools: Word Count & Status */}
        <div className="flex items-center gap-3 text-xs text-zinc-500 font-mono">
          <span>{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
        </div>
      </footer>

    </div>
  );
};
