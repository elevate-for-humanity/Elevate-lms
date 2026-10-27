import type { SupabaseClient } from '@supabase/supabase-js';
import { studentContactProjection } from '@/lib/program-holder/contact-privacy';

// Recipient suggestions are scoped to the authenticated holder's assigned roster.
// They grant no mailbox membership or access to student mail.
export async function assignedStudentDirectory(db: SupabaseClient<any>, userId: string) {
  const holderIds = await studentContactHolderIds(db, userId);
  if (!holderIds.length) return [];
  const { data: students, error } = await db
    .from('program_holder_students')
    .select('id,applicant_name,applicant_email')
    .in('program_holder_id', holderIds)
    .in('status', ['applied', 'pending', 'enrolled'])
    .order('applicant_name');
  if (error) throw error;
  return (students || [])
    .filter((student) => student.applicant_email)
    .map((student) => ({
      id: `student-${student.id}`,
      address: student.applicant_email!,
      display_name: student.applicant_name || student.applicant_email!,
      mailbox_kind: 'individual' as const,
    }));
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
