/**
 * GET /api/cron/school-application-followup
 * Follow up on submitted applications that have had no status change in 48h.
 */
import { NextResponse } from 'next/server';
import { withRuntime } from '@/lib/api/withRuntime';
import { requireAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/service';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const STALE_HOURS = 48;
const ADMIN_EMAIL = 'elevate4humanityedu@gmail.com';

export const GET = withRuntime({ cron: 'bearer' }, async () => {
  const db = await requireAdminClient();
  const cutoff = new Date(Date.now() - STALE_HOURS * 60 * 60 * 1000).toISOString();

  const { data: stale, error } = await db
    .from('applications')
    .select('id, applicant_name, applicant_email, program_name, status, created_at, updated_at')
    .eq('status', 'submitted')
    .lt('updated_at', cutoff)
    .limit(50);

  if (error) {
    logger.error('[cron/school-application-followup] DB error', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  let followed_up = 0;
  for (const app of stale ?? []) {
    const hoursWaiting = Math.floor((Date.now() - new Date(app.updated_at ?? app.created_at).getTime()) / 3600000);

    if (app.applicant_email) {
      await sendEmail({
        to: app.applicant_email,
        subject: `Update on your application — ${app.program_name ?? 'Elevate Program'}`,
        html: `<p>Hi ${app.applicant_name ?? 'Applicant'},</p><p>Your application for <strong>${app.program_name ?? 'our program'}</strong> is under review. Our admissions team will contact you within 1 business day.</p><p>Questions? Call (317) 559-4999 or email <a href="mailto:enroll@elevateforhumanity.org">enroll@elevateforhumanity.org</a>.</p><p>— Elevate for Humanity</p>`,
      }).catch((e: unknown) => logger.warn('[cron/school-application-followup] Email failed', { app_id: app.id, error: String(e) }));
    }

    // Flag in admin_alerts if waiting > 72h
    if (hoursWaiting > 72) {
      await db.from('admin_alerts').insert({
        alert_type: 'stale_application',
        severity: 'warning',
        message: `Application from ${app.applicant_name ?? 'unknown'} for ${app.program_name ?? 'unknown program'} has been pending ${hoursWaiting}h with no action`,
        metadata: { application_id: app.id },
      })
    }

    followed_up++;
  }

  if (followed_up > 0) {
    await sendEmail({
      to: ADMIN_EMAIL,
      subject: `[Applications] ${followed_up} stale application${followed_up !== 1 ? 's' : ''} > ${STALE_HOURS}h`,
      html: `<p>${followed_up} application${followed_up !== 1 ? 's' : ''} have been in 'submitted' status for more than ${STALE_HOURS} hours. Applicants have been notified.</p><p><a href="https://www.elevateforhumanity.org/admin/applications">Review →</a></p>`,
    }).catch((e: unknown) => logger.warn('[cron/school-application-followup] Admin email failed', { error: String(e) }));
  }

  logger.info('[cron/school-application-followup] Done', { followed_up });
  return NextResponse.json({ ok: true, followed_up });
});
