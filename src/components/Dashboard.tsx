import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Sparkles, 
  Search, 
  Plus, 
  Filter, 
  Calendar, 
  Cake, 
  Heart, 
  Award, 
  Clock, 
  Lock, 
  Share2,
  CalendarHeart
} from 'lucide-react';
import { ImportantEvent, EventCategory } from '../types';
import { EventCard } from './EventCard';
import { getNextOccurrence } from '../lib/dateUtils';

interface DashboardProps {
  events: ImportantEvent[];
  onEdit: (event: ImportantEvent) => void;
  onDelete: (id: string) => void;
  onOpenAddModal: () => void;
  onSwitchToCalendar: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  events,
  onEdit,
  onDelete,
  onOpenAddModal,
  onSwitchToCalendar,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'shared' | 'private'>('all');

  // Compute occurrences
  const now = new Date();
  const eventsWithOcc = events.map(ev => ({
    event: ev,
    occ: getNextOccurrence(ev, now)
  }));

  // Today's events
  const todayEvents = eventsWithOcc.filter(item => item.occ.isToday);

  // Trigger celebration confetti if today has events
  useEffect(() => {
    if (todayEvents.length > 0) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#026bc7', '#f43f5e', '#f59e0b', '#10b981']
      });
    }
  }, [todayEvents.length]);

  // Upcoming in next 30 days (excluding today)
  const upcomingNext30 = eventsWithOcc
    .filter(item => !item.occ.isToday && item.occ.daysRemaining > 0 && item.occ.daysRemaining <= 30)
    .sort((a, b) => a.occ.daysRemaining - b.occ.daysRemaining);

  // All upcoming events sorted by days remaining
  const allSorted = [...eventsWithOcc]
    .sort((a, b) => a.occ.daysRemaining - b.occ.daysRemaining);

  // Filtered list
  const filteredEvents = allSorted.filter(({ event }) => {
    // Search query matching
    const matchesQuery = 
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (event.person_name && event.person_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (event.relationship && event.relationship.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (event.notes && event.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    // Category matching
    const matchesCategory = selectedCategory === 'all' || event.category === selectedCategory;

    // Visibility matching
    const matchesVisibility = visibilityFilter === 'all' || event.visibility === visibilityFilter;

    return matchesQuery && matchesCategory && matchesVisibility;
  });

  return (
    <div className="space-y-8">
      {/* Hero / Quick Stats Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-brand-700 via-brand-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-brand-900/10">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-brand-100">
              <CalendarHeart className="w-3.5 h-3.5 text-rose-300" />
              <span>Sacred Personal Vault</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Never miss a moment that matters.
            </h2>
            <p className="text-sm text-brand-100 leading-relaxed">
              Separated entirely from your work and class calendars. Kept private, peaceful, and shared only with loved ones.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 bg-white/10 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-white/15">
            <div className="text-center">
              <span className="block text-2xl font-black">{todayEvents.length}</span>
              <span className="text-[11px] text-brand-100 font-medium">Today</span>
            </div>
            <div className="text-center border-x border-white/20 px-2 sm:px-4">
              <span className="block text-2xl font-black">{upcomingNext30.length}</span>
              <span className="text-[11px] text-brand-100 font-medium">Next 30 Days</span>
            </div>
            <div className="text-center">
              <span className="block text-2xl font-black">{events.length}</span>
              <span className="text-[11px] text-brand-100 font-medium">Total Dates</span>
            </div>
          </div>
        </div>

        {/* Decorative circle glow */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      </div>

      {/* TODAY'S CELEBRATION SECTION (If any) */}
      {todayEvents.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-rose-100 text-rose-600 rounded-lg">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Happening Today! 🎉</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {todayEvents.map(({ event }) => (
              <EventCard key={event.id} event={event} onEdit={onEdit} onDelete={onDelete} />
            ))}
          </div>
        </section>
      )}

      {/* UPCOMING IN NEXT 30 DAYS */}
      {upcomingNext30.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-brand-100 text-brand-600 rounded-lg">
                <Clock className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Coming Up in the Next 30 Days</h3>
            </div>
            <button
              onClick={onSwitchToCalendar}
              className="text-xs font-semibold text-brand-600 hover:text-brand-800 flex items-center gap-1"
            >
              <span>View in calendar</span>
              <Calendar className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingNext30.map(({ event }) => (
              <EventCard key={event.id} event={event} onEdit={onEdit} onDelete={onDelete} />
            ))}
          </div>
        </section>
      )}

      {/* SEARCH AND FILTERS BAR */}
      <section className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, title, or notes..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
            />
          </div>

          {/* Visibility toggle buttons */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl self-start sm:self-auto">
            <button
              onClick={() => setVisibilityFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-all ${
                visibilityFilter === 'all' ? 'bg-white shadow text-slate-900' : 'text-slate-600'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setVisibilityFilter('shared')}
              className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-all flex items-center gap-1 ${
                visibilityFilter === 'shared' ? 'bg-white shadow text-slate-900' : 'text-slate-600'
              }`}
            >
              <Share2 className="w-3 h-3 text-emerald-600" />
              Shared
            </button>
            <button
              onClick={() => setVisibilityFilter('private')}
              className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-all flex items-center gap-1 ${
                visibilityFilter === 'private' ? 'bg-white shadow text-slate-900' : 'text-slate-600'
              }`}
            >
              <Lock className="w-3 h-3 text-slate-500" />
              Private
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: 'All Categories' },
            { id: 'Birthday', label: '🎂 Birthdays' },
            { id: 'Anniversary', label: '💍 Anniversaries' },
            { id: 'Memorial', label: '🕊️ Memorials' },
            { id: 'Milestone', label: '🏆 Milestones' },
            { id: 'Relationship', label: '💖 Relationship' },
            { id: 'Custom', label: '📌 Custom' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
                selectedCategory === cat.id
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Filtered Events List */}
        <div className="pt-2">
          {filteredEvents.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <Search className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-800">No dates found</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {searchQuery
                    ? `No events match "${searchQuery}". Try a different keyword.`
                    : 'No dates match the selected category or filter.'}
                </p>
              </div>
              <button
                onClick={onOpenAddModal}
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-xs font-semibold rounded-xl hover:bg-brand-700 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Date Now</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEvents.map(({ event }) => (
                <EventCard key={event.id} event={event} onEdit={onEdit} onDelete={onDelete} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
