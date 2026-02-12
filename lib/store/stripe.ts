import { getStripe } from '@/lib/stripe/client';
import Stripe from 'stripe';

/**
 * Create a Stripe checkout session for a product
 */
export async function createCheckoutSession({
  productId,
  productTitle,
  price,
  email,
  successUrl,
  cancelUrl,
}: {
  productId: string;
  productTitle: string;
  price: number;
  email?: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: productTitle,
            description: 'Full source code with lifetime updates',
          },
          unit_amount: price, // price in cents
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer_email: email,
    metadata: {
      productId,
    },
  });

  return session;
}

/**
 * Verify Stripe webhook signature
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  secret: string
): Stripe.Event {
  const stripe = getStripe();
  return stripe.webhooks.constructEvent(payload, signature, secret);
}
