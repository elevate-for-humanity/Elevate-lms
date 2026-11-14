import 'server-only';

import type { SupabaseClient } from '@/lib/supabase';

export type CourseEntryLinks = {
  courseHref: string;
  /** Assigned digital workbook, otherwise the existing lesson reading activity. */
  workbookHref: string;
  /** Next incomplete lesson, or first lesson, or course home */
  continueHref: string;
  firstLessonId: string | null;
};

/**
 * Resolve LMS URLs for apprenticeship dashboards.
 * Prefer an assigned digital workbook without changing course continuation.
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

  const published = lessons?.filter((row) => row.id) ?? [];

  const firstLesson = published[0] ?? null;
  const firstLessonId = firstLesson?.id ?? null;

  let workbookHref = firstLessonId
    ? `/lms/courses/${courseId}/lessons/${firstLessonId}?activity=reading`
    : courseHref;

  const { data: course, error: courseError } = await db
    .from('courses')
    .select('program_id')
    .eq('id', courseId)
    .maybeSingle();
  if (courseError) throw courseError;
  if (course?.program_id) {
    const { data: workbook, error: workbookError } = await db
      .from('digital_workbooks')
      .select('slug')
      .eq('program_id', course.program_id)
      .eq('is_active', true)
      .maybeSingle();
    if (workbookError) throw workbookError;
    if (workbook) workbookHref = `/workbooks/${workbook.slug}`;
  }

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
