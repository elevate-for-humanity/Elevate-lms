import { beforeEach, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ courseId: null as string | null, mapped: 'program-course' as string | null }));
vi.mock('@/lib/apprenticeship/registered-program-contract', () => ({ resolveRegisteredProgramContract: async () => null }));
const resolver = vi.hoisted(() => vi.fn());
vi.mock('@/lib/course-builder/program-resolver', () => ({ resolveCourseIdFromDb: resolver }));
import { resolveApprenticeshipRuntimeContext } from '@/lib/apprenticeship/runtime-context';
const db: any = { from(table: string) {
  const q: any = {};
  for (const op of ['select', 'eq', 'or', 'in', 'order', 'limit']) q[op] = () => q;
  q.maybeSingle = async () => ({ data: table === 'program_enrollments' ? { id: 'enrollment', user_id: 'learner', program_id: 'assigned-program', program_slug: 'cosmetology-apprenticeship', course_id: state.courseId } : null, error: null });
  return q;
} };
beforeEach(() => { state.courseId = null; state.mapped = 'program-course'; resolver.mockReset().mockImplementation(async () => state.mapped); });
it('uses the assigned program mapping when the individual course field is empty', async () => {
  const result = await resolveApprenticeshipRuntimeContext(db, { userId: 'learner', requireRegisteredStandard: false });
  expect(result?.enrollment.course_id).toBe('program-course');
  expect(resolver).toHaveBeenCalledWith(db, 'assigned-program');
});
it('preserves an explicit individual course without replacing it from a global slug', async () => {
  state.courseId = 'individual-course';
  const result = await resolveApprenticeshipRuntimeContext(db, { userId: 'learner', requireRegisteredStandard: false });
  expect(result?.enrollment.course_id).toBe('individual-course');
  expect(resolver).not.toHaveBeenCalled();
});
it('does not invent a course when no enrollment mapping exists', async () => {
  state.mapped = null;
  expect((await resolveApprenticeshipRuntimeContext(db, { userId: 'learner', requireRegisteredStandard: false }))?.enrollment.course_id).toBeNull();
});
