'use client';

import React from 'react';
// app/pay/StripePayButton.tsx

import { useEffect, useState } from 'react';


export default function StripePayButton() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src^="https://js.stripe.com/v3/buy-button"]'
    );

    if (existing) {
      setLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/buy-button.js';
    script.async = true;
    script.onload = () => setLoaded(true);
    script.onerror = () => {
      setLoaded(false);
    };

    document.body.appendChild(script);
  }, []);

  return (
    <div className="space-y-2">
      {!loaded && (
        <p className="text-xs text-slate-500">Loading secure payment button…</p>
      )}

      <stripe-buy-button
        buy-button-id="buy_btn_1SczpeIRNf5vPH3A0Ae1nnjh"
        publishable-key={process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}
      />

      <p className="text-[11px] text-slate-500">
        By completing your payment you agree to Elevate for Humanity&apos;s
        refund policy and enrollment terms.
      </p>
    </div>
  );
}
