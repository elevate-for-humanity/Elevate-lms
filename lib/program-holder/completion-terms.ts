/** Read administrator-recorded individual terms. Never infer a universal commission or split. */
export function completionTerms(features: any): { total: number; first?: number; second?: number } | null {
  const terms = features?.compensation_terms;
  const addendum = features?.payment_addendum;
  const fixed = features?.compensation;
  const coordinator = features?.custom_mou;
  const value = addendum ? { total: addendum.total_cents, first: addendum.start_cents, second: addendum.completion_cents }
    : terms ? { total: terms.per_student_total_cents, first: terms.start_installment_cents, second: terms.completion_installment_cents }
    : fixed?.model === 'fixed_amount_per_funded_student' ? { total: fixed.amount_cents }
    : coordinator?.compensation_per_eligible_enrollment ? { total: coordinator.compensation_per_eligible_enrollment * 100, first: coordinator.initial_payment * 100, second: coordinator.completion_payment * 100 }
    : null;
  if (!value || !Number.isSafeInteger(value.total) || value.total <= 0) return null;
  if ('first' in value && (!Number.isSafeInteger(value.first) || !Number.isSafeInteger(value.second) || value.first < 0 || value.second < 0 || value.first + value.second !== value.total)) return null;
  return value;
}
