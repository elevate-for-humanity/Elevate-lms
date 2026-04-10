/**
 * Calendly API helper for the Elevate Testing Center.
 *
 * Token is stored in app_secrets (key: CALENDLY_PAT) — never in env vars.
 * All functions are server-only (use createAdminClient).
 */

import { createAdminClient, getAdminClient } from '@/lib/supabase/admin';
import { CALENDLY_CONFIG } from './testing-config';

const CALENDLY_API = 'https://api.calendly.com';

// ─── Token retrieval ─────────────────────────────────────────────────────────

let _cachedToken: string | null = null;

/**
 * Reads the Calendly PAT from app_secrets.
 * Cached in-process after first read — token doesn't change between requests.
 */
export async function getCalendlyToken(): Promise<string> {
  if (_cachedToken) return _cachedToken;

  const db = await getAdminClient();
  const { data, error } = await db
    .from('app_secrets')
    .select('value')
    .eq('key', 'CALENDLY_PAT')
    .single();

  if (error || !data?.value) {
    throw new Error('CALENDLY_PAT not found in app_secrets');
  }

  _cachedToken = data.value;
  return _cachedToken;
}

// ─── API helpers ─────────────────────────────────────────────────────────────

async function calendlyFetch(path: string, options: RequestInit = {}) {
  const token = await getCalendlyToken();
  const res = await fetch(`${CALENDLY_API}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Calendly API error ${res.status}: ${body}`);
  }
  return res.json();
}

// ─── Event types ─────────────────────────────────────────────────────────────

export interface CalendlyEventType {
  uri: string;
  name: string;
  slug: string;
  scheduling_url: string;
  duration: number;
  active: boolean;
}

/**
 * Returns all active event types for the testing center user.
 */
export async function getEventTypes(): Promise<CalendlyEventType[]> {
  const data = await calendlyFetch(
    `/event_types?user=${encodeURIComponent(CALENDLY_CONFIG.userUri)}&active=true`
  );
  return data.collection ?? [];
}

// ─── Scheduling links ─────────────────────────────────────────────────────────

export interface SchedulingLinkOptions {
  /** Calendly event type URI */
  eventTypeUri: string;
  /** Max number of uses (default: 1 — single-use link) */
  maxEventCount?: number;
}

/**
 * Creates a single-use Calendly scheduling link for a specific event type.
 * Use this to generate a unique booking URL per test-taker.
 */
export async function createSchedulingLink(opts: SchedulingLinkOptions): Promise<string> {
  const data = await calendlyFetch('/scheduling_links', {
    method: 'POST',
    body: JSON.stringify({
      max_event_count: opts.maxEventCount ?? 1,
      owner: opts.eventTypeUri,
      owner_type: 'EventType',
    }),
  });
  return data.resource?.booking_url ?? CALENDLY_CONFIG.testingUrl;
}

// ─── Scheduled events ─────────────────────────────────────────────────────────

export interface CalendlyEvent {
  uri: string;
  name: string;
  status: 'active' | 'canceled';
  start_time: string;
  end_time: string;
  location?: { type: string; location?: string };
  invitees_counter: { total: number; active: number; limit: number };
}

/**
 * Returns upcoming scheduled events for the testing center.
 * Used by admin dashboard to show booked testing slots.
 */
export async function getUpcomingEvents(options: {
  minStartTime?: string;
  maxStartTime?: string;
  count?: number;
} = {}): Promise<CalendlyEvent[]> {
  const params = new URLSearchParams({
    user: CALENDLY_CONFIG.userUri,
    status: 'active',
    sort: 'start_time:asc',
    count: String(options.count ?? 20),
  });
  if (options.minStartTime) params.set('min_start_time', options.minStartTime);
  if (options.maxStartTime) params.set('max_start_time', options.maxStartTime);

  const data = await calendlyFetch(`/scheduled_events?${params}`);
  return data.collection ?? [];
}
