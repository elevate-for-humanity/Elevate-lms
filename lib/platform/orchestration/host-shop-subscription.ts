import type Stripe from 'stripe';
import type { SupabaseClient } from '@/lib/supabase';
import { emitPlatformEvent, PlatformEventType } from '@/lib/platform/orchestration/events';
import { logger } from '@/lib/logger';

export type HostShopTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export const HOST_SHOP_TIER_AMOUNTS: Record<HostShopTier, number> = {
  bronze: 14900,
  silver: 29900,
  gold: 49900,
  platinum: 99900,
};

export const HOST_SHOP_TIER_LABELS: Record<HostShopTier, string> = {
  bronze: 'Bronze Host Partner',
  silver: 'Silver Growth Partner',
  gold: 'Gold Business Accelerator',
  platinum: 'Platinum Elite Partner',
};

export function isHostShopTier(value: unknown): value is HostShopTier {
  return typeof value === 'string' && value in HOST_SHOP_TIER_AMOUNTS;
}

function periodStart(subscription: Stripe.Subscription): string | null {
  const raw = subscription as unknown as { current_period_start?: number };
  return raw.current_period_start ? new Date(raw.current_period_start * 1000).toISOString() : null;
}

function periodEnd(subscription: Stripe.Subscription): string | null {
  const raw = subscription as unknown as { current_period_end?: number };
  return raw.current_period_end ? new Date(raw.current_period_end * 1000).toISOString() : null;
}

function customerId(subscription: Stripe.Subscription): string | null {
  return typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer?.id ?? null;
}

function mappedStatus(status: Stripe.Subscription.Status): {
  subscriptionStatus: string;
  partnershipStatus: string;
  hasAccess: boolean;
} {
  if (status === 'active' || status === 'trialing') {
    return { subscriptionStatus: status, partnershipStatus: 'active', hasAccess: true };
  }
  if (status === 'canceled' || status === 'incomplete_expired') {
    return { subscriptionStatus: 'canceled', partnershipStatus: 'expired', hasAccess: false };
  }
  return { subscriptionStatus: status, partnershipStatus: 'suspended', hasAccess: false };
}

function billingEvent(status: Stripe.Subscription.Status): string {
  if (status === 'active' || status === 'trialing') return PlatformEventType.BILLING_SUBSCRIPTION_ACTIVATED;
  if (status === 'canceled' || status === 'incomplete_expired') return PlatformEventType.BILLING_SUBSCRIPTION_CANCELED;
  if (status === 'past_due' || status === 'unpaid' || status === 'incomplete') return PlatformEventType.BILLING_SUBSCRIPTION_PAST_DUE;
  return PlatformEventType.BILLING_SUBSCRIPTION_UPDATED;
}

export async function syncHostShopSubscriptionLifecycle(
  db: SupabaseClient,
  subscription: Stripe.Subscription,
): Promise<void> {
  const metadata = subscription.metadata || {};
  if (metadata.type !== 'host_shop_subscription' && metadata.checkout_type !== 'host_shop_subscription') return;

  const partnershipId = metadata.partnership_id || '';
  const partnerId = metadata.partner_id || '';
  const shopId = metadata.shop_id || '';
  const ownerId = metadata.user_id || metadata.owner_id || '';
  const tier = metadata.tier;
  if (!isHostShopTier(tier)) {
    logger.error('[host-shop] subscription missing canonical tier', undefined, {
      subscriptionId: subscription.id,
      tier,
    });
    return;
  }

  let query = db.from('host_shop_partnerships').select('id,partner_tier,subscription_status');
  if (partnershipId) query = query.eq('id', partnershipId);
  else if (partnerId) query = query.eq('partner_id', partnerId);
  else if (shopId) query = query.eq('shop_id', shopId);
  else {
    logger.error('[host-shop] subscription has no partnership identity', undefined, { subscriptionId: subscription.id });
    return;
  }

  const { data: existing } = await query.maybeSingle();
  if (!existing?.id) {
    logger.error('[host-shop] partnership not found for subscription', undefined, {
      subscriptionId: subscription.id,
      partnershipId,
      partnerId,
      shopId,
    });
    return;
  }

  const state = mappedStatus(subscription.status);
  const now = new Date().toISOString();
  const { error } = await db
    .from('host_shop_partnerships')
    .update({
      partner_tier: state.hasAccess ? tier : 'free',
      stripe_customer_id: customerId(subscription),
      stripe_subscription_id: subscription.id,
      subscription_status: state.subscriptionStatus,
      subscription_start_date: periodStart(subscription),
      current_period_end: periodEnd(subscription),
      subscription_end_date: state.hasAccess ? null : now,
      status: state.partnershipStatus,
      portal_access_enabled: state.hasAccess,
      portal_access_at: state.hasAccess ? now : null,
      owner_id: ownerId || null,
      updated_at: now,
      metadata: {
        billing_authority: 'stripe',
        stripe_subscription_id: subscription.id,
        tier,
        partner_id: partnerId || null,
        shop_id: shopId || null,
      },
    })
    .eq('id', existing.id);

  if (error) throw error;

  const eventKey = `${subscription.id}:${subscription.status}:${periodEnd(subscription) ?? 'none'}:${tier}`;
  await emitPlatformEvent(db, {
    eventType: billingEvent(subscription.status),
    category: 'billing',
    source: 'stripe.host-shop-subscription',
    actorId: ownerId || null,
    actorType: ownerId ? 'user' : 'system',
    subjectType: 'host_shop_partnership',
    subjectId: existing.id,
    correlationId: subscription.id,
    idempotencyKey: `billing:host-shop:${eventKey}`,
    payload: {
      partner_id: partnerId || null,
      shop_id: shopId || null,
      tier,
      status: state.subscriptionStatus,
    },
  });

  await emitPlatformEvent(db, {
    eventType: state.hasAccess ? PlatformEventType.ENTITLEMENT_GRANTED : PlatformEventType.ENTITLEMENT_REVOKED,
    category: 'entitlement',
    source: 'stripe.host-shop-subscription',
    actorId: ownerId || null,
    actorType: ownerId ? 'user' : 'system',
    subjectType: 'host_shop_partnership',
    subjectId: existing.id,
    correlationId: subscription.id,
    idempotencyKey: `entitlement:host-shop:${eventKey}`,
    payload: { tier, portal_access: state.hasAccess },
  });

  const previouslyAccessible = existing.subscription_status === 'active' || existing.subscription_status === 'trialing';
  const tierChanged = existing.partner_tier !== tier;
  if (state.hasAccess && (!previouslyAccessible || tierChanged)) {
    await emitPlatformEvent(db, {
      eventType: PlatformEventType.PROVISIONING_REQUESTED,
      category: 'provisioning',
      source: 'stripe.host-shop-subscription',
      actorId: ownerId || null,
      actorType: ownerId ? 'user' : 'system',
      subjectType: 'host_shop_partnership',
      subjectId: existing.id,
      correlationId: subscription.id,
      idempotencyKey: `provisioning:host-shop:${subscription.id}:${tier}`,
      payload: { kind: 'host_shop_workspace', tier, partner_id: partnerId || null, shop_id: shopId || null },
    });
  }
}
