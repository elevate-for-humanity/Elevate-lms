'use client';

import { useState } from 'react';
import { Calculator, DollarSign, Calendar } from 'lucide-react';

interface TuitionCalculatorProps {
  totalPrice: number;
  regularPrice?: number;
  minDown: number;
  maxWeeks: number;
  programName: string;
}

export default function TuitionCalculator({
  totalPrice,
  regularPrice,
  minDown,
  maxWeeks,
  programName,
}: TuitionCalculatorProps) {
  const [downPayment, setDownPayment] = useState(minDown);
  const [weeks, setWeeks] = useState(Math.min(20, maxWeeks));

  const remaining = Math.max(0, totalPrice - downPayment);
  const weekly = weeks > 0 ? Math.ceil(remaining / weeks) : remaining;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="w-5 h-5 text-brand-blue-600" />
        <h3 className="font-bold text-slate-900">Payment Calculator</h3>
      </div>

      {/* Price display */}
      <div className="bg-slate-50 rounded-xl p-4 mb-5">
        <p className="text-sm text-slate-500">Total Tuition</p>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-slate-900">${totalPrice.toLocaleString()}</span>
          {regularPrice && regularPrice > totalPrice && (
            <span className="text-lg line-through text-slate-400">${regularPrice.toLocaleString()}</span>
          )}
        </div>
        {regularPrice && regularPrice > totalPrice && (
          <p className="text-sm text-brand-red-600 font-semibold mt-1">
            Save ${(regularPrice - totalPrice).toLocaleString()} — limited time
          </p>
        )}
      </div>

      {/* Down payment slider */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-slate-700">Down Payment</label>
          <div className="flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5 text-slate-400" />
            <input
              aria-label="Down payment amount"
              type="number"
              value={downPayment}
              onChange={(e) => setDownPayment(Math.max(minDown, Math.min(totalPrice, Number(e.target.value) || 0)))}
              className="w-20 text-right text-sm font-bold text-slate-900 border border-slate-300 rounded px-2 py-1 focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <input
          aria-label="Down payment slider"
          type="range"
          min={minDown}
          max={totalPrice}
          step={50}
          value={downPayment}
          onChange={(e) => setDownPayment(Number(e.target.value))}
          className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-brand-blue-600"
        />
        <div className="flex justify-between text-xs text-slate-400 mt-1">
          <span>Min ${minDown}</span>
          <span>Pay in full ${totalPrice.toLocaleString()}</span>
        </div>
      </div>

      {/* Weeks slider */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-slate-700">Payment Weeks</label>
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-sm font-bold text-slate-900">{weeks} weeks</span>
          </div>
        </div>
        <input
          aria-label="Payment plan duration in weeks"
          type="range"
          min={4}
          max={maxWeeks}
          step={1}
          value={weeks}
          onChange={(e) => setWeeks(Number(e.target.value))}
          className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-brand-blue-600"
        />
        <div className="flex justify-between text-xs text-slate-400 mt-1">
          <span>4 weeks</span>
          <span>{maxWeeks} weeks</span>
        </div>
      </div>

      {/* Result */}
      <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-xl p-4">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xs text-slate-500">Down Payment</p>
            <p className="text-lg font-bold text-slate-900">${downPayment.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Weekly Payment</p>
            <p className="text-lg font-bold text-brand-blue-700">${weekly.toLocaleString()}/wk</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Duration</p>
            <p className="text-lg font-bold text-slate-900">{weeks} weeks</p>
          </div>
        </div>
        <p className="text-xs text-center text-slate-500 mt-2">
          Total: ${downPayment.toLocaleString()} + (${weekly} × {weeks}) = ${(downPayment + weekly * weeks).toLocaleString()}
        </p>
      </div>
    </div>
  );
}
