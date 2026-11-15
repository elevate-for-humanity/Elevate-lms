import { beforeEach, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  subject: { userId: 'apprentice', previewing: true },
  enrollment: null as { id: string } | null,
  error: null as object | null,
  runtime: vi.fn(),
}));
vi.mock('next/headers', () => ({ cookies: async () => ({ get: () => undefined }) }));
vi.mock('@/lib/admin/portal-preview', () => ({ resolvePortalPreviewSubject: async () => state.subject }));
vi.mock('@/lib/apprenticeship/runtime-context', () => ({ resolveApprenticeshipRuntimeContext: state.runtime }));
const db = { from: () => {
  const query: any = { select: () => query, eq: () => query, is: () => query,
    maybeSingle: async () => ({ data: state.enrollment, error: state.error }) };
  return query;
} };
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => db }));
import { resolveCoursePreview } from '@/lib/admin/course-preview';

beforeEach(() => {
  state.subject = { userId: 'apprentice', previewing: true };
  state.enrollment = null;
  state.error = null;
  state.runtime.mockReset().mockResolvedValue({ enrollment: { course_id: 'draft-course' } });
});
it('allows only the verified preview subject assigned draft without learner enrollment', async () => {
  expect((await resolveCoursePreview('draft-course')).active).toBe(true);
  expect(state.runtime).toHaveBeenCalledWith(db, { userId: 'apprentice', requireRegisteredStandard: false });
  expect((await resolveCoursePreview('unrelated-course')).active).toBe(false);
});
it('never grants ordinary learners draft preview access', async () => {
  state.subject.previewing = false;
  expect((await resolveCoursePreview('draft-course')).active).toBe(false);
  expect(state.runtime).not.toHaveBeenCalled();
});
it('fails closed on enrollment lookup errors or no operational assignment', async () => {
  state.error = { message: 'unavailable' };
  expect((await resolveCoursePreview('draft-course')).active).toBe(false);
  expect(state.runtime).not.toHaveBeenCalled();
  state.error = null;
  state.runtime.mockResolvedValue(null);
  expect((await resolveCoursePreview('draft-course')).active).toBe(false);
});
it('preserves active course enrollment preview', async () => {
  state.enrollment = { id: 'enrollment' };
  expect((await resolveCoursePreview('published-course')).active).toBe(true);
  expect(state.runtime).not.toHaveBeenCalled();
});
