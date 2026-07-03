import 'server-only';
import type StripeModule from 'stripe';

/**
 * Lazy Stripe server client.
 *
 * Import this instead of `stripe` from stripe-client.ts in any route or
 * server utility. The dynamic import keeps the Stripe SDK out of the
 * Next.js module graph for routes that don't call this function, which
 * prevents it from being traced into the Lambda bundle.
 */
export type Stripe = StripeModule;

// Re-export commonly used types from Stripe namespace
export type StripeEvent = StripeModule.Event;
export type StripeInvoice = StripeModule.Invoice;
export type StripeSubscription = StripeModule.Subscription;
export type StripeCheckoutSession = StripeModule.Checkout.Session;
export type StripePaymentIntent = StripeModule.PaymentIntent;

export async function getStripeServer(): Promise<StripeModule> {
  const Stripe = (await import('stripe')).default;
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error('Missing STRIPE_SECRET_KEY');
  return new Stripe(secretKey, { apiVersion: '2025-10-29.clover' as any });
}
