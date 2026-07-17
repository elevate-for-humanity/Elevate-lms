'use client';

import React from 'react';

import { useState } from 'react';
import Link from 'next/link';


export default function CareerCheckout() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/checkout/career', { method: 'POST' });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Checkout failed');
      }

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      setError((err as Error).message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-black mb-4">Career Track Access</h1>
          <p className="text-lg text-black mb-2">$149/month platform access</p>
          <p className="text-black mb-8">
            Includes full LMS access, career pathway content, business modules, professional tools,
            and priority support.
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full rounded-xl bg-brand-orange-600 text-white px-6 py-4 font-bold hover:bg-brand-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Redirecting to secure checkout...' : 'Continue to secure checkout'}
          </button>

          <p className="text-sm text-slate-500 mt-4 text-center">
            Payments are processed securely through Stripe
          </p>

          <div className="mt-6 text-center">
            <Link href="/pricing" className="text-black hover:text-black underline">
              ← Back to pricing
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
