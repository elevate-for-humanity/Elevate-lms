'use client';

import { useState } from 'react';
import { Check, CreditCard, Calendar, Shield } from 'lucide-react';

interface SezzlePaymentCardProps {
  price: number;
  selected?: boolean;
  onSelect?: () => void;
  disabled?: boolean;
}

/**
 * Sezzle Payment Option Card
 * 
 * Displays Sezzle as a payment option at checkout showing:
 * - 4 interest-free payments breakdown
 * - Payment schedule
 * - Trust indicators
 * 
 * Usage:
 * <SezzlePaymentCard price={199.99} selected={true} onSelect={() => {}} />
 */
export default function SezzlePaymentCard({
  price,
  selected = false,
  onSelect,
  disabled = false,
}: SezzlePaymentCardProps) {
  const installmentAmount = (price / 4).toFixed(2);
  
  // Sezzle limits
  const isEligible = price >= 35 && price <= 2500;

  if (!isEligible) {
    return null;
  }

  return (
    <div
      onClick={disabled ? undefined : onSelect}
      className={`
        relative border-2 rounded-xl p-5 transition-all cursor-pointer
        ${selected 
          ? 'border-purple-600 bg-purple-50 shadow-md' 
          : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-sm'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      {/* Selection indicator */}
      {selected && (
        <div className="absolute top-3 right-3 w-6 h-6 bg-white rounded-full flex items-center justify-center">
          <Check className="w-4 h-4 text-white" />
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-8 bg-white rounded flex items-center justify-center">
          <span className="text-white text-xs font-bold">Sezzle</span>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Pay in 4 interest-free payments</h3>
          <p className="text-sm text-gray-500">Split your purchase, no credit impact</p>
        </div>
      </div>

      {/* Payment breakdown */}
      <div className="bg-white rounded-lg border border-gray-100 p-4 mb-4">
        <div className="grid grid-cols-4 gap-2 text-center">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col">
              <span className="text-xs text-gray-500 mb-1">
                {i === 0 ? 'Today' : `+${i * 2} wks`}
              </span>
              <span className={`font-bold ${i === 0 ? 'text-purple-600' : 'text-gray-700'}`}>
                ${installmentAmount}
              </span>
              {i === 0 && (
                <span className="text-xs text-purple-600 mt-1">Due now</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-1.5">
          <CreditCard className="w-4 h-4 text-purple-500" />
          <span>0% interest</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-purple-500" />
          <span>6 weeks to pay</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-purple-500" />
          <span>No hard credit check</span>
        </div>
      </div>

      {/* Total */}
      <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
        <span className="text-gray-600">Total</span>
        <span className="text-lg font-bold text-gray-900">${price.toFixed(2)}</span>
      </div>
    </div>
  );
}

/**
 * Compact version for inline display
 */
export function SezzlePaymentBadge({ price }: { price: number }) {
  const installmentAmount = (price / 4).toFixed(2);
  const isEligible = price >= 35 && price <= 2500;

  if (!isEligible) return null;

  return (
    <div className="inline-flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-full px-3 py-1.5">
      <div className="w-14 h-5 bg-white rounded flex items-center justify-center">
        <span className="text-white text-[10px] font-bold">Sezzle</span>
      </div>
      <span className="text-sm text-purple-700">
        or 4 × <strong>${installmentAmount}</strong>
      </span>
    </div>
  );
}

/**
 * Mini info tooltip
 */
export function SezzleInfoTooltip() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={() => setIsOpen(!isOpen)}
        className="text-purple-600 hover:text-purple-700 underline text-sm"
      >
        What is Sezzle?
      </button>
      
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50">
          <h4 className="font-semibold text-gray-900 mb-2">Buy Now, Pay Later</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Split into 4 payments over 6 weeks</li>
            <li>• 0% interest, no hidden fees</li>
            <li>• No impact on your credit score</li>
            <li>• Instant approval decision</li>
          </ul>
          <div className="mt-3 pt-3 border-t border-gray-100">
            <a 
              href="https://sezzle.com/how-it-works" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-purple-600 hover:text-purple-700 text-sm"
            >
              Learn more →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
