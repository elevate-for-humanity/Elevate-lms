"use client";

import { createClient } from '@/lib/supabase/client';

import React, { useState, useMemo } from 'react';
import { CreditCard, Calendar, AlertTriangle } from 'lucide-react';

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

  const handleContinue = async () => {
    let planData: any = null;
    
    if (balance <= 0) {
      planData = {
        downPayment: downPaymentNum,
        planMonths: 0,
        monthlyAmount: 0,
        totalPrice: programFee,
      };
    } else if (selectedPlan) {
      const plan = paymentPlans.find(p => p.months === selectedPlan);
      if (plan) {
        planData = {
          downPayment: downPaymentNum,
          planMonths: plan.months,
          monthlyAmount: plan.monthlyAmount,
          totalPrice: programFee,
        };
      }
    }

    if (planData) {
      // Log payment plan selection for analytics
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from('payment_plan_selections').insert({
          user_id: user?.id || null,
          program_name: programName,
          program_fee: programFee,
          down_payment: planData.downPayment,
          plan_months: planData.planMonths,
          monthly_amount: planData.monthlyAmount,
          selected_at: new Date().toISOString(),
        }).catch(() => {});
      } catch {
        // Analytics logging is non-critical
      }

      onSelectPlan(planData);
    }
  };

  const isValid = downPaymentNum >= minDownPayment && (balance <= 0 || selectedPlan !== null);

  return (
    <div className="bg-white rounded-xl border-2 border-slate-200 shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-purple-600 to-brand-blue-600 p-6 text-white">
        <h2 className="text-xl font-bold">{programName}</h2>
        <p className="text-purple-200 text-sm mt-1">DOL Registered Apprenticeship Sponsorship</p>
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
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 text-center">
          <div className="text-sm text-purple-700 mb-1">Program Fee (Flat Rate)</div>
          <div className="text-4xl font-black text-purple-600">${programFee.toLocaleString()}</div>
          <p className="text-xs text-purple-600 mt-2">
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
              className="w-full pl-8 pr-4 py-4 text-2xl font-bold border-2 border-slate-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
              placeholder="0.00"
            />
          </div>
          {downPaymentNum > 0 && downPaymentNum < minDownPayment && (
            <p className="text-brand-red-600 text-sm mt-1">Minimum payment is ${minDownPayment}</p>
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
              className="px-4 py-2 bg-brand-green-100 hover:bg-brand-green-200 rounded-lg text-sm font-semibold text-brand-green-700 transition"
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
              <span className="font-semibold text-brand-green-600">-${downPaymentNum.toLocaleString()}</span>
            </div>
            <div className="border-t border-slate-300 mt-3 pt-3 flex justify-between items-center">
              <span className="font-semibold text-slate-800">Remaining Balance</span>
              <span className="text-xl font-bold text-purple-600">
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
                      ? 'border-purple-600 bg-purple-50 ring-2 ring-purple-200'
                      : 'border-slate-200 hover:border-purple-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-lg font-bold text-slate-800">
                    ${plan.monthlyAmount.toLocaleString()}
                    <span className="text-sm font-normal text-slate-500">/mo</span>
                  </div>
                  <div className="text-sm text-slate-600">{plan.label}</div>
                  {selectedPlan === plan.months && (
                    <span className="text-slate-400 flex-shrink-0">•</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ) : downPaymentNum >= programFee ? (
          <div className="bg-brand-green-50 border-2 border-brand-green-200 rounded-lg p-4 text-center">
            <span className="text-slate-400 flex-shrink-0">•</span>
            <div className="font-bold text-brand-green-800">Paying in Full!</div>
            <div className="text-sm text-brand-green-700">No monthly payments required</div>
          </div>
        ) : null}

        {/* Summary */}
        {isValid && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="font-semibold text-purple-900 mb-2">Payment Summary</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-purple-700">Today&apos;s Payment</span>
                <span className="font-semibold text-purple-900">${downPaymentNum.toLocaleString()}</span>
              </div>
              {balance > 0 && selectedPlan && (
                <div className="flex justify-between">
                  <span className="text-purple-700">Monthly Payment</span>
                  <span className="font-semibold text-purple-900">
                    ${paymentPlans.find(p => p.months === selectedPlan)?.monthlyAmount.toLocaleString()}/mo × {selectedPlan}
                  </span>
                </div>
              )}
              <div className="border-t border-purple-200 pt-2 mt-2 flex justify-between">
                <span className="font-semibold text-purple-900">Total Program Fee</span>
                <span className="font-bold text-purple-900">${programFee.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleContinue}
          disabled={!isValid}
          className={`w-full py-4 rounded-lg font-bold text-lg transition ${
            isValid
              ? 'bg-purple-600 hover:bg-purple-700 text-white'
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
