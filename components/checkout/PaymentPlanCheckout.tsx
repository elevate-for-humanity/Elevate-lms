'use client';

import { useState, useMemo } from 'react';
import { formatCurrency, formatDate } from '@/lib/payments/payment-plan';

interface PaymentPlanCheckoutProps {
  programName: string;
  programSlug: string;
  totalAmount: number;
  programHours: number;
  hoursPerWeek?: number;
  minimumDownPayment?: number;
  minimumDownPaymentPercent?: number;
  // Existing credits/payments
  approvedAmount?: number;
  paidAmount?: number;
  onCheckout: (options: CheckoutOptions) => void;
  isLoading?: boolean;
}

interface CheckoutOptions {
  paymentType: 'full' | 'plan' | 'balance';
  amount: number;
  downPayment: number;
  weeklyPayment: number;
  numberOfWeeks: number;
  bnplProvider?: 'stripe' | 'sezzle';
  useBnpl: boolean;
}

interface PaymentScheduleItem {
  weekNumber: number;
  dueDate: Date;
  amount: number;
  type: 'down_payment' | 'weekly' | 'credit';
  remainingBalance: number;
}

export default function PaymentPlanCheckout({
  programName,
  programSlug,
  totalAmount,
  programHours,
  hoursPerWeek = 40,
  minimumDownPayment,
  minimumDownPaymentPercent = 0.10,
  approvedAmount = 0,
  paidAmount = 0,
  onCheckout,
  isLoading = false,
}: PaymentPlanCheckoutProps) {
  // Calculate balances
  const totalCredits = approvedAmount + paidAmount;
  const remainingBalance = totalAmount - totalCredits;
  const isFullyPaid = remainingBalance <= 0;
  const hasPartialCredit = totalCredits > 0 && remainingBalance > 0;

  // Minimum down payment for remaining balance
  const minDown = minimumDownPayment || Math.max(50, Math.round(remainingBalance * minimumDownPaymentPercent));
  
  const [paymentType, setPaymentType] = useState<'full' | 'plan'>('plan');
  const [downPayment, setDownPayment] = useState(Math.min(minDown, remainingBalance));
  const [useBnpl, setUseBnpl] = useState(false);
  const [selectedBnpl, setSelectedBnpl] = useState<'stripe' | 'sezzle'>('stripe');
  const [showSchedule, setShowSchedule] = useState(false);

  // Calculate payment plan based on down payment
  const plan = useMemo(() => {
    const balanceAfterDown = remainingBalance - downPayment;
    const numberOfWeeks = Math.ceil(programHours / hoursPerWeek);
    const weeklyPayment = numberOfWeeks > 0 && balanceAfterDown > 0 
      ? Math.ceil(balanceAfterDown / numberOfWeeks) 
      : 0;

    // Generate schedule
    const schedule: PaymentScheduleItem[] = [];
    let balance = totalAmount;
    const startDate = new Date();

    // Show existing credits first
    if (totalCredits > 0) {
      balance -= totalCredits;
      schedule.push({
        weekNumber: -1,
        dueDate: new Date(startDate.getTime() - 86400000), // Yesterday
        amount: totalCredits,
        type: 'credit',
        remainingBalance: balance,
      });
    }

    // Down payment (if paying plan)
    if (paymentType === 'plan' && downPayment > 0) {
      balance -= downPayment;
      schedule.push({
        weekNumber: 0,
        dueDate: startDate,
        amount: downPayment,
        type: 'down_payment',
        remainingBalance: Math.max(0, balance),
      });

      // Weekly payments
      for (let week = 1; week <= numberOfWeeks && balance > 0; week++) {
        const dueDate = new Date(startDate);
        dueDate.setDate(dueDate.getDate() + (week * 7));
        const payment = Math.min(weeklyPayment, balance);
        balance -= payment;

        schedule.push({
          weekNumber: week,
          dueDate,
          amount: payment,
          type: 'weekly',
          remainingBalance: Math.max(0, balance),
        });
      }
    }

    return {
      downPayment,
      balanceAfterDown,
      weeklyPayment,
      numberOfWeeks: balanceAfterDown > 0 ? numberOfWeeks : 0,
      schedule,
    };
  }, [downPayment, remainingBalance, totalAmount, totalCredits, programHours, hoursPerWeek, paymentType]);

  // BNPL availability
  const sezzleAvailable = downPayment >= 35 && downPayment <= 2500;

  const handleCheckout = () => {
    const amount = paymentType === 'full' ? remainingBalance : downPayment;
    onCheckout({
      paymentType: hasPartialCredit ? 'balance' : paymentType,
      amount,
      downPayment: paymentType === 'full' ? remainingBalance : downPayment,
      weeklyPayment: plan.weeklyPayment,
      numberOfWeeks: plan.numberOfWeeks,
      bnplProvider: useBnpl ? selectedBnpl : undefined,
      useBnpl,
    });
  };

  // If fully paid, show enrollment ready
  if (isFullyPaid) {
    return (
      <div className="bg-white rounded-xl border-2 border-green-500 overflow-hidden">
        <div className="bg-green-500 text-white p-4 text-center">
          <h3 className="font-bold text-xl">✓ Payment Complete</h3>
        </div>
        <div className="p-6 text-center">
          <p className="text-lg text-slate-700 mb-4">
            Your payment of {formatCurrency(totalAmount)} has been received.
          </p>
          <p className="text-green-600 font-semibold mb-6">
            You are ready to enroll in {programName}!
          </p>
          <button
            onClick={() => onCheckout({ paymentType: 'full', amount: 0, downPayment: 0, weeklyPayment: 0, numberOfWeeks: 0, useBnpl: false })}
            className="bg-green-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-green-700 transition-colors"
          >
            Complete Enrollment
          </button>
        </div>
      </div>
    );
  }

  // Preset amounts
  const presetAmounts = [
    { label: 'Min', amount: minDown },
    { label: '25%', amount: Math.round(remainingBalance * 0.25) },
    { label: '50%', amount: Math.round(remainingBalance * 0.50) },
    { label: 'Full', amount: remainingBalance },
  ].filter(p => p.amount >= minDown && p.amount <= remainingBalance);

  return (
    <div className="bg-white rounded-xl border-2 border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900 text-white p-4">
        <h3 className="font-bold text-lg">{programName}</h3>
        <p className="text-slate-300">Total Program Cost: {formatCurrency(totalAmount)}</p>
      </div>

      {/* Balance Summary - Show if partial credit exists */}
      {hasPartialCredit && (
        <div className="bg-amber-50 border-b-2 border-amber-200 p-4">
          <h4 className="font-bold text-amber-800 mb-2">⚠️ Balance Due Before Enrollment</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-amber-700">Total Cost</p>
              <p className="font-bold text-slate-900">{formatCurrency(totalAmount)}</p>
            </div>
            <div>
              <p className="text-green-700">Credits Applied</p>
              <p className="font-bold text-green-600">-{formatCurrency(totalCredits)}</p>
              {approvedAmount > 0 && paidAmount > 0 && (
                <p className="text-xs text-slate-500">
                  (Approved: {formatCurrency(approvedAmount)} + Paid: {formatCurrency(paidAmount)})
                </p>
              )}
            </div>
            <div>
              <p className="text-red-700">Remaining Balance</p>
              <p className="font-bold text-red-600 text-xl">{formatCurrency(remainingBalance)}</p>
            </div>
          </div>
          <p className="text-xs text-amber-700 mt-2">
            You must pay the remaining balance to complete enrollment.
          </p>
        </div>
      )}

      <div className="p-4 space-y-6">
        {/* Payment Type Selection */}
        <div>
          <p className="text-sm font-medium text-slate-700 mb-3">
            {hasPartialCredit ? 'Pay Remaining Balance:' : 'Choose Payment Option:'}
          </p>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentType('full')}
              className={`p-4 rounded-lg border-2 text-center transition-all ${
                paymentType === 'full'
                  ? 'border-green-500 bg-green-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <p className="font-bold text-slate-900">Pay in Full</p>
              <p className="text-lg font-bold text-green-600">{formatCurrency(remainingBalance)}</p>
              <p className="text-xs text-green-600">Enroll immediately</p>
            </button>

            <button
              type="button"
              onClick={() => setPaymentType('plan')}
              className={`p-4 rounded-lg border-2 text-center transition-all ${
                paymentType === 'plan'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <p className="font-bold text-slate-900">Payment Plan</p>
              <p className="text-sm text-slate-600">Down + Weekly</p>
            </button>
          </div>
        </div>

        {/* Payment Plan Options */}
        {paymentType === 'plan' && (
          <>
            {/* Down Payment Selector */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Choose Your Down Payment
              </label>
              <p className="text-xs text-slate-500 mb-3">
                Minimum: {formatCurrency(minDown)} • Higher down payment = lower weekly payments
              </p>

              {/* Preset Buttons */}
              <div className="grid grid-cols-4 gap-2 mb-3">
                {presetAmounts.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setDownPayment(preset.amount)}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                      downPayment === preset.amount
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Slider */}
              <input
                type="range"
                min={minDown}
                max={remainingBalance}
                step={25}
                value={downPayment}
                onChange={(e) => setDownPayment(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />

              {/* Custom Input */}
              <div className="mt-3 flex items-center gap-2">
                <span className="text-sm text-slate-500">Custom:</span>
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                  <input
                    type="number"
                    min={minDown}
                    max={remainingBalance}
                    value={downPayment}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val >= minDown && val <= remainingBalance) {
                        setDownPayment(val);
                      }
                    }}
                    className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h4 className="font-bold text-slate-900 mb-3">Your Payment Plan</h4>
              <div className="space-y-2">
                {totalCredits > 0 && (
                  <div className="flex justify-between text-sm pb-2 border-b border-blue-200">
                    <span className="text-green-700">✓ Already Credited</span>
                    <span className="font-semibold text-green-600">{formatCurrency(totalCredits)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-600">Down Payment (Today)</span>
                  <span className="text-xl font-bold text-blue-600">{formatCurrency(downPayment)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Balance After Down Payment</span>
                  <span className="font-semibold text-slate-700">{formatCurrency(plan.balanceAfterDown)}</span>
                </div>
                {plan.balanceAfterDown > 0 && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Weekly Payment</span>
                      <span className="font-bold text-slate-900">{formatCurrency(plan.weeklyPayment)}/week</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Duration</span>
                      <span className="font-semibold text-slate-700">{plan.numberOfWeeks} weeks</span>
                    </div>
                  </>
                )}
              </div>

              {/* Enrollment Status */}
              <div className={`mt-4 p-3 rounded-lg ${plan.balanceAfterDown > 0 ? 'bg-amber-100' : 'bg-green-100'}`}>
                {plan.balanceAfterDown > 0 ? (
                  <p className="text-sm text-amber-800">
                    ⚠️ <strong>Enrollment pending:</strong> You can start after paying down payment. 
                    Weekly payments required to continue.
                  </p>
                ) : (
                  <p className="text-sm text-green-800">
                    ✓ <strong>Full enrollment:</strong> Pay {formatCurrency(downPayment)} to enroll immediately!
                  </p>
                )}
              </div>
            </div>

            {/* BNPL Option */}
            <div className="border rounded-lg p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useBnpl}
                  onChange={(e) => setUseBnpl(e.target.checked)}
                  className="mt-1 w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <div>
                  <p className="font-medium text-slate-900">Split down payment with Buy Now Pay Later</p>
                  <p className="text-sm text-slate-600">
                    Can't pay {formatCurrency(downPayment)} today? Use BNPL to split it into smaller payments.
                  </p>
                </div>
              </label>

              {useBnpl && (
                <div className="mt-4 space-y-2 ml-8">
                  <button
                    type="button"
                    onClick={() => setSelectedBnpl('stripe')}
                    className={`w-full p-3 rounded-lg border-2 text-left ${
                      selectedBnpl === 'stripe' ? 'border-blue-500 bg-blue-50' : 'border-slate-200'
                    }`}
                  >
                    <p className="font-medium">Affirm / Klarna / Afterpay</p>
                    <p className="text-sm text-slate-600">Split into 4 payments or pay over time</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => sezzleAvailable && setSelectedBnpl('sezzle')}
                    disabled={!sezzleAvailable}
                    className={`w-full p-3 rounded-lg border-2 text-left ${
                      selectedBnpl === 'sezzle' && sezzleAvailable
                        ? 'border-purple-500 bg-purple-50'
                        : sezzleAvailable
                        ? 'border-slate-200'
                        : 'border-slate-100 bg-slate-50 opacity-50'
                    }`}
                  >
                    <p className="font-medium">Sezzle</p>
                    <p className="text-sm text-slate-600">
                      {sezzleAvailable 
                        ? `4 payments of ${formatCurrency(downPayment / 4)}`
                        : downPayment < 35 ? 'Min $35 required' : 'Max $2,500'
                      }
                    </p>
                  </button>
                </div>
              )}
            </div>

            {/* Schedule */}
            <button
              type="button"
              onClick={() => setShowSchedule(!showSchedule)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {showSchedule ? '▼ Hide' : '▶ View'} Payment Schedule
            </button>

            {showSchedule && (
              <div className="bg-slate-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 border-b">
                      <th className="pb-2">Payment</th>
                      <th className="pb-2">Date</th>
                      <th className="pb-2 text-right">Amount</th>
                      <th className="pb-2 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plan.schedule.map((item, idx) => (
                      <tr key={idx} className={`border-b border-slate-100 ${
                        item.type === 'credit' ? 'bg-green-50' : 
                        item.type === 'down_payment' ? 'bg-blue-50 font-semibold' : ''
                      }`}>
                        <td className="py-2">
                          {item.type === 'credit' ? '✓ Credit Applied' :
                           item.type === 'down_payment' ? '⬇️ Down Payment' : 
                           `Week ${item.weekNumber}`}
                        </td>
                        <td className="py-2">
                          {item.type === 'credit' ? 'Applied' : formatDate(item.dueDate)}
                        </td>
                        <td className="py-2 text-right">
                          {item.type === 'credit' ? (
                            <span className="text-green-600">-{formatCurrency(item.amount)}</span>
                          ) : (
                            formatCurrency(item.amount)
                          )}
                        </td>
                        <td className="py-2 text-right text-slate-500">
                          {formatCurrency(item.remainingBalance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* Checkout Button */}
      <div className="p-4 bg-slate-50 border-t">
        <button
          onClick={handleCheckout}
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-blue-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Processing...' : 
           paymentType === 'full' ? `Pay ${formatCurrency(remainingBalance)} - Enroll Now` :
           useBnpl ? `Continue with BNPL - ${formatCurrency(downPayment)}` :
           `Pay ${formatCurrency(downPayment)} Down Payment`}
        </button>

        {paymentType === 'plan' && plan.balanceAfterDown > 0 && (
          <p className="text-xs text-center text-slate-500 mt-2">
            Remaining {formatCurrency(plan.balanceAfterDown)} due in {plan.numberOfWeeks} weekly payments of {formatCurrency(plan.weeklyPayment)}
          </p>
        )}
      </div>
    </div>
  );
}
