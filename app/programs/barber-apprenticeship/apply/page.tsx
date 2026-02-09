'use client';
import Turnstile from '@/components/Turnstile';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, CreditCard, Calculator, Info } from 'lucide-react';

// Pricing constants - matches lib/programs/pricing.ts
const PRICING = {
  totalHours: 2000,
  fullPrice: 4980,
  setupFee: 1743,
  setupFeeRate: 0.35,
  remainingBalance: 3237,
  billingDay: 'Friday',
};

function calculateWeeklyPayment(hoursPerWeek: number, transferHours: number = 0) {
  const remainingHours = PRICING.totalHours - transferHours;
  const weeks = Math.ceil(remainingHours / hoursPerWeek);
  const weeklyDollars = weeks > 0 ? Math.round((PRICING.remainingBalance / weeks) * 100) / 100 : 0;
  return { weeklyDollars, weeks, remainingHours };
}

function getNextFriday(): string {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysUntilFriday = dayOfWeek === 5 ? 7 : (5 - dayOfWeek + 7) % 7 || 7;
  const nextFriday = new Date(now);
  nextFriday.setDate(now.getDate() + daysUntilFriday);
  return nextFriday.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

export default function BarberApprenticeshipApplyPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [nextFriday, setNextFriday] = useState('Friday');
  
  // Payment calculator state
  const [transferHours, setTransferHours] = useState(0);
  const [hoursPerWeek, setHoursPerWeek] = useState(40);
  
  // Payment option
  const [paymentOption, setPaymentOption] = useState<'weekly' | 'full' | 'custom' | 'sezzle' | 'affirm'>('weekly');
  const [customAmount, setCustomAmount] = useState(PRICING.setupFee);
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    hasHostShop: '',
    hostShopName: '',
  });

  // Calculate next Friday on client only to avoid hydration mismatch
  useEffect(() => {
    setNextFriday(getNextFriday());
  }, []);

  const { weeklyDollars, weeks, remainingHours } = calculateWeeklyPayment(hoursPerWeek, transferHours);

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePayNow = async () => {
    if (!formData.email || !formData.firstName || !formData.lastName || !formData.phone) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

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
        application_id: applicationId,
        transferred_hours: transferHours,
        transferred_hours_verified: transferHours,
        has_host_shop: formData.hasHostShop,
        host_shop_name: formData.hostShopName,
        hours_per_week: hoursPerWeek,
        success_url: `${window.location.origin}/programs/barber-apprenticeship/apply/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${window.location.origin}/programs/barber-apprenticeship/apply`,
      };

      if (paymentOption === 'affirm') {
        // Affirm - Pay over time with user-selected amount
        const affirmAmount = Math.max(50, customAmount);
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
            description: `Barber Apprenticeship - $${affirmAmount} payment via Affirm`,
            applicationId: applicationId,
            // Barber-specific metadata for enrollment creation
            transferHours: transferHours,
            hoursPerWeek: hoursPerWeek,
            hasHostShop: formData.hasHostShop,
            hostShopName: formData.hostShopName,
          }),
        });
        
        const affirmData = await checkoutResponse.json();
        console.log('Affirm response:', affirmData);
        
        if (checkoutResponse.ok && affirmData.checkoutUrl) {
          window.location.href = affirmData.checkoutUrl;
        } else {
          setError(affirmData.error || 'Unable to create Affirm checkout. Please try another payment method.');
          setLoading(false);
        }
        return;
      } else if (paymentOption === 'sezzle') {
        // Sezzle - pay over time with user-selected amount
        const sezzleAmount = Math.min(2500, Math.max(35, customAmount));
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
            description: `Barber Apprenticeship - $${sezzleAmount} payment via Sezzle`,
            applicationId: applicationId,
            // Barber-specific metadata for enrollment creation
            transferHours: transferHours,
            hoursPerWeek: hoursPerWeek,
            hasHostShop: formData.hasHostShop,
            hostShopName: formData.hostShopName,
          }),
        });
        
        const sezzleData = await checkoutResponse.json();
        console.log('Sezzle response:', sezzleData);
        
        if (checkoutResponse.ok && sezzleData.checkoutUrl) {
          window.location.href = sezzleData.checkoutUrl;
        } else {
          setError(sezzleData.error || 'Unable to create Sezzle checkout. Please try another payment method.');
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
      console.log('Checkout response:', checkoutData);

      if (checkoutResponse.ok && checkoutData.url) {
        // Redirect to Stripe Checkout
        window.location.href = checkoutData.url;
      } else {
        console.error('Checkout error:', checkoutData);
        setError(checkoutData.error || checkoutData.details || 'Unable to create checkout. Please call (317) 314-3757.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Checkout exception:', err);
      setError('Unable to process. Please call (317) 314-3757.');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white">
      {/* Video Hero */}
      <section className="relative h-[40vh] min-h-[300px] flex items-center">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          poster="/hero-images/barber-hero.jpg"
        >
          <source src="/videos/barber-hero-final.mp4" type="video/mp4" />
        </video>
        
        <div className="relative z-10 max-w-5xl mx-auto px-6 w-full">
          <Link 
            href="/programs/barber-apprenticeship" 
            className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Program
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
            Enroll & Pay
          </h1>
          <p className="text-xl text-white/90 mt-2 drop-shadow-md">
            Barber Apprenticeship Program
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-5 gap-8">
          
          {/* Left Column - Payment Calculator */}
          <div className="lg:col-span-2">
            <div className="bg-purple-600 rounded-2xl p-6 text-white sticky top-8">
              <div className="flex items-center gap-3 mb-4">
                <Calculator className="w-6 h-6" />
                <h2 className="text-lg font-bold">Payment Calculator</h2>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-purple-200 mb-2">
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
                  <p className="text-xs text-purple-200 mt-1">
                    Have documented hours from another program?
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-purple-200 mb-2">
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
                    <div className="text-purple-200 text-xs uppercase mb-1">Remaining Hours</div>
                    <div className="text-2xl font-black">{remainingHours.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-purple-200 text-xs uppercase mb-1">Est. Duration</div>
                    <div className="text-2xl font-black">~{weeks} weeks</div>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="bg-white/10 rounded-xl p-4">
                <div className="text-center">
                  <div className="text-purple-200 text-xs uppercase mb-1">Program Tuition</div>
                  <div className="text-3xl font-black">${PRICING.fullPrice.toLocaleString()}</div>
                </div>
              </div>

              {/* Payment Options */}
              <div className="bg-green-500/20 rounded-xl p-4 mt-4">
                <div className="text-center">
                  <div className="text-green-200 text-xs uppercase mb-1">Payment Options</div>
                  <div className="text-sm text-white mt-2 space-y-1">
                    <p><strong>Pay in Full:</strong> Card or Bank</p>
                    <p><strong>Affirm/Klarna:</strong> Split into payments</p>
                  </div>
                </div>
              </div>

              {/* If not approved for full BNPL */}
              <div className="bg-white/10 rounded-xl p-3 mt-4">
                <p className="text-xs text-purple-200 text-center">
                  If BNPL partially approved, remaining balance split into ~{weeks} weekly payments of ${weeklyDollars.toFixed(2)}
                </p>
              </div>

              <div className="mt-4 flex items-start gap-2">
                <Info className="w-4 h-4 text-purple-200 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-purple-200">
                  Transfer hours reduce program duration, not tuition cost.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Form & Payment */}
          <div className="lg:col-span-3">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 font-medium">{error}</p>
                <a 
                  href="tel:317-314-3757" 
                  className="inline-block mt-2 text-red-600 font-medium hover:underline"
                >
                  Call (317) 314-3757 for help
                </a>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8">
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="(317) 555-0123"
                  />
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
                    <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="hasHostShop"
                        value="yes"
                        checked={formData.hasHostShop === 'yes'}
                        onChange={(e) => updateField('hasHostShop', e.target.value)}
                        className="w-4 h-4 text-purple-600"
                      />
                      <span className="text-black">Yes, I have a shop</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="hasHostShop"
                        value="no"
                        checked={formData.hasHostShop === 'no'}
                        onChange={(e) => updateField('hasHostShop', e.target.value)}
                        className="w-4 h-4 text-purple-600"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
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
                        ? 'border-green-600 bg-green-50' 
                        : 'border-gray-300 bg-white hover:border-gray-400'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-bold text-black text-lg">Pay in Full</p>
                        <p className="text-black text-sm">One-time payment - 5% discount</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600 text-xl">${Math.round(PRICING.fullPrice * 0.95).toLocaleString()}</p>
                        <p className="text-xs text-black line-through">${PRICING.fullPrice.toLocaleString()}</p>
                      </div>
                    </div>
                  </button>

                  {/* Option 2: Payment Plan */}
                  <button
                    type="button"
                    onClick={() => setPaymentOption('weekly')}
                    className={`w-full p-4 rounded-xl border-2 mb-3 text-left transition ${
                      paymentOption === 'weekly' 
                        ? 'border-brand-orange-600 bg-orange-50' 
                        : 'border-gray-300 bg-white hover:border-gray-400'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-bold text-black text-lg">Payment Plan</p>
                        <p className="text-black text-sm">${PRICING.setupFee.toLocaleString()} today + ${weeklyDollars.toFixed(2)}/week</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-brand-orange-600 text-xl">${PRICING.setupFee.toLocaleString()}</p>
                        <p className="text-xs text-black">due today</p>
                      </div>
                    </div>
                  </button>

                  {/* Option 3: Custom Amount */}
                  <button
                    type="button"
                    onClick={() => setPaymentOption('custom')}
                    className={`w-full p-4 rounded-xl border-2 mb-3 text-left transition ${
                      paymentOption === 'custom' 
                        ? 'border-purple-600 bg-purple-50' 
                        : 'border-gray-300 bg-white hover:border-gray-400'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-bold text-black text-lg">Custom Amount</p>
                        <p className="text-black text-sm">Pay what you can today (min ${Math.round(PRICING.fullPrice * 0.35).toLocaleString()})</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-purple-600 text-lg">You Choose</p>
                      </div>
                    </div>
                  </button>

                  {/* Custom Amount Input */}
                  {paymentOption === 'custom' && (
                    <div className="bg-purple-50 rounded-xl p-4 mb-3 border-2 border-purple-200">
                      <label className="block text-sm font-medium text-black mb-2">
                        Enter your payment amount (min ${Math.round(PRICING.fullPrice * 0.35).toLocaleString()})
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
                            const min = Math.round(PRICING.fullPrice * 0.35);
                            if (customAmount < min) setCustomAmount(min);
                            if (customAmount > PRICING.fullPrice) setCustomAmount(PRICING.fullPrice);
                          }}
                          className="w-full px-4 py-3 text-2xl font-bold border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>
                      <p className="text-sm text-black mt-2">
                        Remaining ${(PRICING.fullPrice - customAmount).toLocaleString()} will be billed weekly at ${((PRICING.fullPrice - customAmount) / weeks).toFixed(2)}/week
                      </p>
                    </div>
                  )}

                  {/* Option 4: Affirm */}
                  <button
                    type="button"
                    onClick={() => setPaymentOption('affirm')}
                    className={`w-full p-4 rounded-xl border-2 mb-3 text-left transition ${
                      paymentOption === 'affirm' 
                        ? 'border-blue-600 bg-blue-50' 
                        : 'border-gray-300 bg-white hover:border-gray-400'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-bold text-black text-lg">Affirm</p>
                        <p className="text-black text-sm">Pay over time</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-blue-600 text-lg">You Choose</p>
                        <p className="text-xs text-black">min $50</p>
                      </div>
                    </div>
                  </button>

                  {/* Affirm Amount Input */}
                  {paymentOption === 'affirm' && (
                    <div className="bg-blue-50 rounded-xl p-4 mb-3 border-2 border-blue-200">
                      <label className="block text-sm font-medium text-black mb-2">
                        How much do you want to finance with Affirm? (min $50)
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
                            if (customAmount < 50) setCustomAmount(50);
                            if (customAmount > PRICING.fullPrice) setCustomAmount(PRICING.fullPrice);
                          }}
                          className="w-full px-4 py-3 text-2xl font-bold border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                        : 'border-gray-300 bg-white hover:border-gray-400'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-bold text-black text-lg">Sezzle</p>
                        <p className="text-black text-sm">Pay over time</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-indigo-600 text-lg">You Choose</p>
                        <p className="text-xs text-black">$35 - $2,500</p>
                      </div>
                    </div>
                  </button>

                  {/* Sezzle Amount Input */}
                  {paymentOption === 'sezzle' && (
                    <div className="bg-indigo-50 rounded-xl p-4 mb-3 border-2 border-indigo-200">
                      <label className="block text-sm font-medium text-black mb-2">
                        How much do you want to pay with Sezzle? ($35 - $2,500)
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
                            if (customAmount < 35) setCustomAmount(35);
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
                  <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    <p className="text-sm text-black font-medium mb-3">Payment methods available at checkout:</p>
                    <div className="flex flex-wrap gap-2 justify-center mb-2">
                      <span className="px-3 py-1 bg-black text-white rounded-full text-xs font-bold">Card</span>
                      <span className="px-3 py-1 bg-black text-white rounded-full text-xs font-bold">Apple Pay</span>
                      <span className="px-3 py-1 bg-white text-black border border-black rounded-full text-xs font-bold">Google Pay</span>
                      <span className="px-3 py-1 bg-blue-900 text-white rounded-full text-xs font-bold">Samsung Pay</span>
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">Link</span>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-center mb-2">
                      <span className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-xs font-bold">Klarna</span>
                      <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-bold">Afterpay</span>
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">Zip</span>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-center">
                      <span className="px-3 py-1 bg-green-500 text-white rounded-full text-xs font-bold">Cash App</span>
                      <span className="px-3 py-1 bg-orange-400 text-white rounded-full text-xs font-bold">Amazon Pay</span>
                      <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-xs font-bold">Bank (ACH)</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-3 text-center">
                      Payment options subject to eligibility. Terms and availability vary by provider.
                    </p>
                  </div>
                </div>

                {/* Pay Button */}
                <button
                  onClick={handlePayNow}
                  disabled={loading || !formData.email || !formData.firstName || !formData.lastName || !formData.phone}
                  className="w-full py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 text-lg"
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
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-blue-800 text-sm">
                <strong>Have questions?</strong> Contact us for payment plan options or employer-sponsored funding.{' '}
                <Link href="/inquiry?program=barber-apprenticeship" className="text-blue-700 font-medium hover:underline">
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
