'use client';

import { useState } from 'react';
import Image from 'next/image';

export type PaymentMethod = 'stripe' | 'sezzle';

interface PaymentMethodSelectorProps {
  amount: number;
  onSelect: (method: PaymentMethod) => void;
  selectedMethod: PaymentMethod;
  disabled?: boolean;
}

export default function PaymentMethodSelector({
  amount,
  onSelect,
  selectedMethod,
  disabled = false,
}: PaymentMethodSelectorProps) {
  // Sezzle limits: $35 min, $2,500 max
  const sezzleAvailable = amount >= 35 && amount <= 2500;
  const sezzlePayment = amount / 4;

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-slate-700 mb-2">
        Payment Method
      </label>

      {/* Stripe (Card, Affirm, Klarna, Afterpay) */}
      <button
        type="button"
        onClick={() => onSelect('stripe')}
        disabled={disabled}
        className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
          selectedMethod === 'stripe'
            ? 'border-blue-500 bg-blue-50'
            : 'border-slate-200 hover:border-slate-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-slate-900">Credit Card or BNPL</p>
            <p className="text-sm text-slate-600">
              Card, Affirm, Klarna, or Afterpay
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-5 bg-slate-100 rounded flex items-center justify-center text-xs font-bold text-slate-600">
              VISA
            </div>
            <div className="w-8 h-5 bg-slate-100 rounded flex items-center justify-center text-xs font-bold text-slate-600">
              MC
            </div>
            <div className="w-8 h-5 bg-purple-100 rounded flex items-center justify-center text-xs font-bold text-purple-600">
              K
            </div>
          </div>
        </div>
        {selectedMethod === 'stripe' && (
          <p className="text-xs text-blue-600 mt-2">
            Pay in full or split into payments with Affirm, Klarna, or Afterpay
          </p>
        )}
      </button>

      {/* Sezzle */}
      <button
        type="button"
        onClick={() => sezzleAvailable && onSelect('sezzle')}
        disabled={disabled || !sezzleAvailable}
        className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
          selectedMethod === 'sezzle'
            ? 'border-purple-500 bg-purple-50'
            : sezzleAvailable
            ? 'border-slate-200 hover:border-slate-300'
            : 'border-slate-100 bg-slate-50 opacity-50'
        } ${disabled || !sezzleAvailable ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-slate-900">Sezzle</p>
              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                0% Interest
              </span>
            </div>
            <p className="text-sm text-slate-600">
              {sezzleAvailable
                ? `4 payments of $${sezzlePayment.toFixed(2)}`
                : amount < 35
                ? 'Minimum $35 required'
                : 'Maximum $2,500 limit'}
            </p>
          </div>
          <div className="w-16 h-8 bg-purple-600 rounded flex items-center justify-center">
            <span className="text-white text-xs font-bold">Sezzle</span>
          </div>
        </div>
        {selectedMethod === 'sezzle' && sezzleAvailable && (
          <div className="mt-3 pt-3 border-t border-purple-200">
            <div className="flex justify-between text-sm">
              <span className="text-purple-700">Payment schedule:</span>
            </div>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {[1, 2, 3, 4].map((num) => (
                <div key={num} className="text-center">
                  <div className="text-xs text-slate-500">
                    {num === 1 ? 'Today' : `+${(num - 1) * 2} wks`}
                  </div>
                  <div className="font-semibold text-purple-700">
                    ${sezzlePayment.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </button>

      {/* Info text */}
      <p className="text-xs text-slate-500 mt-2">
        All payment options are secure and encrypted. BNPL options subject to approval.
      </p>
    </div>
  );
}
