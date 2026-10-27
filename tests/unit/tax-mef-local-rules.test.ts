import { describe, it, expect } from 'vitest';
import { validateLocalMefRules, validRoutingNumber } from '@/lib/tax-software/mef/business-rules';
import type { IrsNode } from '@/lib/tax-software/mef/return-xml';
const fields = (): IrsNode => ({
  ReturnHeader: { SoftwareId: '12345678' },
  ReturnData: {
    '@attributes': { documentCnt: 3 },
    IRS1040: {
      WagesAmt: 50510,
      TotalIncomeAmt: 50510,
      AdjustedGrossIncomeAmt: 50510,
      TotalAdjustmentsAmt: 0,
      TotalDeductionsAmt: 16100,
      TaxableIncomeAmt: 34410,
      TotalTaxAmt: 3883,
      WithholdingTaxAmt: 10268,
      TotalPaymentsAmt: 10268,
      OverpaidAmt: 6385,
      RefundAmt: 6385,
    },
    IRSW2: [{ WagesAmt: 50510 }],
    IRS8888: {
      DirectDepositInfoGroup: [
        {
          DirectDepositRefundAmt: 5385,
          RoutingTransitNum: '012345672',
          DepositorAccountNum: '12345678',
        },
        {
          DirectDepositRefundAmt: 1000,
          RoutingTransitNum: '012345672',
          DepositorAccountNum: '1234567',
        },
      ],
      TotalAllocationOfRefundAmt: 6385,
    },
  },
});
describe('local IRS rules', () => {
  it('passes reconciled scenario 5 data without claiming IRS acceptance', () => {
    const r = validateLocalMefRules(fields());
    expect(r.issues).toEqual([]);
    expect(r.atsAccepted).toBe(false);
  });
  it('identifies the exact published refund allocation rule when amounts differ', () => {
    const f = fields();
    (f.ReturnData as IrsNode).IRS8888 = {
      TotalAllocationOfRefundAmt: 6385,
      DirectDepositInfoGroup: [
        {
          DirectDepositRefundAmt: 1000,
          RoutingTransitNum: '012345672',
          DepositorAccountNum: '12345',
        },
      ],
    };
    expect(validateLocalMefRules(f).issues.some((i) => i.code === 'F8888-001-04')).toBe(true);
  });
  it('checks ABA routing checksum', () => {
    expect(validRoutingNumber('012345672')).toBe(true);
    expect(validRoutingNumber('012345673')).toBe(false);
  });
});
