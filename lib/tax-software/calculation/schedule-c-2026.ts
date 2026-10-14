import { z } from 'zod';
import { irsDollars } from './federal-1040-2026';
export const BUSINESS_EXPENSE_FIELDS = [
  ['advertising', 'Advertising', 'AdvertisingAmt'],
  ['commissions', 'Commissions and fees', 'CommissionsAndFeesAmt'],
  ['contractLabor', 'Contract labor', 'ContractLaborAmt'],
  ['employeeBenefits', 'Employee benefit programs', 'EmployeeBenefitProgramAmt'],
  ['insurance', 'Business insurance, excluding health insurance', 'InsuranceAmt'],
  ['mortgageInterest', 'Deductible business mortgage interest', 'MortgageInterestPaidBanksAmt'],
  ['vehicleLoanInterest', 'Deductible business vehicle loan interest', 'VehicleLoanInterestAmt'],
  ['otherInterest', 'Other deductible business interest', 'MortgageInterestPaidOtherAmt'],
  ['legalProfessional', 'Legal and professional services', 'LegalAndProfessionalServiceAmt'],
  ['office', 'Office expenses', 'OfficeExpensesAmt'],
  ['pension', 'Pension and profit sharing plans', 'PensionProfitSharingPlansAmt'],
  ['equipmentRent', 'Vehicle, machinery and equipment rent', 'MachineryAndEquipmentRentAmt'],
  ['propertyRent', 'Other business property rent', 'OtherBusinessPropertyRentAmt'],
  ['repairs', 'Repairs and maintenance', 'RepairsAndMaintenanceAmt'],
  ['supplies', 'Supplies, excluding cost of goods sold', 'SuppliesAmt'],
  ['taxesLicenses', 'Taxes and licenses', 'TaxesAndLicensesAmt'],
  ['travel', 'Deductible business travel', 'TravelAmt'],
  ['meals', 'Deductible meals after applicable limits', 'MealsAndEntertainmentAmt'],
  ['utilities', 'Business utilities', 'UtilitiesAmt'],
  ['wages', 'Employee wages less employment credits', 'WagesLessEmploymentCreditsAmt'],
] as const;
type ExpenseKey = (typeof BUSINESS_EXPENSE_FIELDS)[number][0];
const amount = z.number().finite().min(0).max(1_000_000_000);
const expenseShape = Object.fromEntries(
  BUSINESS_EXPENSE_FIELDS.map(([key]) => [key, amount.optional()]),
) as Record<ExpenseKey, z.ZodOptional<z.ZodNumber>>;
const businessShape = z
  .object({
    owner: z.enum(['primary', 'spouse']),
    businessName: z.string().trim().max(75),
    principalActivity: z.string().trim().min(1).max(100),
    businessCode: z.string().regex(/^\d{6}$/),
    ein: z
      .string()
      .regex(/^\d{2}-?\d{7}$/)
      .optional(),
    accountingMethod: z.enum(['cash', 'accrual']),
    materiallyParticipates: z.boolean(),
    newBusiness: z.boolean(),
    paymentsRequire1099: z.boolean(),
    required1099Filed: z.boolean(),
    allInvestmentAtRisk: z.boolean(),
    grossReceipts: amount,
    returnsAllowances: amount,
    otherIncome: amount,
    expenses: z.object(expenseShape).strict(),
    otherExpenses: z
      .array(z.object({ description: z.string().trim().min(1).max(100), amount }).strict())
      .max(20),
    inventory: z
      .object({
        method: z.enum(['cost', 'lower_of_cost_or_market']),
        beginning: amount,
        purchases: amount,
        labor: amount,
        materials: amount,
        otherCosts: amount,
        ending: amount,
      })
      .strict()
      .optional(),
    reviewed: z.boolean(),
  })
  .strict();
