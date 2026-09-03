import 'server-only';
import { getStripeRuntimeKey } from './runtime-key';

/**
 * Lazy Stripe server client.
 *
 * Import this instead of `stripe` from stripe-client.ts in any route or
 * server utility. The dynamic import keeps the Stripe SDK out of the
 * Next.js module graph for routes that don't call this function, which
 * prevents it from being traced into the Lambda bundle.
 */
export async function getStripeServer() {
  const Stripe = (await import('stripe')).default;
  const secretKey = getStripeRuntimeKey();
  if (!secretKey) throw new Error('Missing Stripe server credential');
  return new Stripe(secretKey, { apiVersion: '2026-07-29.dahlia' as any });
}
