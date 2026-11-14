/**
 * POST /api/admin/external-course-completions/[id]/approve
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeError, safeDbError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import {
  sendExternalCourseLoginEmail,
  sendExternalCourseApprovedEmail,
} from '@/lib/email/external-course';
import { sendEmail } from '@/lib/email/sendgrid';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? PLATFORM_DEFAULTS.siteUrl;
const ADMIN_EMAIL = 'elevate4humanityedu@gmail.com';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as {
    action?: string;
    login_instructions?: string;
    rejection_reason?: string;
  };

  const { action } = body;
  if (!action) return safeError('action is required', 400);

  const db = await requireAdminClient();
  const { data: rec, error: fetchErr } = await db
    .from('external_course_completions')
    .select(
      `id, user_id, external_course_id, program_id, login_sent_at, login_instructions, approved_at, certificate_url, course:program_external_courses(title, partner_name, external_url), program:programs(title, slug)`,
    )
    .eq('id', id)
    .maybeSingle();

  if (fetchErr) return safeDbError(fetchErr, 'Lookup failed');
  if (!rec) return safeError('Completion record not found', 404);

  const { data: studentProfile } = rec.user_id
    ? await db.from('profiles').select('full_name, email').eq('id', rec.user_id).maybeSingle()
    : { data: null };

  const course = Array.isArray(rec.course) ? rec.course[0] : rec.course;
  const program = Array.isArray(rec.program) ? rec.program[0] : rec.program;
  const studentEmail = studentProfile?.email ?? '';
  const studentName = studentProfile?.full_name ?? 'Student';
  const courseTitle = course?.title ?? 'External Course';
  const partnerName = course?.partner_name ?? 'Partner';
  const partnerUrl = course?.external_url ?? '#';
  const programTitle = program?.title ?? '';
  const programSlug = program?.slug ?? '';

  if (action === 'send_login') {
    const loginInstructions = body.login_instructions?.trim();
    if (!loginInstructions) return safeError('login_instructions is required', 400);

    const { error: updateErr } = await db
      .from('external_course_completions')
      .update({
        login_instructions: loginInstructions,
        login_sent_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateErr) return safeDbError(updateErr, 'Failed to save login instructions');

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

  if (action === 'approve_credential') {
    if (!rec.certificate_url) return safeError('No certificate uploaded yet — cannot approve', 400);
    if (rec.approved_at) return safeError('Already approved', 409);

    const { error: updateErr } = await db
      .from('external_course_completions')
      .update({
        approved_at: new Date().toISOString(),
        approved_by: auth.id,
        completed_at: new Date().toISOString(),
        rejection_reason: null,
      })
      .eq('id', id);

    if (updateErr) return safeDbError(updateErr, 'Failed to approve credential');

    await sendExternalCourseApprovedEmail({
      to: studentEmail,
      studentName,
      courseTitle,
      programTitle,
      dashboardUrl: `${SITE_URL}/lms/courses/${programSlug}`,
    });

    return NextResponse.json({ ok: true, action: 'approve_credential', emailed: studentEmail });
  }

  if (action === 'reject_credential') {
    const rejectionReason = body.rejection_reason?.trim();
    if (!rejectionReason) return safeError('rejection_reason is required', 400);

    const { error: updateErr } = await db
      .from('external_course_completions')
      .update({
        approved_at: null,
        approved_by: null,
        certificate_url: null,
        rejection_reason: rejectionReason,
      })
      .eq('id', id);

    if (updateErr) return safeDbError(updateErr, 'Failed to reject credential');

    await sendEmail({
      to: studentEmail,
      subject: `Action required: Resubmit your ${courseTitle} credential`,
      replyTo: ADMIN_EMAIL,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1e293b"><div style="padding:32px"><h2>Please resubmit your credential</h2><p>Hi ${studentName}, your <strong>${courseTitle}</strong> credential could not be verified.</p><p><strong>Reason:</strong> ${rejectionReason}</p><a href="${SITE_URL}/lms/courses/${programSlug}">Resubmit credential</a></div></div>`,
      text: `Hi ${studentName},\n\nYour ${courseTitle} credential could not be verified.\n\nReason: ${rejectionReason}\n\nPlease resubmit at: ${SITE_URL}/lms/courses/${programSlug}`,
    });

    return NextResponse.json({ ok: true, action: 'reject_credential', emailed: studentEmail });
  }

  return safeError(`Unknown action: ${action}`, 400);
}
