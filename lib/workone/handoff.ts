import crypto from 'node:crypto';
import PDFDocument from 'pdfkit';

import { getAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/sendgrid';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { organization } from '@/lib/config/organization';
import { logger } from '@/lib/logger';
import { WORKONE_INDY_BOOKING_URL } from '@/lib/workone/booking';

const WORKONE_INTAKE_URL = WORKONE_INDY_BOOKING_URL;
const ICC_URL = 'https://www.indianacareerconnect.com';
const STAFF_EMAIL = 'elevate4humanityedu@gmail.com';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function tokenHash(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function cleanProgramCode(value: unknown): string | null {
  const code = typeof value === 'string' ? value.trim() : '';
  return code || null;
}

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function createProgramSheetPdf(input: {
  applicantName: string;
  referenceNumber: string;
  programName: string;
  programCode: string | null;
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'LETTER', margin: 54 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(20).text('WorkOne / INTraining Program Information', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(11).text('Bring this sheet to your WorkOne appointment.', { align: 'center' });
    doc.moveDown(1.5);

    doc.fontSize(12).text(`Applicant: ${input.applicantName}`);
    doc.text(`Elevate application reference: ${input.referenceNumber}`);
    doc.moveDown();

    doc.fontSize(13).text(`Program: ${input.programName}`);
    doc.fontSize(18).text(
      `INTraining Program ID: ${input.programCode || 'VERIFY WITH ELEVATE BEFORE APPOINTMENT'}`,
      { underline: true },
    );
    doc.moveDown();

    doc.fontSize(12).text(`Legal provider name: ${organization.legalName}`);
    doc.text(`DBA: ${organization.dbaName}`);
    doc.text(`Provider website: ${PLATFORM_DEFAULTS.siteUrl}`);
    doc.text(`Provider phone: ${organization.phone}`);
    doc.text(`Provider email: ${organization.email}`);
    doc.text(`Administrative address: ${organization.address}`);
    doc.moveDown();

    if (input.programCode) {
      doc
        .fontSize(11)
        .text(
          'WorkOne staff: please search INTraining using the exact program ID above. If a provider-name search does not return Elevate, use the program ID first and verify the provider as 2Exclusive LLC-S dba Elevate for Humanity Career & Technical Institute.',
        );
    } else {
      doc
        .fontSize(11)
        .text(
          'The selected program does not currently have an INTraining program ID stored in Elevate’s production program record. The applicant should contact Elevate before the WorkOne appointment so staff can verify the correct funding listing.',
        );
    }

    doc.moveDown();
    doc.fontSize(10).text(
      'Funding eligibility and approval are determined by WorkOne / the applicable workforce agency. This sheet identifies the applicant’s selected Elevate training program; it is not a funding approval letter.',
    );
    doc.end();
  });
}

export type WorkOneHandoffResult = {
  required: boolean;
  sent?: boolean;
  alreadySent?: boolean;
  missingProgramCode?: boolean;
  programName?: string;
  programCode?: string | null;
};

export async function ensureWorkOneHandoffByReference(
  applicationIdentifier: string,
): Promise<WorkOneHandoffResult> {
  const db = await getAdminClient();
  if (!db) throw new Error('Database unavailable');

  let applicationQuery = db
    .from('applications')
    .select(
      'id, first_name, last_name, email, phone, reference_number, program_interest, program_slug, funding_type',
    );

  if (applicationIdentifier.startsWith('EFH-')) {
    applicationQuery = applicationQuery.eq('reference_number', applicationIdentifier);
  } else if (UUID_PATTERN.test(applicationIdentifier)) {
    applicationQuery = applicationQuery.eq('id', applicationIdentifier);
  } else {
    return { required: false };
  }

  const { data: application, error: applicationError } = await applicationQuery.maybeSingle();

  if (applicationError || !application) {
    return { required: false };
  }

  const fundingType = String(application.funding_type || '').toLowerCase();
  if (fundingType !== 'wioa' && fundingType !== 'wrg') {
    return { required: false };
  }

  const programSlug = application.program_slug || application.program_interest || '';
  let programRow: any = null;

  if (programSlug) {
    const bySlug = await db
      .from('programs')
      .select('slug, title, name, intrainingid, intraining_program_id, etpl_listed, wioa_approved')
      .eq('slug', programSlug)
      .limit(1)
      .maybeSingle();
    programRow = bySlug.data;
  }

  if (!programRow && application.program_interest) {
    const byTitle = await db
      .from('programs')
      .select('slug, title, name, intrainingid, intraining_program_id, etpl_listed, wioa_approved')
      .eq('title', application.program_interest)
      .limit(1)
      .maybeSingle();
    programRow = byTitle.data;
  }

  const programName =
    programRow?.title ||
    programRow?.name ||
    String(application.program_interest || programSlug || 'Selected training program')
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (character: string) => character.toUpperCase());
  const programCode = cleanProgramCode(
    programRow?.intraining_program_id || programRow?.intrainingid,
  );

  const { data: existing } = await db
    .from('workone_survey_responses')
    .select('id, sent_at, access_token_hash')
    .eq('application_id', application.id)
    .maybeSingle();

  if (existing?.sent_at && existing?.access_token_hash) {
    return {
      required: true,
      alreadySent: true,
      programName,
      programCode,
      missingProgramCode: !programCode,
    };
  }

  const rawToken = crypto.randomBytes(32).toString('base64url');
  const accessTokenHash = tokenHash(rawToken);
  const applicantName = `${application.first_name || ''} ${application.last_name || ''}`.trim();
  const displayReference = application.reference_number || application.id;
  const progressUrl = `${PLATFORM_DEFAULTS.siteUrl}/workone/progress?token=${encodeURIComponent(rawToken)}`;

  let responseId = existing?.id as string | undefined;
  if (responseId) {
    const updateResult = await db
      .from('workone_survey_responses')
      .update({
        applicant_email: application.email,
        applicant_name: applicantName,
        program_slug: programRow?.slug || programSlug || null,
        program_name: programName,
        program_code: programCode,
        access_token_hash: accessTokenHash,
        updated_at: new Date().toISOString(),
      })
      .eq('id', responseId);
    if (updateResult.error) throw updateResult.error;
  } else {
    const insertResult = await db
      .from('workone_survey_responses')
      .insert({
        application_id: application.id,
        applicant_email: application.email,
        applicant_name: applicantName,
        survey_label: 'workone-funding-progress',
        program_slug: programRow?.slug || programSlug || null,
        program_name: programName,
        program_code: programCode,
        progress_status: 'not_started',
        access_token_hash: accessTokenHash,
      })
      .select('id')
      .single();
    if (insertResult.error || !insertResult.data) {
      const retryLookup = await db
        .from('workone_survey_responses')
        .select('id, sent_at, access_token_hash')
        .eq('application_id', application.id)
        .maybeSingle();
      if (retryLookup.data?.sent_at && retryLookup.data?.access_token_hash) {
        return {
          required: true,
          alreadySent: true,
          programName,
          programCode,
          missingProgramCode: !programCode,
        };
      }
      throw insertResult.error || new Error('Unable to create WorkOne progress record');
    }
    responseId = insertResult.data.id;
  }

  const pdf = await createProgramSheetPdf({
    applicantName,
    referenceNumber: displayReference,
    programName,
    programCode,
  });

  const codeBlock = programCode
    ? `<div style="margin:20px 0;padding:18px;border:2px solid #0f172a;border-radius:10px;background:#f8fafc;text-align:center;"><div style="font-size:13px;color:#475569;">INTraining Program ID</div><div style="font-family:monospace;font-weight:800;font-size:28px;color:#0f172a;margin-top:6px;">${escapeHtml(programCode)}</div></div>`
    : `<div style="margin:20px 0;padding:18px;border:2px solid #f59e0b;border-radius:10px;background:#fffbeb;"><strong>Program code verification needed.</strong> Contact Elevate before your WorkOne appointment so we can verify the correct current listing.</div>`;

  const emailResult = await sendEmail({
    to: application.email,
    subject: `WorkOne Program Sheet — ${programName}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#0f172a;line-height:1.55;">
      <h2>Your WorkOne Program Information</h2>
      <p>Hi ${escapeHtml(application.first_name || 'there')},</p>
      <p>Take the attached program sheet to WorkOne. It gives WorkOne the exact Elevate provider information and the INTraining program ID stored for the program you selected.</p>
      <p><strong>Program:</strong> ${escapeHtml(programName)}</p>
      ${codeBlock}
      <p><strong>Important:</strong> If WorkOne cannot find Elevate by name, ask them to search the INTraining program ID shown above and verify the provider as <strong>${escapeHtml(organization.legalName)} dba ${escapeHtml(organization.dbaName)}</strong>.</p>
      <p style="margin:24px 0;"><a href="${WORKONE_INTAKE_URL}" style="display:inline-block;background:#0f172a;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:700;">Schedule WorkOne Intake</a></p>
      <p>You can return and update your funding progress at any time using this private link:</p>
      <p><a href="${progressUrl}" style="color:#1d4ed8;font-weight:700;">Update My WorkOne Progress</a></p>
      <p>Also complete or maintain your Indiana Career Connect profile: <a href="${ICC_URL}">${ICC_URL}</a>.</p>
      <p>Each time you update your progress, Elevate will be notified and you will receive the next follow-up instructions automatically.</p>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
      <p style="font-size:13px;color:#475569;">Application reference: ${escapeHtml(displayReference)}<br/>${escapeHtml(organization.dbaName)}<br/>${escapeHtml(organization.phone)} · ${escapeHtml(organization.email)}</p>
    </div>`,
    attachments: [
      {
        content: pdf.toString('base64'),
        filename: `WorkOne-Program-Sheet-${String(displayReference).replace(/[^A-Za-z0-9_-]/g, '')}.pdf`,
        type: 'application/pdf',
        disposition: 'attachment',
      },
    ],
  });

  if (!emailResult.success) {
    logger.error('[WorkOne] Program sheet email failed', undefined, {
      applicationId: application.id,
      error: (emailResult as any).error,
    });
    return {
      required: true,
      sent: false,
      programName,
      programCode,
      missingProgramCode: !programCode,
    };
  }

  await db
    .from('workone_survey_responses')
    .update({ sent_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', responseId);

  if (!programCode) {
    await sendEmail({
      to: STAFF_EMAIL,
      subject: `WorkOne program code missing — ${applicantName} — ${programName}`,
      html: `<div style="font-family:Arial,sans-serif;line-height:1.5"><h2>WorkOne Program Code Needs Verification</h2><p><strong>Applicant:</strong> ${escapeHtml(applicantName)}</p><p><strong>Reference:</strong> ${escapeHtml(displayReference)}</p><p><strong>Program:</strong> ${escapeHtml(programName)}</p><p>The production program record does not contain an INTraining program ID. Verify the current listing before this applicant goes to WorkOne.</p><p><a href="https://admin.${PLATFORM_DEFAULTS.canonicalDomain}/admin/applications/review/${application.id}">Open application</a></p></div>`,
    });
  }

  return {
    required: true,
    sent: true,
    programName,
    programCode,
    missingProgramCode: !programCode,
  };
}
