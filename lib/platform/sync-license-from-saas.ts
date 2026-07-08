import type { SupabaseClient } from '@/lib/supabase';
import { licenseTierForPlan } from '@/lib/store/platform-pricing';
import type { BasePlanId, BillingInterval } from '@/lib/store/platform-pricing';
import type { OrganizationEntitlements } from '@/lib/platform/organization-features';

/**
 * Keep licenses.features in sync for middleware that still reads licenses table.
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
  },
): Promise<void> {
  const tier = licenseTierForPlan(opts.planSlug, opts.billingInterval);
  const features = entitlements.features.map((f) => (f === 'bookings' ? 'booking' : f));

  const payload = {
    tier,
    status: 'active',
    features,
    max_users: entitlements.limits.users ?? 1,
    stripe_subscription_id: opts.stripeSubscriptionId ?? null,
    stripe_customer_id: opts.stripeCustomerId ?? null,
    metadata: {
      saas_plan_slug: opts.planSlug,
      limits: entitlements.limits,
      addon_codes: entitlements.activeAddonCodes,
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
