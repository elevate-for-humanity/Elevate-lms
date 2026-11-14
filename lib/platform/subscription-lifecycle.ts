import type Stripe from 'stripe';
import { logger } from '@/lib/logger';
import type { SupabaseClient } from '@/lib/supabase';
import {
  getOrganizationFeatures,
  resolveBillingOrganizationId,
} from '@/lib/platform/organization-features';
import { fulfillPlatformSaasSubscription } from '@/lib/platform/fulfillment';
import { normalizeAddonCode } from '@/lib/platform/feature-catalog';
import type { BasePlanId, BillingInterval } from '@/lib/store/platform-pricing';
import { emitPlatformEvent, PlatformEventType } from '@/lib/platform/orchestration/events';

const ACCESS_STATUSES = new Set<Stripe.Subscription.Status>(['active', 'trialing']);

function periodStart(subscription: Stripe.Subscription): string | null {
  const raw = subscription as unknown as {
    current_period_start?: number;
    items?: { data?: Array<{ current_period_start?: number }> };
  };
  const start = raw.current_period_start ?? raw.items?.data?.[0]?.current_period_start;
  return start ? new Date(start * 1000).toISOString() : null;
}

function periodEnd(subscription: Stripe.Subscription): string | null {
  const raw = subscription as unknown as {
    current_period_end?: number;
    items?: { data?: Array<{ current_period_end?: number }> };
  };
  const end = raw.current_period_end ?? raw.items?.data?.[0]?.current_period_end;
  return end ? new Date(end * 1000).toISOString() : null;
}

function customerId(subscription: Stripe.Subscription): string | null {
  return typeof subscription.customer === 'string'
    ? subscription.customer
    : (subscription.customer?.id ?? null);
}

function organizationStatus(status: Stripe.Subscription.Status): string {
  if (status === 'active' || status === 'trialing') return status;
  if (status === 'past_due' || status === 'unpaid') return status;
  if (status === 'canceled' || status === 'incomplete_expired') return 'canceled';
  return 'past_due';
}

function individualAppStatus(status: Stripe.Subscription.Status): string {
  if (ACCESS_STATUSES.has(status)) return 'active';
  if (status === 'past_due' || status === 'unpaid' || status === 'incomplete') return 'past_due';
  if (status === 'canceled' || status === 'incomplete_expired') return 'canceled';
  return 'inactive';
}

function codeBillingInterval(raw: string | undefined): BillingInterval {
  return raw === 'year' || raw === 'annual' || raw === 'annually' || raw === 'yearly'
    ? 'annual'
    : 'monthly';
}

function lifecycleEventType(status: Stripe.Subscription.Status): string {
  if (status === 'active' || status === 'trialing') {
    return PlatformEventType.BILLING_SUBSCRIPTION_ACTIVATED;
  }
  if (status === 'past_due' || status === 'unpaid' || status === 'incomplete') {
    return PlatformEventType.BILLING_SUBSCRIPTION_PAST_DUE;
  }
  if (status === 'canceled' || status === 'incomplete_expired') {
    return PlatformEventType.BILLING_SUBSCRIPTION_CANCELED;
  }
  return PlatformEventType.BILLING_SUBSCRIPTION_UPDATED;
}

function purchasedAddonCodes(metadata: Stripe.Metadata): string[] {
  return [
    ...new Set(
      String(metadata.addon_slugs || '')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)
        .map(normalizeAddonCode),
    ),
  ];
}

