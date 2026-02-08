"use client";

import React, { useState, useMemo } from 'react';
import { CreditCard, Calendar, Circle, AlertTriangle } from 'lucide-react';

/**
 * Flat Fee Payment Calculator
 * 
 * COMPLIANCE NOTICE:
 * - Program fee is FLAT ($4,980) regardless of transferred hours
 * - Transferred hours reduce time-in-program ONLY, NOT the fee
 * - This component does NOT calculate price based on hours
 */

interface PaymentPlan {
  months: number;
  monthlyAmount: number;
  label: string;
}

interface FlatFeePaymentCalculatorProps {
  programName: string;
  programFee: number;
  minDownPayment?: number;
  onSelectPlan: (plan: {
    downPayment: number;
    planMonths: number;
    monthlyAmount: number;
    totalPrice: number;
  }) => void;
}

export function FlatFeePaymentCalculator({
  programName,
  programFee = 4980,
  minDownPayment = 100,
  onSelectPlan,
}: FlatFeePaymentCalculatorProps) {
  const [downPayment, setDownPayment] = useState<string>('');
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);

  const downPaymentNum = parseFloat(downPayment) || 0;
  const balance = Math.max(programFee - downPaymentNum, 0);

  const paymentPlans: PaymentPlan[] = useMemo(() => {
    if (balance <= 0) return [];
    
    return [
      { months: 2, monthlyAmount: Math.ceil(balance / 2 * 100) / 100, label: '2 Months' },
      { months: 3, monthlyAmount: Math.ceil(balance / 3 * 100) / 100, label: '3 Months' },
      { months: 4, monthlyAmount: Math.ceil(balance / 4 * 100) / 100, label: '4 Months' },
      { months: 6, monthlyAmount: Math.ceil(balance / 6 * 100) / 100, label: '6 Months' },
      { months: 9, monthlyAmount: Math.ceil(balance / 9 * 100) / 100, label: '9 Months' },
      { months: 12, monthlyAmount: Math.ceil(balance / 12 * 100) / 100, label: '12 Months' },
    ].filter(p => p.monthlyAmount >= 50);
  }, [balance]);

  const handleDownPaymentChange = (value: string) => {
    const cleaned = value.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) return;
    if (parts[1]?.length > 2) return;
    
    setDownPayment(cleaned);
    setSelectedPlan(null);
  };

  const handleQuickAmount = (amount: number) => {
    setDownPayment(amount.toString());
    setSelectedPlan(null);
  };

  const handleSelectPlan = (months: number) => {
    setSelectedPlan(months);
  };

  const handleContinue = () => {
    if (balance <= 0) {
      onSelectPlan({
        downPayment: downPaymentNum,
        planMonths: 0,
        monthlyAmount: 0,
        totalPrice: programFee,
      });
    } else if (selectedPlan) {
      const plan = paymentPlans.find(p => p.months === selectedPlan);
      if (plan) {
        onSelectPlan({
          downPayment: downPaymentNum,
          planMonths: plan.months,
          monthlyAmount: plan.monthlyAmount,
          totalPrice: programFee,
        });
      }
    }
  };

  const isValid = downPaymentNum >= minDownPayment && (balance <= 0 || selectedPlan !== null);

  return (
    <div className="bg-white rounded-xl border-2 border-slate-200 shadow-lg overflow-hidden">
      <div className="bg-brand-red-600 p-6 text-white">
        <h2 className="text-xl font-bold">{programName}</h2>
        <p className="text-brand-red-200 text-sm mt-1">DOL Registered Apprenticeship Sponsorship</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Compliance Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-900">
              <strong>Important:</strong> This program provides apprenticeship sponsorship, oversight, and related instruction only. 
              It does not replace barber school or grant state licensure hours.
            </div>
          </div>
        </div>

        {/* Program Fee Display */}
        <div className="bg-brand-red-50 border border-brand-red-200 rounded-lg p-6 text-center">
          <div className="text-sm text-brand-red-700 mb-1">Program Fee (Flat Rate)</div>
          <div className="text-4xl font-black text-brand-red-600">${programFee.toLocaleString()}</div>
          <p className="text-xs text-brand-red-600 mt-2">
            Fee applies regardless of transferred hours
          </p>
        </div>

        {/* Down Payment Input */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            How much would you like to pay today?
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg font-semibold">$</span>
            <input
              type="text"
              inputMode="decimal"
              value={downPayment}
              onChange={(e) => handleDownPaymentChange(e.target.value)}
              className="w-full pl-8 pr-4 py-4 text-2xl font-bold border-2 border-slate-300 rounded-lg focus:border-brand-red-500 focus:ring-2 focus:ring-brand-red-200 outline-none"
              placeholder="0.00"
            />
          </div>
          {downPaymentNum > 0 && downPaymentNum < minDownPayment && (
            <p className="text-red-600 text-sm mt-1">Minimum payment is ${minDownPayment}</p>
          )}

          <div className="flex flex-wrap gap-2 mt-3">
            <button
              onClick={() => handleQuickAmount(500)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-semibold text-slate-700 transition"
            >
              $500
            </button>
            <button
              onClick={() => handleQuickAmount(1000)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-semibold text-slate-700 transition"
            >
              $1,000
            </button>
            <button
              onClick={() => handleQuickAmount(2000)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-semibold text-slate-700 transition"
            >
              $2,000
            </button>
            <button
              onClick={() => handleQuickAmount(programFee)}
              className="px-4 py-2 bg-green-100 hover:bg-green-200 rounded-lg text-sm font-semibold text-green-700 transition"
            >
              Pay in Full (${programFee.toLocaleString()})
            </button>
          </div>
        </div>

        {/* Balance Display */}
        {downPaymentNum > 0 && (
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Program Fee</span>
              <span className="font-semibold">${programFee.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-slate-600">Today&apos;s Payment</span>
              <span className="font-semibold text-green-600">-${downPaymentNum.toLocaleString()}</span>
            </div>
            <div className="border-t border-slate-300 mt-3 pt-3 flex justify-between items-center">
              <span className="font-semibold text-slate-800">Remaining Balance</span>
              <span className="text-xl font-bold text-brand-red-600">
                ${balance.toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* Payment Plan Options */}
        {balance > 0 && downPaymentNum >= minDownPayment ? (
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              <Calendar className="inline w-4 h-4 mr-1" />
              Split your remaining ${balance.toLocaleString()} into monthly payments:
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {paymentPlans.map((plan) => (
                <button
                  key={plan.months}
                  onClick={() => handleSelectPlan(plan.months)}
                  className={`p-4 rounded-lg border-2 text-left transition ${
                    selectedPlan === plan.months
                      ? 'border-brand-red-600 bg-brand-red-50 ring-2 ring-brand-red-200'
                      : 'border-slate-200 hover:border-brand-red-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-lg font-bold text-slate-800">
                    ${plan.monthlyAmount.toLocaleString()}
                    <span className="text-sm font-normal text-slate-500">/mo</span>
                  </div>
                  <div className="text-sm text-slate-600">{plan.label}</div>
                  {selectedPlan === plan.months && (
                    <Circle className="w-5 h-5 text-brand-red-600 mt-2" />
                  )}
                </button>
              ))}
            </div>
          </div>
        ) : downPaymentNum >= programFee ? (
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 text-center">
            <Circle className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="font-bold text-green-800">Paying in Full!</div>
            <div className="text-sm text-green-700">No monthly payments required</div>
          </div>
        ) : null}

        {/* Summary */}
        {isValid && (
          <div className="bg-brand-red-50 border border-brand-red-200 rounded-lg p-4">
            <h3 className="font-semibold text-brand-red-900 mb-2">Payment Summary</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-brand-red-700">Today&apos;s Payment</span>
                <span className="font-semibold text-brand-red-900">${downPaymentNum.toLocaleString()}</span>
              </div>
              {balance > 0 && selectedPlan && (
                <div className="flex justify-between">
                  <span className="text-brand-red-700">Monthly Payment</span>
                  <span className="font-semibold text-brand-red-900">
                    ${paymentPlans.find(p => p.months === selectedPlan)?.monthlyAmount.toLocaleString()}/mo × {selectedPlan}
                  </span>
                </div>
              )}
              <div className="border-t border-brand-red-200 pt-2 mt-2 flex justify-between">
                <span className="font-semibold text-brand-red-900">Total Program Fee</span>
                <span className="font-bold text-brand-red-900">${programFee.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleContinue}
          disabled={!isValid}
          className={`w-full py-4 rounded-lg font-bold text-lg transition ${
            isValid
              ? 'bg-brand-red-600 hover:bg-brand-red-700 text-white'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          <CreditCard className="inline w-5 h-5 mr-2" />
          {balance <= 0 ? `Pay $${downPaymentNum.toLocaleString()} Now` : 'Continue to Payment'}
        </button>

        {/* What's Included */}
        <div className="text-xs text-slate-500 space-y-1">
          <p className="font-semibold">Program Fee Covers:</p>
          <ul className="list-disc list-inside">
            <li>DOL Registered Apprenticeship sponsorship</li>
            <li>Compliance and RAPIDS reporting</li>
            <li>Employer coordination and OJT verification</li>
            <li>Program monitoring and completion documentation</li>
            <li>Related Instruction: Milady theory curriculum</li>
          </ul>
          <p className="mt-2 text-amber-600 font-medium">
            Does NOT include: Barber school, practical training, or state licensure hours.
          </p>
        </div>
      </div>
    </div>
  );
}

export default FlatFeePaymentCalculator;
