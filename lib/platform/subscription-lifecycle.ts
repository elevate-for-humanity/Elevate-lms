import type Stripe from 'stripe';
import { logger } from '@/lib/logger';
import type { SupabaseClient } from '@/lib/supabase';
import {
  getOrganizationFeatures,
  resolveBillingOrganizationId,
} from '@/lib/platform/organization-features';
import { syncLicenseFromSaasEntitlements } from '@/lib/platform/sync-license-from-saas';
import { normalizeAddonCode } from '@/lib/platform/feature-catalog';
import type { BasePlanId, BillingInterval } from '@/lib/store/platform-pricing';
import { emitPlatformEvent, PlatformEventType } from '@/lib/platform/orchestration/events';

const ACCESS_STATUSES = new Set<Stripe.Subscription.Status>(['active', 'trialing']);

function periodStart(subscription: Stripe.Subscription): string | null {
  const raw = subscription as unknown as { current_period_start?: number };
  return raw.current_period_start
    ? new Date(raw.current_period_start * 1000).toISOString()
    : null;
}

function periodEnd(subscription: Stripe.Subscription): string | null {
  const raw = subscription as unknown as { current_period_end?: number };
  return raw.current_period_end
    ? new Date(raw.current_period_end * 1000).toISOString()
    : null;
}

function customerId(subscription: Stripe.Subscription): string | null {
  return typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer?.id ?? null;
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

function databaseBillingInterval(interval: BillingInterval): 'month' | 'year' {
  return interval === 'annual' ? 'year' : 'month';
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
  return [...new Set(
    String(metadata.addon_slugs || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
      .map(normalizeAddonCode),
  )];
}

async function syncPlatformAddons(
  db: SupabaseClient,
  tenantId: string,
  addonCodes: string[],
  hasAccess: boolean,
  now: string,
): Promise<void> {
  await db
    .from('addon_subscriptions')
    .update({ active: false, canceled_at: now, updated_at: now })
    .eq('organization_id', tenantId);

  await db
    .from('organization_addons')
    .update({ status: 'inactive' })
    .eq('tenant_id', tenantId);

  if (!hasAccess || !addonCodes.length) return;

  const { data: catalogRows, error: catalogError } = await db
    .from('saas_addon_catalog')
    .select('code, monthly_price, active')
    .in('code', addonCodes)
    .eq('active', true);

  if (catalogError) {
    logger.error('platform subscription add-on catalog lookup failed', catalogError, {
      tenantId,
      addonCodes,
    });
    return;
  }

  const catalog = new Map((catalogRows ?? []).map((row) => [row.code, row]));
  for (const code of addonCodes) {
    const row = catalog.get(code);
    if (!row) {
      logger.warn('platform subscription ignored unknown/inactive add-on', { tenantId, code });
      continue;
    }

    const { error: addonError } = await db.from('addon_subscriptions').upsert(
      {
        organization_id: tenantId,
        addon_code: code,
        monthly_price: row.monthly_price ?? null,
        active: true,
        activated_at: now,
        canceled_at: null,
        updated_at: now,
      },
      { onConflict: 'organization_id,addon_code' },
    );
    if (addonError) {
      logger.error('platform subscription add-on upsert failed', addonError, { tenantId, code });
      continue;
    }

    const { error: legacyError } = await db.from('organization_addons').upsert(
      {
        tenant_id: tenantId,
        addon_slug: code,
        status: 'active',
        activated_at: now,
      },
      { onConflict: 'tenant_id,addon_slug' },
    );
    if (legacyError) {
      logger.warn('platform subscription legacy add-on sync failed', { tenantId, code, legacyError });
    }
  }
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
    logger.error('platform subscription lifecycle could not resolve billing organization', undefined, {
      tenantId,
      subscriptionId: subscription.id,
    });
    return;
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
    return;
  }

  const canonicalPlan = planRow.slug as BasePlanId;
  const { data: previous } = await db
    .from('organization_subscriptions')
    .select('status, stripe_subscription_id, plan_type')
    .eq('organization_id', billingOrganizationId)
    .maybeSingle();

  const status = organizationStatus(subscription.status);
  const hasAccess = ACCESS_STATUSES.has(subscription.status);
  const interval = codeBillingInterval(metadata.billing_interval);
  const addonCodes = purchasedAddonCodes(metadata);
  const now = new Date().toISOString();

  const { error } = await db
    .from('organization_subscriptions')
    .upsert(
      {
        organization_id: billingOrganizationId,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: customerId(subscription),
        plan_id: planRow.id,
        plan_type: canonicalPlan,
        billing_interval: databaseBillingInterval(interval),
        status,
        current_period_start: periodStart(subscription),
        current_period_end: periodEnd(subscription),
        cancel_at_period_end: subscription.cancel_at_period_end ?? false,
        metadata: {
          tenant_id: tenantId,
          plan_slug: canonicalPlan,
          addon_codes: addonCodes,
          stripe_status: subscription.status,
        },
        updated_at: now,
      },
      { onConflict: 'organization_id' },
    );

  if (error) {
    logger.error('platform subscription lifecycle upsert failed', error, {
      tenantId,
      billingOrganizationId,
      subscriptionId: subscription.id,
      status,
    });
    return;
  }

  await syncPlatformAddons(db, tenantId, addonCodes, hasAccess, now);

  const entitlements = await getOrganizationFeatures(tenantId, db);
  await syncLicenseFromSaasEntitlements(db, tenantId, entitlements, {
    planSlug: canonicalPlan,
    billingInterval: interval,
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: customerId(subscription) ?? undefined,
    active: hasAccess,
  });

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
