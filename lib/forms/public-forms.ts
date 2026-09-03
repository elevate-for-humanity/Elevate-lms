/**
 * IRS and payroll forms used across onboarding and HR flows.
 *
 * - `w9Irs` — official blank IRS Form W-9 (fw9.pdf) from IRS.gov
 * - `w9` — hosted copy on this site (same form; use if IRS.gov is down)
 */
export const PUBLIC_FORMS = {
  /** Official IRS Form W-9 (Request for Taxpayer Identification Number) */
  w9Irs: 'https://www.irs.gov/pub/irs-pdf/fw9.pdf',
  /** Hosted mirror of IRS Form W-9 */
  w9: '/forms/w9.pdf',
  w9Prefilled: '/forms/w9-prefilled.pdf',
} as const;
