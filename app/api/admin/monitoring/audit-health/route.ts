import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import * as Sentry from '@sentry/nextjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Audit health check — verifies the audit pipeline is operational.
// Returns: recent audit event counts, failure counts, gap detection.
// Use with cron/uptime monitoring to alert on audit system degradation.

async function _GET(request: Request) {
  const supabase = await createClient();
  const admin = await getAdminClient();
  const db = admin || supabase;

  if (!db) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }

  // Auth check — admin only
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single();
    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
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

  return NextResponse.json({
    status,
    timestamp: now.toISOString(),
    metrics: {
      events_last_hour: eventsLastHour ?? 0,
      events_last_24h: eventsLastDay ?? 0,
      failures_last_24h: failuresLastDay ?? 0,
      gap_detected: hasGap,
    },
    recent_critical_events: recentCritical ?? [],
  });
}

export const GET = withApiAudit('/api/admin/monitoring/audit-health', _GET);
