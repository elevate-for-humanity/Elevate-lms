import { expect, it, vi } from 'vitest';

vi.mock('@/lib/programs/host-shops', () => ({
  getApprovedShops: async () => [{
    id: 'kountry-kutz-other-location',
    publicSlug: 'kountry-kutz-other-location',
    name: 'Kountry Kutz Barbershop',
    address: '900 Other St',
    city: 'Indianapolis',
    state: 'IN',
    zip: '46201',
    phone: '',
    email: '',
    supervisor: '',
    programs: ['cosmetology-apprenticeship'],
    badge: 'partner',
  }],
}));

import { getHostShopNetwork, publicPhoneForApprovedHostShop } from '@/lib/programs/host-shop-network';

it('does not attach a curated profile to a same-name shop at another worksite', async () => {
  const shops = await getHostShopNetwork();

  expect(shops).toHaveLength(1);
  expect(shops[0]).toEqual(expect.objectContaining({
    id: 'kountry-kutz-other-location',
    slug: 'kountry-kutz-other-location',
    address: '900 Other St, Indianapolis, IN, 46201',
    programs: ['cosmetology-apprenticeship'],
  }));
  expect(shops[0].gallery).toEqual([]);
});


it('restores the same approved identity’s public directory phone without borrowing another shop’s contact', () => {
  const approved = { id: 'approved-shop', phone: '' };
  expect(publicPhoneForApprovedHostShop(approved, { id: 'approved-shop', phone: '3175550100' })).toBe('3175550100');
  expect(publicPhoneForApprovedHostShop(approved, { id: 'other-shop', phone: '3175550101' })).toBe('');
  expect(publicPhoneForApprovedHostShop(approved)).toBe('');
  expect(publicPhoneForApprovedHostShop({ ...approved, phone: '3175550102' }, { id: 'approved-shop', phone: '3175550100' })).toBe('3175550102');
});
