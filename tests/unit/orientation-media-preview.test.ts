import { beforeEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const state = vi.hoisted(() => ({ authenticated: false, previewing: true, subjectId: 'selected-learner' }));
const signedUrl = vi.hoisted(() => vi.fn(async () => 'https://media.test/guide.mp4'));
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ auth: { getUser: async () => ({ data: { user: state.authenticated ? { id: 'learner' } : null } }) } }) }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => ({}) }));
vi.mock('@/lib/admin/portal-preview', () => ({ resolvePortalPreviewSubject: async () => ({ previewing: state.previewing, userId: state.subjectId }) }));
vi.mock('@/lib/storage/elevate-media-storage', () => ({ getSignedElevateMediaUrl: signedUrl }));
import { GET } from '@/apps/lms/app/api/orientation/media/[audience]/route';
const request = (audience = 'barber-apprentice') => GET(new NextRequest(`https://app.test/api/orientation/media/${audience}?format=mp4`), { params: Promise.resolve({ audience }) });
beforeEach(() => { state.authenticated = false; state.previewing = true; state.subjectId = 'selected-learner'; signedUrl.mockClear(); });
it('allows the same verified cross-service preview as the orientation page', async () => {
  const response = await request();
  expect(response.status).toBe(307);
  expect(response.headers.get('location')).toBe('https://media.test/guide.mp4');
  expect(response.headers.get('cache-control')).toBe('private, no-store');
});
it('keeps normal learner sessions working without a preview', async () => {
  state.authenticated = true; state.previewing = false; state.subjectId = '';
  expect((await request()).status).toBe(307);
});
it('rejects missing or invalid preview authentication before signing any media URL', async () => {
  state.previewing = false; state.subjectId = '';
  expect((await request()).status).toBe(401);
  expect(signedUrl).not.toHaveBeenCalled();
});
it('still rejects arbitrary media audiences during a valid preview', async () => {
  expect((await request('other-private-file')).status).toBe(404);
  expect(signedUrl).not.toHaveBeenCalled();
});
