import 'server-only';
// Never initialize at module load — STRIPE_SECRET_KEY lives in app_secrets
// and is only available after hydrateProcessEnv() runs at request time.
// Callers must use getStripe() after hydrating secrets.
import { withResilience, breakers } from '@/lib/resilience';
import { getStripeRuntimeKey, getStripeWriteKey } from './runtime-key';

type StripeInstance = import('stripe').default;

let _StripeClass: typeof import('stripe').default | null = null;

/**
 * Returns a fresh Stripe client using the current process.env value.
 * Always call after hydrateProcessEnv() so the key is populated.
 * Returns null if the key is still missing (misconfiguration).
 *
 * Stripe SDK is require()'d lazily on first call so it is not traced into
 * routes that never invoke this function.
 */
// Treat misconfiguration sentinels as missing rather than letting Stripe SDK
// throw `Invalid API Key provided: skip` at runtime. Real Stripe keys begin
// with sk_ or rk_; anything else (build-time placeholders, "skip", "") is
// treated as not configured and the caller gets a clean null.
function isUsableStripeKey(value: string | undefined | null): value is string {
  if (!value) return false;
  const trimmed = value.trim();
  if (trimmed.length < 10) return false;
  return trimmed.startsWith('sk_') || trimmed.startsWith('rk_');
}

export function getStripe(): StripeInstance | null {
  const key = getStripeRuntimeKey();
  if (!isUsableStripeKey(key)) return null;
  if (!_StripeClass) {
    _StripeClass = require('stripe').default ?? require('stripe');
  }
  return new _StripeClass!(key, {
    apiVersion: '2026-07-29.dahlia' as any,
    typescript: true,
  });
}

/** Returns a client authorized for payment mutations such as creating Checkout Sessions. */
export function getStripeWriteClient(): StripeInstance | null {
  const key = getStripeWriteKey();
  if (!isUsableStripeKey(key)) return null;
  if (!_StripeClass) {
    _StripeClass = require('stripe').default ?? require('stripe');
  }
  return new _StripeClass!(key, {
    apiVersion: '2026-07-29.dahlia' as any,
    typescript: true,
  });
}

// Module-level export for callers that import `stripe` directly.
// Resolves at import time using whatever key is in process.env at that moment.
// Always null-check before use — key may be absent at build time.
export const stripe: StripeInstance | null = getStripe();

/**
 * Execute a Stripe API call with retry + circuit breaker protection.
 * Use this instead of calling stripe methods directly in route handlers.
 *
 * @example
 *   const session = await stripeCall(() => stripe!.checkout.sessions.create(...));
 */
export async function stripeCall<T>(fn: () => Promise<T>): Promise<T> {
  return withResilience(fn, {
    circuitBreaker: breakers.stripe,
    attempts: 3,
    baseDelayMs: 500,
    label: 'stripe',
    // Stripe 4xx errors are permanent — don't retry them
    shouldRetry: (err) => {
      const msg = err instanceof Error ? err.message : String(err);
      // Retry on network errors and 5xx; skip on 4xx (card declined, invalid params, etc.)
      return !msg.match(/\b4\d{2}\b/);
    },
  });
}
