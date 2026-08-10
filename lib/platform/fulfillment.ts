import { logger } from '@/lib/logger';
import type { SupabaseClient } from '@/lib/supabase';
import {
  getOrganizationFeatures,
  resolveOrganizationIdentity,
} from '@/lib/platform/organization-features';
import { syncLicenseFromSaasEntitlements } from '@/lib/platform/sync-license-from-saas';
import { normalizeAddonCode } from '@/lib/platform/feature-catalog';
import type { BasePlanId, BillingInterval } from '@/lib/store/platform-pricing';
import { emitPlatformEvent, PlatformEventType } from '@/lib/platform/orchestration/events';

export interface PlatformSaasCheckoutMetadata {
  user_id: string;
  tenant_id?: string;
  plan_id: BasePlanId;
  billing_interval: BillingInterval;
  addon_slugs?: string;
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  current_period_start?: string;
  current_period_end?: string;
}

function databaseBillingInterval(interval: BillingInterval): 'month' | 'year' {
  return interval === 'annual' ? 'year' : 'month';
}

export async function fulfillPlatformSaasSubscription(
  adminSupabase: SupabaseClient,
  meta: PlatformSaasCheckoutMetadata,
): Promise<{ ok: boolean; error?: string }> {
  if (!meta.tenant_id) {
    logger.warn('platform_saas fulfillment: no tenant_id', { user_id: meta.user_id });
    return { ok: false, error: 'No tenant linked to this account' };
  }

  const identity = await resolveOrganizationIdentity(meta.tenant_id, adminSupabase);
  const tenantId = identity.tenantId;
  const billingOrganizationId = identity.billingOrganizationId;
  if (!billingOrganizationId) {
    logger.warn('platform_saas fulfillment: billing organization not found', {
      user_id: meta.user_id,
      tenant_id: tenantId,
    });
    return { ok: false, error: 'No billing organization linked to this workspace' };
  }

  const addonSlugs = [...new Set(
    (meta.addon_slugs || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map(normalizeAddonCode),
  )];

  const { data: planRow, error: planErr } = await adminSupabase
    .from('subscription_plans')
    .select('id, slug, monthly_price')
    .eq('slug', meta.plan_id)
    .eq('active', true)
    .maybeSingle();

  if (planErr || !planRow) {
    return { ok: false, error: planErr?.message ?? 'Plan not found in catalog' };
  }

  const now = new Date().toISOString();
  const { error: subErr } = await adminSupabase.from('organization_subscriptions').upsert(
    {
      organization_id: billingOrganizationId,
      plan_id: planRow.id,
      plan_type: planRow.slug,
      stripe_subscription_id: meta.stripe_subscription_id ?? null,
      stripe_customer_id: meta.stripe_customer_id ?? null,
      billing_interval: databaseBillingInterval(meta.billing_interval),
      status: 'active',
      current_period_start: meta.current_period_start ?? null,
      current_period_end: meta.current_period_end ?? null,
      updated_at: now,
      metadata: { tenant_id: tenantId, plan_slug: meta.plan_id, addon_slugs: addonSlugs },
    },
    { onConflict: 'organization_id' },
  );

  if (subErr) {
    logger.error('organization_subscriptions upsert failed', subErr, { tenantId, billingOrganizationId });
    return { ok: false, error: subErr.message };
  }

  await adminSupabase
    .from('addon_subscriptions')
    .update({ active: false, canceled_at: now, updated_at: now })
    .eq('organization_id', tenantId);
  await adminSupabase
    .from('organization_addons')
    .update({ status: 'inactive' })
    .eq('tenant_id', tenantId);

  for (const code of addonSlugs) {
    const { data: catalog, error: catalogError } = await adminSupabase
      .from('saas_addon_catalog')
      .select('code, monthly_price, active')
      .eq('code', code)
      .maybeSingle();
    if (catalogError || !catalog?.active) {
      logger.warn('platform_saas fulfillment: add-on unavailable', { code, error: catalogError?.message });
      continue;
    }

    const { error: addonErr } = await adminSupabase.from('addon_subscriptions').upsert(
      {
        organization_id: tenantId,
        addon_code: code,
        monthly_price: catalog.monthly_price ?? null,
        active: true,
        activated_at: now,
        canceled_at: null,
        updated_at: now,
      },
      { onConflict: 'organization_id,addon_code' },
    );
    if (addonErr) logger.warn('addon_subscriptions upsert failed', { code, addonErr });

    await adminSupabase.from('organization_addons').upsert(
      { tenant_id: tenantId, addon_slug: code, status: 'active', activated_at: now },
      { onConflict: 'tenant_id,addon_slug' },
    );
  }

  const entitlements = await getOrganizationFeatures(tenantId, adminSupabase);
  await syncLicenseFromSaasEntitlements(adminSupabase, tenantId, entitlements, {
    planSlug: meta.plan_id,
    billingInterval: meta.billing_interval,
    stripeSubscriptionId: meta.stripe_subscription_id,
    stripeCustomerId: meta.stripe_customer_id,
    active: true,
  });

  if (meta.stripe_subscription_id) {
    await emitPlatformEvent(adminSupabase, {
      eventType: PlatformEventType.ENTITLEMENT_REFRESHED,
      category: 'entitlement',
      source: 'platform.fulfillment',
      actorId: meta.user_id || null,
      actorType: 'user',
      tenantId,
      subjectType: 'tenant',
      subjectId: tenantId,
      correlationId: meta.stripe_subscription_id,
      idempotencyKey: `platform-checkout-entitlement:${meta.stripe_subscription_id}:${meta.plan_id}:${addonSlugs.join(',')}`,
      payload: { plan_slug: meta.plan_id, addon_codes: addonSlugs, features: entitlements.features },
    });
  }

  return { ok: true };
}
