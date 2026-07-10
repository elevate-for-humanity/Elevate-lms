'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, Shield } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import TuitionCalculator from '@/components/programs/TuitionCalculator';
import FundingInfoBlock from '@/components/programs/FundingInfoBlock';
import { canonicalRoutes } from '@/lib/routes/canonical-routes';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

const PROGRAM = {
  name: 'Certified Nursing Assistant (CNA)',
  slug: 'cna',
  regularPrice: 2500,
  price: 1850,
  minDown: 200,
  maxWeeks: 26,
};

export default function CNAEnrollPage() {
  useEffect(() => {
    const checkAuth = async () => {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) window.location.href = '/login?redirect=/programs/cna/enroll';
    };
    checkAuth();
  }, []);

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [paymentOption, setPaymentOption] = useState<
    'payment-plan' | 'full-payment' | 'klarna' | 'afterpay' | 'cashapp'
  >('payment-plan');
  const [customDown, setCustomDown] = useState(PROGRAM.minDown);
  const [customWeeks, setCustomWeeks] = useState(20);
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    dateOfBirth: '', address: '', city: '', state: 'IN', zip: '',
  });

  const remaining = Math.max(0, PROGRAM.price - customDown);
  const weeklyPayment = customWeeks > 0 ? Math.ceil(remaining / customWeeks) : remaining;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError('');
    try {
      // Step 1: Create enrollment record
      const res = await fetch('/api/enroll/cna', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          paymentOption,
          paymentPlan: paymentOption === 'payment-plan'
            ? { downPayment: customDown, weeklyPayment, weeks: customWeeks }
            : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Enrollment failed');

      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!data.enrollmentId || !uuidPattern.test(data.enrollmentId)) {
        throw new Error(`Enrollment could not be confirmed. Please call ${PLATFORM_DEFAULTS.supportPhone}.`);
      }

      // Step 2: Route to payment
      if (paymentOption === 'payment-plan') {
        window.location.href = `/lms/payments/checkout?program=cna&amount=${customDown}&type=down-payment&enrollment=${data.enrollmentId}`;
        return;
      }

      // Stripe-hosted checkout for full payment and all BNPL options
      const preferredMethod =
        paymentOption === 'klarna'   ? 'klarna' :
        paymentOption === 'afterpay' ? 'afterpay_clearpay' :
        paymentOption === 'cashapp'  ? 'cashapp' :
        'card';

      const checkoutRes = await fetch('/api/payments/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programId: 'cna',
          paymentType: 'full',
          preferredMethod,
          existingEnrollmentId: data.enrollmentId,
        }),
      });
      const checkoutData = await checkoutRes.json();
      if (!checkoutRes.ok) throw new Error(checkoutData.error || 'Failed to create checkout session');
      if (checkoutData.url) {
        window.location.href = checkoutData.url;
      } else {
        throw new Error('No checkout URL returned. Please try again or call ' + PLATFORM_DEFAULTS.supportPhone);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : `Something went wrong. Call ${PLATFORM_DEFAULTS.supportPhone}.`);
      setIsSubmitting(false);
    }
  };

  const submitLabel = () => {
    if (isSubmitting) return 'Processing...';
    switch (paymentOption) {
      case 'klarna':   return 'Continue with Klarna';
      case 'afterpay': return 'Continue with Afterpay';
      case 'cashapp':  return 'Continue with Cash App Pay';
      default:         return 'Continue to Payment';
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[
          { label: 'Programs', href: '/programs' },
          { label: 'CNA', href: canonicalRoutes.programs.certifiedNursingAssistant },
          { label: 'Enroll' },
        ]} />
      </div>

      <div className="bg-slate-900 py-8">
        <div className="max-w-5xl mx-auto px-4">
          <Link href={canonicalRoutes.programs.certifiedNursingAssistant} className="inline-flex items-center gap-2 text-white hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to CNA Program
          </Link>
          <h1 className="text-3xl font-bold text-white">{PROGRAM.name}</h1>
          <p className="text-slate-300 mt-2">Indiana state certification in 4 weeks · Clinical rotations included</p>
          <div className="flex items-baseline gap-3 mt-3">
            <span className="text-2xl font-bold text-white">${PROGRAM.price.toLocaleString()}</span>
            <span className="text-lg line-through text-slate-500">${PROGRAM.regularPrice.toLocaleString()}</span>
            <span className="bg-red-600 text-white px-2 py-0.5 rounded text-xs font-bold">SALE</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">{error}</div>
        )}

        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-6">
            {step === 1 && (
              <>
                <FundingInfoBlock
                  programName={PROGRAM.name}
                  fundingSources={['FSSA IMPACT', 'WIOA (Workforce Innovation & Opportunity Act)', 'Next Level Jobs / Workforce Ready Grant']}
                  selfPayPrice={PROGRAM.price}
                  regularPrice={PROGRAM.regularPrice}
                />
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <h2 className="text-xl font-bold mb-4">Ready to Enroll? Start Here</h2>
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">First Name *</label>
                        <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Last Name *</label>
                        <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent" />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Phone *</label>
                        <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent" />
                      </div>
                    </div>
                    <button
                      onClick={() => setStep(2)}
                      disabled={!formData.firstName || !formData.email}
                      className="w-full bg-brand-blue-600 text-white py-3 rounded-lg font-bold hover:bg-brand-blue-700 disabled:opacity-50 transition"
                    >
                      Continue to Payment Options
                    </button>
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <h2 className="text-xl font-bold">Choose Your Payment Option</h2>
                <p className="text-slate-600 text-sm">
                  Total tuition: <strong>${PROGRAM.price.toLocaleString()}</strong>{' '}
                  <span className="line-through text-slate-400">${PROGRAM.regularPrice.toLocaleString()}</span>{' '}
                  · WIOA/FSSA may cover 100%
                </p>

                <div className="space-y-3">
                  {/* Payment Plan */}
                  <label className={`block p-5 border-2 rounded-xl cursor-pointer transition ${paymentOption === 'payment-plan' ? 'border-brand-blue-600 bg-brand-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
                    <input type="radio" name="po" value="payment-plan" checked={paymentOption === 'payment-plan'} onChange={() => setPaymentOption('payment-plan')} className="sr-only" />
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg">Payment Plan</span>
                        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-medium">Most Popular</span>
                      </div>
                      {paymentOption === 'payment-plan' && <CheckCircle className="w-5 h-5 text-brand-blue-600" />}
                    </div>
                    <p className="text-slate-500 text-sm mb-2">Choose your down payment and weekly amount</p>
                    {paymentOption === 'payment-plan' && (
                      <div className="space-y-3 mt-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-600">Down payment</span>
                            <span className="font-bold">${customDown}</span>
                          </div>
                          <input type="range" min={PROGRAM.minDown} max={PROGRAM.price} step={50} value={customDown} onChange={(e) => setCustomDown(Number(e.target.value))} className="w-full accent-brand-blue-600" />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-600">Pay over</span>
                            <span className="font-bold">{customWeeks} weeks</span>
                          </div>
                          <input type="range" min={4} max={PROGRAM.maxWeeks} step={1} value={customWeeks} onChange={(e) => setCustomWeeks(Number(e.target.value))} className="w-full accent-brand-blue-600" />
                        </div>
                        <div className="bg-brand-blue-100 rounded-lg p-3 text-center">
                          <span className="text-2xl font-bold text-brand-blue-700">${weeklyPayment}/wk</span>
                          <p className="text-xs text-brand-blue-600">after ${customDown} down × {customWeeks} weeks</p>
                        </div>
                      </div>
                    )}
                  </label>

                  {/* Pay in Full */}
                  <label className={`block p-5 border-2 rounded-xl cursor-pointer transition ${paymentOption === 'full-payment' ? 'border-brand-blue-600 bg-brand-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
                    <input type="radio" name="po" value="full-payment" checked={paymentOption === 'full-payment'} onChange={() => setPaymentOption('full-payment')} className="sr-only" />
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-lg">Pay in Full</span>
                        <p className="text-slate-700 mt-1">
                          <span className="text-xl font-bold">${PROGRAM.price.toLocaleString()}</span>{' '}
                          <span className="line-through text-slate-400">${PROGRAM.regularPrice.toLocaleString()}</span>
                        </p>
                      </div>
                      {paymentOption === 'full-payment' && <CheckCircle className="w-5 h-5 text-brand-blue-600" />}
                    </div>
                  </label>

                  {/* Klarna */}
                  <label className={`block p-5 border-2 rounded-xl cursor-pointer transition ${paymentOption === 'klarna' ? 'border-brand-blue-600 bg-brand-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
                    <input type="radio" name="po" value="klarna" checked={paymentOption === 'klarna'} onChange={() => setPaymentOption('klarna')} className="sr-only" />
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg">Klarna</span>
                          <span className="bg-pink-100 text-pink-700 px-2 py-0.5 rounded text-xs font-medium">Buy Now, Pay Later</span>
                        </div>
                        <p className="text-slate-600 text-sm mt-1">Pay in 4 interest-free installments or monthly financing — instant decision</p>
                      </div>
                      {paymentOption === 'klarna' && <CheckCircle className="w-5 h-5 text-brand-blue-600" />}
                    </div>
                  </label>

                  {/* Afterpay */}
                  <label className={`block p-5 border-2 rounded-xl cursor-pointer transition ${paymentOption === 'afterpay' ? 'border-brand-blue-600 bg-brand-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
                    <input type="radio" name="po" value="afterpay" checked={paymentOption === 'afterpay'} onChange={() => setPaymentOption('afterpay')} className="sr-only" />
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg">Afterpay</span>
                          <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-medium">Buy Now, Pay Later</span>
                        </div>
                        <p className="text-slate-600 text-sm mt-1">
                          4 interest-free payments of <strong>${(PROGRAM.price / 4).toFixed(2)}</strong> every 2 weeks
                        </p>
                      </div>
                      {paymentOption === 'afterpay' && <CheckCircle className="w-5 h-5 text-brand-blue-600" />}
                    </div>
                  </label>

                  {/* Cash App Pay */}
                  <label className={`block p-5 border-2 rounded-xl cursor-pointer transition ${paymentOption === 'cashapp' ? 'border-brand-blue-600 bg-brand-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
                    <input type="radio" name="po" value="cashapp" checked={paymentOption === 'cashapp'} onChange={() => setPaymentOption('cashapp')} className="sr-only" />
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg">Cash App Pay</span>
                          <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-xs font-medium">Instant</span>
                        </div>
                        <p className="text-slate-600 text-sm mt-1">Pay instantly from your Cash App balance</p>
                      </div>
                      {paymentOption === 'cashapp' && <CheckCircle className="w-5 h-5 text-brand-blue-600" />}
                    </div>
                  </label>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Shield className="w-4 h-4" />
                  <span>All payments processed securely by Stripe · Call {PLATFORM_DEFAULTS.supportPhone} for help</span>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="px-6 py-3 border border-slate-300 rounded-lg font-semibold hover:bg-slate-50">
                    Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-1 bg-brand-blue-600 text-white py-3 rounded-lg font-bold hover:bg-brand-blue-700 disabled:opacity-50 transition"
                  >
                    {submitLabel()}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <div className="lg:col-span-2">
            <div className="sticky top-4 space-y-4">
              <TuitionCalculator
                totalPrice={PROGRAM.price}
                regularPrice={PROGRAM.regularPrice}
                minDown={PROGRAM.minDown}
                maxWeeks={PROGRAM.maxWeeks}
                programName={PROGRAM.name}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
