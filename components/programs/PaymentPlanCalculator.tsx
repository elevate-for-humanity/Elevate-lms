'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, CreditCard, Loader2, Tag } from 'lucide-react';

interface ProgramPricing {
  program_slug: string;
  program_name: string;
  tuition_cents: number;
  source?: string;
}

interface Props {
  programSlug: string;
  stripeDepositUrl?: string;
  stripeFullUrl?: string;
  successUrl?: string;
  initialPaymentMode?: 'full' | 'plan' | 'bnpl';
}

function fmt(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
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
      .then(setPricing)
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
    setCheckoutLoading(paymentPlan);
    const query = new URLSearchParams({ payment_plan: paymentPlan });
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

  const installmentCents = Math.ceil(pricing.tuition_cents / 4);
  const selectedPlan = initialPaymentMode === 'full' ? 'full' : initialPaymentMode ? 'installments' : null;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="bg-slate-950 px-5 py-5 text-white">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-300">Self-pay options</p>
        <p className="mt-1 text-xl font-extrabold">{pricing.program_name}</p>
        <p className="mt-1 text-sm text-slate-300">Published tuition: {fmt(pricing.tuition_cents)}</p>
      </div>

      <div className="space-y-5 p-5 sm:p-6">
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
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">Pay in full</span>
            <span className="mt-2 block text-2xl font-black text-slate-950">{fmt(pricing.tuition_cents)}</span>
            <span className="mt-1 block text-sm text-slate-600">One QuickBooks invoice</span>
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
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">Four installments</span>
            <span className="mt-2 block text-2xl font-black text-slate-950">{fmt(installmentCents)}</span>
            <span className="mt-1 block text-sm text-slate-600">Initial invoice, then three monthly invoices</span>
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
          Secure enrollment uses QuickBooks. Online card or ACH availability is shown on the invoice.
          The installment option is Elevate&apos;s four-invoice plan; it is not third-party BNPL.
        </p>

        {checkoutLoading ? (
          <div className="flex items-center justify-center gap-2 text-sm font-bold text-slate-700" role="status">
            <Loader2 className="h-4 w-4 animate-spin" />
            Opening secure enrollment…
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <CreditCard className="h-4 w-4" />
            Sign-in is required before an invoice is created.
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
