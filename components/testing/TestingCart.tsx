'use client';

import React, { useState, createContext, useContext, ReactNode } from 'react';
import { ShoppingCart, X, Plus, Minus, Loader2, CreditCard } from 'lucide-react';
import { useCart } from '@/lib/store/use-cart';
import { handleTestingCheckout } from '@/lib/store/actions';
import { addToCart } from '@/lib/store/cart';

// Provider implementation
export const TestingCartProvider = ({ children }: { children: ReactNode }) => {
  return <>{children}</>;
};

interface AddExamToCartButtonProps {
  examType: string;
  examName: string;
  amountCents: number;
  active: boolean;
  className?: string;
}

// Add to cart button
export const AddExamToCartButton = ({ examType, examName, amountCents, active, className }: AddExamToCartButtonProps) => {
  const handleAddToCart = () => {
    const product = {
      id: `testing-${examType}-${examName}`.replace(/\s+/g, '-').toLowerCase(),
      name: examName,
      slug: `testing-${examType}-${examName}`.replace(/\s+/g, '-').toLowerCase(),
      category: 'certification-prep' as const,
      price: amountCents / 100,
      description: `${examName} exam at Elevate Testing Center`,
      image: '/images/pages/testing-page-1.webp',
      inStock: true,
      featured: false,
      digital: false,
    };
    addToCart(product);
  };

  if (!active) return null;

  return (
    <button
      onClick={handleAddToCart}
      className={className ?? 'inline-flex items-center gap-1 border border-brand-red-300 text-brand-red-700 hover:border-brand-red-400 hover:bg-brand-red-50 text-xs font-semibold px-2.5 py-1 rounded-md whitespace-nowrap transition-colors'}
    >
      <CreditCard className="w-3 h-3" />
      Add to Cart
    </button>
  );
};

export default function TestingCart() {
  const { items, removeItem, updateQuantity, total, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);
    try {
      const { url } = await handleTestingCheckout(items);
      if (url) window.location.href = url;
    } catch (err) {
      setError('Checkout failed. Please try again.');
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
        <ShoppingCart className="w-12 h-12 text-brand-blue-600 mx-auto mb-4" />
        <p className="text-slate-700">Your cart is empty.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col h-full max-h-[600px]">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
        <h3 className="font-bold text-slate-950 flex items-center gap-2 text-sm uppercase tracking-wider">
          <ShoppingCart className="w-4 h-4" />
          Test Checkout
        </h3>
        <button onClick={clearCart} className="text-[10px] text-slate-500 hover:text-slate-950 uppercase font-bold">
          Clear All
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-white/5">
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-slate-950 truncate">{item.name}</h4>
              <p className="text-xs text-slate-500">${item.price}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                className="w-6 h-6 rounded bg-slate-200 flex items-center justify-center hover:bg-slate-300"
              >
                <Minus className="w-3 h-3 text-slate-950" />
              </button>
              <span className="text-sm font-bold text-slate-950 min-w-[20px] text-center">{item.quantity}</span>
              <button
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                className="w-6 h-6 rounded bg-slate-200 flex items-center justify-center hover:bg-slate-300"
              >
                <Plus className="w-3 h-3 text-slate-950" />
              </button>
              <button
                onClick={() => removeItem(item.id)}
                className="ml-2 text-slate-500 hover:text-brand-red-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-slate-50 border-t border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <span className="text-slate-700 text-sm">Total</span>
          <span className="text-xl font-black text-slate-950">${total.toFixed(2)}</span>
        </div>
        
        <button
          onClick={handleCheckout}
          disabled={loading}
          className="w-full bg-brand-red-600 hover:bg-brand-red-700 disabled:opacity-50 text-white font-black py-3 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 text-sm uppercase tracking-widest"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <CreditCard className="w-5 h-5" />
              Pay & Checkout
            </>
          )}
        </button>

        {error && (
          <p className="mt-3 text-xs text-red-400 text-center font-medium">{error}</p>
        )}
      </div>
    </div>
  );
}
