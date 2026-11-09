import { ImportantEvent, Member, VaultAuthState, InAppNotification } from '../types';
import { getNextOccurrence } from './dateUtils';

const STORAGE_KEYS = {
  EVENTS: 'important_dates_events',
  MEMBERS: 'important_dates_members',
  VAULT_AUTH: 'important_dates_vault_auth',
  MASTER_PASSCODE: 'important_dates_master_passcode',
  SETTINGS: 'important_dates_settings',
  NOTIFICATIONS: 'important_dates_notifications',
};

const OWNER_EMAIL = 'rounaksingh05555@gmail.com';
const OWNER_NAME = 'Rounak';
const DEFAULT_MASTER_PASSCODE = 'FAMILY2026';

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
    created_by: OWNER_EMAIL,
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
    created_by: OWNER_EMAIL,
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
    created_by: OWNER_EMAIL,
    created_at: new Date().toISOString(),
  },
  {
    id: 'evt-4',
    title: 'Personal Career Milestone',
    category: 'Milestone',
    date: '2023-01-15',
    year_known: true,
    recurrence: 'yearly',
    visibility: 'private', // OWNER ONLY
    relationship: 'Self',
    notes: 'Personal milestone reflection.',
    reminder_offsets: [0],
    created_by: OWNER_EMAIL,
    created_at: new Date().toISOString(),
  },
  {
    id: 'evt-5',
    title: "Leap-Day Friend's Birthday",
    person_name: 'Alex',
    category: 'Birthday',
    date: '1996-02-29',
    year_known: true,
    recurrence: 'yearly',
    visibility: 'shared',
    relationship: 'Close Friend',
    notes: 'Born on Feb 29 leap day! Observed on Feb 28 on regular years.',
    reminder_offsets: [1, 0],
    created_by: OWNER_EMAIL,
    created_at: new Date().toISOString(),
  }
];

const INITIAL_MEMBERS: Member[] = [
  {
    id: 'mem-1',
    name: OWNER_NAME,
    email: OWNER_EMAIL,
    role: 'owner',
    status: 'active',
    invited_at: '2026-01-01T00:00:00.000Z',
    accepted_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'mem-2',
    name: 'Priya',
    email: 'priya.family@gmail.com',
    role: 'member',
    status: 'active',
    invited_at: '2026-02-15T00:00:00.000Z',
    accepted_at: '2026-02-16T00:00:00.000Z',
  }
];

export function getMasterPasscode(): string {
  const code = localStorage.getItem(STORAGE_KEYS.MASTER_PASSCODE);
  if (!code) {
    localStorage.setItem(STORAGE_KEYS.MASTER_PASSCODE, DEFAULT_MASTER_PASSCODE);
    return DEFAULT_MASTER_PASSCODE;
  }
  return code;
}

export function setMasterPasscode(code: string): void {
  localStorage.setItem(STORAGE_KEYS.MASTER_PASSCODE, code.trim());
}

export function getVaultAuth(): VaultAuthState | null {
  const data = localStorage.getItem(STORAGE_KEYS.VAULT_AUTH);
  if (!data) return null;
  try {
    const parsed = JSON.parse(data);
    if (parsed && parsed.isUnlocked) {
      // If user was previously saved as generic owner, update to Rounak
      if (parsed.userEmail === 'owner@example.com') {
        parsed.userEmail = OWNER_EMAIL;
        parsed.userName = OWNER_NAME;
        saveVaultAuth(parsed);
      }
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveVaultAuth(auth: VaultAuthState | null): void {
  if (!auth) {
    localStorage.removeItem(STORAGE_KEYS.VAULT_AUTH);
  } else {
    localStorage.setItem(STORAGE_KEYS.VAULT_AUTH, JSON.stringify(auth));
  }
}

export function verifyAndUnlock(
  email: string,
  passcode: string,
  name?: string
): { success: boolean; auth?: VaultAuthState; error?: string } {
  const masterCode = getMasterPasscode();
  const cleanEmail = email.trim().toLowerCase();
  const cleanCode = passcode.trim();

  if (cleanCode !== masterCode) {
    return { success: false, error: 'Incorrect Family Passcode. Please check with Rounak.' };
  }

  // Check role: Rounak is always Owner
  const isOwner = cleanEmail === OWNER_EMAIL.toLowerCase() || cleanEmail === 'owner@example.com';
  const role: 'owner' | 'member' = isOwner ? 'owner' : 'member';

  const members = getStoredMembers();
  const existing = members.find(m => m.email.toLowerCase() === cleanEmail);

  // Add to members if not present
  if (!existing) {
    const newMember: Member = {
      id: `mem-${Date.now()}`,
      name: name?.trim() || (isOwner ? OWNER_NAME : cleanEmail.split('@')[0]),
      email: cleanEmail,
      role,
      status: 'active',
      invited_at: new Date().toISOString(),
      accepted_at: new Date().toISOString(),
    };
    saveMembers([...members, newMember]);
  } else if (existing.status === 'revoked') {
    return { success: false, error: 'Your access to this vault was revoked by the owner.' };
  }

  const authState: VaultAuthState = {
    isUnlocked: true,
    userEmail: cleanEmail,
    userName: name?.trim() || (isOwner ? OWNER_NAME : existing?.name || cleanEmail.split('@')[0]),
    role,
    vaultPasscode: masterCode,
  };

  saveVaultAuth(authState);
  return { success: true, auth: authState };
}

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
    const list: Member[] = JSON.parse(data);
    // Ensure Rounak is listed as owner
    if (!list.some(m => m.email.toLowerCase() === OWNER_EMAIL.toLowerCase())) {
      list.unshift(INITIAL_MEMBERS[0]);
      saveMembers(list);
    }
    return list;
  } catch {
    return INITIAL_MEMBERS;
  }
}

export function saveMembers(members: Member[]): void {
  localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
}

export function inviteMember(email: string, name?: string): Member[] {
  const members = getStoredMembers();
  const cleanEmail = email.trim().toLowerCase();
  const existingIndex = members.findIndex(m => m.email.toLowerCase() === cleanEmail);
  
  let updated: Member[];
  if (existingIndex >= 0) {
    updated = [...members];
    updated[existingIndex] = { ...updated[existingIndex], status: 'active', name: name || updated[existingIndex].name };
  } else {
    const newMember: Member = {
      id: `mem-${Date.now()}`,
      name: name?.trim() || cleanEmail.split('@')[0],
      email: cleanEmail,
      role: 'member',
      status: 'active',
      invited_at: new Date().toISOString(),
    };
    updated = [...members, newMember];
  }
  saveMembers(updated);
  return updated;
}

export function revokeMember(id: string): Member[] {
  const members = getStoredMembers();
  const updated = members.map(m => m.id === id ? { ...m, status: 'revoked' as const } : m);
  saveMembers(updated);
  return updated;
}

export function generateOneClickInviteLink(email?: string): string {
  const base = window.location.origin + window.location.pathname;
  const passcode = getMasterPasscode();
  let url = `${base}?invite=${encodeURIComponent(passcode)}`;
  if (email) {
    url += `&email=${encodeURIComponent(email)}`;
  }
  return url;
}

export function exportBackupJSON(): string {
  const data = {
    app: 'nao',
    version: '1.0.0',
    owner: { name: OWNER_NAME, email: OWNER_EMAIL },
    master_passcode: getMasterPasscode(),
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
    if (data.master_passcode) {
      setMasterPasscode(data.master_passcode);
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
