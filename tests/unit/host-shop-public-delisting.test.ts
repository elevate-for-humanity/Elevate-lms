import { describe, expect, it, vi } from 'vitest';

// No database writes: approved Prestige records remain in the fixtures while
// the shared public loader must exclude them from all public consumers.
vi.mock('@/lib/supabase/admin', () => ({
  requireAdminClient: async () => ({
    from(table: string) {
      const source: Record<string, any[]> = {
        barbershop_partner_applications: [{
          id: 'prestige-app', shop_legal_name: 'Prestige Elevation Barber and Beauty Institute LLC',
          shop_address_line1: 'Unverified address', shop_city: 'Indianapolis', shop_state: 'IN',
        }],
        host_shop_applications: [{
          id: 'mesmerized-app', shop_name: 'Mesmerized by Beauty Cosmetology Academy',
          address: '120 E Market Street, Suite 560, Indianapolis, IN 46204',
          intake: { programs: ['esthetician-apprenticeship', 'nail-technician-apprenticeship'] },
        }],
        public_host_shops: [{
          id: 'prestige-public', display_name: 'Prestige Elevation Barber and Beauty Institute LLC',
          public_slug: 'prestige-elevation-barber-and-beauty-institute',
          programs: ['barber-apprenticeship', 'cosmetology-apprenticeship'],
        }, {
          id: 'mesmerized-public', display_name: 'Mesmerized by Beauty Cosmetology Academy',
          public_slug: 'mesmerized-by-beauty-cosmetology-academy-8420fefa',
          programs: ['esthetician-apprenticeship', 'nail-technician-apprenticeship'],
        }],
        host_shops: [{
          id: 'prestige-operational', name: 'Prestige Elevation Barber and Beauty Institute LLC',
          address: 'Unverified address', city: 'Indianapolis', state: 'IN',
          services: ['barber-apprenticeship'], specializations: ['cosmetology-apprenticeship'],
        }],
        partners: [],
      };
      const value = { data: source[table] ?? [], error: null };
      const query = {
        select: () => query, eq: () => query, or: () => query, order: () => query,
        then: (ok: (value: typeof value) => unknown, fail?: (reason: unknown) => unknown) =>
          Promise.resolve(value).then(ok, fail),
      };
      return query;
    },
  }),
}));

import { getApprovedShopByPublicSlug, getApprovedShops } from '@/lib/programs/host-shops';

describe('public Host Shop delisting without approval or history changes', () => {
  it('excludes Prestige from the canonical directory/API/sitemap source, not Mesmerized', async () => {
    const shops = await getApprovedShops();
    expect(shops).toHaveLength(1);
    expect(shops[0].name).toBe('Mesmerized by Beauty Cosmetology Academy');
    expect(shops[0].programs).toEqual([
      'esthetician-apprenticeship', 'nail-technician-apprenticeship',
    ]);
  });

  it('blocks the direct Prestige profile while preserving the authorized Mesmerized profile', async () => {
    expect(await getApprovedShopByPublicSlug('prestige-elevation-barber-and-beauty-institute')).toBeNull();
    const shop = await getApprovedShopByPublicSlug(
      'mesmerized-by-beauty-cosmetology-academy-8420fefa',
    );
    expect(shop?.programs).toEqual([
      'esthetician-apprenticeship', 'nail-technician-apprenticeship',
    ]);
  });
});
