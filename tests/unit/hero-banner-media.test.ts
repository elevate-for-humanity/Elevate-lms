import { describe, expect, it } from 'vitest';
import { resolveHeroPosterSrc, DEFAULT_HERO_FALLBACK } from '@/lib/images/hero-banner-media';

describe('resolveHeroPosterSrc', () => {
  it('uses banner poster with alias fallback chain', () => {
    const src = resolveHeroPosterSrc('tax-prep', {
      banner: {
        pageKey: 'tax-prep',
        posterImage: '/images/heroes/training-provider-1.webp',
        belowHeroHeadline: 'x',
        belowHeroSubheadline: 'y',
        primaryCta: { label: 'Apply', href: '/apply' },
        analyticsName: 'tax',
      },
      heroImage: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/business/professional-2.jpg',
    });
    expect(src).toBe('/images/business/professional-2.jpg');
  });

  it('falls back to program hero image when no banner', () => {
    const src = resolveHeroPosterSrc('barber-apprenticeship', {
      heroImage: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/barber-hero-main.webp',
    });
    expect(src).toContain('barber');
  });

  it('never returns empty string', () => {
    const src = resolveHeroPosterSrc('unknown-program-slug-xyz');
    expect(src.length).toBeGreaterThan(0);
    expect(src).toBe(DEFAULT_HERO_FALLBACK);
  });
});
