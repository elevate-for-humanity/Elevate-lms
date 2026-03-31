'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Shield, Loader2, AlertCircle, CreditCard } from 'lucide-react';
import { ACTIVE_BNPL_PROVIDERS, getProvidersForAmount } from '@/lib/bnpl-config';

type PaymentMethod = 'stripe' | 'affirm' | 'sezzle';

interface AddOnCheckoutProps {
  productId: string;
  productName: string;
  productImage: string;
  backHref: string;
  oneTimePrice: number;
  monthlyPrice: number;
  monthlyCount: number;
  accentColor: string; // e.g. 'brand-blue', 'indigo', 'emerald'
  features: string[];
}

function CheckoutForm({
  productId,
  productName,
  productImage,
  backHref,
  oneTimePrice,
  monthlyPrice,
  monthlyCount,
  accentColor,
  features,
}: AddOnCheckoutProps) {
  const searchParams = useSearchParams();
  const plan = searchParams.get('plan');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('stripe');

  const isMonthly = plan === 'monthly';
  const price = isMonthly ? monthlyPrice : oneTimePrice;
  const priceLabel = isMonthly
    ? `$${monthlyPrice.toLocaleString()}/mo × ${monthlyCount}`
    : `$${oneTimePrice.toLocaleString()}`;
  const priceDesc = isMonthly
    ? `${monthlyCount} monthly payments of $${monthlyPrice.toLocaleString()}`
    : 'One-time payment';
  const totalMonthly = monthlyPrice * monthlyCount;

  const bnplProviders = getProvidersForAmount(price);
  const affirmAvailable = bnplProviders.some((p) => p.id === 'affirm');
  const sezzleAvailable = bnplProviders.some((p) => p.id === 'sezzle');

  async function handleCheckout() {
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let endpoint = '/api/store/checkout';
      let body: Record<string, string> = {
        productId: isMonthly ? `${productId}-monthly` : productId,
        email,
      };

      if (paymentMethod === 'affirm') {
        endpoint = '/api/affirm/checkout';
        body = { productId, email, amount: String(price * 100) };
      } else if (paymentMethod === 'sezzle') {
        endpoint = '/api/sezzle/checkout';
        body = { productId, email, amount: String(price * 100) };
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Checkout failed. Please try again.');
        return;
      }

      if (data.url || data.checkout_url) {
        window.location.href = data.url || data.checkout_url;
      } else if (data.config && paymentMethod === 'affirm') {
        // Affirm uses client-side SDK — would need affirm.js loaded
        setError('Affirm checkout requires page reload. Redirecting...');
        window.location.href = `/store/add-ons/${productId}?affirm=true`;
      } else {
        setError('Unable to create checkout session. Please contact support.');
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  const btnBg = `bg-${accentColor}-600`;
  const btnHover = `hover:bg-${accentColor}-700`;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href={backHref} className="text-sm text-gray-500 hover:text-gray-700">
            ← Back to {productName}
          </Link>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Shield className="w-4 h-4" />
            Secure Checkout
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Complete Your Purchase</h1>

            {/* Email */}
            <div className="bg-white rounded-xl border p-6 mb-6">
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@organization.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500 outline-none"
              />
              <p className="text-xs text-gray-500 mt-2">
                Your license and receipt will be sent to this email.
              </p>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-xl border p-6 mb-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">Payment Method</h2>
              <div className="space-y-3">
                {/* Stripe / Card */}
                <label
                  className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition ${
                    paymentMethod === 'stripe'
                      ? 'border-brand-blue-500 bg-brand-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="stripe"
                    checked={paymentMethod === 'stripe'}
                    onChange={() => setPaymentMethod('stripe')}
                    className="sr-only"
                  />
                  <CreditCard className="w-6 h-6 text-gray-700" />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">Credit / Debit Card</div>
                    <div className="text-xs text-gray-500">Visa, Mastercard, Amex via Stripe</div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    paymentMethod === 'stripe' ? 'border-brand-blue-500' : 'border-gray-300'
                  }`}>
                    {paymentMethod === 'stripe' && <div className="w-2.5 h-2.5 rounded-full bg-brand-blue-500" />}
                  </div>
                </label>

                {/* Affirm */}
                {affirmAvailable && (
                  <label
                    className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition ${
                      paymentMethod === 'affirm'
                        ? 'border-brand-blue-500 bg-brand-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="affirm"
                      checked={paymentMethod === 'affirm'}
                      onChange={() => setPaymentMethod('affirm')}
                      className="sr-only"
                    />
                    <div className="w-6 h-6 bg-brand-blue-100 rounded flex items-center justify-center text-xs font-bold text-brand-blue-700">A</div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">Affirm</div>
                      <div className="text-xs text-gray-500">Pay over 3–36 months. As low as 0% APR.</div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === 'affirm' ? 'border-brand-blue-500' : 'border-gray-300'
                    }`}>
                      {paymentMethod === 'affirm' && <div className="w-2.5 h-2.5 rounded-full bg-brand-blue-500" />}
                    </div>
                  </label>
                )}

                {/* Sezzle */}
                {sezzleAvailable && (
                  <label
                    className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition ${
                      paymentMethod === 'sezzle'
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="sezzle"
                      checked={paymentMethod === 'sezzle'}
                      onChange={() => setPaymentMethod('sezzle')}
                      className="sr-only"
                    />
                    <div className="w-6 h-6 bg-purple-100 rounded flex items-center justify-center text-xs font-bold text-purple-700">S</div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">Sezzle</div>
                      <div className="text-xs text-gray-500">4 interest-free payments over 6 weeks</div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === 'sezzle' ? 'border-purple-500' : 'border-gray-300'
                    }`}>
                      {paymentMethod === 'sezzle' && <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />}
                    </div>
                  </label>
                )}
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button
              onClick={handleCheckout}
              disabled={loading}
              className={`w-full ${btnBg} text-white py-4 rounded-lg font-bold text-lg ${btnHover} transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {paymentMethod === 'stripe' && <>Purchase Now — {priceLabel}</>}
                  {paymentMethod === 'affirm' && <>Pay with Affirm — {priceLabel}</>}
                  {paymentMethod === 'sezzle' && <>Pay with Sezzle — 4 × ${Math.round(price / 4).toLocaleString()}</>}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            <p className="text-xs text-gray-500 text-center mt-4">
              {paymentMethod === 'stripe' && "You'll be redirected to Stripe for secure payment."}
              {paymentMethod === 'affirm' && "You'll be redirected to Affirm to complete financing."}
              {paymentMethod === 'sezzle' && "You'll be redirected to Sezzle to set up 4 payments."}
            </p>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border p-6 sticky top-8">
              <h2 className="font-bold text-gray-900 mb-4">Order Summary</h2>

              <div className="flex gap-4 mb-6 pb-6 border-b">
                <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                  <Image src={productImage} alt={productName} fill className="object-cover"  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{productName}</h3>
                  <p className="text-sm text-gray-500">Platform Add-On</p>
                </div>
              </div>

              <div className="space-y-3 mb-6 pb-6 border-b text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Plan</span>
                  <span className="font-medium text-gray-900">{priceDesc}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Access</span>
                  <span className="font-medium text-gray-900">Lifetime</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Updates</span>
                  <span className="font-medium text-gray-900">12 months free</span>
                </div>
                {features.map((f) => (
                  <div key={f} className="flex justify-between">
                    <span className="text-gray-600">{f}</span>
                    <span className="font-medium text-gray-900">Included</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-baseline">
                <span className="font-bold text-gray-900">Total</span>
                <div className="text-right">
                  {paymentMethod === 'sezzle' ? (
                    <>
                      <span className="text-2xl font-black text-gray-900">
                        4 × ${Math.round(price / 4).toLocaleString()}
                      </span>
                      <span className="text-sm text-gray-500 block">
                        ${price.toLocaleString()} total
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-2xl font-black text-gray-900">
                        {isMonthly ? `$${monthlyPrice.toLocaleString()}` : `$${oneTimePrice.toLocaleString()}`}
                      </span>
                      {isMonthly && (
                        <span className="text-sm text-gray-500 block">
                          then ${monthlyPrice.toLocaleString()}/mo × {monthlyCount - 1}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t space-y-2">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Shield className="w-3 h-3" />
                  256-bit SSL encryption
                </div>
                {bnplProviders.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {bnplProviders.map((p) => (
                      <span key={p.id} className={`text-xs px-2 py-0.5 rounded-full ${p.badgeBg} ${p.badgeText}`}>
                        {p.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AddOnCheckout(props: AddOnCheckoutProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-gray-400 animate-spin" />
        </div>
      }
    >
      <CheckoutForm {...props} />
    </Suspense>
  );
}
