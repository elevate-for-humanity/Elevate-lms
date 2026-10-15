import { beforeEach, describe, expect, it, vi } from 'vitest';
type QueryResult = { data: Record<string, unknown>[] | null; error: { message: string } | null };
type QueryBuilder = { select: () => QueryBuilder; eq: () => QueryBuilder; in: () => QueryBuilder; or: (filter: string) => QueryBuilder; order: () => QueryBuilder; then: (resolve: (result: QueryResult) => unknown) => Promise<unknown> };
const fixture = vi.hoisted(() => ({ rows: {} as Record<string, QueryResult>, filters: [] as string[] }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => ({
  from: (table: string) => {
    const query: QueryBuilder = { select: () => query, eq: () => query, in: () => query,
      or: (filter: string) => { fixture.filters.push(filter); return query; },
      order: () => query,
      then: (resolve: (result: QueryResult) => unknown) => Promise.resolve(fixture.rows[table]).then(resolve),
    };
    return query;
  },
}) }));
import { getApprovedShops, getApprovedShopByPublicSlug } from '@/lib/programs/host-shops';

describe('approved host directory data', () => {
  beforeEach(() => {
    fixture.filters = [];
    fixture.rows = {
      host_shops: { data: [], error: null },
      partners: { data: [], error: null },
      barbershop_partner_applications: { data: [{ id: 'barber-1', shop_legal_name: 'Style and Scissors', shop_city: 'Indianapolis' }], error: null },
      host_shop_applications: { data: [{ id: 'host-2', shop_name: 'Unclassified studio', intake: {}, approved_by: null }], error: null },
      public_host_shops: { data: [{ id: 'profile-1', public_slug: 'style-and-scissors-hair-salon', display_name: 'Style and Scissors', programs: ['cosmetology', 'barber', 'nail_technician'] }], error: null },
    };
  });
  it('uses public programme approvals without duplicating the operational shop', async () => {
    const all = await getApprovedShops();
    expect(all).toHaveLength(2);
    expect(all[0].programs).toEqual(['barber-apprenticeship', 'cosmetology-apprenticeship', 'nail-technician-apprenticeship']);
    expect(all[0].primaryProgram).toBe('cosmetology-apprenticeship');
    expect(all[1].programs).toEqual([]);
    expect(fixture.filters).toContain('approved_by.is.null,approved_by.neq.system_verification');
  });
  it('keeps a salon without barber approval out of barber results and includes its approved nail pathway', async () => {
    fixture.rows.public_host_shops.data![0].programs = ['cosmetology', 'nail_technician'];
    fixture.rows.barbershop_partner_applications.data = [];
    fixture.rows.host_shop_applications.data!.push({ id: 'salon-only', shop_name: 'Style and Scissors', intake: { programs: ['cosmetology', 'nail_technician'] }, approved_by: null });
    expect(await getApprovedShops('barber')).toHaveLength(0);
    expect(await getApprovedShops('cosmetology')).toHaveLength(1);
    expect(await getApprovedShops('nail')).toHaveLength(1);
    expect(await getApprovedShops('esthetician')).toHaveLength(0);
  });
  it('resolves an approved shop profile by its published link', async () => {
    expect((await getApprovedShopByPublicSlug('style-and-scissors-hair-salon'))?.id).toBe('barber-1');
  });
  it('reports a directory query failure rather than showing a false empty category', async () => {
    fixture.rows.public_host_shops = { data: null, error: { message: 'unavailable' } };
    await expect(getApprovedShops()).rejects.toThrow('HOST_SHOP_DIRECTORY_QUERY_FAILED:unavailable');
  });
  it('includes an active approved operational shop missing from application records', async () => {
    fixture.rows.host_shops = { data: [{id:'aaaa1111-2222-4333-8444-555555555555',name:'J Noelle & Co.',city:'West Lafayette',state:'Indiana',specializations:['cosmetology-apprenticeship']}], error:null };
    const shops = await getApprovedShops('cosmetology');
    expect(shops.some((shop) => shop.name === 'J Noelle & Co.' && shop.publicSlug === 'j-noelle-co')).toBe(true);
  });
  it('does not resurrect an archived shop from historical approved applications', async () => {
    fixture.rows.partners = {data:[{name:'Style and Scissors'}],error:null};
    expect((await getApprovedShops()).some((shop) => shop.name === 'Style and Scissors')).toBe(false);
  });

});
