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
  date: string; // YYYY-MM-DD or MM-DD (if year unknown: e.g. "1998-05-14" or "0000-05-14")
  year_known: boolean;
  recurrence: RecurrenceType;
  visibility: VisibilityType;
  notes?: string;
  relationship?: string; // e.g. "Family", "Close Friend", "Work Colleague", "Self"
  reminder_offsets: number[]; // e.g. [7, 1, 0] means 7 days before, 1 day before, and day of
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Member {
  id: string;
  email: string;
  role: 'owner' | 'member';
  status: 'active' | 'invited' | 'revoked';
  invited_at: string;
  accepted_at?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  role: 'owner' | 'member';
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
