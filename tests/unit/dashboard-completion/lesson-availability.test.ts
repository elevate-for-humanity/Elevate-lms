// @vitest-environment node
import { expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { loadLessonAvailability } from '@/lib/lms/lesson-availability';
import { coursePreviewTarget } from '@/lib/studio/course-preview-target';
it('uses combined access results and deduplicates lesson lookups', async () => {
  const rpc = vi.fn(async (_name: string, args: { p_lesson_id: string }) => ({
    data: args.p_lesson_id === 'open',
    error: null,
  }));
  expect(
    await loadLessonAvailability({ rpc } as unknown as SupabaseClient, 'learner', [
      'open',
      'locked',
      'open',
    ]),
  ).toEqual(
    new Map([
      ['open', true],
      ['locked', false],
    ]),
  );
  expect(rpc).toHaveBeenCalledTimes(2);
});
it('does not claim availability after a failed access lookup', async () => {
  const rpc = vi.fn(async () => ({ data: true, error: { message: 'unavailable' } }));
  await expect(
    loadLessonAvailability({ rpc } as unknown as SupabaseClient, 'learner', ['lesson']),
  ).rejects.toThrow('LESSON_AVAILABILITY_UNAVAILABLE');
});
it('opens only an exact course and lesson through the existing authorized preview', () => {
  const course = '11111111-1111-4111-8111-111111111111',
    lesson = '22222222-2222-4222-8222-222222222222';
  expect(coursePreviewTarget(course, lesson)).toBe(
    `/api/admin/videos/lesson-preview?courseId=${course}&lessonId=${lesson}`,
  );
  expect(coursePreviewTarget(course, undefined)).toBeNull();
  expect(coursePreviewTarget('https://other.invalid', lesson)).toBeNull();
});
