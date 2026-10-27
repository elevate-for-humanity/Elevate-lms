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
