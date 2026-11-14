import { describe, it, expect } from 'vitest';
import {
  refundPaymentOptions,
  assertTaxOfficePaymentIdentity,
} from '@/lib/tax-software/refund-payment';
const schedule = {
  version: 'test-only',
  fees: [
    { label: 'Provider processing', amountCents: 3900 },
    { label: 'Technology', amountCents: 1000 },
  ],
};
const options = (refund: number, fee = 15000) =>
  refundPaymentOptions({
    federalRefundCents: refund,
    softwareFeeCents: fee,
    feeSchedule: schedule,
  });
describe('refund-payment offers', () => {
  it('includes every disclosed fee and leaves a positive refund', () => {
    const x = options(50000);
    expect(x.totalFeesCents).toBe(19900);
    expect(x.estimatedNetRefundCents).toBe(30100);
    expect(x.canRequestRefundTransfer).toBe(true);
    expect(x.refundTransferOperational).toBe(false);
  });
  it('does not offer refund payment for zero, insufficient or exactly matching refunds', () => {
    for (const amount of [0, 100, 19900])
      expect(options(amount).canRequestRefundTransfer).toBe(false);
  });
  it('does not impose a bank product for a free return', () => {
    expect(options(50000, 0)).toMatchObject({ noFeeDue: true, canRequestRefundTransfer: false });
  });
  it('does not invent bank fees, net refund or approval when terms are missing', () => {
    expect(
      refundPaymentOptions({
        federalRefundCents: 50000,
        softwareFeeCents: 15000,
        feeSchedule: null,
      }),
    ).toMatchObject({
      providerFeeCents: null,
      estimatedNetRefundCents: null,
      approvalVerified: false,
      reason: 'provider_fee_quote_required',
    });
  });
  it('rejects invalid cents', () => {
    for (const amount of [NaN, Infinity, -1, 0.1]) expect(() => options(amount)).toThrow();
  });
});
const office = {
  legalName: 'HOTT KAMODITTY',
  dba: 'Supersonic Fast Cash',
  depositBank: 'Lili',
  accountLast4: '1234',
  settlementAccountReference: 'synthetic-merchant-account',
  verificationReference: 'synthetic-proof',
  verifiedAt: '2026-01-01T00:00:00Z',
  quickbooksRealmId: '123456',
};
describe('separate business payment accounts', () => {
  it('accepts only the verified Supersonic business identity and merchant realm', () => {
    expect(
      assertTaxOfficePaymentIdentity(office, '123456', 'Hott Kamoditty', 'Supersonic Fast Cash')
        .depositBank,
    ).toBe('Lili');
  });
  it('rejects the Elevate company, even when it also banks with Lili', () => {
    expect(() =>
      assertTaxOfficePaymentIdentity(
        office,
        '123456',
        'Elevate for Humanity',
        'Elevate for Humanity',
      ),
    ).toThrow();
    expect(() =>
      assertTaxOfficePaymentIdentity(
        { ...office, legalName: 'Elevate for Humanity' },
        '123456',
        'HOTT KAMODITTY',
        'Supersonic Fast Cash',
      ),
    ).toThrow();
  });
  it('rejects an unrelated merchant realm, unverified account or missing account reference', () => {
    expect(() =>
      assertTaxOfficePaymentIdentity(office, '999999', 'HOTT KAMODITTY', 'Supersonic Fast Cash'),
    ).toThrow();
    expect(() =>
      assertTaxOfficePaymentIdentity(
        { ...office, verificationReference: '' },
        '123456',
        'HOTT KAMODITTY',
        'Supersonic Fast Cash',
      ),
    ).toThrow();
    expect(() =>
      assertTaxOfficePaymentIdentity(
        { ...office, settlementAccountReference: '' },
        '123456',
        'HOTT KAMODITTY',
        'Supersonic Fast Cash',
      ),
    ).toThrow();
  });
});
