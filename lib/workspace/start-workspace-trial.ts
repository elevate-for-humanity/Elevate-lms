import 'server-only';

import { requireAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { provisionWorkspace } from '@/lib/workspace/provision-workspace';
import { provisionTrialWebsite } from '@/lib/tenant/provision-trial-website';
import { tenantAdminUrl } from '@/lib/tenant/public-site-url';
import { slugifyWorkspaceName, ensureUniqueSlugCandidate } from '@/lib/workspace/slug';
import { TRIAL_DURATION_DAYS } from '@/lib/workspace/tier-limits';

export type StartWorkspaceTrialInput = {
  organizationName: string;
  ownerEmail: string;
  ownerName?: string;
  industry?: string;
  plan?: string;
  websiteMode?: 'new_site' | 'existing_site' | 'api_embed';
};

export type StartWorkspaceTrialResult =
  | {
      ok: true;
      workspaceId: string;
      tenantId: string;
      organizationId: string;
      slug: string;
      workspaceUrl: string;
      publicPreviewUrl: string;
      dashboardUrl: string;
      trialEndsAt: string;
      status: string;
      recovered?: boolean;
    }
  | { ok: false; error: string; status?: number };

function getProvisionError(result: { ok: boolean; error?: string }, fallback: string): string {
  return result.error ?? fallback;
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function startWorkspaceTrial(
  input: StartWorkspaceTrialInput,
): Promise<StartWorkspaceTrialResult> {
  const organizationName = input.organizationName?.trim();
  const email = input.ownerEmail?.trim().toLowerCase();

  if (!organizationName || organizationName.length < 2 || organizationName.length > 100) {
    return { ok: false, error: 'Organization name must be 2–100 characters', status: 400 };
  }

  if (!email || !validateEmail(email)) {
    return { ok: false, error: 'Valid email is required', status: 400 };
  }

  const db = await requireAdminClient();

  // Trial creation is intentionally idempotent. A user who refreshes, retries
  // after a network failure, or returns to the trial form must recover the
  // workspace that was already created instead of receiving a dead-end 409.
  const { data: existingWorkspace, error: existingWorkspaceError } = await db
    .from('customer_workspaces')
    .select('id, slug, workspace_url, tenant_id, organization_id, trial_ends_at, status, metadata')
    .eq('owner_email', email)
    .in('status', ['pending', 'provisioning', 'active'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingWorkspaceError) {
    logger.error('[startWorkspaceTrial] existing workspace lookup failed', existingWorkspaceError, { email });
    return { ok: false, error: 'Could not check for an existing workspace', status: 500 };
  }

  if (
    existingWorkspace?.id &&
    existingWorkspace.slug &&
    existingWorkspace.tenant_id &&
    existingWorkspace.organization_id
  ) {
    const metadata = existingWorkspace.metadata && typeof existingWorkspace.metadata === 'object'
      ? (existingWorkspace.metadata as Record<string, unknown>)
      : {};
    const publicPreviewUrl =
      (typeof metadata.public_preview_url === 'string' && metadata.public_preview_url) ||
      existingWorkspace.workspace_url ||
      `https://${existingWorkspace.slug}.app.elevateforhumanity.org`;
    const trialEndsAt =
      existingWorkspace.trial_ends_at ||
      new Date(Date.now() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000).toISOString();

    return {
      ok: true,
      workspaceId: existingWorkspace.id,
      tenantId: existingWorkspace.tenant_id,
      organizationId: existingWorkspace.organization_id,
      slug: existingWorkspace.slug,
      workspaceUrl: publicPreviewUrl,
      publicPreviewUrl,
      dashboardUrl: tenantAdminUrl(existingWorkspace.slug, '/admin'),
      trialEndsAt,
      status: existingWorkspace.status || 'active',
      recovered: true,
    };
  }

  let slug = slugifyWorkspaceName(organizationName);
  const { data: slugRow } = await db
    .from('customer_workspaces')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();

  if (slugRow?.id) {
    slug = ensureUniqueSlugCandidate(slug, true);
  }

  const { data: orgSlugTaken } = await db
    .from('organizations')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();

  if (orgSlugTaken?.id) {
    slug = ensureUniqueSlugCandidate(slug, true);
  }

  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DURATION_DAYS);

  const provisioned = await provisionWorkspace({
    displayName: organizationName,
    slug,
    plan: input.plan ?? 'builder',
    contactEmail: email,
    trialEndsAt: trialEndsAt.toISOString(),
  });

  if (!provisioned.ok) {
    return {
      ok: false,
      error: getProvisionError(provisioned, 'Failed to provision workspace'),
      status: 500,
    };
  }

  const { error: licenseError } = await db.from('managed_licenses').insert({
    organization_id: provisioned.organizationId,
    status: 'active',
    tier: 'trial',
    plan_id: 'workspace-trial',
    trial_started_at: new Date().toISOString(),
    trial_ends_at: trialEndsAt.toISOString(),
    expires_at: trialEndsAt.toISOString(),
  });

  if (licenseError) {
    logger.error('[startWorkspaceTrial] managed_licenses insert failed', licenseError);
  }

  if (input.ownerName?.trim()) {
    await db
      .from('organizations')
      .update({ contact_name: input.ownerName.trim() } as Record<string, unknown>)
      .eq('id', provisioned.organizationId)
      .then(() => {}, () => {});
  }

  const website = await provisionTrialWebsite({
    organizationId: provisioned.organizationId,
    organizationName,
    subdomain: slug,
    trialEndsAt: trialEndsAt.toISOString(),
    contactEmail: email,
    industry: input.industry?.trim() || 'Training Provider',
    websiteMode: input.websiteMode ?? 'new_site',
  });

  if (!website.ok) {
    const websiteError = getProvisionError(website, 'Failed to provision trial website');
    logger.error('[startWorkspaceTrial] website provision failed', new Error(websiteError));
    await db
      .from('customer_workspaces')
      .update({
        status: 'failed',
        provision_error: websiteError,
        updated_at: new Date().toISOString(),
      } as Record<string, unknown>)
      .eq('id', provisioned.workspaceId);

    return { ok: false, error: 'Failed to provision trial website', status: 500 };
  }

  await db
    .from('customer_workspaces')
    .update({
      status: 'active',
      provisioned_at: new Date().toISOString(),
      workspace_url: website.publicUrl,
      metadata: {
        website_id: website.websiteId,
        public_preview_url: website.publicUrl,
        industry: input.industry ?? null,
      },
      updated_at: new Date().toISOString(),
    } as Record<string, unknown>)
    .eq('id', provisioned.workspaceId);

  const dashboardUrl = tenantAdminUrl(slug, '/admin');

  return {
    ok: true,
    workspaceId: provisioned.workspaceId,
    tenantId: provisioned.tenantId,
    organizationId: provisioned.organizationId,
    slug,
    workspaceUrl: website.publicUrl,
    publicPreviewUrl: website.publicUrl,
    dashboardUrl,
    trialEndsAt: trialEndsAt.toISOString(),
    status: 'active',
  };
}
