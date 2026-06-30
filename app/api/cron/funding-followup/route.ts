/**
 * GET /api/cron/funding-followup
 * Follow up on pending funding assignments — notify students and staff
 * when funding approval has been pending > 3 days.
 */
import { NextResponse } from 'next/server';
import { withRuntime } from '@/lib/api/withRuntime';
import { requireAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/service';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PENDING_DAYS_THRESHOLD = 3;
const ADMIN_EMAIL = 'elevate4humanityedu@gmail.com';

export const GET = withRuntime({ cron: 'bearer' }, async () => {
  const db = await requireAdminClient();
  const cutoff = new Date(Date.now() - PENDING_DAYS_THRESHOLD * 24 * 60 * 60 * 1000).toISOString();

  const { data: pending, error } = await db
    .from('student_funding_assignments')
    .select(`
      id, student_id, created_at,
      profiles!student_funding_assignments_student_id_fkey (full_name, email),
      funding_sources (name, code)
    `)
    .eq('status', 'pending')
    .lt('created_at', cutoff)
    .limit(50);

  if (error) {
    logger.error('[cron/funding-followup] DB error', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  let notified = 0;
  for (const row of pending ?? []) {
    const profile = (row as any).profiles;
    const source = (row as any).funding_sources;
    const name = profile?.full_name ?? 'Student';
    const email = profile?.email;
    const daysPending = Math.floor((Date.now() - new Date(row.created_at).getTime()) / 86400000);

    await db.from('notifications').insert({
      user_id: row.student_id,
      type: 'system',
      title: 'Funding approval pending',
      message: `Your ${source?.name ?? 'funding'} application has been pending for ${daysPending} days. Our team is following up.`,
      read: false,
      idempotency_key: `funding-followup-${row.id}-${new Date().toISOString().split('T')[0]}`,
    }).onConflict('idempotency_key').ignore().catch((e: unknown) => logger.warn('[cron/funding-followup] Notification insert failed', { error: String(e) }));

    if (email) {
      await sendEmail({
        to: email,
        subject: 'Update on your funding application',
        html: `<p>Hi ${name},</p><p>Your funding application (${source?.name ?? source?.code ?? 'funding source'}) has been pending for ${daysPending} days. Our team is actively following up. We will contact you within 1 business day.</p><p>— Elevate for Humanity</p>`,
      }).catch((e: unknown) => logger.warn('[cron/funding-followup] Email failed', { student_id: row.student_id, error: String(e) }));
    }

    notified++;
  }

  if (notified > 0) {
    await sendEmail({
      to: ADMIN_EMAIL,
      subject: `[Funding Follow-up] ${notified} pending assignment${notified !== 1 ? 's' : ''} > ${PENDING_DAYS_THRESHOLD} days`,
      html: `<p>${notified} student funding assignment${notified !== 1 ? 's' : ''} have been pending for more than ${PENDING_DAYS_THRESHOLD} days. Students have been notified.</p><p><a href="https://www.elevateforhumanity.org/admin/funding">Review in admin →</a></p>`,
    }).catch((e: unknown) => logger.warn('[cron/funding-followup] Admin email failed', { error: String(e) }));
  }

  logger.info('[cron/funding-followup] Done', { notified });
  return NextResponse.json({ ok: true, notified });
});
