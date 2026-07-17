/**
 * GET /api/cron/payout-deadline-alert
 * Alert on payout_schedules due within 48h that are still pending.
 */
import { NextResponse } from 'next/server';
import { withRuntime } from '@/lib/api/withRuntime';
import { requireAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/service';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ADMIN_EMAIL = 'elevate4humanityedu@gmail.com';

export const GET = withRuntime({ cron: 'bearer' }, async () => {
  const db = await requireAdminClient();
  const in48h = new Date(Date.now() + 48 * 3600000).toISOString().split('T')[0];
  const today = new Date().toISOString().split('T')[0];

  const { data: upcoming, error } = await db
    .from('payout_schedules')
    .select('id, amount_cents, scheduled_date, recipient_id, payout_type, profiles!payout_schedules_recipient_id_fkey(full_name, email)')
    .eq('status', 'pending')
    .gte('scheduled_date', today)
    .lte('scheduled_date', in48h)
    .limit(50);

  if (error) {
    logger.error('[cron/payout-deadline-alert] DB error', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  if (!upcoming?.length) return NextResponse.json({ ok: true, alerted: 0 });

  const totalCents = upcoming.reduce((sum, p) => sum + (p.amount_cents ?? 0), 0);

  await sendEmail({
    to: ADMIN_EMAIL,
    subject: `[Payouts] ${upcoming.length} payout${upcoming.length !== 1 ? 's' : ''} due within 48h — $${(totalCents / 100).toFixed(2)} total`,
    html: `<p>${upcoming.length} payout${upcoming.length !== 1 ? 's' : ''} are due within 48 hours totalling <strong>$${(totalCents / 100).toFixed(2)}</strong>.</p><ul>${upcoming.map(p => { const profile = (p as any).profiles; return `<li>${profile?.full_name ?? p.recipient_id} — $${((p.amount_cents ?? 0) / 100).toFixed(2)} (${p.payout_type ?? 'payout'}) due ${p.scheduled_date}</li>`; }).join('')}</ul><p><a href="https://www.elevateforhumanity.org/admin/payouts">Process payouts →</a></p>`,
  }).catch((e: unknown) => logger.warn('[cron/payout-deadline-alert] Email failed', { error: String(e) }));

  logger.info('[cron/payout-deadline-alert] Done', { alerted: upcoming.length, total_cents: totalCents });
  return NextResponse.json({ ok: true, alerted: upcoming.length, total_cents: totalCents });
});
