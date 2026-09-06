import type Stripe from 'stripe';

const LIVE_SUBSCRIPTION_STATUSES = new Set<Stripe.Subscription.Status>([
  'active',
  'trialing',
  'past_due',
  'unpaid',
  'incomplete',
  'paused',
]);

export function isLiveSubscription(subscription: Stripe.Subscription): boolean {
  return LIVE_SUBSCRIPTION_STATUSES.has(subscription.status);
}

/**
 * Stripe is authoritative for recurring billing. Database state can lag a
 * successful Stripe write, so every creation path checks Stripe directly
 * before creating another subscription.
 */
export async function findExistingApprenticeshipSubscription(params: {
  stripe: Stripe;
  customerId: string;
  enrollmentId?: string | null;
  programSlug?: string | null;
  checkoutSessionId?: string | null;
}): Promise<Stripe.Subscription | null> {
  const { stripe, customerId, enrollmentId, programSlug, checkoutSessionId } = params;
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: 'all',
    limit: 100,
  });

  const matches = subscriptions.data.filter((subscription) => {
    if (!isLiveSubscription(subscription)) return false;
    const metadata = subscription.metadata ?? {};
    if (enrollmentId && metadata.enrollment_id === enrollmentId) return true;
    if (checkoutSessionId && metadata.authorized_checkout_session_id === checkoutSessionId) {
      return true;
    }
    return Boolean(
      !enrollmentId &&
      !checkoutSessionId &&
      programSlug &&
      metadata.program_slug === programSlug &&
      metadata.kind === 'apprenticeship_weekly_tuition',
    );
  });

  // A legacy retry could have created more than one subscription before the
  // database was updated. Prefer the newest because that is the record the
  // completion flow persisted; stable idempotency prevents future duplicates.
  return matches.sort((left, right) => right.created - left.created)[0] ?? null;
}

export function apprenticeshipIdempotencyKey(
  operation: 'setup' | 'price' | 'subscription',
  enrollmentId: string,
): string {
  return `apprenticeship-${operation}:${enrollmentId}`;
}
