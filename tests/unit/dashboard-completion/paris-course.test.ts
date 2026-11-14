// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
const state = vi.hoisted(() => ({
  enrollment: {
    courseId: 'course',
    accessGrantedAt: '2026-01-01',
    status: 'active',
    enrollmentState: 'active',
  },
}));
vi.mock('@/lib/enrollment/resolver', () => ({
  resolveLatestEnrollment: vi.fn(async () => state.enrollment),
}));
import { loadTrustedLearnerCourse } from '@/lib/paris/trusted-learner-course';
beforeEach(() => {
  state.enrollment = {
    courseId: 'course',
    accessGrantedAt: '2026-01-01',
    status: 'active',
    enrollmentState: 'active',
  };
});
it('counts published progress through all pages and never recommends a locked lesson', async () => {
  const rows: Record<string, Record<string, unknown>[]> = {
    courses: [{ id: 'course', title: 'Current course', is_active: true, status: 'published' }],
    course_lessons: [
      { id: 'first', title: 'Completed', is_published: true, course_id: 'course' },
      { id: 'locked', title: 'Locked', is_published: true, course_id: 'course' },
      { id: 'next', title: 'Available next', is_published: true, course_id: 'course' },
      { id: 'draft', title: 'Draft', is_published: false, course_id: 'course' },
    ],
    lesson_progress: [
      ...Array.from({ length: 500 }, (_, i) => ({
        lesson_id: `old-${i}`,
        user_id: 'learner',
        course_id: 'course',
        completed: true,
      })),
      { lesson_id: 'first', user_id: 'learner', course_id: 'course', completed: true },
    ],
  };
  const rpc = vi.fn(async (_name: string, args: { p_lesson_id: string }) => ({
    data: args.p_lesson_id !== 'locked',
    error: null,
  }));
  const db = {
    rpc,
    from(table: string) {
      const filters: ((row: Record<string, unknown>) => boolean)[] = [];
      let start = 0,
        end = Infinity;
      const result = () => ({
        data: rows[table].filter((row) => filters.every((f) => f(row))).slice(start, end + 1),
        error: null,
      });
      const q = {
        select: () => q,
        eq: (key: string, value: unknown) => {
          filters.push((row) => row[key] === value);
          return q;
        },
        order: () => q,
        range: (a: number, b: number) => {
          start = a;
          end = b;
          return q;
        },
        maybeSingle: async () => ({ ...result(), data: result().data[0] }),
        then: (resolve: (value: unknown) => unknown) => Promise.resolve(result()).then(resolve),
      };
      return q;
    },
  };
  expect(await loadTrustedLearnerCourse(db as unknown as SupabaseClient, 'learner')).toMatchObject({
    completedLessons: 1,
    totalLessons: 3,
    courseProgress: 33,
    nextLessonTitle: 'Available next',
  });
  expect(rpc).toHaveBeenCalledTimes(3);
});
it('does not claim learning access for an enrollment without a grant', async () => {
  state.enrollment.accessGrantedAt = '';
  expect(await loadTrustedLearnerCourse({} as SupabaseClient, 'learner')).toBeNull();
});
