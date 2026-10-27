import type { SupabaseClient } from '@supabase/supabase-js';
import { studentContactProjection } from '@/lib/program-holder/contact-privacy';

type DirectoryStudent = {
  id: string;
  user_id?: string | null;
  student_id?: string | null;
  full_name?: string | null;
  email?: string | null;
  applicant_name?: string | null;
  applicant_email?: string | null;
};

// Recipient suggestions are scoped to the authenticated holder's assigned roster.
// They grant no mailbox membership or access to student mail.
export async function assignedStudentDirectory(db: SupabaseClient<any>, userId: string) {
  const holderIds = await studentContactHolderIds(db, userId);
  if (!holderIds.length) return [];
  const rows: { id: string; address: string; display_name: string; mailbox_kind: 'individual' }[] =
    [];
  // Canonical enrollments and legacy applicants are different rosters. Include
  // both, but never broaden beyond the authenticated holder's assignments.
  for (const table of ['program_enrollments', 'program_holder_students'] as const) {
    for (let offset = 0; ; offset += 500) {
      let query = db
        .from(table)
        .select(
          table === 'program_enrollments'
            ? 'id,user_id,student_id,full_name,email'
            : 'id,applicant_name,applicant_email',
        )
        .in('program_holder_id', holderIds)
        .in(
          'status',
          table === 'program_enrollments'
            ? ['active', 'enrolled', 'in_progress', 'confirmed', 'completed', 'graduated']
            : ['applicant', 'applied', 'pending', 'enrolled', 'active', 'completed', 'graduated'],
        );
      if (table === 'program_enrollments') query = query.is('revoked_at', null);
      const { data: students, error } = await query
        .order('id')
        .range(offset, offset + 499)
        .returns<DirectoryStudent[]>();
      if (error) throw error;
      const missingIds =
        table === 'program_enrollments'
          ? [
              ...new Set(
                (students ?? [])
                  .filter((student) => !student.email)
                  .map((student) => student.user_id || student.student_id)
                  .filter(Boolean),
              ),
            ]
          : [];
      const { data: profiles, error: profileError } = missingIds.length
        ? await db.from('profiles').select('id,email').in('id', missingIds)
        : { data: [], error: null };
      if (profileError) throw profileError;
      const accountEmails = new Map((profiles ?? []).map((profile) => [profile.id, profile.email]));
      for (const student of students ?? []) {
        const address = String(
          table === 'program_enrollments'
            ? (student.email ?? accountEmails.get(student.user_id || student.student_id) ?? '')
            : (student.applicant_email ?? ''),
        ).trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) continue;
        rows.push({
          id: table + '-' + student.id,
          address,
          display_name: String(student.full_name || student.applicant_name || address),
          mailbox_kind: 'individual',
        });
      }
      if ((students ?? []).length < 500) break;
    }
  }
  const unique = new Map<string, (typeof rows)[number]>();
  for (const row of rows)
    if (!unique.has(row.address.toLowerCase())) unique.set(row.address.toLowerCase(), row);
  return [...unique.values()].sort((a, b) => a.display_name.localeCompare(b.display_name));
}

// Students see only the active course mailboxes of their own assigned holders.
export async function assignedInstructorDirectory(db: SupabaseClient<any>, userId: string) {
  const { data: assignments, error } = await db
    .from('program_holder_students')
    .select('program_holder_id')
    .eq('user_id', userId)
    .in('status', ['applied', 'pending', 'enrolled']);
  if (error) throw error;
  const holderIds = [
    ...new Set((assignments || []).map((row) => row.program_holder_id).filter(Boolean)),
  ];
  if (!holderIds.length) return [];
  const { data: holders, error: holderError } = await db
    .from('program_holders')
    .select('id,contact_name')
    .in('id', holderIds)
    .eq('status', 'active');
  if (holderError) throw holderError;
  if (!holders?.length) return [];
  const { data: mailboxes, error: mailboxError } = await db
    .from('communication_email_mailboxes')
    .select('id,address,display_name,program_holder_id')
    .in(
      'program_holder_id',
      holders.map((holder) => holder.id),
    )
    .eq('mailbox_kind', 'program_holder')
    .eq('active', true);
  if (mailboxError) throw mailboxError;
  return (mailboxes || []).map((mailbox) => ({
    id: mailbox.id,
    address: mailbox.address,
    display_name:
      holders.find((holder) => holder.id === mailbox.program_holder_id)?.contact_name ||
      mailbox.display_name,
    mailbox_kind: 'program_holder' as const,
  }));
}

// Match the existing holder workspace contact-release rules.
export async function studentContactHolderIds(db: SupabaseClient<any>, userId: string) {
  const [{ data: holders, error }, { data: acknowledgements, error: acknowledgementError }] =
    await Promise.all([
      db
        .from('program_holders')
        .select('id,organization_name,name')
        .eq('user_id', userId)
        .eq('status', 'active'),
      db
        .from('program_holder_acknowledgements')
        .select('document_type')
        .eq('user_id', userId)
        .eq('document_type', 'non_compete')
        .limit(1),
    ]);
  if (error || acknowledgementError) throw error || acknowledgementError;
  return (holders || [])
    .filter(
      (holder) =>
        studentContactProjection(
          /enchanted hearts/i.test(`${holder.organization_name || ''} ${holder.name || ''}`),
          Boolean(acknowledgements?.length),
        ).granted,
    )
    .map((holder) => holder.id);
}
