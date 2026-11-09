import { ImportantEvent, Member, InAppNotification } from '../types';
import { getNextOccurrence } from './dateUtils';

const STORAGE_KEYS = {
  EVENTS: 'important_dates_events',
  MEMBERS: 'important_dates_members',
  CURRENT_USER: 'important_dates_user',
  SETTINGS: 'important_dates_settings',
  NOTIFICATIONS: 'important_dates_notifications',
};

// Initial starter seed data to make the app immediately rich and intuitive
const INITIAL_EVENTS: ImportantEvent[] = [
  {
    id: 'evt-1',
    title: "Mom's Birthday",
    person_name: 'Mom',
    category: 'Birthday',
    date: '1970-05-18',
    year_known: true,
    recurrence: 'yearly',
    visibility: 'shared',
    relationship: 'Family',
    notes: 'Likes yellow roses, send flowers in advance!',
    reminder_offsets: [7, 1, 0],
    created_at: new Date().toISOString(),
  },
  {
    id: 'evt-2',
    title: 'Wedding Anniversary',
    person_name: 'Priya & Rahul',
    category: 'Anniversary',
    date: '2020-11-20',
    year_known: true,
    recurrence: 'yearly',
    visibility: 'shared',
    relationship: 'Family',
    notes: 'Book a nice dinner table.',
    reminder_offsets: [7, 3, 1, 0],
    created_at: new Date().toISOString(),
  },
  {
    id: 'evt-3',
    title: "Grandpa's Remembrance",
    person_name: 'Grandpa',
    category: 'Memorial',
    date: '2015-08-12',
    year_known: true,
    recurrence: 'yearly',
    visibility: 'shared',
    relationship: 'Family',
    notes: 'Light a lamp and offer prayers in morning.',
    reminder_offsets: [1, 0],
    created_at: new Date().toISOString(),
  },
  {
    id: 'evt-4',
    title: 'First Job Offer Anniversary',
    category: 'Milestone',
    date: '2023-01-15',
    year_known: true,
    recurrence: 'yearly',
    visibility: 'private',
    relationship: 'Self',
    notes: 'Personal career milestone.',
    reminder_offsets: [0],
    created_at: new Date().toISOString(),
  }
];

const INITIAL_MEMBERS: Member[] = [
  {
    id: 'mem-1',
    email: 'owner@example.com',
    role: 'owner',
    status: 'active',
    invited_at: new Date().toISOString(),
    accepted_at: new Date().toISOString(),
  }
];

export function getStoredEvents(): ImportantEvent[] {
  const data = localStorage.getItem(STORAGE_KEYS.EVENTS);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(INITIAL_EVENTS));
    return INITIAL_EVENTS;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error('Failed to parse events from storage', e);
    return INITIAL_EVENTS;
  }
}

export function saveEvents(events: ImportantEvent[]): void {
  localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
}

export function addOrUpdateEvent(event: ImportantEvent): ImportantEvent[] {
  const events = getStoredEvents();
  const index = events.findIndex(e => e.id === event.id);
  let updated: ImportantEvent[];
  if (index >= 0) {
    updated = [...events];
    updated[index] = { ...event, updated_at: new Date().toISOString() };
  } else {
    updated = [event, ...events];
  }
  saveEvents(updated);
  return updated;
}

export function deleteEvent(id: string): ImportantEvent[] {
  const events = getStoredEvents();
  const updated = events.filter(e => e.id !== id);
  saveEvents(updated);
  return updated;
}

export function getStoredMembers(): Member[] {
  const data = localStorage.getItem(STORAGE_KEYS.MEMBERS);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(INITIAL_MEMBERS));
    return INITIAL_MEMBERS;
  }
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_MEMBERS;
  }
}

export function saveMembers(members: Member[]): void {
  localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
}

export function inviteMember(email: string): Member[] {
  const members = getStoredMembers();
  const existing = members.find(m => m.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    if (existing.status === 'revoked') {
      existing.status = 'active';
      saveMembers(members);
    }
    return members;
  }
  const newMember: Member = {
    id: `mem-${Date.now()}`,
    email: email.trim().toLowerCase(),
    role: 'member',
    status: 'active',
    invited_at: new Date().toISOString(),
  };
  const updated = [...members, newMember];
  saveMembers(updated);
  return updated;
}

export function revokeMember(id: string): Member[] {
  const members = getStoredMembers();
  const updated = members.map(m => m.id === id ? { ...m, status: 'revoked' as const } : m);
  saveMembers(updated);
  return updated;
}

export function exportBackupJSON(): string {
  const data = {
    app: 'Important Dates',
    version: '1.0.0',
    exported_at: new Date().toISOString(),
    events: getStoredEvents(),
    members: getStoredMembers(),
  };
  return JSON.stringify(data, null, 2);
}

export function importBackupJSON(jsonStr: string): { success: boolean; count?: number; error?: string } {
  try {
    const data = JSON.parse(jsonStr);
    if (!data.events || !Array.isArray(data.events)) {
      return { success: false, error: 'Invalid backup format: missing events array' };
    }
    saveEvents(data.events);
    if (data.members && Array.isArray(data.members)) {
      saveMembers(data.members);
    }
    return { success: true, count: data.events.length };
  } catch (err: any) {
    return { success: false, error: err.message || 'JSON parse error' };
  }
}

export function calculateDueNotifications(events: ImportantEvent[]): InAppNotification[] {
  const notifications: InAppNotification[] = [];
  const now = new Date();

  for (const event of events) {
    const occ = getNextOccurrence(event, now);
    // Check if daysRemaining matches any of the reminder_offsets
    if (event.reminder_offsets.includes(occ.daysRemaining)) {
      let desc = '';
      if (occ.daysRemaining === 0) {
        desc = `is TODAY! 🎉`;
      } else if (occ.daysRemaining === 1) {
        desc = `is tomorrow!`;
      } else {
        desc = `is in ${occ.daysRemaining} days`;
      }

      notifications.push({
        id: `notif-${event.id}-${occ.daysRemaining}-${occ.nextDate.toISOString().slice(0, 10)}`,
        event_id: event.id,
        title: `${event.title} ${desc}`,
        date_string: occ.nextDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        days_remaining: occ.daysRemaining,
        read: false,
        created_at: new Date().toISOString(),
      });
    }
  }

  return notifications;
}
