/**
 * GET /api/cron/enrollment-automation
 * Auto-advance approved applications to enrolled status and provision LMS access.
 */
import { NextResponse } from 'next/server';
import { withRuntime } from '@/lib/api/withRuntime';
import { requireAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/service';
import { emitEvent } from '@/lib/platform/events';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withRuntime({ cron: 'bearer' }, async () => {
  const db = await requireAdminClient();

  // Find approved applications not yet converted to enrollments
  const { data: approved, error } = await db
    .from('applications')
    .select('id, applicant_name, applicant_email, program_name, program_id, user_id, approved_at')
    .eq('status', 'approved')
    .is('enrolled_at', null)
    .not('user_id', 'is', null)
    .limit(50);

  if (error) {
    logger.error('[cron/enrollment-automation] DB error', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  let enrolled = 0;
  for (const app of approved ?? []) {
    // Check if program_enrollment already exists
    const { data: existing } = await db
      .from('program_enrollments')
      .select('id')
      .eq('user_id', app.user_id)
      .eq('program_id', app.program_id)
      .maybeSingle();

    if (existing) {
      // Already enrolled — just mark application as enrolled
      await db.from('applications').update({ enrolled_at: new Date().toISOString() }).eq('id', app.id);
      continue;
    }

    // Create enrollment
    const { error: enrollErr } = await db.from('program_enrollments').insert({
      user_id: app.user_id,
      program_id: app.program_id,
      status: 'active',
      enrolled_at: new Date().toISOString(),
      source: 'application_automation',
    });

    if (enrollErr) {
      logger.error('[cron/enrollment-automation] Enrollment insert failed', enrollErr, { app_id: app.id });
      continue;
    }

    // Mark application enrolled
    await db.from('applications').update({ enrolled_at: new Date().toISOString(), status: 'enrolled' }).eq('id', app.id);

    // Welcome email
    if (app.applicant_email) {
      await sendEmail({
        to: app.applicant_email,
        subject: `You're enrolled — ${app.program_name ?? 'your program'} | Elevate`,
        html: `<p>Hi ${app.applicant_name ?? 'there'},</p><p>You've been enrolled in <strong>${app.program_name ?? 'your program'}</strong>. Log in to start your coursework.</p><p><a href="https://www.elevateforhumanity.org/lms/courses">Go to your courses →</a></p><p>— Elevate for Humanity</p>`,
      }).catch((e: unknown) => logger.warn('[cron/enrollment-automation] Welcome email failed', { error: String(e) }));
    }

    await emitEvent('enrollment.auto_created', 'enrollment', {
      actor_type: 'cron',
      subject_id: app.user_id,
      subject_type: 'student',
      payload: { application_id: app.id, program_id: app.program_id },
      message: `Auto-enrolled ${app.applicant_name ?? app.user_id} into ${app.program_name}`,
    }).catch(() => {});

    enrolled++;
  }

  logger.info('[cron/enrollment-automation] Done', { enrolled });
  return NextResponse.json({ ok: true, enrolled });
});
