/**
 * PricingConfigurator - Interactive package builder for testing center
 * 
 * Allows customers to:
 * - Select base exam package
 * - Add optional add-ons
 * - See real-time price updates
 * - View bundle recommendations
 * - Choose funding type
 */

'use client';

import { useState, useEffect } from 'react';
import { Check, Plus, Minus, Sparkles, DollarSign, CreditCard } from 'lucide-react';
import { ACTIVE_BNPL_PROVIDERS as BNPL_OPTIONS } from '@/lib/bnpl-config';

interface PricingConfiguratorProps {
  provider: string;
  exams: ExamOption[];
  addOns?: AddOn[];
  bundles?: Bundle[];
  onAddToCart?: (selection: Selection) => void;
}

interface ExamOption {
  id: string;
  name: string;
  price: number;
  description?: string;
  duration?: string;
}

interface AddOn {
  id: string;
  name: string;
  price: number;
  category: 'materials' | 'certification' | 'career' | 'protection';
}

interface Bundle {
  id: string;
  name: string;
  description: string;
  items: string[];
  originalPrice: number;
  bundlePrice: number;
  savings: number;
}

interface Selection {
  exam: ExamOption | null;
  addOns: AddOn[];
  bundle: Bundle | null;
  fundingType: FundingType;
  subtotal: number;
  discount: number;
  total: number;
}

type FundingType = 'self-pay' | 'wioa' | 'employer' | 'vr' | 'scholarship' | 'other';

// Funding sources - agency-funded options require valid authorization
// Automatic discounts removed - contact us for agency pricing agreements
const FUNDING_OPTIONS: { value: FundingType; label: string; discount: number; note?: string }[] = [
  { value: 'self-pay', label: 'Self-Pay', discount: 0 },
  { value: 'wioa', label: 'WIOA Funded', discount: 0, note: 'Requires agency authorization' },
  { value: 'employer', label: 'Employer Paid', discount: 0, note: 'Requires purchase order or authorization' },
  { value: 'vr', label: 'Vocational Rehab', discount: 0, note: 'Requires agency authorization' },
  { value: 'scholarship', label: 'Scholarship', discount: 0, note: 'Requires award documentation' },
  { value: 'other', label: 'Other/Grant', discount: 0, note: 'Requires funding documentation' },
];

