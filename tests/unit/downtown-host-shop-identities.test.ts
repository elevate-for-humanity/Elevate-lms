import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/programs/host-shops', () => ({
  getApprovedShops: async () => [
    {
      id: 'mesmerized', publicSlug: 'mesmerized-by-beauty-cosmetology-academy-8420fefa',
      name: 'Mesmerized by Beauty Cosmetology Academy', address: '120 East Market Street, Suite 930',
      city: 'Indianapolis', state: 'IN', zip: '', phone: '',
      programs: ['nail-technician-apprenticeship', 'esthetician-apprenticeship'],
      mediaGallery: [{ url: '/images/partners/mesmerized-by-beauty/downtown-nail-program.webp', alt: 'Mesmerized nail program' }],
    },
    {
      id: 'prestige', publicSlug: 'prestige-elevation-barber-and-beauty-institute',
      name: 'Prestige Elevation Barber and Beauty Institute LLC', address: '120 East Market Street, Suite 930',
      city: 'Indianapolis', state: 'IN', zip: '', phone: '',
      programs: ['barber-apprenticeship', 'cosmetology-apprenticeship'],
    },
  ],
}));

import { getHostShopNetwork } from '@/lib/programs/host-shop-network';

describe('downtown businesses sharing a training address', () => {
  it('keeps Mesmerized scoped to its own esthetics/nail programs while delisting the inaccurate Prestige public profile', async () => {
    // Both approval records remain present in the mocked operational source.
    // Public delisting must not merge Prestige's barber/cosmetology programs,
    // address, or media into Mesmerized or publish the inaccurate shop.
    const shops = await getHostShopNetwork();
    expect(shops).toHaveLength(1);
    expect(shops.map((shop) => shop.id)).not.toContain('prestige');
    const mesmerized = shops.find((shop) => shop.id === 'mesmerized');
    expect(mesmerized?.slug).toBe('mesmerized-by-beauty-cosmetology-academy-8420fefa');
    expect(mesmerized?.name).toBe('Mesmerized by Beauty Cosmetology Academy');
    expect(mesmerized?.programs).toEqual(['nail-technician-apprenticeship', 'esthetician-apprenticeship']);
    expect(mesmerized?.gallery?.every((image) => image.url.includes('mesmerized-by-beauty'))).toBe(true);
    expect(shops.flatMap((shop) => shop.programs)).not.toContain('barber-apprenticeship');
    expect(shops.flatMap((shop) => shop.programs)).not.toContain('cosmetology-apprenticeship');
  });
});
