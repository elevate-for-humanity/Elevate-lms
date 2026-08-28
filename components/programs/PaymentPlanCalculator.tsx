'use client';

/**
 * PaymentPlanCalculator
 *
 * Public calculator backed by /api/programs/pricing. Every program with a
 * published self-pay price receives a calculator, even when no DB pricing row
 * exists. Checkout is created server-side so the selected deposit amount,
 * promotion-code box, metadata, BNPL availability, and webhook processing stay
 * consistent.
 */

import { useEffect, useState, useCallback } from 'react';
import { CreditCard, Loader2, AlertCircle, ChevronDown, ChevronUp, Tag } from 'lucide-react';
import { BNPL_PROVIDER_NAMES } from '@/lib/bnpl-config';

interface ProgramPricing {
  program_slug: string;
  program_name: string;
  tuition_cents: number;
  deposit_min_cents: number;
  deposit_default_cents: number;
  payment_frequency: 'weekly' | 'biweekly' | 'monthly';
  payment_weeks: number;
  stripe_deposit_url: string | null;
  stripe_full_url: string | null;
  notes: string | null;
  source?: string;
}

interface Props {
  programSlug: string;
  stripeDepositUrl?: string;
  stripeFullUrl?: string;
  successUrl?: string;
}

function fmt(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(cents / 100);
}

