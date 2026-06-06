import 'server-only';

import type { SupabaseClient } from '@/lib/supabase';

export type CourseEntryLinks = {
  courseHref: string;
  /** First published lesson reading tab, or course home when no lessons exist */
  workbookHref: string;
  /** Next incomplete lesson, or first lesson, or course home */
  continueHref: string;
  firstLessonId: string | null;
};

/**
 * Resolve LMS URLs for apprenticeship dashboards.
 * Workbook opens the first lesson's reading activity (not course-level ?activity=).
 */
export async function resolveCourseEntryLinks(
  db: SupabaseClient,
  courseId: string,
  userId?: string | null,
): Promise<CourseEntryLinks> {
  const courseHref = `/lms/courses/${courseId}`;

  const { data: lessons } = await db
    .from('course_lessons')
    .select('id, order_index')
    .eq('course_id', courseId)
    .order('order_index', { ascending: true });

  const published =
    lessons?.filter((row) => row.id) ?? [];

  const firstLesson = published[0] ?? null;
  const firstLessonId = firstLesson?.id ?? null;

  const workbookHref = firstLessonId
    ? `/lms/courses/${courseId}/lessons/${firstLessonId}?activity=reading`
    : courseHref;

  let continueHref = courseHref;

  if (firstLessonId) {
    continueHref = `/lms/courses/${courseId}/lessons/${firstLessonId}`;

    if (userId && published.length > 0) {
      const lessonIds = published.map((l) => l.id);
      const { data: progress } = await db
        .from('lesson_progress')
        .select('lesson_id, completed')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .in('lesson_id', lessonIds);

      const completedIds = new Set(
        (progress ?? []).filter((p) => p.completed).map((p) => p.lesson_id),
      );
      const nextLesson = published.find((l) => !completedIds.has(l.id)) ?? firstLesson;
      if (nextLesson?.id) {
        continueHref = `/lms/courses/${courseId}/lessons/${nextLesson.id}`;
      }
    }
  }

  return {
    courseHref,
    workbookHref,
    continueHref,
    firstLessonId,
  };
}
