import { describe, it, expect } from 'vitest';
import { calculateProspectiveLateFee } from '../../lib/billing/tuition-late-fee-policy';
describe('October 28 signed tuition terms', () => {
  const base = {
    dueDate: '2026-10-01',
    outstandingCents: 10000,
    signedPolicyVersion: '2026-10-28',
  };
  it('has three grace days, begins the existing daily fee on day four, and uses $25 at day seven', () => {
    expect(calculateProspectiveLateFee({ ...base, asOfDate: '2026-10-04' }).lateFeeCents).toBe(0);
    expect(calculateProspectiveLateFee({ ...base, asOfDate: '2026-10-05' }).lateFeeCents).toBe(
      1000,
    );
    expect(calculateProspectiveLateFee({ ...base, asOfDate: '2026-10-08' })).toMatchObject({
      reviewInstructionalAccess: true,
      proposedReactivationFeeCents: 2500,
    });
  });
  it('does not retroactively charge older agreements, paid balances or funded/financed tuition', () => {
    for (const exception of [
      { signedPolicyVersion: '2026-10-16' },
      { paidInFull: true },
      { funded: true },
      { thirdPartyFinanced: true },
    ])
      expect(
        calculateProspectiveLateFee({ ...base, asOfDate: '2026-10-20', ...exception }),
      ).toMatchObject({
        lateFeeCents: 0,
        reviewInstructionalAccess: false,
        proposedReactivationFeeCents: 0,
      });
  });
});
