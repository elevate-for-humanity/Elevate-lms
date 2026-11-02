import { describe, expect, it, vi } from 'vitest';
import { CERT_PROVIDERS } from '../../lib/testing/proctoring-capabilities';
import { getPublicExamAmountCents } from '../../lib/testing/exam-pricing';
import { EPA608_PRICING } from '../../lib/testing/providers/epa608-pricing';
vi.mock('next/navigation', () => ({
  permanentRedirect: (url: string) => {
    throw new Error(`redirect:${url}`);
  },
}));
import ProviderPage from '../../apps/marketing/app/testing/[provider]/page';
import CheckoutPage from '../../apps/marketing/app/testing/checkout/page';
import StorePage from '../../apps/marketing/app/store/testing/page';

describe('one public testing destination', () => {
  it('offers all four EPA sections in one purchase at the full exam price', () => {
    const provider = CERT_PROVIDERS.esco;
    expect(provider.exams).toHaveLength(1);
    expect(provider.exams[0]).toMatchObject({
      name: 'Universal (All Sections)',
      questionCount: 100,
    });
    expect(getPublicExamAmountCents(provider, provider.exams[0])).toBe(
      EPA608_PRICING.universal.price * 100,
    );
    expect(provider.fees).toHaveLength(1);
  });
  it('preserves the selected exam when redirecting old checkout links', async () => {
    await expect(
      CheckoutPage({
        searchParams: Promise.resolve({ provider: 'esco', exam: 'Universal (All Sections)' }),
      }),
    ).rejects.toThrow('redirect:/testing?provider=esco&exam=Universal+%28All+Sections%29#booking');
  });
  it('consolidates known and obsolete provider URLs without another 404', async () => {
    await expect(ProviderPage({ params: Promise.resolve({ provider: 'esco' }) })).rejects.toThrow(
      'redirect:/testing#esco',
    );
    await expect(
      ProviderPage({ params: Promise.resolve({ provider: 'testing-center' }) }),
    ).rejects.toThrow('redirect:/testing');
  });
  it('leaves the store software entry at the canonical testing center', () => {
    expect(() => StorePage()).toThrow('redirect:https://www.elevateforhumanity.org/testing');
  });
});
