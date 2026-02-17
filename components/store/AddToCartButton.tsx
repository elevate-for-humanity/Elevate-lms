"use client";

import React from 'react';

import { useState } from 'react';
import { StoreProduct } from '@/lib/store/products';
import { addToCart } from '@/lib/store/cart';
import { useRouter } from 'next/navigation';

interface AddToCartButtonProps {
  product: StoreProduct;
  quantity?: number;
  className?: string;
}

export default function AddToCartButton({ product, quantity = 1, className }: AddToCartButtonProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const router = useRouter();

  const handleAddToCart = async () => {
    setIsAdding(true);

    try {
      addToCart(product, quantity);
      setShowSuccess(true);

      setTimeout(() => {
        setShowSuccess(false);
      }, 2000);
    } catch (error) { /* Error handled silently */ 
      // Error: $1
    } finally {
      setIsAdding(false);
    }
  };

  const handleBuyNow = () => {
    addToCart(product, quantity);
    router.push('/store/cart');
  };

  if (!product.inStock) {
    return (
      <button
        disabled
        className="w-full px-8 py-4 bg-slate-300 text-slate-500 font-bold rounded-lg cursor-not-allowed"
      >
        Out of Stock
      </button>
    );
  }

  return (
    <div className="space-y-3">
      {showSuccess && (
        <div className="p-4 bg-brand-green-50 border border-brand-green-200 rounded-lg flex items-center gap-3">
          <svg className="w-5 h-5 text-brand-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="text-brand-green-800 font-medium">Added to cart!</span>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleAddToCart}
          disabled={isAdding}
          className={`flex-1 px-8 py-4 bg-brand-blue-600 text-white font-bold rounded-lg hover:bg-brand-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className || ''}`}
        >
          {isAdding ? 'Adding...' : 'Add to Cart'}
        </button>

        <button
          onClick={handleBuyNow}
          className="flex-1 px-8 py-4 bg-brand-orange-500 text-white font-bold rounded-lg hover:bg-brand-orange-600 transition-all"
        >
          Buy Now
        </button>
      </div>
    </div>
  );
}
