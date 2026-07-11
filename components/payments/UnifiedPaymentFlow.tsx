'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { getProvidersForAmount } from '@/lib/bnpl-config';
import {
  CreditCard,
  Calendar,
  DollarSign,
  Shield,
  AlertCircle,
  Loader2,
  Info,
  CheckCircle,
  Tag,
  X,
  Gift,
} from 'lucide-react';

interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  icon: string;
  available: boolean;
  minAmount?: number;
  maxAmount?: number;
}

interface UnifiedPaymentFlowProps {
  programId: string;
  programName: string;
  programSlug: string;
  price: number;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export default function UnifiedPaymentFlow({
  programId,
  programName,
  programSlug,
  price,
  onSuccess,
  onError,
}: UnifiedPaymentFlowProps) {
  const [paymentType, setPaymentType] = useState<'full' | 'plan'>('full');
  const [selectedMethod, setSelectedMethod] = useState<string>('card');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponError, setCouponError] = useState('');

  const monthlyPayment = Math.ceil(price / 4);
  
  // Calculate discounted price if coupon applied
  const discountAmount = appliedCoupon ? Math.round(price * (appliedCoupon.discount / 100)) : 0;
  const discountedPrice = price - discountAmount;
  const discountedMonthlyPayment = Math.ceil(discountedPrice / 4);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    
    try {
      const res = await fetch('/api/store/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode, amount: discountedPrice * 100 }),
      });
      const data = await res.json();
      
