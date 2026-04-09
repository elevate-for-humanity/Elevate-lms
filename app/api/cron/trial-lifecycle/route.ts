import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

import { auditMutation } from '@/lib/api/withAudit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

import { withRuntime } from '@/lib/api/withRuntime';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * GET /api/cron/trial-lifecycle
 *
 * Daily cron job for trial tenant lifecycle management.
 * Requires CRON_SECRET header for authentication.
 *
 * Actions:
 *   1. Flag trials expiring in 3 days (for reminder emails)
 *   2. Flag trials expiring in 1 day (urgent reminder)
 *   3. Log abandoned trials (created > 7 days ago, never engaged)
 *   4. Mark expired trials as 'expired' in licenses table
 */
async function _GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  const now = new Date();
  const results = {
    expiring_3_days: 0,
    expiring_1_day: 0,
    abandoned: 0,
    expired: 0,
    errors: [] as string[],
  };

  try {
    // 1. Trials expiring in 3 days
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const threeDaysStart = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

    const { data: expiringIn3 } = await supabase
      .from('licenses')
      .select('id, organization_id, expires_at')
      .eq('tier', 'trial')
      .eq('status', 'active')
      .gte('expires_at', threeDaysStart.toISOString())
      .lte('expires_at', threeDaysFromNow.toISOString());

    if (expiringIn3?.length) {
      results.expiring_3_days = expiringIn3.length;
      for (const license of expiringIn3) {
        await supabase.from('license_events').insert({
          license_id: license.id,
          organization_id: license.organization_id,
          event_type: 'trial_expiring_soon',
          event_data: { days_remaining: 3, expires_at: license.expires_at },
        }).catch(() => {});
      }
    }

    // 2. Trials expiring in 1 day
    const oneDayFromNow = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);

    const { data: expiringIn1 } = await supabase
      .from('licenses')
      .select('id, organization_id, expires_at')
      .eq('tier', 'trial')
      .eq('status', 'active')
      .gte('expires_at', now.toISOString())
      .lte('expires_at', oneDayFromNow.toISOString());

    if (expiringIn1?.length) {
      results.expiring_1_day = expiringIn1.length;
      for (const license of expiringIn1) {
        await supabase.from('license_events').insert({
          license_id: license.id,
          organization_id: license.organization_id,
          event_type: 'trial_expiring_urgent',
          event_data: { days_remaining: 1, expires_at: license.expires_at },
        }).catch(() => {});
      }
    }

    // 3. Abandoned trials: created > 7 days ago, org has no onboarding_started_at
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const { data: oldTrials } = await supabase
      .from('licenses')
      .select('id, organization_id, created_at')
      .eq('tier', 'trial')
      .eq('status', 'active')
      .lte('created_at', sevenDaysAgo.toISOString());

    if (oldTrials?.length) {
      for (const license of oldTrials) {
        const { data: org } = await supabase
          .from('organizations')
          .select('onboarding_started_at')
          .eq('id', license.organization_id)
          .maybeSingle();

        if (org && !org.onboarding_started_at) {
          results.abandoned++;
          await supabase.from('license_events').insert({
            license_id: license.id,
            organization_id: license.organization_id,
            event_type: 'trial_abandoned',
            event_data: {
              created_at: license.created_at,
              days_since_creation: Math.floor((now.getTime() - new Date(license.created_at).getTime()) / (24 * 60 * 60 * 1000)),
            },
          }).catch(() => {});
        }
      }
    }

    // 4. Expire overdue trials
    const { data: overdue } = await supabase
      .from('licenses')
      .select('id, organization_id')
      .eq('tier', 'trial')
      .eq('status', 'active')
      .lte('expires_at', now.toISOString());

    if (overdue?.length) {
      for (const license of overdue) {
        const { error } = await supabase
          .from('licenses')
          .update({ status: 'expired' })
          .eq('id', license.id);

        if (error) {
          results.errors.push('Failed to expire license: see logs');
        } else {
          results.expired++;
          await supabase.from('license_events').insert({
            license_id: license.id,
            organization_id: license.organization_id,
            event_type: 'trial_expired',
            event_data: { expired_by: 'cron/trial-lifecycle' },
          }).catch(() => {});
        }
      }
    }

    logger.info('[cron/trial-lifecycle]', JSON.stringify(results));

    return NextResponse.json({
      ok: true,
      timestamp: now.toISOString(),
      ...results,
    });
  } catch (error) {
    logger.error('[cron/trial-lifecycle] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export const GET = withRuntime(withApiAudit('/api/cron/trial-lifecycle', _GET));
