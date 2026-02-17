"use client";

import React from 'react';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { CreditCard, Lock, Check } from 'lucide-react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface CheckoutFormProps {
  courseId: string;
  courseName: string;
  amount: number;
  currency?: string;
  referralCode?: string;
  onSuccess?: (enrollmentId: string) => void;
}

function PaymentForm({
  courseId,
  courseName,
  amount,
  currency = 'usd',
  referralCode,
  onSuccess,
}: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Confirm payment
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setError(submitError.message || 'Payment failed');
        setIsProcessing(false);
        return;
      }

      // Confirm with backend
      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment/success?course=${courseId}`,
        },
        redirect: 'if_required',
      });

      if (confirmError) {
        setError(confirmError.message || 'Payment failed');
        setIsProcessing(false);
        return;
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Confirm payment on backend
        const response = await fetch('/api/payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'confirm',
            paymentIntentId: paymentIntent.id,
          }),
        });

        const data = await response.json();

        if (data.result.success) {
          setSuccess(true);
          if (onSuccess && data.result.enrollmentId) {
            onSuccess(data.result.enrollmentId);
          }
        }
      }
    } catch (err) {
      setError('Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="w-10 h-10 text-brand-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-black mb-2">
          Payment Successful!
        </h3>
        <p className="text-black mb-6">
          You're now enrolled in {courseName}
        </p>
        <button
          onClick={() => window.location.href = `/courses/${courseId}`}
          className="px-6 py-3 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition-colors"
        >
          Go to Course
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Order Summary */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="font-semibold text-black mb-4">Order Summary</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-black">{courseName}</span>
            <span className="font-semibold text-black">
              ${amount.toFixed(2)}
            </span>
          </div>
          {referralCode && (
            <div className="flex justify-between text-brand-green-600">
              <span>Referral Discount</span>
              <span>Applied</span>
            </div>
          )}
          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>${amount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Element */}
      <div>
        <label className="block text-sm font-medium text-black mb-2">
          Payment Details
        </label>
        <PaymentElement />
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-brand-red-50 border border-brand-red-200 rounded-lg p-4">
          <p className="text-sm text-brand-red-800">{error}</p>
        </div>
      )}

      {/* Security Notice */}
      <div className="flex items-center gap-2 text-sm text-black">
        <Lock className="w-4 h-4" />
        <span>Your payment information is secure and encrypted</span>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            Pay ${amount.toFixed(2)}
          </>
        )}
      </button>

      {/* Terms */}
      <p className="text-xs text-gray-500 text-center">
        By completing this purchase, you agree to our{' '}
        <a href="/terms" className="text-brand-blue-600 hover:underline">
          Terms of Service
        </a>{' '}
        and{' '}
        <a href="/privacy" className="text-brand-blue-600 hover:underline">
          Privacy Policy
        </a>
      </p>
    </form>
  );
}

export default function CheckoutForm(props: CheckoutFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Create payment intent on mount
  useState(() => {
    async function createIntent() {
      try {
        const response = await fetch('/api/payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create-intent',
            courseId: props.courseId,
            amount: props.amount,
            currency: props.currency || 'usd',
            referralCode: props.referralCode,
          }),
        });

        const data = await response.json();
        setClientSecret(data.intent.client_secret);
      } catch (error) { /* Error handled silently */ 
        // Error: $1
      } finally {
        setLoading(false);
      }
    }

    createIntent();
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue-600" />
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="text-center py-12">
        <p className="text-brand-orange-600">Failed to initialize payment. Please try again.</p>
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#2563eb',
          },
        },
      }}
    >
      <PaymentForm {...props} />
    </Elements>
  );
}
