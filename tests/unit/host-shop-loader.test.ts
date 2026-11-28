import { beforeEach, describe, expect, it, vi } from 'vitest';
type QueryResult = { data: Record<string, unknown>[] | null; error: { message: string } | null };
type QueryBuilder = { select: () => QueryBuilder; eq: () => QueryBuilder; in: () => QueryBuilder; not: () => QueryBuilder; or: (filter: string) => QueryBuilder; order: () => QueryBuilder; then: (resolve: (result: QueryResult) => unknown) => Promise<unknown> };
const fixture = vi.hoisted(() => ({ rows: {} as Record<string, QueryResult>, filters: [] as string[] }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => ({
  from: (table: string) => {
    const query: QueryBuilder = { select: () => query, eq: () => query, in: () => query, not: () => query,
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
      partners: { data: [], error: null }, host_shop_partnerships: { data: [], error: null },
      barbershop_partner_applications: { data: [{ id: 'barber-1', shop_legal_name: 'Style and Scissors', shop_city: 'Indianapolis' }], error: null },
      host_shop_applications: { data: [{ id: 'host-2', shop_name: 'Unclassified studio', intake: {}, approved_by: null }], error: null },
      public_host_shops: { data: [{ id: 'profile-1', public_slug: 'style-and-scissors-hair-salon', display_name: 'Style and Scissors', programs: ['cosmetology', 'barber', 'nail_technician'] }], error: null },
    };
  });
  function linkedExecutiveWorksite() {
    fixture.rows.barbershop_partner_applications.data = [];
    fixture.rows.public_host_shops.data = [];
    fixture.rows.host_shop_applications.data = [{
      id: '5e8e1f9a-0000', shop_name: 'Executive Cutz',
      address: '2049 Veterans Memorial Pkwy S, Suite 8, Lafayette, IN 47909',
      phone: '3175550112', intake: { programs: ['barber'] }, approved_by: null,
    }];
    fixture.rows.host_shops.data = [{
      id: '787ce25f-0000', name: 'Executive Cuts', address: '2049 Veterans Memorial Pkwy S, Suite 8',
      city: 'Lafayette', state: 'IN', zip_code: '47909', specializations: ['cosmetology'],
    }];
    fixture.rows.host_shop_partnerships.data = [{
      partner_id: 'approved-owner', application_id: '5e8e1f9a-0000', shop_id: '787ce25f-0000',
    }];
  }
  it('lists an explicitly linked worksite once and keeps the old public profile URL resolving without exposing intake contacts', async () => {
    linkedExecutiveWorksite();
    const all = await getApprovedShops();
    expect(all).toHaveLength(1);
    expect(all[0]).toMatchObject({
      id: '5e8e1f9a-0000', name: 'Executive Cutz', phone: '', email: '',
      publicSlug: 'executive-cutz-5e8e1f9a', publicSlugAliases: ['executive-cuts-787ce25f'],
      programs: ['barber-apprenticeship', 'cosmetology-apprenticeship'],
    });
    expect((await getApprovedShopByPublicSlug('executive-cuts-787ce25f'))?.publicSlug)
      .toBe('executive-cutz-5e8e1f9a');
    expect(await getApprovedShops('cosmetology')).toHaveLength(1);
  });
  it('preserves separately listed shops if an exact active link or complete matching worksite is missing', async () => {
    linkedExecutiveWorksite();
    const original = fixture.rows.host_shop_partnerships.data;
    fixture.rows.host_shop_partnerships.data = [];
    expect(await getApprovedShops()).toHaveLength(2);
    fixture.rows.host_shop_partnerships.data = original;
    fixture.rows.host_shops.data![0].address = '2049 Veterans Memorial Pkwy S, Suite 9';
    expect(await getApprovedShops()).toHaveLength(2);
  });
  it('does not let an archived application absorb an eligible active worksite or its URL', async () => {
    linkedExecutiveWorksite();
    fixture.rows.partners.data = [{ name: 'Executive Cutz' }];
    const all = await getApprovedShops();
    expect(all).toHaveLength(1);
    expect(all[0]).toMatchObject({
      id: '787ce25f-0000', publicSlug: 'executive-cuts-787ce25f',
      programs: ['cosmetology-apprenticeship'],
    });
    expect(await getApprovedShopByPublicSlug('executive-cutz-5e8e1f9a')).toBeNull();
    expect((await getApprovedShopByPublicSlug('executive-cuts-787ce25f'))?.id).toBe('787ce25f-0000');
  });
  it('does not inherit occupations or a website from an archived active alias', async () => {
    linkedExecutiveWorksite();
    fixture.rows.partners.data = [{ name: 'Executive Cuts' }];
    fixture.rows.host_shops.data![0].website = 'https://retired.example.test';
    const all = await getApprovedShops();
    expect(all).toHaveLength(1);
    expect(all[0]).toMatchObject({ id: '5e8e1f9a-0000', programs: ['barber-apprenticeship'] });
    expect(all[0].website).toBeUndefined();
    expect(await getApprovedShopByPublicSlug('executive-cuts-787ce25f')).toBeNull();
  });
  it('preserves an eligible public website on canonical and old URLs without copying operational contacts', async () => {
    linkedExecutiveWorksite();
    fixture.rows.host_shops.data![0].website = 'https://executive.example.test';
    fixture.rows.host_shops.data![0].phone = '3175550199';
    for (const slug of ['executive-cutz-5e8e1f9a', 'executive-cuts-787ce25f']) {
      expect(await getApprovedShopByPublicSlug(slug)).toMatchObject({
        id: '5e8e1f9a-0000', website: 'https://executive.example.test', phone: '', email: '',
      });
    }
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
  it('keeps eligible application-backed shops visible without publishing their intake numbers', async () => {
    fixture.rows.barbershop_partner_applications.data![0].contact_phone = '3175550111';
    fixture.rows.host_shop_applications.data![0].phone = '3175550112';
    fixture.rows.public_host_shops.data![0].phone = '3175550113';

    const unsourced = await getApprovedShops();
    expect(unsourced.map(({ id, phone }) => ({ id, phone }))).toEqual([
      { id: 'barber-1', phone: '' },
      { id: 'host-2', phone: '' },
    ]);

    fixture.rows.public_host_shops.data![0].source_url = 'https://shop.example.test/contact';
    const sourced = await getApprovedShopByPublicSlug('style-and-scissors-hair-salon');
    expect(sourced).toMatchObject({ id: 'barber-1', phone: '3175550113' });
  });
  it('resolves an approved shop profile by its published link', async () => {
    expect((await getApprovedShopByPublicSlug('style-and-scissors-hair-salon'))?.id).toBe('barber-1');
  });
  it('preserves the prior application URL for an explicitly linked public profile', async () => {
    fixture.rows.partners.data = [{
      id: 'partner-linked', public_slug: 'new-approved-name', programs: ['cosmetology'],
      address: '120 E Market St, Suite 930',
    }];
    fixture.rows.host_shop_partnerships.data = [{ partner_id: 'partner-linked', application_id: 'barber-1' }];
    fixture.rows.public_host_shops.data = [{
      id: 'partner-linked', public_slug: 'new-approved-name', display_name: 'New Approved Name',
      public_profile_published_at: '2026-11-25T00:00:00Z', city: 'Indianapolis', state: 'IN', zip: '46204',
    }];

    const shop = await getApprovedShopByPublicSlug('style-and-scissors-barber1');
    expect(shop).toMatchObject({
      id: 'barber-1',
      publicSlug: 'new-approved-name',
      address: '120 E Market St, Suite 930',
      programs: ['barber-apprenticeship', 'cosmetology-apprenticeship'],
    });
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

it('does not treat a saved public media profile as formal approval', async () => {
  fixture.rows = {
    host_shops: { data: [], error: null }, partners: { data: [], error: null }, host_shop_partnerships: { data: [], error: null },
    barbershop_partner_applications: { data: [], error: null },
    host_shop_applications: { data: [], error: null },
    public_host_shops: { data: [{ id: 'pending', display_name: 'Pending Salon', public_slug: 'pending-salon', programs: ['cosmetology'] }], error: null },
  };
  expect(await getApprovedShops()).toEqual([]);
});

it.each(['Marvelous Cuts', 'Marvelouz Cutz', 'Marvelous-Cuts'])('excludes the owner-removed business %s even if an old approval remains', async (name) => {
  fixture.rows = {
    host_shops: { data: [], error: null }, partners: { data: [], error: null }, host_shop_partnerships: { data: [], error: null },
    barbershop_partner_applications: { data: [{ id: 'old', shop_legal_name: name }], error: null },
    host_shop_applications: { data: [], error: null }, public_host_shops: { data: [], error: null },
  };
  expect(await getApprovedShops()).toEqual([]);
});
