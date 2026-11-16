import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Calendar, 
  Image as ImageIcon, 
  Trash2, 
  MapPin, 
  Smile, 
  Sparkles, 
  Check, 
  Camera 
} from 'lucide-react';
import { DiaryEntry, DiaryMood } from '../types';
import { compressDiaryPhoto } from '../lib/diaryStorage';

interface DiaryEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: DiaryEntry) => void;
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialEntry) {
      setDate(initialEntry.date);
      setTitle(initialEntry.title || '');
      setContent(initialEntry.content);
      setMood(initialEntry.mood || 'peaceful');
      setLocation(initialEntry.location || '');
      setCategory(initialEntry.category || 'my baby');
      setPhotos(initialEntry.photos || []);
    } else {
      setDate(defaultDate || new Date().toISOString().slice(0, 10));
      setTitle('');
      setContent('');
      setMood('peaceful');
      setLocation('');
      setCategory(defaultCategory || 'my baby');
      setPhotos([]);
    }
  }, [initialEntry, defaultDate, defaultCategory, isOpen]);

  if (!isOpen) return null;

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="relative bg-[#18181c] text-zinc-100 rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-zinc-700/80">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-[#141418]">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">📖</span>
            <div>
              <h2 className="text-base font-bold text-white">
                {initialEntry ? 'Edit Diary Entry' : 'New Daily Diary Entry'}
              </h2>
              <p className="text-[11px] text-zinc-400 font-medium">Record your thoughts, memories & photos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[78vh] overflow-y-auto">
          
          {/* Row 1: Date, Folder & Mood */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1">
                Diary Date *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  style={{ colorScheme: 'dark' }}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#121215] text-white border border-zinc-700 text-xs font-semibold focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1">
                Folder / Notebook
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. my baby"
                className="w-full px-3 py-2 rounded-xl bg-[#121215] text-white border border-zinc-700 text-xs font-semibold focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 outline-none placeholder-zinc-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1">
                Day's Mood
              </label>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {MOODS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMood(m.id)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
                      mood === m.id
                        ? 'bg-amber-400 text-zinc-950 font-bold shadow-xs'
                        : 'bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700'
                    }`}
                  >
                    <span>{m.emoji}</span>
                    <span className="hidden sm:inline text-[11px]">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Title (Optional) */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1">
              Title / Highlight (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Peaceful evening, dinner together, quiet moments..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-[#121215] text-white border border-zinc-700 text-xs font-medium focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 outline-none placeholder-zinc-500"
            />
          </div>

          {/* Main Content Area */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1">
              What happened today? *
            </label>
            <textarea
              required
              rows={7}
              placeholder="Write your thoughts, feelings, gratitude, or things you want to remember..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3.5 py-3 rounded-xl bg-[#121215] text-white border border-zinc-700 text-sm leading-relaxed focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 outline-none resize-none font-sans placeholder-zinc-500"
            />
          </div>

          {/* Row: Location */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1">
              Location / Context (Optional)
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="e.g. Home, Walk in the park, Coffee shop..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#121215] text-white border border-zinc-700 text-xs focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 outline-none placeholder-zinc-500"
              />
            </div>
          </div>

          {/* Photos & Memories Upload Section */}
          <div className="space-y-2 pt-2 border-t border-zinc-800">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-amber-400" />
                <span>Photos & Memories ({photos.length})</span>
              </label>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingPhoto}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-200 border border-zinc-700 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
              >
                <Camera className="w-3.5 h-3.5 text-amber-400" />
                <span>{isProcessingPhoto ? 'Compressing...' : 'Add Photos'}</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>

            {/* Photo Previews Grid */}
            {photos.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 pt-1">
                {photos.map((photoUrl, idx) => (
                  <div
                    key={idx}
                    className="relative group rounded-xl overflow-hidden border border-zinc-700 aspect-square bg-zinc-900 shadow-xs"
                  >
                    <img
                      src={photoUrl}
                      alt={`Memory ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      className="absolute top-1 right-1 p-1 bg-black/75 hover:bg-rose-600 text-white rounded-full transition-colors"
                      title="Remove photo"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-zinc-500 italic">
                No photos attached yet. Tap 'Add Photos' to upload memories from your gallery or camera.
              </p>
            )}
          </div>

          {/* Submit Actions */}
          <div className="pt-4 border-t border-zinc-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 active:scale-95 text-zinc-950 rounded-xl text-xs font-bold shadow-md shadow-amber-400/20 transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{initialEntry ? 'Save Changes' : 'Save Diary Entry'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