export async function syncPlatformSubscriptionLifecycle(
  db: SupabaseClient,
  subscription: Stripe.Subscription,
): Promise<void> {
  const metadata = subscription.metadata || {};
  const tenantId = metadata.tenant_id;
  if (!tenantId || metadata.checkout_type !== 'platform_saas') return;

  const billingOrganizationId = await resolveBillingOrganizationId(tenantId, db);
  if (!billingOrganizationId) {
    logger.error(
      'platform subscription lifecycle could not resolve billing organization',
      undefined,
      {
        tenantId,
        subscriptionId: subscription.id,
      },
    );
    throw new Error('No billing organization linked to subscription workspace');
  }

  const planSlug = metadata.plan_id || metadata.plan_slug || 'professional';
  const { data: planRow } = await db
    .from('subscription_plans')
    .select('id, slug')
    .eq('slug', planSlug)
    .eq('active', true)
    .maybeSingle();

  if (!planRow?.id || !['solo', 'business', 'professional'].includes(planRow.slug)) {
    logger.error('platform subscription lifecycle could not resolve plan', undefined, {
      tenantId,
      billingOrganizationId,
      subscriptionId: subscription.id,
      planSlug,
    });
    throw new Error('Subscription plan is unavailable');
  }

  const canonicalPlan = planRow.slug as BasePlanId;
  const { data: previous, error: previousError } = await db
    .from('organization_subscriptions')
    .select('status, stripe_subscription_id, plan_type, billing_provider, provider_subscription_id')
    .eq('organization_id', billingOrganizationId)
    .maybeSingle();

  if (previousError) throw new Error(previousError.message);
  // Archived provider events must not overwrite a workspace moved to current billing.
  if (previous?.billing_provider && previous.billing_provider !== 'stripe') return;
  if (previous?.provider_subscription_id && previous.provider_subscription_id !== subscription.id)
    return;
  const status = organizationStatus(subscription.status) as
    | 'active'
    | 'trialing'
    | 'past_due'
    | 'unpaid'
    | 'canceled';
  const hasAccess = ACCESS_STATUSES.has(subscription.status);
  const interval = codeBillingInterval(metadata.billing_interval);
  const addonCodes = purchasedAddonCodes(metadata);
  const result = await fulfillPlatformSaasSubscription(db, {
    user_id: metadata.user_id || '',
    tenant_id: tenantId,
    billing_organization_id: billingOrganizationId,
    plan_id: canonicalPlan,
    billing_interval: interval,
    addon_slugs: addonCodes.join(','),
    billing_provider: 'stripe',
    provider_subscription_id: subscription.id,
    provider_customer_id: customerId(subscription) ?? undefined,
    current_period_start: periodStart(subscription) ?? undefined,
    current_period_end: periodEnd(subscription) ?? undefined,
    subscription_status: status,
    cancel_at_period_end: subscription.cancel_at_period_end ?? false,
  });
  if (!result.ok) throw new Error(result.error || 'Subscription lifecycle persistence failed');
  const entitlements = await getOrganizationFeatures(tenantId, db);

  const eventKey = `${subscription.id}:${subscription.status}:${periodEnd(subscription) ?? 'none'}:${canonicalPlan}:${addonCodes.join(',')}`;
  await emitPlatformEvent(db, {
    eventType: lifecycleEventType(subscription.status),
    category: 'billing',
    source: 'stripe.subscription',
    subjectType: 'organization_subscription',
    subjectId: subscription.id,
    tenantId,
    correlationId: subscription.id,
    idempotencyKey: `billing:${eventKey}`,
    payload: {
      billing_organization_id: billingOrganizationId,
      plan_slug: canonicalPlan,
      addon_codes: addonCodes,
      status,
      stripe_status: subscription.status,
      current_period_end: periodEnd(subscription),
    },
  });

  await emitPlatformEvent(db, {
    eventType: PlatformEventType.ENTITLEMENT_REFRESHED,
    category: 'entitlement',
    source: 'stripe.subscription',
    subjectType: 'tenant',
    subjectId: tenantId,
    tenantId,
    correlationId: subscription.id,
    idempotencyKey: `entitlement:${eventKey}`,
    payload: {
      features: entitlements.features,
      plan_slug: entitlements.planSlug,
      addon_codes: entitlements.activeAddonCodes,
      subscription_status: entitlements.status,
    },
  });

  const previouslyAccessible = previous?.status === 'active' || previous?.status === 'trialing';
  const planChanged = Boolean(previous?.plan_type && previous.plan_type !== canonicalPlan);
  if (hasAccess && (!previouslyAccessible || planChanged)) {
    await emitPlatformEvent(db, {
      eventType: PlatformEventType.PROVISIONING_REQUESTED,
      category: 'provisioning',
      source: 'stripe.subscription',
      subjectType: 'tenant',
      subjectId: tenantId,
      tenantId,
      correlationId: subscription.id,
      idempotencyKey: `provisioning:platform:${subscription.id}:${canonicalPlan}:${addonCodes.join(',')}`,
      payload: {
        kind: 'platform_workspace',
        plan_slug: canonicalPlan,
        addon_codes: addonCodes,
        features: entitlements.features,
      },
    });
  }
}

