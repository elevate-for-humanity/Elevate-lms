import { logger } from '@/lib/logger';
import type { SupabaseClient } from '@/lib/supabase';
import {
  getOrganizationFeatures,
  resolveOrganizationIdentity,
} from '@/lib/platform/organization-features';
import { licenseTierForPlan } from '@/lib/store/platform-pricing';
import { normalizeAddonCode } from '@/lib/platform/feature-catalog';
import type { BasePlanId, BillingInterval } from '@/lib/store/platform-pricing';
import { emitPlatformEvent, PlatformEventType } from '@/lib/platform/orchestration/events';

export interface PlatformSaasCheckoutMetadata {
  user_id: string;
  tenant_id?: string;
  billing_organization_id?: string;
  customer_email?: string;
  delivery_key?: string;
  subscription_status?: 'active' | 'trialing' | 'past_due' | 'unpaid' | 'canceled';
  cancel_at_period_end?: boolean;
  plan_id: BasePlanId;
  billing_interval: BillingInterval;
  addon_slugs?: string;
  billing_provider?: string;
  provider_subscription_id?: string;
  provider_customer_id?: string;
  provider_payment_id?: string;
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
  if (!['monthly', 'annual'].includes(meta.billing_interval)) {
    return { ok: false, error: 'Invalid subscription interval' };
  }
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

  const addonSlugs = [
    ...new Set(
      (meta.addon_slugs || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .map(normalizeAddonCode),
    ),
  ];

  if (meta.billing_organization_id && meta.billing_organization_id !== billingOrganizationId) {
    return { ok: false, error: 'Billing organization does not belong to this workspace' };
  }
  const { data: applied, error } = await adminSupabase.rpc('apply_platform_subscription', {
    p_tenant_id: tenantId,
    p_organization_id: billingOrganizationId,
    p_plan_slug: meta.plan_id,
    p_interval: databaseBillingInterval(meta.billing_interval),
    p_provider: meta.billing_provider ?? 'quickbooks',
    p_subscription_id: meta.provider_subscription_id ?? null,
    p_customer_id: meta.provider_customer_id ?? null,
    p_period_start: meta.current_period_start ?? null,
    p_period_end: meta.current_period_end ?? null,
    p_addon_codes: addonSlugs,
    p_license_tier: licenseTierForPlan(meta.plan_id, meta.billing_interval),
    p_customer_email: meta.customer_email ?? null,
    p_status: meta.subscription_status ?? 'active',
    p_cancel_at_period_end: meta.cancel_at_period_end ?? false,
    p_delivery_key: meta.delivery_key ?? null,
  });
  if (error) {
    logger.error('Atomic platform subscription delivery failed', error, {
      tenantId,
      billingOrganizationId,
    });
    return { ok: false, error: error.message };
  }
  if (applied === false) return { ok: true };
  const entitlements = await getOrganizationFeatures(tenantId, adminSupabase);

  if (
    meta.provider_subscription_id &&
    (!meta.subscription_status || ['active', 'trialing'].includes(meta.subscription_status))
  ) {
    await emitPlatformEvent(adminSupabase, {
      eventType: PlatformEventType.ENTITLEMENT_REFRESHED,
      category: 'entitlement',
      source: 'platform.fulfillment',
      actorId: meta.user_id || null,
      actorType: 'user',
      tenantId,
      subjectType: 'tenant',
      subjectId: tenantId,
      correlationId: meta.provider_subscription_id,
      idempotencyKey: `platform-checkout-entitlement:${meta.provider_subscription_id}/:${meta.plan_id}:${addonSlugs.join(',')}`,
      payload: {
        plan_slug: meta.plan_id,
        addon_codes: addonSlugs,
        features: entitlements.features,
      },
    });
  }

  return { ok: true };
}
