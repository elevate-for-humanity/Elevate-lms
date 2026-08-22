'use client';

import React, { useMemo, useState } from 'react';
import { ACTIVE_BNPL_PROVIDERS } from '@/lib/bnpl-config';

interface PaymentCalculatorProps {
  totalCost: number;
  depositPercent?: number;
  maxWeeks?: number;
  /** @deprecated kept for existing callers; converted to approximately 4.33 weeks/month */
  maxMonths?: number;
  className?: string;
}

export default function PaymentCalculator({
  totalCost,
  depositPercent = 20,
  maxWeeks,
  maxMonths,
  className = '',
}: PaymentCalculatorProps) {
  const derivedMaxWeeks = Math.max(4, maxWeeks ?? (maxMonths ? Math.round(maxMonths * 4.33) : 52));
  const defaultDeposit = Math.round(totalCost * (depositPercent / 100));
  const [deposit, setDeposit] = useState(defaultDeposit);
  const availableTerms = [4, 8, 12, 16, 20, 24, 26, 39, 52].filter((weeks) => weeks <= derivedMaxWeeks);
  const termOptions = availableTerms.length ? availableTerms : [derivedMaxWeeks];
  const [termWeeks, setTermWeeks] = useState(termOptions.includes(12) ? 12 : termOptions[termOptions.length - 1]);

  const safeDeposit = Math.min(Math.max(0, Number.isFinite(deposit) ? deposit : 0), totalCost);
  const breakdown = useMemo(() => {
    const remaining = Math.max(0, totalCost - safeDeposit);
    return {
      remaining,
      weeklyPayment: termWeeks > 0 ? Math.ceil(remaining / termWeeks) : remaining,
    };
  }, [safeDeposit, termWeeks, totalCost]);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

  return (
    <div className={`bg-slate-50 rounded-xl p-6 border border-slate-200 ${className}`}>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">Weekly Payment Calculator</h3>
      <p className="mb-5 text-sm text-slate-600">Estimate an Elevate installment schedule. This calculator is not a financing approval or a quote from a third-party payment provider.</p>

      <div className="mb-5">
        <label htmlFor="payment-deposit" className="block text-sm font-medium text-slate-700 mb-2">Deposit amount</label>
        <div className="relative max-w-xs">
          <span className="absolute left-3 top-2.5 text-slate-500">$</span>
          <input
            id="payment-deposit"
            type="number"
            min={0}
            max={totalCost}
            step={25}
            value={safeDeposit}
            onChange={(event) => setDeposit(Math.min(totalCost, Math.max(0, Number(event.target.value) || 0)))}
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-7 pr-3 text-slate-900"
          />
        </div>
      </div>

      <div className="mb-5">
        <span className="block text-sm font-medium text-slate-700 mb-2">Weekly plan length</span>
        <div className="flex gap-2 flex-wrap">
          {termOptions.map((weeks) => (
            <button
              type="button"
              key={weeks}
              onClick={() => setTermWeeks(weeks)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${termWeeks === weeks ? 'bg-brand-blue-600 text-white' : 'bg-white border border-slate-300 text-slate-700 hover:border-brand-blue-400'}`}
            >
              {weeks} weeks
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center py-2 border-b border-slate-200"><span className="text-slate-600">Total Program Cost</span><span className="font-semibold text-slate-900">{formatCurrency(totalCost)}</span></div>
        <div className="flex justify-between items-center py-2 border-b border-slate-200"><span className="text-slate-600">Selected Deposit</span><span className="font-medium text-slate-900">{formatCurrency(safeDeposit)}</span></div>
        <div className="flex justify-between items-center py-2 border-b border-slate-200"><span className="text-slate-600">Remaining Balance</span><span className="font-medium text-slate-900">{formatCurrency(breakdown.remaining)}</span></div>
        <div className="flex justify-between items-center py-2 bg-slate-100 rounded-lg px-3 -mx-3"><span className="text-slate-700 font-medium">Estimated Weekly Payment</span><span className="font-bold text-brand-blue-700 text-lg">{formatCurrency(breakdown.weeklyPayment)}/week</span></div>
      </div>

      {ACTIVE_BNPL_PROVIDERS.length > 0 && (
        <div className="mt-6 pt-4 border-t border-slate-200">
          <p className="text-xs text-slate-500 mb-3">Third-party installment providers may also be available, subject to provider eligibility and terms:</p>
          <div className="flex flex-wrap gap-2">
            {ACTIVE_BNPL_PROVIDERS.map((provider) => <span key={provider.id} className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${provider.badgeBg} ${provider.badgeText}`}>{provider.name}</span>)}
          </div>
        </div>
      )}

      <p className="text-xs text-slate-500 mt-4">* Weekly estimate is simple balance division and does not add interest. Actual enrollment schedules and third-party financing terms may differ.</p>
    </div>
  );
}
