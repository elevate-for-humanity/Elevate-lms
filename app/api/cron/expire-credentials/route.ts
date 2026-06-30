/**
 * GET /api/cron/expire-credentials
 * Expire credentials past their expiry date and notify holders.
 */
import { NextResponse } from 'next/server';
import { withRuntime } from '@/lib/api/withRuntime';
import { requireAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/service';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const WARN_DAYS_BEFORE = 30;

export const GET = withRuntime({ cron: 'bearer' }, async () => {
  const db = await requireAdminClient();
  const now = new Date();
  const warnCutoff = new Date(now.getTime() + WARN_DAYS_BEFORE * 86400000).toISOString();

  // Expire overdue credentials
  const { data: expired, error: expErr } = await db
    .from('credentials')
    .update({ status: 'expired', updated_at: now.toISOString() })
    .eq('status', 'active')
    .lt('expires_at', now.toISOString())
    .select('id, student_id, credential_type, expires_at');

  if (expErr) {
    logger.error('[cron/expire-credentials] Expire update failed', expErr);
    return NextResponse.json({ ok: false, error: expErr.message }, { status: 500 });
  }

  // Warn about credentials expiring within 30 days
  const { data: expiringSoon } = await db
    .from('credentials')
    .select('id, student_id, credential_type, expires_at, profiles!credentials_student_id_fkey(full_name, email)')
    .eq('status', 'active')
    .gt('expires_at', now.toISOString())
    .lt('expires_at', warnCutoff)
    .is('expiry_warned_at', null)
    .limit(100);

  let warned = 0;
  for (const cred of expiringSoon ?? []) {
    const profile = (cred as any).profiles;
    const daysLeft = Math.ceil((new Date(cred.expires_at).getTime() - now.getTime()) / 86400000);
    if (profile?.email) {
      await sendEmail({
        to: profile.email,
        subject: `Your ${cred.credential_type ?? 'credential'} expires in ${daysLeft} days`,
        html: `<p>Hi ${profile.full_name ?? 'there'},</p><p>Your <strong>${cred.credential_type ?? 'credential'}</strong> expires in <strong>${daysLeft} days</strong>. Please contact your program coordinator to begin the renewal process.</p><p>— Elevate for Humanity</p>`,
      }).catch((e: unknown) => logger.warn('[cron/expire-credentials] Warn email failed', { cred_id: cred.id, error: String(e) }));
    }
    await Promise.resolve(
      db.from('credentials').update({ expiry_warned_at: now.toISOString() }).eq('id', cred.id)
    ).catch(() => {});
    warned++;
  }

  logger.info('[cron/expire-credentials] Done', { expired: expired?.length ?? 0, warned });
  return NextResponse.json({ ok: true, expired: expired?.length ?? 0, warned });
});
