'use client';

import { logger } from '@/lib/logger';
import React from 'react';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { getDigitalProduct } from '@/lib/store/digital-products';
import { ArrowLeft, Lock, CheckCircle } from 'lucide-react';
import Link from 'next/link';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

function CheckoutForm({ product }: { product: any }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/store/success?product=${product.slug}`,
      },
    });

    if (submitError) {
      setError(submitError.message || 'Payment failed');
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full bg-brand-orange-600 hover:bg-brand-orange-700 text-white font-bold py-4 rounded-lg transition disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {processing ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            Processing...
          </>
        ) : (
          <>
            <Lock size={20} />
            Pay {product.priceDisplay}
          </>
        )}
      </button>

      <p className="text-xs text-center text-slate-600">
        Secure payment powered by Stripe. Your payment information is encrypted
        and secure.
      </p>
    </form>
  );
}




export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [product, setProduct] = useState<{
    id: string;
    slug: string;
    name: string;
    price: number;
    priceDisplay: string;
    features: string[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const slug = params.slug as string;
    const foundProduct = getDigitalProduct(slug);

    if (!foundProduct) {
      router.push('/store');
      return;
    }

    setProduct(foundProduct);

    // Create payment intent
    fetch('/api/store/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: foundProduct.id,
        amount: foundProduct.price,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        setClientSecret(data.clientSecret);
        setLoading(false);
      })
      .catch((err) => {
        logger.error('Error creating payment intent:', err);
        setLoading(false);
      });
  }, [params.slug, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (!product || !clientSecret) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 mb-4">Unable to load checkout</p>
          <Link
            href="/store"
            aria-label="Link"
            className="text-brand-orange-600 hover:underline"
          >
            Return to store
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-4xl mx-auto px-6">
        {/* Back Link */}
        <Link
          href="/store"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft size={20} />
          Back to Store
        </Link>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-6">Checkout</h1>

            <div className="bg-white rounded-lg p-6 border border-slate-200">
              <h2 className="font-bold text-slate-900 mb-4">Order Summary</h2>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-slate-700">{product.name}</span>
                  <span className="font-bold text-slate-900">
                    {product.priceDisplay}
                  </span>
                </div>

                <div className="border-t border-slate-200 pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-brand-orange-600">
                      {product.priceDisplay}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <h3 className="font-semibold text-slate-900 text-sm">
                  What's Included:
                </h3>
                {product.features.map((feature: string, index: number) => (
                  <div key={index} className="flex items-start gap-2">
                    <CheckCircle
                      className="text-brand-green-600 flex-shrink-0 mt-0.5"
                      size={16}
                    />
                    <span className="text-sm text-slate-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div>
            <div className="bg-white rounded-lg p-6 border border-slate-200">
              <h2 className="font-bold text-slate-900 mb-6">Payment Details</h2>

              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: 'stripe',
                    variables: {
                      colorPrimary: '#ea580c',
                    },
                  },
                }}
              >
                <CheckoutForm product={product} />
              </Elements>
            </div>

            {/* Security Badges */}
            <div className="mt-6 flex items-center justify-center gap-4 text-xs text-slate-600">
              <div className="flex items-center gap-1">
                <Lock size={14} />
                <span>Secure Checkout</span>
              </div>
              <span>•</span>
              <span>256-bit SSL Encrypted</span>
              <span>•</span>
              <span>PCI Compliant</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
