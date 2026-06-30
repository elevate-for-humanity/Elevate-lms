// pre-auth-registry: exempt — cron route, runs as service role with no user session
/**
 * GET /api/cron/compliance-expiration
 * Warn on attendance_records and documents approaching compliance deadlines.
 */
import { NextResponse } from 'next/server';
import { withRuntime } from '@/lib/api/withRuntime';
import { requireAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/service';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const WARN_DAYS = 14;
const ADMIN_EMAIL = 'elevate4humanityedu@gmail.com';

export const GET = withRuntime({ cron: 'bearer' }, async () => {
  const db = await requireAdminClient();
  const now = new Date();
  const warnCutoff = new Date(now.getTime() + WARN_DAYS * 86400000).toISOString();

  // Documents expiring soon
  const { data: expiringDocs, error: docErr } = await db
    .from('documents')
    .select('id, user_id, document_type, expires_at, profiles!documents_user_id_fkey(full_name, email)')
    .eq('status', 'active')
    .not('expires_at', 'is', null)
    .gt('expires_at', now.toISOString())
    .lt('expires_at', warnCutoff)
    .limit(100);

  if (docErr) {
    logger.error('[cron/compliance-expiration] Documents query failed', docErr);
  }

  let warned = 0;
  for (const doc of expiringDocs ?? []) {
    const profile = (doc as any).profiles;
    const daysLeft = Math.ceil((new Date(doc.expires_at).getTime() - now.getTime()) / 86400000);
    if (profile?.email) {
      await sendEmail({
        to: profile.email,
        subject: `Document renewal required — ${doc.document_type ?? 'document'} expires in ${daysLeft} days`,
        html: `<p>Hi ${profile.full_name ?? 'there'},</p><p>Your <strong>${doc.document_type ?? 'compliance document'}</strong> expires in <strong>${daysLeft} days</strong>. Please submit a renewal to maintain compliance.</p><p>— Elevate for Humanity</p>`,
      }).catch((e: unknown) => logger.warn('[cron/compliance-expiration] Email failed', { doc_id: doc.id, error: String(e) }));
      warned++;
    }
  }

  // Attendance compliance — flag students below 80% attendance in active enrollments
  const { data: lowAttendance } = await db
    .from('attendance_records')
    .select('student_id, attendance_percentage, program_id')
    .lt('attendance_percentage', 80)
    .eq('period', 'current')
    .limit(50);

  let flagged = 0;
  for (const rec of lowAttendance ?? []) {
    await db.from('admin_alerts').insert({
      alert_type: 'low_attendance',
      severity: rec.attendance_percentage < 60 ? 'critical' : 'warning',
      message: `Student ${rec.student_id} attendance at ${rec.attendance_percentage}% — below 80% compliance threshold`,
      metadata: { student_id: rec.student_id, program_id: rec.program_id, attendance_pct: rec.attendance_percentage },
    })
    flagged++;
  }

  if (warned > 0 || flagged > 0) {
    await sendEmail({
      to: ADMIN_EMAIL,
      subject: `[Compliance] ${warned} document warnings, ${flagged} attendance flags`,
      html: `<p>Compliance summary:</p><ul><li>${warned} document expiration warning${warned !== 1 ? 's' : ''} sent</li><li>${flagged} student${flagged !== 1 ? 's' : ''} flagged for low attendance</li></ul><p><a href="https://www.elevateforhumanity.org/admin/compliance">Review →</a></p>`,
    }).catch((e: unknown) => logger.warn('[cron/compliance-expiration] Admin email failed', { error: String(e) }));
  }

  logger.info('[cron/compliance-expiration] Done', { warned, flagged });
  return NextResponse.json({ ok: true, warned, flagged });
});
