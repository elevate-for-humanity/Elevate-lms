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

type AdminDb = Awaited<ReturnType<typeof requireAdminClient>>;

function getProvisionError(result: { ok: boolean; error?: string }, fallback: string): string {
  return result.error ?? fallback;
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function trialEndFromStart(startedAt: string): string {
  return new Date(new Date(startedAt).getTime() + TRIAL_DURATION_DAYS * 86400000).toISOString();
}

async function ensureManagedTrialLicense(params: {
  db: AdminDb;
  organizationId: string;
  trialStartedAt: string;
  trialEndsAt: string;
}): Promise<{ ok: true; status: string } | { ok: false; error: string }> {
  const { db, organizationId, trialStartedAt, trialEndsAt } = params;
  const requestedEnd = new Date(trialEndsAt);
  if (Number.isNaN(requestedEnd.getTime())) {
    return { ok: false, error: 'Trial expiration timestamp is invalid' };
  }

  const { data: existing, error: lookupError } = await db
    .from('managed_licenses')
    .select('id,status,tier,trial_started_at,trial_ends_at,expires_at')
    .eq('organization_id', organizationId)
    .maybeSingle();

  if (lookupError) {
    logger.error('[startWorkspaceTrial] managed license lookup failed', lookupError, { organizationId });
    return { ok: false, error: 'Could not verify trial license' };
  }

  const now = new Date();

  if (!existing) {
    const status = requestedEnd <= now ? 'expired' : 'active';
    const { error: insertError } = await db.from('managed_licenses').insert({
      organization_id: organizationId,
      status,
      tier: 'trial',
      plan_id: 'workspace-trial',
      trial_started_at: trialStartedAt,
      trial_ends_at: requestedEnd.toISOString(),
      expires_at: requestedEnd.toISOString(),
    });
    if (insertError) {
      logger.error('[startWorkspaceTrial] managed license insert failed', insertError, { organizationId });
      return { ok: false, error: 'Failed to create trial license' };
    }
    return { ok: true, status };
  }

  if (existing.tier !== 'trial') {
    // A paid/managed license already owns access. Never replace or downgrade it
    // merely because the user revisited the trial form.
    return { ok: true, status: existing.status };
  }

  const existingEndRaw = existing.expires_at || existing.trial_ends_at;
  const existingEnd = existingEndRaw ? new Date(existingEndRaw) : null;
  const effectiveEnd =
    existingEnd && !Number.isNaN(existingEnd.getTime()) && existingEnd < requestedEnd
      ? existingEnd
      : requestedEnd;
  const shouldExpire = effectiveEnd <= now;
  const protectedStatuses = new Set(['canceled', 'suspended', 'past_due', 'expired']);
  const nextStatus = shouldExpire
    ? 'expired'
    : protectedStatuses.has(existing.status)
      ? existing.status
      : 'active';

  const { error: updateError } = await db
    .from('managed_licenses')
    .update({
      status: nextStatus,
      trial_started_at: existing.trial_started_at || trialStartedAt,
      trial_ends_at: effectiveEnd.toISOString(),
      expires_at: effectiveEnd.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq('id', existing.id);

  if (updateError) {
    logger.error('[startWorkspaceTrial] managed license repair failed', updateError, { organizationId });
    return { ok: false, error: 'Failed to reconcile trial license' };
  }

  return { ok: true, status: nextStatus };
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

  // Trial creation is idempotent, but recovery must never extend the original
  // clock. Missing historical trial_ends_at values are deterministically derived
  // from the workspace creation timestamp and persisted through the license.
  const { data: existingWorkspace, error: existingWorkspaceError } = await db
    .from('customer_workspaces')
    .select('id, slug, workspace_url, tenant_id, organization_id, trial_ends_at, status, metadata, created_at')
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
    const trialStartedAt = existingWorkspace.created_at || new Date().toISOString();
    const trialEndsAt = existingWorkspace.trial_ends_at || trialEndFromStart(trialStartedAt);
    const license = await ensureManagedTrialLicense({
      db,
      organizationId: existingWorkspace.organization_id,
      trialStartedAt,
      trialEndsAt,
    });
    if ('error' in license) {
      return { ok: false, error: license.error, status: 500 };
    }

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
      status: license.status === 'expired' ? 'expired' : (existingWorkspace.status || 'active'),
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

  const trialStartedAt = new Date().toISOString();
  const trialEndsAt = trialEndFromStart(trialStartedAt);

  const provisioned = await provisionWorkspace({
    displayName: organizationName,
    slug,
    plan: input.plan ?? 'builder',
    contactEmail: email,
    trialEndsAt,
  });

  if (!provisioned.ok) {
    return {
      ok: false,
      error: getProvisionError(provisioned, 'Failed to provision workspace'),
      status: 500,
    };
  }

  const license = await ensureManagedTrialLicense({
    db,
    organizationId: provisioned.organizationId,
    trialStartedAt,
    trialEndsAt,
  });

  if (!license.ok || license.status !== 'active') {
    const licenseError = 'error' in license ? license.error : `Trial license is ${license.status}`;
    await db
      .from('customer_workspaces')
      .update({
        status: 'failed',
        provision_error: licenseError,
        updated_at: new Date().toISOString(),
      })
      .eq('id', provisioned.workspaceId);
    return { ok: false, error: 'Failed to provision active trial license', status: 500 };
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
    trialEndsAt,
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
    trialEndsAt,
    status: 'active',
  };
}
