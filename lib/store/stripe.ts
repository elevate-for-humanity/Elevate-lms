import 'server-only';
import { getStripe } from '@/lib/stripe/client';
import { hydrateProcessEnv } from '@/lib/secrets';
import type Stripe from 'stripe';

/**
 * Create a Stripe checkout session for a product.
 *
 * Stripe's Dashboard payment-method configuration is authoritative. Omitting
 * payment_method_types lets Checkout present cards, wallets, and eligible
 * installment methods for the customer, currency, and order amount.
 */
export async function createCheckoutSession({
  productId,
  productTitle,
  price,
  stripePriceId,
  email,
  successUrl,
  cancelUrl,
}: {
  productId: string;
  productTitle: string;
  /** Price in cents. Used only when stripePriceId is not provided. */
  price: number;
  /** If set, use this Stripe Price ID directly — avoids creating duplicate products. */
  stripePriceId?: string;
  email?: string;
  successUrl: string;
  cancelUrl: string;
}) {
  await hydrateProcessEnv();
  const stripe = getStripe();
  if (!stripe) throw new Error('Stripe not configured');

  if (!stripePriceId && (!Number.isSafeInteger(price) || price <= 0)) {
    throw new Error('A valid server-authoritative price is required');
  }

  const lineItem: Stripe.Checkout.SessionCreateParams.LineItem = stripePriceId
    ? { price: stripePriceId, quantity: 1 }
    : {
        price_data: {
          currency: 'usd',
          product_data: {
            name: productTitle,
            metadata: { product_id: productId },
          },
          unit_amount: price,
        },
        quantity: 1,
      };

  const session = await stripe.checkout.sessions.create({
    line_items: [lineItem],
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer_email: email,
    customer_creation: 'always',
    metadata: {
      type: 'store_product',
      productId,
      product_id: productId,
    },
  });

  return session;
}

/**
 * Verify Stripe webhook signature.
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  secret: string,
): Stripe.Event {
  const stripe = getStripe();
  if (!stripe) throw new Error('Stripe not configured');
  if (!secret) throw new Error('Stripe webhook secret not configured');
  return stripe.webhooks.constructEvent(payload, signature, secret);
}
