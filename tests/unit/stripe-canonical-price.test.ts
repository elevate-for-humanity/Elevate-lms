import { describe, expect, it, vi } from 'vitest';
import { ensureCanonicalStripePrice } from '@/lib/stripe/resolve-canonical-price';

function price(overrides: Record<string, unknown> = {}) {
  return {
    id: 'price_existing',
    currency: 'usd',
    unit_amount: 2500,
    recurring: null,
    ...overrides,
  };
}

describe('ensureCanonicalStripePrice', () => {
  it('reuses the existing lookup-key price without creating catalog records', async () => {
    const stripe = {
      prices: {
        list: vi.fn().mockResolvedValue({ data: [price()] }),
        create: vi.fn(),
      },
      products: { search: vi.fn(), create: vi.fn() },
    };

    const resolved = await ensureCanonicalStripePrice(stripe as never, {
      lookupKey: 'course_123_2500_usd',
      productLookupKey: 'course_123',
      productName: 'Course 123',
      unitAmount: 2500,
    });

    expect(resolved.id).toBe('price_existing');
    expect(stripe.products.search).not.toHaveBeenCalled();
    expect(stripe.products.create).not.toHaveBeenCalled();
    expect(stripe.prices.create).not.toHaveBeenCalled();
  });

  it('creates one stable product and price when the lookup keys are absent', async () => {
    const stripe = {
      prices: {
        list: vi.fn().mockResolvedValue({ data: [] }),
        create: vi.fn().mockResolvedValue(price({ id: 'price_created' })),
      },
      products: {
        search: vi.fn().mockResolvedValue({ data: [] }),
        create: vi.fn().mockResolvedValue({ id: 'prod_created' }),
      },
    };

    await ensureCanonicalStripePrice(stripe as never, {
      lookupKey: 'course_123_2500_usd',
      productLookupKey: 'course_123',
      productName: 'Course 123',
      unitAmount: 2500,
    });

    expect(stripe.products.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Course 123',
        metadata: expect.objectContaining({ catalog_lookup_key: 'course_123' }),
      }),
      { idempotencyKey: 'catalog-product-course_123' },
    );
    expect(stripe.prices.create).toHaveBeenCalledWith(
      expect.objectContaining({
        product: 'prod_created',
        lookup_key: 'course_123_2500_usd',
        unit_amount: 2500,
      }),
      { idempotencyKey: 'catalog-price-course_123_2500_usd' },
    );
  });
});
