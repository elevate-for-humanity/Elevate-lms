import 'server-only';

import { requireAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { enqueueJob } from '@/lib/jobs/queue';
import { normalizeWorkspaceTier } from '@/lib/workspace/tier-limits';
import { executeWorkflow } from '@/lib/workflows/engine';
import { getOrganizationFeatures } from '@/lib/platform/organization-features';
import { emitPlatformEvent, PlatformEventType } from '@/lib/platform/orchestration/events';

type PlatformEventRow = {
  id: string;
  event_type: string;
  category: string;
  severity: string;
  source?: string | null;
  actor_id?: string | null;
  actor_type?: string | null;
  subject_id?: string | null;
  subject_type?: string | null;
  tenant_id?: string | null;
  correlation_id?: string | null;
  idempotency_key?: string | null;
  payload?: Record<string, unknown> | null;
  message?: string | null;
  attempts?: number | null;
  created_at?: string | null;
};

type WorkflowTriggerRow = {
  id: string;
  workflow_id: string;
  event_filter?: Record<string, unknown> | null;
};

export interface OrchestrationProcessResult {
  claimed: number;
  processed: number;
  failed: number;
  workflowRuns: number;
  eventIds: string[];
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function matchesFilterValue(actual: string | null | undefined, expected: unknown): boolean {
  if (expected === undefined || expected === null || expected === '') return true;
  if (Array.isArray(expected)) return expected.map(String).includes(String(actual ?? ''));
  return String(actual ?? '') === String(expected);
}

function triggerMatches(event: PlatformEventRow, trigger: WorkflowTriggerRow): boolean {
  const filter = trigger.event_filter ?? {};
  return (
    matchesFilterValue(event.event_type, filter.event_type) &&
    matchesFilterValue(event.category, filter.category) &&
    matchesFilterValue(event.subject_type, filter.subject_type) &&
    matchesFilterValue(event.source, filter.source)
  );
}

async function hydrateEventContext(
  db: Awaited<ReturnType<typeof requireAdminClient>>,
  event: PlatformEventRow,
): Promise<Record<string, unknown>> {
  const base: Record<string, unknown> = {
    event_id: event.id,
    event_type: event.event_type,
    category: event.category,
    source: event.source ?? null,
    actor_id: event.actor_id ?? null,
    subject_id: event.subject_id ?? null,
    subject_type: event.subject_type ?? null,
    tenant_id: event.tenant_id ?? null,
    correlation_id: event.correlation_id ?? event.id,
    payload: event.payload ?? {},
  };

  if (!event.subject_id || !event.subject_type) return base;

  if (event.subject_type === 'application' || event.subject_type === 'host_shop_application') {
    const table = event.subject_type === 'application' ? 'applications' : 'host_shop_applications';
    const fields = event.subject_type === 'application'
      ? 'id,user_id,first_name,last_name,email,phone,status,program_id,program_slug,program_interest,reference_number,source,funding_source,funding_type'
      : 'id,shop_name,business_name,owner_name,email,contact_email,phone,status,course_slug,approved_at,stripe_session_id';
    const { data } = await db.from(table).select(fields).eq('id', event.subject_id).maybeSingle();
    const record = asRecord(data);
    if (record) return { ...base, ...record, record };
  }

  if (event.subject_type === 'program_enrollment') {
    const { data } = await db
      .from('program_enrollments')
      .select('id,user_id,student_id,email,full_name,phone,status,enrollment_state,program_id,program_slug,course_id,tenant_id,host_shop_id,orientation_completed_at,funding_source,next_required_action')
      .eq('id', event.subject_id)
      .maybeSingle();
    const record = asRecord(data);
    if (record) return { ...base, ...record, record };
  }

  if (event.subject_type === 'certificate') {
    const { data } = await db
      .from('certificates')
      .select('id,user_id,student_id,student_email,student_name,course_id,course_title,course_name,program_id,program_name,enrollment_id,certificate_number,verification_url,certificate_url,tenant_id,status,issued_at')
      .eq('id', event.subject_id)
      .maybeSingle();
    const record = asRecord(data);
    if (record) return { ...base, ...record, record };
  }

  if (event.subject_type === 'exam_session') {
    const { data } = await db
      .from('exam_sessions')
      .select('id,tenant_id,student_id,student_name,student_email,provider,exam_name,exam_code,status,program_slug,is_retest,created_at')
      .eq('id', event.subject_id)
      .maybeSingle();
    const record = asRecord(data);
    if (record) return { ...base, ...record, record };
  }

  if (event.subject_type === 'individual_app') {
    const appSlug = event.subject_id;
    const userId = event.actor_id;
    if (userId) {
      const { data } = await db
        .from('user_app_subscriptions')
        .select('id,user_id,app_slug,plan,status,trial_ends_at,current_period_end,stripe_subscription_id,stripe_customer_id')
        .eq('user_id', userId)
        .eq('app_slug', appSlug)
        .maybeSingle();
      const record = asRecord(data);
      if (record) return { ...base, ...record, record };
    }
  }

  if (event.subject_type === 'tenant') {
    const entitlements = await getOrganizationFeatures(event.subject_id, db);
    return { ...base, entitlements };
  }

  return base;
}

async function ensurePlatformWorkspaceProvisioned(
  db: Awaited<ReturnType<typeof requireAdminClient>>,
  event: PlatformEventRow,
  payload: Record<string, unknown>,
): Promise<boolean> {
  const tenantId = event.subject_id || event.tenant_id;
  if (!tenantId) throw new Error('Platform workspace provisioning requires a tenant');

  const { data: workspace, error: workspaceError } = await db
    .from('customer_workspaces')
    .select('id,tenant_id,organization_id,slug,status,template_slug,workspace_url')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (workspaceError) throw workspaceError;
  if (!workspace?.id || !workspace.organization_id || !workspace.slug) {
    throw new Error(`Cannot provision tenant ${tenantId}: canonical customer workspace is missing`);
  }

  const planSlug = String(payload.plan_slug ?? payload.plan ?? 'professional');
  const subscriptionTier = normalizeWorkspaceTier(planSlug);
  const now = new Date().toISOString();
  const { error: updateError } = await db
    .from('customer_workspaces')
    .update({
      subscription_tier: subscriptionTier,
      trial_ends_at: null,
      provision_error: null,
      updated_at: now,
    } as Record<string, unknown>)
    .eq('id', workspace.id);
  if (updateError) throw updateError;

  const { data: website, error: websiteError } = await db
    .from('user_websites')
    .select('id,is_published')
    .eq('organization_id', workspace.organization_id)
    .maybeSingle();
  if (websiteError) throw websiteError;

  const ready = workspace.status === 'active' && Boolean(website?.id) && website?.is_published !== false;
  if (ready) return true;

  await enqueueJob({
    jobType: 'workspace_provision',
    correlationId: `platform-workspace:${workspace.id}`,
    stripeEventId: event.id,
    tenantId,
    payload: {
      workspace_id: workspace.id,
      tenant_id: tenantId,
      organization_id: workspace.organization_id,
      slug: workspace.slug,
      template_slug: workspace.template_slug ?? 'workforce-platform-v1',
      subscription_tier: subscriptionTier,
      source_platform_event_id: event.id,
      source_correlation_id: event.correlation_id ?? event.id,
    },
  });

  logger.info('[orchestration] platform workspace provisioning queued', {
    tenantId,
    workspaceId: workspace.id,
    planSlug,
    subscriptionTier,
  });
  return false;
}

async function handleProvisioningRequested(
  db: Awaited<ReturnType<typeof requireAdminClient>>,
  event: PlatformEventRow,
  context: Record<string, unknown>,
): Promise<void> {
  const payload = event.payload ?? {};
  const kind = String(payload.kind ?? 'workspace');

  if (event.subject_type === 'individual_app') {
    const status = String(context.status ?? '');
    if (!['active', 'trial'].includes(status)) {
      throw new Error(`Cannot provision ${event.subject_id}: subscription status is ${status || 'missing'}`);
    }
  }

  if (event.subject_type === 'tenant' && event.subject_id) {
    const entitlements = await getOrganizationFeatures(event.subject_id, db);
    if (!entitlements.features.length) {
      throw new Error(`Cannot provision tenant ${event.subject_id}: no active entitlements`);
    }

    if (kind === 'platform_workspace') {
      const ready = await ensurePlatformWorkspaceProvisioned(db, event, payload);
      // Do not claim provisioning is complete while an async workspace job is
      // still creating the actual site/workspace. The workspace job emits the
      // completion event when the resource is real and published.
      if (!ready) return;
    }
  }

  const { error } = await db.from('provisioning_events').insert({
    tenant_id: event.tenant_id ?? (event.subject_type === 'tenant' ? event.subject_id : null),
    correlation_id: event.correlation_id ?? event.id,
    step: kind,
    status: 'completed',
    metadata: {
      source_event_id: event.id,
      subject_type: event.subject_type,
      subject_id: event.subject_id,
      app_slug: payload.app_slug ?? null,
      plan: payload.plan ?? payload.plan_slug ?? null,
      automated: true,
      verified_resource: true,
    },
    environment: process.env.NODE_ENV ?? 'production',
  });
  if (error) throw error;

  await emitPlatformEvent(db, {
    eventType: PlatformEventType.PROVISIONING_COMPLETED,
    category: 'provisioning',
    source: 'platform.orchestration.dispatcher',
    actorId: event.actor_id ?? null,
    actorType: event.actor_type ?? 'system',
    tenantId: event.tenant_id ?? null,
    subjectType: event.subject_type ?? 'workspace',
    subjectId: event.subject_id ?? event.id,
    correlationId: event.correlation_id ?? event.id,
    idempotencyKey: `provisioning-completed:${event.id}`,
    dispatch: false,
    payload: { kind, source_event_id: event.id, verified_resource: true },
  });
}

async function runCoreOrchestration(
  db: Awaited<ReturnType<typeof requireAdminClient>>,
  event: PlatformEventRow,
  context: Record<string, unknown>,
): Promise<void> {
  if (event.event_type === PlatformEventType.PROVISIONING_REQUESTED) {
    await handleProvisioningRequested(db, event, context);
  }
}

async function runMatchingWorkflows(
  db: Awaited<ReturnType<typeof requireAdminClient>>,
  event: PlatformEventRow,
  context: Record<string, unknown>,
): Promise<number> {
  const { data: triggers, error: triggerError } = await db
    .from('workflow_triggers')
    .select('id,workflow_id,event_filter')
    .eq('trigger_type', 'event')
    .eq('enabled', true);
  if (triggerError) throw triggerError;

  const matching = (triggers ?? []).filter((row) => triggerMatches(event, row as WorkflowTriggerRow));
  if (!matching.length) return 0;

  const workflowIds = [...new Set(matching.map((row) => row.workflow_id))];
  const { data: workflows, error: workflowError } = await db
    .from('workflows')
    .select('id,status,tenant_id')
    .in('id', workflowIds);
  if (workflowError) throw workflowError;

  const activeIds = new Set(
    (workflows ?? [])
      .filter((workflow) => workflow.status === 'active' && (!workflow.tenant_id || !event.tenant_id || workflow.tenant_id === event.tenant_id))
      .map((workflow) => workflow.id),
  );

  let runs = 0;
  for (const trigger of matching) {
    if (!activeIds.has(trigger.workflow_id)) continue;

    const { data: existingRun } = await db
      .from('workflow_runs')
      .select('id,status')
      .eq('platform_event_id', event.id)
      .eq('workflow_id', trigger.workflow_id)
      .maybeSingle();
    if (existingRun) continue;

    const result = await executeWorkflow(
      trigger.workflow_id,
      'event',
      context,
      trigger.id,
      event.correlation_id ?? event.id,
      event.tenant_id ?? undefined,
    );

    if (result.runId) {
      const { error: updateError } = await db
        .from('workflow_runs')
        .update({ platform_event_id: event.id })
        .eq('id', result.runId);
      if (updateError) throw updateError;
      runs++;
    }

    if (result.status === 'failed') {
      throw new Error(result.error || `Workflow ${trigger.workflow_id} failed`);
    }
  }

  return runs;
}

async function markProcessed(db: Awaited<ReturnType<typeof requireAdminClient>>, eventId: string) {
  const { error } = await db
    .from('platform_events')
    .update({ processing_status: 'processed', processed_at: new Date().toISOString(), resolved: true, locked_at: null, last_error: null })
    .eq('id', eventId);
  if (error) throw error;
}

async function markFailed(
  db: Awaited<ReturnType<typeof requireAdminClient>>,
  event: PlatformEventRow,
  errorMessage: string,
) {
  const attempts = Math.max(1, Number(event.attempts ?? 1));
  const retryMinutes = Math.min(60, 2 ** Math.max(0, attempts - 1));
  const retryAt = new Date(Date.now() + retryMinutes * 60_000).toISOString();
  const { error } = await db
    .from('platform_events')
    .update({ processing_status: 'failed', available_at: retryAt, locked_at: null, last_error: errorMessage.slice(0, 4000), resolved: false })
    .eq('id', event.id);
  if (error) logger.error('[orchestration] failed to persist event failure', error instanceof Error ? error : undefined, { eventId: event.id });
}

export async function processPendingPlatformEvents(limit = 20): Promise<OrchestrationProcessResult> {
  const db = await requireAdminClient();
  const boundedLimit = Math.max(1, Math.min(limit, 100));
  const { data: claimed, error } = await db.rpc('claim_platform_events_v1', { p_limit: boundedLimit });
  if (error) throw error;

  const events = (claimed ?? []) as PlatformEventRow[];
  const result: OrchestrationProcessResult = {
    claimed: events.length,
    processed: 0,
    failed: 0,
    workflowRuns: 0,
    eventIds: events.map((event) => event.id),
  };

  for (const event of events) {
    try {
      const context = await hydrateEventContext(db, event);
      await runCoreOrchestration(db, event, context);
      result.workflowRuns += await runMatchingWorkflows(db, event, context);
      await markProcessed(db, event.id);
      result.processed++;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('[orchestration] event processing failed', error instanceof Error ? error : undefined, {
        eventId: event.id,
        eventType: event.event_type,
        attempts: event.attempts,
      });
      await markFailed(db, event, message);
      result.failed++;
    }
  }

  return result;
}
