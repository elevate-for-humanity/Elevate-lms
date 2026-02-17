import Stripe from 'stripe';

// Lazy singleton — safe at module level during build.
let _stripe: Stripe | null = null;
let _initialized = false;

function init(): Stripe | null {
  if (!_initialized) {
    _initialized = true;
    const key = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_RESTRICTED_KEY;
    if (key) {
      _stripe = new Stripe(key, {
        apiVersion: '2025-10-29.clover',
        typescript: true,
      });
    }
  }
  return _stripe;
}

/**
 * Returns Stripe client or null if STRIPE_SECRET_KEY is not set.
 * Safe to call at module level during build.
 */
export function getStripe(): Stripe {
  const s = init();
  if (!s) {
    // Return null-ish during build; at runtime callers guard with if(!stripe)
    return null as unknown as Stripe;
  }
  return s;
}

// Eagerly initialized export — null during build, Stripe instance at runtime
export const stripe = init();
