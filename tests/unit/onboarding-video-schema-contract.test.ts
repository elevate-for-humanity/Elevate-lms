// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ from: vi.fn(), user: { id: 'learner' }, enrollment: true, error: false, writes: [] as any[], filters: [] as any[] }));
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ auth: { getUser: async () => ({ data: { user: mocks.user }, error: null }) }, from: mocks.from }) }));
vi.mock('@/content/onboarding/video-catalog', () => ({ ONBOARDING_VIDEO_CATALOG: [{ id: 'welcome', audience: ['STUDENT'], sequence: 1, title: 'Welcome', required: true, acknowledgmentRequired: true }] }));
import { POST } from '@/apps/lms/app/api/onboarding/videos/[videoKey]/progress/route';
import { assignRequiredOnboardingVideos } from '@/lib/onboarding/assign-required-videos';
beforeEach(() => {
  mocks.enrollment = true; mocks.error = false; mocks.writes = []; mocks.filters = [];
  mocks.from.mockImplementation(table => {
    let updating = false;
    const result = () => ({ data: table === 'program_enrollments' ? (mocks.enrollment ? { id: 'enrollment' } : null) : [{ id: 'assignment', user_id: 'learner', video_key: 'welcome', completed_at: null }], error: mocks.error ? { message: 'unavailable' } : null });
    const chain: any = {
      select: (projection: string) => { expect(projection).not.toMatch(/enrollment_id|required|acknowledgment_required/); return chain; },
      eq: (key: string, value: unknown) => { mocks.filters.push({ table, key, value }); return chain; },
      in: () => chain,
      maybeSingle: async () => result(),
      single: async () => ({ ...result(), data: { id: 'assignment', user_id: 'learner', completed_at: null } }),
      update: (values: unknown) => { updating = true; mocks.writes.push({ table, values }); return chain; },
      upsert: (values: unknown, options: unknown) => { mocks.writes.push({ table, values, options }); return chain; },
      then: (resolve: any, reject: any) => Promise.resolve(updating ? { error: null } : result()).then(resolve, reject),
    };
    return chain;
  });
});
const request = () => new Request('https://app.elevateforhumanity.org/api/onboarding/videos/welcome/progress', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ enrollmentId: '00000000-0000-4000-8000-000000000001', currentSeconds: 95, durationSeconds: 100 }) });
const context = { params: Promise.resolve({ videoKey: 'welcome' }) };
it('verifies enrollment ownership before saving progress against the per-user video assignment', async () => {
  const response = await POST(request(), context);
  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({ completed: true, acknowledgmentRequired: true });
  expect(mocks.filters).toContainEqual({ table: 'program_enrollments', key: 'user_id', value: 'learner' });
  expect(mocks.filters.some(row => row.table === 'onboarding_video_assignments' && row.key === 'enrollment_id')).toBe(false);
  expect(mocks.writes).toHaveLength(1);
});
it('does not write progress for an enrollment belonging to another learner', async () => {
  mocks.enrollment = false;
  expect((await POST(request(), context)).status).toBe(404);
  expect(mocks.writes).toHaveLength(0);
});
it('reports enrollment lookup failures without updating completion', async () => {
  mocks.error = true;
  expect((await POST(request(), context)).status).toBe(503);
  expect(mocks.writes).toHaveLength(0);
});
it('reassignment uses the real unique key and preserves completed orientation', async () => {
  const result = await assignRequiredOnboardingVideos({ userId: 'learner', enrollmentId: 'enrollment', audience: 'STUDENT' });
  expect(mocks.writes[0]).toEqual({ table: 'onboarding_video_assignments', values: [{ user_id: 'learner', video_key: 'welcome' }], options: { onConflict: 'user_id,video_key', ignoreDuplicates: true } });
  expect(result[0]).toMatchObject({ title: 'Welcome', acknowledgment_required: true });
});
