'use client';

import { useState, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, CreditCard, Lightbulb } from 'lucide-react';

interface ProgramPricing {
  name: string;
  price: number;
  duration: string;
  description: string;
}

const programPricing: Record<string, ProgramPricing> = {
  'barber-apprenticeship': {
    name: 'Barber Training Program (Indiana)',
    price: 4980,
    duration: '15-18 months',
    description:
      'Fee-based apprenticeship-aligned training with DOL sponsorship and Milady theory instruction',
  },
  'hvac-technician': {
    name: 'HVAC Technician',
    price: 3500,
    duration: '16-24 weeks',
    description: 'EPA certification and hands-on HVAC training',
  },
  'cna-certification': {
    name: 'CNA Certification',
    price: 1200,
    duration: '4-8 weeks',
    description: 'State-approved CNA training with clinical hours',
  },
};

function CheckoutPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const program = params.program as string;
  const applicationId = searchParams.get('applicationId');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const programData = programPricing[program];

  const handleStripeCheckout = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          programName: programData.name,
          programSlug: program,
          price: programData.price,
          paymentType: 'full',
          applicationId: applicationId,
        }),
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        setLoading(false);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        setError('No checkout URL received');
        setLoading(false);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  if (!programData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <h1 className="text-2xl font-bold text-black mb-4">
            Program Not Found
          </h1>
          <p className="text-black mb-6">
            The program you&apos;re trying to purchase doesn&apos;t exist.
          </p>
          <Link
            href="/programs"
            className="inline-block px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700"
          >
            View All Programs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-black mb-2">
            Complete Your Enrollment
          </h1>
          <p className="text-lg text-black">{programData.name}</p>
          {program === 'barber-apprenticeship' && (
            <p className="text-sm text-slate-600 mt-1">
              Fee-based enrollment within a USDOL Registered Apprenticeship framework.<br />
              Sponsor of Record: 2Exclusive LLC (Elevate for Humanity program).
            </p>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Order Summary */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-4">
              <h2 className="text-xl font-bold text-black mb-4">
                Order Summary
              </h2>

              <div className="space-y-4 mb-6">
                <div>
                  <h3 className="font-bold text-black">
                    {programData.name}
                  </h3>
                  <p className="text-sm text-black">
                    {programData.duration}
                  </p>
                  <p className="text-sm text-black mt-2">
                    {programData.description}
                  </p>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-black">Program Cost</span>
                    <span className="font-bold">
                      ${programData.price.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-black pt-2 border-t">
                    <span>Total</span>
                    <span>${programData.price.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {program !== 'barber-apprenticeship' && (
                <div className="bg-blue-50 rounded-lg p-4 text-sm text-black">
                  <p className="font-bold mb-2">
                    <Lightbulb className="w-5 h-5 inline-block" /> Did you know?
                  </p>
                  <p>
                    Some programs qualify for funding assistance through WIOA.
                  </p>
                  <Link
                    href="/funding"
                    className="text-blue-600 underline mt-2 inline-block"
                  >
                    Check your eligibility →
                  </Link>
                </div>
              )}
              {program === 'barber-apprenticeship' && (
                <>
                  <div className="bg-blue-50 rounded-lg p-4 text-sm text-black mb-4">
                    <p className="font-bold mb-2">
                      <Lightbulb className="w-5 h-5 inline-block" /> Fee-Based Program
                    </p>
                    <p>
                      This is a self-pay program. Pay-in-4 options available with Klarna, Afterpay, or Zip at checkout.
                    </p>
                  </div>
                  <details className="bg-slate-50 border border-slate-200 rounded-lg overflow-hidden text-sm">
                    <summary className="px-4 py-3 cursor-pointer font-semibold text-black hover:bg-slate-100 transition-colors">
                      Registration Details (USDOL)
                    </summary>
                    <div className="px-4 py-3 border-t border-slate-200 text-slate-600 space-y-2">
                      <p>Elevate for Humanity is the program brand operated by 2Exclusive LLC, the USDOL Registered Apprenticeship Sponsor of Record.</p>
                      <p>This program is fee-based and not funded by the State of Indiana.</p>
                      <p>Registration documentation available upon request.</p>
                    </div>
                  </details>
                </>
              )}
            </div>
          </div>

          {/* Payment Method */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
              <h2 className="text-2xl font-bold text-black mb-6">
                Payment Method
              </h2>

              {error && (
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6">
                  <p className="text-red-800 font-semibold">{error}</p>
                </div>
              )}

              <div>
                <div className="flex items-center gap-3 mb-6">
                  <CreditCard className="w-6 h-6 text-blue-600" />
                  <h3 className="text-xl font-bold text-black">
                    Secure Checkout
                  </h3>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-black">
                      All major credit and debit cards accepted
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-black">
                      Pay-in-4 with Klarna, Afterpay, or Zip
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-black">
                      Bank transfer (ACH) for lower fees
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-black">
                      Cash App, PayPal, Venmo accepted
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-black">
                      Instant enrollment confirmation
                    </span>
                  </div>
                </div>

                {/* BNPL Info */}
                <div className="bg-slate-700 rounded-lg p-4 mb-6">
                  <p className="font-semibold text-black mb-2">Buy Now, Pay Later Options</p>
                  <p className="text-sm text-slate-700">
                    Split your payment into 4 interest-free installments with Klarna, Afterpay, or Zip. 
                    Select your preferred option at checkout.
                  </p>
                  <p className="text-xs text-slate-500 mt-2">
                    As low as ${Math.ceil(programData.price / 4).toLocaleString()}/payment
                  </p>
                </div>

                <button
                  onClick={handleStripeCheckout}
                  disabled={loading}
                  className="w-full px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold rounded-lg transition-all text-lg"
                >
                  {loading
                    ? 'Processing...'
                    : `Continue to Payment - $${programData.price.toLocaleString()}`}
                </button>

                <p className="text-center text-xs text-slate-500 mt-4">
                  You&apos;ll choose your payment method on the next screen
                </p>
              </div>

              <div className="mt-8 pt-6 border-t">
                <p className="text-xs text-black text-center">
                  By completing this purchase, you agree to our{' '}
                  <Link href="/terms" className="underline">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="underline">
                    Privacy Policy
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading checkout...</p>
        </div>
      </div>
    }>
      <CheckoutPageContent />
    </Suspense>
  );
}
