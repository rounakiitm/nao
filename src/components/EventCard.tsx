import React from 'react';
import { 
  Cake, 
  Heart, 
  Award, 
  Bookmark, 
  Sparkles, 
  Calendar as CalendarIcon, 
  Clock, 
  Lock, 
  Share2, 
  MoreVertical, 
  Pencil, 
  Trash2,
  Copy,
  Check,
  MessageCircle
} from 'lucide-react';
import { ImportantEvent, EventCategory } from '../types';
import { getNextOccurrence, getMilestoneLabel, formatDisplayDate } from '../lib/dateUtils';

interface EventCardProps {
  event: ImportantEvent;
  onEdit: (event: ImportantEvent) => void;
  onDelete: (id: string) => void;
  canEdit?: boolean;
}

export const getCategoryBadge = (category: EventCategory) => {
  switch (category) {
    case 'Birthday':
      return {
        icon: Cake,
        bg: 'bg-rose-50 text-rose-700 border-rose-200',
        badgeColor: 'bg-rose-500',
        label: 'Birthday'
      };
    case 'Anniversary':
      return {
        icon: Heart,
        bg: 'bg-purple-50 text-purple-700 border-purple-200',
        badgeColor: 'bg-purple-500',
        label: 'Anniversary'
      };
    case 'Memorial':
      return {
        icon: Sparkles,
        bg: 'bg-slate-100 text-slate-700 border-slate-300',
        badgeColor: 'bg-slate-500',
        label: 'Memorial'
      };
    case 'Relationship':
      return {
        icon: Heart,
        bg: 'bg-pink-50 text-pink-700 border-pink-200',
        badgeColor: 'bg-pink-500',
        label: 'Relationship'
      };
    case 'Milestone':
      return {
        icon: Award,
        bg: 'bg-amber-50 text-amber-700 border-amber-200',
        badgeColor: 'bg-amber-500',
        label: 'Milestone'
      };
    case 'Custom':
    default:
      return {
        icon: Bookmark,
        bg: 'bg-blue-50 text-blue-700 border-blue-200',
        badgeColor: 'bg-blue-500',
        label: 'Custom'
      };
  }
};

export const EventCard: React.FC<EventCardProps> = ({ event, onEdit, onDelete, canEdit = true }) => {
  const [showMenu, setShowMenu] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const occ = getNextOccurrence(event);
  const milestone = getMilestoneLabel(event, occ.yearsCount);
  const catInfo = getCategoryBadge(event.category);
  const IconComponent = catInfo.icon;

  const getGreetingMessage = () => {
    if (event.category === 'Birthday') {
      return `Happy Birthday ${event.person_name || event.title}! Wishing you great joy, health, and a wonderful year ahead! 🎉🎂`;
    }
    if (event.category === 'Anniversary') {
      return `Happy Anniversary ${event.person_name || event.title}! Wishing you many more years of togetherness and happiness! 💍🥂`;
    }
    return `Thinking of ${event.title} today with warmest thoughts and fondest memories. ❤️`;
  };

  const handleCopyText = () => {
    const text = `${event.title} is on ${occ.nextDate.toLocaleDateString(undefined, {
      month: 'long',
      day: 'numeric'
    })}${milestone ? ` (${milestone})` : ''}! Don't forget! ❤️`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setShowMenu(false);
  };

  const handleWhatsAppShare = () => {
    const msg = encodeURIComponent(getGreetingMessage());
    window.open(`https://api.whatsapp.com/send?text=${msg}`, '_blank');
    setShowMenu(false);
  };

  return (
    <div 
      className={`group relative bg-white rounded-2xl border transition-all duration-200 p-5 ${
        occ.isToday 
          ? 'border-rose-400 ring-2 ring-rose-200 shadow-lg shadow-rose-100/50 bg-gradient-to-b from-rose-50/30 to-white' 
          : occ.isTomorrow
          ? 'border-amber-300 shadow-md shadow-amber-50'
          : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
      }`}
    >
      {/* Top row: Category, Privacy, and Context Menu */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${catInfo.bg}`}>
            <IconComponent className="w-3.5 h-3.5" />
            {catInfo.label}
          </span>

          {event.relationship && (
            <span className="text-[11px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-medium">
              {event.relationship}
            </span>
          )}

          {event.visibility === 'private' ? (
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-medium" title="Only visible to owner">
              <Lock className="w-3 h-3 text-slate-400" />
              Private
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium" title="Shared with invited people">
              <Share2 className="w-3 h-3" />
              Shared
            </span>
          )}
        </div>

        {/* Menu Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            title="Options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-20 text-xs">
              <button
                onClick={handleWhatsAppShare}
                className="w-full text-left px-3 py-2 text-emerald-700 hover:bg-emerald-50 flex items-center gap-2"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" /> Wish on WhatsApp
              </button>
              
              <button
                onClick={handleCopyText}
                className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy reminder text'}
              </button>

              {canEdit && (
                <>
                  <button
                    onClick={() => { setShowMenu(false); onEdit(event); }}
                    className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 border-t border-slate-100"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => { setShowMenu(false); onDelete(event.id); }}
                    className="w-full text-left px-3 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2 border-t border-slate-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main details */}
      <div className="space-y-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-semibold text-slate-900 group-hover:text-brand-600 transition-colors">
            {event.title}
          </h3>
        </div>

        {event.person_name && event.person_name !== event.title && (
          <p className="text-xs text-slate-500 font-medium">For: {event.person_name}</p>
        )}
      </div>

      {/* Timing and Next Occurrence */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-slate-600">
          <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
          <span>{formatDisplayDate(event.date, event.year_known)}</span>
        </div>

        {/* Days remaining badge */}
        <div>
          {occ.isToday ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-600 text-white animate-pulse shadow-sm shadow-rose-500/30">
              <Sparkles className="w-3 h-3" /> Today! 🎉
            </span>
          ) : occ.isTomorrow ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
              <Clock className="w-3 h-3" /> Tomorrow
            </span>
          ) : occ.daysRemaining > 0 ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
              In {occ.daysRemaining} days
            </span>
          ) : (
            <span className="text-slate-400 text-xs">Past date</span>
          )}
        </div>
      </div>

      {/* Milestone tag (e.g., Turns 26, 5th Anniversary) */}
      {milestone && (
        <div className="mt-2.5 inline-flex items-center gap-1 px-2 py-0.5 bg-brand-50 text-brand-700 rounded-md text-[11px] font-semibold">
          <Sparkles className="w-3 h-3 text-brand-500" />
          {milestone}
        </div>
      )}

      {/* Notes preview */}
      {event.notes && (
        <p className="mt-2.5 text-xs text-slate-500 italic bg-slate-50 p-2 rounded-lg border border-slate-100 line-clamp-2">
          "{event.notes}"
        </p>
      )}
    </div>
  );
};
