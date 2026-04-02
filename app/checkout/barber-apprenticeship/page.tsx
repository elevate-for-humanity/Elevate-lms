'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ShieldCheck, ArrowLeft } from 'lucide-react';
import { BARBER_PRICING } from '@/lib/programs/pricing';

type PaymentType = 'payment_plan' | 'pay_in_full';

export default function BarberCheckoutPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [paymentType, setPaymentType] = useState<PaymentType>('payment_plan');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function update(field: keyof typeof form, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  const isValid = form.name.trim().length > 1 && /\S+@\S+\.\S+/.test(form.email);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || loading) return;
    setError('');
    setLoading(true);

    try {
      // Step 1: Create application record before touching Stripe
      const appRes = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim() || undefined,
          program_slug: 'barber-apprenticeship',
          role: 'student',
          source: 'barber_checkout',
        }),
      });

      if (!appRes.ok) {
        const body = await appRes.json().catch(() => ({}));
        throw new Error(body.error ?? 'Failed to create application');
      }

      const { id: applicationId } = await appRes.json();

      // Step 2: Create Stripe checkout session with application_id in metadata
      const siteUrl = window.location.origin;
      const checkoutRes = await fetch('/api/barber/checkout/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_email: form.email.trim().toLowerCase(),
          customer_name: form.name.trim(),
          customer_phone: form.phone.trim() || undefined,
          application_id: applicationId,
          payment_type: paymentType,
          hours_per_week: 40,
          transferred_hours_verified: 0,
          success_url: `${siteUrl}/checkout/success?type=barber&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${siteUrl}/checkout/barber-apprenticeship?cancelled=true`,
        }),
      });

      if (!checkoutRes.ok) {
        const body = await checkoutRes.json().catch(() => ({}));
        throw new Error(body.error ?? 'Failed to create checkout session');
      }

      const { url } = await checkoutRes.json();
      if (!url) throw new Error('No checkout URL returned');

      // Step 3: Redirect to Stripe
      router.push(url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  const weeklyAmount = BARBER_PRICING.fullPrice - BARBER_PRICING.minDownPayment;
  const weeklyPayment = (weeklyAmount / BARBER_PRICING.paymentTermWeeks).toFixed(2);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-lg mx-auto px-4 py-10">

        {/* Back link */}
        <Link
          href="/programs/barber-apprenticeship"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to program
        </Link>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Barber Apprenticeship Enrollment</h1>
          <p className="text-slate-500 text-sm mb-6">Self-pay enrollment. Your application is created before payment — no surprises.</p>

          {/* Payment option selector */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() => setPaymentType('payment_plan')}
              className={`rounded-xl border-2 p-4 text-left transition-all ${paymentType === 'payment_plan' ? 'border-brand-red-600 bg-brand-red-50' : 'border-slate-200 hover:border-slate-300'}`}
            >
              <div className="font-bold text-slate-900 text-sm mb-0.5">Payment Plan</div>
              <div className="text-xs text-slate-500">${BARBER_PRICING.minDownPayment} down, then ${weeklyPayment}/wk</div>
            </button>
            <button
              type="button"
              onClick={() => setPaymentType('pay_in_full')}
              className={`rounded-xl border-2 p-4 text-left transition-all ${paymentType === 'pay_in_full' ? 'border-brand-red-600 bg-brand-red-50' : 'border-slate-200 hover:border-slate-300'}`}
            >
              <div className="font-bold text-slate-900 text-sm mb-0.5">Pay in Full</div>
              <div className="text-xs text-slate-500">${BARBER_PRICING.fullPrice.toLocaleString()} total</div>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full name <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={form.name}
                onChange={e => update('name', e.target.value)}
                placeholder="First and last name"
                required
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-red-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email address <span className="text-red-500">*</span></label>
              <input
                type="email"
                value={form.email}
                onChange={e => update('email', e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-red-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone <span className="text-slate-400 font-normal">(optional)</span></label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => update('phone', e.target.value)}
                placeholder="(317) 555-0100"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-red-500 focus:border-transparent"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!isValid || loading}
              className="w-full bg-brand-red-600 hover:bg-brand-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Creating your application…</>
              ) : (
                `Continue to Payment — $${paymentType === 'pay_in_full' ? BARBER_PRICING.fullPrice.toLocaleString() : BARBER_PRICING.minDownPayment} today`
              )}
            </button>
          </form>

          <div className="mt-5 flex items-start gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>Your application is created before payment. Paid applicants are reviewed and approved before onboarding begins. Payments processed securely by Stripe.</span>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">
          Not ready to pay?{' '}
          <Link href="/funding?program=barber-apprenticeship" className="text-brand-red-600 hover:underline">
            Check if you qualify for funded training
          </Link>
        </p>
      </div>
    </div>
  );
}