const DEFAULT_ADD_ONS: AddOn[] = [
  { id: 'practice-test', name: 'Practice Test', price: 49, category: 'materials' },
  { id: 'study-guide', name: 'Study Guide', price: 79, category: 'materials' },
  { id: 'exam-prep', name: 'Exam Prep Package', price: 129, category: 'materials' },
  { id: 'cpr', name: 'CPR Certification', price: 150, category: 'certification' },
  { id: 'osha-10', name: 'OSHA 10-Hour', price: 99, category: 'certification' },
  { id: 'resume', name: 'Resume Writing', price: 79, category: 'career' },
  { id: 'interview', name: 'Interview Coaching', price: 49, category: 'career' },
  { id: 'career-placement', name: 'Career Placement Support', price: 199, category: 'career' },
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function PricingConfigurator({
  provider,
  exams,
  addOns = DEFAULT_ADD_ONS,
  bundles = [],
  onAddToCart,
}: PricingConfiguratorProps) {
  const [selection, setSelection] = useState<Selection>({
    exam: exams[0] || null,
    addOns: [],
    bundle: null,
    fundingType: 'self-pay',
    subtotal: 0,
    discount: 0,
    total: 0,
  });

  const [showBundleUpsell, setShowBundleUpsell] = useState(false);

  useEffect(() => {
    calculateTotals();
  }, [selection.exam, selection.addOns, selection.bundle, selection.fundingType]);

  const calculateTotals = () => {
    let subtotal = selection.exam?.price || 0;
    subtotal += selection.addOns.reduce((sum, addon) => sum + addon.price, 0);
    if (selection.bundle) {
      subtotal += selection.bundle.bundlePrice;
    }

    const fundingOption = FUNDING_OPTIONS.find(f => f.value === selection.fundingType);
    const discountAmount = subtotal * (fundingOption?.discount || 0);
    
    setSelection(prev => ({
      ...prev,
      subtotal,
      discount: discountAmount,
      total: subtotal - discountAmount,
    }));
  };

  const toggleAddOn = (addon: AddOn) => {
    setSelection(prev => {
      const exists = prev.addOns.find(a => a.id === addon.id);
      if (exists) {
        return { ...prev, addOns: prev.addOns.filter(a => a.id !== addon.id) };
      }
      return { ...prev, addOns: [...prev.addOns, addon] };
    });
  };

  const selectExam = (exam: ExamOption) => {
    setSelection(prev => ({ ...prev, exam }));
  };

  const selectBundle = (bundle: Bundle) => {
    setSelection(prev => ({ ...prev, bundle: prev.bundle?.id === bundle.id ? null : bundle }));
  };

  const handleAddToCart = () => {
    onAddToCart?.(selection);
  };

  const fundingOption = FUNDING_OPTIONS.find(f => f.value === selection.fundingType);

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-red-700 to-brand-red-800 text-white p-6">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          Build Your Exam Package
        </h3>
        <p className="text-white/80 text-sm mt-1">
          Choose your exam and customize with add-ons
        </p>
      </div>

      <div className="grid lg:grid-cols-3 divide-x divide-slate-100">
        {/* Left Column - Exam Selection */}
        <div className="lg:col-span-2 p-6 space-y-6">
          {/* Exam Packages */}
          <section>
            <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Check className="w-4 h-4 text-brand-red-600" />
              Select Your Exam
            </h4>
            <div className="grid sm:grid-cols-2 gap-3">
              {exams.map((exam) => (
                <button
                  key={exam.id}
                  onClick={() => selectExam(exam)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    selection.exam?.id === exam.id
                      ? 'border-brand-red-600 bg-brand-red-50'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-slate-900">{exam.name}</span>
                    <span className="font-bold text-brand-red-600">{formatCurrency(exam.price)}</span>
                  </div>
                  {exam.description && (
                    <p className="text-sm text-slate-600 mt-1">{exam.description}</p>
                  )}
                  {exam.duration && (
                    <span className="text-xs text-slate-500 mt-2 inline-block">
                      ⏱ {exam.duration}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* Optional Add-ons */}
          <section>
            <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4 text-brand-red-600" />
              Add-Ons (Optional)
            </h4>
            <div className="grid sm:grid-cols-2 gap-2">
              {addOns.map((addon) => {
                const isSelected = selection.addOns.some(a => a.id === addon.id);
                return (
                  <button
                    key={addon.id}
                    onClick={() => toggleAddOn(addon)}
                    className={`p-3 rounded-lg border flex items-center justify-between transition-all ${
                      isSelected
                        ? 'border-brand-red-600 bg-brand-red-50'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        isSelected ? 'bg-brand-red-600 border-brand-red-600' : 'border-slate-300'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-sm text-slate-700">{addon.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-slate-600">
                      +{formatCurrency(addon.price)}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Bundle Recommendation */}
          {bundles.length > 0 && !selection.bundle && (
            <section className="bg-gradient-to-r from-brand-gold-50 to-amber-50 rounded-xl p-4 border border-brand-gold-200">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-brand-gold-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-bold text-slate-900">Save with a Bundle!</h4>
                  {bundles.map((bundle) => (
                    <button
                      key={bundle.id}
                      onClick={() => selectBundle(bundle)}
                      className="mt-2 w-full text-left p-3 bg-white rounded-lg border border-brand-gold-300 hover:border-brand-gold-500 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-semibold text-slate-900">{bundle.name}</span>
                        <span className="text-brand-green-700 font-bold">Save {formatCurrency(bundle.savings)}</span>
                      </div>
                      <p className="text-sm text-slate-600 mt-1">{bundle.description}</p>
                      <div className="text-xs text-slate-500 mt-2">
                        Includes: {bundle.items.join(', ')}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Selected Bundle */}
          {selection.bundle && (
            <section className="bg-brand-green-50 rounded-xl p-4 border border-brand-green-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-brand-green-600" />
                  <span className="font-bold text-slate-900">{selection.bundle.name}</span>
                </div>
                <button
                  onClick={() => selectBundle(selection.bundle!)}
                  className="text-sm text-slate-500 hover:text-slate-700"
                >
                  Remove
                </button>
              </div>
              <p className="text-sm text-slate-600 mt-1">{selection.bundle.description}</p>
            </section>
          )}
        </div>

        {/* Right Column - Order Summary */}
        <div className="bg-slate-50 p-6">
          <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Order Summary
          </h4>

          {/* Line Items */}
          <div className="space-y-2 text-sm">
            {selection.exam && (
              <div className="flex justify-between">
                <span className="text-slate-600">{selection.exam.name}</span>
                <span className="font-semibold">{formatCurrency(selection.exam.price)}</span>
              </div>
            )}
            {selection.addOns.map((addon) => (
              <div key={addon.id} className="flex justify-between text-slate-600">
                <span>{addon.name}</span>
                <span>{formatCurrency(addon.price)}</span>
              </div>
            ))}
            {selection.bundle && (
              <div className="flex justify-between text-slate-600">
                <span>{selection.bundle.name}</span>
                <span>{formatCurrency(selection.bundle.bundlePrice)}</span>
              </div>
            )}
          </div>

          {/* Subtotal */}
          <div className="border-t border-slate-200 mt-4 pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Subtotal</span>
              <span className="font-semibold">{formatCurrency(selection.subtotal)}</span>
            </div>
            {selection.discount > 0 && (
              <div className="flex justify-between text-sm text-brand-green-700">
                <span>{fundingOption?.label} Discount ({(fundingOption?.discount || 0) * 100}%)</span>
                <span>-{formatCurrency(selection.discount)}</span>
              </div>
            )}
          </div>

          {/* Total */}
          <div className="border-t border-slate-300 mt-4 pt-4">
            <div className="flex justify-between">
              <span className="font-bold text-slate-900">Today's Total</span>
              <span className="text-2xl font-bold text-brand-red-600">{formatCurrency(selection.total)}</span>
            </div>
          </div>

          {/* Funding Type */}
          <div className="mt-6">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Payment Type
            </label>
            <select
              value={selection.fundingType}
              onChange={(e) => setSelection(prev => ({ ...prev, fundingType: e.target.value as FundingType }))}
              className="w-full p-2.5 rounded-lg border border-slate-300 text-sm bg-white"
            >
              {FUNDING_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}{option.discount > 0 ? ` (${option.discount * 100}% off)` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* BNPL Options */}
          {selection.total > 0 && (
            <div className="mt-4">
              <div className="flex items-center gap-1.5 text-sm text-slate-600 mb-2">
                <CreditCard className="w-4 h-4" />
                <span>Pay over time:</span>
              </div>
              <div className="space-y-1">
                {BNPL_OPTIONS.slice(0, 3).map((bnpl) => {
                  const minWeeks = bnpl.minAmount > 0 ? Math.ceil(bnpl.minAmount / selection.total) : 4;
                  return (
                    <div key={bnpl.id} className="flex justify-between text-xs bg-white p-2 rounded border border-slate-200">
                      <span className="text-slate-600">{bnpl.name}</span>
                      <span className="font-semibold">{bnpl.description}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={!selection.exam}
            className="w-full mt-6 py-3 px-4 bg-brand-red-600 hover:bg-brand-red-700 disabled:bg-slate-300 text-white font-bold rounded-lg transition-colors"
          >
            Add to Cart
          </button>

          <p className="text-xs text-slate-500 text-center mt-3">
            Secure checkout powered by Stripe
          </p>
        </div>
      </div>
    </div>
  );
}

export default PricingConfigurator;
