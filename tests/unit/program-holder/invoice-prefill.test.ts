import { describe, it, expect } from 'vitest';
import { invoicePrefill } from '../../../lib/program-holder/invoice-prefill';
import { nextOrientationPosition } from '../../../lib/program-holder/orientation-progress';
import { w9Schema } from '../../../lib/program-holder/w9-form';
const features = {
  compensation_terms: {
    per_student_total_cents: 100000,
    start_installment_cents: 40000,
    completion_installment_cents: 60000,
  },
};
const schedule = {
  id: 'one',
  total_payout_cents: 100000,
  increment_1_cents: 40000,
  increment_2_cents: 60000,
  increment_1_status: 'paid',
  increment_2_status: 'pending',
};
describe('holder invoice suggestions', () => {
  it('uses individual terms before the holder default and subtracts recorded payments once', () => {
    expect(
      invoicePrefill(
        features,
        true,
        schedule,
        [{ status: 'paid', amount_cents: 10000, installment: 2 }],
        'completion',
      ).amountCents,
    ).toBe(50000);
    expect(
      invoicePrefill(
        features,
        true,
        schedule,
        [{ status: 'paid', amount_cents: 40000, installment: 1 }],
        'start',
      ).amountCents,
    ).toBe(0);
  });
  it('does not borrow another holder rate or guess an unsigned/missing installment', () => {
    expect(invoicePrefill(features, false, null, [], 'start').amountCents).toBeNull();
    expect(invoicePrefill({}, true, null, [], 'start').amountCents).toBeNull();
    expect(invoicePrefill(features, true, null, [], 'start').amountCents).toBe(40000);
  });
  it('blocks pending, held, malformed and unmatched payment records', () => {
    expect(
      invoicePrefill(
        features,
        true,
        schedule,
        [{ status: 'pending', amount_cents: 60000, installment: 2 }],
        'completion',
      ).amountCents,
    ).toBeNull();
    expect(
      invoicePrefill(features, true, { ...schedule, increment_1_status: 'held' }, [], 'start')
        .amountCents,
    ).toBeNull();
    expect(
      invoicePrefill(features, true, { ...schedule, total_payout_cents: 999 }, [], 'start')
        .amountCents,
    ).toBeNull();
    expect(
      invoicePrefill(
        features,
        true,
        null,
        [{ status: 'paid', amount_cents: 40000, installment: 1 }],
        'start',
      ).amountCents,
    ).toBeNull();
  });
});
const w9 = {
  legalName: 'Example Owner',
  businessName: '',
  classification: 'individual',
  llcClass: '',
  otherClass: '',
  foreignOwners: false,
  exemptPayee: '',
  fatca: '',
  address: '123 Example St',
  cityStateZip: 'Indianapolis IN 46204',
  accounts: '',
  tinType: 'ein',
  tin: '12-3456789',
  backupWithholding: false,
  usPerson: true,
  signature: 'Example Owner',
  certified: true,
};
describe('W-9 validation', () => {
  it('requires personal certification, complete tax classification and nine-digit TIN', () => {
    expect(w9Schema.safeParse(w9).success).toBe(true);
    expect(w9Schema.safeParse({ ...w9, certified: false }).success).toBe(false);
    expect(w9Schema.safeParse({ ...w9, usPerson: false }).success).toBe(false);
    expect(w9Schema.safeParse({ ...w9, tin: '000000000' }).success).toBe(false);
    expect(w9Schema.safeParse({ ...w9, classification: 'llc' }).success).toBe(false);
    expect(w9Schema.safeParse({ ...w9, foreignOwners: true }).success).toBe(false);
    expect(w9Schema.safeParse({ ...w9, exemptPayee: '99' }).success).toBe(false);
    expect(w9Schema.safeParse({ ...w9, exemptPayee: '13' }).success).toBe(true);
  });
});

describe('orientation playback credit', () => {
  it('rejects skips and invalid timestamps but allows contiguous playback and replay', () => {
    expect(nextOrientationPosition(0, 300, 10, 300)).toBeNull();
    expect(nextOrientationPosition(40, 10, 10, 300)).toBe(40);
    expect(nextOrientationPosition(40, 50, 10, 300)).toBe(50);
    expect(nextOrientationPosition(0, 100, 86400, 300)).toBeNull();
    expect(nextOrientationPosition(0, NaN, 10, 300)).toBeNull();
  });
});
