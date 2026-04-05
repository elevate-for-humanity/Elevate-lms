"use client";

import React from 'react';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Loader2 } from 'lucide-react';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
);

const DONATION_AMOUNTS = [25, 50, 100, 250, 500, 1000];

export default function DonationForm() {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(100);
  const [customAmount, setCustomAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDonate = async () => {
    const amount = customAmount ? parseFloat(customAmount) : selectedAmount;

    if (!amount || amount < 1) {
      setError('Please enter a valid donation amount');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create Stripe checkout session
      const response = await fetch('/api/donate/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });

      const { sessionId, error: apiError } = await response.json();

      if (apiError) {
        throw new Error(apiError);
      }

      // Redirect to Stripe Checkout
      const stripe = await stripePromise;
      if (stripe) {
        const { error: stripeError } = await stripe.redirectToCheckout({
          sessionId,
        });
        if (stripeError) {
          throw stripeError;
        }
      }
    } catch (data: any) {
      // Error: $1
      setError('Failed to process donation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
      <h3 className="text-2xl font-bold text-black mb-6">
        Choose Your Donation Amount
      </h3>

      {/* Preset Amounts */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {DONATION_AMOUNTS.map((amount) => (
          <button
            key={amount}
            onClick={() => {
              setSelectedAmount(amount);
              setCustomAmount('');
            }}
            className={`py-4 px-6 rounded-lg font-semibold text-lg transition-all ${
              selectedAmount === amount && !customAmount
                ? 'bg-brand-orange-600 text-white shadow-lg scale-105'
                : 'bg-slate-100 text-black hover:bg-slate-200'
            }`}
          >
            ${amount}
          </button>
        ))}
      </div>

      {/* Custom Amount */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-black mb-2">
          Or enter a custom amount:
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg">
            $
          </span>
          <input
            type="number"
            min="1"
            step="1"
            value={customAmount}
            onChange={(e) => {
              setCustomAmount(e.target.value);
              setSelectedAmount(null);
            }}
            placeholder="Enter amount"
            className="w-full pl-8 pr-4 py-3 border-2 border-slate-300 rounded-lg text-lg focus:border-brand-orange-500 focus:ring-2 focus:ring-brand-orange-200 outline-none"
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-brand-red-50 border border-brand-red-200 rounded-lg text-brand-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Donate Button */}
      <button
        onClick={handleDonate}
        disabled={loading || (!selectedAmount && !customAmount)}
        className="w-full bg-brand-blue-700 hover: hover: text-white py-4 rounded-lg font-bold text-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing...
          </>
        ) : (
          <>Donate ${customAmount || selectedAmount || '0'}</>
        )}
      </button>

      {/* Security Note */}
      <p className="text-xs text-slate-500 text-center mt-4">
        🔒 Secure payment powered by Stripe. Your donation is tax-deductible.
      </p>
    </div>
  );
}
