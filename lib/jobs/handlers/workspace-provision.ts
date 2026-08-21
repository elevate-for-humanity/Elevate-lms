import 'server-only';

import type { ProvisioningJob } from '@/lib/jobs/queue';
import { requireAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { provisionTrialWebsite } from '@/lib/tenant/provision-trial-website';
import { tenantPublicSiteUrl } from '@/lib/tenant/public-site-url';
import { emitPlatformEvent, PlatformEventType } from '@/lib/platform/orchestration/events';

/**
 * Async workspace provision: ensure a published website exists, mark the
 * canonical workspace active, and only then emit provisioning completion.
 */
export async function processWorkspaceProvision(job: ProvisioningJob): Promise<void> {
  const payload = job.payload as {
    workspace_id: string;
    tenant_id?: string;
    organization_id: string;
    slug: string;
    template_slug?: string;
    subscription_tier?: string;
    source_platform_event_id?: string;
    source_correlation_id?: string;
  };

  const db = await requireAdminClient();
  const { data: workspace, error: workspaceLookupError } = await db
    .from('customer_workspaces')
    .select('id, tenant_id, slug, display_name, owner_email, organization_id, trial_ends_at, status, subscription_tier, workspace_url')
    .eq('id', payload.workspace_id)
    .maybeSingle();

  if (workspaceLookupError) throw workspaceLookupError;
  if (!workspace?.id) throw new Error('Workspace not found');

  const organizationId = payload.organization_id || workspace.organization_id;
  if (!organizationId) throw new Error('Workspace has no organization');

  const { data: existingWebsite, error: existingWebsiteError } = await db
    .from('user_websites')
    .select('id,is_published,subdomain')
    .eq('organization_id', organizationId)
    .maybeSingle();
  if (existingWebsiteError) throw existingWebsiteError;

  const alreadyReady =
    workspace.status === 'active' &&
    Boolean(existingWebsite?.id) &&
    existingWebsite?.is_published !== false;

  if (!alreadyReady) {
    const { data: org, error: orgError } = await db
      .from('organizations')
      .select('name, contact_email')
      .eq('id', organizationId)
      .maybeSingle();
    if (orgError) throw orgError;

    const isPaidProvision = Boolean(payload.source_platform_event_id);
    const trialEndsAt = isPaidProvision
      ? null
      : (workspace.trial_ends_at as string | null) ??
        new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

    const website = await provisionTrialWebsite({
      organizationId,
      organizationName: org?.name ?? workspace.display_name ?? payload.slug,
      subdomain: payload.slug,
      trialEndsAt,
      contactEmail: workspace.owner_email ?? org?.contact_email ?? undefined,
      industry: 'Training Provider',
      websiteMode: 'new_site',
    });

    if (!website.ok) {
      const errResult = website as { ok: false; error: string };
      await db
        .from('customer_workspaces')
        .update({
          status: 'failed',
          provision_error: errResult.error,
          updated_at: new Date().toISOString(),
        } as Record<string, unknown>)
        .eq('id', workspace.id);
      throw new Error(errResult.error);
    }

    const publicUrl = website.publicUrl || tenantPublicSiteUrl(payload.slug);
    const metadata: Record<string, unknown> = {
      website_id: website.websiteId,
      template_slug: payload.template_slug ?? null,
      job_id: job.id,
      paid_provisioning: isPaidProvision,
    };
    if (payload.source_platform_event_id) {
      metadata.source_platform_event_id = payload.source_platform_event_id;
    }

    const { error: workspaceUpdateError } = await db
      .from('customer_workspaces')
      .update({
        status: 'active',
        workspace_url: publicUrl,
        trial_ends_at: isPaidProvision ? null : trialEndsAt,
        subscription_tier: payload.subscription_tier ?? workspace.subscription_tier,
        provision_error: null,
        provisioned_at: new Date().toISOString(),
        metadata,
        updated_at: new Date().toISOString(),
      } as Record<string, unknown>)
      .eq('id', workspace.id);
    if (workspaceUpdateError) throw workspaceUpdateError;

    logger.info('[workspace_provision] complete', {
      workspaceId: workspace.id,
      publicUrl,
      paidProvisioning: isPaidProvision,
    });
  } else {
    logger.info('[workspace_provision] resource already active and published', {
      workspaceId: workspace.id,
      websiteId: existingWebsite?.id,
    });
  }

  if (!payload.source_platform_event_id) return;

  const tenantId = payload.tenant_id || workspace.tenant_id || job.tenant_id;
  const correlationId = payload.source_correlation_id || job.correlation_id || payload.source_platform_event_id;

  const { data: existingCompletion } = await db
    .from('provisioning_events')
    .select('id')
    .eq('correlation_id', correlationId)
    .eq('step', 'platform_workspace')
    .eq('status', 'completed')
    .limit(1)
    .maybeSingle();

  if (!existingCompletion?.id) {
    const { error: provisioningEventError } = await db.from('provisioning_events').insert({
      tenant_id: tenantId ?? null,
      correlation_id: correlationId,
      step: 'platform_workspace',
      status: 'completed',
      metadata: {
        source_event_id: payload.source_platform_event_id,
        workspace_id: workspace.id,
        website_id: existingWebsite?.id ?? null,
        plan: payload.subscription_tier ?? workspace.subscription_tier ?? null,
        automated: true,
        verified_resource: true,
      },
      environment: process.env.NODE_ENV ?? 'production',
    });
    if (provisioningEventError) throw provisioningEventError;
  }

  await emitPlatformEvent(db, {
    eventType: PlatformEventType.PROVISIONING_COMPLETED,
    category: 'provisioning',
    source: 'jobs.workspace-provision',
    tenantId: tenantId ?? null,
    subjectType: 'tenant',
    subjectId: tenantId ?? workspace.id,
    correlationId,
    idempotencyKey: `provisioning-completed:${payload.source_platform_event_id}`,
    dispatch: false,
    payload: {
      kind: 'platform_workspace',
      source_event_id: payload.source_platform_event_id,
      workspace_id: workspace.id,
      verified_resource: true,
    },
  });
}
