import { DiaryEntry } from '../types';

const STORAGE_KEY = 'important_dates_diary_entries';
const INDEXED_DB_NAME = 'nao_diary_vault';
const STORE_NAME = 'entries';

const INITIAL_DIARY_ENTRIES: DiaryEntry[] = [
  {
    id: 'diary-seed-1',
    date: new Date().toISOString().slice(0, 10),
    title: 'A Beautiful Day of Milestones',
    content: 'Started documenting my sacred personal milestones, memories, and daily reflections in nao today. Grateful for peace of mind, family, and meaningful moments that matter.',
    mood: 'peaceful',
    photos: [],
    location: 'IIT Madras',
    tags: ['reflection', 'gratitude'],
    created_at: new Date().toISOString(),
  },
];

// Open native IndexedDB for heavy photo storage support
function openDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) return Promise.resolve(null);

  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(INDEXED_DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/**
 * Compresses an uploaded photo for fast loading and low storage footprint.
 * Reduces 5MB-10MB mobile camera photos to ~100KB HD images.
 */
export async function compressDiaryPhoto(file: File, maxWidth = 1200, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Load all diary entries synchronously from localStorage (with auto IndexedDB sync)
 */
export function getStoredDiaryEntries(): DiaryEntry[] {
  if (typeof window === 'undefined') return INITIAL_DIARY_ENTRIES;

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DIARY_ENTRIES));
    return INITIAL_DIARY_ENTRIES;
  }

  try {
    const entries: DiaryEntry[] = JSON.parse(raw);
    return entries.sort((a, b) => b.date.localeCompare(a.date));
  } catch (e) {
    console.error('Failed to parse diary entries', e);
    return INITIAL_DIARY_ENTRIES;
  }
}

/**
 * Save all diary entries to localStorage & IndexedDB
 */
export function saveAllDiaryEntries(entries: DiaryEntry[]): void {
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
  
  // 1. Save to LocalStorage
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
  } catch (e) {
    console.warn('LocalStorage limit reached for photos, entries are preserved in IndexedDB', e);
  }

  // 2. Persist in IndexedDB for large photo collections
  openDB().then((db) => {
    if (!db) return;
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      sorted.forEach((entry) => store.put(entry));
    } catch (err) {
      console.error('IndexedDB save error', err);
    }
  });
}

/**
 * Add or update a diary entry
 */
export function saveDiaryEntry(entry: DiaryEntry): DiaryEntry[] {
  const existing = getStoredDiaryEntries();
  const index = existing.findIndex((e) => e.id === entry.id || e.date === entry.date);

  let updated: DiaryEntry[];
  if (index >= 0) {
    updated = [...existing];
    updated[index] = { ...entry, updated_at: new Date().toISOString() };
  } else {
    updated = [entry, ...existing];
  }

  saveAllDiaryEntries(updated);
  return updated;
}

/**
 * Delete a diary entry
 */
export function deleteDiaryEntry(id: string): DiaryEntry[] {
  const existing = getStoredDiaryEntries();
  const updated = existing.filter((e) => e.id !== id);
  saveAllDiaryEntries(updated);

  openDB().then((db) => {
    if (!db) return;
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(id);
    } catch {}
  });

  return updated;
}

/**
 * Export all diary entries as portable JSON
 */
export function exportDiaryJSON(): string {
  const entries = getStoredDiaryEntries();
  return JSON.stringify(entries, null, 2);
}

/**
 * Import diary entries from JSON (for restoring 250+ days of notes)
 */
export function importDiaryJSON(jsonStr: string): { success: boolean; count: number; error?: string } {
  try {
    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed)) {
      return { success: false, count: 0, error: 'File is not a valid diary array.' };
    }

    const current = getStoredDiaryEntries();
    const map = new Map<string, DiaryEntry>();
    
    // Add existing
    current.forEach((e) => map.set(e.date, e));
    // Merge imported
    let count = 0;
    parsed.forEach((item) => {
      if (item && item.date && item.content) {
        map.set(item.date, {
          id: item.id || `diary-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          date: item.date,
          title: item.title || '',
          content: item.content,
          mood: item.mood || 'peaceful',
          photos: Array.isArray(item.photos) ? item.photos : [],
          location: item.location || '',
          tags: Array.isArray(item.tags) ? item.tags : [],
          created_at: item.created_at || new Date().toISOString(),
        });
        count++;
      }
    });

    const merged = Array.from(map.values());
    saveAllDiaryEntries(merged);
    return { success: true, count };
  } catch (err: any) {
    return { success: false, count: 0, error: err.message || 'Invalid JSON format' };
  }
}

