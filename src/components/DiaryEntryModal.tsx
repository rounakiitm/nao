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
}) => {
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<DiaryMood>('peaceful');
  const [location, setLocation] = useState('');
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
      setPhotos(initialEntry.photos || []);
    } else {
      setDate(defaultDate || new Date().toISOString().slice(0, 10));
      setTitle('');
      setContent('');
      setMood('peaceful');
      setLocation('');
      setPhotos([]);
    }
  }, [initialEntry, defaultDate, isOpen]);

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
      photos,
      created_at: initialEntry ? initialEntry.created_at : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    onSave(entry);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-100 animate-in fade-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <span className="text-xl">📖</span>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {initialEntry ? 'Edit Diary Entry' : 'New Daily Diary Entry'}
              </h2>
              <p className="text-[11px] text-slate-500">Record your thoughts, memories & photos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[78vh] overflow-y-auto">
          
          {/* Row 1: Date & Mood */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Diary Date *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
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
                        ? 'bg-purple-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Title / Highlight (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Peaceful rainy evening, family dinner, completed milestone..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>

          {/* Main Content Area */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              What happened today? *
            </label>
            <textarea
              required
              rows={7}
              placeholder="Write your day's journey, reflections, feelings, gratitude, or things you want to remember..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm leading-relaxed focus:ring-2 focus:ring-purple-500 outline-none resize-none font-sans"
            />
          </div>

          {/* Row: Location */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Location / Context (Optional)
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="e.g. IIT Madras, Home, Coffee shop..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
          </div>

          {/* Photos & Memories Upload Section */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-purple-600" />
                <span>Photos & Memories ({photos.length})</span>
              </label>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingPhoto}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
              >
                <Camera className="w-3.5 h-3.5 text-purple-700" />
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
                    className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-square bg-slate-100 shadow-xs"
                  >
                    <img
                      src={photoUrl}
                      alt={`Memory ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-rose-600 text-white rounded-full transition-colors opacity-90 sm:opacity-0 sm:group-hover:opacity-100"
                      title="Remove photo"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 italic">
                No photos attached yet. Tap 'Add Photos' to upload memories from your gallery or camera.
              </p>
            )}
          </div>

          {/* Submit Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-950/20 transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 text-amber-400" />
              <span>{initialEntry ? 'Save Changes' : 'Save Diary Entry'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

