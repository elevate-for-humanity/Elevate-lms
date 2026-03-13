import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PROVIDERS = ['stripe', 'sezzle', 'affirm', 'jotform', 'calendly', 'resend'] as const;
const VOLUME_DROP_THRESHOLD = 0.5;
const PAGE_SIZE = 50;

interface ProviderHealth {
  provider: string;
  last24h: number;
  baselineDailyAvg: number;
  ratio: number;
  healthy: boolean;
  statusBreakdown: Record<string, number>;
  lastEventAt: string | null;
}

interface WebhookEvent {
  id: string;
  provider: string;
  event_id: string | null;
  event_type: string | null;
  status: string;
  payment_reference: string | null;
  error_message: string | null;
  metadata: Record<string, unknown> | null;
  received_at: string;
}

async function requireAdmin() {
  const userSupabase = await createClient();
  const { data: { user } } = await userSupabase.auth.getUser();
  if (!user) return { error: 'Unauthorized', status: 401 as const };

  const adminDb = createAdminClient();
  if (!adminDb) return { error: 'Database unavailable', status: 503 as const };

  const { data: profile } = await adminDb
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return { error: 'Forbidden', status: 403 as const };
  }

  return { adminDb };
}

export async function GET(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const auth = await requireAdmin();
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { adminDb } = auth;

    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode');

    if (mode === 'events') {
      return handleEventsList(adminDb, searchParams);
    }

    return handleSummary(adminDb);
  } catch (error) {
    logger.error('Webhook health check failed', error instanceof Error ? error : undefined);
    return NextResponse.json({ error: 'Health check failed' }, { status: 500 });
  }
}

async function handleSummary(adminDb: NonNullable<ReturnType<typeof createAdminClient>>) {
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: total24h },
    { count: processed24h },
    { count: failed24h },
    { count: errored24h },
    { count: skipped24h },
  ] = await Promise.all([
    adminDb.from('webhook_events_processed').select('id', { count: 'exact', head: true }).gte('received_at', last24h),
    adminDb.from('webhook_events_processed').select('id', { count: 'exact', head: true }).eq('status', 'processed').gte('received_at', last24h),
    adminDb.from('webhook_events_processed').select('id', { count: 'exact', head: true }).eq('status', 'failed').gte('received_at', last24h),
    adminDb.from('webhook_events_processed').select('id', { count: 'exact', head: true }).eq('status', 'errored').gte('received_at', last24h),
    adminDb.from('webhook_events_processed').select('id', { count: 'exact', head: true }).eq('status', 'skipped').gte('received_at', last24h),
  ]);

  const providerHealth: ProviderHealth[] = [];
  const alerts: string[] = [];

  for (const provider of PROVIDERS) {
    const [
      { count: recentCount },
      { count: baselineCount },
      { data: statusRows },
      { data: lastEvent },
    ] = await Promise.all([
      adminDb.from('webhook_events_processed').select('id', { count: 'exact', head: true }).eq('provider', provider).gte('received_at', last24h),
      adminDb.from('webhook_events_processed').select('id', { count: 'exact', head: true }).eq('provider', provider).gte('received_at', last7d),
      adminDb.from('webhook_events_processed').select('status').eq('provider', provider).gte('received_at', last24h),
      adminDb.from('webhook_events_processed').select('received_at').eq('provider', provider).order('received_at', { ascending: false }).limit(1).maybeSingle(),
    ]);

    const statusBreakdown: Record<string, number> = {};
    for (const row of statusRows || []) {
      statusBreakdown[row.status] = (statusBreakdown[row.status] || 0) + 1;
    }

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
    summary: {
      total: total24h || 0,
      processed: processed24h || 0,
      failed: failed24h || 0,
      errored: errored24h || 0,
      skipped: skipped24h || 0,
    },
    providers: providerHealth,
    alerts,
  });
}

async function handleEventsList(
  adminDb: NonNullable<ReturnType<typeof createAdminClient>>,
  params: URLSearchParams
) {
  const provider = params.get('provider');
  const status = params.get('status');
  const eventType = params.get('event_type');
  const from = params.get('from');
  const to = params.get('to');
  const page = Math.max(1, parseInt(params.get('page') || '1', 10));
  const offset = (page - 1) * PAGE_SIZE;

  let query = adminDb
    .from('webhook_events_processed')
    .select('id, provider, event_id, event_type, status, payment_reference, error_message, metadata, received_at', { count: 'exact' })
    .order('received_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (provider) query = query.eq('provider', provider);
  if (status) query = query.eq('status', status);
  if (eventType) query = query.eq('event_type', eventType);
  if (from) query = query.gte('received_at', from);
  if (to) query = query.lte('received_at', to);

  const { data, count, error } = await query;

  if (error) {
    logger.error('Webhook events list query failed', error);
    return NextResponse.json({ error: 'Query failed' }, { status: 500 });
  }

  return NextResponse.json({
    events: (data || []) as WebhookEvent[],
    total: count || 0,
    page,
    pageSize: PAGE_SIZE,
    pages: Math.ceil((count || 0) / PAGE_SIZE),
  });
}
