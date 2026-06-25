'use client';

import React, { useState } from 'react';
import { ShoppingCart, X, Plus, Minus, Loader2, CreditCard } from 'lucide-react';
import { useCart } from '@/lib/store/use-cart';
import { createCheckoutSession } from '@/lib/stripe/client';

export default function TestingCart() {
  const { items, removeItem, updateQuantity, total, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);
    try {
      const { url } = await createCheckoutSession(items);
      window.location.href = url;
    } catch (err) {
      setError('Checkout failed. Please try again.');
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="bg-[#111114] border border-white/5 rounded-2xl p-8 text-center">
        <ShoppingCart className="w-12 h-12 text-slate-700 mx-auto mb-4" />
        <p className="text-slate-400">Your cart is empty.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#111114] border border-white/5 rounded-2xl overflow-hidden flex flex-col h-full max-h-[600px]">
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
        <h3 className="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-wider">
          <ShoppingCart className="w-4 h-4" />
          Test Checkout
        </h3>
        <button onClick={clearCart} className="text-[10px] text-slate-500 hover:text-white uppercase font-bold">
          Clear All
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-4 bg-white/5 p-3 rounded-xl border border-white/5">
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-white truncate">{item.name}</h4>
              <p className="text-xs text-slate-500">${item.price}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                className="w-6 h-6 rounded bg-white/10 flex items-center justify-center hover:bg-white/20"
              >
                <Minus className="w-3 h-3 text-white" />
              </button>
              <span className="text-sm font-bold text-white min-w-[20px] text-center">{item.quantity}</span>
              <button
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                className="w-6 h-6 rounded bg-white/10 flex items-center justify-center hover:bg-white/20"
              >
                <Plus className="w-3 h-3 text-white" />
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

      <div className="p-4 bg-white/5 border-t border-white/5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-slate-400 text-sm">Total</span>
          <span className="text-xl font-black text-white">${total.toFixed(2)}</span>
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
              Pay & Initialize
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
