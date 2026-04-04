'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Loader2, CreditCard, Info, Shield } from 'lucide-react';

const PRICING = {
  totalWeeks: 20,
  fullPrice: 5000,
  depositPct: 0.20, // 20% down — constant
  get depositAmount() { return Math.round(this.fullPrice * this.depositPct); },
  get remainingBalance() { return this.fullPrice - this.depositAmount; },
};

// Minimum weekly payment = remaining balance ÷ program weeks
const MIN_WEEKLY = Math.ceil((PRICING.remainingBalance / PRICING.totalWeeks) * 100) / 100;

function calcWeekly(customWeekly: number) {
  const weekly = Math.max(MIN_WEEKLY, customWeekly);
  const weeksNeeded = Math.ceil(PRICING.remainingBalance / weekly);
  const lastPayment = PRICING.remainingBalance - weekly * (weeksNeeded - 1);
  return { weekly, weeksNeeded, lastPayment };
}

export default function HvacApplyPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorSeverity, setErrorSeverity] = useState<'info' | 'critical'>('info');

  const [paymentOption, setPaymentOption] = useState<'weekly' | 'full' | 'custom' | 'sezzle' | 'affirm' | 'stripe-bnpl'>('weekly');
  // customWeekly: user-entered weekly amount (must be >= MIN_WEEKLY)
  const [customWeekly, setCustomWeekly] = useState(MIN_WEEKLY);
  // customAmount: used by Affirm/Sezzle for their amount input
  const [customAmount, setCustomAmount] = useState(PRICING.depositAmount);

  const { weekly: structuredWeekly, weeksNeeded } = calcWeekly(MIN_WEEKLY);
  const { weekly: userWeekly, weeksNeeded: userWeeks, lastPayment } = calcWeekly(customWeekly);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    experience: '',
    fundingInterest: '',
  });

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
          program: 'HVAC Technician',
          programSlug: 'hvac-technician',
          fundingType: formData.fundingInterest === 'self-pay' ? 'self-pay' : formData.fundingInterest,
          source: 'program-page',
          paymentOption,
        }),
      });

      const appData = await appResponse.json();
      const applicationId = appData?.id;

      if (!appResponse.ok) {
        setError(appData.error || 'Failed to submit application. Please try again.');
        setErrorSeverity('critical');
        setLoading(false);
        return;
      }

      // Non-self-pay: application saved, redirect to success page (no payment needed)
      if (formData.fundingInterest && formData.fundingInterest !== 'self-pay') {
        window.location.href = `/programs/hvac-technician/apply/success${applicationId ? `?id=${applicationId}` : ''}`;
        return;
      }

      if (paymentOption === 'affirm') {
        const affirmAmount = Math.max(PRICING.depositAmount, customAmount);
        const checkoutResponse = await fetch('/api/affirm/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            programId: 'hvac-technician',
            programSlug: 'hvac-technician',
            programName: 'HVAC Technician',
            amount: affirmAmount,
            paymentOption: affirmAmount >= PRICING.fullPrice ? 'full' : 'deposit',
            applicationId,
          }),
        });

        const affirmData = await checkoutResponse.json();

        if (!checkoutResponse.ok || !affirmData.checkoutConfig) {
          setError(affirmData.error || 'Affirm is temporarily unavailable. Please select another payment option.');
          setErrorSeverity('info');
          setLoading(false);
          return;
        }

        try {
          const affirmJsUrl = affirmData.affirmJsUrl || 'https://cdn1.affirm.com/js/v2/affirm.js';
          (window as any)._affirm_config = {
            public_api_key: affirmData.publicKey,
            script: affirmJsUrl,
          };

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

          const affirmSdk = (window as any).affirm;
          if (affirmSdk?.checkout) {
            affirmSdk.checkout(affirmData.checkoutConfig);
            affirmSdk.checkout.open();
          } else {
            throw new Error('Affirm SDK not available');
          }
        } catch {
          setError('Affirm checkout could not load. Please select another payment option.');
          setErrorSeverity('info');
          setLoading(false);
        }
        return;
      }

      if (paymentOption === 'sezzle') {
        const sezzleAmount = Math.min(2500, Math.max(PRICING.depositAmount, customAmount));
        const checkoutResponse = await fetch('/api/sezzle/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            programId: 'hvac-technician',
            programSlug: 'hvac-technician',
            programName: 'HVAC Technician',
            amount: sezzleAmount,
            paymentOption: sezzleAmount >= PRICING.fullPrice ? 'full' : 'deposit',
            description: `HVAC Technician - $${sezzleAmount} payment via Sezzle`,
            applicationId,
          }),
        });

        const sezzleData = await checkoutResponse.json();

        if (checkoutResponse.ok && sezzleData.checkoutUrl) {
          window.location.href = sezzleData.checkoutUrl;
        } else {
          setError(sezzleData.error || 'Sezzle is temporarily unavailable. Please select another payment option.');
          setErrorSeverity('info');
          setLoading(false);
        }
        return;
      }

      // Stripe BNPL (Afterpay/Klarna) — routes through same Stripe Checkout endpoint
      // with BNPL payment methods enabled on the session
      if (paymentOption === 'stripe-bnpl') {
        const bnplResponse = await fetch('/api/enrollments/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            programSlug: 'hvac-technician',
            fundingSource: 'self_pay',
            paymentMethod: 'bnpl',
          }),
        });
        const bnplData = await bnplResponse.json();
        if (bnplResponse.ok && (bnplData.checkoutUrl || bnplData.url)) {
          window.location.href = bnplData.checkoutUrl || bnplData.url;
        } else {
          setError(bnplData.error || bnplData.err || 'Afterpay/Klarna checkout unavailable. Please select another option.');
          setErrorSeverity('info');
          setLoading(false);
        }
        return;
      }

      // Stripe checkout (full or weekly)
      const checkoutResponse = await fetch('/api/enrollments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          programSlug: 'hvac-technician',
        }),
      });

      const checkoutData = await checkoutResponse.json();

      // API returns checkoutUrl (not url)
      if (checkoutResponse.ok && (checkoutData.checkoutUrl || checkoutData.url)) {
        window.location.href = checkoutData.checkoutUrl || checkoutData.url;
      } else {
        setError(checkoutData.error || checkoutData.err || 'Unable to create checkout. Please try again.');
        setErrorSeverity('critical');
        setLoading(false);
      }
    } catch {
      setError('Something went wrong. Please try again or select a different payment option.');
      setErrorSeverity('critical');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative w-full">
        <div className="relative h-[50vh] sm:h-[55vh] md:h-[60vh] lg:h-[65vh] min-h-[320px] w-full overflow-hidden">
          <Image
            src="/images/pages/programs-hvac-apply-hero.jpg"
            alt="HVAC technician working on an air conditioning unit"
            fill
            className="object-cover"
            priority
           sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
        </div>
        <div className="bg-white py-10 border-t">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">Apply Now</h1>
            <p className="text-lg text-black max-w-3xl mx-auto">HVAC Technician — 12 Weeks, 6 Credentials</p>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <Link href="/programs/hvac-technician" className="inline-flex items-center gap-2 text-brand-blue-600 hover:text-brand-blue-700 font-medium mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Program Details
        </Link>

        <div className="grid lg:grid-cols-5 gap-8">

          {/* Left Column - Program Info (pricing only shows for self-pay) */}
          <div className="lg:col-span-2">
            <div className="bg-brand-blue-700 rounded-2xl p-6 text-white sticky top-8">

              <div className="bg-white/10 rounded-xl p-4 mb-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-white text-xs uppercase mb-1">Duration</div>
                    <div className="text-2xl font-black">20 Weeks</div>
                  </div>
                  <div>
                    <div className="text-white text-xs uppercase mb-1">Credentials</div>
                    <div className="text-2xl font-black">6</div>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 rounded-xl p-4 mb-4">
                <h3 className="font-bold text-sm mb-2">Credentials Earned</h3>
                <ul className="text-xs text-white space-y-1">
                  <li>• Residential HVAC Certification 1</li>
                  <li>• Residential HVAC Certification 2</li>
                  <li>• EPA 608 Universal Certification</li>
                  <li>• OSHA 10 Construction Safety</li>
                  <li>• CPR / First Aid Certification</li>
                </ul>
              </div>

              {/* Pricing card — only for self-pay */}
              {formData.fundingInterest === 'self-pay' && (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <CreditCard className="w-6 h-6" />
                    <h2 className="text-lg font-bold">Program Cost</h2>
                  </div>

                  <div className="bg-white/10 rounded-xl p-4 mb-4">
                    <div className="text-center">
                      <div className="text-white text-xs uppercase mb-1">Total Tuition</div>
                      <div className="text-3xl font-black">${PRICING.fullPrice.toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="bg-white/20 rounded-xl p-4">
                    <div className="text-center">
                      <div className="text-white text-xs uppercase mb-1">Payment Options</div>
                      <div className="text-sm text-black mt-2 space-y-1 text-left">
                        <p><strong>20% down:</strong> ${PRICING.depositAmount.toLocaleString()} today</p>
                        <p><strong>Structured weekly:</strong> ${structuredWeekly}/wk × {weeksNeeded} wks</p>
                        <p><strong>Custom weekly:</strong> any amount ≥ ${MIN_WEEKLY}/wk</p>
                        <p><strong>Pay in full:</strong> ${PRICING.fullPrice.toLocaleString()}</p>
                        <p><strong>BNPL:</strong> Affirm · Sezzle · Afterpay · Klarna</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Funding note — for non-self-pay */}
              {formData.fundingInterest && formData.fundingInterest !== 'self-pay' && (
                <div className="bg-white/20 rounded-xl p-4">
                  <div className="text-center">
                    <div className="text-white text-xs uppercase mb-1">Tuition</div>
                    <div className="text-2xl font-black">May be covered</div>
                    <p className="text-sm text-white mt-2">
                      through workforce funding for eligible students
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-4 flex items-start gap-2">
                <Info className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                <p className="text-xs text-white">
                  Select your funding option in the form. WIOA and Workforce Ready Grant may cover full tuition for eligible students.
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
                  <a href="/support" className="inline-block mt-2 text-brand-red-600 font-medium hover:underline">
                    Need help? Contact support
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
                    <label className="block text-sm font-medium text-black mb-1">First Name *</label>
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
                    <label className="block text-sm font-medium text-black mb-1">Last Name *</label>
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
                  <label className="block text-sm font-medium text-black mb-1">Email *</label>
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
                  <label className="block text-sm font-medium text-black mb-1">Phone *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500"
                    placeholder="(317) 314-3757"
                  />
                </div>

                {/* Experience */}
                <div>
                  <label className="block text-sm font-medium text-black mb-1">HVAC Experience</label>
                  <select
                    value={formData.experience}
                    onChange={(e) => updateField('experience', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500"
                  >
                    <option value="">Select experience level</option>
                    <option value="none">No prior experience</option>
                    <option value="some">Some hands-on experience</option>
                    <option value="related">Related trade experience (electrical, plumbing)</option>
                    <option value="hvac">Previous HVAC training or work</option>
                  </select>
                </div>

                {/* Funding Interest */}
                <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-4">
                  <label className="block text-sm font-medium text-brand-blue-900 mb-2">
                    How do you plan to pay for training?
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="fundingInterest"
                        value="self-pay"
                        checked={formData.fundingInterest === 'self-pay'}
                        onChange={(e) => updateField('fundingInterest', e.target.value)}
                        className="w-4 h-4 text-brand-blue-600"
                      />
                      <span className="text-brand-blue-800">Self-pay (card, BNPL, or payment plan)</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="fundingInterest"
                        value="wioa"
                        checked={formData.fundingInterest === 'wioa'}
                        onChange={(e) => updateField('fundingInterest', e.target.value)}
                        className="w-4 h-4 text-brand-blue-600"
                      />
                      <span className="text-brand-blue-800">WIOA funding (no cost if eligible)</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="fundingInterest"
                        value="wrg"
                        checked={formData.fundingInterest === 'wrg'}
                        onChange={(e) => updateField('fundingInterest', e.target.value)}
                        className="w-4 h-4 text-brand-blue-600"
                      />
                      <span className="text-brand-blue-800">Workforce Ready Grant / Next Level Jobs (no cost if eligible)</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="fundingInterest"
                        value="employer"
                        checked={formData.fundingInterest === 'employer'}
                        onChange={(e) => updateField('fundingInterest', e.target.value)}
                        className="w-4 h-4 text-brand-blue-600"
                      />
                      <span className="text-brand-blue-800">Employer-sponsored</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="fundingInterest"
                        value="unsure"
                        checked={formData.fundingInterest === 'unsure'}
                        onChange={(e) => updateField('fundingInterest', e.target.value)}
                        className="w-4 h-4 text-brand-blue-600"
                      />
                      <span className="text-brand-blue-800">Not sure — help me find funding</span>
                    </label>
                  </div>
                </div>

                {/* Payment Options — only show for self-pay */}
                {formData.fundingInterest === 'self-pay' && (
                  <>
                    <h3 className="text-lg font-bold text-black pt-4">Select Payment Method</h3>

                    {/* Deposit notice — always shown */}
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-2">
                      <p className="text-sm font-semibold text-amber-800">
                        All plans require a <strong>20% deposit (${PRICING.depositAmount.toLocaleString()})</strong> at enrollment.
                        The remaining ${PRICING.remainingBalance.toLocaleString()} is paid per your chosen schedule.
                      </p>
                    </div>

                    <div className="space-y-3">

                      {/* Option 1: Structured weekly */}
                      <button
                        type="button"
                        onClick={() => setPaymentOption('weekly')}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all ${paymentOption === 'weekly' ? 'border-brand-blue-600 bg-brand-blue-50' : 'border-slate-200 hover:border-slate-300'}`}
                      >
                        <p className="font-bold text-black text-lg">Structured Weekly Plan</p>
                        <p className="text-sm text-black mt-1">
                          ${PRICING.depositAmount.toLocaleString()} down today, then <strong>${structuredWeekly.toFixed(2)}/week</strong> for {weeksNeeded} weeks
                        </p>
                        <p className="text-xs text-black mt-0.5">Minimum weekly payment — balance paid in full by program end</p>
                      </button>

                      {/* Option 2: Custom weekly */}
                      <button
                        type="button"
                        onClick={() => setPaymentOption('custom')}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all ${paymentOption === 'custom' ? 'border-brand-blue-600 bg-brand-blue-50' : 'border-slate-200 hover:border-slate-300'}`}
                      >
                        <p className="font-bold text-black text-lg">Custom Weekly Amount</p>
                        <p className="text-sm text-black mt-1">
                          Pay more per week to finish faster. Minimum ${structuredWeekly.toFixed(2)}/week.
                        </p>
                      </button>

                      {paymentOption === 'custom' && (
                        <div className="ml-4 p-4 bg-white rounded-lg border border-slate-200 space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                              Weekly payment amount (min ${structuredWeekly.toFixed(2)})
                            </label>
                            <input
                              type="number"
                              min={structuredWeekly}
                              max={PRICING.remainingBalance}
                              step={5}
                              value={customWeekly}
                              onChange={(e) => setCustomWeekly(Math.max(MIN_WEEKLY, parseFloat(e.target.value) || MIN_WEEKLY))}
                              className="w-full px-4 py-3 border border-slate-300 rounded-lg"
                            />
                          </div>
                          <div className="bg-white rounded-lg p-3 border border-slate-200 text-sm space-y-1">
                            <p className="text-slate-700"><strong>${userWeekly.toFixed(2)}/week</strong> × {userWeeks - 1} weeks</p>
                            <p className="text-black">Final payment: ${lastPayment.toFixed(2)}</p>
                            <p className="text-brand-green-700 font-semibold">Total: ${PRICING.fullPrice.toLocaleString()}</p>
                          </div>
                        </div>
                      )}

                      {/* Option 3: Pay in full */}
                      <button
                        type="button"
                        onClick={() => setPaymentOption('full')}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all ${paymentOption === 'full' ? 'border-brand-blue-600 bg-brand-blue-50' : 'border-slate-200 hover:border-slate-300'}`}
                      >
                        <p className="font-bold text-black text-lg">Pay in Full</p>
                        <p className="text-sm text-black mt-1">
                          ${PRICING.fullPrice.toLocaleString()} — Visa, Mastercard, Amex, Apple Pay, Google Pay
                        </p>
                      </button>

                      {/* Option 4: Affirm */}
                      <button
                        type="button"
                        onClick={() => setPaymentOption('affirm')}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all ${paymentOption === 'affirm' ? 'border-brand-blue-600 bg-brand-blue-50' : 'border-slate-200 hover:border-slate-300'}`}
                      >
                        <p className="font-bold text-black text-lg">Affirm</p>
                        <p className="text-sm text-black mt-1">Monthly installments. 0% APR available for qualifying applicants.</p>
                      </button>

                      {paymentOption === 'affirm' && (
                        <div className="ml-4 p-4 bg-white rounded-lg border border-slate-200">
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Amount to finance with Affirm (min ${PRICING.depositAmount.toLocaleString()})
                          </label>
                          <input
                            type="number"
                            min={PRICING.depositAmount}
                            max={PRICING.fullPrice}
                            step={50}
                            value={customAmount}
                            onChange={(e) => setCustomAmount(Math.max(PRICING.depositAmount, parseInt(e.target.value) || PRICING.depositAmount))}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg"
                          />
                          <p className="text-xs text-black mt-2">Affirm checks eligibility and shows payment options at checkout</p>
                        </div>
                      )}

                      {/* Option 5: Sezzle */}
                      <button
                        type="button"
                        onClick={() => setPaymentOption('sezzle')}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all ${paymentOption === 'sezzle' ? 'border-brand-blue-600 bg-brand-blue-50' : 'border-slate-200 hover:border-slate-300'}`}
                      >
                        <p className="font-bold text-black text-lg">Sezzle</p>
                        <p className="text-sm text-black mt-1">4 interest-free payments over 6 weeks (up to $2,500)</p>
                      </button>

                      {paymentOption === 'sezzle' && (
                        <div className="ml-4 p-4 bg-white rounded-lg border border-slate-200">
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Amount to pay with Sezzle (${PRICING.depositAmount.toLocaleString()} – $2,500)
                          </label>
                          <input
                            type="number"
                            min={PRICING.depositAmount}
                            max={2500}
                            step={50}
                            value={customAmount}
                            onChange={(e) => setCustomAmount(Math.min(2500, Math.max(PRICING.depositAmount, parseInt(e.target.value) || PRICING.depositAmount)))}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg"
                          />
                          <p className="text-xs text-black mt-2">
                            4 payments of ${Math.round((customAmount || 0) / 4).toLocaleString()} every 2 weeks
                          </p>
                        </div>
                      )}

                      {/* Option 6: Afterpay / Klarna via Stripe */}
                      <button
                        type="button"
                        onClick={() => setPaymentOption('stripe-bnpl')}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all ${paymentOption === 'stripe-bnpl' ? 'border-brand-blue-600 bg-brand-blue-50' : 'border-slate-200 hover:border-slate-300'}`}
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-black text-lg">Afterpay / Klarna</p>
                          <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">via Stripe</span>
                        </div>
                        <p className="text-sm text-black mt-1">
                          4 interest-free payments with Afterpay, or flexible monthly payments with Klarna.
                        </p>
                      </button>

                      {paymentOption === 'stripe-bnpl' && (
                        <div className="ml-4 p-4 bg-brand-blue-50 rounded-lg border border-brand-blue-200 text-sm text-brand-blue-800 space-y-1">
                          <p className="font-semibold">How it works:</p>
                          <p>• <strong>Afterpay</strong> — 4 payments of ~${(PRICING.fullPrice / 4).toLocaleString()} every 2 weeks, 0% interest</p>
                          <p>• <strong>Klarna</strong> — pay later or monthly installments at checkout</p>
                          <p className="text-xs text-brand-blue-600 mt-2">Eligibility determined at checkout. Billing address required.</p>
                        </div>
                      )}

                    </div>

                    {/* Payment methods accepted */}
                    <div className="bg-white rounded-lg p-4 border border-slate-200">
                      <p className="text-sm text-black font-medium mb-3">Payment methods accepted at checkout:</p>
                      <div className="flex flex-wrap gap-2">
                        {['Visa', 'Mastercard', 'Amex', 'Discover', 'Apple Pay', 'Google Pay', 'Afterpay', 'Klarna', 'Affirm', 'Sezzle'].map(m => (
                          <span key={m} className="px-2 py-1 bg-white border border-slate-200 rounded text-xs text-black">{m}</span>
                        ))}
                      </div>
                      <p className="text-xs text-black mt-3">
                        Secure payment via Stripe. BNPL options (Afterpay, Klarna, Affirm, Sezzle) available for self-pay enrollments.
                      </p>
                    </div>
                  </>
                )}

                {/* Funding-assisted message */}
                {(formData.fundingInterest === 'wioa' || formData.fundingInterest === 'wrg' || formData.fundingInterest === 'employer' || formData.fundingInterest === 'unsure') && (
                  <div className="bg-brand-green-50 border border-brand-green-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-brand-green-800">No payment required today</p>
                        <p className="text-sm text-brand-green-700 mt-1">
                          Submit your application and our enrollment team will contact you within 2 business days to verify your funding eligibility and walk you through next steps.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  onClick={handlePayNow}
                  disabled={loading}
                  className="w-full bg-brand-red-600 hover:bg-brand-red-700 text-white py-4 rounded-xl font-bold text-lg transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : formData.fundingInterest === 'self-pay' ? (
                    <>
                      <CreditCard className="w-5 h-5" />
                      {paymentOption === 'full'
                        ? `Pay $${PRICING.fullPrice.toLocaleString()} Now`
                        : paymentOption === 'affirm' || paymentOption === 'sezzle'
                          ? `Continue with ${paymentOption === 'affirm' ? 'Affirm' : 'Sezzle'}`
                          : `Pay $${PRICING.depositAmount.toLocaleString()} Deposit`}
                    </>
                  ) : (
                    'Submit Application'
                  )}
                </button>

                <p className="text-xs text-black text-center">
                  By submitting, you agree to our{' '}
                  <Link href="/terms-of-service" className="underline">Terms of Service</Link> and{' '}
                  <Link href="/privacy-policy" className="underline">Privacy Policy</Link>.
                </p>
              </div>
            </div>

            {/* Help */}
            <div className="mt-6 bg-white rounded-xl p-6 border border-slate-200">
              <h3 className="font-bold text-slate-900 mb-2">Need Help?</h3>
              <p className="text-sm text-black mb-3">
                Our enrollment team can help you find funding, answer questions, or walk you through the application.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/support" className="text-brand-blue-600 font-medium hover:underline text-sm">
                  Contact Support →
                </Link>
                <Link href="/funding" className="text-brand-blue-600 font-medium hover:underline text-sm">
                  Explore Funding Options →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
