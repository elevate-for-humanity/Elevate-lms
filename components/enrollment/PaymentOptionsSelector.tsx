'use client';

/**
 * Payment Options Selector Component
 * 
 * Displays all payment options for barber apprenticeship:
 * - Multiple setup fee tiers (35%, 50%, 75%)
 * - Pay in full with discount
 * - BNPL via Sezzle
 * 
 * Dynamically calculates based on transfer hours and hours/week.
 */

import { useState, useEffect, useMemo } from 'react';
import { 
  CreditCard, 
  Calendar, 
  DollarSign, 
  Clock, 
  Check, 
  Star,
  Zap,
  Calculator,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { 
  calculatePaymentOptions, 
  calculateCustomSetupFee,
  formatCurrency, 
  getPaymentSummary,
  PaymentOption,
  BNPLOption,
  PaymentOptionsResult,
} from '@/lib/billing/payment-options';

interface PaymentOptionsSelectorProps {
  hoursPerWeek?: number;
  transferHours?: number;
  onSelect: (selection: PaymentSelection) => void;
  initialSelection?: PaymentSelection;
  showTransferHoursInput?: boolean;
  showHoursPerWeekInput?: boolean;
}

export interface PaymentSelection {
  type: 'payment_plan' | 'pay_in_full' | 'bnpl';
  planId?: string;
  bnplProvider?: 'sezzle';
  bnplOptionId?: string;
  setupFee: number;
  weeklyPayment: number;
  totalWeeks: number;
  totalAmount: number;
}

export default function PaymentOptionsSelector({
  hoursPerWeek: initialHoursPerWeek = 40,
  transferHours: initialTransferHours = 0,
  onSelect,
  initialSelection,
  showTransferHoursInput = true,
  showHoursPerWeekInput = true,
}: PaymentOptionsSelectorProps) {
  // Editable inputs for hours
  const [hoursPerWeek, setHoursPerWeek] = useState<number>(initialHoursPerWeek);
  const [transferHours, setTransferHours] = useState<number>(initialTransferHours);
  
  const [selectedType, setSelectedType] = useState<'payment_plan' | 'pay_in_full' | 'bnpl'>(
    initialSelection?.type || 'payment_plan'
  );
  const [selectedPlanId, setSelectedPlanId] = useState<string>(
    initialSelection?.planId || 'custom'
  );
  const [selectedBnplId, setSelectedBnplId] = useState<string>(
    initialSelection?.bnplOptionId || 'affirm'
  );
  const [customSetupFee, setCustomSetupFee] = useState<string>('');
  const [customSetupFeeError, setCustomSetupFeeError] = useState<string>('');

  // Calculate all options based on inputs
  const options = useMemo(() => 
    calculatePaymentOptions(hoursPerWeek, transferHours),
    [hoursPerWeek, transferHours]
  );

  // Calculate custom setup fee result
  const customFeeResult = useMemo(() => {
    const amount = parseFloat(customSetupFee) || 0;
    if (amount === 0) {
      // Use minimum (35%) as default
      return calculateCustomSetupFee(
        Math.round(options.fullPrice * 0.35),
        options.fullPrice,
        options.paymentPlans[0]?.totalWeeks || 50
      );
    }
    return calculateCustomSetupFee(
      amount,
      options.fullPrice,
      options.paymentPlans[0]?.totalWeeks || 50
    );
  }, [customSetupFee, options.fullPrice, options.paymentPlans]);

  // Update error state
  useEffect(() => {
    if (customSetupFee && !customFeeResult.isValid) {
      setCustomSetupFeeError(customFeeResult.error || 'Invalid amount');
    } else {
      setCustomSetupFeeError('');
    }
  }, [customSetupFee, customFeeResult]);

  // Notify parent of selection changes
  useEffect(() => {
    let selection: PaymentSelection;

    if (selectedType === 'pay_in_full') {
      selection = {
        type: 'pay_in_full',
        setupFee: options.payInFull.amount,
        weeklyPayment: 0,
        totalWeeks: 0,
        totalAmount: options.payInFull.amount,
      };
    } else if (selectedType === 'bnpl') {
      const bnplOption = options.bnplOptions.find(o => o.id === selectedBnplId);
      selection = {
        type: 'bnpl',
        bnplProvider: bnplOption?.provider || 'affirm',
        bnplOptionId: selectedBnplId,
        setupFee: bnplOption?.totalAmount || 0,
        weeklyPayment: 0,
        totalWeeks: 0,
        totalAmount: bnplOption?.totalAmount || 0,
      };
    } else {
      // Use custom setup fee calculation
      selection = {
        type: 'payment_plan',
        planId: 'custom',
        setupFee: customFeeResult.setupFee,
        weeklyPayment: customFeeResult.weeklyPayment,
        totalWeeks: customFeeResult.totalWeeks,
        totalAmount: options.fullPrice,
      };
    }

    onSelect(selection);
  }, [selectedType, selectedBnplId, customFeeResult, options, onSelect]);

  // If no payment needed (full transfer)
  if (options.fullPrice === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <Check className="w-12 h-12 text-green-500 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-green-800">No Payment Required</h3>
        <p className="text-green-600 mt-2">
          Your {transferHours} transfer hours cover the full program!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Transfer Hours & Schedule Input */}
      {(showTransferHoursInput || showHoursPerWeekInput) && (
        <div className="bg-brand-red-50 border border-brand-red-200 rounded-lg p-4">
          <h3 className="font-semibold text-brand-red-900 mb-3 flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Calculate Your Payment
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {showTransferHoursInput && (
              <div>
                <label className="block text-sm font-medium text-brand-red-800 mb-1">
                  Transfer Hours (if any)
                </label>
                <input
                  type="number"
                  value={transferHours || ''}
                  onChange={(e) => setTransferHours(parseInt(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-brand-red-300 rounded-lg focus:ring-brand-red-500 focus:border-brand-red-500"
                  min="0"
                  max="1999"
                />
                <p className="text-xs text-brand-red-600 mt-1">Hours from previous barber school</p>
              </div>
            )}
            {showHoursPerWeekInput && (
              <div>
                <label className="block text-sm font-medium text-brand-red-800 mb-1">
                  Hours Per Week
                </label>
                <select
                  value={hoursPerWeek}
                  onChange={(e) => setHoursPerWeek(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-brand-red-300 rounded-lg focus:ring-brand-red-500 focus:border-brand-red-500"
                >
                  <option value="25">25 hours/week (Part-time)</option>
                  <option value="30">30 hours/week</option>
                  <option value="35">35 hours/week</option>
                  <option value="40">40 hours/week (Full-time)</option>
                  <option value="45">45 hours/week</option>
                  <option value="50">50 hours/week (Accelerated)</option>
                </select>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pricing Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Program Price</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(options.programPrice)}</p>
            <p className="text-xs text-gray-400">Fixed program cost</p>
          </div>
          {options.amountPaid > 0 && (
            <div className="text-right">
              <p className="text-sm text-gray-500">Amount Paid</p>
              <p className="text-lg font-bold text-green-600">{formatCurrency(options.amountPaid)}</p>
              <p className="text-sm text-gray-500 mt-1">Remaining</p>
              <p className="text-lg font-bold text-blue-600">{formatCurrency(options.remainingBalance)}</p>
            </div>
          )}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-600">
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {options.hoursRemaining.toLocaleString()} hours remaining
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {options.weeksRemaining} weeks at {hoursPerWeek} hrs/week
          </span>
          {transferHours > 0 && (
            <span className="flex items-center gap-1 text-brand-red-600">
              <Star className="w-4 h-4" />
              {transferHours} transfer hours applied
            </span>
          )}
        </div>
      </div>

      {/* Payment Plan with Custom Setup Fee */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Payment Plan
        </h3>

        <div
          onClick={() => setSelectedType('payment_plan')}
          className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
            selectedType === 'payment_plan'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h4 className="font-semibold text-gray-900">Setup Fee + Weekly Payments</h4>
              <p className="text-sm text-gray-600 mt-1">
                Pay a setup fee today, then automatic weekly payments every Friday
              </p>
            </div>
            {selectedType === 'payment_plan' && (
              <Check className="w-5 h-5 text-blue-600" />
            )}
          </div>

          {/* Custom Setup Fee Input */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter Setup Fee Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                value={customSetupFee}
                onChange={(e) => setCustomSetupFee(e.target.value)}
                onFocus={() => setSelectedType('payment_plan')}
                placeholder={Math.round(options.fullPrice * 0.35).toString()}
                className={`w-full pl-8 pr-4 py-3 border rounded-lg text-lg font-semibold ${
                  customSetupFeeError 
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                }`}
                min={Math.round(options.fullPrice * 0.35)}
                max={options.fullPrice}
                step="100"
              />
            </div>
            {customSetupFeeError && (
              <p className="mt-2 text-sm text-red-600">{customSetupFeeError}</p>
            )}
            <p className="mt-2 text-xs text-gray-500">
              Minimum: {formatCurrency(Math.round(options.fullPrice * 0.35))} (35%) • 
              Maximum: {formatCurrency(options.fullPrice)} (pay in full)
            </p>

            {/* Dynamic Calculation Display */}
            {selectedType === 'payment_plan' && customFeeResult.isValid && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Setup Fee Today</p>
                    <p className="text-xl font-bold text-gray-900">
                      {formatCurrency(customFeeResult.setupFee)}
                    </p>
                    <p className="text-xs text-gray-400">{customFeeResult.setupFeePercent}% of total</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Weekly Payment</p>
                    <p className="text-xl font-bold text-gray-900">
                      {formatCurrency(customFeeResult.weeklyPayment)}
                    </p>
                    <p className="text-xs text-gray-400">for {customFeeResult.totalWeeks} weeks</p>
                  </div>
                </div>

                {/* Setup Fee Breakdown */}
                <div className="mt-3 p-3 bg-gray-100 rounded-lg text-xs text-gray-600">
                  <p className="font-medium text-gray-700 mb-1">Setup Fee Breakdown:</p>
                  <div className="flex justify-between">
                    <span>Milady RTI Courses:</span>
                    <span>{formatCurrency(customFeeResult.miladyPortion)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Program Fee:</span>
                    <span>{formatCurrency(customFeeResult.elevatePortion)}</span>
                  </div>
                </div>

                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Remaining Balance:</strong> {formatCurrency(customFeeResult.remainingBalance)} 
                    {' '}charged automatically every Friday
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pay in Full Option */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Pay in Full
        </h3>

        <div
          onClick={() => setSelectedType('pay_in_full')}
          className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
            selectedType === 'pay_in_full'
              ? 'border-green-500 bg-green-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-gray-900">One-Time Payment</h4>
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                  Save {options.payInFull.discountPercent}%
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Pay once and you're done. No weekly payments.
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(options.payInFull.amount)}
              </p>
              <p className="text-sm text-green-600">
                Save {formatCurrency(options.payInFull.savings)}
              </p>
            </div>
          </div>
          {selectedType === 'pay_in_full' && (
            <div className="mt-3 flex items-center gap-2 text-green-600">
              <Check className="w-5 h-5" />
              <span className="font-medium">Selected</span>
            </div>
          )}
        </div>
      </div>

      {/* BNPL Options */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Buy Now, Pay Later
        </h3>

        {options.bnplOptions.map(bnpl => (
          <BNPLCard
            key={bnpl.id}
            option={bnpl}
            selected={selectedType === 'bnpl' && selectedBnplId === bnpl.id}
            onSelect={() => {
              setSelectedType('bnpl');
              setSelectedBnplId(bnpl.id);
            }}
          />
        ))}
      </div>

      {/* Selected Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">Your Selection</h4>
        <SelectedSummary
          type={selectedType}
          options={options}
          planId={selectedPlanId}
          bnplId={selectedBnplId}
        />
      </div>
    </div>
  );
}

// Payment Plan Card Component
function PaymentPlanCard({
  plan,
  selected,
  onSelect,
}: {
  plan: PaymentOption;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
        selected
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-gray-900">{plan.name}</h4>
            {plan.badge && (
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                plan.recommended 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {plan.badge}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-gray-900">
            {formatCurrency(plan.setupFee)}
          </p>
          <p className="text-xs text-gray-500">setup fee</p>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-sm">
        <span className="text-gray-600">
          Then {formatCurrency(plan.weeklyPayment)}/week
        </span>
        <span className="text-gray-500">
          for {plan.totalWeeks} weeks
        </span>
      </div>

      {selected && (
        <div className="mt-3 flex items-center gap-2 text-blue-600">
          <Check className="w-5 h-5" />
          <span className="font-medium">Selected</span>
        </div>
      )}
    </div>
  );
}

// BNPL Card Component
function BNPLCard({
  option,
  selected,
  onSelect,
}: {
  option: BNPLOption;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
        selected
          ? 'border-brand-red-500 bg-brand-red-50'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-gray-900">{option.name}</h4>
            {option.interestFree && (
              <span className="px-2 py-0.5 bg-brand-red-100 text-brand-red-700 text-xs font-medium rounded-full">
                0% Interest
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-1">{option.description}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-gray-900">
            {formatCurrency(option.paymentAmount)}
          </p>
          <p className="text-xs text-gray-500">× {option.numberOfPayments} payments</p>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-sm">
        <span className="text-gray-600">
          Total: {formatCurrency(option.totalAmount)}
        </span>
        <span className="text-gray-500">
          {option.frequency}
        </span>
      </div>

      {/* Sezzle Logo */}
      <div className="mt-3 flex items-center gap-2">
        <img 
          src="https://d34uoa9py2cgca.cloudfront.net/sezzle-logos/sezzle-logo-brand-red.svg" 
          alt="Sezzle" 
          className="h-5"
        />
      </div>

      {selected && (
        <div className="mt-3 flex items-center gap-2 text-brand-red-600">
          <Check className="w-5 h-5" />
          <span className="font-medium">Selected</span>
        </div>
      )}
    </div>
  );
}

// Selected Summary Component
function SelectedSummary({
  type,
  options,
  planId,
  bnplId,
}: {
  type: 'payment_plan' | 'pay_in_full' | 'bnpl';
  options: PaymentOptionsResult;
  planId: string;
  bnplId: string;
}) {
  if (type === 'pay_in_full') {
    return (
      <div className="text-blue-800">
        <p className="font-medium">Pay in Full: {formatCurrency(options.payInFull.amount)}</p>
        <p className="text-sm">One-time payment, no weekly charges</p>
      </div>
    );
  }

  if (type === 'bnpl') {
    const bnpl = options.bnplOptions.find(o => o.id === bnplId);
    if (!bnpl) return null;
    return (
      <div className="text-blue-800">
        <p className="font-medium">
          Sezzle: {bnpl.numberOfPayments} × {formatCurrency(bnpl.paymentAmount)}
        </p>
        <p className="text-sm">Interest-free, {bnpl.frequency} payments</p>
      </div>
    );
  }

  const plan = options.paymentPlans.find(p => p.id === planId);
  if (!plan) return null;

  return (
    <div className="text-blue-800">
      <p className="font-medium">
        {plan.name}: {formatCurrency(plan.setupFee)} today
      </p>
      <p className="text-sm">
        Then {formatCurrency(plan.weeklyPayment)}/week for {plan.totalWeeks} weeks
      </p>
    </div>
  );
}
