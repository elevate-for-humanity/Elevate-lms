'use client';
import Turnstile from '@/components/Turnstile';

import { useState } from 'react';
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
  
  // Payment calculator state
  const [transferHours, setTransferHours] = useState(0);
  const [hoursPerWeek, setHoursPerWeek] = useState(40);
  
  // Payment option
  const [paymentOption, setPaymentOption] = useState<'weekly' | 'full'>('weekly');
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    hasHostShop: '',
    hostShopName: '',
  });

  const { weeklyDollars, weeks, remainingHours } = calculateWeeklyPayment(hoursPerWeek, transferHours);
  const nextFriday = getNextFriday();

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

      if (paymentOption === 'full') {
        // Pay in full - one-time payment with BNPL options
        checkoutResponse = await fetch('/api/barber/checkout/full', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer_email: formData.email,
            customer_name: `${formData.firstName} ${formData.lastName}`,
            customer_phone: formData.phone,
            application_id: applicationId,
            transferred_hours: transferHours,
            has_host_shop: formData.hasHostShop,
            host_shop_name: formData.hostShopName,
            success_url: `${window.location.origin}/programs/barber-apprenticeship/apply/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${window.location.origin}/programs/barber-apprenticeship/apply`,
          }),
        });
      } else {
        // Weekly payments - subscription model
        checkoutResponse = await fetch('/api/barber/checkout/public', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hours_per_week: hoursPerWeek,
            transferred_hours_verified: transferHours,
            customer_email: formData.email,
            customer_name: `${formData.firstName} ${formData.lastName}`,
            customer_phone: formData.phone,
            application_id: applicationId,
            has_host_shop: formData.hasHostShop,
            host_shop_name: formData.hostShopName,
            success_url: `${window.location.origin}/programs/barber-apprenticeship/apply/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${window.location.origin}/programs/barber-apprenticeship/apply`,
          }),
        });
      }

      const checkoutData = await checkoutResponse.json();

      if (checkoutResponse.ok && checkoutData.url) {
        window.location.href = checkoutData.url;
      } else {
        setError(checkoutData.error || 'Unable to create checkout. Please call Contact Us.');
        setLoading(false);
      }
    } catch {
      setError('Unable to process. Please call Contact Us.');
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
            <div className="bg-brand-blue-600 rounded-2xl p-6 text-white sticky top-8">
              <div className="flex items-center gap-3 mb-4">
                <Calculator className="w-6 h-6" />
                <h2 className="text-lg font-bold">Payment Calculator</h2>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-orange-200 mb-2">
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
                  <p className="text-xs text-orange-200 mt-1">
                    Have documented hours from another program?
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-orange-200 mb-2">
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
                    <div className="text-orange-200 text-xs uppercase mb-1">Remaining Hours</div>
                    <div className="text-2xl font-black">{remainingHours.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-orange-200 text-xs uppercase mb-1">Est. Duration</div>
                    <div className="text-2xl font-black">~{weeks} weeks</div>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="bg-white/10 rounded-xl p-4">
                <div className="text-center">
                  <div className="text-orange-200 text-xs uppercase mb-1">Program Tuition</div>
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
                <p className="text-xs text-orange-200 text-center">
                  If BNPL partially approved, remaining balance split into ~{weeks} weekly payments of ${weeklyDollars.toFixed(2)}
                </p>
              </div>

              <div className="mt-4 flex items-start gap-2">
                <Info className="w-4 h-4 text-orange-200 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-orange-200">
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
                  href="/contact" 
                  className="inline-block mt-2 text-red-600 font-medium hover:underline"
                >
                  Call Contact Us for help
                </a>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Information</h2>
              
              <div className="space-y-5">
                {/* Name */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => updateField('firstName', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500"
                      placeholder="First name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => updateField('lastName', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500"
                      placeholder="Last name"
                    />
                  </div>
                </div>

                {/* Contact */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                        className="w-4 h-4 text-brand-blue-600"
                      />
                      <span className="text-gray-700">Yes, I have a shop</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="hasHostShop"
                        value="no"
                        checked={formData.hasHostShop === 'no'}
                        onChange={(e) => updateField('hasHostShop', e.target.value)}
                        className="w-4 h-4 text-brand-blue-600"
                      />
                      <span className="text-gray-700">No, I need help finding one</span>
                    </label>
                  </div>
                </div>

                {formData.hasHostShop === 'yes' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Shop Name (optional)
                    </label>
                    <input
                      type="text"
                      value={formData.hostShopName}
                      onChange={(e) => updateField('hostShopName', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500"
                      placeholder="Name of the barbershop"
                    />
                  </div>
                )}

                {/* Pay Button */}
                <button
                  onClick={handlePayNow}
                  disabled={loading || !formData.email || !formData.firstName || !formData.lastName || !formData.phone}
                  className="w-full py-4 bg-brand-blue-600 hover:bg-brand-blue-700 disabled:bg-gray-300 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 text-lg"
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

                {/* Payment Methods with BNPL */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <p className="text-center text-sm text-gray-600 mb-3">Pay setup fee with</p>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="flex flex-col items-center p-2 border border-gray-200 rounded-lg bg-gray-50">
                      <CreditCard className="w-5 h-5 text-gray-600" />
                      <span className="text-xs text-gray-500">Card</span>
                    </div>
                    <div className="flex flex-col items-center p-2 border border-gray-200 rounded-lg bg-gray-50">
                      <span className="font-bold text-blue-600 text-xs">affirm</span>
                      <span className="text-xs text-gray-500">0% APR</span>
                    </div>
                    <div className="flex flex-col items-center p-2 border border-gray-200 rounded-lg bg-gray-50">
                      <span className="font-bold text-pink-500 text-xs">Klarna</span>
                      <span className="text-xs text-gray-500">Pay in 4</span>
                    </div>
                  </div>
                  <p className="text-center text-xs text-gray-500">
                    Weekly invoices sent every Friday via email
                  </p>
                </div>

                <p className="text-center text-sm text-gray-500 mt-4">
                  Secure payment via Stripe. You'll receive dashboard access immediately after payment.
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
