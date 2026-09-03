'use client';

/**
 * PayNowButton — Self-pay enrollment CTA for program detail pages.
 *
 * Behavior:
 *   1. If stripeCheckoutHref starts with "https://buy.stripe.com/" → redirect directly (payment link)
 *   2. Otherwise → POST to /api/checkout/program to create a Stripe Checkout session
 *   3. Shows BNPL provider pills (Klarna, Afterpay, Zip, Affirm, Sezzle) below the button
 *
 * Usage:
 *   <PayNowButton slug="hvac-technician" cost="$5,000" />
 *   <PayNowButton slug="barber-apprenticeship" cost="$3,200" stripeCheckoutHref="https://buy.stripe.com/..." />
 */

import { useState } from 'react';
import { Loader2, CreditCard, ExternalLink } from 'lucide-react';
import { ACTIVE_BNPL_PROVIDERS } from '@/lib/bnpl-config';

interface PayNowButtonProps {
  slug: string;
  cost: string;
  /** Stripe payment link (https://buy.stripe.com/...) or omit to use /api/checkout/program */
  stripeCheckoutHref?: string;
  /** Label override — defaults to "Pay & Enroll — {cost}" */
  label?: string;
  className?: string;
}

export function PayNowButton({
  slug,
  cost,
  stripeCheckoutHref,
  label,
  className = '',
}: PayNowButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDirectLink =
    stripeCheckoutHref?.startsWith('https://buy.stripe.com/') ||
    stripeCheckoutHref?.startsWith('https://checkout.stripe.com/');

  async function handleClick() {
    setError(null);

    // Direct Stripe payment link — navigate immediately
    if (isDirectLink && stripeCheckoutHref) {
      window.location.href = stripeCheckoutHref;
      return;
    }

    // API-created session
    setLoading(true);
    try {
      const res = await fetch('/api/checkout/program', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          successUrl: `${window.location.origin}/programs/${slug}/enrollment-success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/programs/${slug}`,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.url) {
        setError(data.error ?? 'Unable to start checkout. Please try again.');
        setLoading(false);
        return;
      }

      window.location.href = data.url;
    } catch {
      setError('Network error. Please check your connection and try again.');
      setLoading(false);
    }
  }

  const buttonLabel = label ?? `Pay & Enroll — ${cost}`;

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleClick}
        disabled={loading}
        className={`w-full flex items-center justify-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-colors text-sm ${className}`}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Redirecting to checkout…
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4" />
            {buttonLabel}
            {isDirectLink && <ExternalLink className="w-3.5 h-3.5 opacity-70" />}
          </>
        )}
      </button>

      {error && (
        <p className="text-xs text-brand-red-600 font-medium text-center">{error}</p>
      )}

      {ACTIVE_BNPL_PROVIDERS.length > 0 && (
        <div className="flex flex-wrap gap-1.5 justify-center mt-1">
          {ACTIVE_BNPL_PROVIDERS.map((p) => (
            <span
              key={p.id}
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${p.badgeBg} ${p.badgeText}`}
            >
              {p.name}
            </span>
          ))}
        </div>
      )}
      <p className="text-[10px] text-slate-400 text-center">
        Installment options available at checkout
      </p>
    </div>
  );
}
