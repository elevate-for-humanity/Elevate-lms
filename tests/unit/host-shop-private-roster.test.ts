import { describe, expect, it } from 'vitest';
import { hasAnyRole } from '@/lib/rbac/role-matrix';
import { hostShopMatchSummary } from '@/lib/partners/host-shop-match-projection';
import { resolveHostShopProgram } from '@/lib/partners/host-shop-onboarding';
import {
  canonicalHostShopProgram, canonicalHostShopPrograms,
  hostShopMatchScopeFilter, hostShopScopeAllowsRequest,
  permittedHostShopProgramScopes, permittedHostShopProgramSlugs,
} from '@/lib/partners/host-shop-match-access';

describe('Host Shop application privacy', () => {
  it('reveals only assigned student name/email and basic request status', () => {
    const response = hostShopMatchSummary({
      id: 'request-id', status: 'pending', program_slug: 'esthetician-apprenticeship',
      created_at: '2026-11-07T00:00:00Z',
      message: 'Sensitive narrative', apprentice_notes: 'Sensitive notes',
      shop_notes: 'Private review', admin_notes: 'Private admin',
      apprentice: {
        id: 'student-id', full_name: 'Example Student', email: 'example@example.org',
        phone: '555-555-5555', date_of_birth: '2000-01-01',
        address: 'private street', government_id: 'private',
      },
      shop: { address: 'internal', owner_email: 'private' },
      placement: { id: 'private' },
    });
    expect(response).toEqual({
      id: 'request-id', status: 'pending',
      program_slug: 'esthetician-apprenticeship',
      created_at: '2026-11-07T00:00:00Z',
      apprentice: { full_name: 'Example Student', email: 'example@example.org' },
    });
    expect(JSON.stringify(response)).not.toMatch(/Sensitive|555-555|private|date_of_birth/);
  });

  it('never substitutes generic salon cosmetology for explicitly assigned esthetics/nails', () => {
    expect(resolveHostShopProgram({
      partner_type: 'salon',
      program_type: 'beauty-multi-program',
      programs: ['esthetician-apprenticeship', 'nail-technician-apprenticeship'],
    })).toBe('esthetician');
  });
});

describe('Host Shop assigned-program routing', () => {
  it('denies program visibility when no authorized active membership exists', async () => {
    const db = { from: () => ({
      select: () => ({
        eq: () => ({
          eq: async () => ({ data: [], error: null }),
        }),
      }),
    }) };
    expect(await permittedHostShopProgramSlugs(db, 'user-a')).toEqual([]);
  });

  it('returns only exact programs of approved active partner memberships', async () => {
    const db = {
      from: (table: string) => {
        const query: any = {
          select: () => query,
          eq: () => query,
          in: () => query,
          neq: () => query,
          then: (resolve: (value: unknown) => void) =>
            Promise.resolve(
              table === 'partner_users'
                ? { data: [{ partner_id: 'approved-shop', role: 'partner_admin' }], error: null }
                : { data: [{
                  id: 'approved-shop',
                  status: 'active',
                  approval_status: 'approved',
                  programs: ['esthetician-apprenticeship', 'nail-technician-apprenticeship'],
                }], error: null },
            ).then(resolve),
        };
        return query;
      },
    };
    expect(await permittedHostShopProgramSlugs(db, 'user-a')).toEqual([
      'esthetician-apprenticeship', 'nail-technician-apprenticeship',
    ]);
  });
});

describe('archived Program Holder cannot inherit privileged dashboards', () => {
  it('keeps the Host Shop role separate from Program Holder and platform Admin', () => {
    expect(hasAnyRole(['host_shop'], ['host_shop'])).toBe(true);
    expect(hasAnyRole(['host_shop'], ['program_holder', 'site_coordinator'])).toBe(false);
    expect(hasAnyRole(['host_shop'], ['admin', 'super_admin', 'org_admin'])).toBe(false);
  });
});

