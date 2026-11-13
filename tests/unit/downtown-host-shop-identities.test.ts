import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/programs/host-shops', () => ({
  getApprovedShops: async () => [
    {
      id: 'mesmerized', publicSlug: 'mesmerized-by-beauty-cosmetology-academy-8420fefa',
      name: 'Mesmerized by Beauty Cosmetology Academy', address: '120 East Market Street, Suite 560',
      city: 'Indianapolis', state: 'IN', zip: '', phone: '',
      programs: ['nail-technician-apprenticeship', 'esthetician-apprenticeship'],
      mediaGallery: [{ url: '/images/partners/mesmerized-by-beauty/downtown-nail-program.webp', alt: 'Mesmerized nail program' }],
    },
    {
      id: 'prestige', publicSlug: 'prestige-elevation-barber-and-beauty-institute',
      name: 'Prestige Elevation Barber and Beauty Institute LLC', address: '120 East Market Street, Suite 560',
      city: 'Indianapolis', state: 'IN', zip: '', phone: '',
      programs: ['barber-apprenticeship', 'cosmetology-apprenticeship'],
    },
  ],
}));

import { getHostShopNetwork } from '@/lib/programs/host-shop-network';

describe('downtown businesses sharing a training address', () => {
  it('keeps Mesmerized and Prestige names, photos, and programs separate', async () => {
    const shops = await getHostShopNetwork();
    expect(shops).toHaveLength(2);
    const mesmerized = shops.find((shop) => shop.id === 'mesmerized');
    const prestige = shops.find((shop) => shop.id === 'prestige');
    expect(mesmerized?.slug).toBe('mesmerized-by-beauty-cosmetology-academy-8420fefa');
    expect(mesmerized?.name).toBe('Mesmerized by Beauty Cosmetology Academy');
    expect(mesmerized?.programs).toEqual(['nail-technician-apprenticeship', 'esthetician-apprenticeship']);
    expect(mesmerized?.gallery?.every((image) => image.url.includes('mesmerized-by-beauty'))).toBe(true);
    expect(prestige?.programs).toEqual(['barber-apprenticeship', 'cosmetology-apprenticeship']);
    expect(prestige?.gallery?.some((image) => image.url.includes('downtown-cosmetology-program'))).toBe(false);
    expect(prestige?.gallery?.some((image) => image.url.includes('program-barber-training'))).toBe(true);
  });
});
