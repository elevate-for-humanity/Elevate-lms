"use client";

import React from 'react';

import { useState } from 'react';
import {
  CreditCard,
  Calendar,
  DollarSign,
  Shield,
  AlertCircle,
  Loader2,
  Info,
CheckCircle, } from 'lucide-react';

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
  onError
}: UnifiedPaymentFlowProps) {
  const [paymentType, setPaymentType] = useState<'full' | 'plan'>('full');
  const [selectedMethod, setSelectedMethod] = useState<string>('card');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const monthlyPayment = Math.ceil(price / 4);

  const paymentMethods: PaymentMethod[] = [
    {
      id: 'card',
      name: 'Credit/Debit Card',
      description: 'Pay with any major credit or debit card',
      icon: '💳',
      available: true
    },
    {
      id: 'klarna',
      name: 'Klarna',
      description: '4 interest-free payments',
      icon: '🛍️',
      available: price >= 35 && price <= 1000,
      minAmount: 35,
      maxAmount: 1000
    },
    {
      id: 'zip',
      name: 'Zip',
      description: 'Pay in 4 interest-free installments',
      icon: '💜',
      available: price >= 35 && price <= 1500,
      minAmount: 35,
      maxAmount: 1500
    },
    {
      id: 'afterpay',
      name: 'Afterpay',
      description: '4 interest-free payments',
      icon: '💰',
      available: price >= 35 && price <= 1000,
      minAmount: 35,
      maxAmount: 1000
    },
    {
      id: 'us_bank_account',
      name: 'Bank Account (ACH)',
      description: 'Direct debit from your bank account',
      icon: '🏦',
      available: true
    },
    {
      id: 'cashapp',
      name: 'Cash App',
      description: 'Pay with Cash App',
      icon: '💵',
      available: price <= 7500,
      maxAmount: 7500
    },
    {
      id: 'paypal',
      name: 'PayPal',
      description: 'Pay with your PayPal account',
      icon: '🅿️',
      available: true
    }
  ];

  const handleCheckout = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/programs/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          programId,
          paymentType,
          preferredMethod: selectedMethod
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
        <h2 className="text-2xl font-bold text-black mb-4">
          Choose Your Payment Option
        </h2>

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
              {paymentType === 'full' && (
                <span className="text-slate-500 flex-shrink-0">•</span>
              )}
            </div>
            <h3 className="text-lg font-bold text-black mb-2">
              Pay in Full
            </h3>
            <p className="text-3xl font-bold text-black mb-2">
              ${price.toLocaleString()}
            </p>
            <p className="text-sm text-black">
              One-time payment. Start immediately.
            </p>
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
                {paymentType === 'plan' && (
                  <span className="text-slate-500 flex-shrink-0">•</span>
                )}
              </div>
              <h3 className="text-lg font-bold text-black mb-2">
                Payment Plan
              </h3>
              <p className="text-3xl font-bold text-black mb-2">
                ${monthlyPayment.toLocaleString()}<span className="text-lg text-black">/mo</span>
              </p>
              <p className="text-sm text-black">
                4 monthly payments. Start immediately.
              </p>
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
                  <li>4 monthly payments of ${monthlyPayment.toLocaleString()}</li>
                  <li>Total: ${price.toLocaleString()}</li>
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
        <h2 className="text-2xl font-bold text-black mb-4">
          Select Payment Method
        </h2>

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
                      {method.minAmount && price < method.minAmount &&
                        `Minimum $${method.minAmount} required`}
                      {method.maxAmount && price > method.maxAmount &&
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
        <h2 className="text-2xl font-bold text-black mb-4">
          Order Summary
        </h2>

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
                ${monthlyPayment.toLocaleString()}
              </span>
            </div>
          )}

          <div className="border-t border-slate-200 pt-3 mt-3">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-black">
                {paymentType === 'full' ? 'Total Due Today' : 'First Payment'}
              </span>
              <span className="text-2xl font-bold text-brand-blue-600">
                ${(paymentType === 'full' ? price : monthlyPayment).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-slate-50 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-brand-green-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-black">
            <p className="font-semibold mb-1">Secure Payment Processing</p>
            <p>
              Your payment is processed securely through Stripe. We never store your payment information.
              All transactions are encrypted and PCI-DSS compliant.
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
          <a href="/terms-of-service" className="text-brand-blue-600 hover:underline">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/privacy-policy" className="text-brand-blue-600 hover:underline">
            Privacy Policy
          </a>
        </p>
        <p className="mt-2">
          Need help? Call us at{' '}
          <a href="/support" className="text-brand-blue-600 hover:underline font-semibold">
            support center
          </a>
        </p>
      </div>
    </div>
  );
}
