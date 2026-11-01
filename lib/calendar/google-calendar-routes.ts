import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { calendarOAuth, calendarConfigured, GOOGLE_CALENDAR_SCOPE, googleBusyEvents, storeCalendarTokens, verifyGoogleCalendarToken } from './google-calendar';

const cookieName = 'elevate_google_calendar_state';
const cookieOptions = { httpOnly: true, secure: true, sameSite: 'lax' as const, path: '/api/calendar/google', maxAge: 600 };
const noStore = { 'Cache-Control': 'private, no-store' };
async function user() { const db = await createClient(); return (await db.auth.getUser()).data.user; }
function returnPath(value: string | null) { return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') && !value.includes('\\') ? value : '/'; }

export async function googleCalendarConnect(request: NextRequest) {
  const account = await user();
  if (!account) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  try {
    const client = await calendarOAuth(request.nextUrl.origin);
    const nonce = randomBytes(32).toString('base64url');
    const verifier = randomBytes(48).toString('base64url');
    const state = { nonce, verifier, userId: account.id, returnTo: returnPath(request.nextUrl.searchParams.get('returnTo')), expires: Date.now() + 600000 };
    const url = client.generateAuthUrl({ access_type: 'offline', prompt: 'consent', scope: [GOOGLE_CALENDAR_SCOPE], state: nonce, code_challenge: createHash('sha256').update(verifier).digest('base64url'), code_challenge_method: 'S256' as any });
    const response = NextResponse.redirect(url);
    response.cookies.set(cookieName, JSON.stringify(state), cookieOptions);
    return response;
  } catch { return NextResponse.json({ error: 'Google Calendar connection needs administrator setup.' }, { status: 503, headers: noStore }); }
}

export async function googleCalendarCallback(request: NextRequest) {
  const account = await user();
  let state: any;
  try { state = JSON.parse(request.cookies.get(cookieName)?.value || '{}'); if (!state || typeof state !== 'object') state = {}; } catch { state = {}; }
  const target = new URL(returnPath(state.returnTo), request.nextUrl.origin);
  target.searchParams.set('calendarConnection', 'failed');
  const finish = () => { const response = NextResponse.redirect(target); response.cookies.set(cookieName, '', { ...cookieOptions, maxAge: 0 }); response.headers.set('Cache-Control', 'no-store'); return response; };
  const supplied = request.nextUrl.searchParams.get('state') || '';
  if (!account || state.userId !== account.id || typeof state.nonce !== 'string' || typeof state.verifier !== 'string' || !Number.isFinite(state.expires) || state.expires < Date.now() || Buffer.byteLength(supplied) !== Buffer.byteLength(state.nonce) || !timingSafeEqual(Buffer.from(supplied), Buffer.from(state.nonce))) return finish();
  const code = request.nextUrl.searchParams.get('code');
  if (!code || request.nextUrl.searchParams.has('error')) return finish();
  try {
    const client = await calendarOAuth(request.nextUrl.origin);
    const { tokens } = await client.getToken({ code, codeVerifier: state.verifier });
    if (!tokens.access_token || !tokens.refresh_token || !tokens.scope?.split(' ').some(scope => scope === GOOGLE_CALENDAR_SCOPE || scope === 'https://www.googleapis.com/auth/calendar')) throw new Error('Calendar access was not granted');
    await verifyGoogleCalendarToken(tokens.access_token);
    await storeCalendarTokens(account.id, tokens as Record<string, unknown>);
    target.searchParams.set('calendarConnection', 'connected');
  } catch { /* Never disclose provider tokens or authorization codes. */ }
  return finish();
}

export async function googleCalendarGet(request: NextRequest) {
  const account = await user();
  if (!account) return NextResponse.json({ error: 'Sign in required.' }, { status: 401, headers: noStore });
  try {
    const configured = await calendarConfigured();
    const db = await requireAdminClient();
    const { data, error } = await db.from('google_calendar_connections').select('updated_at').eq('user_id', account.id).maybeSingle();
    if (error) throw new Error('Calendar connection could not be loaded.');
    const start = request.nextUrl.searchParams.get('start');
    const end = request.nextUrl.searchParams.get('end');
    if (!start && !end) {
      let connected = false;
      if (data && configured) {
        const now = new Date();
        connected = (await googleBusyEvents(account.id, now.toISOString(), new Date(now.getTime() + 60000).toISOString())).connected;
      }
      return NextResponse.json({ configured, connected, updatedAt: data?.updated_at }, { headers: noStore });
    }
    if (!start || !end || !Number.isFinite(Date.parse(start)) || !Number.isFinite(Date.parse(end)) || Date.parse(end) <= Date.parse(start) || Date.parse(end) - Date.parse(start) > 32 * 86400000) return NextResponse.json({ error: 'Choose a valid calendar range of up to 32 days.' }, { status: 400, headers: noStore });
    if (!data) return NextResponse.json({ connected: false, events: [] }, { headers: noStore });
    return NextResponse.json(await googleBusyEvents(account.id, start, end), { headers: noStore });
  } catch { return NextResponse.json({ error: 'Google Calendar could not be loaded. Reconnect it or try again before booking.' }, { status: 503, headers: noStore }); }
}

export async function googleCalendarDisconnect(request: NextRequest) {
  const account = await user();
  if (!account) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  if (request.headers.get('origin') !== request.nextUrl.origin) return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  const db = await requireAdminClient();
  const { error } = await db.from('google_calendar_connections').delete().eq('user_id', account.id);
  return error ? NextResponse.json({ error: 'Calendar could not be disconnected.' }, { status: 503 }) : NextResponse.json({ connected: false }, { headers: noStore });
}
