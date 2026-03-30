'use client';
import Turnstile from '@/components/Turnstile';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, CreditCard, Calculator, Info } from 'lucide-react';
import LazyVideo from '@/components/ui/LazyVideo';
import { ACTIVE_BNPL_PROVIDERS } from '@/lib/bnpl-config';
import { BARBER_PRICING, calculateWeeklyPayment as calcWeekly } from '@/lib/programs/pricing';

// Single source of truth — do not duplicate pricing constants here.
const PRICING = BARBER_PRICING;

function calculateWeeklyPayment(downPayment: number) {
  // hoursPerWeek=40, transferredHours=0 — standard full-program calculation
  const result = calcWeekly(40, 0, downPayment);
  return {
    weeklyDollars: result.weeklyPaymentDollars,
    weeks: result.weeksRemaining,
    remaining: result.totalWeeklyPayments,
  };
}

function getNextFriday(): string {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysUntilFriday = dayOfWeek === 5 ? 7 : (5 - dayOfWeek + 7) % 7 || 7;
  const nextFriday = new Date(now);
  nextFriday.setDate(now.getDate() + daysUntilFriday);
  return nextFriday.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

type PaymentOption = 'weekly' | 'full' | 'custom' | 'sezzle' | 'affirm';

// Map URL ?payment= values to internal option names
function resolveInitialPayment(param: string | null): PaymentOption {
  if (param === 'pay_in_full') return 'full';
  if (param === 'payment_plan') return 'custom';
  if (param === 'bnpl') return 'sezzle';
  return 'weekly';
}

export default function ApprenticeForm({ initialPayment }: { initialPayment?: string | null }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorSeverity, setErrorSeverity] = useState<'info' | 'critical'>('info');
  const [nextFriday, setNextFriday] = useState('Friday');
  
  // Payment calculator state
  const [transferHours, setTransferHours] = useState(0);
  const [hoursPerWeek, setHoursPerWeek] = useState(40);
  
  // Payment option — pre-selected from URL param if provided
  const [paymentOption, setPaymentOption] = useState<PaymentOption>(() => resolveInitialPayment(initialPayment ?? null));
  const [customAmount, setCustomAmount] = useState(PRICING.defaultDownPayment);
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    hasHostShop: '',
    hostShopName: '',
  });
  const [smsConsent, setSmsConsent] = useState(false);

  // Calculate next Friday on client only to avoid hydration mismatch
  useEffect(() => {
    setNextFriday(getNextFriday());
  }, []);

  const { weeklyDollars, weeks, remaining } = calculateWeeklyPayment(
    paymentOption === 'custom' ? customAmount : PRICING.defaultDownPayment
  );

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePayNow = async () => {
    if (!formData.email || !formData.firstName || !formData.lastName || !formData.phone) {
      setError('Please fill in all required fields');
      setErrorSeverity('info');
      return;
    }

    setLoading(true);
    setError('');
    setErrorSeverity('info');

    try {
      // Save application first
      const appResponse = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          transferHours,
          program: 'Barber Apprenticeship',
          programSlug: 'barber-apprenticeship',
          fundingType: 'self-pay',
          source: 'program-page',
          paymentOption,
        }),
      });

      const appData = await appResponse.json();
      const applicationId = appData?.id;

      let checkoutResponse;
      const basePayload = {
        customer_email: formData.email,
        customer_name: `${formData.firstName} ${formData.lastName}`,
        customer_phone: formData.phone,
        sms_consent: smsConsent,
        application_id: applicationId,
        transferred_hours: transferHours,
        transferred_hours_verified: transferHours,
        has_host_shop: formData.hasHostShop,
        host_shop_name: formData.hostShopName,
        hours_per_week: hoursPerWeek,
        success_url: `${window.location.origin}/programs/barber-apprenticeship/enrollment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${window.location.origin}/programs/barber-apprenticeship/apply`,
      };

      if (paymentOption === 'affirm') {
        // Affirm uses a client-side JS SDK flow:
        // 1. Get checkout config from our API
        // 2. Load Affirm JS SDK
        // 3. Call affirm.checkout() which opens their modal
        const affirmAmount = Math.max(PRICING.setupFee, customAmount);
        checkoutResponse = await fetch('/api/affirm/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            programId: 'barber-apprenticeship',
            programSlug: 'barber-apprenticeship',
            programName: 'Barber Apprenticeship Program',
            amount: affirmAmount,
            paymentOption: affirmAmount >= PRICING.fullPrice ? 'full' : 'deposit',
            applicationId: applicationId,
            transferHours: transferHours,
            hoursPerWeek: hoursPerWeek,
            hasHostShop: formData.hasHostShop,
            hostShopName: formData.hostShopName,
          }),
        });
        
        const affirmData = await checkoutResponse.json();
        
        if (!checkoutResponse.ok || !affirmData.checkoutConfig) {
          setError(affirmData.error || 'Affirm is temporarily unavailable. Please select Card, Payment Plan, or another option above.');
          setErrorSeverity('info');
          setLoading(false);
          return;
        }

        // Load Affirm JS SDK dynamically
        try {
          const affirmJsUrl = affirmData.affirmJsUrl || 'https://cdn1.affirm.com/js/v2/affirm.js';
          
          // Set up Affirm config on window before loading SDK
          (window as any)._affirm_config = {
            public_api_key: affirmData.publicKey,
            script: affirmJsUrl,
          };

          // Load the SDK if not already loaded
          if (!(window as any).affirm) {
            await new Promise<void>((resolve, reject) => {
              const script = document.createElement('script');
              script.src = affirmJsUrl;
              script.async = true;
              script.onload = () => resolve();
              script.onerror = () => reject(new Error('Failed to load Affirm SDK'));
              document.head.appendChild(script);
            });
          }

          // Open Affirm checkout modal
          const affirmSdk = (window as any).affirm;
          if (affirmSdk?.checkout) {
            affirmSdk.checkout(affirmData.checkoutConfig);
            affirmSdk.checkout.open();
          } else {
            throw new Error('Affirm SDK not available after loading');
          }
        } catch (sdkError) {
          console.error('Affirm SDK error:', sdkError);
          setError('Affirm checkout could not load. Please select Card, Payment Plan, or another option above.');
          setErrorSeverity('info');
          setLoading(false);
        }
        return;
      } else if (paymentOption === 'sezzle') {
        // Sezzle - pay over time. Minimum is the setup fee ($1,743).
        const sezzleAmount = Math.min(2500, Math.max(PRICING.setupFee, customAmount));
        checkoutResponse = await fetch('/api/sezzle/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            programId: 'barber-apprenticeship',
            programSlug: 'barber-apprenticeship',
            programName: 'Barber Apprenticeship Program',
            amount: sezzleAmount,
            paymentOption: sezzleAmount >= PRICING.fullPrice ? 'full' : 'deposit',
            description: `Barber Apprenticeship - $${sezzleAmount} payment via Sezzle`,
            applicationId: applicationId,
            transferHours: transferHours,
            hoursPerWeek: hoursPerWeek,
            hasHostShop: formData.hasHostShop,
            hostShopName: formData.hostShopName,
          }),
        });
        
        const sezzleData = await checkoutResponse.json();
        // Sezzle response received
        
        if (checkoutResponse.ok && sezzleData.checkoutUrl) {
          window.location.href = sezzleData.checkoutUrl;
        } else {
          setError(sezzleData.error || 'Sezzle is temporarily unavailable. Please select Card, Payment Plan, or another option above.');
          setErrorSeverity('info');
          setLoading(false);
        }
        return;
      } else if (paymentOption === 'full') {
        // Pay in full - one-time payment with 5% discount
        checkoutResponse = await fetch('/api/barber/checkout/public', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...basePayload,
            payment_type: 'pay_in_full',
          }),
        });
      } else if (paymentOption === 'custom') {
        // Custom amount payment
        checkoutResponse = await fetch('/api/barber/checkout/public', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...basePayload,
            payment_type: 'payment_plan',
            custom_setup_fee: customAmount,
          }),
        });
      } else {
        // Weekly payments - default setup fee
        checkoutResponse = await fetch('/api/barber/checkout/public', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...basePayload,
            payment_type: 'payment_plan',
          }),
        });
      }

      const checkoutData = await checkoutResponse.json();
      // Checkout response received

      if (checkoutResponse.ok && checkoutData.url) {
        // Redirect to Stripe Checkout
        window.location.href = checkoutData.url;
      } else {
        console.error('Checkout error:', checkoutData);
        setError(checkoutData.error || checkoutData.details || 'Unable to create checkout. Please try again or select a different payment option.');
        setErrorSeverity('critical');
        setLoading(false);
      }
    } catch (err) {
      console.error('Checkout exception:', err);
      setError('Something went wrong. Please try again or select a different payment option.');
      setErrorSeverity('critical');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white">
      {/* Video Hero */}
      {/* Hero */}
      <section className="relative w-full">
        <div className="relative h-[50vh] sm:h-[55vh] md:h-[60vh] lg:h-[65vh] min-h-[320px] w-full overflow-hidden">
          <LazyVideo src="/videos/barber-hero-final.mp4" poster="/images/pages/barber-hero-main.jpg"
            className="absolute inset-0 w-full h-full object-cover" />
        </div>
        <div className="bg-white py-10 border-t">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">Apply for Enrollment</h1>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">Barber Apprenticeship Program</p>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-5 gap-8">
          
          {/* Left Column - Payment Calculator */}
          <div className="lg:col-span-2">
            <div className="bg-brand-blue-700 rounded-2xl p-6 text-white sticky top-8">
              <div className="flex items-center gap-3 mb-4">
                <Calculator className="w-6 h-6" />
                <h2 className="text-lg font-bold">Payment Calculator</h2>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-brand-blue-200 mb-2">
                    Transfer Hours (if any)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="1900"
                    step="50"
                    value={transferHours}
                    onChange={(e) => {
                      const val = Math.min(1900, Math.max(0, parseInt(e.target.value) || 0));
                      setTransferHours(val);
                    }}
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50"
                    placeholder="0"
                  />
                  <p className="text-xs text-brand-blue-200 mt-1">
                    Have documented hours from another program?
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-blue-200 mb-2">
                    Hours Per Week
                  </label>
                  <select
                    value={hoursPerWeek}
                    onChange={(e) => setHoursPerWeek(parseInt(e.target.value))}
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white"
                  >
                    <option value="20">20 hrs/week</option>
                    <option value="25">25 hrs/week</option>
                    <option value="30">30 hrs/week</option>
                    <option value="35">35 hrs/week</option>
                    <option value="40">40 hrs/week</option>
                  </select>
                </div>
              </div>

              {/* Results */}
              <div className="bg-white/10 rounded-xl p-4 mb-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-brand-blue-200 text-xs uppercase mb-1">Remaining Hours</div>
                    <div className="text-2xl font-black">{remainingHours.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-brand-blue-200 text-xs uppercase mb-1">Est. Duration</div>
                    <div className="text-2xl font-black">~{weeks} weeks</div>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="bg-white/10 rounded-xl p-4">
                <div className="text-center">
                  <div className="text-brand-blue-200 text-xs uppercase mb-1">Program Tuition</div>
                  <div className="text-3xl font-black">${PRICING.fullPrice.toLocaleString()}</div>
                </div>
              </div>

              {/* Payment Options */}
              <div className="bg-white/20 rounded-xl p-4 mt-4">
                <div className="text-center">
                  <div className="text-brand-green-200 text-xs uppercase mb-1">Payment Options</div>
                  <div className="text-sm text-white mt-2 space-y-1">
                    <p><strong>Pay in Full:</strong> Card or Bank</p>
                    <p><strong>BNPL:</strong> Split into payments</p>
                  </div>
                </div>
              </div>

              {/* If not approved for full BNPL */}
              <div className="bg-white/10 rounded-xl p-3 mt-4">
                <p className="text-xs text-brand-blue-200 text-center">
                  If BNPL partially approved, remaining balance split into ~{weeks} weekly payments of ${weeklyDollars.toFixed(2)}
                </p>
              </div>

              <div className="mt-4 flex items-start gap-2">
                <Info className="w-4 h-4 text-brand-blue-200 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-brand-blue-200">
                  Transfer hours reduce program duration, not tuition cost.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Form & Payment */}
          <div className="lg:col-span-3">
            {error && (
              <div className={`mb-6 p-4 rounded-lg border ${
                errorSeverity === 'critical' 
                  ? 'bg-brand-red-50 border-brand-red-200' 
                  : 'bg-amber-50 border-amber-200'
              }`}>
                <p className={`font-medium ${
                  errorSeverity === 'critical' ? 'text-brand-red-800' : 'text-amber-800'
                }`}>{error}</p>
                {errorSeverity === 'critical' && (
                  <a 
                    href="/support" 
                    className="inline-block mt-2 text-brand-red-600 font-medium hover:underline"
                  >
                    Need help? Call (317) 314-3757
                  </a>
                )}
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 sm:p-8">
              <h2 className="text-2xl font-bold text-black mb-6">Your Information</h2>
              
              <div className="space-y-5">
                {/* Name */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => updateField('firstName', e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500"
                      placeholder="First name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => updateField('lastName', e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500"
                      placeholder="Last name"
                    />
                  </div>
                </div>

                {/* Contact */}
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500"
                    placeholder="(317) 314-3757"
                  />
                </div>

                {/* SMS Consent */}
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="smsConsent"
                    checked={smsConsent}
                    onChange={(e) => setSmsConsent(e.target.checked)}
                    className="mt-1 w-4 h-4 text-brand-blue-600 border-slate-300 rounded"
                  />
                  <label htmlFor="smsConsent" className="text-sm text-slate-600">
                    I agree to receive text messages from Elevate for Humanity about my enrollment, program updates, and important notices. Message and data rates may apply. Reply STOP to opt out.
                  </label>
                </div>

                {/* Transfer Hours Question */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <label className="block text-sm font-medium text-amber-900 mb-2">
                    Do you have documented barber training hours to transfer?
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="hasTransferHours"
                        checked={transferHours > 0}
                        onChange={() => setTransferHours(500)}
                        className="w-4 h-4 text-amber-600"
                      />
                      <span className="text-amber-800">Yes, I have hours to transfer</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="hasTransferHours"
                        checked={transferHours === 0}
                        onChange={() => setTransferHours(0)}
                        className="w-4 h-4 text-amber-600"
                      />
                      <span className="text-amber-800">No, I'm starting fresh</span>
                    </label>
                  </div>
                  {transferHours > 0 && (
                    <p className="text-xs text-amber-700 mt-2">
                      Adjust your transfer hours in the calculator on the left.
                    </p>
                  )}
                </div>

                {/* Host Shop Question */}
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Do you have a barbershop for your training hours?
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-white">
                      <input
                        type="radio"
                        name="hasHostShop"
                        value="yes"
                        checked={formData.hasHostShop === 'yes'}
                        onChange={(e) => updateField('hasHostShop', e.target.value)}
                        className="w-4 h-4 text-brand-blue-600"
                      />
                      <span className="text-black">Yes, I have a shop</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-white">
                      <input
                        type="radio"
                        name="hasHostShop"
                        value="no"
                        checked={formData.hasHostShop === 'no'}
                        onChange={(e) => updateField('hasHostShop', e.target.value)}
                        className="w-4 h-4 text-brand-blue-600"
                      />
                      <span className="text-black">No, I need help finding one</span>
                    </label>
                  </div>
                </div>

                {formData.hasHostShop === 'yes' && (
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">
                      Shop Name (optional)
                    </label>
                    <input
                      type="text"
                      value={formData.hostShopName}
                      onChange={(e) => updateField('hostShopName', e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500"
                      placeholder="Name of the barbershop"
                    />
                  </div>
                )}

                {/* Payment Options */}
                <div className="border-t border-black pt-6 mt-6">
                  <p className="text-lg text-black font-bold mb-4">Choose Payment Option</p>
                  
                  {/* Option 1: Pay in Full */}
                  <button
                    type="button"
                    onClick={() => setPaymentOption('full')}
                    className={`w-full p-4 rounded-xl border-2 mb-3 text-left transition ${
                      paymentOption === 'full' 
                        ? 'border-brand-green-600 bg-brand-green-50' 
                        : 'border-slate-300 bg-white hover:border-slate-400'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-bold text-black text-lg">Pay in Full</p>
                        <p className="text-black text-sm">One-time payment - 5% discount</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-brand-green-600 text-xl">${Math.round(PRICING.fullPrice * 0.95).toLocaleString()}</p>
                        <p className="text-xs text-black line-through">${PRICING.fullPrice.toLocaleString()}</p>
                      </div>
                    </div>
                  </button>

                  {/* Option 2: Payment Plan — small down, you pick */}
                  <button
                    type="button"
                    onClick={() => { setPaymentOption('custom'); }}
                    className={`w-full p-4 rounded-xl border-2 mb-3 text-left transition ${
                      paymentOption === 'custom' || paymentOption === 'weekly'
                        ? 'border-brand-orange-600 bg-brand-orange-50'
                        : 'border-slate-300 bg-white hover:border-slate-400'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-bold text-black text-lg">Payment Plan — You Pick</p>
                        <p className="text-black text-sm">Small down payment, small weekly payments</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-brand-orange-600 text-xl">from $600</p>
                        <p className="text-xs text-black">down today</p>
                      </div>
                    </div>
                  </button>

                  {/* Live payment calculator — always visible when plan selected */}
                  {(paymentOption === 'custom' || paymentOption === 'weekly') && (
                    <div className="bg-brand-orange-50 rounded-xl p-5 mb-3 border-2 border-brand-orange-200">
                      <label className="block text-sm font-bold text-black mb-1">
                        How much can you put down today?
                      </label>
                      <p className="text-xs text-slate-500 mb-3">Minimum $600 — the more you put down, the lower your weekly payment.</p>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl font-bold text-black">$</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={customAmount || ''}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            const num = val ? parseInt(val) : PRICING.minDownPayment;
                            setCustomAmount(Math.min(num, PRICING.fullPrice));
                          }}
                          onBlur={() => {
                            if (!customAmount || customAmount < PRICING.minDownPayment) setCustomAmount(PRICING.minDownPayment);
                            if (customAmount > PRICING.fullPrice) setCustomAmount(PRICING.fullPrice);
                          }}
                          className="w-full px-4 py-3 text-2xl font-bold border-2 border-brand-orange-300 rounded-lg focus:ring-2 focus:ring-brand-orange-500 focus:border-brand-orange-500"
                        />
                      </div>
                      {/* Live estimate */}
                      {/* Slider */}
                      <input
                        type="range"
                        min={PRICING.minDownPayment}
                        max={PRICING.fullPrice}
                        step={50}
                        value={Math.max(customAmount || PRICING.minDownPayment, PRICING.minDownPayment)}
                        onChange={(e) => setCustomAmount(parseInt(e.target.value))}
                        className="w-full accent-brand-orange-600 mb-1"
                      />
                      <div className="flex justify-between text-xs text-slate-400 mb-4">
                        <span>$600 min</span>
                        <span>$4,980 full</span>
                      </div>

                      {/* Live estimate */}
                      <div className="bg-white rounded-lg p-4 border border-brand-orange-200">
                        <p className="text-xs text-slate-500 uppercase font-semibold mb-2">Your Payment Estimate</p>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-slate-700">Down payment today</span>
                          <span className="font-bold text-black">${Math.max(customAmount || PRICING.minDownPayment, PRICING.minDownPayment).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-slate-700">Remaining balance</span>
                          <span className="font-bold text-black">${Math.max(0, PRICING.fullPrice - Math.max(customAmount || PRICING.minDownPayment, PRICING.minDownPayment)).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-slate-700">Weekly payment</span>
                          <span className="font-bold text-brand-orange-600 text-lg">${calculateWeeklyPayment(Math.max(customAmount || PRICING.minDownPayment, PRICING.minDownPayment)).weeklyDollars.toFixed(2)}/wk</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-700">Term</span>
                          <span className="font-bold text-black">{PRICING.paymentTermWeeks} weeks</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-2">Weekly invoices sent every Friday. Pay by link or saved card.</p>
                      </div>
                    </div>
                  )}

                  {/* Option 4: Affirm */}
                  <button
                    type="button"
                    onClick={() => setPaymentOption('affirm')}
                    className={`w-full p-4 rounded-xl border-2 mb-3 text-left transition ${
                      paymentOption === 'affirm' 
                        ? 'border-brand-blue-600 bg-brand-blue-50' 
                        : 'border-slate-300 bg-white hover:border-slate-400'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-bold text-black text-lg">Affirm</p>
                        <p className="text-black text-sm">Pay over time</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-brand-blue-600 text-lg">You Choose</p>
                        <p className="text-xs text-black">min ${PRICING.setupFee.toLocaleString()}</p>
                      </div>
                    </div>
                  </button>

                  {/* Affirm Amount Input */}
                  {paymentOption === 'affirm' && (
                    <div className="bg-brand-blue-50 rounded-xl p-4 mb-3 border-2 border-brand-blue-200">
                      <label className="block text-sm font-medium text-black mb-2">
                        How much do you want to finance with Affirm? (min ${PRICING.setupFee.toLocaleString()})
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-black">$</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={customAmount || ''}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            setCustomAmount(val ? parseInt(val) : 0);
                          }}
                          onBlur={() => {
                            if (customAmount < PRICING.setupFee) setCustomAmount(PRICING.setupFee);
                            if (customAmount > PRICING.fullPrice) setCustomAmount(PRICING.fullPrice);
                          }}
                          className="w-full px-4 py-3 text-2xl font-bold border-2 border-brand-blue-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                        />
                      </div>
                      <p className="text-sm text-black mt-2">
                        Affirm will check your eligibility and show payment options at checkout
                      </p>
                    </div>
                  )}

                  {/* Option 5: Sezzle */}
                  <button
                    type="button"
                    onClick={() => setPaymentOption('sezzle')}
                    className={`w-full p-4 rounded-xl border-2 mb-3 text-left transition ${
                      paymentOption === 'sezzle' 
                        ? 'border-indigo-600 bg-indigo-50' 
                        : 'border-slate-300 bg-white hover:border-slate-400'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-bold text-black text-lg">Sezzle</p>
                        <p className="text-black text-sm">Pay over time</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-indigo-600 text-lg">You Choose</p>
                        <p className="text-xs text-black">${PRICING.setupFee.toLocaleString()} - $2,500</p>
                      </div>
                    </div>
                  </button>

                  {/* Sezzle Amount Input */}
                  {paymentOption === 'sezzle' && (
                    <div className="bg-indigo-50 rounded-xl p-4 mb-3 border-2 border-indigo-200">
                      <label className="block text-sm font-medium text-black mb-2">
                        How much do you want to pay with Sezzle? (${PRICING.setupFee.toLocaleString()} - $2,500)
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-black">$</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={customAmount || ''}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            setCustomAmount(val ? parseInt(val) : 0);
                          }}
                          onBlur={() => {
                            if (customAmount < PRICING.setupFee) setCustomAmount(PRICING.setupFee);
                            if (customAmount > 2500) setCustomAmount(2500);
                          }}
                          className="w-full px-4 py-3 text-2xl font-bold border-2 border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      <p className="text-sm text-black mt-2">
                        Sezzle will check your eligibility - 4 payments of ${Math.round((customAmount || 0) / 4).toLocaleString()} every 2 weeks
                      </p>
                    </div>
                  )}

                  {/* Payment Methods Available */}
                  <div className="bg-white rounded-xl p-4 mb-4">
                    <p className="text-sm text-black font-medium mb-3">Payment methods available at checkout:</p>
                    <div className="flex flex-wrap gap-2 justify-center mb-2">
                      <span className="px-3 py-1 bg-black text-white rounded-full text-xs font-bold">Card</span>
                      <span className="px-3 py-1 bg-black text-white rounded-full text-xs font-bold">Apple Pay</span>
                      <span className="px-3 py-1 bg-white text-black border border-black rounded-full text-xs font-bold">Google Pay</span>
                      <span className="px-3 py-1 bg-brand-blue-900 text-white rounded-full text-xs font-bold">Samsung Pay</span>
                      <span className="px-3 py-1 bg-brand-blue-100 text-brand-blue-700 rounded-full text-xs font-bold">Link</span>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-center mb-2">
                      {ACTIVE_BNPL_PROVIDERS.map((p) => (
                        <span key={p.id} className={`px-3 py-1 ${p.badgeBg} ${p.badgeText} rounded-full text-xs font-bold`}>{p.name}</span>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2 justify-center">
                      <span className="px-3 py-1 bg-brand-green-500 text-white rounded-full text-xs font-bold">Cash App</span>
                      <span className="px-3 py-1 bg-brand-orange-400 text-white rounded-full text-xs font-bold">Amazon Pay</span>
                      <span className="px-3 py-1 bg-brand-blue-600 text-white rounded-full text-xs font-bold">Bank (ACH)</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-3 text-center">
                      Payment options subject to eligibility. Terms and availability vary by provider.
                    </p>
                  </div>
                </div>

                {/* Pay Button */}
                <button
                  onClick={handlePayNow}
                  disabled={loading || !formData.email || !formData.firstName || !formData.lastName || !formData.phone}
                  className="w-full py-4 bg-brand-blue-600 hover:bg-brand-blue-700 disabled:bg-slate-300 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 text-lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      Continue to Payment
                    </>
                  )}
                </button>

                <p className="text-center text-sm text-black mt-4">
                  Secure payment via Stripe. Card, Apple Pay, Google Pay, PayPal, Venmo, Cash App accepted.
                </p>
              </div>
            </div>

            {/* Payment Options Notice */}
            <div className="mt-6 bg-brand-blue-50 border border-brand-blue-200 rounded-xl p-4">
              <p className="text-brand-blue-800 text-sm">
                <strong>Have questions?</strong> Contact us for payment plan options or employer-sponsored funding.{' '}
                <Link href="/inquiry?program=barber-apprenticeship" className="text-brand-blue-700 font-medium hover:underline">
                  Request information →
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
