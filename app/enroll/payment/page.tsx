'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, CreditCard, Calendar, Loader2, AlertCircle } from 'lucide-react';
import { BARBER_PRICING } from '@/lib/programs/pricing';

// Pricing derived from canonical source
const PRICING = {
  full: {
    amount: BARBER_PRICING.fullPrice,
    label: 'Full Payment',
    description: 'Pay in full today',
    savings: 'Best value',
  },
  deposit: {
    amount: BARBER_PRICING.setupFee,
    label: 'Deposit',
    description: `$${BARBER_PRICING.setupFee.toLocaleString()} now, balance paid weekly during training`,
    savings: 'Reserve your spot',
  },
  installment: {
    amount: BARBER_PRICING.fullPrice,
    label: 'Payment Plan',
    description: 'Split into weekly payments',
    savings: 'Flexible payments',
  },
};

type PaymentOption = 'full' | 'deposit' | 'installment';

function EnrollPaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const applicationId = searchParams.get('application_id');
  const canceled = searchParams.get('canceled');

  const [selectedOption, setSelectedOption] = useState<PaymentOption>('deposit');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(true);
  const [applicationValid, setApplicationValid] = useState(false);

  // Verify application exists before showing payment options
  useEffect(() => {
    async function verifyApplication() {
      if (!applicationId) {
        setError('No application found. Please apply first.');
        setVerifying(false);
        return;
      }

      try {
        const res = await fetch(`/api/applications/${applicationId}/verify`);
        if (res.ok) {
          setApplicationValid(true);
        } else {
          setError('Application not found or not eligible for payment. Please apply first.');
        }
      } catch {
        // If verification endpoint doesn't exist, allow proceeding
        setApplicationValid(true);
      }
      setVerifying(false);
    }

    verifyApplication();
  }, [applicationId]);

  const handlePayment = async () => {
    if (!applicationId) {
      setError('No application found. Please apply first.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/apprenticeship/enroll/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application_id: applicationId,
          payment_option: selectedOption,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      window.location.href = data.checkout_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed. Please try again.');
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Verifying your application...</p>
        </div>
      </div>
    );
  }

  if (!applicationId || !applicationValid) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Enroll</h1>
          <p className="text-gray-600 mb-6">
            To enroll in the Barber Apprenticeship Program, start by submitting an application. Payment happens after your application is reviewed.
          </p>
          <Link
            href="/programs/barber-apprenticeship/apply"
            className="inline-flex items-center justify-center w-full px-6 py-3 bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-semibold rounded-lg transition"
          >
            Start Application
          </Link>
          <Link
            href="/programs"
            className="block mt-3 text-sm text-gray-500 hover:text-gray-700"
          >
            View all programs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Enroll
          </h1>
          <p className="text-gray-600">
            Barber Apprenticeship Program — choose a payment option to secure your spot.
          </p>
        </div>

        {/* Canceled notice */}
        {canceled && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <p className="text-amber-800 text-sm">
              Payment was canceled. You can try again when you're ready.
            </p>
          </div>
        )}

        {/* Critical messaging */}
        <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-xl p-6 mb-8">
          <p className="text-brand-blue-900 font-medium text-center">
            Payment secures your enrollment. Training access unlocks after approval and shop assignment.
          </p>
        </div>

        {/* Payment Options */}
        <div className="space-y-4 mb-8">
          {/* Full Payment */}
          <button
            onClick={() => setSelectedOption('full')}
            className={`w-full p-6 rounded-xl border-2 text-left transition ${
              selectedOption === 'full'
                ? 'border-brand-blue-600 bg-brand-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  selectedOption === 'full' ? 'border-brand-blue-600 bg-brand-blue-600' : 'border-gray-300'
                }`}>
                  {selectedOption === 'full' && <CheckCircle className="w-4 h-4 text-white" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-gray-600" />
                    <span className="font-semibold text-gray-900">{PRICING.full.label}</span>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      {PRICING.full.savings}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mt-1">{PRICING.full.description}</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-gray-900">
                ${PRICING.full.amount.toLocaleString()}
              </span>
            </div>
          </button>

          {/* Deposit */}
          <button
            onClick={() => setSelectedOption('deposit')}
            className={`w-full p-6 rounded-xl border-2 text-left transition ${
              selectedOption === 'deposit'
                ? 'border-brand-blue-600 bg-brand-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  selectedOption === 'deposit' ? 'border-brand-blue-600 bg-brand-blue-600' : 'border-gray-300'
                }`}>
                  {selectedOption === 'deposit' && <CheckCircle className="w-4 h-4 text-white" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-gray-600" />
                    <span className="font-semibold text-gray-900">{PRICING.deposit.label}</span>
                    <span className="text-xs bg-brand-blue-100 text-brand-blue-700 px-2 py-0.5 rounded-full">
                      {PRICING.deposit.savings}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mt-1">{PRICING.deposit.description}</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-gray-900">
                ${PRICING.deposit.amount.toLocaleString()}
              </span>
            </div>
          </button>

          {/* Installments */}
          <button
            onClick={() => setSelectedOption('installment')}
            className={`w-full p-6 rounded-xl border-2 text-left transition ${
              selectedOption === 'installment'
                ? 'border-brand-blue-600 bg-brand-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  selectedOption === 'installment' ? 'border-brand-blue-600 bg-brand-blue-600' : 'border-gray-300'
                }`}>
                  {selectedOption === 'installment' && <CheckCircle className="w-4 h-4 text-white" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-gray-600" />
                    <span className="font-semibold text-gray-900">{PRICING.installment.label}</span>
                    <span className="text-xs bg-brand-blue-100 text-brand-blue-700 px-2 py-0.5 rounded-full">
                      {PRICING.installment.savings}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mt-1">{PRICING.installment.description}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-gray-900">
                  ${PRICING.installment.amount.toLocaleString()}
                </span>
                <p className="text-xs text-gray-500">total</p>
              </div>
            </div>
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Submit button */}
        <button
          onClick={handlePayment}
          disabled={loading}
          className="w-full py-4 bg-brand-blue-600 hover:bg-brand-blue-700 disabled:bg-brand-blue-400 text-white font-bold text-lg rounded-xl transition flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              Continue to Payment
            </>
          )}
        </button>

        {/* Agreement checkbox would go here in production */}
        <p className="text-center text-gray-500 text-sm mt-4">
          By continuing, you agree to the enrollment terms and conditions.
        </p>

        {/* What happens next */}
        <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">What happens after payment?</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm font-bold">✓</span>
              <span className="text-gray-700">Enrollment confirmed</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-sm">⏳</span>
              <span className="text-gray-700">Shop assignment (1-2 weeks)</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-sm">⏳</span>
              <span className="text-gray-700">Compliance approval</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-sm">🔒</span>
              <span className="text-gray-500">Training access unlocks after approval</span>
            </div>
          </div>
        </div>

        {/* Contact */}
        <p className="text-center text-gray-500 text-sm mt-6">
          Questions? <a href="/faq" className="text-brand-blue-600 underline">Check our FAQ</a> or <a href="/support" className="text-brand-blue-600 underline">contact support</a>
        </p>
      </div>
    </div>
  );
}

export default function EnrollPaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-blue-600" />
      </div>
    }>
      <EnrollPaymentContent />
    </Suspense>
  );
}
