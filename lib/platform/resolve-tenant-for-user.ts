import 'server-only';

import { requireAdminClient } from '@/lib/supabase/admin';

/**
 * Resolve organization/tenant id for SaaS feature gates.
 * Prefers profiles.tenant_id (canonical SaaS org id = tenants.id).
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
