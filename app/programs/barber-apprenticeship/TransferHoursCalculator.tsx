'use client';

import { useState } from 'react';
import { Calculator, Info } from 'lucide-react';
import { BARBER_PRICING, calculateWeeklyPayment as calcWeekly } from '@/lib/programs/pricing';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function calculateWeeklyPayment(hoursPerWeek: number, transferHours: number = 0) {
  const result = calcWeekly(hoursPerWeek, transferHours, BARBER_PRICING.minDownPayment);
  return { weekly: result.weeklyPaymentDollars, weeks: result.weeksRemaining };
}

export function TransferHoursCalculator() {
  const [transferHours, setTransferHours] = useState(0);
  const [hoursPerWeek, setHoursPerWeek] = useState(40);

  const remainingHours = Math.max(0, BARBER_PRICING.totalHoursRequired - transferHours);
  const { weekly, weeks } = calculateWeeklyPayment(hoursPerWeek, transferHours);

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
            max={BARBER_PRICING.totalHoursRequired - 100}
            step="50"
            value={transferHours}
            onChange={(e) => setTransferHours(Math.min(BARBER_PRICING.totalHoursRequired - 100, Math.max(0, parseInt(e.target.value) || 0)))}
            className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-white/50 focus:border-transparent"
            placeholder="e.g., 500"
          />
          <p className="text-xs text-amber-200 mt-1">Max: {BARBER_PRICING.totalHoursRequired - 100} hours</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-amber-100 mb-2">
            Hours Per Week
          </label>
          <select
            value={hoursPerWeek}
            onChange={(e) => setHoursPerWeek(parseInt(e.target.value))}
            className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:ring-2 focus:ring-white/50 focus:border-transparent"
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
            <div className="text-amber-200 text-xs uppercase tracking-wide mb-1">Est. Weekly Payment</div>
            <div className="text-2xl font-black">${weekly.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-amber-200 text-xs uppercase tracking-wide mb-1">Est. Duration</div>
            <div className="text-2xl font-black">~{weeks} weeks</div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-white/20 flex items-start gap-2">
          <Info className="w-4 h-4 text-amber-200 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-100">
            <strong>Down payment starts at {formatCurrency(BARBER_PRICING.minDownPayment)}</strong>. 
            Transfer hours reduce program duration, not tuition. Full tuition: {formatCurrency(BARBER_PRICING.fullPrice)}.
          </p>
        </div>
      </div>
    </div>
  );
}
