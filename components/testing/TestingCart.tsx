'use client';

/**
 * Testing cart — lets users add multiple exams before checking out.
 *
 * Usage:
 *   1. Wrap the provider page in <TestingCartProvider>.
 *   2. Replace each "Pay for Test" link with <AddExamToCartButton>.
 *   3. <TestingCartBar> renders the sticky bottom bar automatically.
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { ShoppingCart, X, Trash2, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CartItem {
  /** Provider key, e.g. 'nha', 'esco' */
  examType: string;
  /** Display name, e.g. 'Certified Phlebotomy Technician (CPT)' */
  examName: string;
  /** Price in cents */
  amountCents: number;
}

interface CartContextValue {
  items: CartItem[];
  add: (item: CartItem) => void;
  remove: (examName: string) => void;
  clear: () => void;
  has: (examName: string) => boolean;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const CartContext = createContext<CartContextValue | null>(null);

export function useTestingCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useTestingCart must be used inside TestingCartProvider');
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function TestingCartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const add = useCallback((item: CartItem) => {
    setItems((prev) => {
      if (prev.some((i) => i.examName === item.examName)) return prev;
      return [...prev, item];
    });
  }, []);

  const remove = useCallback((examName: string) => {
    setItems((prev) => prev.filter((i) => i.examName !== examName));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const has = useCallback(
    (examName: string) => items.some((i) => i.examName === examName),
    [items],
  );

  return (
    <CartContext.Provider value={{ items, add, remove, clear, has }}>
      {children}
      <TestingCartBar />
    </CartContext.Provider>
  );
}

// ─── Add-to-cart button ───────────────────────────────────────────────────────

interface AddExamToCartButtonProps {
  examType: string;
  examName: string;
  amountCents: number;
  /** Whether the provider is active (inactive providers show a disabled state) */
  active?: boolean;
}

export function AddExamToCartButton({
  examType,
  examName,
  amountCents,
  active = true,
}: AddExamToCartButtonProps) {
  const { add, remove, has } = useTestingCart();
  const inCart = has(examName);

  if (!active) return null;

  if (inCart) {
    return (
      <button
        onClick={() => remove(examName)}
        className="inline-flex items-center gap-1 bg-brand-green-50 border border-brand-green-300 text-brand-green-700 hover:bg-red-50 hover:border-red-300 hover:text-red-700 text-xs font-semibold px-2.5 py-1 rounded-md whitespace-nowrap transition-colors group"
        title="Remove from cart"
      >
        <span className="group-hover:hidden">✓ In Cart</span>
        <span className="hidden group-hover:inline">Remove</span>
      </button>
    );
  }

  return (
    <button
      onClick={() => add({ examType, examName, amountCents })}
      className="inline-flex items-center gap-1 border border-brand-red-300 text-brand-red-700 hover:bg-brand-red-50 hover:border-brand-red-400 text-xs font-semibold px-2.5 py-1 rounded-md whitespace-nowrap transition-colors"
    >
      <ShoppingCart className="w-3 h-3" />
      Add to Cart
    </button>
  );
}

// ─── Cart bar (sticky bottom) ─────────────────────────────────────────────────

function TestingCartBar() {
  const { items, remove, clear } = useTestingCart();
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Collapse when cart empties
  useEffect(() => {
    if (items.length === 0) setExpanded(false);
  }, [items.length]);

  if (items.length === 0) return null;

  const totalCents = items.reduce((sum, i) => sum + i.amountCents, 0);
  const totalDollars = (totalCents / 100).toFixed(2);

  async function handleCheckout() {
    setLoading(true);
    setError(null);

    try {
      // For multi-item carts, check out the first item and pass the rest as
      // metadata. The checkout API currently handles one line item — we send
      // the full list as a JSON metadata field so the webhook can record all
      // exams on the booking.
      const primary = items[0];

      const res = await fetch('/api/testing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examType: primary.examType,
          examName:
            items.length === 1
              ? primary.examName
              : `${items.length} Exams — ${items.map((i) => i.examName).join(', ')}`,
          feeCents: totalCents,
          bookingType: 'individual',
          participantCount: 1,
          cartItems: items,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Checkout failed (${res.status})`);
      }

      const { url } = await res.json();
      if (!url) throw new Error('No checkout URL returned');

      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed — please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 shadow-2xl">
      {/* Expanded item list */}
      {expanded && (
        <div className="bg-white border-t border-slate-200 max-h-64 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-3 space-y-2">
            {items.map((item) => (
              <div
                key={item.examName}
                className="flex items-center justify-between gap-3 py-2 border-b border-slate-100 last:border-0"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{item.examName}</p>
                  <p className="text-xs text-slate-500">${(item.amountCents / 100).toFixed(2)}</p>
                </div>
                <button
                  onClick={() => remove(item.examName)}
                  className="flex-shrink-0 p-1 text-slate-400 hover:text-red-600 transition-colors"
                  title="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main bar */}
      <div className="bg-slate-900 text-white">
        <div className="max-w-3xl mx-auto px-3 sm:px-4 py-3 flex items-center gap-2 sm:gap-3">
          {/* Toggle expand */}
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-2 flex-1 min-w-0 text-left"
          >
            <div className="relative flex-shrink-0">
              <ShoppingCart className="w-5 h-5 text-white" />
              <span className="absolute -top-1.5 -right-1.5 bg-brand-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
                {items.length}
              </span>
            </div>
            <span className="text-sm font-medium truncate hidden sm:block">
              {items.length === 1 ? items[0].examName : `${items.length} exams selected`}
            </span>
            <span className="text-sm font-medium truncate sm:hidden">
              {items.length} exam{items.length !== 1 ? 's' : ''}
            </span>
            {expanded ? (
              <ChevronDown className="w-4 h-4 flex-shrink-0 text-slate-400" />
            ) : (
              <ChevronUp className="w-4 h-4 flex-shrink-0 text-slate-400" />
            )}
          </button>

          {/* Total */}
          <span className="text-base sm:text-lg font-extrabold flex-shrink-0">${totalDollars}</span>

          {/* Clear */}
          <button
            onClick={clear}
            className="flex-shrink-0 p-1.5 text-slate-400 hover:text-white transition-colors"
            title="Clear cart"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Checkout */}
          <button
            onClick={handleCheckout}
            disabled={loading}
            className="flex-shrink-0 flex items-center gap-1.5 bg-brand-red-600 hover:bg-brand-red-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold px-3 sm:px-5 py-2.5 rounded-lg transition-colors text-sm whitespace-nowrap"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="hidden sm:inline">Processing…</span>
              </>
            ) : (
              <>
                <span className="hidden sm:inline">Pay & Book</span>
                <span className="sm:hidden">Pay</span>
              </>
            )}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-900/80 px-4 py-2 text-red-200 text-xs text-center">{error}</div>
        )}
      </div>
    </div>
  );
}
