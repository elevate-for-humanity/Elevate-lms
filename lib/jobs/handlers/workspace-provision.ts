import 'server-only';

import type { ProvisioningJob } from '@/lib/jobs/queue';
import { requireAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { provisionTrialWebsite } from '@/lib/tenant/provision-trial-website';
import { tenantPublicSiteUrl } from '@/lib/tenant/public-site-url';

/**
 * Async workspace provision: ensure published trial website + mark workspace active.
 */
export async function processWorkspaceProvision(job: ProvisioningJob): Promise<void> {
  const payload = job.payload as {
    workspace_id: string;
    organization_id: string;
    slug: string;
    template_slug?: string;
  };

  const db = await requireAdminClient();
  const { data: workspace } = await db
    .from('customer_workspaces')
    .select('id, slug, display_name, owner_email, organization_id, trial_ends_at, status')
    .eq('id', payload.workspace_id)
    .maybeSingle();

  if (!workspace?.id) {
    throw new Error('Workspace not found');
  }

  if (workspace.status === 'active') {
    logger.info('[workspace_provision] already active', { workspaceId: workspace.id });
    return;
  }

  const { data: org } = await db
    .from('organizations')
    .select('name, contact_email')
    .eq('id', payload.organization_id)
    .maybeSingle();

  const trialEndsAt =
    (workspace.trial_ends_at as string | null) ??
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

  const website = await provisionTrialWebsite({
    organizationId: payload.organization_id,
    organizationName: org?.name ?? workspace.display_name ?? payload.slug,
    subdomain: payload.slug,
    trialEndsAt,
    contactEmail: workspace.owner_email ?? org?.contact_email ?? undefined,
    industry: 'Training Provider',
    websiteMode: 'new_site',
  });

  if (!website.ok) {
    await db
      .from('customer_workspaces')
      .update({
        status: 'failed',
        provision_error: website.error,
        updated_at: new Date().toISOString(),
      } as Record<string, unknown>)
      .eq('id', workspace.id);
    throw new Error(website.error);
  }

  const publicUrl = website.publicUrl || tenantPublicSiteUrl(payload.slug);

  await db
    .from('customer_workspaces')
    .update({
      status: 'active',
      workspace_url: publicUrl,
      provisioned_at: new Date().toISOString(),
      metadata: {
        website_id: website.websiteId,
        template_slug: payload.template_slug ?? null,
        job_id: job.id,
      },
      updated_at: new Date().toISOString(),
    } as Record<string, unknown>)
    .eq('id', workspace.id);

  logger.info('[workspace_provision] complete', {
    workspaceId: workspace.id,
    publicUrl,
  });
}
