"use client";

import React from 'react';

import { useState } from 'react';
import { ShoppingCart } from 'lucide-react';

interface CheckoutButtonProps {
  productName: string;
  price: number;
  type: 'service' | 'course';
  category: string;
  className?: string;
}

export default function CheckoutButton({
  productName,
  price,
  type,
  category,
  className = '',
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/drug-testing/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productName,
          price,
          type,
          category,
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Error creating checkout session. Please try again or call (317) 314-3757.');
        setLoading(false);
      }
    } catch (error) { /* Error handled silently */ 
      alert('Error creating checkout session. Please try again or call (317) 314-3757.');
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className={`inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand-blue-600 text-white rounded-lg font-bold hover:bg-brand-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
    >
      {loading ? (
        <>
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <ShoppingCart className="w-5 h-5" />
          Order Now - ${price}
        </>
      )}
    </button>
  );
}
