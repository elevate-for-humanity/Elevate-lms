import type { SupabaseClient } from '@supabase/supabase-js';

/** Imported courses may have no creator. Do not invent their creation history. */
export async function resolveReleaseActor(
  db: SupabaseClient,
  courseId: string,
  buildAdministratorId?: string,
): Promise<string> {
  const { data: course, error } = await db.from('courses')
    .select('created_by').eq('id', courseId).single();
  if (error) throw error;
  if (!course) throw new Error('ULTIMATE_COURSE_NOT_FOUND');
  if (course.created_by) return course.created_by;
  if (!buildAdministratorId) throw new Error('ULTIMATE_RELEASE_ACTOR_REQUIRED');
  const { data: administrator, error: roleError } = await db.from('profiles')
    .select('id,role').eq('id', buildAdministratorId).single();
  if (roleError) throw roleError;
  if (!administrator || !['admin', 'super_admin'].includes(administrator.role))
    throw new Error('ULTIMATE_RELEASE_ADMINISTRATOR_REQUIRED');
  return administrator.id;
}
