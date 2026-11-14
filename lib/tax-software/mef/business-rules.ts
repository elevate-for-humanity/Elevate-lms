import type { IrsNode } from './return-xml';
export type RuleIssue = { code: string; message: string; field?: string };
const n = (value: unknown) => Number(value ?? 0);
const obj = (value: unknown) =>
  (value && typeof value === 'object' && !Array.isArray(value) ? value : {}) as Record<
    string,
    unknown
  >;
const list = (value: unknown): Record<string, unknown>[] =>
  value === undefined ? [] : (Array.isArray(value) ? value : [value]).map(obj);
export function validRoutingNumber(value: string) {
  return (
    /^\d{9}$/.test(value) &&
    !/^0+$/.test(value) &&
    (3 * (n(value[0]) + n(value[3]) + n(value[6])) +
      7 * (n(value[1]) + n(value[4]) + n(value[7])) +
      n(value[2]) +
      n(value[5]) +
      n(value[8])) %
      10 ===
      0
  );
}
/** Local checks from TY2026 v4.0 plus application consistency checks. IRS identity/file-history rules run at IRS. */
export function validateLocalMefRules(fields: IrsNode) {
  const issues: RuleIssue[] = [],
    data = obj(fields.ReturnData),
    header = obj(fields.ReturnHeader),
    f = obj(data.IRS1040),
    w2 = list(data.IRSW2),
    s1 = obj(data.IRS1040Schedule1),
    split = obj(data.IRS8888);
  const add = (code: string, message: string, field?: string) =>
    issues.push({ code, message, field });
  if (
    ![
      'TotalIncomeAmt',
      'AdjustedGrossIncomeAmt',
      'TaxAmt',
      'TotalTaxBeforeCrAndOthTaxesAmt',
      'TotalCreditsAmt',
      'TotalTaxAfter1062TaxAmt',
      'TotalPaymentsAmt',
      'TaxExemptInterestAmt',
      'QualifiedDividendsAmt',
      'IRADistributionsAmt',
      'PensionsAnnuitiesAmt',
      'SocSecBnftAmt',
    ].some((k) => n(f[k]) !== 0)
  )
    add('F1040-065-06', 'The return must contain a nonzero income, tax, credit or payment amount.');
  const payments =
    n(f.WithholdingTaxAmt) +
    n(f.EstimatedTaxPaymentsAmt) +
    n(f.EarnedIncomeCreditAmt) +
    n(f.AdditionalChildTaxCreditAmt) +
    n(f.RefundableAmerOppCreditAmt) +
    n(f.RefundableAdoptionCreditAmt) +
    [
      'ReconciledPremiumTaxCreditAmt',
      'RequestForExtensionAmt',
      'ExcessSocSecAndTier1RRTATaxAmt',
      'TotalFuelTaxCreditAmt',
      'OtherPaymentsAmt',
    ].reduce((sum, k) => sum + n(obj(data.IRS1040Schedule3)[k]), 0) -
    n(f.USCtznUSNatlQlfyAlienAmt);
  if (n(f.TotalPaymentsAmt) !== payments)
    add(
      'F1040-066-11',
      'Total payments do not equal withholding, estimates and attached refundable credits.',
      'TotalPaymentsAmt',
    );
  const statutory = list(data.IRS1040ScheduleC)
    .filter((c) => c.StatutoryEmployeeFromW2Ind === 'X')
    .reduce((sum, c) => sum + n(c.TotalGrossReceiptsAmt), 0);
  const wageException =
    Boolean(data.IRS8958) ||
    n(s1.CertainPenalInstnWagesAmt) !== 0 ||
    n(s1.NonqlfyDeferredCompensationAmt) !== 0;
  if (
    !wageException &&
    w2.reduce((sum, w) => sum + n(w.WagesAmt), 0) > n(f.WagesAmt) + statutory + 5
  )
    add('FW2-001-03', 'Attached W-2 wages exceed the wages reported on the return.', 'WagesAmt');
  for (const wage of w2)
    if (
      n(wage.WagesAmt) <= 0 &&
      wage.ThirdPartySickPayInd !== 'X' &&
      !list(wage.EmployersUseGrp).some((g) => g.EmployersUseCd === 'Q' && n(g.EmployersUseAmt) > 0)
    )
      add('FW2-002-01', 'Confirm the excluded-pay exception for a W-2 with no taxable wages.');
  const allocations = list(split.DirectDepositInfoGroup);
  if (data.IRS8888) {
    const sum = allocations.reduce((total, d) => total + n(d.DirectDepositRefundAmt), 0);
    if (sum !== n(split.TotalAllocationOfRefundAmt))
      add('F8888-001-04', 'Deposit allocations do not equal Form 8888 total.');
    if (n(split.TotalAllocationOfRefundAmt) !== n(f.RefundAmt))
      add('F8888-002-03', 'Form 8888 total must equal the Form 1040 refund.');
    const accounts = allocations.map((d) => String(d.DepositorAccountNum ?? ''));
    if (new Set(accounts).size !== accounts.length)
      add('F8888-015', 'Each refund allocation must use a unique account number.');
    if (accounts.some((a) => /^0+$/.test(a)))
      add('F8888-016', 'A refund account number cannot consist of zeros.');
  }
  for (const deposit of allocations)
    if (!validRoutingNumber(String(deposit.RoutingTransitNum ?? '')))
      add('APP-ABA-CHECKSUM', 'Confirm the refund routing number checksum.');
  if (f.RoutingTransitNum && !validRoutingNumber(String(f.RoutingTransitNum)))
    add('APP-ABA-CHECKSUM', 'Confirm the refund routing number checksum.');
  const actualCount = Object.entries(data)
    .filter(([k]) => k !== '@attributes')
    .reduce((sum, [, v]) => sum + (Array.isArray(v) ? v.length : 1), 0);
  if (n(obj(data['@attributes']).documentCnt) !== actualCount)
    add('APP-DOCUMENT-COUNT', 'Return document count does not match the attached forms.');
  if (n(f.AdjustedGrossIncomeAmt) !== n(f.TotalIncomeAmt) - n(f.TotalAdjustmentsAmt))
    add('APP-AGI', 'Adjusted gross income does not reconcile.');
  if (n(f.TaxableIncomeAmt) !== Math.max(0, n(f.AdjustedGrossIncomeAmt) - n(f.TotalDeductionsAmt)))
    add('APP-TAXABLE-INCOME', 'Taxable income does not reconcile.');
  if (n(f.OverpaidAmt) !== Math.max(0, n(f.TotalPaymentsAmt) - n(f.TotalTaxAmt)))
    add('APP-OVERPAYMENT', 'Overpayment does not reconcile with tax and payments.');
  if (String(header.SoftwareId ?? '') === '00000000')
    add(
      'APP-SOFTWARE-ID',
      'Replace the synthetic development Software ID with the IRS-issued product ID.',
    );
  return {
    issues,
    localChecksPassed: issues.length === 0,
    irsIdentityAndHistoryChecksPending: true,
    atsAccepted: false,
  };
}
