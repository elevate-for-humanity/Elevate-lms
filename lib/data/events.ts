/**
 * Shared events data layer.
 * All event-related pages query through here — no duplicate Supabase calls in page files.
 *
 * Table: events
 * Columns used: id, title, event_type, description, start_date, end_date,
 *               location, virtual_link, is_virtual, max_attendees,
 *               registration_required, is_active, slug
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export interface ElevateEvent {
  id: string;
  title: string;
  event_type: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  location: string | null;
  virtual_link: string | null;
  is_virtual: boolean;
  max_attendees: number | null;
  registration_required: boolean;
  is_active: boolean;
  slug: string | null;
}

export type EventFilter = {
  /** Filter to specific event_type values. Omit for all types. */
  types?: string[];
  /** Only return events starting on or after this ISO string. Defaults to now. */
  from?: string;
  /** Only return past events (start_date < now). */
  past?: boolean;
  limit?: number;
};

const SELECT_COLS =
  'id, title, event_type, description, start_date, end_date, location, virtual_link, is_virtual, max_attendees, registration_required, is_active, slug';

async function getDb() {
  try {
    const admin = createAdminClient();
    if (admin) return admin;
  } catch {
    // Admin client unavailable (missing env vars) — fall through to server client
  }
  try {
    return await createClient();
  } catch {
    return null;
  }
}

/** Fetch upcoming events, optionally filtered by type. */
export async function getUpcomingEvents(filter: EventFilter = {}): Promise<ElevateEvent[]> {
  const db = await getDb();
  if (!db) return [];
  const now = filter.from ?? new Date().toISOString();
  let q = db
    .from('events')
    .select(SELECT_COLS)
    .eq('is_active', true)
    .gte('start_date', now)
    .order('start_date', { ascending: true })
    .limit(filter.limit ?? 20);

  if (filter.types?.length) {
    q = q.in('event_type', filter.types);
  }

  const { data, error } = await q;
  if (error) {
    logger.error('[events] getUpcomingEvents error:', error.message);
    return [];
  }
  return (data ?? []) as ElevateEvent[];
}

/** Fetch past events, optionally filtered by type. */
export async function getPastEvents(filter: EventFilter = {}): Promise<ElevateEvent[]> {
  const db = await getDb();
  if (!db) return [];
  const now = new Date().toISOString();
  let q = db
    .from('events')
    .select(SELECT_COLS)
    .eq('is_active', true)
    .lt('start_date', now)
    .order('start_date', { ascending: false })
    .limit(filter.limit ?? 6);

  if (filter.types?.length) {
    q = q.in('event_type', filter.types);
  }

  const { data, error } = await q;
  if (error) {
    logger.error('[events] getPastEvents error:', error.message);
    return [];
  }
  return (data ?? []) as ElevateEvent[];
}

/** Fetch a single event by id or slug. */
export async function getEvent(idOrSlug: string): Promise<ElevateEvent | null> {
  const db = await getDb();
  if (!db) return null;
  const { data, error } = await db
    .from('events')
    .select(SELECT_COLS)
    .or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    logger.error('[events] getEvent error:', error.message);
    return null;
  }
  return data as ElevateEvent | null;
}

// ── Formatting helpers ────────────────────────────────────────────────────────

export function formatEventDate(start: string, end?: string | null): string {
  const s = new Date(start);
  const opts: Intl.DateTimeFormatOptions = {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
  };
  const startStr = s.toLocaleString('en-US', opts);
  if (!end) return startStr;
  const e = new Date(end);
  // Same day — show only end time
  if (s.toDateString() === e.toDateString()) {
    return `${startStr} – ${e.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  }
  return `${startStr} – ${e.toLocaleString('en-US', opts)}`;
}

export function eventTypeLabel(type: string): string {
  const map: Record<string, string> = {
    info_session: 'Info Session',
    networking: 'Networking',
    career_fair: 'Career Fair',
    workshop: 'Workshop',
    webinar: 'Webinar',
    orientation: 'Orientation',
    graduation: 'Graduation',
    community: 'Community',
    fundraiser: 'Fundraiser',
  };
  return map[type] ?? type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export function eventTypeBadgeColor(type: string): string {
  const map: Record<string, string> = {
    info_session: 'bg-brand-blue-100 text-brand-blue-800',
    networking: 'bg-teal-100 text-teal-800',
    career_fair: 'bg-emerald-100 text-emerald-800',
    workshop: 'bg-amber-100 text-amber-800',
    webinar: 'bg-purple-100 text-purple-800',
    orientation: 'bg-brand-blue-100 text-brand-blue-800',
    graduation: 'bg-brand-green-100 text-brand-green-800',
    community: 'bg-rose-100 text-rose-800',
    fundraiser: 'bg-orange-100 text-orange-800',
  };
  return map[type] ?? 'bg-slate-100 text-slate-700';
}
