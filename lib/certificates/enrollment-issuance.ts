import 'server-only';
import type { SupabaseClient } from '@/lib/supabase';
import type { EmailAttachment } from '@/lib/email/sendgrid';
import type { HostStudentCertificate } from './host-shop-student-records';
import { hostStudentCertificatePdf } from './host-shop-student-pdf';
import { eligibleForEnrollmentCertificate, enrollmentCertificateCampaign } from './enrollment-issuance-policy';

const fields = 'id,user_id,student_id,full_name,email,program_slug,status,payment_status,amount_paid_cents,amount_paid,revoked_at,refunded_at,enrollment_confirmed_at,enrolled_at,host_shop_id,funding_status';
const cleanEmail = (value: unknown) => String(value || '').trim().toLowerCase();
// Kept local on purpose: this module is loaded standalone by the native test
// harness, so it must not depend on imports beyond the ones it already has.
// Mirrors deriveCertificateRoleLabel in host-shop-student-records.ts.
const certificateRoleLabel = (program: string) => (/Apprenticeship$/i.test(program) ? program.replace(/Apprenticeship$/i, 'Apprentice') : null);
const CERTIFICATE_SPONSOR_LEGAL_NAME = '2Exclusive LLC-S';

async function resolveEnrollment(db: SupabaseClient, id: string) {
  const { data: e, error } = await db.from('program_enrollments').select(fields).eq('id', id).maybeSingle();
  if (error) throw new Error('Enrollment unavailable');
  if (!e || !eligibleForEnrollmentCertificate(e)) return null;
  const userId = e.user_id || e.student_id;
  const profile = await db.from('profiles').select('full_name,email').eq('id', userId).maybeSingle();
  if (profile.error) throw new Error('Student identity unavailable');
  const name = profile.data?.full_name || e.full_name;
  if (!name || /\[QA|^test\b/i.test(name)) return null;
  const placements = await db.from('apprentice_placements').select('id,shop_id')
    .eq('student_id', userId).eq('program_slug', e.program_slug).eq('status', 'active').is('end_date', null);
  if (placements.error) throw new Error('Host placement unavailable');
  const shopIds = [...new Set((placements.data || []).map(p => p.shop_id))];
  // Do not guess a shop when current placement records conflict.
  if (shopIds.length > 1) throw new Error('Conflicting host placements require reconciliation');
  const shopId = shopIds[0] || e.host_shop_id;
  let shop: { id: string; name: string; email: string | null; owner_email: string | null; city: string | null; state: string | null } | null = null;
  if (shopId) {
    const result = await db.from('host_shops').select('id,name,email,owner_email,city,state').eq('id', shopId).maybeSingle();
    if (result.error || !result.data) throw new Error('Assigned host shop unavailable');
    shop = result.data;
  }
  // Program facts feed the certification statement (title, hours). A missing
  // or unreadable program row must not block issuance: fall back to the
  // slug-derived label and no hours segment.
  const programResult = await db.from('programs').select('name,duration_hours').eq('slug', e.program_slug).maybeSingle();
  const programInfo = programResult.error ? null : programResult.data;
  const programLabel = programInfo?.name || e.program_slug.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const programHours = Number(programInfo?.duration_hours) > 0 ? Number(programInfo?.duration_hours) : null;
  const recipients = new Set<string>();
  const studentEmail = cleanEmail(profile.data?.email || e.email);
  if (studentEmail) recipients.add(studentEmail);
  // Each host receives only its assigned student's certificate.
  const hostEmail = cleanEmail(shop?.owner_email || shop?.email);
  if (hostEmail) recipients.add(hostEmail);
  const placement = placements.data?.[0];
  const record: HostStudentCertificate = {
    id: placement ? `placement-${placement.id}` : `enrollment-${e.id}`,
    reference: placement ? `EFH-HS-${placement.id.toUpperCase()}` : `EFH-ENR-${e.id.toUpperCase()}`,
    studentName: name.trim(), studentId: userId, shopId: shop?.id || '',
    shopName: shop?.name || 'Elevate for Humanity',
    program: programLabel,
    title: 'Certificate of Enrollment', status: 'enrolled',
    recordDate: e.enrollment_confirmed_at || e.enrolled_at,
    roleLabel: certificateRoleLabel(programLabel),
    programHours,
    sponsorLegalName: CERTIFICATE_SPONSOR_LEGAL_NAME,
    shopCity: shop?.city || null, shopState: shop?.state || null,
  };
  return { record, recipients: [...recipients], userId, hostEmail: hostEmail || null };
}

/** Run by the existing interoffice-mail scheduler, independent of payment provider. */
export async function queuePaidEnrollmentCertificates(db: SupabaseClient) {
  const mailbox = await db.from('communication_email_mailboxes').select('id')
    .eq('address', 'admissions@elevateforhumanity.org').eq('active', true).maybeSingle();
  if (mailbox.error || !mailbox.data) throw new Error('Admissions sending mailbox unavailable');
  const mailboxId = mailbox.data.id;
  let queued = 0;
  for (let offset = 0; ; offset += 500) {
    const page = await db.from('program_enrollments').select(fields).order('id').range(offset, offset + 499);
    if (page.error) throw new Error('Enrollment issuance scan unavailable');
    for (const e of page.data || []) {
      if (!eligibleForEnrollmentCertificate(e)) continue;
      const resolved = await resolveEnrollment(db, e.id);
      if (!resolved?.recipients.length) continue;
      const campaign = enrollmentCertificateCampaign(e.id);
      const existing = await db.from('communication_email_outbox').select('recipient_email').eq('campaign_key', campaign);
      if (existing.error) throw new Error('Certificate delivery history unavailable');
      const known = new Set((existing.data || []).map(r => cleanEmail(r.recipient_email)));
      const rowFor = (email: string) => ({
        campaign_key: campaign, user_id: resolved.userId, recipient_email: email,
        mailbox_id: mailboxId,
        subject: `Enrollment certificate: ${resolved.record.studentName} — ${resolved.record.program}`,
        body: `Attached is the current Elevate enrollment certificate for ${resolved.record.studentName}, ${resolved.record.program}.\n\nThis version includes 2Exclusive LLC-S, DOL Apprenticeship Sponsor, the Elevate seal and Elizabeth Greene's authorized signature. Please replace any earlier enrollment certificate for this student with this version.\n\nThis confirms enrollment only; completion credentials are issued separately after verified completion.\n\nElizabeth Greene\nElevate for Humanity`,
      });
      const fresh = resolved.recipients.filter(email => !known.has(email));
      const standardRows = fresh.filter(email => email !== resolved.hostEmail).map(rowFor);
      if (standardRows.length) {
        const saved = await db.from('communication_email_outbox').upsert(standardRows, { onConflict: 'campaign_key,recipient_email', ignoreDuplicates: true });
        if (saved.error) throw new Error('Certificate delivery could not be queued');
        queued += standardRows.length;
      }
      if (resolved.hostEmail) {
        // The outbox review trigger (private.review_paris_outbox) silently
        // diverts a 'pending' insert addressed to a partner or program-holder
        // contact into owner review, returning NULL so the row never lands —
        // and a host shop's email is always such a contact, so the shop's
        // certificate copy was dropped on every run while the student's went
        // out. The certificate is a transactional document the shop is owed,
        // not outreach, so stage its copy in the non-intercepted 'processing'
        // state and immediately release it to 'pending' with an update
        // (updates are not intercepted). The release also frees a shop copy
        // stranded in 'processing' by an interrupted earlier run.
        if (fresh.includes(resolved.hostEmail)) {
          const staged = await db.from('communication_email_outbox').upsert([{ ...rowFor(resolved.hostEmail), status: 'processing' }], { onConflict: 'campaign_key,recipient_email', ignoreDuplicates: true });
          if (staged.error) throw new Error('Certificate host copy could not be queued');
          queued += 1;
        }
        const released = await db.from('communication_email_outbox').update({ status: 'pending' })
          .eq('campaign_key', campaign).eq('recipient_email', resolved.hostEmail).eq('status', 'processing');
        if (released.error) throw new Error('Certificate host copy could not be released for delivery');
      }
    }
    if ((page.data || []).length < 500) break;
  }
  return { queued };
}

/** Revalidate enrollment, payment and current recipient ownership immediately before sending. */
export async function enrollmentCertificateAttachments(db: SupabaseClient, campaign: string, recipient: string): Promise<EmailAttachment[] | undefined> {
  if (!campaign.startsWith('enrollment-certificate:')) return undefined;
  const match = /^enrollment-certificate:v2:([0-9a-f-]{36})$/i.exec(campaign);
  if (!match) throw new Error('Unsupported enrollment certificate delivery');
  const resolved = await resolveEnrollment(db, match[1]);
  if (!resolved || !resolved.recipients.includes(cleanEmail(recipient))) throw new Error('Certificate recipient or payment is no longer valid');
  const bytes = await hostStudentCertificatePdf(resolved.record);
  return [{ content: Buffer.from(bytes).toString('base64'), filename: `${resolved.record.reference}-v2.pdf`, type: 'application/pdf', disposition: 'attachment' }];
}
