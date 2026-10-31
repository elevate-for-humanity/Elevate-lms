import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const state = vi.hoisted(() => ({ authenticated: false, previewing: true, subjectId: 'selected-learner' }));
const signedUrl = vi.hoisted(() => vi.fn(async () => 'https://media.test/guide.mp4'));
const upstream = vi.fn();
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ auth: { getUser: async () => ({ data: { user: state.authenticated ? { id: 'learner' } : null } }) } }) }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => ({}) }));
vi.mock('@/lib/admin/portal-preview', () => ({ resolvePortalPreviewSubject: async () => ({ previewing: state.previewing, userId: state.subjectId }) }));
vi.mock('@/lib/storage/elevate-media-storage', () => ({ getSignedElevateMediaUrl: signedUrl }));
import { GET } from '@/apps/lms/app/api/orientation/media/[audience]/route';
const request = (audience = 'barber-apprentice') => GET(new NextRequest(`https://app.test/api/orientation/media/${audience}?format=mp4`), { params: Promise.resolve({ audience }) });
beforeEach(() => {
  state.authenticated = false; state.previewing = true; state.subjectId = 'selected-learner'; signedUrl.mockClear();
  upstream.mockReset().mockImplementation(async () => new Response('media-bytes', { headers: { 'content-length': '11' } }));
  vi.stubGlobal('fetch', upstream);
});
afterEach(() => vi.unstubAllGlobals());
it('allows the same verified cross-service preview as the orientation page', async () => {
  const response = await request();
  expect(response.status).toBe(200);
  expect(response.headers.get('location')).toBeNull();
  expect(await response.text()).toBe('media-bytes');
  expect(response.headers.get('cache-control')).toBe('private, no-store');
});
it('keeps normal learner sessions working without a preview', async () => {
  state.authenticated = true; state.previewing = false; state.subjectId = '';
  expect((await request()).status).toBe(200);
});
it('rejects missing or invalid preview authentication before signing any media URL', async () => {
  state.previewing = false; state.subjectId = '';
  expect((await request()).status).toBe(401);
  expect(signedUrl).not.toHaveBeenCalled();
});
it('preserves range playback without forwarding browser credentials to storage', async () => {
  upstream.mockImplementation(async () => new Response('part', { status: 206, headers: { 'content-range': 'bytes 0-3/100', 'content-length': '4' } }));
  const response = await GET(new NextRequest('https://app.test/api/orientation/media/barber-apprentice?format=mp4', { headers: { Range: 'bytes=0-3', Cookie: 'private-session', Authorization: 'private-session' } }), { params: Promise.resolve({ audience: 'barber-apprentice' }) });
  expect(response.status).toBe(206);
  expect(response.headers.get('content-range')).toBe('bytes 0-3/100');
  expect(upstream.mock.calls[0][1].headers).toEqual({ Range: 'bytes=0-3' });
});
it('shows a recoverable unavailable response instead of passing storage errors through as video', async () => {
  upstream.mockImplementation(async () => new Response('Missing object', { status: 404 }));
  expect((await request()).status).toBe(503);
});
it('still rejects arbitrary media audiences during a valid preview', async () => {
  expect((await request('other-private-file')).status).toBe(404);
  expect(signedUrl).not.toHaveBeenCalled();
});
