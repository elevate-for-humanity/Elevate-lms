import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const state = vi.hoisted(() => ({ auth: vi.fn(), client: vi.fn(), insert: vi.fn() }));
vi.mock('@/lib/admin/guards', () => ({ apiRequireAdmin: state.auth }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: state.client }));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: vi.fn().mockResolvedValue(null) }));
import { POST } from '@/apps/admin/app/api/admin/ultimate-course-builder/review/route';

const input = { buildId: '11111111-1111-4111-8111-111111111111', lessonBuildId: '22222222-2222-4222-8222-222222222222', artifactVersionId: '33333333-3333-4333-8333-333333333333', action: 'request_change' };
function request(body: unknown) { return new NextRequest('https://admin.example/api/admin/ultimate-course-builder/review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); }
beforeEach(() => {
  vi.clearAllMocks();
  state.auth.mockResolvedValue({ id: 'trusted-admin' });
  state.insert.mockResolvedValue({ error: null });
  state.client.mockResolvedValue({ from(table: string) {
    const q = { select: () => q, eq: () => q,
      single: async () => ({ error: null, data: table === 'ultimate_artifacts' ? { id: 'film' } : { id: input.artifactVersionId, version: 93, content: { render: { videoUrl: 'https://media.example/lesson.mp4' } } } }),
      insert: state.insert };
    return q;
  } });
});
describe('video review persistence', () => {
  it('rejects a change request without usable instructions before opening the database', async () => {
    for (const comment of [undefined, '', '  ', 'x'.repeat(4001)]) {
      expect((await POST(request({ ...input, comment }))).status).toBe(400);
    }
    expect(state.client).not.toHaveBeenCalled();
  });
  it('persists instructions and the authenticated reviewer against the exact version', async () => {
    const response = await POST(request({ ...input, comment: '  Replace the unrelated image.  ', reviewer_id: 'untrusted' }));
    expect(response.status).toBe(200);
    expect(state.insert).toHaveBeenCalledWith({ artifact_version_id: input.artifactVersionId, action: 'request_change', reviewer_id: 'trusted-admin', comment: 'Replace the unrelated image.' });
    expect(await response.json()).toMatchObject({ ok: true, message: expect.stringContaining('No repair has been scheduled') });
  });
  it('requires an authenticated admin before accepting a review', async () => {
    state.auth.mockResolvedValue({ error: new Response('Sign in', { status: 401 }) });
    expect((await POST(request({ ...input, comment: 'Fix the picture.' }))).status).toBe(401);
    expect(state.client).not.toHaveBeenCalled();
  });
  it('still allows approval without change instructions', async () => {
    expect((await POST(request({ ...input, action: 'approve' }))).status).toBe(200);
    expect(state.insert).toHaveBeenCalledWith(expect.objectContaining({ action: 'approve', comment: null }));
  });
});
