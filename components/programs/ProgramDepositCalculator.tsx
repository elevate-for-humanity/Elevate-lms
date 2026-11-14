'use client';
import { useId } from 'react';
import { downPaymentCents, programInstallmentTerms } from '@/lib/programs/installment-terms';
import { getInitialProgramInvoiceCents } from '@/lib/programs/deposit-policy';

export const formatPlanMoney = (cents: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(cents / 100);

export default function ProgramDepositCalculator({
  slug,
  tuitionCents,
  value,
  onChange,
}: {
  slug: string;
  tuitionCents: number;
  value: string;
  onChange: (value: string) => void;
}) {
  const id = useId();
  let terms;
  let error = '';
  try {
    terms = programInstallmentTerms(slug, tuitionCents, downPaymentCents(value));
  } catch (cause) {
    error = cause instanceof Error ? cause.message : 'Enter a valid down payment.';
  }
  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-slate-950">
      <label htmlFor={id} className="block font-bold">
        Down payment calculator
      </label>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        min={getInitialProgramInvoiceCents(slug, tuitionCents) / 100}
        max={tuitionCents / 100}
        step="0.01"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={`${id}-summary`}
        className="mt-2 w-full rounded-lg border border-blue-300 bg-white p-3 text-lg"
      />
      <div id={`${id}-summary`} aria-live="polite" className="mt-3 space-y-1 text-base">
        {error ? (
          <p role="alert">{error}</p>
        ) : terms ? (
          <>
            <p>
              Due today: <strong>{formatPlanMoney(terms.downPaymentCents)}</strong>
            </p>
            <p>
              Remaining tuition: <strong>{formatPlanMoney(terms.balanceCents)}</strong>
            </p>
            {terms.installmentCount ? (
              <>
                <p>
                  Up to {terms.installmentCount} {terms.cadence === 'weekly' ? 'weekly' : 'monthly'}{' '}
                  payments of <strong>{formatPlanMoney(terms.installmentCents)}</strong>.
                </p>
                <p>
                  Final payment: {formatPlanMoney(terms.finalInstallmentCents)}.{' '}
                  {terms.cadence === 'weekly'
                    ? 'First invoice is due the following Friday.'
                    : 'First invoice is due next month.'}
                </p>
              </>
            ) : (
              <p>Tuition paid in full; no remaining installments.</p>
            )}
          </>
        ) : null}
      </div>
      <p className="mt-3 text-sm">
        Payments are credited toward tuition. A valid coupon is checked at checkout before payment.
        Installments are invoiced; they are not automatic withdrawals.
      </p>
    </div>
  );
}
