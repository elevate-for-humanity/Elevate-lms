'use client';

/**
 * ProgramApplyPage — shared apply page for all programs.
 *
 * Driven entirely by ProgramSchema data. Handles:
 *   - Auth guard (redirects to /login if no session)
 *   - Funding eligibility flow (WIOA / WRG / FSSA / IMPACT)
 *   - Self-pay: card/bank and BNPL provider checkouts
 *   - Funded: application saved, redirect to success
 *   - All payment options driven by program.fundingOptions
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, CreditCard, Info, CheckCircle } from 'lucide-react';
import Turnstile from '@/components/Turnstile';
import FundingEligibilityFlow, {
  type EligibilityStatus,
} from '@/components/programs/FundingEligibilityFlow';
import type { ProgramSchema } from '@/lib/programs/program-schema';
import { ACTIVE_BNPL_PROVIDERS, BNPL_PROVIDER_NAMES } from '@/lib/bnpl-config';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

interface Props {
  program: ProgramSchema;
}

function parseCost(raw: string): number {
  const m = raw.replace(/,/g, '').match(/\$?([\d]+)/);
  return m ? parseInt(m[1], 10) : 0;
}

export default function ProgramApplyPage({ program }: Props) {
  const fullPrice = parseCost(program.selfPayCost ?? '0');
  const depositAmount = Math.round(fullPrice * 0.2);
  const remainingBalance = fullPrice - depositAmount;
  const minWeekly = program.durationWeeks
    ? Math.ceil((remainingBalance / program.durationWeeks) * 100) / 100
    : 50;

  const hasFunding = (program.fundingOptions ?? []).some((f) =>
    ['wioa', 'wrg', 'impact', 'fssa'].includes(f),
  );
  const hasSelfPay = (program.fundingOptions ?? []).includes('self_pay');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorSeverity, setErrorSeverity] = useState<'info' | 'critical'>('info');
  const [submitted, setSubmitted] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');

  const [paymentOption, setPaymentOption] = useState<
    'weekly' | 'full' | 'affirm' | 'sezzle' | 'stripe-bnpl'
  >('weekly');
  const [customWeekly, setCustomWeekly] = useState(minWeekly);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    experience: '',
    fundingInterest: hasFunding ? 'wioa' : 'self-pay',
  });

  const [fundingEligibilityStatus, setFundingEligibilityStatus] =
    useState<EligibilityStatus | null>(null);
  const [workoneIntakeCompleted, setWorkoneIntakeCompleted] = useState<'yes' | 'no' | ''>('');
  const [workoneAppointmentDate, setWorkoneAppointmentDate] = useState('');
  const [workoneCenter, setWorkoneCenter] = useState('');
  const [workoneChecklist, setWorkoneChecklist] = useState({
    iccAccountCreated: false,
    profileCompleted: false,
    documentsReady: false,
    appointmentBooked: false,
    metAdvisor: false,
  });

  // Auth guard
  useEffect(() => {
    const check = async () => {
      const { createBrowserClient } = await import('@supabase/ssr');
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      );
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = `/login?redirect=/programs/${program.slug}/apply`;
      }
    };
    check();
  }, [program.slug]);

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === 'fundingInterest') {
      setFundingEligibilityStatus(null);
      setWorkoneIntakeCompleted('');
      setWorkoneAppointmentDate('');
      setWorkoneCenter('');
      setWorkoneChecklist({
        iccAccountCreated: false,
        profileCompleted: false,
        documentsReady: false,
        appointmentBooked: false,
        metAdvisor: false,
      });
    }
  };

  const isFunded = ['wioa', 'wrg', 'fssa', 'impact'].includes(formData.fundingInterest);
  const isWorkoneFunding = ['wioa', 'wrg'].includes(formData.fundingInterest);
  const finalFundingEligibilityStatus: EligibilityStatus | null =
    fundingEligibilityStatus ??
    (isWorkoneFunding
      ? workoneIntakeCompleted === 'yes'
        ? 'in_process'
        : workoneIntakeCompleted === 'no'
          ? 'needs_appointment'
          : null
      : null);

  const fundedReady =
    formData.fundingInterest === 'employer' ||
    formData.fundingInterest === 'unsure' ||
    (isFunded && finalFundingEligibilityStatus !== null);

  const canSubmit =
    formData.firstName &&
    formData.lastName &&
    formData.email &&
    formData.phone &&
    (!isWorkoneFunding || workoneIntakeCompleted !== '') &&
    (formData.fundingInterest === 'self-pay' || fundedReady);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || PLATFORM_DEFAULTS.siteUrl;
  const affirmName = ACTIVE_BNPL_PROVIDERS.find((p) => p.id === 'affirm')?.name ?? 'Affirm';
  const sezzleName = ACTIVE_BNPL_PROVIDERS.find((p) => p.id === 'sezzle')?.name ?? 'Sezzle';
  const stripeBnplNames = ACTIVE_BNPL_PROVIDERS.filter((p) => p.stripeMethodId !== null)
    .map((p) => p.name)
    .join(' / ');

  async function handleSubmit() {
    if (!canSubmit) {
      setError('Please fill in all required fields.');
      setErrorSeverity('info');
      return;
    }
    if (!turnstileToken) {
      setError('Please complete the security check before submitting.');
      setErrorSeverity('info');
      return;
    }
    setLoading(true);
    setError('');

    try {
      // Save application
      const appRes = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          program: program.title,
          programSlug: program.slug,
          fundingType: formData.fundingInterest,
          fundingEligibilityStatus: finalFundingEligibilityStatus ?? undefined,
          workoneIntakeCompleted: workoneIntakeCompleted || undefined,
          workoneAppointmentDate: workoneAppointmentDate || undefined,
          workoneCenter: workoneCenter || undefined,
          workoneChecklist:
            isWorkoneFunding
              ? Object.entries(workoneChecklist)
                  .filter(([, done]) => done)
                  .map(([key]) => key)
              : undefined,
          source: 'program-page',
          paymentOption: formData.fundingInterest === 'self-pay' ? paymentOption : 'funded',
          turnstileToken,
        }),
      });

      let appData: { id?: string; error?: string } = {};
      try { appData = await appRes.json(); } catch { /* ignore */ }

      if (!appRes.ok) {
        const msg =
          appRes.status === 503
            ? `Our system is temporarily unavailable. Please call ${PLATFORM_DEFAULTS.supportPhone}.`
            : appRes.status === 409
              ? appData.error || `A duplicate application was found. Please call ${PLATFORM_DEFAULTS.supportPhone}.`
              : appData.error || `Failed to submit. Please try again or call ${PLATFORM_DEFAULTS.supportPhone}.`;
        setError(msg);
        setErrorSeverity('critical');
        setLoading(false);
        return;
      }

      const applicationId = appData?.id;
      const successUrl = `/programs/${program.slug}/apply/success${applicationId ? `?id=${applicationId}` : ''}`;

      // Funded path — no payment needed
      if (formData.fundingInterest !== 'self-pay') {
        window.location.href = successUrl;
        return;
      }

      // Self-pay — provider SDK option
      if (paymentOption === 'affirm') {
        const res = await fetch('/api/affirm/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            programId: program.slug,
            programSlug: program.slug,
            programName: program.title,
            amount: depositAmount,
            paymentOption: 'deposit',
            applicationId,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.checkoutConfig) {
          setError(data.error || `${affirmName} is temporarily unavailable. Please select another option.`);
          setErrorSeverity('info');
          setLoading(false);
          return;
        }
        try {
          (window as any)._affirm_config = { public_api_key: data.publicKey, script: data.affirmJsUrl };
          if (!(window as any).affirm) {
            await new Promise<void>((resolve, reject) => {
              const s = document.createElement('script');
              s.src = data.affirmJsUrl;
              s.async = true;
              s.onload = () => resolve();
              s.onerror = () => reject();
              document.head.appendChild(s);
            });
          }
          const sdk = (window as any).affirm;
          sdk?.checkout?.(data.checkoutConfig);
          sdk?.checkout?.open();
        } catch {
          setError(`${affirmName} checkout could not load. Please select another option.`);
          setErrorSeverity('info');
          setLoading(false);
        }
        return;
      }

      // Self-pay — provider SDK option
      if (paymentOption === 'sezzle') {
        const res = await fetch('/api/sezzle/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            programId: program.slug,
            programSlug: program.slug,
            programName: program.title,
            amount: Math.min(2500, depositAmount),
            paymentOption: 'deposit',
            description: `${program.title} — deposit via ${sezzleName}`,
            applicationId,
          }),
        });
        const data = await res.json();
        if (res.ok && data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
        } else {
          setError(data.error || `${sezzleName} is temporarily unavailable. Please select another option.`);
          setErrorSeverity('info');
          setLoading(false);
        }
        return;
      }

      // Self-pay — Stripe BNPL options
      if (paymentOption === 'stripe-bnpl') {
        const res = await fetch('/api/enroll/payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: depositAmount,
            program: program.slug,
            paymentType: 'deposit',
            description: `${program.title} — deposit via BNPL provider`,
            successUrl: `${siteUrl}/programs/${program.slug}/apply/success?payment=bnpl`,
            cancelUrl: `${siteUrl}/programs/${program.slug}/apply`,
          }),
        });
        const data = await res.json();
        if (res.ok && (data.checkoutUrl || data.url)) {
          window.location.href = data.checkoutUrl || data.url;
        } else {
          setError(data.error || 'BNPL checkout is temporarily unavailable. Please select another option.');
          setErrorSeverity('info');
          setLoading(false);
        }
        return;
      }

      // Self-pay — Stripe (full or deposit/weekly)
      const isFullPay = paymentOption === 'full';
      const chargeAmount = isFullPay ? fullPrice : depositAmount;
      const res = await fetch('/api/enroll/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: chargeAmount,
          program: program.slug,
          paymentType: isFullPay ? 'full' : 'deposit',
          description: `${program.title} — ${isFullPay ? 'full payment' : 'deposit'} ($${chargeAmount})`,
          successUrl: `${siteUrl}/programs/${program.slug}/apply/success?payment=stripe`,
          cancelUrl: `${siteUrl}/programs/${program.slug}/apply`,
        }),
      });
      const data = await res.json();
      if (res.ok && (data.checkoutUrl || data.url)) {
        window.location.href = data.checkoutUrl || data.url;
      } else {
        setError(data.error || 'Unable to create checkout. Please try again.');
        setErrorSeverity('critical');
        setLoading(false);
      }
    } catch {
      setError(`Something went wrong. Please try again or call ${PLATFORM_DEFAULTS.supportPhone}.`);
      setErrorSeverity('critical');
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <CheckCircle className="w-16 h-16 text-brand-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Application Submitted</h1>
          <p className="text-slate-600 mb-6">
            We&apos;ll be in touch within 1 business day to confirm your enrollment.
          </p>
          <Link href={`/programs/${program.slug}`} className="text-brand-blue-600 font-medium hover:underline">
            ← Back to {program.title}
          </Link>
        </div>
      </main>
    );
  }

  const fundingLabel: Record<string, string> = {
    wioa: 'WIOA (Workforce Innovation & Opportunity Act)',
    wrg: 'Workforce Ready Grant',
    impact: ' / Next Level Jobs',
    fssa: '',
    employer_paid: 'Employer Sponsored',
    self_pay: 'Self-Pay',
  };

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <section className="bg-brand-blue-700 text-white py-12">
        <div className="max-w-5xl mx-auto px-6">
          <Link
            href={`/programs/${program.slug}`}
            className="inline-flex items-center gap-2 text-white/80 hover:text-white font-medium mb-6 text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back to {program.title}
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Apply — {program.title}</h1>
          <p className="text-white/80 text-lg">
            {program.durationWeeks} weeks · {program.schedule ?? 'Flexible schedule'}
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-2">
            <div className="bg-brand-blue-700 rounded-2xl p-6 text-white sticky top-8">
              <div className="bg-white/10 rounded-xl p-4 mb-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-white/70 text-xs uppercase mb-1">Duration</div>
                    <div className="text-2xl font-black">{program.durationWeeks ?? '—'} Wks</div>
                  </div>
                  <div>
                    <div className="text-white/70 text-xs uppercase mb-1">Credentials</div>
                    <div className="text-2xl font-black">{program.credentials?.length ?? '—'}</div>
                  </div>
                </div>
              </div>

              {program.credentials && program.credentials.length > 0 && (
                <div className="bg-white/10 rounded-xl p-4 mb-4">
                  <h3 className="font-bold text-sm mb-2">Credentials Earned</h3>
                  <ul className="text-xs text-white/90 space-y-1">
                    {program.credentials.slice(0, 5).map((c, i) => (
                      <li key={i}>• {c.name}</li>
                    ))}
                  </ul>
                </div>
              )}

              {formData.fundingInterest === 'self-pay' && hasSelfPay && fullPrice > 0 && (
                <div className="bg-white/10 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CreditCard className="w-4 h-4" />
                    <span className="font-bold text-sm">Program Cost</span>
                  </div>
                  <div className="text-center mb-3">
                    <div className="text-3xl font-black">${fullPrice.toLocaleString()}</div>
                    <div className="text-white/70 text-xs">total tuition</div>
                  </div>
                  <div className="text-xs text-white/80 space-y-1">
                    <p>• 20% deposit: ${depositAmount.toLocaleString()}</p>
                    <p>• Weekly plans available</p>
                    <p>• BNPL providers: {BNPL_PROVIDER_NAMES}</p>
                  </div>
                </div>
              )}

              {formData.fundingInterest !== 'self-pay' && (
                <div className="bg-white/10 rounded-xl p-4">
                  <div className="text-center">
                    <div className="text-2xl font-black">May be $0</div>
                    <p className="text-xs text-white/80 mt-1">
                      with workforce funding for eligible Indiana residents
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-4 flex items-start gap-2">
                <Info className="w-4 h-4 text-white/70 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-white/80">
                  Questions? Call {PLATFORM_DEFAULTS.supportPhone} or{' '}
                  <Link href="/contact" className="underline">contact us</Link>.
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-3">
            {error && (
              <div className={`mb-6 p-4 rounded-lg border ${
                errorSeverity === 'critical'
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}>
                <p className="font-medium">{error}</p>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 sm:p-8 space-y-6">
              <h2 className="text-2xl font-bold text-slate-900">Your Information</h2>

              {/* Name */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => updateField('firstName', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:outline-none"
                    placeholder="First name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => updateField('lastName', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:outline-none"
                    placeholder="Last name"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:outline-none"
                  placeholder="you@example.com"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:outline-none"
                  placeholder="(317) 555-0100"
                />
              </div>

              {/* Experience */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Relevant Experience (optional)
                </label>
                <textarea
                  value={formData.experience}
                  onChange={(e) => updateField('experience', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:outline-none resize-none"
                  placeholder={`Any background in ${program.sector ?? 'this field'}?`}
                />
              </div>

              {/* Funding */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  How will you fund your training? *
                </label>
                <div className="space-y-2">
                  {(program.fundingOptions ?? []).map((opt) => {
                    const key = opt === 'self_pay' ? 'self-pay' : opt;
                    const label = fundingLabel[opt] ?? opt;
                    return (
                      <label key={opt} className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-slate-200 hover:border-brand-blue-400 transition-colors">
                        <input
                          type="radio"
                          name="funding"
                          value={key}
                          checked={formData.fundingInterest === key}
                          onChange={() => updateField('fundingInterest', key)}
                          className="text-brand-blue-600"
                        />
                        <span className="text-sm font-medium text-slate-700">{label}</span>
                      </label>
                    );
                  })}
                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-slate-200 hover:border-brand-blue-400 transition-colors">
                    <input
                      type="radio"
                      name="funding"
                      value="unsure"
                      checked={formData.fundingInterest === 'unsure'}
                      onChange={() => updateField('fundingInterest', 'unsure')}
                      className="text-brand-blue-600"
                    />
                    <span className="text-sm font-medium text-slate-700">Not sure — help me find funding</span>
                  </label>
                </div>
              </div>

              {/* Funding eligibility flow for WIOA/WRG/FSSA */}
              {['wioa', 'wrg', 'fssa', 'impact'].includes(formData.fundingInterest) && (
                <div className="border border-brand-blue-200 rounded-xl p-4 bg-brand-blue-50">
                  <FundingEligibilityFlow
                    fundingType={
                      formData.fundingInterest === 'impact'
                        ? 'fssa'
                        : (formData.fundingInterest as 'wioa' | 'wrg' | 'fssa')
                    }
                    onReady={(status) => setFundingEligibilityStatus(status)}
                  />
                </div>
              )}

              {/* WorkOne intake tracking (WIOA / WRG only) */}
              {isWorkoneFunding && (
                <div className="border border-slate-200 rounded-xl p-4 bg-white">
                  <h3 className="text-base font-bold text-slate-900 mb-2">
                    WorkOne Intake Status
                  </h3>
                  <p className="text-sm text-slate-600 mb-3">
                    Have you completed your WorkOne intake yet? This determines your funding qualification path.
                  </p>

                  <div className="space-y-2 mb-4">
                    <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-slate-200 hover:border-brand-blue-400 transition-colors">
                      <input
                        type="radio"
                        name="workoneIntakeCompleted"
                        value="yes"
                        checked={workoneIntakeCompleted === 'yes'}
                        onChange={() => setWorkoneIntakeCompleted('yes')}
                        className="text-brand-blue-600"
                      />
                      <span className="text-sm font-medium text-slate-700">
                        Yes — I already started/completed WorkOne intake
                      </span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-slate-200 hover:border-brand-blue-400 transition-colors">
                      <input
                        type="radio"
                        name="workoneIntakeCompleted"
                        value="no"
                        checked={workoneIntakeCompleted === 'no'}
                        onChange={() => setWorkoneIntakeCompleted('no')}
                        className="text-brand-blue-600"
                      />
                      <span className="text-sm font-medium text-slate-700">
                        No — I need to schedule my WorkOne intake
                      </span>
                    </label>
                  </div>

                  {workoneIntakeCompleted === 'no' && (
                    <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 space-y-2">
                      <p className="text-sm font-semibold text-amber-800">
                        Next step: schedule your WorkOne appointment
                      </p>
                      <ol className="list-decimal list-inside text-sm text-amber-700 space-y-1">
                        <li>Create your Indiana Career Connect account</li>
                        <li>Find your nearest WorkOne center</li>
                        <li>Book an intake appointment with a career advisor</li>
                        <li>Bring your documents and request WIOA/WRG eligibility review</li>
                      </ol>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <a
                          href="https://www.indianacareerconnect.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-blue-700 text-white text-sm font-semibold hover:bg-brand-blue-800"
                        >
                          Open Indiana Career Connect
                        </a>
                        <a
                          href="https://www.in.gov/dwd/find-a-workone-center/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50"
                        >
                          Find a WorkOne Center
                        </a>
                      </div>
                    </div>
                  )}

                  {workoneIntakeCompleted === 'yes' && (
                    <div className="rounded-lg bg-brand-blue-50 border border-brand-blue-200 p-4 space-y-3">
                      <p className="text-sm font-semibold text-brand-blue-800">
                        Post-WorkOne checklist (for progress tracking)
                      </p>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {[
                          ['iccAccountCreated', 'ICC account created'],
                          ['profileCompleted', 'Profile completed'],
                          ['documentsReady', 'Documents prepared'],
                          ['appointmentBooked', 'Appointment booked'],
                          ['metAdvisor', 'Met WorkOne advisor'],
                        ].map(([key, label]) => (
                          <label key={key} className="flex items-center gap-2 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              checked={workoneChecklist[key as keyof typeof workoneChecklist]}
                              onChange={(e) =>
                                setWorkoneChecklist((prev) => ({
                                  ...prev,
                                  [key]: e.target.checked,
                                }))
                              }
                            />
                            {label}
                          </label>
                        ))}
                      </div>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            WorkOne appointment date (optional)
                          </label>
                          <input
                            type="date"
                            value={workoneAppointmentDate}
                            onChange={(e) => setWorkoneAppointmentDate(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            WorkOne center (optional)
                          </label>
                          <input
                            type="text"
                            value={workoneCenter}
                            onChange={(e) => setWorkoneCenter(e.target.value)}
                            placeholder="Example: WorkOne Indy East"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Self-pay payment options */}
              {formData.fundingInterest === 'self-pay' && hasSelfPay && fullPrice > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Payment Option *</label>
                  <div className="space-y-2">
                    {[
                      { value: 'weekly', label: `Weekly payments (from $${minWeekly}/wk)` },
                      { value: 'full', label: `Pay in full — $${fullPrice.toLocaleString()}` },
                      { value: 'affirm', label: `${affirmName} — monthly installments` },
                      { value: 'sezzle', label: `${sezzleName} — pay over time` },
                      { value: 'stripe-bnpl', label: `BNPL at checkout (${stripeBnplNames})` },
                    ].map((opt) => (
                      <label key={opt.value} className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-slate-200 hover:border-brand-blue-400 transition-colors">
                        <input
                          type="radio"
                          name="payment"
                          value={opt.value}
                          checked={paymentOption === opt.value}
                          onChange={() => setPaymentOption(opt.value as typeof paymentOption)}
                          className="text-brand-blue-600"
                        />
                        <span className="text-sm font-medium text-slate-700">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    BNPL options are available only for self-pay selections. Funded applications do
                    not use BNPL checkout.
                  </p>

                  {paymentOption === 'weekly' && (
                    <div className="mt-3 p-4 bg-slate-50 rounded-lg">
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Weekly amount (min ${minWeekly})
                      </label>
                      <input
                        type="number"
                        min={minWeekly}
                        step="5"
                        value={customWeekly}
                        onChange={(e) => setCustomWeekly(Math.max(minWeekly, parseFloat(e.target.value) || minWeekly))}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:outline-none"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        20% deposit (${depositAmount.toLocaleString()}) due today, then ${customWeekly}/wk
                      </p>
                    </div>
                  )}
                </div>
              )}

              <Turnstile
                onVerify={setTurnstileToken}
                onExpire={() => setTurnstileToken('')}
                formId={`program-apply-${program.slug}`}
              />

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={loading || !canSubmit || !turnstileToken}
                className="w-full bg-brand-blue-700 hover:bg-brand-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 px-8 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Processing…</>
                ) : formData.fundingInterest === 'self-pay' ? (
                  'Continue to Payment →'
                ) : (
                  'Submit Application →'
                )}
              </button>

              <p className="text-xs text-slate-500 text-center">
                By submitting you agree to our{' '}
                <Link href="/legal" className="underline">Terms</Link> and{' '}
                <Link href="/legal/privacy" className="underline">Privacy Policy</Link>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
