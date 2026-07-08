import 'server-only';

import { requireAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { fetchPlatformOwnerTenantId } from '@/lib/platform/platform-owner';
import { enqueueJob } from '@/lib/jobs/queue';
import { normalizeWorkspaceTier, type WorkspaceSubscriptionTier } from '@/lib/workspace/tier-limits';

export type ProvisionWorkspaceParams = {
  displayName: string;
  slug: string;
  plan?: string;
  subscriptionTier?: WorkspaceSubscriptionTier;
  templateSlug?: string;
  provisionedByUserId?: string | null;
  contactEmail?: string;
  trialEndsAt?: string;
};

export type ProvisionWorkspaceResult =
  | {
      ok: true;
      workspaceId: string;
      tenantId: string;
      organizationId: string;
      status: 'pending' | 'provisioning' | 'active';
      workspaceUrl: string;
      publicPreviewUrl: string;
      subscriptionTier: WorkspaceSubscriptionTier;
    }
  | { ok: false; error: string };

export function workspacePublicUrl(slug: string): string {
  const devCloudHost = process.env.ELEVATE_DEV_CLOUD_HOST?.trim();
  if (devCloudHost) {
    return `https://${slug}.${devCloudHost}`;
  }
  return `https://${slug}.app.elevateforhumanity.org`;
}

/**
 * Phase 1: customer tenant + organization + customer_workspaces row + trial license.
 * Phase 2 (async job): GitHub fork, Northflank service, custom domain, deploy.
 */
export async function provisionWorkspace(
  params: ProvisionWorkspaceParams,
): Promise<ProvisionWorkspaceResult> {
  const db = await requireAdminClient();

  const slug = params.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
  if (!slug || slug.length < 2) {
    return { ok: false, error: 'Invalid workspace slug' };
  }

  const ownerTenantId = await fetchPlatformOwnerTenantId();
  if (!ownerTenantId) {
    return { ok: false, error: 'Platform owner tenant is not configured' };
  }

  const subscriptionTier =
    params.subscriptionTier ?? normalizeWorkspaceTier(params.plan);
  const templateSlug = params.templateSlug ?? 'workforce-platform-v1';
  const workspaceUrl = workspacePublicUrl(slug);
  const publicPreviewUrl = workspaceUrl;

  const { data: existing } = await db
    .from('customer_workspaces')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();

  if (existing?.id) {
    return { ok: false, error: 'Workspace slug already exists' };
  }

  const { data: tenant, error: tenantError } = await db
    .from('tenants')
    .insert({
      name: params.displayName,
      slug,
      status: 'active',
      type: 'customer',
      is_platform_owner: false,
      parent_tenant_id: ownerTenantId,
    } as Record<string, unknown>)
    .select('id')
    .maybeSingle();

  if (tenantError || !tenant?.id) {
    logger.error('[provisionWorkspace] tenant insert failed', tenantError);
    return { ok: false, error: 'Failed to create customer tenant' };
  }

  const orgInsert: Record<string, unknown> = {
    name: params.displayName,
    slug,
    type: 'training_provider',
    status: 'active',
    tenant_id: tenant.id,
    contact_email: params.contactEmail ?? null,
    domain: `${slug}.app.elevateforhumanity.org`,
  };

  const { data: org, error: orgError } = await db
    .from('organizations')
    .insert(orgInsert)
    .select('id')
    .maybeSingle();

  if (orgError || !org?.id) {
    await db.from('tenants').delete().eq('id', tenant.id);
    logger.error('[provisionWorkspace] organization insert failed', orgError);
    return { ok: false, error: 'Failed to create organization' };
  }

  const { data: workspace, error: workspaceError } = await db
    .from('customer_workspaces')
    .insert({
      tenant_id: tenant.id,
      organization_id: org.id,
      slug,
      display_name: params.displayName,
      owner_email: params.contactEmail ?? null,
      subscription_tier: subscriptionTier,
      template_slug: templateSlug,
      status: 'provisioning',
      workspace_url: workspaceUrl,
      trial_ends_at: params.trialEndsAt ?? null,
      provisioned_by: params.provisionedByUserId ?? null,
      metadata: {
        contact_email: params.contactEmail ?? null,
        phase: 1,
      },
    } as Record<string, unknown>)
    .select('id')
    .maybeSingle();

  if (workspaceError || !workspace?.id) {
    await db.from('organizations').delete().eq('id', org.id);
    await db.from('tenants').delete().eq('id', tenant.id);
    logger.error('[provisionWorkspace] customer_workspaces insert failed', workspaceError);
    return { ok: false, error: 'Failed to create workspace record' };
  }

  try {
    await enqueueJob({
      jobType: 'workspace_provision',
      correlationId: `workspace:${workspace.id}`,
      tenantId: tenant.id,
      payload: {
        workspace_id: workspace.id,
        tenant_id: tenant.id,
        organization_id: org.id,
        slug,
        template_slug: templateSlug,
        subscription_tier: subscriptionTier,
      },
    });
  } catch (err) {
    logger.warn('[provisionWorkspace] job enqueue failed — workspace row created', {
      workspaceId: workspace.id,
      err,
    });
  }

  logger.info('[provisionWorkspace] workspace created', {
    workspaceId: workspace.id,
    tenantId: tenant.id,
    slug,
  });

  return {
    ok: true,
    workspaceId: workspace.id,
    tenantId: tenant.id,
    organizationId: org.id,
    status: 'provisioning',
    workspaceUrl,
    publicPreviewUrl,
    subscriptionTier,
  };
}
