'use client';

import { useState } from 'react';
import { CreditCard, AlertCircle, Clock, DollarSign, CalendarDays } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export interface BillingSummary {
  program: 'barber' | 'cosmetology';
  paymentStatus: string;
  weeklyPaymentCents: number | null;
  remainingBalance: number | null;
  fullTuitionAmount: number | null;
  amountPaidAtCheckout: number | null;
  nextPaymentDate: string | null;
  fullyPaid: boolean;
  setupFeePaid: boolean;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  active: {
    label: 'Active',
    color: 'bg-brand-green-100 text-brand-green-800',
    icon: <span className="w-3.5 h-3.5 rounded-full bg-brand-blue-600 inline-block flex-shrink-0" aria-hidden="true" />,
  },
  past_due: {
    label: 'Payment Due',
    color: 'bg-red-100 text-red-800',
    icon: <AlertCircle className="w-3.5 h-3.5" />,
  },
  suspended: {
    label: 'Suspended',
    color: 'bg-red-100 text-red-800',
    icon: <AlertCircle className="w-3.5 h-3.5" />,
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-slate-100 text-slate-700',
    icon: <AlertCircle className="w-3.5 h-3.5" />,
  },
  paid_in_full: {
    label: 'Paid in Full',
    color: 'bg-brand-green-100 text-brand-green-800',
    icon: <span className="w-3.5 h-3.5 rounded-full bg-brand-blue-600 inline-block flex-shrink-0" aria-hidden="true" />,
  },
  pending_payment_method: {
    label: 'Setup Pending',
    color: 'bg-amber-100 text-amber-800',
    icon: <Clock className="w-3.5 h-3.5" />,
  },
};

function fmt(cents: number | null): string {
  if (cents === null) return '—';
  return `$${(cents / 100).toFixed(2)}`;
}

function fmtDollars(amount: number | null): string {
  if (amount === null) return '—';
  return `$${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function BillingCard({ billing }: { billing: BillingSummary }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const statusCfg = STATUS_CONFIG[billing.paymentStatus] ?? {
    label: billing.paymentStatus,
    color: 'bg-slate-100 text-slate-700',
    icon: <Clock className="w-3.5 h-3.5" />,
  };

  // Estimate total paid = full_tuition - remaining_balance
  const totalPaid =
    billing.fullTuitionAmount !== null && billing.remainingBalance !== null
      ? billing.fullTuitionAmount - billing.remainingBalance
      : null;

  async function handleUpdatePayment() {
    setLoading(true);
    setError('');
    try {
      const endpoint =
        billing.program === 'barber'
          ? '/api/barber/update-payment'
          : '/api/cosmetology/update-payment';
      const res = await fetch(endpoint, { method: 'POST' });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'Unable to open billing portal. Please contact support.');
        return;
      }
      window.location.href = json.url;
    } catch {
      setError('Unable to reach the billing portal. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
      {/* Header */}
      <div className="p-5 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-brand-blue-600" />
          <h2 className="text-base font-semibold text-slate-900">Tuition &amp; Payments</h2>
        </div>
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${statusCfg.color}`}
        >
          {statusCfg.icon}
          {statusCfg.label}
        </span>
      </div>

      <div className="p-5 space-y-3">
        {/* Rows */}
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1.5 text-slate-600">
            <DollarSign className="w-4 h-4 text-slate-400" />
            Weekly Tuition Payment
          </span>
          <span className="font-semibold text-slate-900">
            {billing.fullyPaid ? 'Paid in full' : fmt(billing.weeklyPaymentCents)}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">Total Tuition</span>
          <span className="font-semibold text-slate-900">
            {fmtDollars(billing.fullTuitionAmount)}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">Amount Paid</span>
          <span className="font-semibold text-brand-green-700">{fmtDollars(totalPaid)}</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">Remaining Balance</span>
          <span
            className={`font-semibold ${
              billing.fullyPaid ? 'text-brand-green-700' : 'text-slate-900'
            }`}
          >
            {billing.fullyPaid ? '$0.00' : fmtDollars(billing.remainingBalance)}
          </span>
        </div>

        {/* Progress bar */}
        {billing.fullTuitionAmount && billing.fullTuitionAmount > 0 && (
          <div>
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>Tuition progress</span>
              <span>
                {Math.round(
                  ((totalPaid ?? 0) / Number(billing.fullTuitionAmount)) * 100,
                )}
                %
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div
                className="bg-brand-orange-500 h-2 rounded-full transition-all"
                style={{
                  width: `${Math.min(
                    100,
                    Math.round(
                      ((totalPaid ?? 0) / Number(billing.fullTuitionAmount)) * 100,
                    ),
                  )}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Next payment */}
        {!billing.fullyPaid && billing.nextPaymentDate && (
          <div className="flex items-center justify-between text-sm pt-1">
            <span className="flex items-center gap-1.5 text-slate-600">
              <CalendarDays className="w-4 h-4 text-slate-400" />
              Next Payment
            </span>
            <span className="font-semibold text-slate-900">
              {fmtDate(billing.nextPaymentDate)}
            </span>
          </div>
        )}

        {/* Past due alert */}
        {billing.paymentStatus === 'past_due' && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-lg p-3 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Your payment is past due. Update your payment method below to avoid suspension.
            </span>
          </div>
        )}

        {billing.paymentStatus === 'suspended' && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-lg p-3 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Your account is suspended due to non-payment. Call{' '}
              <a href={`tel:${PLATFORM_DEFAULTS.supportPhone.replace(/[^0-9]/g, "")}`} className="font-semibold underline">
                {PLATFORM_DEFAULTS.supportPhone}
              </a>{' '}
              to restore access.
            </span>
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-xs text-red-600 bg-red-50 rounded p-2">{error}</p>
        )}

        {/* Update payment method — only if not paid in full and has Stripe */}
        {!billing.fullyPaid && billing.paymentStatus !== 'cancelled' && (
          <button
            onClick={handleUpdatePayment}
            disabled={loading}
            className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-blue-600 hover:bg-brand-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition"
          >
            <CreditCard className="w-4 h-4" />
            {loading ? 'Opening portal…' : 'Update Payment Method'}
          </button>
        )}
      </div>
    </div>
  );
}
