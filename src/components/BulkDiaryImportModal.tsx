import React, { useState, useMemo } from 'react';
import { 
  X, 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  HelpCircle, 
  ChevronRight,
  Trash2,
  Calendar,
  Layers
} from 'lucide-react';
import { parseBulkDiaryText, ParsedBulkEntry, convertToDiaryEntries } from '../lib/bulkDiaryParser';
import { saveAllDiaryEntries, getStoredDiaryEntries } from '../lib/diaryStorage';
import { DiaryEntry } from '../types';

interface BulkDiaryImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (count: number) => void;
}

export const BulkDiaryImportModal: React.FC<BulkDiaryImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
}) => {
  const [inputText, setInputText] = useState('');
  const [showGuide, setShowGuide] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedEntries, setSelectedEntries] = useState<Record<number, boolean>>({});

  // Parse text dynamically
  const parsedResults = useMemo(() => {
    if (!inputText.trim()) return [];
    return parseBulkDiaryText(inputText);
  }, [inputText]);

  // Keep track of which ones are selected (default: all valid ones)
  React.useEffect(() => {
    const initial: Record<number, boolean> = {};
    parsedResults.forEach((entry, idx) => {
      if (entry.isValid) initial[idx] = true;
    });
    setSelectedEntries(initial);
  }, [parsedResults]);

  if (!isOpen) return null;

  const validCount = parsedResults.filter((p, idx) => p.isValid && selectedEntries[idx] !== false).length;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setInputText(content);
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    setIsProcessing(true);
    try {
      const chosen = parsedResults.filter((_, idx) => selectedEntries[idx] !== false);
      const newEntries = convertToDiaryEntries(chosen);
      
      const current = getStoredDiaryEntries();
      const map = new Map<string, DiaryEntry>();
      
      // Preserve existing
      current.forEach((e) => map.set(e.date, e));
      // Overwrite or append imported
      newEntries.forEach((e) => map.set(e.date, e));

      const merged = Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
      saveAllDiaryEntries(merged);

      onImportComplete(newEntries.length);
      onClose();
    } catch (err) {
      console.error('Import failed', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleSelect = (idx: number) => {
    setSelectedEntries((prev) => ({
      ...prev,
      [idx]: prev[idx] === false ? true : false,
    }));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-purple-950 via-indigo-950 to-purple-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-300">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2">
                <span>Smart Bulk Diary Importer</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-amber-400/20 text-amber-300 rounded-full border border-amber-400/30">
                  250+ Days Batch
                </span>
              </h3>
              <p className="text-xs text-purple-200/80">
                Paste your entire notes document or upload a file. nao auto-detects dates and formats each day!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* Quick Guide Toggle */}
          <div className="bg-purple-50/60 border border-purple-200/80 rounded-2xl p-4">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowGuide(!showGuide)}>
              <div className="flex items-center gap-2 text-xs font-bold text-purple-950">
                <HelpCircle className="w-4 h-4 text-purple-600" />
                <span>OnePlus 13R (OnePlus Notes) 1-minute export steps:</span>
              </div>
              <span className="text-xs text-purple-700 underline font-medium">
                {showGuide ? 'Hide instructions' : 'View OnePlus 13R instructions'}
              </span>
            </div>

            {showGuide && (
              <div className="mt-3 pt-3 border-t border-purple-200/60 text-xs text-slate-700 space-y-2">
                <p className="font-semibold text-purple-900">📱 OnePlus 13R (OxygenOS Notes) Options:</p>
                <div className="space-y-2 pl-1">
                  <div className="p-2 bg-white rounded-xl border border-purple-200">
                    <p className="font-bold text-slate-900">Option A: If your diary is in one or a few running notes</p>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Open the note in OnePlus Notes → tap the <strong>Share</strong> icon (or 3 dots ⋮) → tap <strong>"Share as text"</strong> → Copy all and paste into the box below!
                    </p>
                  </div>

                  <div className="p-2 bg-white rounded-xl border border-purple-200">
                    <p className="font-bold text-slate-900">Option B: If you have 250 separate notes (Built-in OxygenOS Backup)</p>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Go to your phone <strong>Settings → Additional Settings → Back up and reset → Back up & migrate → Local backup</strong>. Tap <em>New backup</em>, select <strong>Notes only</strong>, and tap Start. Then upload that backup file directly using the button above!
                    </p>
                  </div>

                  <div className="p-2 bg-white rounded-xl border border-purple-200">
                    <p className="font-bold text-slate-900">Option C: OnePlus Cloud (cloud.heytap.com)</p>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      If Cloud Sync is turned on in your OnePlus Notes, all notes are available at <strong>cloud.heytap.com</strong> on any browser, where you can copy them effortlessly.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Text Input Area */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-purple-700" />
                <span>Paste All Notes Text Below:</span>
              </label>
              
              {/* File upload shortcut */}
              <label className="text-xs font-semibold text-purple-700 hover:text-purple-900 cursor-pointer flex items-center gap-1">
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Or upload .txt / .md / .json</span>
                <input
                  type="file"
                  accept=".txt,.md,.json,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste your 250 days of notes here...&#10;&#10;Example:&#10;12-04-2024&#10;Today was a memorable day at IIT Madras...&#10;---&#10;13-04-2024&#10;Went for an evening walk and reflected on future milestones..."
              rows={8}
              className="w-full text-xs font-mono p-3.5 rounded-2xl border border-slate-300 focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all leading-relaxed placeholder:text-slate-400"
            />
          </div>

          {/* Parsing Results Summary */}
          {parsedResults.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold text-slate-900">
                    Recognized {parsedResults.length} diary entries!
                  </span>
                  <span className="text-xs text-slate-500">
                    ({validCount} selected for import)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const all: Record<number, boolean> = {};
                      parsedResults.forEach((_, i) => (all[i] = true));
                      setSelectedEntries(all);
                    }}
                    className="text-[11px] font-semibold text-purple-700 hover:underline"
                  >
                    Select All
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    onClick={() => setSelectedEntries({})}
                    className="text-[11px] font-semibold text-slate-500 hover:underline"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              {/* Preview List */}
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1 border border-slate-200 rounded-2xl p-2 bg-slate-50/50">
                {parsedResults.map((item, idx) => {
                  const isChecked = selectedEntries[idx] !== false;
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleSelect(idx)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                        isChecked
                          ? 'bg-white border-purple-200 shadow-xs'
                          : 'bg-slate-100 border-slate-200 opacity-60'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSelect(idx)}
                        className="mt-1 rounded text-purple-600 focus:ring-purple-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-purple-950 font-mono">
                            <Calendar className="w-3 h-3 text-purple-600" />
                            {item.date}
                          </span>
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {item.mood}
                          </span>
                        </div>
                        {item.title && (
                          <h4 className="text-xs font-bold text-slate-900 truncate mt-0.5">
                            {item.title}
                          </h4>
                        )}
                        <p className="text-xs text-slate-600 line-clamp-2 mt-1">
                          {item.content}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={() => {
              setInputText('');
              onClose();
            }}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            Cancel
          </button>

          <button
            onClick={handleConfirmImport}
            disabled={validCount === 0 || isProcessing}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold shadow-md flex items-center gap-2 transition-all ${
              validCount > 0 && !isProcessing
                ? 'bg-purple-950 hover:bg-purple-900 text-white shadow-purple-950/20 active:scale-95'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
            <span>
              {isProcessing
                ? 'Importing...'
                : `Import All ${validCount} Days Into nao Vault`}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
};

