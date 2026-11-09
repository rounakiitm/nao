import React, { useState, useEffect } from 'react';
import { X, Calendar, User, Heart, Lock, Share2, Bell, FileText } from 'lucide-react';
import { ImportantEvent, EventCategory, RecurrenceType, VisibilityType } from '../types';
import { getCategoryBadge } from './EventCard';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: ImportantEvent) => void;
  initialEvent?: ImportantEvent | null;
}

const CATEGORIES: EventCategory[] = [
  'Birthday',
  'Anniversary',
  'Memorial',
  'Relationship',
  'Milestone',
  'Custom'
];

const REMINDER_OPTIONS = [
  { value: 0, label: 'On the day' },
  { value: 1, label: '1 day before' },
  { value: 3, label: '3 days before' },
  { value: 7, label: '1 week before' },
  { value: 14, label: '2 weeks before' },
];

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialEvent,
}) => {
  const [category, setCategory] = useState<EventCategory>('Birthday');
  const [title, setTitle] = useState('');
  const [personName, setPersonName] = useState('');
  const [date, setDate] = useState('');
  const [yearKnown, setYearKnown] = useState(true);
  const [recurrence, setRecurrence] = useState<RecurrenceType>('yearly');
  const [visibility, setVisibility] = useState<VisibilityType>('shared');
  const [relationship, setRelationship] = useState('Family');
  const [notes, setNotes] = useState('');
  const [reminderOffsets, setReminderOffsets] = useState<number[]>([1, 0]);

  useEffect(() => {
    if (initialEvent) {
      setCategory(initialEvent.category);
      setTitle(initialEvent.title);
      setPersonName(initialEvent.person_name || '');
      setDate(initialEvent.date);
      setYearKnown(initialEvent.year_known);
      setRecurrence(initialEvent.recurrence);
      setVisibility(initialEvent.visibility);
      setRelationship(initialEvent.relationship || 'Family');
      setNotes(initialEvent.notes || '');
      setReminderOffsets(initialEvent.reminder_offsets || [1, 0]);
    } else {
      // Defaults for new event
      setCategory('Birthday');
      setTitle('');
      setPersonName('');
      setDate(new Date().toISOString().slice(0, 10));
      setYearKnown(true);
      setRecurrence('yearly');
      setVisibility('shared');
      setRelationship('Family');
      setNotes('');
      setReminderOffsets([1, 0]);
    }
  }, [initialEvent, isOpen]);

  if (!isOpen) return null;

  const toggleReminderOffset = (offset: number) => {
    if (reminderOffsets.includes(offset)) {
      setReminderOffsets(reminderOffsets.filter(o => o !== offset));
    } else {
      setReminderOffsets([...reminderOffsets, offset].sort((a, b) => b - a));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;

    const eventPayload: ImportantEvent = {
      id: initialEvent ? initialEvent.id : `evt-${Date.now()}`,
      title: title.trim(),
      person_name: personName.trim() || undefined,
      category,
      date,
      year_known: yearKnown,
      recurrence,
      visibility,
      relationship: relationship.trim() || undefined,
      notes: notes.trim() || undefined,
      reminder_offsets: reminderOffsets.length > 0 ? reminderOffsets : [0],
      created_at: initialEvent ? initialEvent.created_at : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    onSave(eventPayload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in fade-in duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {initialEvent ? 'Edit Important Date' : 'Add Important Date'}
            </h2>
            <p className="text-xs text-slate-500">Record and set reminders for this milestone</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          
          {/* Category selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Category
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => {
                const badge = getCategoryBadge(cat);
                const Icon = badge.icon;
                const isSelected = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-medium border transition-all ${
                      isSelected
                        ? `${badge.bg} ring-2 ring-brand-500 border-brand-500 shadow-sm font-bold`
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title / Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Title / Event Name *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Mom's Birthday, Wedding Anniversary"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>

          {/* Person Name & Relationship */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Person's Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  placeholder="e.g. Sarah, Dad"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Relationship / Tag
              </label>
              <input
                type="text"
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                placeholder="Family, Friend, Work"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Date Picker & Year Unknown Checkbox */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Event Date *
              </label>
              <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!yearKnown}
                  onChange={(e) => setYearKnown(!e.target.checked)}
                  className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                Year unknown / keep secret
              </label>
            </div>

            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            {!yearKnown && (
              <p className="text-[11px] text-slate-500">
                Reminders will still recur every year on this month & day, but age/milestone numbers won't be calculated.
              </p>
            )}
          </div>

          {/* Recurrence & Visibility */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Recurrence
              </label>
              <select
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value as RecurrenceType)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="yearly">Every year (Annual)</option>
                <option value="none">One-time event (No repeat)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Visibility
              </label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as VisibilityType)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="shared">Shared with invited members</option>
                <option value="private">Private (Owner only)</option>
              </select>
            </div>
          </div>

          {/* Reminder Offsets */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Bell className="w-3.5 h-3.5 text-brand-600" />
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Reminder Alerts
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              {REMINDER_OPTIONS.map((opt) => {
                const isChecked = reminderOffsets.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleReminderOffset(opt.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      isChecked
                        ? 'bg-brand-50 text-brand-700 border-brand-300 font-semibold'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {isChecked ? '✓ ' : '+ '}
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes & Wishes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Personal Notes / Gift Ideas
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Gift ideas, memorable memories, preferences..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Submit Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 active:bg-brand-800 rounded-xl shadow-sm transition-all"
            >
              {initialEvent ? 'Save Changes' : 'Create Date'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
