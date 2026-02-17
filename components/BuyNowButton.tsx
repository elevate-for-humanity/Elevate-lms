"use client";

import React from 'react';

import { useState } from "react";
import { ShoppingCart, CreditCard } from "lucide-react";

interface BuyNowButtonProps {
  programName: string;
  programSlug: string;
  price: number;
  className?: string;
  showPaymentPlan?: boolean;
}

export function BuyNowButton({
  programName,
  programSlug,
  price,
  className = "",
  showPaymentPlan = true
}: BuyNowButtonProps) {
  const [loading, setLoading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const handleCheckout = async (paymentType: 'full' | 'plan') => {
    setLoading(true);

    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          programName,
          programSlug,
          price,
          paymentType,
        }),
      });

      const { url } = await response.json();

      if (url) {
        window.location.href = url;
      }
    } catch (error) { /* Error handled silently */ 
      // Error: $1
      alert('Something went wrong. Please try again or contact us.');
    } finally {
      setLoading(false);
    }
  };

  if (showPaymentPlan && price > 500) {
    return (
      <div className={className}>
        {!showOptions ? (
          <button
            onClick={() => setShowOptions(true)}
            className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-brand-green-600 px-8 py-4 text-base font-bold text-white shadow-lg hover:bg-brand-green-700 transition-all hover:scale-105"
          >
            <ShoppingCart size={20} />
            Buy Now - ${price}
          </button>
        ) : (
          <div className="space-y-2">
            {/* Pay in Full */}
            <button
              onClick={() => handleCheckout('full')}
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-brand-green-600 px-6 py-3 text-sm font-bold text-white shadow-lg hover:bg-brand-green-700 transition-all disabled:opacity-50"
            >
              <ShoppingCart size={18} />
              {loading ? 'Processing...' : `Pay in Full - $${price}`}
            </button>

            {/* Payment Plan */}
            <button
              onClick={() => handleCheckout('plan')}
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-brand-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg hover:bg-brand-blue-700 transition-all disabled:opacity-50"
            >
              <CreditCard size={18} />
              {loading ? 'Processing...' : `Payment Plan - $${Math.ceil(price / 4)}/mo`}
            </button>

            <button
              onClick={() => setShowOptions(false)}
              className="w-full text-center text-xs text-gray-500 hover:text-black"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => handleCheckout('full')}
      disabled={loading}
      className={`inline-flex items-center justify-center gap-2 rounded-full bg-brand-green-600 px-8 py-4 text-base font-bold text-white shadow-lg hover:bg-brand-green-700 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      <ShoppingCart size={20} />
      {loading ? 'Processing...' : `Buy Now - $${price}`}
    </button>
  );
}
