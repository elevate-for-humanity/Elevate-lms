'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Turnstile from '@/components/Turnstile';
import FundingEligibilityFlow, {
  type EligibilityStatus,
} from '@/components/programs/FundingEligibilityFlow';
import Link from 'next/link';
import { ArrowLeft, Loader2, CheckCircle, CreditCard } from 'lucide-react';
import { PAYMENT_LINKS } from '@/lib/stripe/price-map';
import { getBeautyProgram, colorClasses } from '@/lib/programs/beauty-programs';
import { BNPL_PROVIDER_SUMMARY } from '@/lib/bnpl-config';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

// Programs with dedicated enrollment flows — redirect away from this shared page.
const DEDICATED_FLOWS: Record<string, string> = {
  'barber-apprenticeship': '/programs/barber-apprenticeship/apply',
  'cosmetology-apprenticeship': '/programs/cosmetology-apprenticeship/apply',
  'nail-technician-apprenticeship': '/programs/nail-technician-apprenticeship/apply',
  'esthetician-apprenticeship': '/programs/esthetician-apprenticeship/apply',
};

type FundingType = 'wioa' | 'self_pay' | 'employer' | 'unsure';

export default function BeautyApplyPage() {
  const params = useParams<{ program: string }>();
  const router = useRouter();

  const cfg = getBeautyProgram(params.program);
  const dedicatedFlow = DEDICATED_FLOWS[params.program];
  const c = colorClasses(cfg?.color ?? 'blue');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fundingType, setFundingType] = useState<FundingType>('wioa');
  const [eligibilityStatus, setEligibilityStatus] = useState<EligibilityStatus | null>(null);
  const [paymentPlan, setPaymentPlan] = useState<'full' | 'deposit'>('deposit');
  const [turnstileToken, setTurnstileToken] = useState('');

  // Redirects must run in useEffect — router.replace during render throws on SSR (location is not defined).
  useEffect(() => {
    if (dedicatedFlow) {
      router.replace(dedicatedFlow);
      return;
    }
    if (!cfg) {
      router.replace(`/apply?program=${params.program}`);
    }
  }, [cfg, dedicatedFlow, params.program, router]);

  if (dedicatedFlow || !cfg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" aria-label="Redirecting" />
      </div>
    );
  }

  const depositDollars = (cfg.depositCents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  const fullDollars = (cfg.fullTuitionCents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  // Monthly payment estimate (remaining balance / 6)
  const remainingCents = cfg.fullTuitionCents - cfg.depositCents;
  const monthlyDollars = (remainingCents / 6 / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  const FUNDING_OPTIONS: { value: FundingType; label: string; desc: string; badge?: string }[] = [
    { value: 'wioa', label: 'WIOA / WorkOne', desc: 'Free for eligible unemployed or underemployed Indiana residents.', badge: 'Most common' },
    { value: 'employer', label: 'Employer Sponsored', desc: 'Your employer or a workforce grant covers your tuition.' },
    {
      value: 'self_pay',
      label: 'Self-Pay',
      desc: `Pay out of pocket. Full payment (${fullDollars}) or 35% deposit (${depositDollars}) + payment plan.`,
    },
    { value: 'unsure', label: 'Not Sure', desc: "We'll help you find the right funding option during your intake call." },
  ];

  // Stripe payment links keyed by program slug
  const paymentLinks: Record<string, { full: string; deposit: string }> = {
    'barber-apprenticeship': { full: PAYMENT_LINKS.barber?.full ?? cfg.stripeFullLink, deposit: PAYMENT_LINKS.barber?.deposit ?? cfg.stripeDepositLink },
    'cosmetology-apprenticeship': { full: PAYMENT_LINKS.cosmetology?.full ?? cfg.stripeFullLink, deposit: PAYMENT_LINKS.cosmetology?.deposit ?? cfg.stripeDepositLink },
    'esthetician': { full: PAYMENT_LINKS.esthetician?.full ?? cfg.stripeFullLink, deposit: PAYMENT_LINKS.esthetician?.deposit ?? cfg.stripeDepositLink },
    'nail-technician-apprenticeship': { full: PAYMENT_LINKS.nailTech?.full ?? cfg.stripeFullLink, deposit: PAYMENT_LINKS.nailTech?.deposit ?? cfg.stripeDepositLink },
  };
  const links = paymentLinks[cfg.slug] ?? { full: cfg.stripeFullLink, deposit: cfg.stripeDepositLink };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!turnstileToken) {
      setError('Please complete the security check before submitting.');
      setLoading(false);
      return;
    }

    const form = e.currentTarget;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;

    const data = {
      firstName: (form.elements.namedItem('firstName') as HTMLInputElement).value,
      lastName: (form.elements.namedItem('lastName') as HTMLInputElement).value,
      email,
      phone: (form.elements.namedItem('phone') as HTMLInputElement).value,
      city: (form.elements.namedItem('city') as HTMLInputElement).value,
      program: cfg.slug,
      programSlug: cfg.slug,
      programName: cfg.title,
      fundingType,
      source: 'program-page',
      turnstileToken,
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

      if (fundingType === 'self_pay') {
        const link = paymentPlan === 'full' ? links.full : links.deposit;
        window.location.href = `${link}?prefilled_email=${encodeURIComponent(email)}`;
        return;
      }

      router.push(`/programs/${cfg.slug}/apply/success`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-xl mx-auto">
        <Link
          href={`/programs/${cfg.slug}`}
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Program
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="mb-6">
            <span className={`text-xs font-bold ${c.text} uppercase tracking-wider`}>
              DOL Registered Apprenticeship
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
              {cfg.title} Application
            </h1>
            <p className="text-slate-500 text-sm mt-2">
              {cfg.earnWhileYouLearn
                ? 'Earn while you learn. Complete this form to begin your application — our team will contact you within 1 business day.'
                : 'Complete this form to begin your application — our team will contact you within 1 business day.'}
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 mb-6 space-y-2">
            {[
              'Free to apply — no cost to submit',
              cfg.earnWhileYouLearn ? 'Earn wages from day one of training' : `${depositDollars} deposit secures your spot`,
              `${cfg.licenseTitle} upon completion`,
              'Flexible scheduling around your life',
            ].map(item => (
              <div key={item} className="flex items-start gap-2 text-sm text-slate-700">
                <CheckCircle className="w-4 h-4 text-brand-green-500 flex-shrink-0 mt-0.5" />
                {item}
              </div>
            ))}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              {(['firstName', 'lastName'] as const).map(field => (
                <div key={field}>
                  <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor={field}>
                    {field === 'firstName' ? 'First Name' : 'Last Name'} *
                  </label>
                  <input
                    id={field} name={field} type="text" required
                    className={`w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:${c.ring}`}
                  />
                </div>
              ))}
            </div>

            {[
              { id: 'email', label: 'Email Address', type: 'email' },
              { id: 'phone', label: 'Phone Number', type: 'tel' },
              { id: 'city', label: 'City', type: 'text' },
            ].map(({ id, label, type }) => (
              <div key={id}>
                <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor={id}>
                  {label} *
                </label>
                <input
                  id={id} name={id} type={type} required
                  className={`w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:${c.ring}`}
                />
              </div>
            ))}

            {/* Funding type */}
            <div>
              <p className="text-xs font-bold text-slate-700 mb-2">How will you fund your training? *</p>
              <div className="space-y-2">
                {FUNDING_OPTIONS.map(opt => (
                  <label
                    key={opt.value}
                    className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-colors ${
                      fundingType === opt.value ? 'border-slate-900 bg-slate-50' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio" name="fundingType" value={opt.value}
                      checked={fundingType === opt.value}
                      onChange={() => setFundingType(opt.value)}
                      className="mt-0.5 accent-slate-900"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-slate-900">{opt.label}</span>
                        {opt.badge && (
                          <span className="text-xs font-bold text-brand-green-700 bg-brand-green-100 px-2 py-0.5 rounded-full">{opt.badge}</span>
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
                {[
                  {
                    value: 'deposit' as const,
                    title: `35% Deposit + Payment Plan`,
                    desc: `${depositDollars} today, then 6 monthly payments of ${monthlyDollars}. Total: ${fullDollars}.`,
                    badge: `BNPL eligible — ${BNPL_PROVIDER_SUMMARY}`,
                  },
                  {
                    value: 'full' as const,
                    title: `Pay in Full — ${fullDollars}`,
                    desc: 'Card, bank transfer, or BNPL accepted at checkout.',
                    badge: null,
                  },
                ].map(opt => (
                  <label
                    key={opt.value}
                    className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer bg-white ${paymentPlan === opt.value ? 'border-slate-900' : 'border-slate-200'}`}
                  >
                    <input
                      type="radio" name="paymentPlan" value={opt.value}
                      checked={paymentPlan === opt.value}
                      onChange={() => setPaymentPlan(opt.value)}
                      className="mt-0.5 accent-slate-900"
                    />
                    <div>
                      <p className="text-xs font-semibold text-slate-900">{opt.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{opt.desc}</p>
                      {opt.badge && <p className="text-xs text-brand-green-700 font-medium mt-1">{opt.badge}</p>}
                    </div>
                  </label>
                ))}
                <p className="text-xs text-slate-400 pt-1">
                  You&apos;ll be redirected to secure Stripe checkout after submitting.
                </p>
              </div>
            )}

            {fundingType === 'wioa' && (
              <FundingEligibilityFlow fundingType="wioa" onReady={status => setEligibilityStatus(status)} />
            )}
            {fundingType === 'employer' && (
              <div className="rounded-xl border border-brand-green-200 bg-brand-green-50 p-3 flex gap-3">
                <CheckCircle className="w-4 h-4 text-brand-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-brand-green-900">No payment required today</p>
                  <p className="text-xs text-brand-green-800 mt-0.5">Our team will verify your funding eligibility within 1–2 business days.</p>
                </div>
              </div>
            )}

            <Turnstile
              onVerify={setTurnstileToken}
              onExpire={() => setTurnstileToken('')}
              formId={`beauty-apply-${cfg.slug}`}
            />

            <button
              type="submit"
              disabled={loading || !turnstileToken}
              className={`w-full ${c.bg} ${c.hover} disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 mt-2`}
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
              ) : fundingType === 'self_pay' ? (
                <><CreditCard className="w-4 h-4" /> Submit &amp; Pay</>
              ) : (
                'Submit Application'
              )}
            </button>

            <p className="text-xs text-slate-400 text-center">
              Questions?{' '}
              <a href={`tel:${PLATFORM_DEFAULTS.supportPhone}`} className={`${c.text} hover:underline`}>{PLATFORM_DEFAULTS.supportPhone}</a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
