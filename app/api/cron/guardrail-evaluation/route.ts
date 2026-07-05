/**
 * GET /api/cron/guardrail-evaluation
 * Evaluate AI guardrail violations from the last 24h and alert admin on patterns.
 */
import { NextResponse } from 'next/server';
import { withRuntime } from '@/lib/api/withRuntime';
import { requireAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VIOLATION_ALERT_THRESHOLD = 5;

export const GET = withRuntime({ cron: 'bearer' }, async () => {
  const db = await requireAdminClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: violations, error } = await db
    .from('ai_guardrail_logs')
    .select('id, user_id, violation_type, severity, created_at')
    .gte('created_at', since)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('[cron/guardrail-evaluation] DB error', { error: error.message });
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const rows = violations ?? [];
  const total = rows.length;

  // Group by violation_type
  const byType: Record<string, number> = {};
  for (const v of rows) {
    const t = v.violation_type ?? 'unknown';
    byType[t] = (byType[t] ?? 0) + 1;
  }

  // Unique users with violations
  const uniqueUsers = new Set(rows.map((v) => v.user_id).filter(Boolean)).size;

  if (total >= VIOLATION_ALERT_THRESHOLD) {
    await db.from('admin_alerts').insert({
      alert_type: 'ai_guardrail_pattern',
      severity: total >= 20 ? 'critical' : 'high',
      message: `${total} AI guardrail violations in the last 24h across ${uniqueUsers} user(s).`,
      metadata: { total, uniqueUsers, byType, since },
    }).then(undefined, (err) =>
      logger.error('[cron/guardrail-evaluation] Failed to insert admin alert', { error: String(err) }),
    );
  }

  logger.info('[cron/guardrail-evaluation] evaluated', { total, uniqueUsers, byType });
  return NextResponse.json({ ok: true, total, uniqueUsers, byType });
});
