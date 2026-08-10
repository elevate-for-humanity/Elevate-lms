import type { SupabaseClient } from '@/lib/supabase';
import { licenseTierForPlan } from '@/lib/store/platform-pricing';
import type { BasePlanId, BillingInterval } from '@/lib/store/platform-pricing';
import type { OrganizationEntitlements } from '@/lib/platform/organization-features';

/**
 * Keep licenses.features in sync for middleware that still reads licenses table.
 * The SaaS subscription remains authoritative; compatibility licenses must never
 * resurrect access after recurring billing is past due or canceled.
 */
export async function syncLicenseFromSaasEntitlements(
  adminSupabase: SupabaseClient,
  organizationId: string,
  entitlements: OrganizationEntitlements,
  opts: {
    planSlug: BasePlanId;
    billingInterval: BillingInterval;
    stripeSubscriptionId?: string;
    stripeCustomerId?: string;
    active?: boolean;
  },
): Promise<void> {
  const active = opts.active !== false;
  const tier = licenseTierForPlan(opts.planSlug, opts.billingInterval);
  const features = active ? [...entitlements.features] : [];

  const payload = {
    tier,
    status: active ? 'active' : 'suspended',
    features,
    max_users: active ? entitlements.limits.users ?? 1 : 0,
    stripe_subscription_id: opts.stripeSubscriptionId ?? null,
    stripe_customer_id: opts.stripeCustomerId ?? null,
    metadata: {
      saas_plan_slug: opts.planSlug,
      limits: active ? entitlements.limits : { users: 0 },
      addon_codes: active ? entitlements.activeAddonCodes : [],
      subscription_authority: 'organization_subscriptions',
      billing_access: active,
    },
    updated_at: new Date().toISOString(),
  };

  const { data: existing } = await adminSupabase
    .from('licenses')
    .select('id')
    .eq('tenant_id', organizationId)
    .maybeSingle();

  if (existing?.id) {
    await adminSupabase.from('licenses').update(payload).eq('id', existing.id);
  } else {
    await adminSupabase.from('licenses').insert({
      tenant_id: organizationId,
      domain: 'pending-setup',
      license_key: `saas-${organizationId.slice(0, 8)}`,
      customer_email: null,
      ...payload,
    });
  }
}
