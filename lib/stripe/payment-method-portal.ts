import type Stripe from 'stripe';

/**
 * Stripe Billing Portal session scoped to payment-method update only.
 * Students cannot cancel subscriptions through this flow.
 */
export async function createPaymentMethodUpdatePortalSession(
  stripe: Stripe,
  customerId: string,
  returnUrl: string,
): Promise<Stripe.BillingPortal.Session> {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
    flow_data: {
      type: 'payment_method_update',
    },
  });
}
