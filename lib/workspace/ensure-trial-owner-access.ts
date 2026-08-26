import 'server-only';

import { requireAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { startAppTrial } from '@/lib/trial/start-app-trial';
import { hasIndividualAppAccess, syncIndividualAppSubscription } from '@/lib/apps/sync-subscription';

type AdminClient = Awaited<ReturnType<typeof requireAdminClient>>;
type AccessStage =
  | 'identity_ready'
  | 'profile_ready'
  | 'organization_access_ready'
  | 'tenant_access_ready'
  | 'entitlements_ready'
  | 'builder_ready';

export type EnsureTrialOwnerAccessInput = {
  organizationId: string;
  tenantId: string;
  workspaceId: string;
  ownerEmail: string;
  ownerName: string;
  builderUrl?: string;
  websiteMode?: 'new' | 'existing';
  existingUrl?: string | null;
  programs?: string | null;
  reference: string;
  source: 'managed_trial' | 'demo_conversion' | 'guided_setup';
  db?: AdminClient;
};

export type EnsureTrialOwnerAccessResult =
  | { ok: true; userId: string; loginUrl: string; builderUrl: string }
  | { ok: false; error: string; stage: AccessStage };

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

async function recordStage(
  db: AdminClient,
  workspaceId: string,
  stage: AccessStage,
  source: EnsureTrialOwnerAccessInput['source'],
  reference: string,
  error?: string,
) {
  const { data: workspace } = await db
    .from('customer_workspaces')
    .select('metadata')
    .eq('id', workspaceId)
    .maybeSingle();
  const metadata = asObject(workspace?.metadata);
  const onboarding = asObject(metadata.onboarding);
  const stages = asObject(onboarding.stages);
  await db.from('customer_workspaces').update({
    metadata: {
      ...metadata,
      onboarding: {
        ...onboarding,
        source,
        reference,
        last_stage: stage,
        last_error: error ?? null,
        updated_at: new Date().toISOString(),
        stages: {
          ...stages,
          [stage]: {
            status: error ? 'failed' : 'ready',
            at: new Date().toISOString(),
            ...(error ? { error } : {}),
          },
        },
      },
    },
    updated_at: new Date().toISOString(),
  }).eq('id', workspaceId);
}

export async function ensureTrialOwnerAccess(
  input: EnsureTrialOwnerAccessInput,
): Promise<EnsureTrialOwnerAccessResult> {
  const db = input.db ?? (await requireAdminClient());
  const ownerEmail = input.ownerEmail.trim().toLowerCase();
  const ownerName = input.ownerName.trim();
  const builderUrl = input.builderUrl || '/apps/website-builder';

  const fail = async (stage: AccessStage, error: string, cause?: unknown): Promise<EnsureTrialOwnerAccessResult> => {
    logger.error('[trial-owner-access] provisioning stage failed', cause instanceof Error ? cause : undefined, {
      workspaceId: input.workspaceId,
      tenantId: input.tenantId,
      organizationId: input.organizationId,
      ownerEmail,
      stage,
      reference: input.reference,
      error,
    });
    await recordStage(db, input.workspaceId, stage, input.source, input.reference, error).catch(() => {});
    return { ok: false, stage, error };
  };

  const generated = await db.auth.admin.generateLink({
    type: 'magiclink',
    email: ownerEmail,
    options: {
      redirectTo: builderUrl,
      data: { full_name: ownerName, role: 'org_admin', organization_id: input.organizationId, tenant_id: input.tenantId },
    },
  });
  if (generated.error || !generated.data?.user?.id) {
    return fail('identity_ready', 'Administrator sign-in could not be provisioned.', generated.error ?? undefined);
  }
  const authUser = generated.data.user;
  await recordStage(db, input.workspaceId, 'identity_ready', input.source, input.reference).catch(() => {});

  const { data: existingProfile, error: profileLookupError } = await db.from('profiles')
    .select('id, email, full_name, role, organization_id, tenant_id')
    .eq('id', authUser.id)
    .maybeSingle();
  if (profileLookupError) return fail('profile_ready', 'Administrator profile could not be checked.', profileLookupError);

  const profilePayload = existingProfile
    ? { id: authUser.id, email: ownerEmail, full_name: ownerName, role: existingProfile.role ?? 'org_admin', organization_id: existingProfile.organization_id ?? input.organizationId, tenant_id: existingProfile.tenant_id ?? input.tenantId }
    : { id: authUser.id, email: ownerEmail, full_name: ownerName, role: 'org_admin', organization_id: input.organizationId, tenant_id: input.tenantId };
  const { error: profileError } = await db.from('profiles').upsert(profilePayload, { onConflict: 'id' });
  if (profileError) return fail('profile_ready', 'Administrator profile could not be linked.', profileError);
  await recordStage(db, input.workspaceId, 'profile_ready', input.source, input.reference).catch(() => {});

  const { error: orgMembershipError } = await db.from('organization_users').upsert(
    { organization_id: input.organizationId, user_id: authUser.id, role: 'org_owner', status: 'active' },
    { onConflict: 'organization_id,user_id' },
  );
  if (orgMembershipError) return fail('organization_access_ready', 'Organization access could not be provisioned.', orgMembershipError);
  await recordStage(db, input.workspaceId, 'organization_access_ready', input.source, input.reference).catch(() => {});

  const { error: tenantMembershipError } = await db.from('tenant_memberships').upsert(
    { tenant_id: input.tenantId, user_id: authUser.id, role: 'owner' },
    { onConflict: 'tenant_id,user_id' },
  );
  if (tenantMembershipError) return fail('tenant_access_ready', 'Tenant access could not be provisioned.', tenantMembershipError);
  await recordStage(db, input.workspaceId, 'tenant_access_ready', input.source, input.reference).catch(() => {});

  const builderTrial = await startAppTrial(authUser.id, 'website-builder', db);
  if (builderTrial.status === 'error') return fail('entitlements_ready', 'Website Builder access could not be provisioned.');

  const effectiveSubscription = await syncIndividualAppSubscription(authUser.id, 'website-builder', db);
  if (!hasIndividualAppAccess(effectiveSubscription)) {
    const reason = effectiveSubscription?.access_reason === 'trial_expired'
      ? 'Website Builder trial has expired. Choose a paid plan to continue.'
      : 'Website Builder access is not active.';
    return fail('entitlements_ready', reason);
  }
  await recordStage(db, input.workspaceId, 'entitlements_ready', input.source, input.reference).catch(() => {});

  const { data: website, error: websiteLookupError } = await db.from('user_websites')
    .select('id, site_config')
    .eq('organization_id', input.organizationId)
    .maybeSingle();
  if (websiteLookupError) return fail('builder_ready', 'Website Builder workspace could not be checked.', websiteLookupError);

  if (website?.id) {
    const currentConfig = asObject(website.site_config);
    const currentMeta = asObject(currentConfig.meta);
    const updatedConfig = {
      ...currentConfig,
      meta: {
        ...currentMeta,
        parisInterviewCompleted: currentMeta.parisInterviewCompleted === true,
        connectionMode: input.websiteMode ?? currentMeta.connectionMode ?? 'new',
        sourceWebsiteUrl: input.existingUrl ?? currentMeta.sourceWebsiteUrl ?? null,
        programsIntake: input.programs ?? currentMeta.programsIntake ?? null,
        trialReference: input.reference,
        onboardingSource: input.source,
      },
    };
    const { error: websiteUpdateError } = await db.from('user_websites').update({
      user_id: authUser.id,
      site_config: updatedConfig,
      is_published: false,
      status: 'draft',
      updated_at: new Date().toISOString(),
    }).eq('id', website.id);
    if (websiteUpdateError) return fail('builder_ready', 'Website Builder ownership could not be linked.', websiteUpdateError);
  }
  await recordStage(db, input.workspaceId, 'builder_ready', input.source, input.reference).catch(() => {});

  // Generate the customer-facing credential link only after all workspace provisioning is
  // complete. This prevents most of the one-time token lifetime from being
  // consumed by workspace setup and sends every new owner through password
  // creation before the builder opens.
  const passwordRedirect = `https://www.elevateforhumanity.org/auth/set-password?redirect=${encodeURIComponent(builderUrl)}`;
  const passwordLink = await db.auth.admin.generateLink({
    type: 'recovery',
    email: ownerEmail,
    options: { redirectTo: passwordRedirect },
  });
  if (passwordLink.error || !passwordLink.data?.properties?.action_link) {
    return fail('builder_ready', 'Password setup link could not be created.', passwordLink.error ?? undefined);
  }

  return {
    ok: true,
    userId: authUser.id,
    loginUrl: passwordLink.data.properties.action_link,
    builderUrl,
  };
}
