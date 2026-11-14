import 'server-only';

import { requireAdminClient } from '@/lib/supabase/admin';

async function hasBillingOrganization(
  db: Awaited<ReturnType<typeof requireAdminClient>>,
  tenantId: string,
): Promise<boolean> {
  const { data } = await db
    .from('organizations')
    .select('id')
    .eq('tenant_id', tenantId)
    .limit(1)
    .maybeSingle();
  return Boolean(data?.id);
}

/**
 * Resolve the Store/SaaS tenant for feature gates and billing.
 *
 * Profile pointers remain the canonical fast path. Store ownership records are
 * the fallback because an account can administer the standalone Elevate
 * platform while separately owning a subscribed Store workspace.
 */
export async function resolveTenantIdForUser(userId: string): Promise<string | null> {
  const db = await requireAdminClient();
  const { data: profile } = await db
    .from('profiles')
    .select('tenant_id, organization_id')
    .eq('id', userId)
    .maybeSingle();

  if (profile?.tenant_id) return profile.tenant_id as string;

  if (profile?.organization_id) {
    const { data: org } = await db
      .from('organizations')
      .select('tenant_id')
      .eq('id', profile.organization_id)
      .maybeSingle();
    if (org?.tenant_id) return org.tenant_id as string;
  }

  // Canonical Store workspace ownership. Do not grant billing control to an
  // ordinary member merely because they can use the workspace.
  const { data: memberships } = await db
    .from('tenant_memberships')
    .select('tenant_id, role, created_at')
    .eq('user_id', userId)
    .in('role', ['owner', 'admin'])
    .order('created_at', { ascending: false })
    .limit(10);

  for (const membership of memberships ?? []) {
    if (
      membership.tenant_id &&
      (await hasBillingOrganization(db, membership.tenant_id as string))
    ) {
      return membership.tenant_id as string;
    }
  }

  // Compatibility path for workspaces created through the newer tenant member
  // lifecycle. It is intentionally restricted to active billing authorities.
  const { data: tenantMembers } = await db
    .from('tenant_members')
    .select('tenant_id, tenant_role, status, created_at')
    .eq('user_id', userId)
    .eq('status', 'active')
    .in('tenant_role', ['owner', 'admin'])
    .order('created_at', { ascending: false })
    .limit(10);

  for (const membership of tenantMembers ?? []) {
    if (
      membership.tenant_id &&
      (await hasBillingOrganization(db, membership.tenant_id as string))
    ) {
      return membership.tenant_id as string;
    }
  }

  return null;
}

/** Trial orgs without organization_subscriptions still get base website features. */
export async function hasActiveTrialLicense(organizationId: string): Promise<boolean> {
  const db = await requireAdminClient();
  const { data } = await db
    .from('managed_licenses')
    .select('id, status, tier, trial_ends_at')
    .eq('organization_id', organizationId)
    .in('status', ['active', 'trial'])
    .maybeSingle();

  if (!data) return false;
  if (data.trial_ends_at) {
    return new Date(data.trial_ends_at as string) > new Date();
  }
  return true;
}
