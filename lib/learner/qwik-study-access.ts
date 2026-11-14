import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';

type Enrollment = {
  user_id: string | null;
  student_id: string | null;
  program_id: string | null;
  status: string | null;
  enrollment_state: string | null;
  access_status: string | null;
  access_granted_at: string | null;
  revoked_at: string | null;
  cancelled_at: string | null;
  suspended_at: string | null;
  refunded_at: string | null;
};

export function canReadQwikStudyCode(row: Enrollment, studentId: string): boolean {
  return (
    (row.user_id ?? row.student_id) === studentId &&
    Boolean(row.program_id && row.access_granted_at) &&
    ['active', 'enrolled', 'in_progress', 'confirmed'].includes(row.status ?? '') &&
    ['active', 'enrolled'].includes(row.enrollment_state ?? '') &&
    [null, 'active', 'granted'].includes(row.access_status) &&
    !row.revoked_at && !row.cancelled_at && !row.suspended_at && !row.refunded_at
  );
}

/** Call only after authenticating the learner or resolving a signed admin preview. */
export async function loadQwikStudyCode(db: SupabaseClient<any>, studentId: string) {
  const { data: enrollments, error: enrollmentError } = await db
    .from('program_enrollments')
    .select('user_id,student_id,program_id,status,enrollment_state,access_status,access_granted_at,revoked_at,cancelled_at,suspended_at,refunded_at,programs!inner(slug)')
    .or(`user_id.eq.${studentId},student_id.eq.${studentId}`)
    .eq('programs.slug', 'hvac-technician');
  if (enrollmentError) return null;
  const programIds = [...new Set((enrollments ?? [])
    .filter(row => canReadQwikStudyCode(row, studentId))
    .map(row => row.program_id))];
  if (!programIds.length) return null;
  const { data, error } = await db.from('program_study_access_codes')
    .select('access_code')
    .in('program_id', programIds)
    .eq('resource_key', 'qwik608')
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();
  return error ? null : data?.access_code ?? null;
}
