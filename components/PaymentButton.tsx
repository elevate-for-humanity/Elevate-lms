"use client";

import React from 'react';

import { useState } from 'react';
import { CreditCard, Loader2 } from 'lucide-react';

interface PaymentButtonProps {
  programId: string;
  programName: string;
  price: number;
  paymentType?: 'full' | 'plan';
  className?: string;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export default function PaymentButton({
  programId,
  programName,
  price,
  paymentType = 'full',
  className = '',
  variant = 'primary',
  size = 'md',
  fullWidth = false,
}: PaymentButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/programs/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          programId,
          paymentType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (data: any) {
      // Error: $1
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const getButtonClasses = () => {
    const baseClasses =
      'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variantClasses = {
      primary: 'bg-brand-blue-600 text-white hover:bg-brand-blue-700 focus:ring-brand-blue-500',
      secondary:
        'bg-white text-brand-blue-600 border-2 border-brand-blue-600 hover:bg-gray-50 focus:ring-brand-blue-500',
    };

    const sizeClasses = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg',
    };

    const widthClass = fullWidth ? 'w-full' : '';

    return `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`;
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getButtonText = () => {
    if (loading) return 'Processing...';

    if (paymentType === 'plan') {
      const monthlyAmount = Math.ceil(price / 4);
      return `Pay ${formatPrice(monthlyAmount)}/month`;
    }

    return `Pay ${formatPrice(price)} Now`;
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handlePayment}
        disabled={loading || price === 0}
        className={getButtonClasses()}
        aria-label={`Pay for ${programName}`}
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <CreditCard className="w-5 h-5" />
        )}
        <span>{getButtonText()}</span>
      </button>

      {error && (
        <div className="text-sm text-brand-orange-600 bg-brand-red-50 border border-brand-red-200 rounded-lg p-3">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="text-xs text-black text-center">
          <p>Secure checkout powered by Stripe</p>
          <p className="mt-1">
            Pay with card, Klarna, Afterpay, Zip, or bank account
          </p>
        </div>
      )}
    </div>
  );
}
