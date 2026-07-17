'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSafeSearchParams } from '@/hooks/useSafeSearchParams';
import Link from 'next/link';
import { loadStripe } from '@stripe/stripe-js';
import { Calendar, CheckCircle, CreditCard, Lightbulb } from 'lucide-react';
import { logger } from '@/lib/logger';

// Minimal Affirm type — full SDK types not published
declare global {
  interface Window {
    affirm?: {
      ui: { ready: (cb: () => void) => void };
      checkout: ((config: Record<string, unknown>) => void) & {
        open: (handlers: {
          onFail: (err: unknown) => void;
          onSuccess: (data: { checkout_token: string; order_id?: string }) => void;
        }) => void;
      };
    };
    _affirm_config?: Record<string, string>;
  }
}

import { getProgramBySlug } from '@/data/programs/catalog';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface ProgramPricing {
  name: string;
  price: number;
  duration: string;
  description: string;
}

function getProgramPricing(slug: string): ProgramPricing | undefined {
  const p = getProgramBySlug(slug);
  if (!p) return undefined;
  // selfPayCost is a display string like "$4,980" — strip non-numeric for math
  const priceNum = p.selfPayCost ? parseInt(p.selfPayCost.replace(/[^0-9]/g, ''), 10) : 0;
  return {
    name: p.title,
    price: isNaN(priceNum) ? 0 : priceNum,
    duration: p.durationWeeks ? `${p.durationWeeks} weeks` : 'Varies',
    description: p.subtitle ?? p.title,
  };
}