export async function syncIndividualAppLifecycle(
  db: SupabaseClient,
  subscription: Stripe.Subscription,
): Promise<void> {
  const metadata = subscription.metadata || {};
  if (metadata.checkout_type !== 'individual_app') return;

  const userId = metadata.user_id;
  const appSlug = metadata.app_slug;
  const plan = metadata.plan_id || 'starter';
  if (!userId || !appSlug) return;

  const { data: previous } = await db
    .from('user_app_subscriptions')
    .select('status, plan, stripe_subscription_id')
    .eq('user_id', userId)
    .eq('app_slug', appSlug)
    .maybeSingle();

  const status = individualAppStatus(subscription.status);
  const hasAccess = ACCESS_STATUSES.has(subscription.status);
  const now = new Date().toISOString();

  const { error } = await db
    .from('user_app_subscriptions')
    .upsert(
      {
        user_id: userId,
        app_slug: appSlug,
        plan,
        status,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: customerId(subscription),
        current_period_start: periodStart(subscription),
        current_period_end: periodEnd(subscription),
        updated_at: now,
      },
      { onConflict: 'user_id,app_slug' },
    );

  if (error) {
    logger.error('individual app subscription lifecycle upsert failed', error, {
      userId,
      appSlug,
      subscriptionId: subscription.id,
      status,
    });
    return;
  }

  const eventKey = `${subscription.id}:${subscription.status}:${periodEnd(subscription) ?? 'none'}:${plan}`;
  await emitPlatformEvent(db, {
    eventType: lifecycleEventType(subscription.status),
    category: 'billing',
    source: 'stripe.subscription',
    actorId: userId,
    actorType: 'user',
    subjectType: 'individual_app_subscription',
    subjectId: subscription.id,
    correlationId: subscription.id,
    idempotencyKey: `billing:individual-app:${eventKey}`,
    payload: {
      app_slug: appSlug,
      plan,
      status,
      stripe_status: subscription.status,
      current_period_end: periodEnd(subscription),
    },
  });

  await emitPlatformEvent(db, {
    eventType: hasAccess
      ? PlatformEventType.ENTITLEMENT_GRANTED
      : PlatformEventType.ENTITLEMENT_REVOKED,
    category: 'entitlement',
    source: 'stripe.subscription',
    actorId: userId,
    actorType: 'user',
    subjectType: 'individual_app',
    subjectId: appSlug,
    correlationId: subscription.id,
    idempotencyKey: `entitlement:individual-app:${eventKey}`,
    payload: { app_slug: appSlug, plan, status },
  });

  const previouslyAccessible = previous?.status === 'active' || previous?.status === 'trial';
  const planChanged = Boolean(previous?.plan && previous.plan !== plan);
  if (hasAccess && (!previouslyAccessible || planChanged)) {
    await emitPlatformEvent(db, {
      eventType: PlatformEventType.PROVISIONING_REQUESTED,
      category: 'provisioning',
      source: 'stripe.subscription',
      actorId: userId,
      actorType: 'user',
      subjectType: 'individual_app',
      subjectId: appSlug,
      correlationId: subscription.id,
      idempotencyKey: `provisioning:individual-app:${subscription.id}:${plan}`,
      payload: { kind: `${appSlug}_workspace`, app_slug: appSlug, plan },
    });
  }
}
