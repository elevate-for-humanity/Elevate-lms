/**
 * lib/governance/guardrail-engine.ts
 *
 * Enforcement engine for CRITICAL_GUARDRAILS, MAJOR_GUARDRAILS, MINOR_GUARDRAILS.
 * Reads live metrics from the DB, evaluates each policy's detectionRule,
 * and executes the enforcementAction when the threshold is breached.
 *
 * Called by:
 *   - /api/cron/guardrail-evaluation  (daily cron)
 *   - Admin "Run Compliance Check" button
 */

import { requireAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { sendEmail } from '@/lib/email/sendgrid';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import {
  CRITICAL_GUARDRAILS,
  MAJOR_GUARDRAILS,
  MINOR_GUARDRAILS,
  getEmailTemplate,
  type GuardrailPolicy,
  type EnforcementAction,
} from '@/lib/compliance/guardrails';

export interface GuardrailViolation {
  programHolderId: string;
  programHolderName: string;
  policy: GuardrailPolicy;
  metricValue: number;
  actionTaken: EnforcementAction | 'skipped_grace_period' | 'already_enforced';
  enforcedAt: string;
}

export interface GuardrailRunResult {
  evaluated: number;
  violations: GuardrailViolation[];
  errors: string[];
  dryRun: boolean;
}

// ── Metric fetchers ───────────────────────────────────────────────────────────
// Each metric maps to a DB query. Add new metrics here as guardrails expand.

async function fetchMetric(
  metric: string,
  programHolderId: string,
  period: GuardrailPolicy['detectionRule']['evaluationPeriod'],
): Promise<number> {
  const db = await requireAdminClient();
  const since = periodToDate(period);

  switch (metric) {
    case 'fraud_indicators': {
      const { count } = await db
        .from('compliance_violations')
        .select('*', { count: 'exact', head: true })
        .eq('program_holder_id', programHolderId)
        .eq('violation_type', 'fraud_suspected')
        .gte('created_at', since);
      return count ?? 0;
    }
    case 'data_discrepancies': {
      const { count } = await db
        .from('compliance_violations')
        .select('*', { count: 'exact', head: true })
        .eq('program_holder_id', programHolderId)
        .eq('violation_type', 'data_quality')
        .gte('created_at', since);
      return count ?? 0;
    }
    case 'credential_misuse_reports': {
      const { count } = await db
        .from('compliance_violations')
        .select('*', { count: 'exact', head: true })
        .eq('program_holder_id', programHolderId)
        .eq('violation_type', 'credential_misuse')
        .gte('created_at', since);
      return count ?? 0;
    }
    case 'safety_incidents': {
      const { count } = await db
        .from('compliance_violations')
        .select('*', { count: 'exact', head: true })
        .eq('program_holder_id', programHolderId)
        .eq('violation_type', 'safety_violation')
        .gte('created_at', since);
      return count ?? 0;
    }
    case 'major_violations': {
      const { count } = await db
        .from('compliance_violations')
        .select('*', { count: 'exact', head: true })
        .eq('program_holder_id', programHolderId)
        .eq('severity', 'major')
        .gte('created_at', since);
      return count ?? 0;
    }
    case 'data_quality_score': {
      const { data } = await db
        .from('program_holder_metrics')
        .select('data_quality_score')
        .eq('program_holder_id', programHolderId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return (data as any)?.data_quality_score ?? 100;
    }
    case 'completion_rate': {
      const { data } = await db
        .from('program_holder_metrics')
        .select('completion_rate')
        .eq('program_holder_id', programHolderId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return (data as any)?.completion_rate ?? 100;
    }
    case 'placement_rate': {
      const { data } = await db
        .from('program_holder_metrics')
        .select('placement_rate')
        .eq('program_holder_id', programHolderId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return (data as any)?.placement_rate ?? 100;
    }
    case 'financial_discrepancy_amount': {
      const { data } = await db
        .from('program_holder_metrics')
        .select('financial_discrepancy_amount')
        .eq('program_holder_id', programHolderId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return (data as any)?.financial_discrepancy_amount ?? 0;
    }
    case 'days_overdue_critical':
    case 'days_overdue_minor': {
      const { data } = await db
        .from('compliance_reports')
        .select('days_overdue')
        .eq('program_holder_id', programHolderId)
        .eq('priority', metric === 'days_overdue_critical' ? 'critical' : 'standard')
        .eq('status', 'overdue')
        .order('days_overdue', { ascending: false })
        .limit(1)
        .maybeSingle();
      return (data as any)?.days_overdue ?? 0;
    }
    default:
      logger.warn('[guardrail-engine] unknown metric', { metric });
      return 0;
  }
}

function periodToDate(period: GuardrailPolicy['detectionRule']['evaluationPeriod']): string {
  const now = new Date();
  switch (period) {
    case 'daily':     now.setDate(now.getDate() - 1); break;
    case 'weekly':    now.setDate(now.getDate() - 7); break;
    case 'monthly':   now.setMonth(now.getMonth() - 1); break;
    case 'quarterly': now.setMonth(now.getMonth() - 3); break;
  }
  return now.toISOString();
}

function evaluateRule(
  value: number,
  operator: GuardrailPolicy['detectionRule']['operator'],
  threshold: number,
): boolean {
  switch (operator) {
    case '<':  return value < threshold;
    case '>':  return value > threshold;
    case '=':  return value === threshold;
    case '!=': return value !== threshold;
    case '>=': return value >= threshold;
    case '<=': return value <= threshold;
  }
}

// ── Enforcement actions ───────────────────────────────────────────────────────

async function applyEnforcement(
  programHolderId: string,
  action: EnforcementAction,
  policy: GuardrailPolicy,
  dryRun: boolean,
  holderName: string,
  holderEmail: string | null,
): Promise<void> {
  if (dryRun) {
    logger.info('[guardrail-engine] DRY RUN — would apply', { action, programHolderId, policyId: policy.id });
    return;
  }

  const db = await requireAdminClient();

  // Record the enforcement event
  await db.from('guardrail_enforcement_log').insert({
    program_holder_id: programHolderId,
    policy_id: policy.id,
    action,
    severity: policy.severity,
    violation_type: policy.violationType,
    mou_section: policy.mouSection,
    mou_clause: policy.mouClause,
    enforced_at: new Date().toISOString(),
  });

  // Apply the action
  switch (action) {
    case 'warning':
      await db.from('program_holder_notices').insert({
        program_holder_id: programHolderId,
        type: 'warning',
        policy_id: policy.id,
        message: policy.description,
        created_at: new Date().toISOString(),
      });
      break;

    case 'probation':
      await db.from('program_holders').update({
        status: 'probation',
        probation_reason: policy.description,
        probation_started_at: new Date().toISOString(),
      }).eq('id', programHolderId);
      break;

    case 'restrict_enrollments':
      await db.from('program_holders').update({
        enrollments_restricted: true,
        restriction_reason: policy.description,
        restricted_at: new Date().toISOString(),
      }).eq('id', programHolderId);
      break;

    case 'suspend_access':
      await db.from('program_holders').update({
        status: 'suspended',
        suspension_reason: policy.description,
        suspended_at: new Date().toISOString(),
      }).eq('id', programHolderId);
      await db.from('profiles').update({ suspended: true })
        .eq('program_holder_id', programHolderId);
      break;

    case 'terminate_mou':
      await db.from('program_holders').update({
        status: 'terminated',
        termination_reason: policy.description,
        terminated_at: new Date().toISOString(),
        mou_terminated: true,
      }).eq('id', programHolderId);
      await db.from('profiles').update({ suspended: true })
        .eq('program_holder_id', programHolderId);
      break;
  }

  // Send notifications
  await sendGuardrailNotifications(policy, holderName, holderEmail);

  logger.info('[guardrail-engine] enforcement applied', { action, programHolderId, policyId: policy.id });
}

async function sendGuardrailNotifications(
  policy: GuardrailPolicy,
  holderName: string,
  holderEmail: string | null,
): Promise<void> {
  const template = getEmailTemplate(policy.emailTemplate);
  const body = template.body
    .replace(/\{\{program_holder_name\}\}/g, holderName)
    .replace(/\{\{detection_date\}\}/g, new Date().toLocaleDateString())
    .replace(/\{\{violation_details\}\}/g, policy.description);

  const notifications: Promise<unknown>[] = [];

  if (policy.notifyProgramHolder && holderEmail) {
    notifications.push(
      sendEmail({
        to: holderEmail,
        subject: template.subject,
        html: `<pre style="font-family:sans-serif;white-space:pre-wrap">${body}</pre>`,
        text: body,
      }).catch((err) =>
        logger.error('[guardrail-engine] failed to notify program holder', err as Error, {
          policyId: policy.id,
          holderEmail,
        }),
      ),
    );
  }

  if (policy.notifyAdmin) {
    const adminEmail = process.env.ADMIN_ALERT_EMAIL || process.env.ADMIN_EMAIL || 'compliance@${PLATFORM_DEFAULTS.canonicalDomain}';
    notifications.push(
      sendEmail({
        to: adminEmail,
        subject: `[ADMIN ALERT] ${template.subject} — ${holderName}`,
        html: `<pre style="font-family:sans-serif;white-space:pre-wrap">${body}</pre>`,
        text: body,
      }).catch((err) =>
        logger.error('[guardrail-engine] failed to notify admin', err as Error, { policyId: policy.id }),
      ),
    );
  }

  await Promise.all(notifications);
}

// ── Main evaluator ────────────────────────────────────────────────────────────

export async function runGuardrailEvaluation(
  options: { dryRun?: boolean; severity?: 'critical' | 'major' | 'minor' | 'all' } = {},
): Promise<GuardrailRunResult> {
  const { dryRun = false, severity = 'all' } = options;
  const db = await requireAdminClient();
  const result: GuardrailRunResult = { evaluated: 0, violations: [], errors: [], dryRun };

  // Get all active program holders (include contact_email for notifications)
  const { data: holders, error } = await db
    .from('program_holders')
    .select('id, name, status, contact_email')
    .not('status', 'in', '("terminated","suspended")');

  if (error || !holders?.length) {
    logger.warn('[guardrail-engine] no active program holders found', { error });
    return result;
  }

  // Select policies to evaluate
  const policies: GuardrailPolicy[] = [];
  if (severity === 'all' || severity === 'critical') policies.push(...CRITICAL_GUARDRAILS);
  if (severity === 'all' || severity === 'major')    policies.push(...MAJOR_GUARDRAILS);
  if (severity === 'all' || severity === 'minor')    policies.push(...MINOR_GUARDRAILS);

  for (const holder of holders) {
    for (const policy of policies) {
      if (!policy.autoEnforce) continue;
      result.evaluated++;

      try {
        const value = await fetchMetric(
          policy.detectionRule.metric,
          holder.id,
          policy.detectionRule.evaluationPeriod,
        );

        const breached = evaluateRule(value, policy.detectionRule.operator, policy.detectionRule.threshold);
        if (!breached) continue;

        // Check if already enforced recently (within grace period)
        const graceMs = policy.gracePeriodHours * 60 * 60 * 1000;
        const since = new Date(Date.now() - graceMs).toISOString();
        const { count: recentCount } = await db
          .from('guardrail_enforcement_log')
          .select('*', { count: 'exact', head: true })
          .eq('program_holder_id', holder.id)
          .eq('policy_id', policy.id)
          .gte('enforced_at', since);

        if ((recentCount ?? 0) > 0) {
          result.violations.push({
            programHolderId: holder.id,
            programHolderName: holder.name,
            policy,
            metricValue: value,
            actionTaken: 'already_enforced',
            enforcedAt: new Date().toISOString(),
          });
          continue;
        }

        await applyEnforcement(
          holder.id,
          policy.enforcementAction,
          policy,
          dryRun,
          holder.name,
          (holder as any).contact_email ?? null,
        );

        result.violations.push({
          programHolderId: holder.id,
          programHolderName: holder.name,
          policy,
          metricValue: value,
          actionTaken: policy.enforcementAction,
          enforcedAt: new Date().toISOString(),
        });
      } catch (err) {
        const msg = `${holder.id}/${policy.id}: ${err instanceof Error ? err.message : String(err)}`;
        result.errors.push(msg);
        logger.error('[guardrail-engine] evaluation error', undefined, { holderId: holder.id, policyId: policy.id, err });
      }
    }
  }

  logger.info('[guardrail-engine] run complete', {
    evaluated: result.evaluated,
    violations: result.violations.length,
    errors: result.errors.length,
    dryRun,
  });

  return result;
}
