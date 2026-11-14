export type SelfFileCharge = {
  code: string;
  label: string;
  price: number;
  trigger: string;
};

/**
 * Self-file pricing is intentionally explicit.
 * Starting a return and the base federal 1040 workflow are free.
 * Paid additions are surfaced as soon as the return activates them.
 * Prices are configuration, not tax-law logic.
 */
export const SELF_FILE_BASE_PRICE = 0;

export const SELF_FILE_FORM_CHARGES: SelfFileCharge[] = [
  { code: 'SCHEDULE_A', label: 'Schedule A — Itemized Deductions', price: 15, trigger: 'itemized_deductions' },
  { code: 'SCHEDULE_B', label: 'Schedule B — Interest & Dividends', price: 10, trigger: 'schedule_b' },
  { code: 'SCHEDULE_C', label: 'Schedule C — Business Income', price: 35, trigger: 'self_employment' },
  { code: 'SCHEDULE_D', label: 'Schedule D — Capital Gains & Losses', price: 25, trigger: 'capital_gains' },
  { code: 'SCHEDULE_E', label: 'Schedule E — Rental/Pass-through Income', price: 35, trigger: 'rental_pass_through' },
  { code: 'SCHEDULE_SE', label: 'Schedule SE — Self-Employment Tax', price: 15, trigger: 'schedule_se' },
  { code: 'FORM_2441', label: 'Form 2441 — Child & Dependent Care', price: 10, trigger: 'dependent_care' },
  { code: 'FORM_8863', label: 'Form 8863 — Education Credits', price: 10, trigger: 'education_credit' },
  { code: 'FORM_8889', label: 'Form 8889 — HSA', price: 10, trigger: 'hsa' },
  { code: 'STATE_RETURN', label: 'State Return', price: 20, trigger: 'state_return' },
];

export function quoteSelfFile(activeTriggers: string[]) {
  const items = SELF_FILE_FORM_CHARGES.filter((item) => activeTriggers.includes(item.trigger));
  return {
    basePrice: SELF_FILE_BASE_PRICE,
    items,
    total: items.reduce((sum, item) => sum + item.price, SELF_FILE_BASE_PRICE),
  };
}
