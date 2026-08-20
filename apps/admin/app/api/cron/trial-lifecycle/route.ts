import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { hydrateProcessEnv } from '@/lib/secrets';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { withRuntime } from '@/lib/api/withRuntime';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function _GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await hydrateProcessEnv();
  const supabase = await requireAdminClient();
  const now = new Date();
  const results = {
    expiring_3_days: 0,
    expiring_1_day: 0,
    abandoned: 0,
    expired: 0,
    errors: [] as string[],
  };

  async function recordEvent(payload: Record<string, unknown>) {
    const { error } = await supabase.from('license_events').insert(payload);
    if (error) {
      results.errors.push('Failed to record license event');
      logger.warn('[cron/trial-lifecycle] license event write failed', { error: error.message });
    }
  }

  try {
    const threeDaysFromNow = new Date(now.getTime() + 3 * 86400000);
    const threeDaysStart = new Date(now.getTime() + 2 * 86400000);
    const { data: expiringIn3 } = await supabase
      .from('managed_licenses')
      .select('id, organization_id, expires_at')
      .eq('tier', 'trial')
      .eq('status', 'active')
      .gte('expires_at', threeDaysStart.toISOString())
      .lte('expires_at', threeDaysFromNow.toISOString());

    if (expiringIn3?.length) {
      results.expiring_3_days = expiringIn3.length;
      for (const license of expiringIn3) {
        await recordEvent({
          license_id: license.id,
          organization_id: license.organization_id,
          event_type: 'trial_expiring_soon',
          event_data: { days_remaining: 3, expires_at: license.expires_at },
        });
      }
    }

    const oneDayFromNow = new Date(now.getTime() + 86400000);
    const { data: expiringIn1 } = await supabase
      .from('managed_licenses')
      .select('id, organization_id, expires_at')
      .eq('tier', 'trial')
      .eq('status', 'active')
      .gte('expires_at', now.toISOString())
      .lte('expires_at', oneDayFromNow.toISOString());

    if (expiringIn1?.length) {
      results.expiring_1_day = expiringIn1.length;
      for (const license of expiringIn1) {
        await recordEvent({
          license_id: license.id,
          organization_id: license.organization_id,
          event_type: 'trial_expiring_urgent',
          event_data: { days_remaining: 1, expires_at: license.expires_at },
        });
      }
    }

    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
    const { data: oldTrials } = await supabase
      .from('managed_licenses')
      .select('id, organization_id, created_at')
      .eq('tier', 'trial')
      .eq('status', 'active')
      .lte('created_at', sevenDaysAgo.toISOString());

    for (const license of oldTrials ?? []) {
      const { data: org } = await supabase
        .from('organizations')
        .select('onboarding_started_at')
        .eq('id', license.organization_id)
        .maybeSingle();
      if (org && !org.onboarding_started_at) {
        results.abandoned++;
        await recordEvent({
          license_id: license.id,
          organization_id: license.organization_id,
          event_type: 'trial_abandoned',
          event_data: {
            created_at: license.created_at,
            days_since_creation: Math.floor((now.getTime() - new Date(license.created_at).getTime()) / 86400000),
          },
        });
      }
    }

    const { data: overdue } = await supabase
      .from('managed_licenses')
      .select('id, organization_id')
      .eq('tier', 'trial')
      .eq('status', 'active')
      .lte('expires_at', now.toISOString());

    for (const license of overdue ?? []) {
      const { error } = await supabase
        .from('managed_licenses')
        .update({ status: 'expired', updated_at: now.toISOString() })
        .eq('id', license.id)
        .eq('status', 'active');
      if (error) {
        results.errors.push('Failed to expire managed trial license: see logs');
        continue;
      }
      results.expired++;
      await recordEvent({
        license_id: license.id,
        organization_id: license.organization_id,
        event_type: 'trial_expired',
        event_data: { expired_by: 'cron/trial-lifecycle' },
      });
    }

    logger.info('[cron/trial-lifecycle]', { ...results });
    return NextResponse.json({ ok: true, timestamp: now.toISOString(), ...results });
  } catch (error) {
    logger.error(
      '[cron/trial-lifecycle] Unexpected error',
      error instanceof Error ? error : new Error(String(error)),
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const GET = withRuntime(withApiAudit('/api/cron/trial-lifecycle', _GET));
