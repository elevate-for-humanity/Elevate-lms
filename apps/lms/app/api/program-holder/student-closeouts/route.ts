// pre-auth-registry: exempt - requireProgramHolder verifies the authenticated user and active holder relationship before any closeout write.
import { NextResponse } from 'next/server';
import { requireProgramHolder } from '@/lib/auth/require-program-holder';
import { sendEmail } from '@/lib/email/sendgrid';
import { logger } from '@/lib/logger';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export async function POST(request: Request) {
  const ctx = await requireProgramHolder();
  if (ctx.mode !== 'holder')
    return NextResponse.json({ error: 'Program Holder session required.' }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const enrollmentId = String(body.enrollment_id || '');
  const start = String(body.training_start_date || '');
  const end = String(body.training_end_date || '');
  const certificateDate = String(body.certificate_issued_date || '');
  const hours = Number(body.total_hours_completed);
  const summary = String(body.completion_summary || '').trim();
  if (
    !UUID.test(enrollmentId) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(start) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(end) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(certificateDate)
  )
    return NextResponse.json(
      { error: 'Student and all required dates are required.' },
      { status: 400 },
    );
  const today = new Date().toISOString().slice(0, 10);
  if (end < start || end > today || certificateDate > today)
    return NextResponse.json(
      { error: 'Completion dates must be valid and cannot be in the future.' },
      { status: 400 },
    );
  if (!Number.isFinite(hours) || hours < 48 || hours > 1000)
    return NextResponse.json(
      { error: 'WorkOne closeout requires at least 48 completed training hours.' },
      { status: 400 },
    );
  if (
    body.lms_completed !== 'true' ||
    body.practical_skills_verified !== 'true' ||
    body.certificate_received !== 'true' ||
    body.ready_for_testing !== 'true' ||
    summary.length < 20
  )
    return NextResponse.json(
      {
        error:
          'Confirm coursework, practical skills, certificate receipt, testing readiness, and provide a final summary.',
      },
      { status: 400 },
    );
  const { data: enrollment } = await ctx.db
    .from('program_enrollments')
    .select('id,user_id,program_id,program_slug,full_name,email')
    .eq('id', enrollmentId)
    .eq('program_holder_id', ctx.holderId)
    .maybeSingle();
  if (!enrollment || !ctx.programIds.includes(enrollment.program_id))
    return NextResponse.json(
      { error: 'This student is not in your HVAC roster.' },
      { status: 403 },
    );
  const { error } = await ctx.db
    .from('program_enrollments')
    .update({
      status: 'graduated',
      enrollment_state: 'graduated',
      training_start_date: start,
      training_end_date: end,
      completed_at: `${end}T12:00:00.000Z`,
      certificate_issued_at: `${certificateDate}T12:00:00.000Z`,
      total_hours_completed: hours,
      progress_percent: 100,
      lms_completed: true,
      practical_skills_verified: true,
      next_required_action: 'Elevate testing review',
      last_progress_update: end,
      updated_at: new Date().toISOString(),
    })
    .eq('id', enrollment.id)
    .eq('program_holder_id', ctx.holderId);
  if (error)
    return NextResponse.json({ error: 'Student closeout could not be saved.' }, { status: 500 });
  await ctx.db.from('hour_entries').insert({
    user_id: enrollment.user_id,
    program_holder_id: ctx.holderId,
    program_slug: enrollment.program_slug || 'hvac-technician',
    source_type: 'program_holder_student_closeout',
    source_entity_name: 'HVAC student completion closeout',
    work_date: end,
    hours_claimed: hours,
    category: 'student_closeout',
    notes: summary,
    entered_by_email: ctx.user.email || ctx.profile.email || 'program-holder',
    status: 'submitted',
    approval_status: 'submitted',
    submitted_by_partner: true,
  });

  const [{ data: holder }, { data: program }] = await Promise.all([
    ctx.db
      .from('program_holders')
      .select('organization_name,name')
      .eq('id', ctx.holderId)
      .maybeSingle(),
    ctx.db.from('programs').select('title,name').eq('id', enrollment.program_id).maybeSingle(),
  ]);
  const holderName =
    holder?.organization_name || holder?.name || ctx.profile.full_name || 'Program Holder';
  const studentName = enrollment.full_name || enrollment.email || 'Student';
  const programName =
    program?.title || program?.name || enrollment.program_slug || 'Assigned program';
  const notificationMessage = `${holderName} marked ${studentName} complete and ready for testing.`;

  const { error: notificationError } = await ctx.db.from('staff_notifications').insert({
    type: 'student_ready_for_testing',
    title: `${studentName} is ready for testing`,
    message: notificationMessage,
    severity: 'info',
    metadata: {
      enrollment_id: enrollment.id,
      student_user_id: enrollment.user_id,
      program_holder_id: ctx.holderId,
      program_id: enrollment.program_id,
      program_slug: enrollment.program_slug,
      submitted_by: ctx.user.id,
    },
  });
  if (notificationError) {
    logger.error(
      '[student-closeouts] Staff notification could not be saved',
      new Error(notificationError.message),
      { enrollmentId: enrollment.id },
    );
  }

  const emailResult = await sendEmail({
    to: process.env.ADMIN_ALERT_EMAIL || 'elevate4humanityedu@gmail.com',
    replyTo: ctx.user.email || ctx.profile.email || 'elevate4humanityedu@gmail.com',
    subject: `Ready for testing: ${studentName}`,
    text: `${notificationMessage}\nProgram: ${programName}\nCompletion date: ${end}\nTraining hours: ${hours}\n\nReview the student in the Elevate Admin dashboard.`,
    html: `<p><strong>${escapeHtml(notificationMessage)}</strong></p><p>Program: ${escapeHtml(programName)}<br>Completion date: ${escapeHtml(end)}<br>Training hours: ${escapeHtml(hours)}</p><p>Review the student in the Elevate Admin dashboard.</p>`,
  });
  if (!emailResult.success) {
    logger.error(
      '[student-closeouts] Ready-for-testing email could not be sent',
      new Error(emailResult.error || 'Unknown email transport error'),
      { enrollmentId: enrollment.id },
    );
  }

  return NextResponse.json({ ok: true, emailSent: emailResult.success });
}