describe('independent exact approved shop + program privacy regressions', () => {
  const barberPartner = 'a1111111-1111-4111-8111-111111111111';
  const salonPartner = 'b2222222-2222-4222-8222-222222222222';
  const barberShop = 'c3333333-3333-4333-8333-333333333333';
  const salonShop = 'd4444444-4444-4444-8444-444444444444';

  function twoPartnerDb() {
    const rows: Record<string, unknown[]> = {
      partner_users: [
        { partner_id: barberPartner, role: 'partner_admin' },
        { partner_id: salonPartner, role: 'owner' },
      ],
      partners: [
        { id: barberPartner, status: 'active', approval_status: 'approved', is_active: true, programs: ['BARBER'] },
        { id: salonPartner, status: 'active', approval_status: 'approved', is_active: true,
          programs: ['esthetician-apprenticeship', 'nail-technician-apprenticeship'] },
      ],
      shops: [
        { id: barberShop, partner_id: barberPartner, active: true },
        { id: salonShop, partner_id: salonPartner, active: true },
      ],
    };
    return { from: (table: string) => {
      const query: any = {
        select: () => query, eq: () => query, neq: () => query, in: () => query,
        then: (resolve: (value: unknown) => void) =>
          Promise.resolve({ data: rows[table] || [], error: null }).then(resolve),
      };
      return query;
    } };
  }

  it('canonicalizes only approved legacy program labels, not generic salon or arbitrary input', () => {
    expect(canonicalHostShopPrograms(['BARBER', 'barber-apprenticeship', 'cosmetology', 'nail_technician']))
      .toEqual(['barber-apprenticeship', 'cosmetology-apprenticeship', 'nail-technician-apprenticeship']);
    expect(canonicalHostShopProgram('salon')).toBeNull();
    expect(canonicalHostShopProgram('barber),host_shop_id.not.is.null')).toBeNull();
  });

  it('does not let access to an esthetics shop grant esthetics access at a separate barber shop', async () => {
    const scopes = await permittedHostShopProgramScopes(twoPartnerDb(), 'shared-owner');
    expect(scopes).toEqual([
      { shopId: barberShop, partnerId: barberPartner, programSlugs: ['barber-apprenticeship'] },
      { shopId: salonShop, partnerId: salonPartner,
        programSlugs: ['esthetician-apprenticeship', 'nail-technician-apprenticeship'] },
    ]);
    expect(hostShopScopeAllowsRequest(scopes, barberShop, 'barber-apprenticeship')).toBe(true);
    expect(hostShopScopeAllowsRequest(scopes, barberShop, 'esthetician-apprenticeship')).toBe(false);
    expect(hostShopScopeAllowsRequest(scopes, salonShop, 'barber-apprenticeship')).toBe(false);
    expect(hostShopScopeAllowsRequest(scopes, salonShop, 'nail-technician-apprenticeship')).toBe(true);
    expect(hostShopScopeAllowsRequest(scopes, 'another-shop', 'esthetician-apprenticeship')).toBe(false);

    const filter = hostShopMatchScopeFilter(scopes);
    expect(filter).toContain('and(host_shop_id.eq.' + barberShop + ',program_slug.eq.barber-apprenticeship)');
    expect(filter).toContain('and(host_shop_id.eq.' + salonShop + ',program_slug.eq.esthetician-apprenticeship)');
    expect(filter).not.toContain('and(host_shop_id.eq.' + barberShop + ',program_slug.eq.esthetician-apprenticeship)');
    expect(filter).not.toContain('and(host_shop_id.eq.' + salonShop + ',program_slug.eq.barber-apprenticeship)');
  });

  it('does not emit a PostgREST filter for invalid or unapproved shop identifiers', () => {
    expect(hostShopMatchScopeFilter([{ shopId: 'not-a-uuid', partnerId: barberPartner,
      programSlugs: ['barber-apprenticeship'] }])).toBe('');
  });
});
