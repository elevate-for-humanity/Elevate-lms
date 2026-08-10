import type Stripe from 'stripe';
import { logger } from '@/lib/logger';
import type { SupabaseClient } from '@/lib/supabase';
import { getOrganizationFeatures } from '@/lib/platform/organization-features';
import { syncLicenseFromSaasEntitlements } from '@/lib/platform/sync-license-from-saas';
import { BASE_PLANS, type BasePlanId, type BillingInterval } from '@/lib/store/platform-pricing';

const ACCESS_STATUSES = new Set(['active', 'trialing']);

function periodEnd(subscription: Stripe.Subscription): string | null {
  const raw = subscription as unknown as { current_period_end?: number };
  return raw.current_period_end ? new Date(raw.current_period_end * 1000).toISOString() : null;
}

function validPlanId(value: string | undefined | null): BasePlanId | null {
  return value && value in BASE_PLANS ? (value as BasePlanId) : null;
}

function validBillingInterval(value: string | undefined | null): BillingInterval | null {
  return value === 'monthly' || value === 'annual' ? value : null;
}

export async function syncPlatformSubscriptionLifecycle(
  db: SupabaseClient,
  subscription: Stripe.Subscription,
): Promise<void> {
  const metadata = subscription.metadata || {};
  const tenantId = metadata.tenant_id;
  if (!tenantId || metadata.checkout_type !== 'platform_saas') return;

  const hasAccess = ACCESS_STATUSES.has(subscription.status);
  const status = hasAccess
    ? 'active'
    : subscription.status === 'past_due' || subscription.status === 'unpaid'
      ? 'past_due'
      : subscription.status === 'canceled'
        ? 'canceled'
        : subscription.status;

  const { error } = await db
    .from('organization_subscriptions')
    .update({
      status,
      current_period_end: periodEnd(subscription),
      updated_at: new Date().toISOString(),
    })
    .eq('organization_id', tenantId)
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    logger.error('platform subscription lifecycle update failed', error, {
      tenantId,
      subscriptionId: subscription.id,
      status,
    });
    return;
  }

  if (!hasAccess) {
    await db
      .from('addon_subscriptions')
      .update({ active: false, canceled_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('organization_id', tenantId);
    await db
      .from('organization_addons')
      .update({ status: 'inactive' })
      .eq('tenant_id', tenantId);
  }

  const entitlements = await getOrganizationFeatures(tenantId, db);
  const planSlug = validPlanId(metadata.plan_id) ?? validPlanId(entitlements.planSlug);
  const billingInterval = validBillingInterval(metadata.billing_interval);

  if (!planSlug || !billingInterval) {
    logger.warn('platform subscription metadata is missing a valid plan or billing interval', {
      tenantId,
      subscriptionId: subscription.id,
      planId: metadata.plan_id,
      billingInterval: metadata.billing_interval,
    });
    return;
  }

  await syncLicenseFromSaasEntitlements(db, tenantId, entitlements, {
    planSlug,
    billingInterval,
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id,
  });
}

export async function syncIndividualAppLifecycle(
  db: SupabaseClient,
  subscription: Stripe.Subscription,
): Promise<void> {
  const metadata = subscription.metadata || {};
  if (metadata.checkout_type !== 'individual_app') return;

  const userId = metadata.user_id;
  const appSlug = metadata.app_slug;
  if (!userId || !appSlug) return;

  const hasAccess = ACCESS_STATUSES.has(subscription.status);
  const status = hasAccess
    ? 'active'
    : subscription.status === 'past_due' || subscription.status === 'unpaid'
      ? 'past_due'
      : subscription.status === 'canceled'
        ? 'canceled'
        : 'inactive';

  await db
    .from('user_app_subscriptions')
    .update({
      status,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id,
      current_period_end: periodEnd(subscription),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('app_slug', appSlug);
}
