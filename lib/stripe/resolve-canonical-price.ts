import type Stripe from 'stripe';

export interface CanonicalPriceExpectation {
  lookupKey: string;
  unitAmount: number;
  currency?: string;
  recurringInterval?: 'day' | 'week' | 'month' | 'year';
}

export interface CanonicalPriceProvisioning extends CanonicalPriceExpectation {
  productName: string;
  productMetadata?: Record<string, string>;
  priceMetadata?: Record<string, string>;
  nickname?: string;
}

function verifyCanonicalStripePrice(
  price: Stripe.Price,
  expectation: CanonicalPriceExpectation,
): Stripe.Price {
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

  return verifyCanonicalStripePrice(prices.data[0], expectation);
}

/**
 * Resolve an existing canonical Price or create it exactly once when a catalog
 * item is intentionally lazy-provisioned (currently SaaS add-ons). Stripe
 * enforces lookup-key uniqueness; a concurrent creation race re-resolves the
 * winning Price instead of creating an unbounded duplicate chain.
 */
export async function ensureCanonicalStripePrice(
  stripe: Stripe,
  provisioning: CanonicalPriceProvisioning,
): Promise<Stripe.Price> {
  const existing = await stripe.prices.list({
    lookup_keys: [provisioning.lookupKey],
    active: true,
    limit: 2,
  });
  if (existing.data.length === 1) {
    return verifyCanonicalStripePrice(existing.data[0], provisioning);
  }
  if (existing.data.length > 1) {
    throw new Error(
      `Stripe catalog misconfigured for ${provisioning.lookupKey}: found ${existing.data.length} active prices`,
    );
  }

  try {
    const created = await stripe.prices.create({
      currency: provisioning.currency ?? 'usd',
      unit_amount: provisioning.unitAmount,
      lookup_key: provisioning.lookupKey,
      nickname: provisioning.nickname,
      recurring: provisioning.recurringInterval
        ? { interval: provisioning.recurringInterval }
        : undefined,
      metadata: provisioning.priceMetadata,
      product_data: {
        name: provisioning.productName,
        metadata: provisioning.productMetadata,
      },
    });
    return verifyCanonicalStripePrice(created, provisioning);
  } catch (error) {
    // Concurrent checkout may have created the lookup key first. Re-resolve
    // before surfacing an error so the checkout remains idempotent.
    const raced = await stripe.prices.list({
      lookup_keys: [provisioning.lookupKey],
      active: true,
      limit: 2,
    });
    if (raced.data.length === 1) {
      return verifyCanonicalStripePrice(raced.data[0], provisioning);
    }
    throw error;
  }
}