function CheckoutPageInner() {
  const params = useParams();
  const searchParams = useSafeSearchParams();
  const program = params.program as string;
  const method = searchParams.get('method') || 'stripe';
  const applicationId = searchParams.get('applicationId');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const programData = getProgramPricing(program);

  useEffect(() => {
    if (method === 'affirm' && typeof window !== 'undefined') {
      if (window.affirm) {
        return;
      }

      const publicKey = process.env.NEXT_PUBLIC_AFFIRM_PUBLIC_KEY;

      const configScript = document.createElement('script');
      configScript.innerHTML = `
        _affirm_config = {
          public_api_key: "${publicKey}",
          script: "https://cdn1.affirm.com/js/v2/affirm.js"
        };
      `;
      document.head.appendChild(configScript);

      const script = document.createElement('script');
      script.src = 'https://cdn1.affirm.com/js/v2/affirm.js';
      script.async = true;

      script.onload = () => {
        if (window.affirm) {
          window.affirm.ui.ready(() => {});
        }
      };

      script.onerror = () => {
        setError('Failed to load Affirm. Please try Stripe instead.');
      };

      document.body.appendChild(script);

      return () => {
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
        if (configScript.parentNode) {
          configScript.parentNode.removeChild(configScript);
        }
      };
    }
  }, [method]);

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

  const handleAffirmCheckout = async () => {
    setLoading(true);
    setError(null);

    if (typeof window === 'undefined' || !window.affirm) {
      setError('Affirm is not available. Please try Stripe instead.');
      setLoading(false);
      return;
    }

    try {
      window.affirm.checkout({
        merchant: {
          user_confirmation_url: `${window.location.origin}/checkout/success?program=${program}`,
          user_cancel_url: `${window.location.origin}/checkout/${program}?method=affirm`,
          user_confirmation_url_action: 'POST',
        },
        items: [
          {
            display_name: programData.name,
            sku: program,
            unit_price: programData.price * 100,
            qty: 1,
            item_image_url: `${window.location.origin}/images/programs/${program}.jpg`,
            item_url: `${window.location.origin}/programs/${program}`,
          },
        ],
        metadata: {
          program_slug: program,
          program_name: programData.name,
        },
        order_id: `${program}-${Date.now()}`,
        shipping_amount: 0,
        tax_amount: 0,
        total: programData.price * 100,
        currency: 'USD',
      });

      window.affirm.checkout.open({
        onFail: (error: unknown) => {
          logger.error('Affirm checkout failed:', error);
          setError('Affirm checkout failed. Please try again or use Stripe.');
          setLoading(false);
        },
        onSuccess: async (data: { checkout_token: string; order_id?: string }) => {
          try {
            // Redirect to capture route — it authorizes the charge server-side
            // and creates the enrollment. checkout_token + order_id are passed
            // as query params by Affirm; we forward them to the capture endpoint.
            const orderId = data.order_id || data.checkout_token;
            window.location.href = `/api/affirm/capture?checkout_token=${encodeURIComponent(data.checkout_token)}&order_id=${encodeURIComponent(orderId)}`;
          } catch (err) {
            setError('Failed to process payment. Please contact support.');
            setLoading(false);
          }
        },
      });
    } catch (err) {
      logger.error('Affirm error:', err);
      setError('An error occurred with Affirm. Please try Stripe instead.');
      setLoading(false);
    }
  };

  if (!programData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <h1 className="text-2xl font-bold text-black mb-4">Program Not Found</h1>
          <p className="text-black mb-6">The program you're trying to purchase doesn't exist.</p>
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
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-black mb-2">
            Complete Your Enrollment
          </h1>
          <p className="text-lg text-black">{programData.name}</p>
          {program === 'barber-apprenticeship' && (
            <p className="text-sm text-slate-600 mt-1">
              Fee-based enrollment within a USDOL Registered Apprenticeship framework.
              <br />
              Sponsor of Record: 2Exclusive LLC-S d/b/a ${PLATFORM_DEFAULTS.orgName} Career & Technical
              Institute.
            </p>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Order Summary */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-4">
              <h2 className="text-xl font-bold text-black mb-4">Order Summary</h2>

              <div className="space-y-4 mb-6">
                <div>
                  <h3 className="font-bold text-black">{programData.name}</h3>
                  <p className="text-sm text-black">{programData.duration}</p>
                  <p className="text-sm text-black mt-2">{programData.description}</p>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-black">Program Cost</span>
                    <span className="font-bold">${programData.price.toLocaleString()}</span>
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
                  <p>Some programs qualify for funding assistance through WIOA.</p>
                  <Link href="/funding" className="text-blue-600 underline mt-2 inline-block">
                    Check your eligibility →
                  </Link>
                </div>
              )}
              {program === 'barber-apprenticeship' && (
                <>
                  <div className="bg-purple-50 rounded-lg p-4 text-sm text-black mb-4">
                    <p className="font-bold mb-2">
                      <Lightbulb className="w-5 h-5 inline-block" /> Fee-Based Program
                    </p>
                    <p>This is a self-pay program. Payment plans and Affirm financing available.</p>
                  </div>
                  <details className="bg-slate-50 border border-slate-200 rounded-lg overflow-hidden text-sm">
                    <summary className="px-4 py-3 cursor-pointer font-semibold text-black hover:bg-slate-100 transition-colors">
                      Registration Details (USDOL)
                    </summary>
                    <div className="px-4 py-3 border-t border-slate-200 text-slate-600 space-y-2">
                      <p>
                        ${PLATFORM_DEFAULTS.orgName} is the program brand operated by 2Exclusive LLC-S, the
                        USDOL Registered Apprenticeship Sponsor of Record.
                      </p>
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
              <h2 className="text-2xl font-bold text-black mb-6">Payment Method</h2>

              {error && (
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6">
                  <p className="text-red-800 font-semibold">{error}</p>
                </div>
              )}

              {method === 'stripe' ? (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <CreditCard className="w-6 h-6 text-blue-600" />
                    <h3 className="text-xl font-bold text-black">Pay with Stripe</h3>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-black">Secure one-time payment</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-black">All major credit and debit cards accepted</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-black">Instant enrollment confirmation</span>
                    </div>
                  </div>

                  <button
                    onClick={handleStripeCheckout}
                    disabled={loading}
                    className="w-full px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-bold rounded-lg transition-all text-lg"
                  >
                    {loading
                      ? 'Processing...'
                      : `Pay $${programData.price.toLocaleString()} with Stripe`}
                  </button>

                  <p className="text-center text-sm text-black mt-4">
                    Or{' '}
                    <Link
                      href={`/checkout/${program}?method=affirm`}
                      className="text-blue-600 underline"
                    >
                      pay with Affirm
                    </Link>{' '}
                    for monthly payments
                  </p>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <Calendar className="w-6 h-6 text-cyan-600" />
                    <h3 className="text-xl font-bold text-black">Pay with Affirm</h3>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-black">Monthly payment plans available</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-black">0% APR options for qualified buyers</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-black">
                        As low as ${Math.ceil(programData.price / 24)}/month
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleAffirmCheckout}
                    disabled={loading}
                    className="w-full px-8 py-4 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-400 text-white font-bold rounded-lg transition-all text-lg"
                  >
                    {loading ? 'Processing...' : 'Continue with Affirm'}
                  </button>

                  <p className="text-center text-sm text-black mt-4">
                    Or{' '}
                    <Link
                      href={`/checkout/${program}?method=stripe`}
                      className="text-blue-600 underline"
                    >
                      pay in full with Stripe
                    </Link>
                  </p>
                </div>
              )}

              <div className="mt-8 pt-6 border-t">
                <p className="text-xs text-black text-center">
                  By completing this purchase, you agree to our{' '}
                  <Link href="/legal" className="underline">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/legal/privacy" className="underline">
                    Privacy Policy
                  </Link>
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
          <CheckoutPageInner />
  );
}
