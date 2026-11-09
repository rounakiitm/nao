import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  MessageSquare, 
  Gift, 
  Copy, 
  Check, 
  MessageCircle, 
  RefreshCw,
  Wand2 
} from 'lucide-react';
import { ImportantEvent } from '../types';
import { 
  generateLocalWishes, 
  generateLocalGiftIdeas, 
  generateGeminiAIWishes, 
  GeneratedWishes, 
  GiftIdea,
  getGeminiApiKey 
} from '../lib/aiAssistant';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: ImportantEvent | null;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  event,
}) => {
  const [tab, setTab] = useState<'wishes' | 'gifts'>('wishes');
  const [wishes, setWishes] = useState<GeneratedWishes | null>(null);
  const [giftIdeas, setGiftIdeas] = useState<GiftIdea[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const hasGeminiKey = Boolean(getGeminiApiKey());

  const generateContent = async () => {
    if (!event) return;
    setIsLoading(true);

    if (hasGeminiKey) {
      const geminiResult = await generateGeminiAIWishes(event);
      if (geminiResult) {
        setWishes(geminiResult);
      } else {
        setWishes(generateLocalWishes(event));
      }
    } else {
      setWishes(generateLocalWishes(event));
    }

    setGiftIdeas(generateLocalGiftIdeas(event));
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen && event) {
      generateContent();
    }
  }, [isOpen, event]);

  if (!isOpen || !event) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleWhatsApp = (text: string) => {
    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-100 animate-in fade-in duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-white/20 backdrop-blur-md rounded-2xl">
                <Wand2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold">AI Assistant for {event.title}</h2>
                  <span className="text-[10px] px-2 py-0.5 bg-white/20 rounded-full font-bold uppercase tracking-wider">
                    {hasGeminiKey ? 'Gemini AI' : 'Smart Local AI'}
                  </span>
                </div>
                <p className="text-xs text-brand-100">Heartfelt wishes, gift recommendations, and celebrations</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setTab('wishes')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                tab === 'wishes'
                  ? 'bg-white text-slate-900 shadow'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Personalized Wishes</span>
            </button>
            <button
              onClick={() => setTab('gifts')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                tab === 'gifts'
                  ? 'bg-white text-slate-900 shadow'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Gift className="w-3.5 h-3.5" />
              <span>Gift & Plan Ideas</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
          
          {isLoading ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-brand-500" />
              <p className="text-xs">Generating thoughtful recommendations...</p>
            </div>
          ) : tab === 'wishes' && wishes ? (
            <div className="space-y-4">
              {[
                { key: 'heartfelt', title: '💖 Heartfelt & Warm', text: wishes.heartfelt },
                { key: 'playful', title: '😄 Playful & Fun', text: wishes.playful },
                { key: 'short', title: '✨ Short & Sweet', text: wishes.short },
                { key: 'poetic', title: '🌸 Meaningful & Poetic', text: wishes.poetic },
              ].map(({ key, title, text }) => (
                <div key={key} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">{title}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleCopy(text, key)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-medium border border-slate-200 shadow-xs transition-colors"
                      >
                        {copiedKey === key ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                        <span>{copiedKey === key ? 'Copied' : 'Copy'}</span>
                      </button>

                      <button
                        onClick={() => handleWhatsApp(text)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium shadow-xs transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed italic bg-white p-3 rounded-xl border border-slate-100">
                    "{text}"
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {giftIdeas.map((idea, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900">{idea.title}</h4>
                    <span className="text-[10px] px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full font-semibold">
                      {idea.estimatedBudget}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{idea.description}</p>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <span>Powered by Built-in AI • Runs completely offline</span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
