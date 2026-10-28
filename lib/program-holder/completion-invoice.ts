/** A draft request only. This never approves, posts to QuickBooks, or transfers funds. */
export function completionInvoiceDraft(schedule: any, transactions: any[], reference: string) {
  const base = { reference, installment: 2, status: 'requires_agreement_review', amount_cents: null as number | null, schedule_id: schedule?.id || null, provider_invoice_id: null, payment_status: 'not_submitted' };
  if (!schedule) return { ...base, reason: 'No individual student payment schedule is recorded. Admin must verify the agreement and prior payments.' };
  const total = schedule.total_payout_cents, second = schedule.increment_2_cents;
  if (!Number.isSafeInteger(total) || total <= 0 || !Number.isSafeInteger(second) || second < 0 || second > total)
    return { ...base, reason: 'Individual payment terms require review.' };
  if (schedule.increment_2_status === 'paid') return { ...base, status: 'not_due', amount_cents: 0, reason: 'The second installment is already recorded as paid; reconcile provider records before any further payment.' };
  if (transactions.some(row => row.installment === 2 && ['processing', 'pending'].includes(row.status)))
    return { ...base, status: 'payment_in_progress', reason: 'An existing second-installment payment must be reconciled before another invoice is issued.' };
  const paid = transactions.filter(row => row.status === 'paid');
  if (paid.some(row => !Number.isSafeInteger(row.amount_cents) || row.amount_cents < 0))
    return { ...base, reason: 'Prior payment records require reconciliation.' };
  const firstPaid = Math.max(paid.filter(row => row.installment === 1).reduce((sum, row) => sum + row.amount_cents, 0), schedule.increment_1_status === 'paid' ? Number(schedule.increment_1_cents || 0) : 0);
  const secondPaid = paid.filter(row => row.installment === 2).reduce((sum, row) => sum + row.amount_cents, 0);
  const amount = Math.max(0, Math.min(second - secondPaid, total - firstPaid - secondPaid));
  return { ...base, status: amount > 0 ? 'draft_pending_completion_review' : 'not_due', amount_cents: amount,
    reason: amount > 0 ? 'Draft only. Verify the individual agreement, completion evidence, and provider payment history before approval.' : 'No unpaid second installment remains under this student schedule.' };
}
