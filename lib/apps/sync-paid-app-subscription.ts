import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe/client';
import { requireAdminClient } from '@/lib/supabase/admin';
import { hydrateProcessEnv } from '@/lib/secrets';

const ACCESS_STATUSES = new Set<Stripe.Subscription.Status>(['active', 'trialing']);

type StripeSubscriptionWithPeriods = Stripe.Subscription & {
  current_period_end?: number;
};

export async function syncPaidAppSubscription(subscription: any) {
  if (!subscription || subscription.status !== 'active' || !subscription.stripe_subscription_id) {
    return subscription;
  }

  await hydrateProcessEnv();
  const stripe = getStripe();
  if (!stripe) return subscription;

  try {
    const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id);
    const hasAccess = ACCESS_STATUSES.has(stripeSubscription.status);
    const nextStatus = hasAccess ? 'active' : stripeSubscription.status === 'past_due' ? 'past_due' : 'inactive';
    const periodEndSeconds = (stripeSubscription as StripeSubscriptionWithPeriods).current_period_end;
    const currentPeriodEnd = periodEndSeconds
      ? new Date(periodEndSeconds * 1000).toISOString()
      : null;
    const customerId = typeof stripeSubscription.customer === 'string' ? stripeSubscription.customer : stripeSubscription.customer.id;

    const admin = await requireAdminClient();
    if (admin) {
      await admin
        .from('user_app_subscriptions')
        .update({
          status: nextStatus,
          stripe_customer_id: customerId,
          current_period_end: currentPeriodEnd,
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscription.id);
    }

    return {
      ...subscription,
      status: nextStatus,
      stripe_customer_id: customerId,
      current_period_end: currentPeriodEnd,
    };
  } catch {
    const admin = await requireAdminClient();
    if (admin) {
      await admin
        .from('user_app_subscriptions')
        .update({ status: 'inactive', updated_at: new Date().toISOString() })
        .eq('id', subscription.id);
    }
    return { ...subscription, status: 'inactive' };
  }
}
