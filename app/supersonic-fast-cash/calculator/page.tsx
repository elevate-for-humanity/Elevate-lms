'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import { logger } from '@/lib/logger';
import { useState, useEffect } from 'react';
import {
  calculateTax,
  calculateRefund,
  type TaxReturn,
} from '@/lib/tax-calculator';
import {
  Calculator,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Info,
  Download,
  Share2,
  Save,
} from 'lucide-react';
import Link from 'next/link';



export default function TaxCalculatorPage() {
  const [taxReturn, setTaxReturn] = useState<TaxReturn>({
    filing_status: 'single',
    dependents_count: 0,
    w2_income: 0,
    self_employment_income: 0,
    interest_income: 0,
    dividend_income: 0,
    other_income: 0,
    standard_deduction: true,
    itemized_deductions: 0,
    student_loan_interest: 0,
    tax_year: 2024,
  });

  const [federalWithholding, setFederalWithholding] = useState(0);
  const [stateWithholding, setStateWithholding] = useState(0);
  const [estimatedPayments, setEstimatedPayments] = useState(0);

  const [calculation, setCalculation] = useState<any>(null);
  const [refundResult, setRefundResult] = useState<any>(null);

  // Real-time calculation
  useEffect(() => {
    const calc = calculateTax(taxReturn);
    setCalculation(calc);

    const refund = calculateRefund(calc, federalWithholding, estimatedPayments);
    setRefundResult(refund);
  }, [taxReturn, federalWithholding, estimatedPayments]);

  const updateField = (field: keyof TaxReturn, value: any) => {
    setTaxReturn((prev) => ({ ...prev, [field]: value }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const saveCalculation = async () => {
    try {
      // Save to database
      const response = await fetch(
        '/api/supersonic-fast-cash/save-calculation',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            taxReturn,
            calculation,
            refundResult,
            federalWithholding,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save');
      }

      // Also save to localStorage as backup
      const data = {
        taxReturn,
        calculation,
        refundResult,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem('supersonic-tax-calc', JSON.stringify(data));

      alert('Calculation saved to your account! You can return to it anytime.');
    } catch (error) {
      logger.error('Save error:', error);
      alert('Failed to save calculation. Please try again.');
    }
  };

  const shareCalculation = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Tax Refund Estimate',
          text: `My estimated tax refund: ${formatCurrency(refundResult?.refund_or_owed || 0)}`,
          url: window.location.href,
        });
      } catch (error) { /* Error handled silently */ }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Supersonic Fast Cash", href: "/supersonic-fast-cash" }, { label: "Calculator" }]} />
      </div>
<div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full mb-4">
            <Calculator className="w-4 h-4" />
            <span className="text-sm font-semibold">
              Real-Time Tax Calculator
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Income Tax Return Estimator
          </h1>
          <p className="text-xl text-black max-w-2xl mx-auto">
            Get an instant estimate of your federal tax refund or amount owed.
            Based on 2024 IRS tax tables.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Input Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Filing Status */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </span>
                Filing Status
              </h2>

              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { value: 'single', label: 'Single' },
                  { value: 'married_joint', label: 'Married Filing Jointly' },
                  {
                    value: 'married_separate',
                    label: 'Married Filing Separately',
                  },
                  { value: 'head_of_household', label: 'Head of Household' },
                ].map((status) => (
                  <button
                    key={status.value}
                    onClick={() => updateField('filing_status', status.value)}
                    className={`p-4 rounded-xl border-2 font-semibold transition ${
                      taxReturn.filing_status === status.value
                        ? 'border-green-600 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                  >
                    {status.label}
                  </button>
                ))}
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium mb-2">
                  Number of Dependents
                </label>
                <input
                  type="number"
                  min="0"
                  value={taxReturn.dependents_count}
                  onChange={(e) =>
                    updateField(
                      'dependents_count',
                      parseInt(e.target.value) || 0
                    )
                  }
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Income */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </span>
                Income
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    W-2 Wages (Box 1)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-black">
                      $
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={taxReturn.w2_income || ''}
                      onChange={(e) =>
                        updateField(
                          'w2_income',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      placeholder="50,000"
                      className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Self-Employment Income (1099-NEC)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-black">
                      $
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={taxReturn.self_employment_income || ''}
                      onChange={(e) =>
                        updateField(
                          'self_employment_income',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      placeholder="0"
                      className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Interest Income (1099-INT)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-black">
                      $
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={taxReturn.interest_income || ''}
                      onChange={(e) =>
                        updateField(
                          'interest_income',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      placeholder="0"
                      className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Dividend Income (1099-DIV)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-black">
                      $
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={taxReturn.dividend_income || ''}
                      onChange={(e) =>
                        updateField(
                          'dividend_income',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      placeholder="0"
                      className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Other Income
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-black">
                      $
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={taxReturn.other_income || ''}
                      onChange={(e) =>
                        updateField(
                          'other_income',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      placeholder="0"
                      className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Deductions */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </span>
                Deductions
              </h2>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => updateField('standard_deduction', true)}
                    className={`flex-1 p-4 rounded-xl border-2 font-semibold transition ${
                      taxReturn.standard_deduction
                        ? 'border-green-600 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                  >
                    Standard Deduction
                  </button>
                  <button
                    onClick={() => updateField('standard_deduction', false)}
                    className={`flex-1 p-4 rounded-xl border-2 font-semibold transition ${
                      !taxReturn.standard_deduction
                        ? 'border-green-600 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                  >
                    Itemized Deductions
                  </button>
                </div>

                {!taxReturn.standard_deduction && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Total Itemized Deductions
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-black">
                        $
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={taxReturn.itemized_deductions || ''}
                        onChange={(e) =>
                          updateField(
                            'itemized_deductions',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        placeholder="15,000"
                        className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Student Loan Interest Paid
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-black">
                      $
                    </span>
                    <input
                      type="number"
                      min="0"
                      max="2500"
                      value={taxReturn.student_loan_interest || ''}
                      onChange={(e) =>
                        updateField(
                          'student_loan_interest',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      placeholder="0"
                      className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none"
                    />
                  </div>
                  <p className="text-xs text-black mt-1">
                    Max deduction: $2,500
                  </p>
                </div>
              </div>
            </div>

            {/* Withholding */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  4
                </span>
                Tax Payments
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Federal Tax Withheld (W-2 Box 2)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-black">
                      $
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={federalWithholding || ''}
                      onChange={(e) =>
                        setFederalWithholding(parseFloat(e.target.value) || 0)
                      }
                      placeholder="6,000"
                      className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Estimated Tax Payments
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-black">
                      $
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={estimatedPayments || ''}
                      onChange={(e) =>
                        setEstimatedPayments(parseFloat(e.target.value) || 0)
                      }
                      placeholder="0"
                      className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Results */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">
              {/* Main Result */}
              <div
                className={`rounded-2xl shadow-xl p-8 ${
                  refundResult?.is_refund
                    ? 'bg-slate-700'
                    : 'bg-slate-700'
                } text-white`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium opacity-90">
                    {refundResult?.is_refund
                      ? 'Estimated Refund'
                      : 'Amount Owed'}
                  </span>
                  {refundResult?.is_refund ? (
                    <TrendingUp className="w-6 h-6" />
                  ) : (
                    <TrendingDown className="w-6 h-6" />
                  )}
                </div>

                <div className="text-5xl font-bold mb-2">
                  {formatCurrency(refundResult?.refund_or_owed || 0)}
                </div>

                <p className="text-sm opacity-90">
                  Based on 2024 federal tax tables
                </p>

                {refundResult?.is_refund &&
                  refundResult.refund_or_owed > 250 && (
                    <div className="mt-6 pt-6 border-t border-white/20">
                      <p className="text-sm font-semibold mb-2">
                        <DollarSign className="w-5 h-5 inline-block" /> Refund
                        Advance Available
                      </p>
                      <p className="text-xs opacity-90">
                        Get ${Math.min(refundResult.refund_or_owed, 7500)} today
                        <br />
                        Fee: 3.5% + $35
                      </p>
                    </div>
                  )}
              </div>

              {/* Breakdown */}
              {calculation && (
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="font-bold text-lg mb-4">Tax Breakdown</h3>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-black">Total Income</span>
                      <span className="font-semibold">
                        {formatCurrency(calculation.total_income)}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-black">
                        Adjusted Gross Income
                      </span>
                      <span className="font-semibold">
                        {formatCurrency(calculation.adjusted_gross_income)}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-black">Deductions</span>
                      <span className="font-semibold text-green-600">
                        -{formatCurrency(calculation.deductions)}
                      </span>
                    </div>

                    <div className="flex justify-between pt-3 border-t">
                      <span className="text-black">Taxable Income</span>
                      <span className="font-semibold">
                        {formatCurrency(calculation.taxable_income)}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-black">Federal Tax</span>
                      <span className="font-semibold text-red-600">
                        {formatCurrency(calculation.federal_tax)}
                      </span>
                    </div>

                    {calculation.self_employment_tax > 0 && (
                      <div className="flex justify-between">
                        <span className="text-black">
                          Self-Employment Tax
                        </span>
                        <span className="font-semibold text-red-600">
                          {formatCurrency(calculation.self_employment_tax)}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between pt-3 border-t font-bold">
                      <span>Total Tax</span>
                      <span className="text-red-600">
                        {formatCurrency(calculation.total_tax)}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-black">Tax Payments</span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(refundResult?.total_payments || 0)}
                      </span>
                    </div>

                    <div className="flex justify-between text-xs text-black mt-4">
                      <span>Effective Tax Rate</span>
                      <span>{calculation.effective_tax_rate.toFixed(2)}%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-3">
                <button
                  onClick={saveCalculation}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition"
                >
                  <Save className="w-4 h-4" />
                  Save Calculation
                </button>

                <button
                  onClick={shareCalculation}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition"
                >
                  <Share2 className="w-4 h-4" />
                  Share Results
                </button>

                <Link
                  href="/supersonic-fast-cash/diy/start"
                  className="block w-full text-center px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition"
                >
                  File Your Return →
                </Link>
              </div>

              {/* Disclaimer */}
              <div className="bg-blue-50 rounded-xl p-4 text-xs text-black">
                <div className="flex gap-2">
                  <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p>
                    This is an estimate only. Actual refund may vary based on
                    additional factors. For accurate filing, use our DIY service
                    or book a tax pro.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
