import 'server-only';

import type { SupabaseClient } from '@/lib/supabase';
/** Course metadata scope, matching direct and program-based enrollment grants.
 * This never unlocks instruction: lesson access and pacing remain authoritative.
 */
export async function loadLearnerCourseIds(
  db: SupabaseClient,
  userId: string,
  includeCompleted = false,
) {
  const statuses = [
    'active',
    'enrolled',
    'in_progress',
    'confirmed',
    ...(includeCompleted ? ['completed'] : []),
  ];
  const [programs, direct] = await Promise.all([
    db
      .from('program_enrollments')
      .select('course_id,program_id')
      .or(`user_id.eq.${userId},student_id.eq.${userId}`)
      .in('status', statuses)
      .is('revoked_at', null),
    db
      .from('course_enrollments')
      .select('course_id')
      .eq('student_id', userId)
      .in('status', statuses),
  ]);
  if (programs.error) throw programs.error;
  if (direct.error) throw direct.error;
  const programIds = [
    ...new Set((programs.data || []).map((row) => row.program_id).filter(Boolean)),
  ];
  const links = programIds.length
    ? await db.from('program_courses').select('course_id').in('program_id', programIds)
    : { data: [], error: null };
  if (links.error) throw links.error;
  return [
    ...new Set(
      [
        ...(programs.data || []).map((row) => row.course_id),
        ...(direct.data || []).map((row) => row.course_id),
        ...(links.data || []).map((row) => row.course_id),
      ].filter(Boolean),
    ),
  ] as string[];
}
