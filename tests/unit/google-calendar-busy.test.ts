// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ rpc: vi.fn(), token: vi.fn(), credentials: { access_token: 'private-access', refresh_token: 'private-refresh', expiry_date: 9999999999999 } }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => ({ rpc: mocks.rpc }) }));
vi.mock('@/lib/secrets', () => ({ hydrateProcessEnv: async () => {} }));
vi.mock('googleapis/build/src/apis/calendar/index.js', () => ({ auth: { OAuth2: class { credentials = mocks.credentials; setCredentials() {} getAccessToken() { return mocks.token(); } } } }));
import { assertGoogleCalendarAvailable, googleBusyEvents } from '@/lib/calendar/google-calendar';
beforeEach(() => { vi.stubEnv('GOOGLE_CLIENT_ID', 'client'); vi.stubEnv('GOOGLE_CLIENT_SECRET', 'secret'); mocks.rpc.mockReset().mockResolvedValue({ data: mocks.credentials, error: null }); mocks.token.mockReset().mockResolvedValue({ token: 'private-access' }); });
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
function provider(busy: any, errors?: unknown[]) {
  return vi.fn().mockResolvedValueOnce({ ok: true, json: async () => ({ items: [{ id: 'primary', primary: true }, { id: 'work', selected: true }, { id: 'hidden', selected: false }] }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ calendars: { primary: { busy }, work: { busy: [], ...(errors ? { errors } : {}) } } }) });
}
it('imports busy blocks without exposing personal event titles or tokens', async () => {
  const fetcher = provider([{ start: '2026-10-28T14:00:00Z', end: '2026-10-28T15:00:00Z' }]); vi.stubGlobal('fetch', fetcher);
  const result = await googleBusyEvents('owner', '2026-10-28T00:00:00Z', '2026-10-29T00:00:00Z');
  expect(result.events[0].title).toBe('Google Calendar · Busy');
  expect(JSON.stringify(result)).not.toContain('private-access');
  expect(JSON.parse(fetcher.mock.calls[1][1].body).items).toEqual([{ id: 'primary' }, { id: 'work' }]);
  expect(mocks.rpc).toHaveBeenCalledWith('resolve_google_calendar_connection', { p_user_id: 'owner' });
});
it('blocks a meeting overlapping Google busy time', async () => {
  vi.stubGlobal('fetch', provider([{ start: '2026-10-28T14:00:00Z', end: '2026-10-28T15:00:00Z' }]));
  await expect(assertGoogleCalendarAvailable('owner', '2026-10-28T14:30:00Z', '2026-10-28T15:30:00Z')).rejects.toThrow('overlaps');
});
it('allows an adjacent meeting at the end of a busy period', async () => {
  vi.stubGlobal('fetch', provider([{ start: '2026-10-28T14:00:00Z', end: '2026-10-28T15:00:00Z' }]));
  await expect(assertGoogleCalendarAvailable('owner', '2026-10-28T15:00:00Z', '2026-10-28T16:00:00Z')).resolves.toBe(true);
});
it('fails closed when any selected calendar cannot be checked', async () => {
  vi.stubGlobal('fetch', provider([], [{ reason: 'internalError' }]));
  await expect(assertGoogleCalendarAvailable('owner', '2026-10-28T14:00:00Z', '2026-10-28T15:00:00Z')).rejects.toThrow('could not be checked');
});
it('distinguishes an unconnected account from a failed credential lookup', async () => {
  mocks.rpc.mockResolvedValueOnce({ data: null, error: null });
  await expect(googleBusyEvents('owner', '2026-10-28T14:00:00Z', '2026-10-28T15:00:00Z')).resolves.toEqual({ connected: false, events: [] });
  mocks.rpc.mockResolvedValueOnce({ data: null, error: { message: 'unavailable' } });
  await expect(googleBusyEvents('owner', '2026-10-28T14:00:00Z', '2026-10-28T15:00:00Z')).rejects.toThrow('could not be loaded');
});
