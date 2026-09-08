'use client';

import { useState } from 'react';
import type { UnifiedCheckoutInput } from '@/lib/checkout/unified-checkout';

type Props = {
  checkout: UnifiedCheckoutInput;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onError?: (message: string) => void;
};

export function UnifiedCheckoutButton({ checkout, children, className, disabled, onError }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function beginCheckout() {
    if (submitting || disabled) return;
    setSubmitting(true);
    setError('');
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(checkout),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || 'Unable to start checkout.');
      if (!body.checkoutUrl)
        throw new Error('Checkout did not return a secure payment destination.');
      window.location.assign(body.checkoutUrl);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Unable to start checkout.';
      setError(message);
      onError?.(message);
      setSubmitting(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={beginCheckout}
        disabled={disabled || submitting}
        aria-busy={submitting}
        className={className}
      >
        {submitting ? 'Opening secure checkout…' : children}
      </button>
      {error ? (
        <p role="alert" className="mt-2 text-sm font-semibold text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
