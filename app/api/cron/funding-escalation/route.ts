export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

/**
 * GET /api/cron/funding-escalation
 *
 * Called daily. Runs `escalate_overdue_funding_verifications()` which marks
 * enrollments past the 14-day SLA as escalated and inserts rows into
 * `funding_verification_escalations`.
 *
 * Auth: Authorization: Bearer <CRON_SECRET>
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

  const { data, error } = await db.rpc('escalate_overdue_funding_verifications');

  if (error) {
    logger.error('[cron/funding-escalation] RPC error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const escalated = typeof data === 'number' ? data : 0;

  // Non-fatal observability log
  await db
    .from('webhook_health_log')
    .insert({
      checked_at: new Date().toISOString(),
      open_flags: escalated,
      notes: `funding-escalation cron: ${escalated} enrollment(s) escalated`,
    })
    .then(() => {})
    .catch(() => {});

  logger.info(`[cron/funding-escalation] Escalated ${escalated} enrollment(s)`);

  return NextResponse.json({
    ok: true,
    escalated,
    timestamp: new Date().toISOString(),
  });
}