      if (data.valid) {
        setAppliedCoupon({ code: couponCode.toUpperCase(), discount: data.coupon.discount_value });
        setCouponCode('');
      } else {
        setCouponError(data.error || 'Invalid coupon code');
      }
    } catch {
      setCouponError('Failed to validate coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
  };

  // BNPL options derived from bnpl-config — no provider names hardcoded here
  const bnplMethods: PaymentMethod[] = getProvidersForAmount(price).map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    icon: '💳',
    available: true,
    minAmount: p.minAmount,
    maxAmount: p.maxAmount || undefined,
  }));

  const paymentMethods: PaymentMethod[] = [
    {
      id: 'card',
      name: 'Credit/Debit Card',
      description: 'Pay with any major credit or debit card',
      icon: '💳',
      available: true,
    },
    ...bnplMethods,
    {
      id: 'paypal',
      name: 'PayPal',
      description: 'Pay with your PayPal account',
      icon: '🅿️',
      available: true,
    },
  ];

  const handleCheckout = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          programId,
          paymentType,
          preferredMethod: selectedMethod,
          couponCode: appliedCoupon?.code,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err) {
      const errorMessage = 'Payment failed';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Payment Type Selection */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <h2 className="text-2xl font-bold text-black mb-4">Choose Your Payment Option</h2>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Full Payment */}
          <button
            onClick={() => setPaymentType('full')}
            className={`p-6 rounded-lg border-2 transition-all text-left ${
              paymentType === 'full'
                ? 'border-brand-blue-600 bg-brand-blue-50'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 bg-brand-blue-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-brand-blue-600" />
              </div>
              {paymentType === 'full' && <span className="text-slate-500 flex-shrink-0">•</span>}
            </div>
            <h3 className="text-lg font-bold text-black mb-2">Pay in Full</h3>
            <p className="text-3xl font-bold text-black mb-2">${price.toLocaleString('en-US')}</p>
            <p className="text-sm text-black">One-time payment. Start immediately.</p>
          </button>

          {/* Payment Plan */}
          {price >= 500 && (
            <button
              onClick={() => setPaymentType('plan')}
              className={`p-6 rounded-lg border-2 transition-all text-left ${
                paymentType === 'plan'
                  ? 'border-brand-green-600 bg-brand-green-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-brand-green-100 rounded-lg">
                  <Calendar className="w-6 h-6 text-brand-green-600" />
                </div>
                {paymentType === 'plan' && <span className="text-slate-500 flex-shrink-0">•</span>}
              </div>
              <h3 className="text-lg font-bold text-black mb-2">Payment Plan</h3>
              <p className="text-3xl font-bold text-black mb-2">
                ${monthlyPayment.toLocaleString('en-US')}
                <span className="text-lg text-black">/mo</span>
              </p>
              <p className="text-sm text-black">4 monthly payments. Start immediately.</p>
            </button>
          )}
        </div>

        {paymentType === 'plan' && (
          <div className="mt-4 p-4 bg-brand-blue-50 border border-brand-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="w-5 h-5 text-brand-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-brand-blue-900">
                <p className="font-semibold mb-1">Payment Plan Details:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>4 monthly payments of ${monthlyPayment.toLocaleString('en-US')}</li>
                  <li>Total: ${price.toLocaleString('en-US')}</li>
                  <li>No interest or hidden fees</li>
                  <li>Start your program immediately</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Payment Method Selection */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <h2 className="text-2xl font-bold text-black mb-4">Select Payment Method</h2>

        <div className="grid md:grid-cols-2 gap-3">
          {paymentMethods.map((method) => (
            <button
              key={method.id}
              onClick={() => method.available && setSelectedMethod(method.id)}
              disabled={!method.available}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                selectedMethod === method.id
                  ? 'border-brand-blue-600 bg-brand-blue-50'
                  : method.available
                    ? 'border-slate-200 hover:border-slate-300'
                    : 'border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-3xl">{method.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-black">{method.name}</h3>
                    {selectedMethod === method.id && (
                      <span className="text-slate-500 flex-shrink-0">•</span>
                    )}
                  </div>
                  <p className="text-sm text-black">{method.description}</p>
                  {!method.available && (
                    <p className="text-xs text-brand-orange-600 mt-1">
                      {method.minAmount &&
                        price < method.minAmount &&
                        `Minimum $${method.minAmount} required`}
                      {method.maxAmount &&
                        price > method.maxAmount &&
                        `Maximum $${method.maxAmount} allowed`}
                    </p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Order Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <h2 className="text-2xl font-bold text-black mb-4">Order Summary</h2>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-black">Program</span>
            <span className="font-semibold text-black">{programName}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-black">Payment Type</span>
            <span className="font-semibold text-black">
              {paymentType === 'full' ? 'Pay in Full' : '4 Monthly Payments'}
            </span>
          </div>

          {paymentType === 'plan' && (
            <div className="flex justify-between items-center">
              <span className="text-black">Monthly Payment</span>
              <span className="font-semibold text-black">
                ${monthlyPayment.toLocaleString('en-US')}
              </span>
            </div>
          )}

          <div className="border-t border-slate-200 pt-3 mt-3">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-black">
                {paymentType === 'full' ? 'Total Due Today' : 'First Payment'}
              </span>
              <span className="text-2xl font-bold text-brand-blue-600">
                ${(paymentType === 'full' ? discountedPrice : discountedMonthlyPayment).toLocaleString('en-US')}
              </span>
            </div>
            {appliedCoupon && (
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-brand-green-600 font-medium">
                  <Gift className="w-4 h-4 inline mr-1" />
                  {appliedCoupon.discount}% discount applied
                </span>
                <span className="text-sm text-brand-green-600 font-medium">
                  -${discountAmount.toLocaleString('en-US')}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Coupon Code Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <h2 className="text-lg font-bold text-black mb-4 flex items-center gap-2">
          <Tag className="w-5 h-5 text-brand-red-500" />
          Have a Promo Code?
        </h2>
        
        {!appliedCoupon ? (
          <div>
            <div className="flex gap-3">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Enter promo code"
                className="flex-1 px-4 py-3 border border-slate-300 rounded-lg font-mono uppercase focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                disabled={couponLoading}
              />
              <button
                onClick={applyCoupon}
                disabled={!couponCode.trim() || couponLoading}
                className="px-6 py-3 bg-brand-red-600 text-white font-bold rounded-lg hover:bg-brand-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
              >
                {couponLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Apply'
                )}
              </button>
            </div>
            {couponError && (
              <p className="text-sm text-brand-red-600 mt-2">{couponError}</p>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between bg-brand-green-50 border border-brand-green-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-brand-green-600" />
              <div>
                <p className="font-bold text-brand-green-700">{appliedCoupon.code}</p>
                <p className="text-sm text-brand-green-600">{appliedCoupon.discount}% discount applied</p>
              </div>
            </div>
            <button
              onClick={removeCoupon}
              className="p-2 text-brand-green-600 hover:text-brand-green-800 hover:bg-brand-green-100 rounded-lg transition-colors"
              aria-label="Remove coupon"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Security Notice */}
      <div className="bg-slate-50 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-brand-green-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-black">
            <p className="font-semibold mb-1">Secure Payment Processing</p>
            <p>
              Your payment is processed securely through Stripe. We never store your payment
              information. All transactions are encrypted and PCI-DSS compliant.
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-brand-red-50 border border-brand-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-brand-orange-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-brand-red-900">Payment Error</p>
              <p className="text-sm text-brand-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Button */}
      <button
        onClick={handleCheckout}
        disabled={loading}
        className="w-full px-8 py-4 bg-brand-blue-600 text-white font-bold text-lg rounded-lg shadow-lg hover:bg-brand-blue-700 hover:shadow-xl transition-all disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            Proceed to Secure Checkout
          </>
        )}
      </button>

      {/* Additional Info */}
      <div className="mt-6 text-center text-sm text-black">
        <p>
          By proceeding, you agree to our{' '}
          <Link href="/legal" className="text-brand-blue-600 hover:underline">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/legal/privacy" className="text-brand-blue-600 hover:underline">
            Privacy Policy
          </Link>
        </p>
        <p className="mt-2">
          Need help? Call us at{' '}
          <Link href="/support" className="text-brand-blue-600 hover:underline font-semibold">
            support center
          </Link>
        </p>
      </div>
    </div>
  );
}
