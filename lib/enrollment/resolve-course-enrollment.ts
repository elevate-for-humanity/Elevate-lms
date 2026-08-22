import 'server-only';

import { requireAdminClient } from '@/lib/supabase/admin';

export type CourseEnrollmentResolution = {
  id: string;
  status: string;
  program_id: string | null;
  course_id: string | null;
  user_id: string | null;
  student_id: string | null;
};

/**
 * Resolve the canonical program_enrollments row that grants a learner access
 * to a course.
 *
 * A program enrollment may point directly at one course or may grant access to
 * multiple courses through program_courses. This helper is the single resolver
 * for both shapes so completion routes do not invent separate enrollment rules.
 */
export async function resolveCourseEnrollment(
  userId: string,
  courseId: string,
): Promise<CourseEnrollmentResolution | null> {
  const db = await requireAdminClient();

  const { data: directRows, error: directError } = await db
    .from('program_enrollments')
    .select('id,status,program_id,course_id,user_id,student_id,updated_at')
    .or(`user_id.eq.${userId},student_id.eq.${userId}`)
    .eq('course_id', courseId)
    .order('updated_at', { ascending: false })
    .limit(1);
  if (directError) throw directError;
  if (directRows?.[0]) return directRows[0] as CourseEnrollmentResolution;

  const [{ data: course, error: courseError }, { data: links, error: linkError }] =
    await Promise.all([
      db.from('courses').select('program_id').eq('id', courseId).maybeSingle(),
      db.from('program_courses').select('program_id').eq('course_id', courseId),
    ]);
  if (courseError) throw courseError;
  if (linkError) throw linkError;

  const programIds = [
    ...new Set(
      [course?.program_id, ...(links ?? []).map((link) => link.program_id)].filter(Boolean),
    ),
  ] as string[];
  if (!programIds.length) return null;

  const { data: programRows, error: programEnrollmentError } = await db
    .from('program_enrollments')
    .select('id,status,program_id,course_id,user_id,student_id,updated_at')
    .or(`user_id.eq.${userId},student_id.eq.${userId}`)
    .in('program_id', programIds)
    .order('updated_at', { ascending: false })
    .limit(1);
  if (programEnrollmentError) throw programEnrollmentError;

  return (programRows?.[0] as CourseEnrollmentResolution | undefined) ?? null;
}
