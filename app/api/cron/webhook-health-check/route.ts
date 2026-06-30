/**
 * GET /api/cron/webhook-health-check
 * Verify critical external webhook endpoints are reachable and responding.
 */
import { NextResponse } from 'next/server';
import { withRuntime } from '@/lib/api/withRuntime';
import { requireAdminClient } from '@/lib/supabase/admin';
import { emitEvent } from '@/lib/platform/events';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TIMEOUT_MS = 8000;

// Internal health endpoints to verify
const INTERNAL_CHECKS = [
  { name: 'workflow-event-processor', path: '/api/internal/workflow-event-processor' },
  { name: 'at-risk-detection', path: '/api/internal/at-risk-detection' },
];

export const GET = withRuntime({ cron: 'bearer' }, async () => {
  const db = await requireAdminClient();
  const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL ?? process.env.DEPLOY_URL ?? '';
  const cronSecret = process.env.CRON_SECRET ?? '';

  const results: Array<{ name: string; status: 'ok' | 'error'; latency_ms?: number; error?: string }> = [];

  for (const check of INTERNAL_CHECKS) {
    const start = Date.now();
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
      const res = await fetch(`${adminUrl}${check.path}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${cronSecret}`, 'Content-Type': 'application/json' },
        signal: controller.signal,
      }).finally(() => clearTimeout(timer));
      results.push({ name: check.name, status: res.ok ? 'ok' : 'error', latency_ms: Date.now() - start });
    } catch (err) {
      results.push({ name: check.name, status: 'error', latency_ms: Date.now() - start, error: String(err) });
    }
  }

  const failed = results.filter(r => r.status === 'error');

  if (failed.length > 0) {
    await Promise.resolve(
      db.from('admin_alerts').insert({
        alert_type: 'webhook_health_failure',
        severity: 'critical',
        message: `${failed.length} internal endpoint${failed.length !== 1 ? 's' : ''} failing health check: ${failed.map(f => f.name).join(', ')}`,
        metadata: { results },
      })
    ).catch(() => {});

    await emitEvent('system.webhook_health_failure', 'system', {
      severity: 'error',
      actor_type: 'cron',
      payload: { failed: failed.map(f => f.name), results },
      message: `Webhook health check failed: ${failed.map(f => f.name).join(', ')}`,
    }).catch(() => {});
  }

  logger.info('[cron/webhook-health-check] Done', { total: results.length, failed: failed.length, results });
  return NextResponse.json({ ok: failed.length === 0, total: results.length, failed: failed.length, results });
});
