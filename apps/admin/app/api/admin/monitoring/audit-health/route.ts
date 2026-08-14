import { NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { safeInternalError } from '@/lib/api/safe-error';
import { logger } from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Audit health check — verifies the audit pipeline is operational.
// Returns: recent audit event counts, failure counts, gap detection.
// Use with cron/uptime monitoring to alert on audit system degradation.

async function _GET(request: Request) {
  try {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const admin = await requireAdminClient();
  const supabase = admin ?? (await createClient());
  const db = admin ?? supabase;

  if (!db) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }

  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Count recent audit events
  const { count: eventsLastHour } = await db
    .from('audit_logs')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', oneHourAgo.toISOString());

  const { count: eventsLastDay } = await db
    .from('audit_logs')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', oneDayAgo.toISOString());

  // Count audit failures
  const { count: failuresLastDay } = await db
    .from('audit_failures')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', oneDayAgo.toISOString());

  // Check for gaps — if no events in the last hour during business hours, flag it
  const hour = now.getUTCHours();
  const isBusinessHours = hour >= 13 && hour <= 23; // 8am-6pm ET
  const hasGap = isBusinessHours && (eventsLastHour === 0 || eventsLastHour === null);

  // Check critical route coverage — sample recent critical events
  const { data: recentCritical } = await db
    .from('audit_logs')
    .select('endpoint, created_at')
    .in('endpoint', [
      '/api/rapids/update',
      '/api/ojt/hours',
      '/api/enroll/approve',
      '/api/webhooks/stripe',
    ])
    .gte('created_at', oneDayAgo.toISOString())
    .order('created_at', { ascending: false })
    .limit(10);

  const status = hasGap ? 'degraded' : (failuresLastDay ?? 0) > 10 ? 'warning' : 'healthy';

  // Alert Sentry if degraded
  if (status === 'degraded') {
    Sentry.captureMessage('Audit health check: no events in last hour during business hours', {
      level: 'warning',
      tags: { subsystem: 'audit_health' },
      extra: { eventsLastHour, eventsLastDay, failuresLastDay },
    });
  }

  const eventsLast24h = eventsLastDay ?? 0;
  const failuresLast24h = failuresLastDay ?? 0;

  return NextResponse.json({
    status,
    timestamp: now.toISOString(),
    // MonitoringSetupClient fields
    recentCount: eventsLast24h,
    failureCount: failuresLast24h,
    message: hasGap
      ? 'No audit events in the last hour during business hours'
      : failuresLast24h > 10
        ? `${failuresLast24h} audit write failures in the last 24h`
        : 'Audit pipeline operational',
    metrics: {
      events_last_hour: eventsLastHour ?? 0,
      events_last_24h: eventsLast24h,
      failures_last_24h: failuresLast24h,
      gap_detected: hasGap,
    },
    recent_critical_events: recentCritical ?? [],
  });
  } catch (err) {
    logger.error('[monitoring/audit-health] failed', err);
    return safeInternalError(err, 'Audit health check failed');
  }
}

export const GET = withApiAudit('/api/admin/monitoring/audit-health', _GET);
