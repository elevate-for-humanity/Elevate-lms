import type { SupabaseClient } from '@supabase/supabase-js';
import { LEARNER_ROSTER_ROLES } from '@/lib/program-holder/roster-eligibility';
export async function loadStudentDirectory(db: SupabaseClient) {
  const profiles = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await db
      .from('profiles')
      .select('id, full_name, first_name, last_name, email, phone, created_at, role')
      .in('role', [...LEARNER_ROSTER_ROLES])
      .like('email', '%@%')
      .order('created_at', { ascending: false })
      .order('id', { ascending: true })
      .range(offset, offset + 499);
    if (error) throw new Error('STUDENT_DIRECTORY_UNAVAILABLE');
    profiles.push(...(data ?? []));
    if ((data ?? []).length < 500) break;
  }
  const enrollments = [];
  for (let start = 0; start < profiles.length; start += 100) {
    const ids = profiles.slice(start, start + 100).map((profile) => profile.id);
    for (const key of ['user_id', 'student_id'] as const) {
      for (let offset = 0; ; offset += 500) {
        let query = db
          .from('program_enrollments')
          .select(
            'id,user_id,student_id,status,enrollment_state,access_granted_at,program_slug,revoked_at,suspended_at,cancelled_at,enrolled_at',
          )
          .in(key, ids)
          .order('enrolled_at', { ascending: false })
          .order('id', { ascending: true })
          .range(offset, offset + 499);
        if (key === 'student_id') query = query.is('user_id', null);
        const { data, error } = await query;
        if (error) throw new Error('STUDENT_ENROLLMENTS_UNAVAILABLE');
        enrollments.push(...(data ?? []));
        if ((data ?? []).length < 500) break;
      }
    }
  }
  enrollments.sort((a, b) =>
    String(b.enrolled_at ?? '').localeCompare(String(a.enrolled_at ?? '')),
  );
  return { profiles, enrollments };
}
export function directoryEnrollmentState(enrollment: {
  status?: string | null;
  enrollment_state?: string | null;
  revoked_at?: string | null;
  suspended_at?: string | null;
  cancelled_at?: string | null;
}) {
  if (enrollment.revoked_at) return 'revoked';
  if (enrollment.suspended_at) return 'suspended';
  if (enrollment.cancelled_at) return 'cancelled';
  const blocked = ['revoked', 'withdrawn', 'suspended', 'cancelled', 'rejected'];
  if (blocked.includes(enrollment.status ?? '')) return enrollment.status!;
  return enrollment.enrollment_state ?? enrollment.status;
}
