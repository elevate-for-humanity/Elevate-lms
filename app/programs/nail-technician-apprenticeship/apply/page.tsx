'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, CheckCircle, CreditCard } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PAYMENT_LINKS } from '@/lib/stripe/price-map';

type FundingType = 'wioa' | 'self_pay' | 'employer' | 'unsure';

const FUNDING_OPTIONS: { value: FundingType; label: string; desc: string; badge?: string }[] = [
  {
    value: 'wioa',
    label: 'WIOA / WorkOne',
    desc: 'Free for eligible unemployed or underemployed Indiana residents.',
    badge: 'Most common',
  },
  {
    value: 'employer',
    label: 'Employer Sponsored',
    desc: 'Your employer or a workforce grant covers your tuition.',
  },
  {
    value: 'self_pay',
    label: 'Self-Pay',
    desc: 'Pay out of pocket. Full payment ($5,000) or 35% deposit ($1,750) + payment plan.',
  },
  {
    value: 'unsure',
    label: 'Not Sure',
    desc: "We'll help you find the right funding option during your intake call.",
  },
];

export default function NailTechApplyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fundingType, setFundingType] = useState<FundingType>('wioa');
  const [paymentPlan, setPaymentPlan] = useState<'full' | 'deposit'>('deposit');

  // Auth guard
  useEffect(() => {
    const checkAuth = async () => {
      const { createBrowserClient } = await import('@supabase/ssr');
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = '/login?redirect=/programs/nail-technician-apprenticeship/apply';
      }
    };
    checkAuth();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const form = e.currentTarget;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const data = {
      firstName: (form.elements.namedItem('firstName') as HTMLInputElement).value,
      lastName: (form.elements.namedItem('lastName') as HTMLInputElement).value,
      email,
      phone: (form.elements.namedItem('phone') as HTMLInputElement).value,
      city: (form.elements.namedItem('city') as HTMLInputElement).value,
      program: 'nail-technician-apprenticeship',
      programSlug: 'nail-technician-apprenticeship',
      programName: 'Nail Technician Apprenticeship',
      fundingType,
      source: 'program-page',
    };

    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'Submission failed. Please try again.');
      }

      // Self-pay: redirect to Stripe
      if (fundingType === 'self_pay') {
        const link = paymentPlan === 'full'
          ? PAYMENT_LINKS.nailTech.full
          : PAYMENT_LINKS.nailTech.deposit;
        const emailParam = encodeURIComponent(email);
        window.location.href = `${link}?prefilled_email=${emailParam}`;
        return;
      }

      router.push('/programs/nail-technician-apprenticeship/apply/success');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-xl mx-auto">
        <Link href="/programs/nail-technician-apprenticeship" className="inline-flex items-center gap-2 text-sm text-black hover:text-slate-700 mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Program
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="mb-6">
            <span className="text-xs font-bold text-brand-green-600 uppercase tracking-wider">DOL Registered Apprenticeship</span>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-1">Nail Technician Apprenticeship Application</h1>
            <p className="text-black text-sm mt-2">
              Earn while you learn. Complete this form to begin your application — our team will contact you within 1 business day.
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 mb-6 space-y-2">
            {[
              'Free to apply — no cost to submit',
              'Earn wages from day one of training',
              'Indiana Nail Technician License upon completion',
              'Flexible scheduling around your life',
            ].map((item) => (
              <div key={item} className="flex items-start gap-2 text-sm text-slate-700">
                <CheckCircle className="w-4 h-4 text-brand-green-500 flex-shrink-0 mt-0.5" />
                {item}
              </div>
            ))}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-5">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="firstName">First Name *</label>
                <input id="firstName" name="firstName" type="text" required className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="lastName">Last Name *</label>
                <input id="lastName" name="lastName" type="text" required className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="email">Email Address *</label>
              <input id="email" name="email" type="email" required className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="phone">Phone Number *</label>
              <input id="phone" name="phone" type="tel" required className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="city">City *</label>
              <input id="city" name="city" type="text" required className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" />
            </div>

            {/* Funding type */}
            <div>
              <p className="text-xs font-bold text-slate-700 mb-2">How will you fund your training? *</p>
              <div className="space-y-2">
                {FUNDING_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-colors ${
                      fundingType === opt.value
                        ? 'border-slate-900 bg-slate-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="fundingType"
                      value={opt.value}
                      checked={fundingType === opt.value}
                      onChange={() => setFundingType(opt.value)}
                      className="mt-0.5 accent-slate-900"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-slate-900">{opt.label}</span>
                        {opt.badge && (
                          <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">{opt.badge}</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Self-pay plan */}
            {fundingType === 'self_pay' && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard className="w-4 h-4 text-slate-600" />
                  <p className="text-xs font-bold text-slate-700">Payment option</p>
                </div>
                <label className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer bg-white ${paymentPlan === 'deposit' ? 'border-slate-900' : 'border-slate-200'}`}>
                  <input type="radio" name="paymentPlan" value="deposit" checked={paymentPlan === 'deposit'} onChange={() => setPaymentPlan('deposit')} className="mt-0.5 accent-slate-900" />
                  <div>
                    <p className="text-xs font-semibold text-slate-900">35% Deposit + Payment Plan</p>
                    <p className="text-xs text-slate-500 mt-0.5">$1,750 today, then 6 monthly payments of $542. Total: $5,000.</p>
                    <p className="text-xs text-green-700 font-medium mt-1">BNPL eligible — Klarna, Afterpay, Zip, Affirm</p>
                  </div>
                </label>
                <label className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer bg-white ${paymentPlan === 'full' ? 'border-slate-900' : 'border-slate-200'}`}>
                  <input type="radio" name="paymentPlan" value="full" checked={paymentPlan === 'full'} onChange={() => setPaymentPlan('full')} className="mt-0.5 accent-slate-900" />
                  <div>
                    <p className="text-xs font-semibold text-slate-900">Pay in Full — $5,000</p>
                    <p className="text-xs text-slate-500 mt-0.5">Card, bank transfer, or BNPL accepted.</p>
                  </div>
                </label>
                <p className="text-xs text-slate-400 pt-1">You&apos;ll be redirected to secure Stripe checkout after submitting.</p>
              </div>
            )}

            {(fundingType === 'wioa' || fundingType === 'employer') && (
              <div className="rounded-xl border border-green-200 bg-green-50 p-3 flex gap-3">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-green-900">No payment required today</p>
                  <p className="text-xs text-green-800 mt-0.5">Our team will verify your funding eligibility within 1–2 business days.</p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-red-600 hover:bg-brand-red-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
              ) : fundingType === 'self_pay' ? (
                <><CreditCard className="w-4 h-4" /> Submit &amp; Pay</>
              ) : (
                'Submit Application'
              )}
            </button>
            <p className="text-xs text-black text-center">
              Questions? <a href="tel:3173143757" className="text-brand-blue-600 hover:underline">(317) 314-3757</a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
