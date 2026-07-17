/**
 * GET /api/cron/expire-exam-authorizations
 * Expire exam_authorizations that have passed their expiry date.
 */
import { NextResponse } from 'next/server';
import { withRuntime } from '@/lib/api/withRuntime';
import { requireAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/service';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withRuntime({ cron: 'bearer' }, async () => {
  const db = await requireAdminClient();
  const now = new Date().toISOString();

  const { data: expiring, error } = await db
    .from('exam_authorizations')
    .select('id, student_id, exam_type, expires_at, profiles!exam_authorizations_student_id_fkey(full_name, email)')
    .eq('status', 'active')
    .lt('expires_at', now)
    .limit(100);

  if (error) {
    logger.error('[cron/expire-exam-authorizations] DB error', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  if (!expiring?.length) return NextResponse.json({ ok: true, expired: 0 });

  const ids = expiring.map(e => e.id);
  const { error: updateErr } = await db
    .from('exam_authorizations')
    .update({ status: 'expired', updated_at: now })
    .in('id', ids);

  if (updateErr) {
    logger.error('[cron/expire-exam-authorizations] Update failed', updateErr);
    return NextResponse.json({ ok: false, error: updateErr.message }, { status: 500 });
  }

  // Notify affected students
  for (const auth of expiring) {
    const profile = (auth as any).profiles;
    if (!profile?.email) continue;
    await sendEmail({
      to: profile.email,
      subject: `Your exam authorization has expired — ${auth.exam_type ?? 'exam'}`,
      html: `<p>Hi ${profile.full_name ?? 'there'},</p><p>Your authorization to take the <strong>${auth.exam_type ?? 'exam'}</strong> has expired. Please contact your instructor to request a new authorization.</p><p>— Elevate for Humanity</p>`,
    }).catch((e: unknown) => logger.warn('[cron/expire-exam-authorizations] Email failed', { auth_id: auth.id, error: String(e) }));
  }

  logger.info('[cron/expire-exam-authorizations] Done', { expired: ids.length });
  return NextResponse.json({ ok: true, expired: ids.length });
});
