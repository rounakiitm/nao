import React, { useState } from 'react';
import { Search, Plus, ArrowUpDown } from 'lucide-react';
import { ImportantEvent } from '../types';
import { EventCard } from './EventCard';
import { getNextOccurrence } from '../lib/dateUtils';

interface AllDatesViewProps {
  events: ImportantEvent[];
  onEdit: (event: ImportantEvent) => void;
  onDelete: (id: string) => void;
  onOpenAddModal: () => void;
  onOpenAI?: (event: ImportantEvent) => void;
}

export const AllDatesView: React.FC<AllDatesViewProps> = ({
  events,
  onEdit,
  onDelete,
  onOpenAddModal,
  onOpenAI,
}) => {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'days' | 'title' | 'category'>('days');

  const now = new Date();
  const eventsWithOcc = events.map((ev) => ({
    event: ev,
    occ: getNextOccurrence(ev, now),
  }));

  const filtered = eventsWithOcc.filter(({ event }) => {
    const q = search.toLowerCase();
    return (
      event.title.toLowerCase().includes(q) ||
      (event.person_name && event.person_name.toLowerCase().includes(q)) ||
      event.category.toLowerCase().includes(q) ||
      (event.relationship && event.relationship.toLowerCase().includes(q))
    );
  });

  filtered.sort((a, b) => {
    if (sortBy === 'days') {
      return a.occ.daysRemaining - b.occ.daysRemaining;
    }
    if (sortBy === 'title') {
      return a.event.title.localeCompare(b.event.title);
    }
    if (sortBy === 'category') {
      return a.event.category.localeCompare(b.event.category);
    }
    return 0;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter all dates..."
            className="w-full pl-10 pr-4 py-2 rounded-2xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span>Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent font-semibold text-slate-800 outline-none cursor-pointer"
            >
              <option value="days">Next Date (Days)</option>
              <option value="title">Alphabetical</option>
              <option value="category">Category</option>
            </select>
          </div>

          <button
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Add Date</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(({ event }) => (
          <EventCard 
            key={event.id} 
            event={event} 
            onEdit={onEdit} 
            onDelete={onDelete} 
            onOpenAI={onOpenAI}
          />
        ))}
      </div>
    </div>
  );
};
