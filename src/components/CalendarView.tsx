import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus } from 'lucide-react';
import { ImportantEvent } from '../types';
import { EventCard, getCategoryBadge } from './EventCard';

interface CalendarViewProps {
  events: ImportantEvent[];
  onEdit: (event: ImportantEvent) => void;
  onDelete: (id: string) => void;
  onOpenAddModal: () => void;
  onOpenAI?: (event: ImportantEvent) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  onEdit,
  onDelete,
  onOpenAddModal,
  onOpenAI,
}) => {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(() => new Date().getDate());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const eventsInThisMonth = events.filter((ev) => {
    const parts = ev.date.split('-');
    const evMonth = parseInt(parts[1], 10) - 1;
    const evYear = parseInt(parts[0], 10);

    if (ev.recurrence === 'none') {
      return evMonth === month && evYear === year;
    }
    return evMonth === month;
  });

  const eventsByDay: { [day: number]: ImportantEvent[] } = {};
  eventsInThisMonth.forEach((ev) => {
    const parts = ev.date.split('-');
    const evDay = parseInt(parts[2], 10);
    if (!eventsByDay[evDay]) eventsByDay[evDay] = [];
    eventsByDay[evDay].push(ev);
  });

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDay(null);
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDay(today.getDate());
  };

  const selectedDayEvents = selectedDay && eventsByDay[selectedDay] ? eventsByDay[selectedDay] : [];

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  return (
    <div className="space-y-6">
      {/* Month Navigation Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-50 rounded-2xl text-brand-600">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {monthNames[month]} <span className="text-slate-400 font-normal">{year}</span>
              </h2>
              <p className="text-xs text-slate-500">
                {eventsInThisMonth.length} important date{eventsInThisMonth.length !== 1 ? 's' : ''} this month
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToday}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Today
            </button>
            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 hover:bg-white rounded-lg text-slate-600 transition-colors"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1.5 hover:bg-white rounded-lg text-slate-600 transition-colors"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Date</span>
            </button>
          </div>
        </div>

        {/* Days of week */}
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="text-xs font-semibold text-slate-400 py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {Array.from({ length: firstDayIndex }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[50px] sm:min-h-[70px] bg-slate-50/50 rounded-xl border border-transparent" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dayEvents = eventsByDay[dayNum] || [];
            const isToday = isCurrentMonth && today.getDate() === dayNum;
            const isSelected = selectedDay === dayNum;

            return (
              <div
                key={dayNum}
                onClick={() => setSelectedDay(dayNum)}
                className={`min-h-[50px] sm:min-h-[70px] p-1.5 sm:p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-brand-500 ring-2 ring-brand-200 bg-brand-50/40 shadow-sm'
                    : isToday
                    ? 'border-rose-300 bg-rose-50/30'
                    : dayEvents.length > 0
                    ? 'border-slate-200 hover:border-brand-300 bg-white'
                    : 'border-slate-100 hover:border-slate-200 bg-white/70'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-semibold rounded-full w-6 h-6 flex items-center justify-center ${
                      isToday
                        ? 'bg-rose-500 text-white font-bold'
                        : isSelected
                        ? 'bg-brand-600 text-white'
                        : 'text-slate-700'
                    }`}
                  >
                    {dayNum}
                  </span>

                  {dayEvents.length > 0 && (
                    <span className="hidden sm:inline-block text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600">
                      {dayEvents.length}
                    </span>
                  )}
                </div>

                <div className="mt-1 flex flex-wrap gap-1">
                  {dayEvents.slice(0, 3).map((ev) => {
                    const badge = getCategoryBadge(ev.category);
                    return (
                      <span
                        key={ev.id}
                        className={`w-2 h-2 rounded-full ${badge.badgeColor}`}
                        title={`${ev.title} (${ev.category})`}
                      />
                    );
                  })}
                  {dayEvents.length > 3 && (
                    <span className="text-[9px] text-slate-400 font-bold leading-none">+{dayEvents.length - 3}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day or Month Overview List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">
            {selectedDay
              ? `Dates on ${monthNames[month]} ${selectedDay}`
              : `All Dates in ${monthNames[month]}`}
          </h3>
          {selectedDay && (
            <button
              onClick={() => setSelectedDay(null)}
              className="text-xs text-brand-600 hover:underline"
            >
              Show all month
            </button>
          )}
        </div>

        {selectedDay ? (
          selectedDayEvents.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
              No events scheduled for {monthNames[month]} {selectedDay}.
              <div className="mt-3">
                <button
                  onClick={onOpenAddModal}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
                >
                  + Add date for this day
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedDayEvents.map((ev) => (
                <EventCard 
                  key={ev.id} 
                  event={ev} 
                  onEdit={onEdit} 
                  onDelete={onDelete} 
                  onOpenAI={onOpenAI}
                />
              ))}
            </div>
          )
        ) : (
          eventsInThisMonth.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
              No events in {monthNames[month]} {year}.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {eventsInThisMonth.map((ev) => (
                <EventCard 
                  key={ev.id} 
                  event={ev} 
                  onEdit={onEdit} 
                  onDelete={onDelete} 
                  onOpenAI={onOpenAI}
                />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
};
