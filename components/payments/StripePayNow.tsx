"use client";

import React from 'react';

import { useState } from 'react';
import { toast } from 'react-hot-toast';

interface StripePayNowProps {
  amount: number;
  courseId: string;
  courseName: string;
  userEmail?: string;
  userName?: string;
  onSuccess?: (sessionId: string) => void;
  onError?: (error: string) => void;
  className?: string;
}

export default function StripePayNow({
  amount,
  courseId,
  courseName,
  userEmail,
  userName,
  onSuccess,
  onError,
  className = '',
}: StripePayNowProps) {
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          courseId,
          courseName,
          userEmail,
          userName,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create checkout session');
      }

      const { sessionId, url } = await response.json();

      if (url) {
        // Redirect to Stripe Checkout
        window.location.href = url;
        if (onSuccess) onSuccess(sessionId);
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) { /* Error handled silently */ 
      // Error: $1
      const errorMessage = 'Failed to start checkout';
      toast.error(errorMessage);
      if (onError) onError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePay}
      disabled={loading}
      className={`inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors ${className}`}
    >
      {loading ? (
        <>
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Processing...
        </>
      ) : (
        <>
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
          </svg>
          Pay Now
          <span className="text-sm font-normal">
            (${amount.toFixed(2)})
          </span>
        </>
      )}
    </button>
  );
}
