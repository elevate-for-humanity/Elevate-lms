import { describe, expect, it } from 'vitest';
import { prepareStoredFederalReturn2026 } from '@/lib/tax-software/calculation/financial-inputs';
const input = {
  filingStatus: 'single' as const,
  extra: {},
  w2: [],
  income1099: [],
  scheduleC: [],
  itemized: null,
};
describe('saved source classification', () => {
  it('uses reviewed taxable retirement amounts without also reporting gross 1099-R as other income', () => {
    const r = prepareStoredFederalReturn2026({
      ...input,
      extra: { taxablePensions: 15000 },
      income1099: [{ form_type: 'R', amount: 20000, federal_withholding: 2000 }],
    });
    expect(r.calculation.totalIncome).toBe(15000);
    expect(r.calculation.lines['8']).toBe(0);
    expect(r.calculation.federalWithholding).toBe(2000);
  });
  it('requires review before treating a retirement distribution as fully taxable', () => {
    expect(() =>
      prepareStoredFederalReturn2026({ ...input, income1099: [{ form_type: 'R', amount: 20000 }] }),
    ).toThrow('Review taxable IRA');
  });
  it('uses saved Schedule C net income instead of counting the same 1099-NEC gross amount again', () => {
    const r = prepareStoredFederalReturn2026({
      ...input,
      income1099: [{ form_type: 'NEC', amount: 20000 }],
      scheduleC: [{ net_profit: 15000 }],
    });
    expect(r.calculation.totalIncome).toBe(15000);
  });
});
