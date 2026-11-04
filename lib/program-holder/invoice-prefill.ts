import { completionTerms } from './completion-terms';
import { completionInvoiceDraft } from './completion-invoice';

export type InvoiceStage = 'start' | 'completion';
export type InvoiceTerms = { amountCents: number | null; reason: string; source: string };
type Schedule = {
  id: string;
  total_payout_cents: number;
  increment_1_cents: number;
  increment_2_cents: number;
  increment_1_status: string;
  increment_2_status: string;
};
type Transaction = { status: string; amount_cents: number; installment: number };

/** Suggestions only; edits never modify the agreement or approve payment. */
export function invoicePrefill(
  features: unknown,
  signed: boolean,
  schedule: Schedule | null,
  transactions: Transaction[],
  stage: InvoiceStage,
): InvoiceTerms {
  const missing = (reason: string): InvoiceTerms => ({
    amountCents: null,
    reason,
    source: 'Agreement review required',
  });
  if (!signed)
    return missing(
      'Your current MOU/payment terms must be signed before an amount can be suggested.',
    );
  if (schedule) {
    if (stage === 'completion') {
      const draft = completionInvoiceDraft(schedule, transactions, 'invoice-prefill');
      return {
        amountCents: draft.amount_cents,
        reason: draft.reason,
        source: `Individual student schedule ${schedule.id}`,
      };
    }
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
      return missing('Student payment terms require reconciliation.');
    if (
      ['held', 'processing', 'released'].includes(schedule.increment_1_status) ||
      transactions.some((t) => !['paid', 'failed', 'cancelled'].includes(t.status))
    )
      return missing('An existing payment or hold requires review.');
    const paid = transactions.filter((t) => t.status === 'paid');
    if (
      paid.some(
        (t) =>
          !Number.isSafeInteger(t.amount_cents) ||
          t.amount_cents < 0 ||
          ![1, 2].includes(t.installment),
      )
    )
      return missing('Prior payment records require reconciliation.');
    const paidTotal = paid.reduce((sum, t) => sum + t.amount_cents, 0);
    const paidFirst = Math.max(
      schedule.increment_1_status === 'paid' ? first : 0,
      paid.filter((t) => t.installment === 1).reduce((sum, t) => sum + t.amount_cents, 0),
    );
    const paidSecond = Math.max(
      schedule.increment_2_status === 'paid' ? second : 0,
      paid.filter((t) => t.installment === 2).reduce((sum, t) => sum + t.amount_cents, 0),
    );
    if (!Number.isSafeInteger(paidTotal) || paidFirst + paidSecond > total)
      return missing('Prior payments exceed the agreement.');
    return {
      amountCents: Math.max(0, Math.min(first - paidFirst, total - paidFirst - paidSecond)),
      source: `Individual student schedule ${schedule.id}`,
      reason: 'Unpaid start installment; submission remains subject to review.',
    };
  }
  // A recorded payment without a matching schedule must not be ignored.
  if (transactions.some((t) => !['failed', 'cancelled'].includes(t.status)))
    return missing(
      'Existing student payments need a matching schedule before calculating another invoice.',
    );
  const recorded = features as {
    compensation_terms?: { effective_status?: string };
    payment_addendum?: unknown;
  };
  if (
    !recorded?.payment_addendum &&
    /pending/i.test(recorded?.compensation_terms?.effective_status || '')
  )
    return missing(
      'The recorded compensation terms are awaiting signature. Review your individual MOU or ask Elevate to finalize the addendum.',
    );
  const terms = completionTerms(features);
  const value = stage === 'start' ? terms?.first : terms?.second;
  if (value === undefined)
    return missing(
      'No signed installment amount is recorded for this stage. Ask Elevate to confirm the amount; you may enter a requested amount for review.',
    );
  return {
    amountCents: value,
    source: 'Your assigned signed MOU payment terms',
    reason: 'Suggested installment, subject to student milestone and payment review.',
  };
}
