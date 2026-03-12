import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Webhook Health Monitor
 *
 * Compares webhook volume over the last 24 hours against a 7-day baseline.
 * Returns per-provider stats and flags providers whose volume dropped
 * below a configurable threshold (default: 50% of baseline average).
 *
 * Admin-only endpoint.
 */

const PROVIDERS = ['stripe', 'sezzle', 'affirm', 'jotform'] as const;
const VOLUME_DROP_THRESHOLD = 0.5; // Alert if current < 50% of baseline daily average

interface ProviderHealth {
  provider: string;
  last24h: number;
  baselineDailyAvg: number;
  ratio: number;
  healthy: boolean;
  statusBreakdown: Record<string, number>;
  lastEventAt: string | null;
}

export async function GET(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    // Admin auth check
    const userSupabase = await createClient();
    const { data: { user } } = await userSupabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminDb = createAdminClient();
    if (!adminDb) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    const { data: profile } = await adminDb
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const providerHealth: ProviderHealth[] = [];
    const alerts: string[] = [];

    for (const provider of PROVIDERS) {
      // Count events in last 24 hours
      const { count: recentCount } = await adminDb
        .from('webhook_events_processed')
        .select('id', { count: 'exact', head: true })
        .eq('provider', provider)
        .gte('received_at', last24h);

      // Count events in last 7 days (for baseline)
      const { count: baselineCount } = await adminDb
        .from('webhook_events_processed')
        .select('id', { count: 'exact', head: true })
        .eq('provider', provider)
        .gte('received_at', last7d);

      // Status breakdown for last 24h
      const { data: statusRows } = await adminDb
        .from('webhook_events_processed')
        .select('status')
        .eq('provider', provider)
        .gte('received_at', last24h);

      const statusBreakdown: Record<string, number> = {};
      for (const row of statusRows || []) {
        statusBreakdown[row.status] = (statusBreakdown[row.status] || 0) + 1;
      }

      // Most recent event
      const { data: lastEvent } = await adminDb
        .from('webhook_events_processed')
        .select('received_at')
        .eq('provider', provider)
        .order('received_at', { ascending: false })
        .limit(1)
        .single();

      const recent = recentCount || 0;
      const baseline = baselineCount || 0;
      const baselineDailyAvg = baseline / 7;
      const ratio = baselineDailyAvg > 0 ? recent / baselineDailyAvg : (recent > 0 ? 1 : 0);
      const healthy = baselineDailyAvg === 0 || ratio >= VOLUME_DROP_THRESHOLD;

      if (!healthy) {
        alerts.push(
          `${provider}: ${recent} events in last 24h vs ${baselineDailyAvg.toFixed(1)} daily avg (${(ratio * 100).toFixed(0)}% of baseline)`
        );
      }

      // Flag high error rates
      const errorCount = (statusBreakdown['errored'] || 0) + (statusBreakdown['failed'] || 0);
      if (recent > 0 && errorCount / recent > 0.2) {
        alerts.push(
          `${provider}: ${errorCount}/${recent} events errored/failed in last 24h (${((errorCount / recent) * 100).toFixed(0)}%)`
        );
      }

      providerHealth.push({
        provider,
        last24h: recent,
        baselineDailyAvg: Math.round(baselineDailyAvg * 10) / 10,
        ratio: Math.round(ratio * 100) / 100,
        healthy,
        statusBreakdown,
        lastEventAt: lastEvent?.received_at || null,
      });
    }

    return NextResponse.json({
      healthy: alerts.length === 0,
      checkedAt: now.toISOString(),
      threshold: VOLUME_DROP_THRESHOLD,
      providers: providerHealth,
      alerts,
    });
  } catch (error) {
    logger.error('Webhook health check failed', error instanceof Error ? error : undefined);
    return NextResponse.json({ error: 'Health check failed' }, { status: 500 });
  }
}
