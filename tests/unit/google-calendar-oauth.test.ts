// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const mocks = vi.hoisted(() => ({ account: { id: 'owner' } as any, store: vi.fn(), exchange: vi.fn(), authorize: vi.fn(() => 'https://accounts.google.com/o/oauth2/v2/auth?state=test') }));
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ auth: { getUser: async () => ({ data: { user: mocks.account } }) } }) }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: vi.fn() }));
vi.mock('@/lib/calendar/google-calendar', () => ({ GOOGLE_CALENDAR_SCOPE: 'https://www.googleapis.com/auth/calendar.readonly', calendarOAuth: async () => ({ generateAuthUrl: mocks.authorize, getToken: mocks.exchange }), calendarConfigured: vi.fn(), googleBusyEvents: vi.fn(), storeCalendarTokens: mocks.store }));
import { googleCalendarCallback, googleCalendarConnect } from '@/lib/calendar/google-calendar-routes';
beforeEach(() => { vi.clearAllMocks(); mocks.account = { id: 'owner' }; mocks.exchange.mockResolvedValue({ tokens: { access_token: 'private', refresh_token: 'refresh', scope: 'https://www.googleapis.com/auth/calendar.readonly' } }); });
function callback(overrides: any = {}, supplied = 'nonce') {
  const state = { nonce: 'nonce', verifier: 'verifier', userId: 'owner', returnTo: '/program-holder/meetings', expires: Date.now() + 60000, ...overrides };
  return new NextRequest(`https://app.elevateforhumanity.org/api/calendar/google/callback?code=code&state=${supplied}`, { headers: { cookie: `elevate_google_calendar_state=${encodeURIComponent(JSON.stringify(state))}` } });
}
it('starts account-bound OAuth with offline access, read-only scope, and PKCE', async () => {
  const response = await googleCalendarConnect(new NextRequest('https://app.elevateforhumanity.org/api/calendar/google/connect?returnTo=/program-holder/meetings'));
  expect(response.status).toBe(307);
  expect(mocks.authorize).toHaveBeenCalledWith(expect.objectContaining({ access_type: 'offline', scope: ['https://www.googleapis.com/auth/calendar.readonly'], code_challenge_method: 'S256', code_challenge: expect.any(String) }));
  expect(response.headers.get('set-cookie')).toContain('HttpOnly');
  expect(response.headers.get('set-cookie')).toContain('Secure');
});
it.each([{ userId: 'someone-else' }, { expires: 0 }, { expires: undefined }])('rejects mismatched or expired state before exchanging a code: %s', async state => {
  const response = await googleCalendarCallback(callback(state));
  expect(response.headers.get('location')).toContain('calendarConnection=failed');
  expect(mocks.exchange).not.toHaveBeenCalled(); expect(mocks.store).not.toHaveBeenCalled();
});
it('rejects a changed state nonce', async () => {
  await googleCalendarCallback(callback({}, 'tampered'));
  expect(mocks.exchange).not.toHaveBeenCalled();
});
it('stores accepted credentials for the current account and clears one-time state', async () => {
  const response = await googleCalendarCallback(callback());
  expect(mocks.store).toHaveBeenCalledWith('owner', expect.objectContaining({ refresh_token: 'refresh' }));
  expect(response.headers.get('location')).toBe('https://app.elevateforhumanity.org/program-holder/meetings?calendarConnection=connected');
  expect(response.headers.get('set-cookie')).toContain('Max-Age=0');
  expect(response.headers.get('location')).not.toContain('private');
});
it('clears malformed state instead of failing the callback page', async () => {
  const response = await googleCalendarCallback(new NextRequest('https://app.elevateforhumanity.org/api/calendar/google/callback?code=code&state=nonce', { headers: { cookie: 'elevate_google_calendar_state=null' } }));
  expect(response.status).toBe(307);
  expect(response.headers.get('location')).toContain('calendarConnection=failed');
  expect(mocks.exchange).not.toHaveBeenCalled();
});
