/**
 * GET /api/cron/expire-licenses
 * Expire licenses past their expiry date and warn holders 30 days before.
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

  // Expire overdue
  const { data: expired, error: expErr } = await db
    .from('licenses')
    .update({ status: 'expired', updated_at: now.toISOString() })
    .eq('status', 'active')
    .lt('expiry_date', now.toISOString().split('T')[0])
    .select('id, holder_id, license_type, license_number');

  if (expErr) {
    logger.error('[cron/expire-licenses] Expire failed', expErr);
    return NextResponse.json({ ok: false, error: expErr.message }, { status: 500 });
  }

  // Warn expiring soon
  const { data: expiringSoon } = await db
    .from('licenses')
    .select('id, holder_id, license_type, license_number, expiry_date, profiles!licenses_holder_id_fkey(full_name, email)')
    .eq('status', 'active')
    .gt('expiry_date', now.toISOString().split('T')[0])
    .lt('expiry_date', warnCutoff.split('T')[0])
    .is('expiry_warned_at', null)
    .limit(100);

  let warned = 0;
  for (const lic of expiringSoon ?? []) {
    const profile = (lic as any).profiles;
    const daysLeft = Math.ceil((new Date(lic.expiry_date).getTime() - now.getTime()) / 86400000);
    if (profile?.email) {
      await sendEmail({
        to: profile.email,
        subject: `License renewal required — ${lic.license_type ?? 'your license'} expires in ${daysLeft} days`,
        html: `<p>Hi ${profile.full_name ?? 'there'},</p><p>Your <strong>${lic.license_type ?? 'license'}</strong> (${lic.license_number ?? 'N/A'}) expires in <strong>${daysLeft} days</strong>. Please begin the renewal process immediately.</p><p>— Elevate for Humanity</p>`,
      }).catch((e: unknown) => logger.warn('[cron/expire-licenses] Warn email failed', { lic_id: lic.id, error: String(e) }));
    }
    await db.from('licenses').update({ expiry_warned_at: now.toISOString() }).eq('id', lic.id).catch(() => {});
    warned++;
  }

  logger.info('[cron/expire-licenses] Done', { expired: expired?.length ?? 0, warned });
  return NextResponse.json({ ok: true, expired: expired?.length ?? 0, warned });
});
