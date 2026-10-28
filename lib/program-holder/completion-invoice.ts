/** A draft request only. Never approves, posts to QuickBooks, or transfers funds. */
export function completionInvoiceDraft(schedule: any, transactions: any[], reference: string) {
  const base = {
    reference,
    installment: 2,
    status: 'requires_agreement_review',
    amount_cents: null as number | null,
    schedule_id: schedule?.id || null,
    provider_invoice_id: null,
    payment_status: 'not_submitted',
    transfer_allowed: false,
  };
  if (!schedule)
    return {
      ...base,
      reason:
        'No individual student payment schedule is recorded. Admin must verify the agreement and prior payments.',
    };
  const total = schedule.total_payout_cents,
    first = schedule.increment_1_cents,
    second = schedule.increment_2_cents;
  if (
    ![total, first, second].every(Number.isSafeInteger) ||
    total <= 0 ||
    first < 0 ||
    second < 0 ||
    first + second !== total
  )
    return { ...base, reason: 'Individual payment terms require review.' };
  if (
    [schedule.increment_1_status, schedule.increment_2_status].some((status) =>
      ['released', 'processing'].includes(status),
    )
  )
    return {
      ...base,
      status: 'payment_in_progress',
      reason:
        'A scheduled installment has been released or is processing. Reconcile it before calculating another request.',
    };
  if ([schedule.increment_1_status, schedule.increment_2_status].includes('held'))
    return {
      ...base,
      reason:
        'An installment is on hold. Admin must resolve the hold before calculating another request.',
    };
  // Any unresolved transfer can consume the remaining balance, including a full upfront exception.
  if (transactions.some((row) => ['processing', 'pending'].includes(row.status)))
    return {
      ...base,
      status: 'payment_in_progress',
      reason: 'An existing payment must be reconciled before another request is calculated.',
    };
  if (transactions.some((row) => !['paid', 'failed', 'cancelled'].includes(row.status)))
    return { ...base, reason: 'Unresolved payment records require reconciliation.' };
  const paid = transactions.filter((row) => row.status === 'paid');
  if (
    paid.some(
      (row) =>
        !Number.isSafeInteger(row.amount_cents) ||
        row.amount_cents < 0 ||
        ![1, 2].includes(row.installment),
    )
  )
    return { ...base, reason: 'Prior payment records require reconciliation.' };
  const recordedFirst = paid
    .filter((row) => row.installment === 1)
    .reduce((sum, row) => sum + row.amount_cents, 0);
  const recordedSecond = paid
    .filter((row) => row.installment === 2)
    .reduce((sum, row) => sum + row.amount_cents, 0);
  // Schedule paid flags and provider ledger rows represent the same payment, never add them twice.
  const firstPaid = Math.max(recordedFirst, schedule.increment_1_status === 'paid' ? first : 0);
  const secondPaid = Math.max(recordedSecond, schedule.increment_2_status === 'paid' ? second : 0);
  if (!Number.isSafeInteger(firstPaid + secondPaid) || firstPaid + secondPaid > total)
    return {
      ...base,
      reason: 'Recorded payments exceed the agreed total. Reconcile before any additional payment.',
    };
  const amount = Math.max(0, Math.min(second - secondPaid, total - firstPaid - secondPaid));
  return {
    ...base,
    status: amount > 0 ? 'draft_pending_completion_review' : 'not_due',
    amount_cents: amount,
    reason:
      amount > 0
        ? 'Draft only. Verify signed individual terms and exceptions, completion evidence, funding, prior payments, and payout destination before approval.'
        : 'No unpaid second installment remains under this student schedule.',
  };
}
