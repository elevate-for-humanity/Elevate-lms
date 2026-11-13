// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest';
const rpc = vi.hoisted(() => vi.fn());
const lookup = vi.hoisted(() => ({ lesson: { course_id: 'hvac-course' } as { course_id: string } | null, error: null as Error | null }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => ({
  rpc,
  from: (table: string) => {
    if (!['course_lessons', 'courses'].includes(table)) throw new Error(`Unexpected fixture table: ${table}`);
    const query = {
      select: () => query,
      eq: () => query,
      maybeSingle: async () => table === 'course_lessons'
        ? { data: lookup.lesson, error: lookup.error }
        : { data: { slug: 'hvac-technician' }, error: null },
    };
    return query;
  },
}) }));
import { assertLessonAccess } from '@/lib/lms/access-control';
beforeEach(() => { vi.clearAllMocks(); lookup.lesson = { course_id: 'hvac-course' }; lookup.error = null; });
it.each([false, undefined, 0, 1, 'true', {}, []])('denies non-boolean authorization %j', async data => {
  rpc.mockResolvedValue({ data, error: null });
  await expect(assertLessonAccess('learner', 'lesson')).rejects.toThrow('ACCESS_DENIED');
});
it('allows only an explicit authorization success', async () => {
  rpc.mockResolvedValue({ data: true, error: null });
  await expect(assertLessonAccess('learner', 'lesson')).resolves.toBeUndefined();
  expect(rpc).toHaveBeenCalledWith('can_access_lesson', { p_user_id: 'learner', p_lesson_id: 'lesson' });
});
it('preserves missing lessons and database failures', async () => {
  rpc.mockResolvedValue({ data: null, error: null });
  await expect(assertLessonAccess('learner', 'lesson')).rejects.toThrow('LESSON_NOT_FOUND');
  rpc.mockResolvedValue({ data: true, error: new Error('database unavailable') });
  await expect(assertLessonAccess('learner', 'lesson')).rejects.toThrow('database unavailable');
});
it('fails before the authorization RPC when lesson lookup is missing', async () => {
  lookup.lesson = null;
  await expect(assertLessonAccess('learner', 'lesson')).rejects.toThrow('LESSON_NOT_FOUND');
  expect(rpc).not.toHaveBeenCalled();
});
it('preserves a lesson lookup infrastructure failure without authorizing access', async () => {
  lookup.error = new Error('lesson lookup unavailable');
  await expect(assertLessonAccess('learner', 'lesson')).rejects.toBe(lookup.error);
  expect(rpc).not.toHaveBeenCalled();
});
