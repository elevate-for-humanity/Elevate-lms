import { logger } from '@/lib/logger';
import type { SupabaseClient } from '@/lib/supabase';
import { getOrganizationFeatures } from '@/lib/platform/organization-features';
import { syncLicenseFromSaasEntitlements } from '@/lib/platform/sync-license-from-saas';
import { normalizeAddonCode } from '@/lib/platform/feature-catalog';
import type { BasePlanId, BillingInterval } from '@/lib/store/platform-pricing';

export interface PlatformSaasCheckoutMetadata {
  user_id: string;
  tenant_id?: string;
  plan_id: BasePlanId;
  billing_interval: BillingInterval;
  addon_slugs?: string;
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  current_period_end?: string;
}

/**
 * Apply plan + add-ons to organization_subscriptions, addon_subscriptions,
 * and sync licenses.features for existing middleware.
 */
export async function fulfillPlatformSaasSubscription(
  adminSupabase: SupabaseClient,
  meta: PlatformSaasCheckoutMetadata,
): Promise<{ ok: boolean; error?: string }> {
  const organizationId = meta.tenant_id;
  if (!organizationId) {
    logger.warn('platform_saas fulfillment: no tenant_id', { user_id: meta.user_id });
    return { ok: false, error: 'No organization linked to this account' };
  }

  const addonSlugs = (meta.addon_slugs || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map(normalizeAddonCode);

  const { data: planRow, error: planErr } = await adminSupabase
    .from('subscription_plans')
    .select('id, monthly_price')
    .eq('slug', meta.plan_id)
    .eq('active', true)
    .maybeSingle();

  if (planErr || !planRow) {
    return { ok: false, error: planErr?.message ?? 'Plan not found in catalog' };
  }

  const periodEnd = meta.current_period_end ?? null;

  const { error: subErr } = await adminSupabase.from('organization_subscriptions').upsert(
    {
      organization_id: organizationId,
      plan_id: planRow.id,
      stripe_subscription_id: meta.stripe_subscription_id ?? null,
      stripe_customer_id: meta.stripe_customer_id ?? null,
      billing_interval: meta.billing_interval,
      status: 'active',
      current_period_end: periodEnd,
      updated_at: new Date().toISOString(),
      metadata: { plan_slug: meta.plan_id, addon_slugs: addonSlugs },
    },
    { onConflict: 'organization_id' },
  );

  if (subErr) {
    logger.error('organization_subscriptions upsert failed', subErr);
    return { ok: false, error: subErr.message };
  }

  for (const code of addonSlugs) {
    const { data: catalog } = await adminSupabase
      .from('saas_addon_catalog')
      .select('monthly_price')
      .eq('code', code)
      .maybeSingle();

    const { error: addonErr } = await adminSupabase.from('addon_subscriptions').upsert(
      {
        organization_id: organizationId,
        addon_code: code,
        monthly_price: catalog?.monthly_price ?? null,
        active: true,
        activated_at: new Date().toISOString(),
        canceled_at: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'organization_id,addon_code' },
    );

    if (addonErr) {
      logger.warn('addon_subscriptions upsert failed', { code, addonErr });
    }

    await adminSupabase.from('organization_addons').upsert(
      {
        tenant_id: organizationId,
        addon_slug: code,
        status: 'active',
        activated_at: new Date().toISOString(),
      },
      { onConflict: 'tenant_id,addon_slug' },
    );
  }

  const entitlements = await getOrganizationFeatures(organizationId, adminSupabase);

  await syncLicenseFromSaasEntitlements(adminSupabase, organizationId, entitlements, {
    planSlug: meta.plan_id,
    billingInterval: meta.billing_interval,
    stripeSubscriptionId: meta.stripe_subscription_id,
    stripeCustomerId: meta.stripe_customer_id,
  });

  return { ok: true };
}
