"use client";

import React from 'react';

import { useState } from 'react';

interface ProductCheckoutButtonProps {
  productId: string;
  creatorId: string;
  priceCents: number;
  productTitle: string;
}

export default function ProductCheckoutButton({
  productId,
  creatorId,
  priceCents,
  productTitle,
}: ProductCheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCheckout = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/checkout/marketplace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          creatorId,
          priceCents,
          productTitle,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Checkout failed');
      }

      const { url } = await res.json();
      window.location.href = url;
    } catch (err: any) {
      setError((err as Error).message);
      setLoading(false);
    }
  };

  return (
    <div>
      {error && (
        <div className="mb-4 bg-brand-red-50 border border-brand-red-200 text-brand-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      <button
        onClick={handleCheckout}
        disabled={loading}
        className="w-full bg-brand-blue-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-brand-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {loading ? 'Processing...' : 'Buy Now'}
      </button>
    </div>
  );
}