export default function PaymentPlanCalculator({ programSlug, successUrl }: Props) {
  const [pricing, setPricing] = useState<ProgramPricing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [depositCents, setDepositCents] = useState(0);
  const [showSchedule, setShowSchedule] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<'deposit' | 'full' | null>(null);
  const [couponCode, setCouponCode] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    fetch(`/api/programs/pricing?slug=${encodeURIComponent(programSlug)}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok || data.error) throw new Error(data.error || 'Pricing unavailable');
        return data;
      })
      .then((data) => {
        setPricing(data);
        setDepositCents(data.deposit_default_cents);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load pricing'))
      .finally(() => setLoading(false));
  }, [programSlug]);

  const periodicPayment = useCallback(() => {
    if (!pricing) return 0;
    const remaining = Math.max(0, pricing.tuition_cents - depositCents);
    return Math.ceil(remaining / Math.max(1, pricing.payment_weeks));
  }, [pricing, depositCents]);

  async function startCheckout(mode: 'deposit' | 'full') {
    if (!pricing || checkoutLoading) return;
    setCheckoutLoading(mode);
    setError('');
    try {
      const res = await fetch('/api/checkout/program', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: programSlug,
          checkoutMode: mode,
          amountCents: mode === 'deposit' ? depositCents : pricing.tuition_cents,
          successUrl: successUrl
            ? `${window.location.origin}${successUrl}${successUrl.includes('?') ? '&' : '?'}session_id={CHECKOUT_SESSION_ID}&payment=success`
            : `${window.location.origin}/programs/${programSlug}/enrollment-success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/programs/${programSlug}`,
          couponCode: couponCode.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || 'Unable to start checkout');
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to start checkout');
      setCheckoutLoading(null);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center gap-2 py-10 text-slate-500 text-base"><Loader2 className="w-5 h-5 animate-spin" /> Loading payment options…</div>;
  }

  if (error && !pricing) {
    return <div className="flex items-center gap-2 text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-4 text-base"><AlertCircle className="w-5 h-5 flex-shrink-0" />{error}</div>;
  }

  if (!pricing) return null;

  const minDeposit = pricing.deposit_min_cents;
  const maxDeposit = pricing.tuition_cents;
  const remaining = Math.max(0, pricing.tuition_cents - depositCents);
  const payingInFull = depositCents >= pricing.tuition_cents;
  const payment = periodicPayment();
  const schedule: { period: number; amount: number }[] = [];
  if (!payingInFull) {
    let balance = remaining;
    for (let i = 1; i <= pricing.payment_weeks; i++) {
      const amount = Math.min(payment, balance);
      if (amount <= 0) break;
      schedule.push({ period: i, amount });
      balance -= amount;
    }
  }

  const frequencyLabel = pricing.payment_frequency === 'weekly' ? 'Weekly' : pricing.payment_frequency === 'biweekly' ? 'Biweekly' : 'Monthly';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      <div className="bg-slate-900 px-5 py-5">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-300 mb-1">Payment Calculator</p>
        <p className="text-white font-extrabold text-xl">{pricing.program_name}</p>
        <p className="text-slate-300 text-sm mt-1">Published self-pay tuition: {fmt(pricing.tuition_cents)}</p>
      </div>

      <div className="p-5 sm:p-6 space-y-6">
        <div>
          <div className="flex items-center justify-between gap-3 mb-2">
            <label className="text-base font-bold text-slate-800">Choose a deposit</label>
            <span className="text-xl font-extrabold text-slate-950">{fmt(depositCents)}</span>
          </div>
          <input aria-label="Deposit amount" type="range" min={minDeposit} max={maxDeposit} step={100} value={depositCents} onChange={(e) => setDepositCents(Number(e.target.value))} className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-slate-900" />
          <div className="flex justify-between text-sm text-slate-500 mt-2"><span>Minimum {fmt(minDeposit)}</span><span>Full tuition {fmt(pricing.tuition_cents)}</span></div>
        </div>

        {payingInFull ? (
          <div className="bg-brand-green-50 border border-brand-green-200 rounded-xl p-5 text-center">
            <p className="text-brand-green-900 font-extrabold text-xl">Pay in full — {fmt(pricing.tuition_cents)}</p>
            <p className="text-brand-green-800 text-base mt-1">No remaining program balance after this payment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
            <div className="bg-slate-50 rounded-xl p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Deposit</p><p className="text-2xl font-extrabold text-slate-950 mt-1">{fmt(depositCents)}</p><p className="text-sm text-slate-500">today</p></div>
            <div className="bg-brand-red-50 rounded-xl p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{frequencyLabel}</p><p className="text-2xl font-extrabold text-slate-950 mt-1">{fmt(payment)}</p><p className="text-sm text-slate-500">estimated</p></div>
            <div className="bg-slate-50 rounded-xl p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Payments</p><p className="text-2xl font-extrabold text-slate-950 mt-1">{schedule.length}</p><p className="text-sm text-slate-500">estimated</p></div>
          </div>
        )}

        {!payingInFull && schedule.length > 0 && (
          <div>
            <button type="button" onClick={() => setShowSchedule(!showSchedule)} className="flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-slate-950">
              {showSchedule ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}{showSchedule ? 'Hide' : 'Show'} estimated schedule
            </button>
            {showSchedule && (
              <div className="mt-3 max-h-56 overflow-y-auto rounded-xl border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 sticky top-0"><tr><th className="text-left px-3 py-2">Payment</th><th className="text-right px-3 py-2">Amount</th><th className="text-right px-3 py-2">Balance</th></tr></thead>
                  <tbody>
                    <tr className="border-t bg-slate-50"><td className="px-3 py-2 font-semibold">Deposit</td><td className="px-3 py-2 text-right font-semibold">{fmt(depositCents)}</td><td className="px-3 py-2 text-right">{fmt(remaining)}</td></tr>
                    {schedule.map((row, i) => {
                      const balanceAfter = remaining - schedule.slice(0, i + 1).reduce((sum, r) => sum + r.amount, 0);
                      return <tr key={row.period} className="border-t"><td className="px-3 py-2">{frequencyLabel} {row.period}</td><td className="px-3 py-2 text-right">{fmt(row.amount)}</td><td className="px-3 py-2 text-right text-slate-500">{fmt(Math.max(0, balanceAfter))}</td></tr>;
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <label htmlFor={`coupon-${programSlug}`} className="flex items-center gap-2 font-bold text-blue-950">
            <Tag className="w-5 h-5 text-blue-700" />
            Coupon or promotion code
          </label>
          <div className="mt-3 flex flex-col sm:flex-row gap-2">
            <input
              id={`coupon-${programSlug}`}
              type="text"
              value={couponCode}
              onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
              placeholder="Enter coupon code"
              autoComplete="off"
              className="min-w-0 flex-1 rounded-lg border border-blue-300 bg-white px-3 py-2.5 text-base font-semibold uppercase tracking-wide text-slate-950 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            {couponCode && (
              <button
                type="button"
                onClick={() => setCouponCode('')}
                className="rounded-lg border border-blue-300 bg-white px-4 py-2.5 text-sm font-bold text-blue-800 hover:bg-blue-100"
              >
                Clear
              </button>
            )}
          </div>
          <p className="text-sm leading-relaxed text-blue-800 mt-2">
            The code is securely validated when checkout starts. Only active promotion codes configured in Elevate&apos;s Stripe account are accepted.
          </p>
        </div>

        <div className="space-y-3 pt-2 border-t border-slate-100">
          {!payingInFull && (
            <button type="button" onClick={() => startCheckout('deposit')} disabled={checkoutLoading !== null} className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-slate-950 text-white text-base font-extrabold hover:bg-slate-800 disabled:opacity-60">
              {checkoutLoading === 'deposit' ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />} Pay {fmt(depositCents)} Deposit
            </button>
          )}
          <button type="button" onClick={() => startCheckout('full')} disabled={checkoutLoading !== null} className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-brand-red-600 text-white text-base font-extrabold hover:bg-brand-red-700 disabled:opacity-60">
            {checkoutLoading === 'full' ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />} Pay {fmt(pricing.tuition_cents)} in Full
          </button>
          <p className="text-sm text-slate-600 text-center">{BNPL_PROVIDER_NAMES} may appear when the transaction is eligible and enabled in Stripe.</p>
          <p className="text-xs leading-relaxed text-slate-500 text-center">Calculator amounts are estimates for planning. Third-party BNPL approval, installment amount, fees, eligibility, and repayment terms are determined by the payment provider at checkout.</p>
        </div>

        {error && <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{error}</div>}
        {pricing.notes && <p className="text-xs leading-relaxed text-slate-500">{pricing.notes}</p>}
      </div>
    </div>
  );
}
