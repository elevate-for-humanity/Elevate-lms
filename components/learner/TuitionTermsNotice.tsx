import { PROSPECTIVE_TUITION_LATE_FEE_POLICY as terms } from '@/lib/billing/tuition-late-fee-policy';
export function TuitionTermsNotice() {
  return (
    <details
      aria-label="Automatic payment and late-fee terms"
      className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600"
    >
      <summary className="cursor-pointer font-semibold text-slate-900">Payment dates &amp; agreement terms</summary>
      <p>
        Keep your payment information on file with the secure payment provider and complete the
        signed recurring-payment authorization and provider agreement. Automatic payments begin only
        when that agreement is active. QuickBooks records confirmed payments.
      </p>
      <p className="mt-2">
        For new self-pay internal agreements including the {terms.version} terms: you have{' '}
        {terms.gracePeriodDays} calendar days after the due date to resolve a payment. Starting on
        day 4, the late fee is ${terms.dailyLateFeeCents / 100} per day. At day{' '}
        {terms.suspensionReviewAfterDays}, instructional access is suspended under the signed
        agreement. Reopening suspended instructional access requires resolving payment and a
        one-time ${terms.oneTimeReactivationFeeCents / 100} reactivation fee.
      </p>
      <p className="mt-2">
        Existing signed agreements and approved arrangements still govern existing accounts. Funded
        and externally financed payments follow their own terms. Billing, support, timekeeping and
        required records remain available.
      </p>
    </details>
  );
}

