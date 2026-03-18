"use client";

import React from 'react';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface Program {
  id: string;
  name: string;
  price: number;
  isFree: boolean;
  requirements?: string[];
  duration?: string;
  description?: string;
}

interface ProgramEnrollmentProps {
  program: Program;
  userId: string;
  onEnrollmentComplete: (enrollmentId: string) => void;
}

export default function ProgramEnrollment({ program, userId, onEnrollmentComplete }: ProgramEnrollmentProps) {
  const [selectedPaymentPlan, setSelectedPaymentPlan] = useState<'full' | 'installments'>('full');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meetsRequirements, setMeetsRequirements] = useState(false);
  const [showRequirementsCheck, setShowRequirementsCheck] = useState(false);

  // Calculate payment plans
  const fullPrice = program.price;
  const installmentCount = 4; // 4 monthly payments
  const installmentPrice = Math.ceil(fullPrice / installmentCount);
  const totalWithInstallments = installmentPrice * installmentCount;

  const handleEnrollment = async () => {
    setLoading(true);
    setError(null);

    try {
      // Check if requirements are met (if program has requirements)
      if (program.requirements && program.requirements.length > 0 && !meetsRequirements) {
        setShowRequirementsCheck(true);
        setLoading(false);
        return;
      }

      // For free programs, enroll directly
      if (program.isFree || program.price === 0) {
        const response = await fetch('/api/enroll', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            programId: program.id,
            userId,
            paymentStatus: 'free',
          }),
        });

        const { enrollmentId, error: enrollError } = await response.json();

        if (enrollError) {
          throw new Error(enrollError);
        }

        onEnrollmentComplete(enrollmentId);
        return;
      }

      // For paid programs, redirect to Stripe Checkout
      const response = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programId: program.id,
          programName: program.name,
          userId,
          paymentPlan: selectedPaymentPlan,
          amount: selectedPaymentPlan === 'full' ? fullPrice : installmentPrice,
          installments: selectedPaymentPlan === 'installments' ? installmentCount : 1,
        }),
      });

      const { sessionId, error: sessionError } = await response.json();

      if (sessionError) {
        throw new Error(sessionError);
      }

      // Redirect to Stripe Checkout
      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe failed to load');

      const { error: stripeError } = await stripe.redirectToCheckout({ sessionId });

      if (stripeError) {
        throw new Error(stripeError.message);
      }

    } catch (data: any) {
      setError('Enrollment failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      {/* Program Header */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-black mb-2">{program.name}</h2>
        {program.description && (
          <p className="text-black">{program.description}</p>
        )}
        {program.duration && (
          <p className="text-sm text-slate-500 mt-2">Duration: {program.duration}</p>
        )}
      </div>

      {/* Requirements Check */}
      {program.requirements && program.requirements.length > 0 && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-900 mb-2">Program Requirements</h3>
          <ul className="list-disc pl-5 space-y-1 text-sm text-yellow-800 mb-3">
            {program.requirements.map((req, index) => (
              <li key={index}>{req}</li>
            ))}
          </ul>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={meetsRequirements}
              onChange={(e) => setMeetsRequirements(e.target.checked)}
              className="w-4 h-4 text-brand-blue-600 rounded focus:ring-brand-blue-500"
            />
            <span className="text-sm text-yellow-900">
              I confirm that I meet all the requirements listed above
            </span>
          </label>
        </div>
      )}

      {/* Pricing Section */}
      <div className="mb-6">
        {program.isFree || program.price === 0 ? (
          <div className="bg-brand-green-50 border-2 border-brand-green-500 rounded-lg p-6 text-center">
            <p className="text-4xl font-bold text-brand-green-700 mb-2 text-2xl md:text-3xl lg:text-4xl">FREE</p>
            <p className="text-brand-green-600">No payment required</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Full Payment Option */}
            <div
              onClick={() => setSelectedPaymentPlan('full')}
              className={`border-2 rounded-lg p-4 cursor-pointer transition ${
                selectedPaymentPlan === 'full'
                  ? 'border-brand-blue-500 bg-brand-blue-50'
                  : 'border-slate-300 hover:border-gray-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    checked={selectedPaymentPlan === 'full'}
                    onChange={() => setSelectedPaymentPlan('full')}
                    className="w-4 h-4 text-brand-blue-600"
                  />
                  <div>
                    <p className="font-semibold text-black">Pay in Full</p>
                    <p className="text-sm text-black">One-time payment</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-black">${fullPrice}</p>
                  <p className="text-sm text-brand-green-600">Best Value</p>
                </div>
              </div>
            </div>

            {/* Installment Payment Option */}
            <div
              onClick={() => setSelectedPaymentPlan('installments')}
              className={`border-2 rounded-lg p-4 cursor-pointer transition ${
                selectedPaymentPlan === 'installments'
                  ? 'border-brand-blue-500 bg-brand-blue-50'
                  : 'border-slate-300 hover:border-gray-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    checked={selectedPaymentPlan === 'installments'}
                    onChange={() => setSelectedPaymentPlan('installments')}
                    className="w-4 h-4 text-brand-blue-600"
                  />
                  <div>
                    <p className="font-semibold text-black">Payment Plan</p>
                    <p className="text-sm text-black">
                      {installmentCount} monthly payments of ${installmentPrice}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-black">${installmentPrice}</p>
                  <p className="text-xs text-slate-500">per month</p>
                  <p className="text-xs text-slate-500">Total: ${totalWithInstallments}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* What's Included */}
      <div className="mb-6 bg-slate-50 rounded-lg p-4">
        <h3 className="font-semibold text-black mb-3">What's Included:</h3>
        <ul className="space-y-2">
          <li className="flex items-start">
            <svg className="w-5 h-5 text-brand-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-black">Full course access</span>
          </li>
          <li className="flex items-start">
            <svg className="w-5 h-5 text-brand-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-black">Certificate upon completion</span>
          </li>
          <li className="flex items-start">
            <svg className="w-5 h-5 text-brand-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-black">Instructor support</span>
          </li>
          <li className="flex items-start">
            <svg className="w-5 h-5 text-brand-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-black">Downloadable resources</span>
          </li>
          {!program.isFree && program.price > 0 && (
            <li className="flex items-start">
              <svg className="w-5 h-5 text-brand-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-black">30-day money-back guarantee</span>
            </li>
          )}
        </ul>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 bg-brand-red-50 border border-brand-red-200 text-brand-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Requirements Warning */}
      {showRequirementsCheck && !meetsRequirements && (
        <div className="mb-4 bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
          Please confirm that you meet all program requirements before enrolling.
        </div>
      )}

      {/* Enroll Button */}
      <button
        onClick={handleEnrollment}
        disabled={loading || (program.requirements && program.requirements.length > 0 && !meetsRequirements)}
        className="w-full bg-brand-blue-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-brand-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none"
viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12"
r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Processing...</span>
          </>
        ) : (
          <>
            {program.isFree || program.price === 0 ? (
              <span>Enroll Now - Free</span>
            ) : (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                  <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                </svg>
                <span>
                  {selectedPaymentPlan === 'full'
                    ? `Pay $${fullPrice} - Enroll Now`
                    : `Start with $${installmentPrice}/month`
                  }
                </span>
              </>
            )}
          </>
        )}
      </button>

      {/* Payment Security */}
      {!program.isFree && program.price > 0 && (
        <div className="mt-4 flex items-center justify-center space-x-2 text-sm text-slate-500">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          <span>Secure payment powered by Stripe</span>
        </div>
      )}

      {/* Additional Info */}
      <div className="mt-6 pt-6 border-t border-slate-200">
        <div className="grid grid-cols-2 gap-4 text-sm text-black">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            <span>Start immediately</span>
          </div>
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
            </svg>
            <span>Self-paced learning</span>
          </div>
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Certificate included</span>
          </div>
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            <span>Support available</span>
          </div>
        </div>
      </div>
    </div>
  );
}
