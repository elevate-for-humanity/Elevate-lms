'use client';

import Image from 'next/image';
import { logger } from '@/lib/logger';
import React from 'react';
import { BNPL_CHECKOUT_LABEL } from '@/lib/bnpl-config';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
// Product data fetched from /api/store/products/:slug (DB-backed with hardcoded fallback)
import { ArrowLeft, Lock, AlertCircle } from 'lucide-react';
import Link from 'next/link';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

interface StoreProduct {
  id: string;
  slug: string;
  name: string;
  price: number;
  features: string[];
}

interface CustomerInfo {
  name?: string;
  email: string;
  organization?: string;
  organizationName?: string;
  contactName?: string;
  phone?: string;
}

function CheckoutForm({
  product,
  customerInfo,
}: {
  product: StoreProduct;
  customerInfo: CustomerInfo;
}) {
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
        return_url: `${window.location.origin}/store/licensing/success?product=${product.slug}`,
      },
    });

    if (submitError) {
      setError(submitError.message || 'Payment failed');
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px]">
        <Image src="/images/heroes-hq/programs-hero.jpg" alt="Elevate store" fill sizes="100vw" className="object-cover" priority />
      </section>
      <PaymentElement />

      {error && (
        <div className="bg-brand-red-50 border border-brand-red-200 text-brand-red-700 px-4 py-3 rounded flex items-start gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full bg-brand-green-600 hover:bg-brand-green-700 text-white font-bold py-4 rounded-lg transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {processing ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            Processing...
          </>
        ) : (
          <>
            <Lock size={20} />
            Complete Purchase - ${(product.price / 100).toLocaleString()}
          </>
        )}
      </button>

      <div className="space-y-2 mt-2">
        <p className="text-xs text-center text-gray-600">
          Secure payment powered by Stripe. Card and {BNPL_CHECKOUT_LABEL}.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1"><Lock size={12} /> SSL Encrypted</span>
          <span>•</span>
          <span>Cancel anytime</span>
          <span>•</span>
          <span>Data export on cancellation</span>
        </div>
      </div>

      {/* Inline terms summary */}
      <div className="mt-4 bg-slate-50 rounded-lg p-4 text-xs text-slate-500 space-y-1">
        <p><strong className="text-slate-700">License terms:</strong> Month-to-month after initial purchase. Cancel anytime with 30-day notice.</p>
        <p><strong className="text-slate-700">Data ownership:</strong> You own your data. Full export (CSV + JSON) available at any time.</p>
        <p><strong className="text-slate-700">Onboarding:</strong> Included in setup fee. Your branded instance launches within 2 weeks.</p>
      </div>
    </form>
  );
}



export default function LicenseCheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [customerInfo, setCustomerInfo] = useState({
    organizationName: '',
    contactName: '',
    email: '',
    phone: '',
  });
  const [step, setStep] = useState<'info' | 'payment'>('info');

  useEffect(() => {
    const slug = params.slug as string;
    fetch(`/api/store/products/${encodeURIComponent(slug)}`)
      .then(res => {
        if (!res.ok) throw new Error('not found');
        return res.json();
      })
      .then(data => {
        setProduct(data.product);
        setLoading(false);
      })
      .catch(() => {
        router.push(`/store/licensing?reason=invalid-product&from=/store/licensing/checkout/${slug}`);
      });
  }, [params.slug, router]);

  const handleInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Create payment intent
    try {
      const response = await fetch(
        '/api/store/licenses/create-payment-intent',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: product.id,
            customerInfo,
          }),
        }
      );

      const data = await response.json();

      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        setStep('payment');
      } else {
        alert('Failed to create payment intent');
      }
    } catch (err) {
      logger.error('Error creating payment intent:', err instanceof Error ? err : new Error(String(err)));
      alert('Failed to process request');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green-600" />
      </div>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <Link
          href="/store/licensing"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8"
        >
          <ArrowLeft size={20} />
          Back to Licenses
        </Link>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Order Summary
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <h3 className="font-bold text-gray-900">{product.name}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {product.description}
                </p>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">License Type</span>
                  <span className="font-semibold text-gray-900 capitalize">
                    {product.licenseType}
                  </span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Billing</span>
                  <span className="font-semibold text-gray-900 capitalize">
                    {product.billingType === 'one_time'
                      ? 'One-time'
                      : 'Monthly'}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between items-baseline">
                  <span className="text-lg font-semibold text-gray-900">
                    Total
                  </span>
                  <span className="text-3xl font-black text-gray-900">
                    ${(product.price / 100).toLocaleString()}
                  </span>
                </div>
                {product.billingType === 'subscription' && (
                  <p className="text-sm text-gray-600 text-right mt-1">
                    per month (${((product.price / 100) * 12).toLocaleString()}/year)
                  </p>
                )}
                <p className="text-xs text-slate-400 text-right mt-2">
                  {BNPL_CHECKOUT_LABEL} — options available below
                </p>
              </div>
            </div>

            <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <span className="text-slate-400 flex-shrink-0">•</span>
                <div className="text-sm text-brand-blue-900">
                  <p className="font-semibold mb-1">What happens next:</p>
                  <ul className="space-y-1 text-brand-blue-800">
                    <li>1. Complete payment</li>
                    <li>2. Receive license key via email</li>
                    <li>3. Access setup instructions</li>
                    <li>4. Deploy your platform</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Checkout Form */}
          <div className="bg-white rounded-xl shadow-sm p-8">
            {step === 'info' ? (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Organization Information
                </h2>

                <form onSubmit={handleInfoSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Organization Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={customerInfo.organizationName}
                      onChange={(e) =>
                        setCustomerInfo({
                          ...customerInfo,
                          organizationName: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green-600 focus:border-transparent"
                      placeholder="Your Organization"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Contact Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={customerInfo.contactName}
                      onChange={(e) =>
                        setCustomerInfo({
                          ...customerInfo,
                          contactName: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green-600 focus:border-transparent"
                      placeholder="Full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={customerInfo.email}
                      onChange={(e) =>
                        setCustomerInfo({
                          ...customerInfo,
                          email: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green-600 focus:border-transparent"
                      placeholder="john@organization.org"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={customerInfo.phone}
                      onChange={(e) =>
                        setCustomerInfo({
                          ...customerInfo,
                          phone: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green-600 focus:border-transparent"
                      placeholder="(317) 314-3757"
                    />
                  </div>

                  {product.requiresApproval && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-sm text-yellow-900">
                        <strong>Note:</strong> This license requires approval.
                        We'll review your application and contact you within 1-2
                        business days.
                      </p>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-brand-green-600 hover:bg-brand-green-700 text-white font-bold py-4 rounded-lg transition"
                  >
                    Continue to Payment
                  </button>
                </form>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Payment Information
                </h2>

                {clientSecret && (
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <CheckoutForm
                      product={product}
                      customerInfo={customerInfo}
                    />
                  </Elements>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
