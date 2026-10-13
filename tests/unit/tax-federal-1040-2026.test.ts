import { describe, it, expect } from 'vitest';
import {
  calculateFederal1040_2026,
  selfEmploymentTax2026,
  taxableSocialSecurity2026,
  taxTable2026,
  qualifiedDividendTax2026,
} from '@/lib/tax-software/calculation/federal-1040-2026';
describe('2026 federal return calculations', () => {
  it('reconciles rounded self-employment tax lines with the reported total', () => {
    const r = selfEmploymentTax2026(10030);
    expect(r.netEarnings).toBe(9263);
    expect(r.tax).toBe(r.socialSecurityTax + r.medicareTax);
    expect(r.tax).toBe(1418);
  });
  it('computes the published ATS scenario 5 W-2 using the IRS table interval', () => {
    const r = calculateFederal1040_2026({
      filingStatus: 'single',
      wages: [{ wages: 50510, federalWithholding: 10268 }],
    });
    expect(r.adjustedGrossIncome).toBe(50510);
    expect(r.deduction).toBe(16100);
    expect(r.taxableIncome).toBe(34410);
    expect(r.incomeTax).toBe(3883);
    expect(r.refundAmount).toBe(6385);
  });
  it('uses table midpoints below 100000 and the rate schedule above', () => {
    expect(taxTable2026(34400, 'single')).toBe(3883);
    expect(taxTable2026(34449, 'single')).toBe(3883);
    expect(taxTable2026(34450, 'single')).toBe(3889);
    expect(taxTable2026(100000, 'single')).toBe(16712);
  });
  it('caps self-employment Social Security at the remaining wage base', () => {
    const r = selfEmploymentTax2026(20000, 184500);
    expect(r.socialSecurityTax).toBe(0);
    expect(r.medicareTax).toBe(536);
    expect(r.tax).toBe(536);
    expect(r.deduction).toBe(268);
  });
  it('keeps a negative AGI and tracks unused capital losses', () => {
    const r = calculateFederal1040_2026({
      filingStatus: 'single',
      wages: [],
      shortTermGainLoss: -7000,
    });
    expect(r.adjustedGrossIncome).toBe(-3000);
    expect(r.capitalLossCarryforward).toBe(4000);
    expect(r.taxableIncome).toBe(0);
  });
  it('applies the married separate capital loss limit', () => {
    expect(
      calculateFederal1040_2026({
        filingStatus: 'married_separate',
        wages: [],
        longTermGainLoss: -6000,
      }).capitalLossCarryforward,
    ).toBe(4500);
  });
  it('applies zero and fifteen percent preferential tiers without adding dividends twice', () => {
    expect(qualifiedDividendTax2026(49000, 49000, 'single')).toBe(0);
    const r = calculateFederal1040_2026({
      filingStatus: 'single',
      wages: [],
      ordinaryDividends: 60000,
      qualifiedDividends: 60000,
    });
    expect(r.totalIncome).toBe(60000);
    expect(r.incomeTax).toBe(0);
  });
  it('limits taxable benefits to 85 percent and handles joint thresholds', () => {
    expect(taxableSocialSecurity2026(20000, 0, 0, 'single')).toBe(0);
    expect(taxableSocialSecurity2026(20000, 100000, 0, 'single')).toBe(17000);
    expect(taxableSocialSecurity2026(20000, 25000, 0, 'married_joint')).toBe(1500);
  });
  it('does not apply the same Social Security wage base to spouses collectively', () => {
    const r = calculateFederal1040_2026({
      filingStatus: 'married_joint',
      wages: [],
      selfEmployment: [
        { owner: 'primary', netProfit: 10000 },
        { owner: 'spouse', netProfit: 10000 },
      ],
    });
    expect(r.selfEmploymentTax).toBe(2826);
  });
  it('rejects invalid monetary inputs instead of saving NaN', () => {
    expect(() =>
      calculateFederal1040_2026({
        filingStatus: 'single',
        wages: [{ wages: NaN, federalWithholding: 0 }],
      }),
    ).toThrow('Invalid wages');
    expect(() =>
      calculateFederal1040_2026({
        filingStatus: 'single',
        wages: [],
        ordinaryDividends: 10,
        qualifiedDividends: 20,
      }),
    ).toThrow('cannot exceed');
  });
});
