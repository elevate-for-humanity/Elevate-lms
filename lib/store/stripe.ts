import 'server-only';
import { getStripe } from '@/lib/stripe/client';
import type Stripe from 'stripe';

/**
 * Create a Stripe checkout session for a product
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
  const stripe = getStripe();
  if (!stripe) throw new Error('Stripe not configured');

  const lineItem: Stripe.Checkout.SessionCreateParams.LineItem = stripePriceId
    ? { price: stripePriceId, quantity: 1 }
    : {
        price_data: {
          currency: 'usd',
          product_data: { name: productTitle },
          unit_amount: price,
        },
        quantity: 1,
      };

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [lineItem],
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer_email: email,
    metadata: { productId },
  });

  return session;
}

/**
 * Verify Stripe webhook signature
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  secret: string,
): Stripe.Event {
  const stripe = getStripe();
  if (!stripe) throw new Error('Stripe not configured');
  return stripe.webhooks.constructEvent(payload, signature, secret);
}
