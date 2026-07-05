'use client';

import { useState } from 'react';
import { Calculator, Info } from 'lucide-react';
import {
  TUITION_DOLLARS,
  MIN_SETUP_FEE_CENTS,
  TOTAL_HOURS_REQUIRED,
  PAYMENT_TERM_WEEKS,
} from '@/lib/barber/pricing';

const SETUP_FEE = MIN_SETUP_FEE_CENTS / 100;
const REMAINING_BALANCE = TUITION_DOLLARS - SETUP_FEE;
// Weekly payment is fixed — 29 weeks regardless of transfer hours or pace
const WEEKLY_PAYMENT = Math.round((REMAINING_BALANCE / PAYMENT_TERM_WEEKS) * 100) / 100;

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function TransferHoursCalculator() {
  const [transferHoursStr, setTransferHoursStr] = useState('');
  const [hoursPerWeek, setHoursPerWeek] = useState(40);
  const maxTransferHours = TOTAL_HOURS_REQUIRED - 100;
  const transferHours = Math.min(
    maxTransferHours,
    Math.max(0, parseInt(transferHoursStr, 10) || 0),
  );

  const remainingHours = Math.max(0, TOTAL_HOURS_REQUIRED - transferHours);
  // Duration estimate is display-only — does not affect price
  const estimatedWeeks = Math.ceil(remainingHours / hoursPerWeek);

  return (
    <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-6 text-white">
      <div className="flex items-center gap-3 mb-4">
        <Calculator className="w-6 h-6" />
        <h3 className="text-lg font-bold">Transfer Hours Calculator</h3>
      </div>
      
      <p className="text-amber-100 text-sm mb-6">
        Already have documented barber training hours? Enter them below to see your estimated weekly payment.
      </p>

      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-amber-100 mb-2">
            Hours to Transfer
          </label>
          <input
            type="number"
            min="0"
            max={TOTAL_HOURS_REQUIRED - 100}
            step="50"
            value={transferHours}
            onChange={(e) => setTransferHours(Math.min(TOTAL_HOURS_REQUIRED - 100, Math.max(0, parseInt(e.target.value) || 0)))}
            className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-slate-900 placeholder-white/50 focus:ring-2 focus:ring-white/50 focus:border-transparent"
            placeholder="e.g., 500"
          />
          <p className="text-xs text-amber-200 mt-1">Max: {TOTAL_HOURS_REQUIRED - 100} hours</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-amber-100 mb-2">
            Hours Per Week
          </label>
          <select
            value={hoursPerWeek}
            onChange={(e) => setHoursPerWeek(parseInt(e.target.value))}
            className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-slate-900 focus:ring-2 focus:ring-white/50 focus:border-transparent"
          >
            <option value="20">20 hrs/week</option>
            <option value="25">25 hrs/week</option>
            <option value="30">30 hrs/week</option>
            <option value="35">35 hrs/week</option>
            <option value="40">40 hrs/week</option>
          </select>
        </div>
      </div>

      {/* Results */}
      <div className="bg-white/10 rounded-xl p-4">
        <div className="grid sm:grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-amber-200 text-xs uppercase tracking-wide mb-1">Remaining Hours</div>
            <div className="text-2xl font-black">{remainingHours.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-amber-200 text-xs uppercase tracking-wide mb-1">Weekly Payment</div>
            <div className="text-2xl font-black">${WEEKLY_PAYMENT.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-amber-200 text-xs uppercase tracking-wide mb-1">Est. Duration</div>
            <div className="text-2xl font-black">~{estimatedWeeks} weeks</div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-white/20 flex items-start gap-2">
          <Info className="w-4 h-4 text-amber-200 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-100">
            <strong>Weekly payment is fixed at ${WEEKLY_PAYMENT.toFixed(2)}</strong> for all students —
            transfer hours reduce your remaining OJL hours only, not your payment amount.
            Setup fee: {formatCurrency(SETUP_FEE)} minimum down payment.
          </p>
        </div>
      </div>
    </div>
  );
}