type BusinessInput = z.infer<typeof businessShape>;
function amounts(b: BusinessInput) {
  const inventory = b.inventory;
  const totalInventoryCosts = inventory
    ? irsDollars(
        inventory.beginning +
          inventory.purchases +
          inventory.labor +
          inventory.materials +
          inventory.otherCosts,
      )
    : 0;
  const costOfGoodsSold = inventory ? totalInventoryCosts - irsDollars(inventory.ending) : 0;
  const receipts = irsDollars(b.grossReceipts),
    allowances = irsDollars(b.returnsAllowances),
    netReceipts = receipts - allowances,
    grossProfit = netReceipts - costOfGoodsSold,
    grossIncome = grossProfit + irsDollars(b.otherIncome);
  const expenseAmounts = Object.fromEntries(
    BUSINESS_EXPENSE_FIELDS.map(([key]) => [key, irsDollars(b.expenses[key] ?? 0)]),
  ) as Record<ExpenseKey, number>;
  const otherExpenses = b.otherExpenses.map((e) => ({
      description: e.description,
      amount: irsDollars(e.amount),
    })),
    otherExpenseTotal = otherExpenses.reduce((s, e) => s + e.amount, 0);
  const totalExpenses =
    Object.values(expenseAmounts).reduce((s, n) => s + n, 0) + otherExpenseTotal;
  return {
    receipts,
    allowances,
    netReceipts,
    totalInventoryCosts,
    costOfGoodsSold,
    grossProfit,
    grossIncome,
    expenseAmounts,
    otherExpenses,
    otherExpenseTotal,
    totalExpenses,
    netProfit: grossIncome - totalExpenses,
  };
}
export const scheduleCBusinessSchema = businessShape.superRefine((b, c) => {
  if (!b.reviewed)
    c.addIssue({
      code: 'custom',
      path: ['reviewed'],
      message: 'Review this business worksheet before saving',
    });
  if (b.returnsAllowances > b.grossReceipts)
    c.addIssue({
      code: 'custom',
      path: ['returnsAllowances'],
      message: 'Returns and allowances exceed gross receipts',
    });
  const v = amounts(b);
  if (v.costOfGoodsSold < 0)
    c.addIssue({
      code: 'custom',
      path: ['inventory', 'ending'],
      message: 'Ending inventory exceeds available inventory costs',
    });
  if (v.netProfit < 0 && (!b.allInvestmentAtRisk || !b.materiallyParticipates))
    c.addIssue({
      code: 'custom',
      path: ['allInvestmentAtRisk'],
      message:
        'Complete the at-risk and passive-activity loss review before calculating this business',
    });
});
export type ScheduleCBusiness = z.infer<typeof scheduleCBusinessSchema>;
export const calculateScheduleC2026 = (b: ScheduleCBusiness) =>
  amounts(scheduleCBusinessSchema.parse(b));
export function scheduleCToRow(b: ScheduleCBusiness) {
  const v = calculateScheduleC2026(b);
  return {
    business_name: b.businessName,
    business_code: b.businessCode,
    ein: b.ein?.replace(/-/g, '') ?? null,
    accounting_method: b.accountingMethod,
    income_owner: b.owner,
    principal_activity: b.principalActivity,
    gross_receipts: b.grossReceipts,
    returns_allowances: b.returnsAllowances,
    other_income: b.otherIncome,
    cost_of_goods_sold: v.costOfGoodsSold,
    gross_profit: v.grossProfit,
    total_expenses: v.totalExpenses,
    net_profit: v.netProfit,
    expenses: { ...b.expenses, other: v.otherExpenseTotal },
    worksheet_details: {
      version: 1,
      materiallyParticipates: b.materiallyParticipates,
      newBusiness: b.newBusiness,
      paymentsRequire1099: b.paymentsRequire1099,
      required1099Filed: b.required1099Filed,
      allInvestmentAtRisk: b.allInvestmentAtRisk,
      otherExpenses: b.otherExpenses,
      inventory: b.inventory ?? null,
      reviewed: b.reviewed,
    },
  };
}
export function scheduleCFromRow(row: Record<string, unknown>): ScheduleCBusiness | null {
  const meta = row.worksheet_details;
  if (!meta || typeof meta !== 'object' || Array.isArray(meta)) return null;
  const m = meta as Record<string, unknown>,
    expenses =
      row.expenses && typeof row.expenses === 'object' && !Array.isArray(row.expenses)
        ? (row.expenses as Record<string, unknown>)
        : {};
  return scheduleCBusinessSchema.parse({
    owner: row.income_owner ?? 'primary',
    businessName: row.business_name ?? '',
    principalActivity: row.principal_activity,
    businessCode: row.business_code,
    ein: row.ein || undefined,
    accountingMethod: row.accounting_method,
    grossReceipts: Number(row.gross_receipts),
    returnsAllowances: Number(row.returns_allowances ?? 0),
    otherIncome: Number(row.other_income ?? 0),
    expenses: Object.fromEntries(
      BUSINESS_EXPENSE_FIELDS.filter(([key]) => expenses[key] !== undefined).map(([key]) => [
        key,
        Number(expenses[key]),
      ]),
    ),
    materiallyParticipates: m.materiallyParticipates,
    newBusiness: m.newBusiness,
    paymentsRequire1099: m.paymentsRequire1099,
    required1099Filed: m.required1099Filed,
    allInvestmentAtRisk: m.allInvestmentAtRisk,
    otherExpenses: m.otherExpenses,
    inventory: m.inventory ?? undefined,
    reviewed: m.reviewed,
  });
}
