
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { safeInternalError } from '@/lib/api/safe-error';
import { sendSlackMessage } from '@/lib/notifications/slack';
export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cron/funding-escalation
 *
 * Called daily. Runs `escalate_overdue_funding_verifications()` which inserts
 * rows into `funding_verification_escalations` for any enrollment past its
 * 14-day SLA deadline.
 *
 * Auth: Authorization: Bearer <CRON_SECRET>
 *
 * Alerts via Slack (SLACK_WEBHOOK_URL) on:
 *   - RPC errors (cron failure = SLA enforcement silently dead)
 *   - Any escalations fired (ops visibility for follow-up)
 */
export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    logger.error('[cron/funding-escalation] CRON_SECRET not set');
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }

  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = createAdminClient();
  const timestamp = new Date().toISOString();

  const { data, error } = await db.rpc('escalate_overdue_funding_verifications');

  if (error) {
    logger.error('[cron/funding-escalation] RPC error:', error);

    // Alert ops — a cron failure means SLA enforcement is silently dead.
    // Without this alert, overdue enrollments accumulate invisibly.
    await sendSlackMessage({
      text: ':rotating_light: *Funding escalation cron FAILED*',
      color: '#CC0000',
      fields: [
        { title: 'Error', value: error.message, short: false },
        { title: 'Time', value: timestamp, short: true },
        {
          title: 'Action required',
          value: 'Run `SELECT escalate_overdue_funding_verifications();` in Supabase SQL Editor',
          short: false,
        },
      ],
    });

    return safeInternalError(error, 'Funding escalation cron failed');
  }

  const escalated = typeof data === 'number' ? data : 0;

  // Non-fatal observability log
  await db
    .from('webhook_health_log')
    .insert({
      checked_at: timestamp,
      open_flags: escalated,
      notes: `funding-escalation cron: ${escalated} enrollment(s) escalated`,
    })
    .then(() => {})
    .catch((err: unknown) => {
      logger.error('[cron/funding-escalation] health log write failed (non-fatal):', err);
    });

  logger.info(`[cron/funding-escalation] Escalated ${escalated} enrollment(s)`);

  // Notify ops when escalations fire so they can follow up with students.
  // Zero escalations = no alert (expected steady state).
  if (escalated > 0) {
    await sendSlackMessage({
      text: `:warning: *${escalated} funding verification${escalated === 1 ? '' : 's'} escalated — SLA breach*`,
      color: '#FF6600',
      fields: [
        { title: 'Escalated', value: String(escalated), short: true },
        { title: 'Time', value: timestamp, short: true },
        {
          title: 'Action required',
          value: 'Review at /admin/funding-verification — filter Critical or Overdue',
          short: false,
        },
      ],
    });
  }

  return NextResponse.json({ ok: true, escalated, timestamp });
}
