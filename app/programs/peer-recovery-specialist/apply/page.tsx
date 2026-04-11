'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle, CreditCard, Loader2 } from 'lucide-react';
import { PAYMENT_LINKS } from '@/lib/stripe/price-map';

type FundingType = 'wioa' | 'self_pay' | 'employer' | 'unsure';

const FUNDING_OPTIONS: { value: FundingType; label: string; desc: string; badge?: string }[] = [
  {
    value: 'wioa',
    label: 'WIOA / WorkOne',
    desc: 'Free for eligible unemployed or underemployed Indiana residents. Covers full tuition.',
    badge: 'Most common',
  },
  {
    value: 'employer',
    label: 'Job Ready Indy / Employer Sponsored',
    desc: 'Employer or Justice Reinvestment Initiative covers your tuition.',
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

export default function PeerRecoveryApplyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fundingType, setFundingType] = useState<FundingType>('wioa');
  const [paymentPlan, setPaymentPlan] = useState<'full' | 'deposit'>('deposit');
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    city: '', zip: '', contactPreference: 'phone',
  });

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
        window.location.href = '/login?redirect=/programs/peer-recovery-specialist/apply';
      }
    };
    checkAuth();
  }, []);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          city: form.city,
          zip: form.zip,
          program: 'peer-recovery-specialist',
          programSlug: 'peer-recovery-specialist',
          programName: 'Peer Recovery Specialist',
          fundingType,
          contactPreference: form.contactPreference,
          source: 'program-page',
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Submission failed.'); return; }

      // Self-pay: redirect to Stripe payment link
      if (fundingType === 'self_pay') {
        const link = paymentPlan === 'full'
          ? PAYMENT_LINKS.peerRecovery.full
          : PAYMENT_LINKS.peerRecovery.deposit;
        const emailParam = encodeURIComponent(form.email);
        window.location.href = `${link}?prefilled_email=${emailParam}`;
        return;
      }

      router.push(`/programs/peer-recovery-specialist/apply/success${data.id ? `?id=${data.id}` : ''}`);
    } catch {
      setError('Unexpected error. Please call 317-314-3757.');
    } finally {
      setLoading(false);
    }
  }

  const field = 'w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-slate-500 focus:outline-none';

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-2xl px-6 py-12">
        <Link href="/programs/peer-recovery-specialist" className="inline-flex items-center gap-2 text-sm text-black hover:text-slate-900 mb-8">
          ← Back to program
        </Link>
        <h1 className="text-3xl font-bold">Apply — Peer Recovery Specialist</h1>
        <p className="mt-2 text-black">WIOA and Job Ready Indy funding available for eligible Indiana residents. 8-week program.</p>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {/* Personal info */}
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">First name *</label>
                <input required className={field} value={form.firstName} onChange={(e) => set('firstName', e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Last name *</label>
                <input required className={field} value={form.lastName} onChange={(e) => set('lastName', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Email *</label>
              <input required type="email" className={field} value={form.email} onChange={(e) => set('email', e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Phone *</label>
              <input required type="tel" className={field} value={form.phone} onChange={(e) => set('phone', e.target.value)} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">City *</label>
                <input required className={field} value={form.city} onChange={(e) => set('city', e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">ZIP *</label>
                <input required className={field} value={form.zip} onChange={(e) => set('zip', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Preferred contact</label>
              <select className={field} value={form.contactPreference} onChange={(e) => set('contactPreference', e.target.value)}>
                <option value="phone">Phone</option>
                <option value="email">Email</option>
                <option value="text">Text</option>
              </select>
            </div>
          </div>

          {/* Funding type */}
          <div>
            <p className="text-sm font-semibold text-slate-900 mb-3">How will you fund your training? *</p>
            <div className="space-y-2">
              {FUNDING_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-colors ${
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
                      <span className="text-sm font-semibold text-slate-900">{opt.label}</span>
                      {opt.badge && (
                        <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">{opt.badge}</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Self-pay plan selector */}
          {fundingType === 'self_pay' && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <CreditCard className="w-4 h-4 text-slate-600" />
                <p className="text-sm font-semibold text-slate-900">Choose your payment option</p>
              </div>
              <label className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-colors bg-white ${paymentPlan === 'deposit' ? 'border-slate-900' : 'border-slate-200 hover:border-slate-300'}`}>
                <input
                  type="radio"
                  name="paymentPlan"
                  value="deposit"
                  checked={paymentPlan === 'deposit'}
                  onChange={() => setPaymentPlan('deposit')}
                  className="mt-0.5 accent-slate-900"
                />
                <div>
                  <p className="text-sm font-semibold text-slate-900">35% Deposit + Payment Plan</p>
                  <p className="text-xs text-slate-600 mt-0.5">$1,750 today, then 6 monthly payments of $542. Total: $5,000.</p>
                  <p className="text-xs text-green-700 font-medium mt-1">BNPL eligible — Klarna, Afterpay, Zip, Affirm available on deposit</p>
                </div>
              </label>
              <label className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-colors bg-white ${paymentPlan === 'full' ? 'border-slate-900' : 'border-slate-200 hover:border-slate-300'}`}>
                <input
                  type="radio"
                  name="paymentPlan"
                  value="full"
                  checked={paymentPlan === 'full'}
                  onChange={() => setPaymentPlan('full')}
                  className="mt-0.5 accent-slate-900"
                />
                <div>
                  <p className="text-sm font-semibold text-slate-900">Pay in Full</p>
                  <p className="text-xs text-slate-600 mt-0.5">$5,000 one-time payment. Card, bank transfer, or BNPL accepted.</p>
                </div>
              </label>
              <p className="text-xs text-slate-500 pt-1">
                You&apos;ll be redirected to our secure Stripe checkout after submitting.
              </p>
            </div>
          )}

          {/* WIOA / employer info */}
          {(fundingType === 'wioa' || fundingType === 'employer') && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-4 flex gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-green-900">No payment required today</p>
                <p className="text-xs text-green-800 mt-0.5">
                  Submit your application and our team will verify your funding eligibility within 1–2 business days.
                </p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-slate-900 px-6 py-3.5 font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
            ) : fundingType === 'self_pay' ? (
              <><CreditCard className="w-4 h-4" /> Submit &amp; Pay</>
            ) : (
              'Submit Application'
            )}
          </button>
          <p className="text-center text-xs text-black">
            By submitting you agree to our{' '}
            <Link href="/legal/privacy" className="underline">Privacy Policy</Link>.
          </p>
        </form>
      </div>
    </main>
  );
}
