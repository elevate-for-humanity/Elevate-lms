import type Stripe from 'stripe';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getBillingCycleAnchor } from '@/lib/programs/pricing';
import { logger } from '@/lib/logger';

export type ApprenticeshipSubscriptionsTable = 'barber_subscriptions' | 'cosmetology_subscriptions';

/**
 * After apprenticeship checkout (payment plan), attach PM and create weekly Stripe subscription.
 */
export async function createWeeklySubscriptionAfterCheckout(params: {
  stripe: Stripe;
  supabase: SupabaseClient;
  session: Stripe.Checkout.Session;
  customerId: string;
  customerEmail: string;
  applicationId?: string;
  weeklyPaymentCents: number;
  invoiceWeeks: number;
  fullyPaid: boolean;
  bnplProvider?: string | null;
  subscriptionsTable: ApprenticeshipSubscriptionsTable;
  productName: string;
  programSlug: string;
}): Promise<{ subscriptionId?: string; error?: string }> {
  const {
    stripe,
    supabase,
    session,
    customerId,
    customerEmail,
    applicationId,
    weeklyPaymentCents,
    invoiceWeeks,
    fullyPaid,
    bnplProvider,
    subscriptionsTable,
    productName,
    programSlug,
  } = params;

  if (fullyPaid || bnplProvider || weeklyPaymentCents <= 0 || invoiceWeeks <= 0) {
    return {};
  }

  try {
    const checkoutSession = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ['payment_intent.payment_method'],
    });
    const pi = checkoutSession.payment_intent as Stripe.PaymentIntent | null;
    const pmId =
      typeof pi?.payment_method === 'string'
        ? pi.payment_method
        : (pi?.payment_method as Stripe.PaymentMethod | null)?.id;

    if (!pmId) {
      logger.warn(`[${programSlug}/billing] No payment method — weekly subscription not created`, {
        customerId,
      });
      return { error: 'no_payment_method' };
    }

    await stripe.paymentMethods.attach(pmId, { customer: customerId }).catch(() => {});
    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: pmId },
    });

    const weeklyPrice = await stripe.prices.create({
      currency: 'usd',
      unit_amount: weeklyPaymentCents,
      recurring: { interval: 'week', interval_count: 1 },
      product_data: { name: productName },
    });

    const billingAnchor = getBillingCycleAnchor();

    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: weeklyPrice.id }],
      billing_cycle_anchor: billingAnchor,
      proration_behavior: 'none',
      metadata: {
        program: programSlug,
        weeks_remaining: invoiceWeeks.toString(),
        application_id: applicationId || '',
        customer_email: customerEmail,
      },
      cancel_at: billingAnchor + invoiceWeeks * 7 * 24 * 60 * 60,
    });

    await supabase
      .from(subscriptionsTable)
      .update({ stripe_subscription_id: subscription.id })
      .eq('stripe_customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(1);

    logger.info(`[${programSlug}/billing] Weekly subscription created`, {
      customerId,
      subscriptionId: subscription.id,
      weeklyPaymentCents,
      weeks: invoiceWeeks,
    });

    return { subscriptionId: subscription.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error(
      `[${programSlug}/billing] Failed to create weekly subscription`,
      err instanceof Error ? err : new Error(message),
      { customerId },
    );
    return { error: message };
  }
}
