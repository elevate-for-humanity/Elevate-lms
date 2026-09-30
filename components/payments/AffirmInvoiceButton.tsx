'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { Affirm } from '@/lib/types/external-sdks';

type AffirmBrowserWindow = Window & {
  affirm?: Affirm.AffirmInstance;
  _affirm_config?: Affirm.AffirmConfig;
};

export function AffirmInvoiceButton({
  billingInvoiceId,
  disabled = false,
}: {
  billingInvoiceId: string;
  disabled?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openCheckout() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/affirm/invoice-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billingInvoiceId }),
      });
      const data = await response.json();
      if (!response.ok || !data.publicKey || !data.checkoutConfig) {
        throw new Error(data.error || 'Affirm checkout is temporarily unavailable.');
      }

      const win = window as AffirmBrowserWindow;
      const launch = () => {
        win.affirm?.checkout(data.checkoutConfig);
        win.affirm?.checkout.open();
      };
      win._affirm_config = {
        public_api_key: data.publicKey,
        script: data.affirmJsUrl,
      };
      if (win.affirm) {
        launch();
      } else {
        const existing = document.querySelector<HTMLScriptElement>('script[data-elevate-affirm]');
        if (existing) {
          existing.addEventListener('load', launch, { once: true });
        } else {
          const script = document.createElement('script');
          script.dataset.elevateAffirm = 'true';
          script.src = data.affirmJsUrl || 'https://cdn1.affirm.com/js/v2/affirm.js';
          script.async = true;
          script.onload = launch;
          script.onerror = () => setError('Affirm could not be loaded. Please try again.');
          document.head.appendChild(script);
        }
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Affirm checkout is unavailable.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={openCheckout}
        disabled={disabled || loading}
        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-indigo-700 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Check out with Affirm
      </button>
      {error ? (
        <p className="max-w-64 text-right text-xs font-semibold text-red-700">{error}</p>
      ) : null}
    </div>
  );
}
