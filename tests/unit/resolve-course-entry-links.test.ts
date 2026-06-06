import { describe, expect, it } from 'vitest';
import { resolveCourseEntryLinks } from '@/lib/lms/resolve-course-entry-links';

function mockDb(
  lessons: { id: string; order_index: number }[],
  progress: { lesson_id: string; completed: boolean }[] = [],
) {
  return {
    from(table: string) {
      if (table === 'course_lessons') {
        return {
          select: () => ({
            eq: () => ({
              order: async () => ({ data: lessons, error: null }),
            }),
          }),
        };
      }
      if (table === 'lesson_progress') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                in: async () => ({ data: progress, error: null }),
              }),
            }),
          }),
        };
      }
      throw new Error(`unexpected table ${table}`);
    },
  } as never;
}

describe('resolveCourseEntryLinks', () => {
  it('links workbook to first lesson reading tab', async () => {
    const courseId = 'course-1';
    const links = await resolveCourseEntryLinks(
      mockDb([
        { id: 'lesson-a', order_index: 1 },
        { id: 'lesson-b', order_index: 2 },
      ]),
      courseId,
    );

    expect(links.courseHref).toBe(`/lms/courses/${courseId}`);
    expect(links.workbookHref).toBe(
      `/lms/courses/${courseId}/lessons/lesson-a?activity=reading`,
    );
    expect(links.continueHref).toBe(`/lms/courses/${courseId}/lessons/lesson-a`);
  });

  it('continues at next incomplete lesson for learner', async () => {
    const courseId = 'course-1';
    const links = await resolveCourseEntryLinks(
      mockDb(
        [
          { id: 'lesson-a', order_index: 1 },
          { id: 'lesson-b', order_index: 2 },
        ],
        [{ lesson_id: 'lesson-a', completed: true }],
      ),
      courseId,
      'user-1',
    );

    expect(links.continueHref).toBe(`/lms/courses/${courseId}/lessons/lesson-b`);
  });
});
