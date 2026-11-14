import type { requireAdminClient } from '@/lib/supabase/admin';
import { normalizeEmailSubject, parseEmailList } from './communication-email';

type Database = Awaited<ReturnType<typeof requireAdminClient>>;
const ADMIN_ADDRESS = 'admissions@elevateforhumanity.org';
const INTAKE_ADDRESSES = new Set([ADMIN_ADDRESS, 'enrollment@elevateforhumanity.org']);

// ILIKE treats %/_ as wildcards, and PostgREST also aliases * to %.
// An anchored literal regex avoids both layers while preserving case folding.
export function exactCaseInsensitiveEmailPattern(email: string): string {
  return '^' + email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$';
}

/** Only unique, explicit, active applicant assignments may receive protected copies. */
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
    .filter('email', 'imatch', exactCaseInsensitiveEmailPattern(applicantEmail));
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
    .filter('applicant_email', 'imatch', exactCaseInsensitiveEmailPattern(applicantEmail))
    .in('status', ['applied', 'pending', 'active', 'enrolled', 'completed']);
  if (linked.error) throw linked.error;
  const linkedHolderIds = [...new Set((linked.data || []).map((row) => row.program_holder_id))];
  if (linkedHolderIds.length !== 1) return null;
  // An applicant's unique explicit holder assignment is authoritative even if
  // the holder is not the primary program-wide instructor (e.g. Jozanna).
  let assignmentQuery = db
    .from('program_holder_programs')
    .select('program_holder_id,program_id,program_slug')
    .eq('status', 'active');
  if (ids.length) assignmentQuery = assignmentQuery.in('program_id', ids);
  const assignments = await assignmentQuery;
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
  // Program Holder application history is not a Host Shop placement. An archived
  // holder retains historical records and its role-specific mailbox, but
  // automatic application/conversation copies must not enter an active Host
  // Shop mailbox merely because the programs overlap. Direct mail is handled
  // by the mailbox routing layer, which preserves the Admin fallback.
  const holder = await db
    .from('program_holders')
    .select('features')
    .eq('id', holderIds[0])
    .maybeSingle();
  if (holder.error || !holder.data) return null;
  if (holder.data.features?.portal_access_archived === true) return null;
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
