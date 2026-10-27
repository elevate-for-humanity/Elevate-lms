import {
  BUSINESS_EXPENSE_FIELDS,
  calculateScheduleC2026,
  type ScheduleCBusiness,
} from '../calculation/schedule-c-2026';
import { irsDollars, type Federal1040Input } from '../calculation/federal-1040-2026';
import type { IrsNode, MefProfile } from './return-xml';
const text = (s: string) => s.trim().replace(/\s+/g, ' ').toUpperCase();
export function mapBusinessDocuments2026(input: {
  profile: MefProfile;
  financial: Federal1040Input;
  businesses: ScheduleCBusiness[];
  documents: Record<string, IrsNode | IrsNode[]>;
}) {
  if (!input.businesses.length) return;
  if (input.businesses.length > 8)
    throw new Error('Review the Schedule C document limit before electronic export');
  if (input.documents.IRS1040ScheduleC)
    throw new Error('Calculated business worksheets cannot be replaced');
  const totals = { primary: 0, spouse: 0 };
  const documents = input.businesses.map((b, i): IrsNode => {
    const person = b.owner === 'spouse' ? input.profile.spouse : input.profile;
    if (!person)
      throw new Error('Spouse business income requires a joint return and spouse details');
    const c = calculateScheduleC2026(b);
    totals[b.owner] += c.netProfit;
    const fields: IrsNode = {
      '@attributes': { documentId: `SC-${i + 1}` },
      ProprietorNm: text(`${person.firstName} ${person.lastName}`),
      SSN: person.ssn.replace(/-/g, ''),
      PrincipalBusinessActivityDesc: text(b.principalActivity),
      PrincipalBusinessActivityCd: b.businessCode,
      ...(b.businessName ? { BusinessNameLine1Txt: text(b.businessName) } : {}),
      ...(b.ein ? { EIN: b.ein.replace(/-/g, '') } : {}),
      ...(b.accountingMethod === 'cash'
        ? { MethodOfAccountingCashInd: 'X' }
        : { MethodOfAccountingAccrualInd: 'X' }),
      MaterialParticipationInCYInd: b.materiallyParticipates,
      ...(b.newBusiness ? { NewBusinessInCurrentYearInd: 'X' } : {}),
      PaymentRqrFilingForm1099Ind: b.paymentsRequire1099,
      ...(b.paymentsRequire1099 ? { RequiredForm1099FiledInd: b.required1099Filed } : {}),
      TotalGrossReceiptsAmt: c.receipts,
      ReturnsAndAllowancesAmt: c.allowances,
      NetGrossReceiptsAmt: c.netReceipts,
      GrossProfitAmt: c.grossProfit,
      OtherIncomeAmt: irsDollars(b.otherIncome),
      GrossIncomeAmt: c.grossIncome,
      TotalExpensesAmt: c.totalExpenses,
      TentativeProfitOrLossAmt: c.netProfit,
      NetProfitOrLossAmt: c.netProfit,
      ...(c.netProfit < 0 && b.allInvestmentAtRisk ? { AllInvestmentIsAtRiskInd: 'X' } : {}),
      ...(c.otherExpenses.length
        ? {
            OtherExpenseDetail: c.otherExpenses.map((e) => ({
              Desc: text(e.description),
              Amt: e.amount,
            })),
            TotalOtherExpensesAmt: c.otherExpenseTotal,
          }
        : {}),
    };
    for (const [key, , field] of BUSINESS_EXPENSE_FIELDS)
      if (c.expenseAmounts[key]) fields[field] = c.expenseAmounts[key];
    if (b.inventory)
      Object.assign(fields, {
        ...(b.inventory.method === 'cost'
          ? { ClosingInventoryCostMethodInd: 'X' }
          : { LowerOfCostOrMarketMethodInd: 'X' }),
        BeginningOfYearInventoryAmt: irsDollars(b.inventory.beginning),
        PurchasesLessPersonalItemsAmt: irsDollars(b.inventory.purchases),
        CostOfLaborAmt: irsDollars(b.inventory.labor),
        MaterialsAndSuppliesAmt: irsDollars(b.inventory.materials),
        OtherCostsAmt: irsDollars(b.inventory.otherCosts),
        TotalCostsAmt: c.totalInventoryCosts,
        EndOfYearInventoryAmt: irsDollars(b.inventory.ending),
        CostOfGoodsSoldAmt: c.costOfGoodsSold,
      });
    return fields;
  });
  const expected = { primary: 0, spouse: 0 };
  for (const b of input.financial.selfEmployment ?? [])
    expected[b.owner ?? 'primary'] += irsDollars(b.netProfit);
  if (totals.primary !== expected.primary || totals.spouse !== expected.spouse)
    throw new Error('Complete the business worksheets for all income in the reviewed calculation');
  input.documents.IRS1040ScheduleC = documents;
}
