import type { SupabaseClient } from '@/lib/supabase';

/**
 * Canonical persisted LMS publication.
 * One server-side transaction owns status, module and lesson membership,
 * and the immutable version receipt. No independent best-effort snapshot.
 * The RPC enforces role and actor identity before any publication write.
 */
export async function publishCourse(
  db: SupabaseClient,
  courseId: string,
  actorUserId: string | null,
  label?: string,
) {
  const { data, error } = await db.rpc('publish_course_with_version', {
    p_course_id: courseId,
    p_actor_user_id: actorUserId,
    p_label: label ?? null,
  });
  if (error) throw new Error(`Atomic publish failed: ${error.message}`);
  const receipt = data as {
    course?: { id: string };
    version?: { id: string; version_number?: number };
  } | null;
  if (!receipt?.course?.id || !receipt?.version?.id ||
      receipt.course.id !== courseId)
    throw new Error('PUBLISH_ATOMIC_VERSION_RECEIPT_REQUIRED');
  return { course: receipt.course, version: receipt.version };
}
