"use client";

import React from 'react';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface CheckoutFlowProps {
  courseId: string;
  courseName: string;
  price: number;
  userId: string;
  onSuccess: (enrollmentId: string) => void;
}

function CheckoutForm({ courseId, courseName, price, userId, onSuccess }: CheckoutFlowProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1); // 1: Review, 2: Payment, 3: Confirmation

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    try {
      // Create payment intent
      const response = await fetch('/api/checkout/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          amount: price * 100, // Convert to cents
          userId,
        }),
      });

      const { clientSecret, error: apiError } = await response.json();

      if (apiError) {
        throw new Error(apiError);
      }

      // Confirm payment
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error('Card element not found');

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
          },
        }
      );

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      if (paymentIntent?.status === 'succeeded') {
        // Complete enrollment
        const enrollResponse = await fetch('/api/enroll', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courseId,
            paymentIntentId: paymentIntent.id,
            paymentStatus: 'completed',
          }),
        });

        const { enrollmentId } = await enrollResponse.json();
        setStep(3);
        onSuccess(enrollmentId);
      }
    } catch (data: any) {
      setError('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className={`flex items-center ${step >= 1 ? 'text-brand-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-brand-blue-600 text-white' : 'bg-gray-300'}`}>
              1
            </div>
            <span className="ml-2 font-medium">Review</span>
          </div>
          <div className="flex-1 h-1 mx-4 bg-gray-300">
            <div className={`h-full ${step >= 2 ? 'bg-brand-blue-600' : 'bg-gray-300'}`} style={{ width: step >= 2 ? '100%' : '0%' }} />
          </div>
          <div className={`flex items-center ${step >= 2 ? 'text-brand-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-brand-blue-600 text-white' : 'bg-gray-300'}`}>
              2
            </div>
            <span className="ml-2 font-medium">Payment</span>
          </div>
          <div className="flex-1 h-1 mx-4 bg-gray-300">
            <div className={`h-full ${step >= 3 ? 'bg-brand-blue-600' : 'bg-gray-300'}`} style={{ width: step >= 3 ? '100%' : '0%' }} />
          </div>
          <div className={`flex items-center ${step >= 3 ? 'text-brand-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-brand-blue-600 text-white' : 'bg-gray-300'}`}>
              3
            </div>
            <span className="ml-2 font-medium">Complete</span>
          </div>
        </div>
      </div>

      {/* Step 1: Review Order */}
      {step === 1 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6">Review Your Order</h2>

          <div className="border-b pb-4 mb-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-semibold text-lg">{courseName}</h3>
                <p className="text-black text-sm">Lifetime access</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">${price}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-black">
              <span>Subtotal</span>
              <span>${price}</span>
            </div>
            <div className="flex justify-between text-black">
              <span>Tax</span>
              <span>$0.00</span>
            </div>
            <div className="flex justify-between text-xl font-bold border-t pt-2">
              <span>Total</span>
              <span>${price}</span>
            </div>
          </div>

          <div className="bg-brand-green-50 border border-brand-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-brand-green-600 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-semibold text-brand-green-900">30-Day Money-Back Guarantee</p>
                <p className="text-sm text-brand-green-700">Not satisfied? Get a full refund within 30 days.</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setStep(2)}
            className="w-full bg-brand-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-brand-blue-700 transition"
          >
            Continue to Payment
          </button>
        </div>
      )}

      {/* Step 2: Payment */}
      {step === 2 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6">Payment Information</h2>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-black mb-2">
                Card Details
              </label>
              <div className="border border-gray-300 rounded-lg p-4">
                <CardElement
                  options={{
                    style: {
                      base: {
                        fontSize: '16px',
                        color: '#424770',
                        '::Content': {
                          color: '#aab7c4',
                        },
                      },
                      invalid: {
                        color: '#9e2146',
                      },
                    },
                  }}
                />
              </div>
            </div>

            {error && (
              <div className="mb-4 bg-brand-red-50 border border-brand-red-200 text-brand-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <div className="flex items-center text-sm text-black">
                <svg className="w-5 h-5 text-gray-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <span>Your payment information is secure and encrypted</span>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 bg-gray-200 text-black py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
                disabled={loading}
              >
                Back
              </button>
              <button
                type="submit"
                disabled={!stripe || loading}
                className="flex-1 bg-brand-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-brand-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : `Pay $${price}`}
              </button>
            </div>
          </form>

          <div className="mt-6 flex items-center justify-center space-x-4 text-gray-400">
            <svg className="w-10 h-6" viewBox="0 0 38 24" fill="none">
              <rect width="38" height="24" rx="3"
fill="#1434CB"/>
              <path d="M13.5 8.5h11v7h-11z" fill="#FF5F00"/>
              <path d="M14.5 12a4.5 4.5 0 014.5-4.5 4.5 4.5 0 00-3 1.7 4.5 4.5 0 000 5.6 4.5 4.5 0 003 1.7 4.5 4.5 0 01-4.5-4.5z" fill="#EB001B"/>
              <path d="M23.5 12a4.5 4.5 0 01-3 4.2 4.5 4.5 0 000-8.4 4.5 4.5 0 013 4.2z" fill="#F79E1B"/>
            </svg>
            <svg className="w-10 h-6" viewBox="0 0 38 24" fill="none">
              <rect width="38" height="24" rx="3"
fill="#0066B2"/>
              <path d="M15 12l-3 6h2l.5-1h3l.5 1h2l-3-6h-2zm.5 3.5l1-2 1 2h-2z" fill="white"/>
            </svg>
            <span className="text-sm">Secure payment powered by Stripe</span>
          </div>
        </div>
      )}

      {/* Step 3: Confirmation */}
      {step === 3 && (
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-brand-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>

          <h2 className="text-3xl font-bold text-black mb-2">
            Enrollment Complete!
          </h2>
          <p className="text-black mb-6">
            You're now enrolled in {courseName}
          </p>

          <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-brand-blue-900">
              A confirmation email has been sent to your inbox with course access details.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => window.location.href = `/student/courses/${courseId}`}
              className="w-full bg-brand-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-brand-blue-700 transition"
            >
              Start Learning Now
            </button>
            <button
              onClick={() => window.location.href = '/student/dashboard'}
              className="w-full bg-gray-200 text-black py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CheckoutFlow(props: CheckoutFlowProps) {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm {...props} />
    </Elements>
  );
}
