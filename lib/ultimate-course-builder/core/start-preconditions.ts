import type { SupabaseClient } from '@supabase/supabase-js';

/** Invoke only after the canonical global and course generation controls allow Start. */
export async function reactivateArchivedCourseForStart(
  db: SupabaseClient,
  course: { id: string; status?: string | null },
): Promise<boolean> {
  if (course.status !== 'archived') return false;

  const { data, error } = await db
    .from('courses')
    .update({
      status: 'draft',
      is_active: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', course.id)
    .eq('status', 'archived')
    .select('id')
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('COURSE_START_STATE_CHANGED');
  return true;
}
