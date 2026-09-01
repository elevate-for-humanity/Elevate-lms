import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';

import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { getAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/sendgrid';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { organization } from '@/lib/config/organization';
import { WORKONE_INDY_BOOKING_URL } from '@/lib/workone/booking';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const STAFF_EMAIL = 'elevate4humanityedu@gmail.com';
const WORKONE_INTAKE_URL = WORKONE_INDY_BOOKING_URL;

const ALLOWED_PROGRESS = new Set([
  'not_started',
  'needs_appointment',
  'appointment_scheduled',
  'attended',
  'funding_submitted',
  'approved',
  'denied',
  'need_help',
]);

function tokenHash(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function cleanText(value: unknown, max = 500): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function progressLabel(status: string) {
  const labels: Record<string, string> = {
    not_started: 'Not started yet',
    needs_appointment: 'Needs a WorkOne appointment',
    appointment_scheduled: 'WorkOne appointment scheduled',
    attended: 'Attended WorkOne appointment',
    funding_submitted: 'Funding request submitted / waiting for decision',
    approved: 'Funding approved',
    denied: 'Funding denied',
    need_help: 'Needs help from Elevate',
  };
  return labels[status] || status;
}

function applicationFundingStatus(status: string) {
  if (status === 'not_started' || status === 'needs_appointment') return 'needs_appointment';
  if (status === 'appointment_scheduled') return 'appointment_scheduled';
  if (status === 'attended' || status === 'funding_submitted' || status === 'need_help') return 'in_process';
  if (status === 'approved') return 'approved';
  if (status === 'denied') return 'denied';
  return null;
}

function followUpHtml(input: {
  firstName: string;
  progressStatus: string;
  programName: string;
  programCode: string | null;
  progressUrl: string;
}) {
  const codeLine = input.programCode
    ? `<p><strong>INTraining Program ID:</strong> <span style="font-family:monospace;font-size:18px;">${escapeHtml(input.programCode)}</span></p>`
    : '<p><strong>Program code:</strong> Elevate staff must verify the current INTraining listing before your appointment.</p>';

  const messages: Record<string, string> = {
    not_started: `<p>Your next step is to schedule your WorkOne intake. Take the program sheet we emailed you and give WorkOne the exact INTraining program ID.</p><p><a href="${WORKONE_INTAKE_URL}">Schedule WorkOne Intake</a></p>`,
    needs_appointment: `<p>Please schedule your WorkOne intake. Bring the program sheet from Elevate so WorkOne can search the exact INTraining program ID even if Elevate does not appear in a provider-name search.</p><p><a href="${WORKONE_INTAKE_URL}">Schedule WorkOne Intake</a></p>`,
    appointment_scheduled: '<p>Your appointment is scheduled. Bring the attached/previously emailed Elevate program sheet, photo ID, requested income/eligibility documents, and any WorkOne paperwork you were instructed to bring.</p>',
    attended: '<p>Thank you for updating us. If WorkOne asks for provider verification, give them the INTraining program ID below and the legal provider name 2Exclusive LLC-S dba Elevate for Humanity Career & Technical Institute.</p>',
    funding_submitted: '<p>Your funding request is in process. Update this form again when WorkOne gives you a decision, requests more information, or issues an approval/ITA document.</p>',
    approved: '<p>Your update shows funding approved. Elevate has been notified. Keep your approval/ITA documentation and be ready for our enrollment team to verify funding and finalize your start.</p>',
    denied: '<p>Your update shows funding was denied. Elevate has been notified so we can review the denial and discuss another eligible funding path or payment option with you.</p>',
    need_help: '<p>You asked Elevate for help. Our team has been notified. Keep this progress link so you can update us after the issue is resolved.</p>',
  };

  return `<div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#0f172a;line-height:1.55;">
    <h2>WorkOne Follow-Up</h2>
    <p>Hi ${escapeHtml(input.firstName || 'there')},</p>
    <p>We received your WorkOne progress update for <strong>${escapeHtml(input.programName)}</strong>.</p>
    <p><strong>Current status:</strong> ${escapeHtml(progressLabel(input.progressStatus))}</p>
    ${codeLine}
    ${messages[input.progressStatus] || ''}
    <p><a href="${input.progressUrl}" style="font-weight:700;color:#1d4ed8;">Update My WorkOne Progress Again</a></p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
    <p style="font-size:13px;color:#475569;">${organization.dbaName}<br/>${organization.phone} · ${organization.email}</p>
  </div>`;
}

async function getRecordByToken(token: string) {
  const db = await getAdminClient();
  if (!db) return { db: null, response: null, application: null };

  const hash = tokenHash(token);
  const { data: response } = await db
    .from('workone_survey_responses')
    .select(
      'id, application_id, applicant_email, applicant_name, program_slug, program_name, program_code, progress_status, funding_status, appointment_date, workone_center, case_manager_name, case_manager_email, approval_reference, feedback, wants_callback, updated_at',
    )
    .eq('access_token_hash', hash)
    .maybeSingle();

  if (!response?.application_id) return { db, response: null, application: null };

  const { data: application } = await db
    .from('applications')
    .select('id, first_name, last_name, email, phone, reference_number, funding_type, funding_eligibility_status, status')
    .eq('id', response.application_id)
    .maybeSingle();

  return { db, response, application };
}

async function _GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const token = request.nextUrl.searchParams.get('token')?.trim() || '';
  if (token.length < 32) {
    return NextResponse.json({ error: 'This WorkOne progress link is invalid.' }, { status: 400 });
  }

  const { response, application } = await getRecordByToken(token);
  if (!response || !application) {
    return NextResponse.json({ error: 'This WorkOne progress link could not be verified.' }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    progress: {
      referenceNumber: application.reference_number,
      applicantName: response.applicant_name,
      applicantEmail: response.applicant_email,
      programSlug: response.program_slug,
      programName: response.program_name,
      programCode: response.program_code,
      progressStatus: response.progress_status,
      fundingStatus: response.funding_status,
      appointmentDate: response.appointment_date,
      workoneCenter: response.workone_center,
      caseManagerName: response.case_manager_name,
      caseManagerEmail: response.case_manager_email,
      approvalReference: response.approval_reference,
      feedback: response.feedback,
      wantsCallback: response.wants_callback,
      updatedAt: response.updated_at,
    },
  });
}

async function _POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'contact');
  if (rateLimited) return rateLimited;

  const body = await request.json().catch(() => ({}));
  const token = typeof body.token === 'string' ? body.token.trim() : '';
  const progressStatus = typeof body.progressStatus === 'string' ? body.progressStatus.trim() : '';

  if (token.length < 32 || !ALLOWED_PROGRESS.has(progressStatus)) {
    return NextResponse.json({ error: 'Invalid WorkOne progress update.' }, { status: 400 });
  }

  const { db, response, application } = await getRecordByToken(token);
  if (!db) return NextResponse.json({ error: 'Service temporarily unavailable.' }, { status: 503 });
  if (!response || !application) {
    return NextResponse.json({ error: 'This WorkOne progress link could not be verified.' }, { status: 404 });
  }

  const appointmentDate = cleanText(body.appointmentDate, 10);
  const workoneCenter = cleanText(body.workoneCenter, 160);
  const caseManagerName = cleanText(body.caseManagerName, 160);
  const caseManagerEmail = cleanText(body.caseManagerEmail, 254);
  const approvalReference = cleanText(body.approvalReference, 160);
  const feedback = cleanText(body.feedback, 2000);
  const wantsCallback = Boolean(body.wantsCallback) || progressStatus === 'need_help';

  if (appointmentDate && !/^\d{4}-\d{2}-\d{2}$/.test(appointmentDate)) {
    return NextResponse.json({ error: 'Appointment date must be a valid date.' }, { status: 400 });
  }
  if (caseManagerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(caseManagerEmail)) {
    return NextResponse.json({ error: 'Case manager email is not valid.' }, { status: 400 });
  }

  const fundingStatus =
    progressStatus === 'approved'
      ? 'approved'
      : progressStatus === 'denied'
        ? 'denied'
        : progressStatus === 'funding_submitted' || progressStatus === 'attended'
          ? 'pending'
          : null;
  const wentToWorkOne = ['attended', 'funding_submitted', 'approved', 'denied'].includes(progressStatus);
  const signedUpForFunding = ['funding_submitted', 'approved', 'denied'].includes(progressStatus);
  const stillNeedsToGo = ['not_started', 'needs_appointment', 'appointment_scheduled'].includes(progressStatus);
  const now = new Date().toISOString();

  const updateResult = await db
    .from('workone_survey_responses')
    .update({
      progress_status: progressStatus,
      funding_status: fundingStatus,
      appointment_date: appointmentDate,
      workone_center: workoneCenter,
      case_manager_name: caseManagerName,
      case_manager_email: caseManagerEmail,
      approval_reference: approvalReference,
      feedback,
      wants_callback: wantsCallback,
      went_to_workone: wentToWorkOne,
      signed_up_for_funding: signedUpForFunding,
      still_needs_to_go: stillNeedsToGo,
      submitted_at: now,
      last_updated_by_applicant_at: now,
      updated_at: now,
    })
    .eq('id', response.id);

  if (updateResult.error) {
    return NextResponse.json({ error: 'Your progress update could not be saved.' }, { status: 500 });
  }

  await db.from('workone_progress_updates').insert({
    workone_response_id: response.id,
    application_id: application.id,
    progress_status: progressStatus,
    funding_status: fundingStatus,
    appointment_date: appointmentDate,
    workone_center: workoneCenter,
    case_manager_name: caseManagerName,
    case_manager_email: caseManagerEmail,
    approval_reference: approvalReference,
    feedback,
  });

  const mappedFundingStatus = applicationFundingStatus(progressStatus);
  const applicationUpdate: Record<string, unknown> = {
    funding_eligibility_status: mappedFundingStatus,
  };
  if (progressStatus === 'approved') {
    applicationUpdate.has_workone_approval = true;
    applicationUpdate.workone_approval_ref = approvalReference;
  }
  if (wentToWorkOne || progressStatus === 'appointment_scheduled') {
    applicationUpdate.has_workone_appointment = true;
  }
  await db.from('applications').update(applicationUpdate).eq('id', application.id);

  const progressUrl = `${PLATFORM_DEFAULTS.siteUrl}/workone/progress?token=${encodeURIComponent(token)}`;
  const programName = response.program_name || response.program_slug || 'your selected program';
  const applicantFirstName = String(application.first_name || response.applicant_name || '').split(' ')[0] || 'there';

  const staffEmail = await sendEmail({
    to: STAFF_EMAIL,
    subject: `WorkOne progress update — ${response.applicant_name || application.email} — ${progressLabel(progressStatus)}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;line-height:1.55;color:#0f172a;">
      <h2>Applicant WorkOne Progress Update</h2>
      <p><strong>Applicant:</strong> ${escapeHtml(response.applicant_name || '')}</p>
      <p><strong>Email:</strong> ${escapeHtml(response.applicant_email || application.email)}</p>
      <p><strong>Application reference:</strong> ${escapeHtml(application.reference_number || application.id)}</p>
      <p><strong>Program:</strong> ${escapeHtml(programName)}</p>
      <p><strong>INTraining Program ID:</strong> ${escapeHtml(response.program_code || 'NOT STORED / VERIFY')}</p>
      <p><strong>Current progress:</strong> ${escapeHtml(progressLabel(progressStatus))}</p>
      <p><strong>Appointment date:</strong> ${escapeHtml(appointmentDate || 'Not provided')}</p>
      <p><strong>WorkOne center:</strong> ${escapeHtml(workoneCenter || 'Not provided')}</p>
      <p><strong>Case manager:</strong> ${escapeHtml(caseManagerName || 'Not provided')} ${caseManagerEmail ? `(${escapeHtml(caseManagerEmail)})` : ''}</p>
      <p><strong>Approval / ITA reference:</strong> ${escapeHtml(approvalReference || 'Not provided')}</p>
      <p><strong>Applicant notes:</strong> ${escapeHtml(feedback || 'None')}</p>
      <p><strong>Callback requested:</strong> ${wantsCallback ? 'Yes' : 'No'}</p>
      <p><a href="https://admin.${PLATFORM_DEFAULTS.canonicalDomain}/admin/applications/review/${application.id}">Open application in Admin</a></p>
    </div>`,
  });

  const applicantEmail = await sendEmail({
    to: response.applicant_email || application.email,
    subject: `WorkOne Follow-Up — ${programName}`,
    html: followUpHtml({
      firstName: applicantFirstName,
      progressStatus,
      programName,
      programCode: response.program_code,
      progressUrl,
    }),
  });

  if (applicantEmail.success) {
    await db
      .from('workone_survey_responses')
      .update({ last_follow_up_email_at: new Date().toISOString() })
      .eq('id', response.id);
  }

  return NextResponse.json({
    ok: true,
    message: 'Your WorkOne progress was saved. Elevate was notified and your follow-up email was generated.',
    emailStatus: {
      staff: staffEmail.success ? 'sent' : 'failed',
      applicant: applicantEmail.success ? 'sent' : 'failed',
    },
  });
}

export const GET = withApiAudit('/api/workone/progress', _GET);
export const POST = withApiAudit('/api/workone/progress', _POST);
