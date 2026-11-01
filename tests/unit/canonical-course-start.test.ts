import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
const mocks = vi.hoisted(() => ({ enqueue: vi.fn(), dispatch: vi.fn(), record: vi.fn() }));
vi.mock('@/lib/ultimate-course-builder/core/generation-control', () => ({ assertCourseBuilderGenerationEnabled: vi.fn() }));
vi.mock('@/lib/ultimate-course-builder/core/course-profile', () => ({ buildUltimateProfile: async () => ({ authority: 'course-defined', competencies: [], sourceDocuments: [] }) }));
vi.mock('@/lib/ultimate-course-builder/worker/job-queue', () => ({ UltimateJobQueue: class { enqueue = mocks.enqueue; } }));
vi.mock('@/lib/gcp/course-worker-launch', () => ({ requestCourseWorker: mocks.dispatch }));
vi.mock('@/lib/ultimate-course-builder/worker/dispatch-evidence', () => ({ recordCourseDispatch: mocks.record }));
vi.mock('@/lib/ultimate-course-builder/instructional/google-lesson-author', () => ({ GOOGLE_LESSON_AUTHOR_VERSION: 'test' }));
import { startCanonicalCourse } from '@/lib/ultimate-course-builder/core/start-course';
const plan = { text: 'approved source', modules: [{ title: 'Safety', lessons: [{ title: 'Procedure', objectives: ['Work safely'], content: 'Follow the approved procedure.' }] }] };
function database(profile: unknown) {
  const course = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'course', title: 'Safety', slug: 'safety', status: 'draft' }, error: null }) };
  const builds = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), in: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'existing-build', profile }, error: null }), insert: vi.fn() };
  const db = { from: vi.fn((table: string) => table === 'courses' ? course : builds) } as unknown as SupabaseClient;
  return { db, builds };
}
beforeEach(() => { vi.clearAllMocks(); mocks.enqueue.mockResolvedValue({ id: 'saved-job' }); mocks.dispatch.mockResolvedValue({ dispatched: true }); mocks.record.mockResolvedValue(true); });
describe('production start retry', () => {
  it('reuses the locked build after a failed dispatch when its syllabus is unchanged', async () => {
    const { db, builds } = database({ instructionalSources: [{ id: 'syllabus:uploaded', text: plan.text }] });
    const response = await startCanonicalCourse(db, { courseId: 'course', syllabusPlan: plan }, 'actor');
    expect(response.status).toBe(202);
    expect((await response.json()).buildId).toBe('existing-build');
    expect(builds.insert).not.toHaveBeenCalled();
    expect(mocks.enqueue).toHaveBeenCalledWith('existing-build', { requestedBy: 'actor' });
  });
  it('does not silently replace a different locked syllabus', async () => {
    const { db } = database({ instructionalSources: [{ id: 'syllabus:uploaded', text: 'other source' }] });
    expect((await startCanonicalCourse(db, { courseId: 'course', syllabusPlan: plan }, 'actor')).status).toBe(409);
    expect(mocks.enqueue).not.toHaveBeenCalled();
  });
  it('does not resume an owner-paused build through an alternate generation URL', async () => {
    const { db } = database({ ownerPaused: true });
    expect((await startCanonicalCourse(db, { courseId: 'course' }, 'actor')).status).toBe(409);
    expect(mocks.dispatch).not.toHaveBeenCalled();
  });
});
