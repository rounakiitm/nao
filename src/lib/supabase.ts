import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_CONFIG_KEY = 'important_dates_supabase_config';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConfigured: boolean;
}

export function getSupabaseConfig(): SupabaseConfig {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  const saved = localStorage.getItem(SUPABASE_CONFIG_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.url && parsed.anonKey) {
        return { ...parsed, isConfigured: true };
      }
    } catch {}
  }

  if (envUrl && envKey) {
    return { url: envUrl, anonKey: envKey, isConfigured: true };
  }

  return { url: '', anonKey: '', isConfigured: false };
}

export function saveSupabaseConfig(url: string, anonKey: string): void {
  localStorage.setItem(
    SUPABASE_CONFIG_KEY,
    JSON.stringify({ url: url.trim(), anonKey: anonKey.trim(), isConfigured: Boolean(url && anonKey) })
  );
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (!config.isConfigured) return null;

  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(config.url, config.anonKey);
    } catch (e) {
      console.error('Failed to create Supabase client', e);
      return null;
    }
  }
  return supabaseInstance;
}

export const SUPABASE_SQL_SCHEMA = `-- IMPORTANT DATES APPLICATION
-- PostgreSQL Schema with Row Level Security (RLS) & Invitations

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Memberships / Invitations Table
CREATE TABLE IF NOT EXISTS public.memberships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'invited', 'revoked')),
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ
);

-- 3. Events Table
CREATE TABLE IF NOT EXISTS public.events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  person_name TEXT,
  category TEXT NOT NULL CHECK (category IN ('Birthday', 'Anniversary', 'Memorial', 'Relationship', 'Milestone', 'Custom')),
  date TEXT NOT NULL, -- YYYY-MM-DD
  year_known BOOLEAN DEFAULT true,
  recurrence TEXT DEFAULT 'yearly' CHECK (recurrence IN ('yearly', 'none')),
  visibility TEXT DEFAULT 'shared' CHECK (visibility IN ('shared', 'private')),
  notes TEXT,
  relationship TEXT,
  reminder_offsets INT[] DEFAULT '{7,1,0}',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Push Subscriptions Table
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT UNIQUE NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  device_label TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Reminder Deliveries Table (Idempotency)
CREATE TABLE IF NOT EXISTS public.reminder_deliveries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  occurrence_date DATE NOT NULL,
  reminder_offset INT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'sent',
  CONSTRAINT unique_delivery_idx UNIQUE (event_id, user_id, occurrence_date, reminder_offset)
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminder_deliveries ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES FOR EVENTS
-- Rule 1: Users can see events if:
--   a) They are the creator, OR
--   b) The event is marked 'shared' AND the user's email is an active member in memberships
CREATE POLICY "View allowed events" ON public.events
  FOR SELECT
  USING (
    auth.uid() = created_by
    OR (
      visibility = 'shared'
      AND EXISTS (
        SELECT 1 FROM public.memberships 
        WHERE email = auth.jwt() ->> 'email' AND status = 'active'
      )
    )
  );

-- Rule 2: Only the owner can create or update events (or creator)
CREATE POLICY "Manage events policy" ON public.events
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE email = auth.jwt() ->> 'email' AND role = 'owner' AND status = 'active'
    )
    OR auth.uid() = created_by
  );
`;

