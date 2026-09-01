import { afterEach, describe, expect, it } from 'vitest';
import { getStripeRuntimeKey } from '@/lib/stripe/runtime-key';

const originalRestricted = process.env.STRIPE_RESTRICTED_KEY;
const originalSecret = process.env.STRIPE_SECRET_KEY;

afterEach(() => {
  process.env.STRIPE_RESTRICTED_KEY = originalRestricted;
  process.env.STRIPE_SECRET_KEY = originalSecret;
});

describe('Stripe runtime credential selection', () => {
  it('prefers the least-privileged restricted key', () => {
    process.env.STRIPE_RESTRICTED_KEY = 'rk_live_working';
    process.env.STRIPE_SECRET_KEY = 'sk_live_legacy';
    expect(getStripeRuntimeKey()).toBe('rk_live_working');
  });

  it('retains the secret key as a compatibility fallback', () => {
    delete process.env.STRIPE_RESTRICTED_KEY;
    process.env.STRIPE_SECRET_KEY = 'sk_live_fallback';
    expect(getStripeRuntimeKey()).toBe('sk_live_fallback');
  });
});
