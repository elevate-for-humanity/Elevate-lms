/**
 * GET /api/cron/trial-lifecycle
 * Manage trial organization lifecycle: warn at day 7, expire at day 14, clean up at day 30.
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
  const now = new Date();

  const day7 = new Date(now.getTime() - 7 * 86400000).toISOString();
  const day14 = new Date(now.getTime() - 14 * 86400000).toISOString();
  const day30 = new Date(now.getTime() - 30 * 86400000).toISOString();

  // Warn trials at day 7
  const { data: warn7 } = await db
    .from('organizations')
    .select('id, name, owner_email, trial_started_at')
    .eq('plan', 'trial')
    .eq('status', 'active')
    .gte('trial_started_at', day14)
    .lt('trial_started_at', day7)
    .is('trial_warned_at', null)
    .limit(50);

  let warned = 0;
  for (const org of warn7 ?? []) {
    if (org.owner_email) {
      await sendEmail({
        to: org.owner_email,
        subject: `Your Elevate trial expires in 7 days`,
        html: `<p>Hi,</p><p>Your trial for <strong>${org.name}</strong> expires in 7 days. Upgrade now to keep access to all features.</p><p><a href="https://www.elevateforhumanity.org/billing/upgrade">Upgrade →</a></p><p>— Elevate for Humanity</p>`,
      }).catch((e: unknown) => logger.warn('[cron/trial-lifecycle] Warn email failed', { org_id: org.id, error: String(e) }));
    }
    await db.from('organizations').update({ trial_warned_at: now.toISOString() }).eq('id', org.id).catch(() => {});
    warned++;
  }

  // Expire trials at day 14
  const { data: expired, error: expErr } = await db
    .from('organizations')
    .update({ status: 'trial_expired', updated_at: now.toISOString() })
    .eq('plan', 'trial')
    .eq('status', 'active')
    .lt('trial_started_at', day14)
    .select('id, name, owner_email');

  if (expErr) logger.error('[cron/trial-lifecycle] Expire failed', expErr);

  for (const org of expired ?? []) {
    if (org.owner_email) {
      await sendEmail({
        to: org.owner_email,
        subject: `Your Elevate trial has expired`,
        html: `<p>Hi,</p><p>Your trial for <strong>${org.name}</strong> has expired. Upgrade to restore access.</p><p><a href="https://www.elevateforhumanity.org/billing/upgrade">Upgrade now →</a></p><p>— Elevate for Humanity</p>`,
      }).catch((e: unknown) => logger.warn('[cron/trial-lifecycle] Expire email failed', { org_id: org.id, error: String(e) }));
    }
  }

  // Archive expired orgs at day 30
  const { count: archived } = await db
    .from('organizations')
    .update({ status: 'archived', updated_at: now.toISOString() })
    .eq('status', 'trial_expired')
    .lt('updated_at', day30)
    .select('id', { count: 'exact', head: true });

  logger.info('[cron/trial-lifecycle] Done', { warned, expired: expired?.length ?? 0, archived: archived ?? 0 });
  return NextResponse.json({ ok: true, warned, expired: expired?.length ?? 0, archived: archived ?? 0 });
});
