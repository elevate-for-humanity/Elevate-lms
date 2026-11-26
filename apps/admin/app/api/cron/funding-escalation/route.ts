import { NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { safeInternalError } from '@/lib/api/safe-error';
import { sendSlackMessage } from '@/lib/notifications/slack';
import { hydrateProcessEnv } from '@/lib/secrets';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  await hydrateProcessEnv();
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    logger.error('[cron/funding-escalation] CRON_SECRET not set');
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }
  if (req.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = await requireAdminClient();
  const timestamp = new Date().toISOString();
  const { data, error } = await db.rpc('escalate_overdue_funding_verifications');

  if (error) {
    logger.error('[cron/funding-escalation] RPC error:', error);
    await sendSlackMessage({
      text: ':rotating_light: *Funding escalation cron FAILED*',
      color: '#CC0000',
      fields: [
        { title: 'Error', value: 'Funding escalation cron failed — check server logs', short: false },
        { title: 'Time', value: timestamp, short: true },
        { title: 'Action required', value: 'Run `SELECT escalate_overdue_funding_verifications();` in Supabase SQL Editor', short: false },
      ],
    });
    return safeInternalError(error, 'Funding escalation cron failed');
  }

  const escalated = typeof data === 'number' ? data : 0;
  // webhook_health_log.endpoint_status is NOT NULL and open_flags is text:
  // without provider/endpoint_status (and with a numeric open_flags) this
  // insert failed on every run and the failure was swallowed below as a
  // non-fatal warning, which is why the log went stale on 2026-09-07 even
  // though this cron kept running daily.
  const { error: healthLogError } = await db.from('webhook_health_log').insert({
    provider: 'funding-escalation',
    endpoint_status: escalated > 0 ? 'degraded' : 'ok',
    checked_at: timestamp,
    open_flags: String(escalated),
    notes: `funding-escalation cron: ${escalated} enrollment(s) escalated`,
  });
  if (healthLogError) {
    logger.warn('[cron/funding-escalation] health log write failed (non-fatal)', {
      error: healthLogError.message,
    });
  }

  logger.info(`[cron/funding-escalation] Escalated ${escalated} enrollment(s)`);
  if (escalated > 0) {
    await sendSlackMessage({
      text: `:warning: *${escalated} funding verification${escalated === 1 ? '' : 's'} escalated — SLA breach*`,
      color: '#FF6600',
      fields: [
        { title: 'Escalated', value: String(escalated), short: true },
        { title: 'Time', value: timestamp, short: true },
        { title: 'Action required', value: 'Review funding verification in the Admin portal', short: false },
      ],
    });
  }

  return NextResponse.json({ ok: true, escalated, timestamp });
}

