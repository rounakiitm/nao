export type EventCategory = 
  | 'Birthday'
  | 'Anniversary'
  | 'Memorial'
  | 'Relationship'
  | 'Milestone'
  | 'Custom';

export type RecurrenceType = 'yearly' | 'none';

export type VisibilityType = 'shared' | 'private';

export interface ImportantEvent {
  id: string;
  title: string;
  person_name?: string;
  category: EventCategory;
  date: string; // YYYY-MM-DD
  year_known: boolean;
  recurrence: RecurrenceType;
  visibility: VisibilityType;
  notes?: string;
  relationship?: string; // e.g. "Family", "Close Friend", "Work", "Self"
  reminder_offsets: number[]; // e.g. [7, 1, 0]
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Member {
  id: string;
  email: string;
  name?: string;
  role: 'owner' | 'member';
  status: 'active' | 'invited' | 'revoked';
  invited_at: string;
  accepted_at?: string;
}

export interface CurrentUser {
  email: string;
  role: 'owner' | 'member' | 'unauthorized';
  display_name: string;
}

export interface VaultAuthState {
  isUnlocked: boolean;
  userEmail: string;
  userName: string;
  role: 'owner' | 'member';
  vaultPasscode: string;
}

export interface InAppNotification {
  id: string;
  event_id: string;
  title: string;
  date_string: string;
  days_remaining: number;
  read: boolean;
  created_at: string;
}

export type DeviceType = 'phone' | 'tablet' | 'laptop' | 'desktop';

export interface LinkedDevice {
  id: string;
  name: string;
  type: DeviceType;
  browser?: string;
  os?: string;
  isCurrentDevice: boolean;
  isPrimary: boolean;
  pairedAt: string;
  lastSeenAt: string;
}

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncAt: string | null;
  mode: 'offline-local' | 'cloud-synced';
}
