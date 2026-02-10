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
import { getProductBySlug } from '@/app/data/store-products';
import { ArrowLeft, Lock, CheckCircle, AlertCircle } from 'lucide-react';
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
        return_url: `${window.location.origin}/store/licenses/success?product=${product.slug}`,
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
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-start gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full bg-brand-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-lg transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

      <p className="text-xs text-center text-gray-600">
        Secure payment powered by Stripe. Your payment information is encrypted
        and secure.
      </p>
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
    const foundProduct = getProductBySlug(slug);

    if (!foundProduct) {
      router.push(`/store/licenses?reason=invalid-product&from=/store/licenses/checkout/${slug}`);
      return;
    }

    setProduct(foundProduct);
    setLoading(false);
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
          href="/store/licenses"
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
                    per month
                  </p>
                )}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-semibold mb-1">What happens next:</p>
                  <ul className="space-y-1 text-blue-800">
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
                    className="w-full bg-brand-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-lg transition"
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
