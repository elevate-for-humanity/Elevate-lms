'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  MIN_SETUP_FEE_CENTS,
  PAYMENT_TERM_WEEKS,
  TUITION_DOLLARS,
  weeklyPaymentCents,
} from '@/lib/cosmetology/pricing';
import { getProvidersForAmount } from '@/lib/bnpl-config';

export default function CosmetologyApprenticeForm() {
  const minDownPayment = MIN_SETUP_FEE_CENTS / 100;
  const defaultDownPayment = Math.max(minDownPayment, 600);
  const [downPayment, setDownPayment] = useState<number>(defaultDownPayment);

  const weeklyPayment = Math.ceil(weeklyPaymentCents(downPayment) / 100);
  const clampedDownPayment = Math.max(minDownPayment, downPayment || minDownPayment);
  const remainingBalance = Math.max(0, TUITION_DOLLARS - clampedDownPayment);

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-lg border border-slate-200 p-4 bg-slate-50">
          <p className="text-sm font-bold text-slate-900 mb-3">Payment Calculator</p>
          <label className="block text-sm text-slate-700 mb-1">Down Payment ($)</label>
          <input
            type="number"
            min={minDownPayment}
            value={downPayment}
            onChange={(e) => setDownPayment(Number(e.target.value || minDownPayment))}
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
          />
          <div className="mt-3 text-sm text-slate-700 space-y-1">
            <p>
              Weekly estimate: <strong>${weeklyPayment}</strong> for {PAYMENT_TERM_WEEKS} weeks
            </p>
            <p>
              Remaining balance: <strong>${remainingBalance.toLocaleString()}</strong>
            </p>
            <p className="text-xs text-slate-500">
              Minimum down payment is ${minDownPayment.toLocaleString()}.
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 p-4 bg-slate-50">
          <p className="text-sm font-bold text-slate-900 mb-3">BNPL &amp; Payment Options</p>
          <ul className="space-y-2 text-sm text-slate-700">
            <li>Pay in full (one-time payment)</li>
            <li>Weekly payment plan (custom down payment)</li>
            {getProvidersForAmount(TUITION_DOLLARS).map((p) => (
              <li key={p.id}>
                {p.name} — {p.description}
              </li>
            ))}
          </ul>
          <Link
            href="/programs/cosmetology-apprenticeship/payment/bnpl"
            className="inline-block mt-3 text-sm font-semibold text-brand-blue-600 hover:underline"
          >
            Compare BNPL providers →
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/apply?program=cosmetology-apprenticeship&payment=pay_in_full"
          className="inline-block px-6 py-3 bg-brand-red-600 text-white rounded-lg font-semibold hover:bg-brand-red-700 transition-colors"
        >
          Apply — Pay in Full
        </Link>
        <Link
          href="/programs/cosmetology-apprenticeship/payment-setup"
          className="inline-block px-6 py-3 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition-colors"
        >
          Apply — Payment Plan
        </Link>
        <Link
          href="/programs/cosmetology-apprenticeship/payment/bnpl"
          className="inline-block px-6 py-3 border border-brand-blue-600 text-brand-blue-700 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
        >
          Apply — BNPL (All Options)
        </Link>
      </div>
    </div>
  );
}
