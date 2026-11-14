'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, CreditCard, Loader2, Tag } from 'lucide-react';
import ProgramDepositCalculator from './ProgramDepositCalculator';
import { downPaymentCents, programInstallmentTerms } from '@/lib/programs/installment-terms';

interface ProgramPricing {
  program_slug: string;
  program_name: string;
  tuition_cents: number;
  deposit_default_cents?: number;
  source?: string;
}

interface Props {
  programSlug: string;
  initialPaymentMode?: 'full' | 'plan' | 'bnpl';
}

function fmt(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export default function PaymentPlanCalculator({
  programSlug,
  initialPaymentMode,
}: Props) {
  const [pricing, setPricing] = useState<ProgramPricing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [downPayment, setDownPayment] = useState('600');
  const [checkoutLoading, setCheckoutLoading] = useState<'full' | 'installments' | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 10000);

    setLoading(true);
    setError('');
    fetch(`/api/programs/pricing?slug=${encodeURIComponent(programSlug)}`, {
      cache: 'no-store',
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok || data.error) {
          throw new Error(data.error || 'Pricing is unavailable for this program.');
        }
        return data as ProgramPricing;
      })
      .then(data => {
        setPricing(data);
        setDownPayment(String((data.deposit_default_cents ?? Math.ceil(data.tuition_cents / 4)) / 100));
      })
      .catch((cause) => {
        setError(
          cause instanceof DOMException && cause.name === 'AbortError'
            ? 'Payment options took too long to load. Please try again.'
            : cause instanceof Error
              ? cause.message
              : 'Payment options are unavailable.',
        );
      })
      .finally(() => {
        window.clearTimeout(timeout);
        setLoading(false);
      });

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [programSlug]);

  function continueToEnrollment(paymentPlan: 'full' | 'installments') {
    if (pricing && paymentPlan === 'installments' && /apprentice/i.test(programSlug)) {
      try { programInstallmentTerms(programSlug, pricing.tuition_cents, downPaymentCents(downPayment)); }
      catch (cause) { setError(cause instanceof Error ? cause.message : 'Invalid down payment.'); return; }
    }
    setCheckoutLoading(paymentPlan);
    const query = new URLSearchParams({ payment_plan: paymentPlan });
    if (paymentPlan === 'installments' && /apprentice/i.test(programSlug)) query.set('down_payment', downPayment);
    if (couponCode.trim()) query.set('coupon', couponCode.trim().toUpperCase());
    window.location.href = `/enroll/${encodeURIComponent(programSlug)}?${query.toString()}`;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-10 text-base text-slate-600">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading payment options…
      </div>
    );
  }

  if (!pricing) {
    return (
      <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-base text-amber-900">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p className="font-bold">Payment options are temporarily unavailable.</p>
          <p className="mt-1 text-sm">{error || 'Contact admissions for current self-pay terms.'}</p>
        </div>
      </div>
    );
  }

  const installmentCents = /apprentice/i.test(programSlug) && Number.isFinite(downPaymentCents(downPayment))
    ? downPaymentCents(downPayment) : pricing.deposit_default_cents ?? Math.ceil(pricing.tuition_cents / 4);
  const selectedPlan = initialPaymentMode === 'full' ? 'full' : 'installments';
  const selectedPathLabel =
    initialPaymentMode === 'full'
      ? 'Pay in full'
      : initialPaymentMode === 'plan'
        ? 'Deposit + payment plan'
        : initialPaymentMode === 'bnpl'
          ? 'Buy Now, Pay Later (provider approval required)'
          : null;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="bg-slate-950 px-5 py-5 text-white">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-300">Self-pay options</p>
        <p className="mt-1 text-xl font-extrabold">{pricing.program_name}</p>
        <p className="mt-1 text-sm text-slate-300">Published tuition: {fmt(pricing.tuition_cents)}</p>
      </div>

      <div className="space-y-5 p-5 sm:p-6">
        {/apprentice/i.test(programSlug) ? <ProgramDepositCalculator slug={programSlug} tuitionCents={pricing.tuition_cents} value={downPayment} onChange={setDownPayment} /> : null}
        {selectedPathLabel ? (
          <p className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm font-bold text-blue-950">
            Your selected path: {selectedPathLabel}
          </p>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => continueToEnrollment('full')}
            disabled={checkoutLoading !== null}
            className={`rounded-xl border-2 p-5 text-left transition-colors disabled:opacity-60 ${
              selectedPlan === 'full'
                ? 'border-brand-red-600 bg-red-50'
                : 'border-slate-200 hover:border-slate-400'
            }`}
          >
            <span className="text-xs font-black uppercase tracking-wide text-slate-700">Pay in full</span>
            <span className="mt-2 block text-2xl font-black text-slate-950">{fmt(pricing.tuition_cents)}</span>
            <span className="mt-1 block text-sm text-slate-600">One secure payment</span>
          </button>

          <button
            type="button"
            onClick={() => continueToEnrollment('installments')}
            disabled={checkoutLoading !== null}
            className={`rounded-xl border-2 p-5 text-left transition-colors disabled:opacity-60 ${
              selectedPlan === 'installments'
                ? 'border-brand-red-600 bg-red-50'
                : 'border-slate-200 hover:border-slate-400'
            }`}
          >
            <span className="text-xs font-black uppercase tracking-wide text-slate-700">Deposit + payment plan</span>
            <span className="mt-2 block text-2xl font-black text-slate-950">{fmt(installmentCents)}</span>
            <span className="mt-1 block text-sm text-slate-600">Required deposit; review the remaining balance and schedule before payment</span>
          </button>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <label htmlFor={`coupon-${programSlug}`} className="flex items-center gap-2 font-bold text-blue-950">
            <Tag className="h-5 w-5 text-blue-700" /> Coupon or promotion code
          </label>
          <input
            id={`coupon-${programSlug}`}
            value={couponCode}
            onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
            placeholder="Enter coupon code"
            autoComplete="off"
            className="mt-3 block w-full rounded-lg border border-blue-300 bg-white px-3 py-3 font-semibold uppercase tracking-wide text-slate-950 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>

        <p className="text-sm leading-6 text-slate-600">
          Pay securely online as part of enrollment. Available payment methods are shown at checkout.
          The deposit is credited toward tuition. A lower promotional deposit requires a valid coupon.
          BNPL appears only when an enabled provider is configured and separately approves the applicant.
        </p>

        {checkoutLoading ? (
          <div className="flex items-center justify-center gap-2 text-sm font-bold text-slate-700" role="status">
            <Loader2 className="h-4 w-4 animate-spin" />
            Opening secure enrollment…
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <CreditCard className="h-4 w-4" />
            Sign in to pay, then complete the Full Enrollment Application. No separate invoice request is needed.
          </div>
        )}

        {error ? (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
          </div>
        ) : null}
      </div>
    </div>
  );
}
