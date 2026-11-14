import type { requireAdminClient } from '@/lib/supabase/admin';
import { normalizeEmailSubject, parseEmailList } from './communication-email';

type Database = Awaited<ReturnType<typeof requireAdminClient>>;
const ADMIN_ADDRESS = 'admissions@elevateforhumanity.org';
const INTAKE_ADDRESSES = new Set([ADMIN_ADDRESS, 'enrollment@elevateforhumanity.org']);

/** Only canonical, unambiguous primary assignments may receive applicant copies. */
export async function programConversationRoute(
  db: Database,
  applicantAddresses: string[],
  internalAddresses: string[],
): Promise<{ addresses: string[]; applicantEmail: string; replyTo: string } | null> {
  const emails = [...new Set(applicantAddresses.flatMap(parseEmailList))];
  if (emails.length !== 1) return null; // Never copy a bulk roster to another holder.
  const applicantEmail = emails[0];
  const { data: applications, error } = await db
    .from('applications')
    .select('program_id,program_slug,program_interest,pathway_slug')
    .eq('email', applicantEmail);
  if (error || !applications?.length) return null;
  const slugs = [
    ...new Set(applications.map((row) => row.program_slug || row.program_interest).filter(Boolean)),
  ];
  const ids = [...new Set(applications.map((row) => row.program_id).filter(Boolean))];
  // Preserve distinct CDL pathway assignments while allowing every other program.
  if (slugs.includes('cdl-training') && applications.some(
      (row) =>
        row.pathway_slug && row.pathway_slug !== 'cdl-training' && row.pathway_slug !== 'class-a',
    ))
    return null;
  const linked = await db
    .from('program_holder_students')
    .select('program_holder_id,program_id')
    .eq('applicant_email', applicantEmail)
    .in('status', ['applied', 'pending', 'active', 'enrolled', 'completed']);
  if (linked.error) throw linked.error;
  const linkedHolderIds = [...new Set((linked.data || []).map((row) => row.program_holder_id))];
  if (linkedHolderIds.length !== 1) return null;
  const assignments = await db
    .from('program_holder_programs')
    .select('program_holder_id,program_id,program_slug')
    .eq('status', 'active')
    .eq('is_primary', true);
  if (assignments.error) throw assignments.error;
  const holderIds = [
    ...new Set(
      (assignments.data || [])
        .filter((row) => !ids.length || ids.includes(row.program_id))
        .filter((row) => (linked.data || []).some(link => link.program_id===row.program_id))
        .filter((row) => linkedHolderIds.includes(row.program_holder_id))
        .map((row) => row.program_holder_id),
    ),
  ];
  if (holderIds.length !== 1) return null;
  const result = await db
    .from('communication_email_mailboxes')
    .select('address,program_holder_id')
    .eq('active', true)
    .eq('program_holder_id', holderIds[0]);
  if (result.error) throw result.error;
  const holderAddresses = (result.data || []).map((row) => row.address);
  if (!holderAddresses.length) return null;
  const internal = internalAddresses.flatMap(parseEmailList);
  if (
    !internal.some((address) => INTAKE_ADDRESSES.has(address) || holderAddresses.includes(address))
  )
    return null;
  return { addresses: [ADMIN_ADDRESS, ...holderAddresses], applicantEmail, replyTo: ADMIN_ADDRESS };
}

export function applicantConversationSubject(subject: string, email: string): string {
  // A shared blast subject must not merge conversations from different applicants.
  return `${normalizeEmailSubject(subject)} :: ${email.toLowerCase()}`;
}
