function cell(v: unknown) {
  let s = String(v ?? '');
  // Protect spreadsheet users from formula injection through client names.
  if (/^[\s]*[=+@\-\t\r]/.test(s)) s = "'" + s;
  return '"' + s.replaceAll('"', '""') + '"';
}
export function payrollReviewCsv(
  company: string,
  run: {
    id: string;
    status: string;
    calculation: { payDate: string; lines: Record<string, unknown>[] };
  },
) {
  const keys = [
    'reference',
    'name',
    'grossCents',
    'federalCents',
    'socialSecurityCents',
    'medicareCents',
    'additionalMedicareCents',
    'stateCents',
    'countyCents',
    'afterTaxDeductionCents',
    'netCents',
    'employerFicaCents',
  ];
  const rows: unknown[][] = [
    ['Supersonic Fast Cash — payroll review'],
    ['Company', company],
    ['Run', run.id],
    ['Status', run.status],
    ['Pay date', run.calculation.payDate],
    [
      'Payment / tax filing',
      'No funds sent; no tax returns filed. Approval authorizes export only.',
    ],
    [
      'Amounts',
      'All monetary columns are integer cents. Employer unemployment taxes are excluded.',
    ],
    keys,
  ];
  for (const line of run.calculation.lines) rows.push(keys.map((k) => line[k]));
  return '\ufeff' + rows.map((row) => row.map(cell).join(',')).join('\r\n') + '\r\n';
}
