import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getApprovedShops, getApprovedShopByPublicSlug, PROGRAM_SLUGS } from '@/lib/programs/host-shops';

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
const profile = { id: partner.id, display_name: 'Catalog Salon LLC', public_slug: partner.public_slug, public_profile_published_at: published, address_line1: '123 Main St', city: 'Indianapolis', state: 'IN', zip: '46201', programs: ['barber-apprenticeship'], phone: 'unverified' };
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
    rows.host_shop_partnerships = [{ ...listing, application_id: 'application-1' }];
    expect(await getApprovedShops()).toHaveLength(1);
  });

  it('unions canonical approvals without changing the primary trade or losing either profile URL', async () => {
    rows.host_shops = [{ id: 'active1234', name: profile.display_name, is_approved: true, shop_status: 'active', specializations: ['cosmetology-apprenticeship'] }];
    rows.host_shop_partnerships = [{ ...listing, shop_id: 'active1234' }];
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

  it('does not combine identically named approved shops at different worksites', async () => {
    rows.host_shop_applications = [{ id: 'unrelated', status: 'approved', shop_name: profile.display_name, address: '456 Other St, Indianapolis, IN 46202', intake: { programs: ['cosmetology'] } }];
    const all = await getApprovedShops();
    expect(all).toHaveLength(2);
    expect(all.find(shop => shop.id === 'unrelated')).toEqual(expect.objectContaining({ programs: [PROGRAM_SLUGS.cosmetology] }));
    expect(all.find(shop => shop.id === 'unrelated')?.publicSlug).not.toBe(partner.public_slug);
    expect((await getApprovedShopByPublicSlug(partner.public_slug))?.id).toBe(partner.id);
    expect(await getApprovedShops('esthetician')).toHaveLength(1);
    expect(await getApprovedShops('barber')).toEqual([]);
  });

  it('corroborates a legacy application by complete worksite address, preserving one canonical profile', async () => {
    rows.host_shop_applications = [{ id: 'legacy', status: 'approved', shop_name: profile.display_name, address: '123 Main St., Indianapolis, IN 46201', intake: { programs: ['cosmetology'] } }];
    const all = await getApprovedShops();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe('legacy');
    expect(all[0].programs).toContain(PROGRAM_SLUGS.cosmetology);
    expect(all[0].programs).toContain(PROGRAM_SLUGS.esthetician);
    expect(all[0].programs).not.toContain(PROGRAM_SLUGS.barber);
  });

  it('preserves distinct canonical partner identities even at a shared address', async () => {
    const second = { ...partner, id: 'other-partner', public_slug: 'other-salon', programs: ['cosmetology'] };
    rows.partners.push(second);
    rows.public_host_shops.push({ ...profile, id: second.id, public_slug: second.public_slug });
    rows.host_shop_partnerships.push({ ...listing, partner_id: second.id });
    const all = await getApprovedShops();
    expect(all).toHaveLength(2);
    expect(all.find(shop => shop.id === second.id)?.programs).toEqual([PROGRAM_SLUGS.cosmetology]);
    expect(all.find(shop => shop.id === partner.id)?.programs).toEqual([PROGRAM_SLUGS.esthetician, PROGRAM_SLUGS.nail]);
  });

  it('does not let multiple canonical partners claim one ambiguous legacy application', async () => {
    const second = { ...partner, id: 'other-partner', public_slug: 'other-salon', programs: ['barber'] };
    rows.partners.push(second);
    rows.public_host_shops.push({ ...profile, id: second.id, public_slug: second.public_slug });
    rows.host_shop_partnerships.push({ ...listing, partner_id: second.id });
    rows.host_shop_applications = [{
      id: 'ambiguous-legacy', status: 'approved', shop_name: profile.display_name,
      address: '123 Main St, Indianapolis, IN 46201', intake: { programs: ['cosmetology'] },
    }];

    const all = await getApprovedShops();
    expect(all).toHaveLength(3);
    expect(all.find(shop => shop.id === 'ambiguous-legacy')?.programs).toEqual([PROGRAM_SLUGS.cosmetology]);
    expect(all.find(shop => shop.id === partner.id)?.programs).toEqual([PROGRAM_SLUGS.esthetician, PROGRAM_SLUGS.nail]);
    expect(all.find(shop => shop.id === second.id)?.programs).toEqual([PROGRAM_SLUGS.barber]);
    expect((await getApprovedShopByPublicSlug(partner.public_slug))?.id).toBe(partner.id);
    expect((await getApprovedShopByPublicSlug(second.public_slug))?.id).toBe(second.id);
  });

  it('does not treat a matching name without location evidence as identity', async () => {
    rows.host_shops = [{ id: 'unlinked', name: profile.display_name, is_approved: true, shop_status: 'active', specializations: ['cosmetology'] }];
    expect(await getApprovedShops()).toHaveLength(2);
    expect((await getApprovedShopByPublicSlug(partner.public_slug))?.id).toBe(partner.id);
  });

  it('keeps same-name barber and general applications at separate worksites', async () => {
    rows.barbershop_partner_applications = [{ id: 'barber-east', status: 'approved', shop_legal_name: 'Example Studio', shop_address_line1: '10 East St', shop_city: 'Indianapolis', shop_state: 'IN', shop_zip: '46201' }];
    rows.host_shop_applications = [{ id: 'salon-west', status: 'approved', shop_name: 'Example Studio', address: '20 West St, Indianapolis, IN 46202', intake: { programs: ['cosmetology'] } }];
    const all = await getApprovedShops();
    expect(all.find(shop => shop.id === 'barber-east')?.programs).toEqual([PROGRAM_SLUGS.barber]);
    expect(all.find(shop => shop.id === 'salon-west')?.programs).toEqual([PROGRAM_SLUGS.cosmetology]);
  });

  it('does not hide an independently approved active worksite by business name', async () => {
    rows.barbershop_partner_applications = [{ id: 'barber-east', status: 'approved', shop_legal_name: 'Example Studio', shop_address_line1: '10 East St', shop_city: 'Indianapolis', shop_state: 'IN', shop_zip: '46201' }];
    rows.host_shops = [{ id: 'salon-west', name: 'Example Studio', is_approved: true, shop_status: 'active', address: '20 West St', city: 'Indianapolis', state: 'IN', zip_code: '46202', specializations: ['cosmetology'] }];
    const all = await getApprovedShops();
    expect(all.find(shop => shop.id === 'barber-east')?.programs).toEqual([PROGRAM_SLUGS.barber]);
    expect(all.find(shop => shop.id === 'salon-west')?.programs).toEqual([PROGRAM_SLUGS.cosmetology]);
  });

  it('merges corroborated application worksites and preserves the historical general application URL', async () => {
    rows.barbershop_partner_applications = [{ id: 'barber-east', status: 'approved', shop_legal_name: 'Example Studio', shop_address_line1: '10 East St', shop_city: 'Indianapolis', shop_state: 'IN', shop_zip: '46201' }];
    rows.host_shop_applications = [{ id: 'salon-east', status: 'approved', shop_name: 'Example Studio', address: '10 East St, Indianapolis, IN 46201', intake: { programs: ['cosmetology'] } }];
    const all = await getApprovedShops();
    expect(all.find(shop => shop.id === 'barber-east')?.programs).toEqual([PROGRAM_SLUGS.barber, PROGRAM_SLUGS.cosmetology]);
    expect(all.find(shop => shop.id === 'salon-east')).toBeUndefined();
    expect((await getApprovedShopByPublicSlug('example-studio-saloneas'))?.id).toBe('barber-east');
  });

  it('merges matching suite addresses from barber and general applications', async () => {
    rows.partners = [];
    rows.public_host_shops = [];
    rows.host_shop_partnerships = [];
    rows.barbershop_partner_applications = [{
      id: 'barber-suite', status: 'approved', shop_legal_name: 'Example Studio',
      shop_address_line1: '10 East St', shop_address_line2: 'Suite 2',
      shop_city: 'Indianapolis', shop_state: 'IN', shop_zip: '46201',
    }];
    rows.host_shop_applications = [{
      id: 'salon-suite', status: 'approved', shop_name: 'Example Studio',
      address: '10 East St, Suite 2, Indianapolis, IN 46201', intake: { programs: ['cosmetology'] },
    }];

    const all = await getApprovedShops();
    expect(all).toHaveLength(1);
    expect(all[0]).toEqual(expect.objectContaining({
      id: 'barber-suite',
      address: '10 East St, Suite 2',
      programs: [PROGRAM_SLUGS.barber, PROGRAM_SLUGS.cosmetology],
    }));
    expect((await getApprovedShopByPublicSlug('example-studio-salonsui'))?.id).toBe('barber-suite');
  });

  it('keeps different suites at one street address as separate worksites', async () => {
    rows.partners = [];
    rows.public_host_shops = [];
    rows.host_shop_partnerships = [];
    rows.barbershop_partner_applications = [{
      id: 'barber-suite-2', status: 'approved', shop_legal_name: 'Example Studio',
      shop_address_line1: '10 East St', shop_address_line2: 'Suite 2',
      shop_city: 'Indianapolis', shop_state: 'IN', shop_zip: '46201',
    }];
    rows.host_shop_applications = [{
      id: 'salon-suite-3', status: 'approved', shop_name: 'Example Studio',
      address: '10 East St, Suite 3, Indianapolis, IN 46201', intake: { programs: ['cosmetology'] },
    }];

    const all = await getApprovedShops();
    expect(all).toHaveLength(2);
    expect(all.find(shop => shop.id === 'barber-suite-2')?.programs).toEqual([PROGRAM_SLUGS.barber]);
    expect(all.find(shop => shop.id === 'salon-suite-3')?.programs).toEqual([PROGRAM_SLUGS.cosmetology]);
  });

  it('does not publish application contact emails without verified consent', async () => {
    rows.partners = [];
    rows.public_host_shops = [];
    rows.host_shop_partnerships = [];
    rows.barbershop_partner_applications = [{
      id: 'barber-email', status: 'approved', shop_legal_name: 'Private Contact Barber',
      shop_address_line1: '1 Main St', shop_city: 'Indianapolis', shop_state: 'IN', shop_zip: '46201',
      contact_email: 'private-barber@example.test',
    }];
    rows.host_shop_applications = [{
      id: 'salon-email', status: 'approved', shop_name: 'Private Contact Salon',
      address: '2 Main St, Indianapolis, IN 46201', intake: { programs: ['cosmetology'] },
      email: 'private-salon@example.test',
    }];

    const all = await getApprovedShops();
    expect(all.map(shop => shop.email)).toEqual(['', '']);
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
