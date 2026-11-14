import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';

import { getSiteHealthSnapshot } from '@/lib/admin/get-site-health';
import { recordRuntimeIntegrationEvidence } from '@/lib/integrations/runtime-evidence';
import { RUNTIME_INTEGRATIONS, runtimeConfiguration } from '@/lib/integrations/runtime-status';
import { hydrateProcessEnv } from '@/lib/secrets';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Scheduled webhook health check.
 * Run via cron (e.g., every 6 hours).
 * Compares last 24h volume against 7-day baseline per provider.
 * Enqueues alert to notification_outbox if volume drops below threshold.
 *
 * Secured by CRON_SECRET header.
 */

const PROVIDERS = RUNTIME_INTEGRATIONS.filter(provider => provider.webhook).map(provider => provider.id);
const VOLUME_DROP_THRESHOLD = 0.5;
const ERROR_RATE_THRESHOLD = 0.2;
const ADMIN_EMAIL = 'elevate4humanityedu@gmail.com';

export async function GET(request: NextRequest) {
  await hydrateProcessEnv();
  // Verify cron secret
  const cronSecret = process.env.CRON_SECRET;
  const providedSecret = request.headers.get('authorization')?.replace('Bearer ', '');

  if (!cronSecret || providedSecret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const adminDb = await requireAdminClient();
  if (!adminDb) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }

  try {
    const monitoring = await recordRuntimeIntegrationEvidence(adminDb, await getSiteHealthSnapshot());
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const alerts: string[] = [];

    for (const provider of PROVIDERS) {
      const { count: recentCount, error: recentError } = await adminDb
        .from('webhook_events_processed')
        .select('id', { count: 'exact', head: true })
        .eq('provider', provider)
        .gte('received_at', last24h);

      const { count: baselineCount, error: baselineError } = await adminDb
        .from('webhook_events_processed')
        .select('id', { count: 'exact', head: true })
        .eq('provider', provider)
        .gte('received_at', last7d);

      if (recentError || baselineError) throw new Error('Webhook evidence query failed');
      if (!runtimeConfiguration(provider).configured) continue;
      const recent = recentCount || 0;
      const baseline = baselineCount || 0;
      const baselineDailyAvg = baseline / 7;

      // Volume drop check
      if (baselineDailyAvg > 0 && recent / baselineDailyAvg < VOLUME_DROP_THRESHOLD) {
        alerts.push(
          `${provider}: volume drop — ${recent} events in 24h vs ${baselineDailyAvg.toFixed(1)} daily avg`,
        );
      }

      // Error rate check
      if (recent > 0) {
        const { count: errorCount, error: countError } = await adminDb
          .from('webhook_events_processed')
          .select('id', { count: 'exact', head: true })
          .eq('provider', provider)
          .gte('received_at', last24h)
          .in('status', ['errored', 'failed']);

        if (countError) throw new Error('Webhook error count unavailable');
        const errors = errorCount || 0;
        if (errors / recent > ERROR_RATE_THRESHOLD) {
          alerts.push(
            `${provider}: high error rate — ${errors}/${recent} events errored (${((errors / recent) * 100).toFixed(0)}%)`,
          );
        }
      }
    }

    if (alerts.length > 0) {
      logger.warn('Webhook health alerts detected', { alerts });

      // Throttle: only send alert if no webhook_health_alert was sent in the last hour
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
      const { count: recentAlerts, error: alertError } = await adminDb
        .from('notification_outbox')
        .select('id', { count: 'exact', head: true })
        .eq('template_key', 'webhook_health_alert')
        .gte('created_at', oneHourAgo);

      if (alertError) throw new Error('Alert history unavailable');
      let notificationQueued = false;

      if (!recentAlerts || recentAlerts === 0) {
        const { error: notifyErr } = await adminDb.from('notification_outbox').insert({
          to_email: ADMIN_EMAIL,
          template_key: 'webhook_health_alert',
          template_data: {
            alerts,
            checked_at: now.toISOString(),
            threshold: `${VOLUME_DROP_THRESHOLD * 100}%`,
          },
          status: 'queued',
          scheduled_for: now.toISOString(),
          entity_type: 'system',
          entity_id: null,
        });

        if (notifyErr) {
          logger.error('Failed to enqueue webhook health alert', notifyErr);
        } else {
          notificationQueued = true;
        }
      } else {
        logger.info('Webhook health alert throttled — alert sent within last hour', {
          recentAlerts,
        });
      }

      return NextResponse.json({
        healthy: false,
        alerts,
        notificationQueued,
        throttled: !notificationQueued,
      });
    }

    const verified = monitoring.observations.every(row => row.authenticated);
    return NextResponse.json({ healthy: verified, alerts: [], monitoring, checkedAt: now.toISOString() });
  } catch (error) {
    logger.error('Webhook health cron failed', error instanceof Error ? error : undefined);
    return NextResponse.json({ error: 'Health check failed' }, { status: 500 });
  }
}
