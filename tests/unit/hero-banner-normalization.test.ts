import { describe, expect, it } from 'vitest';

import heroBanners from '@/content/heroBanners';

describe('hero banner normalization', () => {
  it('maps legacy CTA and copy keys into the current public contract', () => {
    const banner = heroBanners['administrative-assistant'];

    expect(banner.belowHeroHeadline).toBe('Administrative Assistant');
    expect(banner.belowHeroSubheadline).toBe('Launch your office career with in-demand skills.');
    expect(banner.primaryCta).toEqual({
      label: 'Enroll Now',
      href: '/apply?program=administrative-assistant',
    });
    expect(banner.secondaryCta).toEqual({
      label: 'Learn More',
      href: '/programs/administrative-assistant',
    });
  });

  it('provides a safe CTA for records with no CTA data', () => {
    expect(heroBanners['direct-support-professional'].primaryCta).toEqual({
      label: 'View Programs',
      href: '/programs',
    });
  });
});
