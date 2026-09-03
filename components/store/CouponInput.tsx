'use client';

import { useState } from 'react';
import { Tag, Check, X, Loader2 } from 'lucide-react';

interface CouponInputProps {
  onCouponApplied: (code: string, discountCents: number) => void;
  onCouponRemoved: () => void;
  disabled?: boolean;
  minPurchaseCents?: number;
}

export function CouponInput({ 
  onCouponApplied, 
  onCouponRemoved, 
  disabled = false,
  minPurchaseCents 
}: CouponInputProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState<{ code: string; discountCents: number } | null>(null);

  const handleApply = async () => {
    if (!code.trim()) return;
    
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/store/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code: code.trim(),
          purchaseAmountCents: minPurchaseCents 
        }),
      });

      const data = await res.json();

      if (!data.valid) {
        setError(data.error || 'Invalid coupon code');
        return;
      }

      setApplied({ code: data.coupon.code, discountCents: data.discount_amount_cents });
      onCouponApplied(data.coupon.code, data.discount_amount_cents);
      setCode('');
    } catch {
      setError('Failed to validate coupon');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    setApplied(null);
    setError(null);
    onCouponRemoved();
  };

  if (applied) {
    return (
      <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
        <div className="flex items-center gap-2">
          <Check className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium text-green-800">
            {applied.code}
          </span>
          <span className="text-sm text-green-600">
            (-${(applied.discountCents / 100).toFixed(2)})
          </span>
        </div>
        <button
          type="button"
          onClick={handleRemove}
          className="text-green-600 hover:text-green-800"
          aria-label="Remove coupon"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Enter coupon code"
            disabled={disabled || loading}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm font-mono
              focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500
              disabled:bg-slate-50 disabled:text-slate-500"
            onKeyDown={(e) => e.key === 'Enter' && handleApply()}
          />
        </div>
        <button
          type="button"
          onClick={handleApply}
          disabled={!code.trim() || loading || disabled}
          className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium
            hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
        </button>
      </div>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
