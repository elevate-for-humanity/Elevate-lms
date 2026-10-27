import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { isCurrentHostShopPartner } from '@/lib/partners/host-shop-directory';

describe('Host Shop directory classification', () => {
  it('keeps pending salons available for onboarding preview', () => {
    expect(
      isCurrentHostShopPartner({
        status: 'active',
        approval_status: 'pending',
        partner_type: 'salon',
        program_type: 'cosmetology',
      }),
    ).toBe(true);
  });
  it('does not misclassify a program holder with assigned beauty programs', () => {
    expect(
      isCurrentHostShopPartner({
        status: 'active',
        approval_status: 'approved',
        partner_type: 'program_holder',
        programs: ['barber-apprenticeship', 'cosmetology-apprenticeship'],
      }),
    ).toBe(false);
  });
  it.each([
    { status: 'inactive' },
    { is_active: false },
    { approval_status: 'revoked' },
    { approval_status: 'rejected' },
  ])('excludes inactive or withdrawn shops: %j', (overrides) => {
    expect(
      isCurrentHostShopPartner({
        status: 'active',
        approval_status: 'approved',
        partner_type: 'barber_shop',
        ...overrides,
      }),
    ).toBe(false);
  });
  it('requires approval before showing an operationally ready shop', () => {
    const page = readFileSync('apps/admin/app/partners/page.tsx', 'utf8');
    expect(page).toContain("const complete = partner.approval_status === 'approved' &&");
  });
  it('does not classify unrelated employers as host shops', () => {
    expect(
      isCurrentHostShopPartner({
        status: 'active',
        partner_type: 'employer',
        programs: ['hvac-technician'],
      }),
    ).toBe(false);
  });
});
