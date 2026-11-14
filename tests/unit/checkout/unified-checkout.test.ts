import { describe, expect, it } from 'vitest';
import {
  CheckoutFlowSchema,
  checkoutResponseUrl,
  resolveCheckoutTarget,
} from '@/lib/checkout/unified-checkout';

describe('unified checkout routing', () => {
  it.each([
    [{ flow: 'program', slug: 'barber-apprenticeship' }, '/api/checkout/program'],
    [
      { flow: 'program_enrollment', program_id: '11111111-1111-4111-8111-111111111111' },
      '/api/programs/enroll/checkout',
    ],
    [
      { flow: 'program_plan', programId: '11111111-1111-4111-8111-111111111111' },
      '/api/programs/checkout',
    ],
    [{ flow: 'testing', examType: 'nha', examName: 'CCMA' }, '/api/testing/checkout'],
    [{ flow: 'store_cart' }, '/api/store/cart-checkout'],
    [{ flow: 'platform_subscription', planId: 'growth' }, '/api/store/platform-checkout'],
    [{ flow: 'implementation_package', packageId: 'launch' }, '/api/store/implementation-checkout'],
    [
      { flow: 'host_shop_subscription', tier: 'professional' },
      '/api/host-shop/subscription/checkout',
    ],
    [{ flow: 'donation', amount: 25 }, '/api/donate/create-checkout'],
  ] as const)('routes %o without changing its specialized workflow', (raw, endpoint) => {
    expect(resolveCheckoutTarget(CheckoutFlowSchema.parse(raw)).endpoint).toBe(endpoint);
  });

  it('normalizes both existing response shapes', () => {
    expect(checkoutResponseUrl({ url: 'https://checkout.stripe.com/a' })).toBe(
      'https://checkout.stripe.com/a',
    );
    expect(checkoutResponseUrl({ checkoutUrl: 'https://checkout.stripe.com/b' })).toBe(
      'https://checkout.stripe.com/b',
    );
    expect(checkoutResponseUrl({})).toBeNull();
  });

  it('removes unrecognized client-controlled store prices', () => {
    const parsed = CheckoutFlowSchema.parse({
      flow: 'store_cart',
      items: [{ slug: 'course-one', quantity: 1 }],
      price: 1,
    });
    expect(parsed).not.toHaveProperty('price');
  });
});
