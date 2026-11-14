/** Map FundingGateCard / URL params to ApprenticeForm fundingInterest values */
export function mapApplyFundingParam(param: string | null | undefined): string {
  if (!param) return '';
  const normalized: Record<string, string> = {
    'workforce-ready-grant': 'wrg',
    'employer-sponsored': 'employer',
    'not-sure': 'unsure',
    jri: 'unsure',
    'payment-plan': 'self-pay',
    'self-pay': 'self-pay',
  };
  return normalized[param] ?? param;
}
