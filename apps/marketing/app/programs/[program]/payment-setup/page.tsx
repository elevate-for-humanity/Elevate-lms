'use client';

// This file is intentionally a client component — Stripe Elements requires browser APIs.
// Program config is passed via searchParams; no server fetch needed.

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Loader2 } from 'lucide-react';
import { getBeautyProgram, colorClasses } from '@/lib/programs/beauty-programs';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function PaymentForm({ slug, color }: { slug: string; color: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const c = colorClasses(color);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/programs/${slug}/confirm`,
      },
    });
    if (stripeError) {
      setError(stripeError.message ?? 'Payment failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={loading || !stripe}
        className={`w-full py-3 ${c.bg} ${c.hover} text-white font-bold rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2`}
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
        ) : (
          'Complete Payment'
        )}
      </button>
    </form>
  );
}

export default function BeautyPaymentSetupPage() {
  const params = useParams<{ program: string }>();
  const router = useRouter();
  const cfg = getBeautyProgram(params.program);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (!cfg) return;
    fetch('/api/stripe/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ program: cfg.slug, amount: cfg.depositCents }),
    })
      .then(r => r.json())
      .then(d => {
        if (d.clientSecret) setClientSecret(d.clientSecret);
        else setFetchError('Unable to initialize payment. Please call (317) 314-3757.');
      })
      .catch(() => setFetchError('Unable to initialize payment. Please call (317) 314-3757.'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg?.slug]);

  if (!cfg) {
    router.replace(`/programs/${params.program}`);
    return null;
  }

  const c = colorClasses(cfg.color);
  const depositDollars = (cfg.depositCents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  if (fetchError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <p className="text-red-600 font-bold mb-2">Payment setup failed</p>
          <p className="text-slate-600 text-sm">{fetchError}</p>
        </div>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className={`w-8 h-8 animate-spin ${c.spinner}`} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-slate-900 mb-2">Complete Your Payment</h1>
          <p className="text-slate-600 text-sm">
            {cfg.title} — {depositDollars} deposit to secure your spot.
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <PaymentForm slug={cfg.slug} color={cfg.color} />
          </Elements>
        </div>
      </div>
    </div>
  );
}
