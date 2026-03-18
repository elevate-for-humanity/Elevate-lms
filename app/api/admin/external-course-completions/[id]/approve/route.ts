/**
 * POST /api/admin/external-course-completions/[id]/approve
 *
 * Two actions in one endpoint, controlled by `action`:
 *
 *   action = 'send_login'
 *     Staff has purchased the course on the partner site.
 *     They paste login_instructions here; the system emails them to the student.
 *
 *   action = 'approve_credential'
 *     Staff has reviewed the uploaded certificate/wallet card and approves it.
 *     Sets approved_at, emails the student, and unlocks advancement.
 *
 *   action = 'reject_credential'
 *     Staff rejects the upload with a reason. Student is notified to resubmit.
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { createAdminClient } from '@/lib/supabase/admin';
import { safeError, safeDbError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import {
  sendExternalCourseLoginEmail,
  sendExternalCourseApprovedEmail,
} from '@/lib/email/external-course';
import { sendEmail } from '@/lib/email/sendgrid';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.elevateforhumanity.org';
const ADMIN_EMAIL = 'elevate4humanityedu@gmail.com';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const { id } = await params;
  const body = await request.json().catch(() => ({})) as {
    action?: string;
    login_instructions?: string;
    rejection_reason?: string;
  };

  const { action } = body;
  if (!action) return safeError('action is required', 400);

  const db = createAdminClient();

  // Load the completion record with student + course info
  const { data: rec, error: fetchErr } = await db
    .from('external_course_completions')
    .select(`
      id, user_id, external_course_id, program_id,
      login_sent_at, login_instructions,
      approved_at, certificate_url,
      course:program_external_courses(title, partner_name, external_url),
      student:profiles!external_course_completions_user_id_fkey(full_name, email),
      program:programs(title, slug)
    `)
    .eq('id', id)
    .maybeSingle();

  if (fetchErr) return safeDbError(fetchErr, 'Lookup failed');
  if (!rec) return safeError('Completion record not found', 404);

  const studentEmail = (rec.student as any)?.email ?? '';
  const studentName  = (rec.student as any)?.full_name ?? 'Student';
  const courseTitle  = (rec.course as any)?.title ?? 'External Course';
  const partnerName  = (rec.course as any)?.partner_name ?? 'Partner';
  const partnerUrl   = (rec.course as any)?.external_url ?? '#';
  const programTitle = (rec.program as any)?.title ?? '';
  const programSlug  = (rec.program as any)?.slug ?? '';

  // ── SEND LOGIN ──────────────────────────────────────────────────────────────
  if (action === 'send_login') {
    const loginInstructions = body.login_instructions?.trim();
    if (!loginInstructions) return safeError('login_instructions is required', 400);

    const { error: updateErr } = await db
      .from('external_course_completions')
      .update({
        login_instructions,
        login_sent_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateErr) return safeDbError(updateErr, 'Failed to save login instructions');

    // Email the student
    await sendExternalCourseLoginEmail({
      to: studentEmail,
      studentName,
      courseTitle,
      partnerName,
      partnerUrl,
      loginInstructions,
      programTitle,
    });

    return NextResponse.json({ ok: true, action: 'send_login', emailed: studentEmail });
  }

  // ── APPROVE CREDENTIAL ──────────────────────────────────────────────────────
  if (action === 'approve_credential') {
    if (!rec.certificate_url) {
      return safeError('No certificate uploaded yet — cannot approve', 400);
    }
    if (rec.approved_at) {
      return safeError('Already approved', 409);
    }

    const { error: updateErr } = await db
      .from('external_course_completions')
      .update({
        approved_at:  new Date().toISOString(),
        approved_by:  auth.user.id,
        completed_at: new Date().toISOString(),
        rejection_reason: null,
      })
      .eq('id', id);

    if (updateErr) return safeDbError(updateErr, 'Failed to approve credential');

    // Email the student
    await sendExternalCourseApprovedEmail({
      to: studentEmail,
      studentName,
      courseTitle,
      programTitle,
      dashboardUrl: `${SITE_URL}/lms/courses/${programSlug}`,
    });

    return NextResponse.json({ ok: true, action: 'approve_credential', emailed: studentEmail });
  }

  // ── REJECT CREDENTIAL ───────────────────────────────────────────────────────
  if (action === 'reject_credential') {
    const rejectionReason = body.rejection_reason?.trim();
    if (!rejectionReason) return safeError('rejection_reason is required', 400);

    const { error: updateErr } = await db
      .from('external_course_completions')
      .update({
        approved_at:      null,
        approved_by:      null,
        certificate_url:  null,   // clear so student can re-upload
        rejection_reason: rejectionReason,
      })
      .eq('id', id);

    if (updateErr) return safeDbError(updateErr, 'Failed to reject credential');

    // Email the student
    await sendEmail({
      to: studentEmail,
      subject: `Action required: Resubmit your ${courseTitle} credential`,
      replyTo: ADMIN_EMAIL,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1e293b">
          <div style="background:#1e293b;padding:24px 32px">
            <img src="${SITE_URL}/images/Elevate_for_Humanity_logo_81bf0fab.jpg"
                 alt="Elevate for Humanity" height="48" style="display:block" />
          </div>
          <div style="padding:32px">
            <h2 style="margin:0 0 8px;font-size:20px">Please resubmit your credential</h2>
            <p style="color:#475569;margin:0 0 16px">
              Hi ${studentName}, your <strong>${courseTitle}</strong> credential could not be verified.
            </p>
            <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin-bottom:24px">
              <p style="margin:0;font-size:14px;color:#991b1b"><strong>Reason:</strong> ${rejectionReason}</p>
            </div>
            <a href="${SITE_URL}/lms/courses/${programSlug}"
               style="display:inline-block;background:#dc2626;color:#fff;text-decoration:none;
                      padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px">
              Resubmit credential →
            </a>
            <p style="font-size:13px;color:#94a3b8;margin:24px 0 0">
              Questions? Reply to this email or call 317-314-3757.
            </p>
          </div>
        </div>
      `,
      text: `Hi ${studentName},\n\nYour ${courseTitle} credential could not be verified.\n\nReason: ${rejectionReason}\n\nPlease resubmit at: ${SITE_URL}/lms/courses/${programSlug}`,
    });

    return NextResponse.json({ ok: true, action: 'reject_credential', emailed: studentEmail });
  }

  return safeError(`Unknown action: ${action}`, 400);
}
