import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
const mocks = vi.hoisted(() => ({ enqueue: vi.fn(), dispatch: vi.fn(), record: vi.fn() }));
vi.mock('@/lib/ultimate-course-builder/core/generation-control', () => ({ assertCourseBuilderGenerationEnabled: vi.fn() }));
vi.mock('@/lib/ultimate-course-builder/worker/job-queue', () => ({ UltimateJobQueue: class { enqueue = mocks.enqueue; } }));
vi.mock('@/lib/gcp/course-worker-launch', () => ({ requestCourseWorker: mocks.dispatch }));
vi.mock('@/lib/ultimate-course-builder/worker/dispatch-evidence', () => ({ recordCourseDispatch: mocks.record }));
import { queueCanonicalLessonMedia } from '@/lib/ultimate-course-builder/core/lesson-media-request';
const courseId = '11111111-1111-4111-8111-111111111111';
const lessonId = '22222222-2222-4222-8222-222222222222';
function database({ mapped = true, active = null, parallel = false, pool = null, canonical = true }: { mapped?: boolean; active?: any; parallel?: boolean; pool?: any; canonical?: boolean } = {}) {
  const data: Record<string, unknown> = {
    course_lessons: { id: lessonId, content_json: { competencyId: 'safety-a' }, video_url: null },
    ultimate_course_builds: { id: 'build', status: 'blocked', profile: { competencies: mapped ? [{ id: 'safety-a' }] : [], ...(canonical ? { canonicalLessonIds: { 'safety-a': lessonId } } : {}), ...(parallel ? { parallelAutopilot: 'three-role-v1' } : {}) } },
    ultimate_build_jobs: active, ultimate_autopilot_pools: pool,
  };
  return { from: vi.fn((table: string) => { const q = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), neq: vi.fn().mockReturnThis(), in: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis(), maybeSingle: vi.fn(async () => ({ data: data[table], error: null })) }; return q; }) } as unknown as SupabaseClient;
}
beforeEach(() => { vi.clearAllMocks(); mocks.enqueue.mockResolvedValue({ id: 'job', payload: { competencyId: 'safety-a' } }); mocks.dispatch.mockResolvedValue({ dispatched: true }); });
describe('exact canonical lesson media', () => {
  it('validates without queue writes or provider dispatch', async () => {
    expect(await queueCanonicalLessonMedia(database(), { courseId, lessonId, validateOnly: true }, 'actor')).toMatchObject({ ok: true, status: 'validated', charged: false });
    expect(mocks.enqueue).not.toHaveBeenCalled(); expect(mocks.dispatch).not.toHaveBeenCalled();
  });
  it('hands off only the selected mapped competency', async () => {
    expect(await queueCanonicalLessonMedia(database(), { courseId, lessonId }, 'actor')).toMatchObject({ ok: true, jobId: 'job', result: { queued: 1 } });
    expect(mocks.enqueue).toHaveBeenCalledWith('build', { requestedBy: 'actor', competencyId: 'safety-a' });
  });
  it('never substitutes whole-course work for an unmapped lesson', async () => {
    await expect(queueCanonicalLessonMedia(database({ mapped: false }), { courseId, lessonId }, 'actor')).rejects.toThrow('not mapped');
    expect(mocks.enqueue).not.toHaveBeenCalled();
  });
  it('preserves a different active job without changing its scope', async () => {
    await expect(queueCanonicalLessonMedia(database({ active: { id: 'other', payload: {} } }), { courseId, lessonId }, 'actor')).rejects.toThrow('scope was preserved');
    expect(mocks.enqueue).not.toHaveBeenCalled(); expect(mocks.dispatch).not.toHaveBeenCalled();
  });
  it('rejects a missing canonical attachment mapping before accepting a job', async () => {
    await expect(queueCanonicalLessonMedia(database({ canonical: false }), { courseId, lessonId }, 'actor')).rejects.toThrow('canonical lesson mapping');
    expect(mocks.enqueue).not.toHaveBeenCalled(); expect(mocks.dispatch).not.toHaveBeenCalled();
  });
  it('does not dispatch a concurrent whole-course winner as a single lesson', async () => {
    mocks.enqueue.mockResolvedValue({ id: 'other', payload: {} });
    await expect(queueCanonicalLessonMedia(database(), { courseId, lessonId }, 'actor')).rejects.toThrow('scope changed');
    expect(mocks.dispatch).not.toHaveBeenCalled();
  });
  it('cannot compete with an active parallel course pool', async () => {
    await expect(queueCanonicalLessonMedia(database({ parallel: true, pool: { state: 'active' } }), { courseId, lessonId }, 'actor')).rejects.toThrow('autopilot still owns');
    expect(mocks.enqueue).not.toHaveBeenCalled();
  });
});
