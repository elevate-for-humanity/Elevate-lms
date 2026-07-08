import 'server-only';

import { requireAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { getPlatformHealth } from '@/lib/platform/platform-health';
import { emitEvent } from '@/lib/platform/events';

export type AutopilotTickResult = {
  ok: boolean;
  checks: string[];
  actions: string[];
  errors: string[];
};

/**
 * Production autopilot tick: monitor + lightweight autonomous actions.
 * Called from /api/cron/autopilot-tick (GitHub cron).
 */
export async function runPlatformAutopilotTick(): Promise<AutopilotTickResult> {
  const checks: string[] = [];
  const actions: string[] = [];
  const errors: string[] = [];

  try {
    const health = await getPlatformHealth();
    checks.push(`platform_health:${health.overall ?? 'unknown'}`);

    const db = await requireAdminClient();

    const now = new Date();
    const inThreeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();

    const { data: expiringTrials } = await db
      .from('managed_licenses')
      .select('id, organization_id, trial_ends_at')
      .eq('tier', 'trial')
      .eq('status', 'active')
      .lte('trial_ends_at', inThreeDays)
      .limit(50);

    checks.push(`expiring_trials:${expiringTrials?.length ?? 0}`);

    for (const license of expiringTrials ?? []) {
      try {
        await db.from('operator_tasks').insert({
          workspace_id: null,
          task_type: 'trial_conversion_nudge',
          status: 'queued',
          prompt: `Trial ending soon for organization ${license.organization_id}. Send conversion email and surface upgrade CTA.`,
          metadata: {
            organization_id: license.organization_id,
            trial_ends_at: license.trial_ends_at,
            autopilot: true,
          },
        } as Record<string, unknown>);
        actions.push(`queued_trial_nudge:${license.organization_id}`);
      } catch (e) {
        errors.push(`trial_nudge_failed:${license.organization_id}`);
        logger.warn('[autopilot] trial nudge failed', e);
      }
    }

    const { data: staleWorkspaces } = await db
      .from('customer_workspaces')
      .select('id, slug, status, updated_at')
      .eq('status', 'provisioning')
      .lt('updated_at', new Date(now.getTime() - 30 * 60 * 1000).toISOString())
      .limit(20);

    checks.push(`stale_provisioning:${staleWorkspaces?.length ?? 0}`);

    for (const ws of staleWorkspaces ?? []) {
      try {
        await db.from('provisioning_jobs').insert({
          job_type: 'workspace_provision',
          correlation_id: `autopilot:workspace:${ws.id}`,
          tenant_id: null,
          payload: { workspace_id: ws.id, slug: ws.slug, organization_id: null },
          status: 'queued',
          run_at: new Date().toISOString(),
        } as Record<string, unknown>);
        actions.push(`requeued_workspace:${ws.slug}`);
      } catch {
        errors.push(`requeue_failed:${ws.id}`);
      }
    }

    await emitEvent('autopilot.tick_complete', 'system', {
      severity: errors.length ? 'warning' : 'info',
      actor_type: 'cron',
      payload: { checks, actions, errorCount: errors.length },
    });

    return { ok: errors.length === 0, checks, actions, errors };
  } catch (err) {
    logger.error('[autopilot] tick failed', err instanceof Error ? err : new Error(String(err)));
    return {
      ok: false,
      checks,
      actions,
      errors: [...errors, err instanceof Error ? err.message : 'tick_failed'],
    };
  }
}
