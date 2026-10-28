// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest';
const rpc = vi.hoisted(() => vi.fn());
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => ({ rpc }) }));
import { assertLessonAccess } from '@/lib/lms/access-control';
beforeEach(() => vi.clearAllMocks());
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
