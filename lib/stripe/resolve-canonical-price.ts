import type Stripe from 'stripe';

export interface CanonicalPriceExpectation {
  lookupKey: string;
  unitAmount: number;
  currency?: string;
  recurringInterval?: 'day' | 'week' | 'month' | 'year';
}

/**
 * Resolve a pre-created Stripe Price by stable lookup_key and verify that it
 * still matches the code-side commercial catalog. This prevents Checkout from
 * creating duplicate products/prices and fails closed on catalog drift.
 */
export async function resolveCanonicalStripePrice(
  stripe: Stripe,
  expectation: CanonicalPriceExpectation,
): Promise<Stripe.Price> {
  const prices = await stripe.prices.list({
    lookup_keys: [expectation.lookupKey],
    active: true,
    limit: 2,
  });

  if (prices.data.length !== 1) {
    throw new Error(
      `Stripe catalog misconfigured for ${expectation.lookupKey}: expected exactly one active price, found ${prices.data.length}`,
    );
  }

  const price = prices.data[0];
  const expectedCurrency = expectation.currency ?? 'usd';
  if (price.currency !== expectedCurrency) {
    throw new Error(
      `Stripe catalog drift for ${expectation.lookupKey}: expected ${expectedCurrency}, got ${price.currency}`,
    );
  }

  if (price.unit_amount !== expectation.unitAmount) {
    throw new Error(
      `Stripe catalog drift for ${expectation.lookupKey}: expected ${expectation.unitAmount}, got ${price.unit_amount ?? 'null'}`,
    );
  }

  if (expectation.recurringInterval) {
    if (price.recurring?.interval !== expectation.recurringInterval) {
      throw new Error(
        `Stripe catalog drift for ${expectation.lookupKey}: expected ${expectation.recurringInterval} recurrence, got ${price.recurring?.interval ?? 'none'}`,
      );
    }
  } else if (price.recurring) {
    throw new Error(
      `Stripe catalog drift for ${expectation.lookupKey}: expected one-time price, got recurring`,
    );
  }

  return price;
}
