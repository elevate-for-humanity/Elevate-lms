import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getApprovedShops, getApprovedShopByPublicSlug, PROGRAM_SLUGS } from './host-shops';

const { rows } = vi.hoisted(() => ({ rows: {} as Record<string, Record<string, unknown>[]> }));
vi.mock('@/lib/supabase/admin', () => ({
  requireAdminClient: async () => ({
    from: (table: string) => {
      let result = [...(rows[table] ?? [])];
      const query = {
        select: () => query,
        order: () => query,
        eq: (key: string, value: unknown) => {
          result = result.filter(row => row[key] === value);
          return query;
        },
        not: (key: string, _operator: string, _value: null) => {
          result = result.filter(row => row[key] != null);
          return query;
        },
        or: (expression: string) => {
          if (expression.startsWith('status.in')) {
            result = result.filter(row => ['archived', 'inactive'].includes(String(row.status)) || row.account_status === 'archived');
          }
          return query;
        },
        then: (resolve: (value: unknown) => void) => resolve({ data: result, error: null }),
      };
      return query;
    },
  }),
}));

const published = '2026-11-24T12:00:00Z';
const partner = { id: 'catalog-partner', name: 'Catalog Salon LLC', status: 'active', account_status: 'active', approval_status: 'approved', public_slug: 'catalog-salon', public_profile_published_at: published, programs: ['esthetician-apprenticeship', 'nail-technician-apprenticeship'] };
const profile = { id: partner.id, display_name: 'Catalog Salon LLC', public_slug: partner.public_slug, public_profile_published_at: published, city: 'Indianapolis', state: 'IN', programs: ['barber-apprenticeship'], phone: 'unverified' };
const listing = { partner_id: partner.id, status: 'active', directory_listing: true };

beforeEach(() => {
  rows.partners = [{ ...partner }];
  rows.public_host_shops = [{ ...profile }];
  rows.host_shop_partnerships = [{ ...listing }];
  rows.host_shop_applications = [];
  rows.barbershop_partner_applications = [];
  rows.host_shops = [];
});

describe('public Host Shop partner-backed approvals', () => {
  it('lists an omitted approved shop for both operational occupations, never from the media profile', async () => {
    expect(await getApprovedShops('esthetician')).toEqual([expect.objectContaining({
      publicSlug: partner.public_slug, programs: [PROGRAM_SLUGS.esthetician, PROGRAM_SLUGS.nail], phone: '', email: '',
    })]);
    expect(await getApprovedShops('nail')).toHaveLength(1);
    expect(await getApprovedShops('barber')).toEqual([]);
  });

  it.each([
    ['pending operational approval', 'partners', { approval_status: 'pending' }],
    ['archived account', 'partners', { account_status: 'archived' }],
    ['unknown occupation', 'partners', { programs: ['unknown'] }],
    ['no public permission', 'host_shop_partnerships', { directory_listing: false }],
    ['inactive partnership', 'host_shop_partnerships', { status: 'pending' }],
    ['different profile ID', 'public_host_shops', { id: 'other-partner' }],
    ['unpublished public profile', 'public_host_shops', { public_profile_published_at: null }],
    ['synthetic identity', 'public_host_shops', { display_name: '[QA E2E] Catalog Salon' }],
  ] as const)('does not list a shop with %s', async (_label, table, change) => {
    rows[table][0] = { ...rows[table][0], ...change };
    expect(await getApprovedShops()).toEqual([]);
  });

  it('does not duplicate an already visible shop', async () => {
    rows.host_shop_applications = [{ id: 'application-1', status: 'approved', shop_name: profile.display_name, address: '', intake: { programs: partner.programs } }];
    expect(await getApprovedShops()).toHaveLength(1);
  });

  it('unions canonical approvals without changing the primary trade or losing either profile URL', async () => {
    rows.host_shops = [{ id: 'active1234', name: profile.display_name, is_approved: true, shop_status: 'active', specializations: ['cosmetology-apprenticeship'] }];
    const all = await getApprovedShops();
    expect(all).toHaveLength(1);
    expect(all[0]).toEqual(expect.objectContaining({
      id: 'active1234',
      publicSlug: partner.public_slug,
      primaryProgram: PROGRAM_SLUGS.cosmetology,
      programs: [PROGRAM_SLUGS.cosmetology, PROGRAM_SLUGS.esthetician, PROGRAM_SLUGS.nail],
    }));
    expect(await getApprovedShops('barber')).toEqual([]);
    expect(await getApprovedShops('esthetician')).toHaveLength(1);
    expect(await getApprovedShops('nail')).toHaveLength(1);
    expect((await getApprovedShopByPublicSlug(partner.public_slug))?.id).toBe('active1234');
    expect((await getApprovedShopByPublicSlug('catalog-salon-llc-active12'))?.id).toBe('active1234');
  });

  it('does not add partner trades without public directory opt-in', async () => {
    rows.host_shops = [{ id: 'active1234', name: profile.display_name, is_approved: true, shop_status: 'active', specializations: ['cosmetology-apprenticeship'] }];
    rows.host_shop_partnerships = [{ ...listing, directory_listing: false }];
    const all = await getApprovedShops();
    expect(all).toHaveLength(1);
    expect(all[0].programs).toEqual([PROGRAM_SLUGS.cosmetology]);
    expect(await getApprovedShops('esthetician')).toEqual([]);
  });
});
