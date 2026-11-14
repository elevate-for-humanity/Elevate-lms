import type { SupabaseClient } from '@supabase/supabase-js';

/** Instructor ownership is an active assignment, not a legacy course column. */
export async function isAssignedCourseInstructor(
  db: SupabaseClient,
  instructorId: string,
  courseId: string,
): Promise<boolean> {
  const { data, error } = await db
    .from('instructor_assignments')
    .select('id')
    .eq('instructor_id', instructorId)
    .eq('course_id', courseId)
    .eq('active', true)
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Instructor assignment unavailable: ${error.message}`);
  return Boolean(data);
}

/** Load only courses backed by an active, persisted instructor assignment. */
export async function loadAssignedInstructorCourses(
  db: SupabaseClient,
  instructorId: string,
  columns = '*',
): Promise<{ data: any[] | null; error: any }> {
  const ids: string[] = [];
  for (let offset = 0; ; offset += 500) {
    const result = await db.from('instructor_assignments')
      .select('id,course_id').eq('instructor_id', instructorId).eq('active', true)
      .order('id').range(offset, offset + 499);
    if (result.error) return { data: null, error: result.error };
    ids.push(...(result.data ?? []).map(row => row.course_id).filter(Boolean));
    if (!result.data || result.data.length < 500) break;
  }
  const uniqueIds = [...new Set(ids)];
  const courses: any[] = [];
  for (let offset = 0; offset < uniqueIds.length; offset += 500) {
    const result = await db.from('lms_courses').select(columns)
      .in('id', uniqueIds.slice(offset, offset + 500)).order('created_at', {ascending:false});
    if (result.error) return { data: null, error: result.error };
    courses.push(...(result.data ?? []));
  }
  return { data: courses, error: null };
}
