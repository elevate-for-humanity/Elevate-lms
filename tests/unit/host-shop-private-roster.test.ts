import { describe, expect, it } from 'vitest';
import { hostShopMatchSummary } from '@/lib/partners/host-shop-match-projection';
import { resolveHostShopProgram } from '@/lib/partners/host-shop-onboarding';
import { permittedHostShopProgramSlugs } from '@/lib/partners/host-shop-match-access';

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
