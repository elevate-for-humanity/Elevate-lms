import 'server-only';
import { auth as googleAuth } from 'googleapis/build/src/apis/calendar/index.js';
import { requireAdminClient } from '@/lib/supabase/admin';
import { hydrateProcessEnv } from '@/lib/secrets';
import { googleCalendarCredentials } from '@/lib/google/calendar-settings';

export const GOOGLE_CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.readonly';
export class CalendarConflictError extends Error {}

export async function calendarOAuth(origin: string) {
  await hydrateProcessEnv();
  if (!['https://lms.elevateforhumanity.org', 'https://app.elevateforhumanity.org', 'https://admin.elevateforhumanity.org'].includes(origin)) throw new Error('Calendar connection is unavailable on this host.');
  const credentials = googleCalendarCredentials(process.env);
  if (!credentials) throw new Error('Google Calendar connection needs administrator setup.');
  return new googleAuth.OAuth2(credentials.clientId, credentials.clientSecret, `${origin}/api/calendar/google/callback`);
}

export async function calendarConfigured() {
  await hydrateProcessEnv();
  return Boolean(googleCalendarCredentials(process.env));
}

export async function storeCalendarTokens(userId: string, tokens: Record<string, unknown>) {
  const db = await requireAdminClient();
  const { error } = await db.rpc('store_google_calendar_connection', { p_user_id: userId, p_tokens: tokens });
  if (error) throw new Error('Google Calendar connection could not be saved.');
}

async function calendarAccess(userId: string) {
  const db = await requireAdminClient();
  const { data: tokens, error } = await db.rpc('resolve_google_calendar_connection', { p_user_id: userId });
  if (error) throw new Error('Google Calendar connection could not be loaded.');
  if (!tokens) return null;
  const client = await calendarOAuth('https://app.elevateforhumanity.org');
  client.setCredentials(tokens);
  try {
    const { token } = await client.getAccessToken();
    if (!token) throw new Error('Missing token');
    if (client.credentials.access_token !== tokens.access_token || client.credentials.expiry_date !== tokens.expiry_date) {
      await storeCalendarTokens(userId, { ...tokens, ...client.credentials });
    }
    return token;
  } catch {
    throw new Error('Google Calendar could not be checked. Reconnect it before scheduling.');
  }
}

async function googleRequest(token: string, path: string, body?: unknown) {
  const response = await fetch(`https://www.googleapis.com/calendar/v3/${path}`, {
    method: body ? 'POST' : 'GET', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}), cache: 'no-store', signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error('Google Calendar could not be checked. Reconnect it and try again.');
  return response.json();
}

export type GoogleBusyEvent = { id: string; title: string; startsAt: string; endsAt: string; date: string; type: 'event'; source: 'google' };

/** Fetch fresh busy blocks from the user's primary and selected Google calendars; never import private event text. */
export async function googleBusyEvents(userId: string, start: string, end: string): Promise<{ connected: boolean; events: GoogleBusyEvent[] }> {
  const token = await calendarAccess(userId);
  if (!token) return { connected: false, events: [] };
  const calendars: Array<{ id: string; primary?: boolean; selected?: boolean }> = [];
  let pageToken: string | undefined;
  do {
    const page = await googleRequest(token, `users/me/calendarList?maxResults=250${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`);
    calendars.push(...(page.items || []).filter((item: any) => item.id && (item.primary || item.selected)));
    pageToken = page.nextPageToken;
  } while (pageToken);
  if (!calendars.length) throw new Error('No selected Google calendars are available. Select a calendar in Google and try again.');
  const events: GoogleBusyEvent[] = [];
  for (let offset = 0; offset < calendars.length; offset += 50) {
    const batch = calendars.slice(offset, offset + 50);
    const result = await googleRequest(token, 'freeBusy', { timeMin: start, timeMax: end, items: batch.map(({ id }) => ({ id })) });
    for (const calendar of batch) {
      const busy = result.calendars?.[calendar.id];
      if (!busy || busy.errors?.length || !Array.isArray(busy.busy)) throw new Error('One of your Google calendars could not be checked. Try again before booking.');
      for (const block of busy.busy) {
        if (!block.start || !block.end || !Number.isFinite(Date.parse(block.start)) || !Number.isFinite(Date.parse(block.end))) throw new Error('Google returned an invalid busy period. Please try again.');
        events.push({ id: `google-${calendar.id}-${block.start}-${block.end}`, title: 'Google Calendar · Busy', startsAt: block.start, endsAt: block.end, date: block.start.slice(0, 10), type: 'event', source: 'google' });
      }
    }
  }
  return { connected: true, events };
}

export async function assertGoogleCalendarAvailable(userId: string, start: string, end: string) {
  const { connected, events } = await googleBusyEvents(userId, start, end);
  if (events.some(event => Date.parse(event.startsAt) < Date.parse(end) && Date.parse(event.endsAt) > Date.parse(start))) {
    throw new CalendarConflictError('This time overlaps a busy event in your Google Calendar. Choose another time.');
  }
  return connected;
}
