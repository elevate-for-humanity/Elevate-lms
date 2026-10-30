import type { ProgramHolderContext } from '@/lib/auth/require-program-holder';
import { isLearnerRosterProfile } from './roster-eligibility';

/** One scoped directory for office messages and meeting invitations. */
export async function loadHolderOfficeStudents(ctx: ProgramHolderContext) {
  if (!ctx.holderId || !ctx.programIds.length) return [];
  const [enrollments, legacy] = await Promise.all([
    ctx.db
      .from('program_enrollments')
      .select('id,user_id,student_id,full_name,email,phone,program_id')
      .eq('program_holder_id', ctx.holderId)
      .in('program_id', ctx.programIds)
      .is('revoked_at', null)
      .in('status', ['active', 'enrolled', 'in_progress', 'completed', 'graduated'])
      .order('full_name'),
    ctx.db
      .from('program_holder_students')
      .select('id,user_id,applicant_name,applicant_email,applicant_phone,program_id')
      .eq('program_holder_id', ctx.holderId)
      .in('program_id', ctx.programIds)
      .in('status', ['applied', 'pending', 'enrolled'])
      .order('applicant_name'),
  ]);
  if (enrollments.error || legacy.error)
    throw new Error('Assigned student directory could not load.');
  const ids = [
    ...new Set(
      [
        ...(enrollments.data ?? []).map((row: any) => row.user_id || row.student_id),
        ...(legacy.data ?? []).map((row: any) => row.user_id),
      ].filter(Boolean),
    ),
  ];
  const profiles = ids.length
    ? await ctx.db.from('profiles').select('id,role,email,phone,full_name').in('id', ids)
    : { data: [], error: null };
  if (profiles.error) throw new Error('Assigned student accounts could not load.');
  const people = new Map<string, any>(
    (profiles.data ?? [])
      .filter(isLearnerRosterProfile)
      .map((profile: any) => [profile.id, profile]),
  );
  const result = new Map<string, any>();
  for (const row of enrollments.data ?? []) {
    const userId = row.user_id || row.student_id;
    const profile = people.get(userId);
    if (!profile) continue;
    result.set(userId, {
      id: `enrollment:${row.id}`,
      enrollment_id: row.id,
      user_id: userId,
      applicant_name: row.full_name || profile.full_name || 'Student',
      applicant_email: row.email || profile.email || null,
      applicant_phone: row.phone || profile.phone || null,
    });
  }
  for (const row of legacy.data ?? []) {
    if (row.user_id && (!people.has(row.user_id) || result.has(row.user_id))) continue;
    result.set(row.user_id || row.id, { ...row, enrollment_id: null });
  }
  return [...result.values()];
}
