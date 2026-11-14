import { describe, it, expect } from 'vitest';
import { writeFileSync } from 'node:fs';
import {
  calculateScheduleC2026,
  scheduleCToRow,
  scheduleCFromRow,
  type ScheduleCBusiness,
} from '@/lib/tax-software/calculation/schedule-c-2026';
import { prepareStoredFederalReturn2026 } from '@/lib/tax-software/calculation/financial-inputs';
import { mapFederalReturn2026 } from '@/lib/tax-software/mef/return-xml';
import { serializeMefReturn2026 } from '@/lib/tax-software/mef/serialize-return';
const business: ScheduleCBusiness = {
  owner: 'primary',
  businessName: 'Wheat Consulting',
  principalActivity: 'CONSULTING SERVICES',
  businessCode: '541990',
  accountingMethod: 'cash',
  materiallyParticipates: true,
  newBusiness: false,
  paymentsRequire1099: false,
  required1099Filed: false,
  allInvestmentAtRisk: true,
  grossReceipts: 20000,
  returnsAllowances: 1000,
  otherIncome: 100,
  expenses: { advertising: 500, utilities: 1000 },
  otherExpenses: [{ description: 'BUSINESS SUBSCRIPTIONS', amount: 100 }],
  inventory: {
    method: 'cost',
    beginning: 2000,
    purchases: 3000,
    labor: 0,
    materials: 0,
    otherCosts: 0,
    ending: 500,
  },
  reviewed: true,
};
const prepared = () =>
  prepareStoredFederalReturn2026({
    filingStatus: 'single',
    extra: {},
    w2: [],
    income1099: [{ form_type: 'NEC', amount: 20000 }],
    scheduleC: [scheduleCToRow(business)],
    itemized: null,
  });
describe('owned Schedule C worksheets', () => {
  it('calculates inventory, ordinary expenses and the reported profit', () => {
    const c = calculateScheduleC2026(business);
    expect(c.costOfGoodsSold).toBe(4500);
    expect(c.grossIncome).toBe(14600);
    expect(c.totalExpenses).toBe(1600);
    expect(c.netProfit).toBe(13000);
  });
  it('keeps equal fractional inventory balances from creating fictitious income', () => {
    expect(
      calculateScheduleC2026({
        ...business,
        inventory: {
          ...business.inventory!,
          beginning: 0.49,
          purchases: 0.49,
          labor: 0,
          materials: 0,
          otherCosts: 0,
          ending: 0.98,
        },
      }).costOfGoodsSold,
    ).toBe(0);
  });
  it('uses canonical Schedule C records once alongside imported 1099-NEC data', () => {
    const p = prepared();
    expect(p.calculation.lines['8']).toBe(13000);
    expect(p.financial.selfEmployment).toEqual([{ owner: 'primary', netProfit: 13000 }]);
    expect(scheduleCFromRow(scheduleCToRow(business))).toEqual(business);
  });
  it('rejects stale derived profit and leaves old records marked for review', () => {
    expect(() =>
      prepareStoredFederalReturn2026({
        filingStatus: 'single',
        extra: {},
        w2: [],
        income1099: [],
        scheduleC: [{ ...scheduleCToRow(business), net_profit: 1 }],
        itemized: null,
      }),
    ).toThrow('changed business');
    const legacy = prepareStoredFederalReturn2026({
      filingStatus: 'single',
      extra: {},
      w2: [],
      income1099: [],
      scheduleC: [{ net_profit: 0, gross_receipts: 1000 }],
      itemized: null,
    });
    expect(legacy.unreviewedBusinessCount).toBe(1);
    expect(legacy.needsScheduleC).toBe(true);
  });
  it('requires review and prevents unreviewed limited losses or impossible inventory', () => {
    expect(() => calculateScheduleC2026({ ...business, reviewed: false })).toThrow('Review');
    expect(() =>
      calculateScheduleC2026({
        ...business,
        grossReceipts: 0,
        returnsAllowances: 0,
        allInvestmentAtRisk: false,
      }),
    ).toThrow('at-risk');
    expect(() =>
      calculateScheduleC2026({ ...business, inventory: { ...business.inventory!, ending: 6000 } }),
    ).toThrow('inventory');
  });
  it('exports the same business profit across C, Schedule 1 and SE', () => {
    const p = prepared();
    const mapped = mapFederalReturn2026({
      profile: {
        firstName: 'Sam',
        lastName: 'Wheat',
        ssn: '400001040',
        birthDate: '1986-02-07',
        address: { line1: '2525 Main Street', city: 'Round Rock', state: 'TX', zip: '78680' },
      },
      financial: p.financial,
      creditInputs: p.creditInputs,
      businesses: p.businessSchedules,
      w2: [],
      configuration: {
        softwareId: '00000000',
        efin: '000000',
        createdAt: '2027-01-15T12:00:00Z',
        signatureDate: '2027-01-15',
        taxpayerPin: '12345',
        priorYearAgi: 0,
        publicIp: '8.8.8.8',
        authorizationRecorded: true,
      },
    });
    const xml = serializeMefReturn2026(mapped.irsFields);
    expect(xml).toContain('<NetProfitOrLossAmt>13000</NetProfitOrLossAmt>');
    expect(xml).toContain('<BusinessIncomeLossAmt>13000</BusinessIncomeLossAmt>');
    if (process.env.IRS_TEST_BUSINESS_XML_PATH)
      writeFileSync(process.env.IRS_TEST_BUSINESS_XML_PATH, xml, { mode: 0o600 });
  });
});
