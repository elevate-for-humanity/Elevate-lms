'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  CheckCircle,
  ArrowRight,
  Phone,
  AlertCircle,
  Info,
  Clock,
  DollarSign,
  Briefcase,
} from 'lucide-react';

const EMPLOYMENT_STATUS = [
  'Unemployed',
  'Underemployed / Part-time',
  'Employed — looking to change careers',
  'Recently laid off',
  'Other',
];

type YesNo = 'yes' | 'no' | null;
type Path = 'A' | 'B' | 'C';

interface DbProgram {
  id: string;
  slug: string;
  title: string;
  duration_weeks: number | null;
  salary_min: number | null;
  salary_max: number | null;
  credential_name: string | null;
  funding_eligible: boolean | null;
  wioa_approved: boolean | null;
  funding_tags: string[] | null;
  category: string | null;
}

interface RecommendedProgram {
  name: string;
  slug: string;
  duration: string;
  outcome: string;
  funded: boolean;
  fundedLabel?: string;
}

function formatDuration(weeks: number | null): string {
  if (!weeks) return 'Flexible schedule';
  if (weeks <= 6) return `${weeks} weeks`;
  if (weeks <= 16) return `${weeks} weeks`;
  if (weeks >= 52) return `${Math.round(weeks / 52)} year${weeks >= 104 ? 's' : ''}`;
  return `${weeks} weeks`;
}

function formatOutcome(p: DbProgram): string {
  if (p.salary_min && p.salary_max) {
    return `Avg. $${p.salary_min.toLocaleString()}–$${p.salary_max.toLocaleString()}/yr`;
  }
  if (p.credential_name) return `${p.credential_name} credential included`;
  return 'Industry-recognized credential';
}

function getFundedLabel(p: DbProgram): string {
  const tags = p.funding_tags ?? [];
  if (tags.includes('WIOA') && tags.includes('WRG')) return 'WIOA / Workforce Ready Grant';
  if (tags.includes('WIOA')) return 'WIOA eligible';
  if (tags.includes('WRG')) return 'Workforce Ready Grant';
  if (p.wioa_approved) return 'WIOA eligible';
  return 'Funding available';
}

// Category slugs that map to healthcare programs
const HEALTHCARE_CATEGORIES = ['healthcare', 'health', 'medical', 'nursing', 'allied-health'];
// Category slugs that map to trades/technical programs
const TRADES_CATEGORIES = ['trades', 'hvac', 'electrical', 'plumbing', 'construction', 'cdl', 'transportation'];

function pickRecommended(
  programs: DbProgram[],
  q1: YesNo,
  q2: YesNo,
  employment: string,
): RecommendedProgram[] {
  const isUnemployed =
    q1 === 'yes' || employment === 'Unemployed' || employment === 'Recently laid off';
  const isIndiana = q2 === 'yes';
  const isCareerChange = employment === 'Employed — looking to change careers';

  const funded = programs.filter((p) => p.funding_eligible || p.wioa_approved);
  const healthcare = funded.filter((p) =>
    HEALTHCARE_CATEGORIES.some((c) => p.category?.toLowerCase().includes(c)),
  );
  const trades = funded.filter((p) =>
    TRADES_CATEGORIES.some((c) => p.category?.toLowerCase().includes(c) || p.slug.includes(c)),
  );

  let pool: DbProgram[];
  if (isUnemployed && isIndiana) {
    // Fastest path to employment: healthcare first (short programs), then trades
    pool = [...healthcare, ...trades, ...funded].filter(
      (p, i, arr) => arr.findIndex((x) => x.id === p.id) === i,
    );
  } else if (isCareerChange && isIndiana) {
    // Career changers: trades/technical first (higher wages)
    pool = [...trades, ...funded].filter(
      (p, i, arr) => arr.findIndex((x) => x.id === p.id) === i,
    );
  } else if (isIndiana) {
    // Indiana residents: funded programs, healthcare priority
    pool = [...healthcare, ...funded].filter(
      (p, i, arr) => arr.findIndex((x) => x.id === p.id) === i,
    );
  } else {
    // Non-Indiana: all active programs (self-pay)
    pool = programs;
  }

  return pool.slice(0, 3).map((p) => ({
    name: p.title,
    slug: p.slug,
    duration: formatDuration(p.duration_weeks),
    outcome: formatOutcome(p),
    funded: !!(p.funding_eligible || p.wioa_approved),
    fundedLabel: p.funding_eligible || p.wioa_approved ? getFundedLabel(p) : undefined,
  }));
}

function getPath(q1: YesNo, q2: YesNo, q3: YesNo): Path {
  if (q2 === 'no') return 'C';
  if (q1 === 'yes' && q3 === 'yes') return 'A';
  return 'B';
}

export default function CheckEligibilityPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [q1, setQ1] = useState<YesNo>(null);
  const [q2, setQ2] = useState<YesNo>(null);
  const [q3, setQ3] = useState<YesNo>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [program, setProgram] = useState('');
  const [employment, setEmployment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [dbPrograms, setDbPrograms] = useState<DbProgram[]>([]);

  // Load live programs once on mount
  useEffect(() => {
    fetch('/api/funnel/programs')
      .then((r) => r.json())
      .then((d) => { if (d.programs) setDbPrograms(d.programs); })
      .catch(() => { /* silently fall through — recommended list will be empty */ });
  }, []);

  const allAnswered = q1 !== null && q2 !== null && q3 !== null;
  const path = getPath(q1, q2, q3);
  const recommended = pickRecommended(dbPrograms, q1, q2, employment);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !email.trim()) {
      setError('Name, phone, and email are required.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/funnel/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          email,
          program: program || recommended[0]?.name || '',
          employment,
          source: 'check-eligibility',
          qualificationPath: path,
          qualifierAnswers: { unemployedOrUnder: q1, indianaResident: q2, wantsCert: q3 },
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Submission failed');
      }
      setStep(3);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Something went wrong. Please call (317) 314-3757.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  const banners: Record<
    Path,
    { icon: React.ReactNode; bg: string; title: string; body: string; cta: string }
  > = {
    A: {
      icon: <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />,
      bg: 'bg-green-50 border-green-200',
      title: 'You likely qualify for fully funded training',
      body: "WIOA, Workforce Ready Grant, and Job Ready Indy may cover your full tuition, books, and certification fees. Confirm your info below and we'll lock in your funding options.",
      cta: 'Continue to Application',
    },
    B: {
      icon: <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />,
      bg: 'bg-blue-50 border-blue-200',
      title: 'You may qualify — we need a bit more info',
      body: 'Some funding programs have additional criteria. Fill in your details and an advisor will confirm which options apply to you within 24 hours.',
      cta: 'Get My Options',
    },
    C: {
      icon: <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />,
      bg: 'bg-amber-50 border-amber-200',
      title: 'State grants require Indiana residency',
      body: 'WIOA and Workforce Ready Grant are available to Indiana residents. You can still enroll through self-pay or employer sponsorship — an advisor can walk you through your options.',
      cta: 'See My Options',
    },
  };

  // Build pre-populated apply URL for Path A — carries program, type, and qualifier answers
  // so StudentApplicationForm can skip step 1 and pre-fill eligibility fields.
  const applyParams = new URLSearchParams({
    type: 'enrollment',
    ...(program ? { program } : recommended[0] ? { program: recommended[0].slug } : {}),
    indiana: q2 === 'yes' ? 'yes' : q2 === 'no' ? 'no' : '',
    unemployed: q1 === 'yes' ? 'yes' : '',
  });
  // Remove empty params
  Array.from(applyParams.entries())
    .filter(([, v]) => !v)
    .forEach(([k]) => applyParams.delete(k));
  const applyHref = `/apply/student?${applyParams.toString()}`;

  const confirmations: Record<
    Path,
    {
      headline: string;
      body: string;
      primaryLabel: string;
      primaryHref: string;
      secondaryLabel: string;
      secondaryHref: string;
    }
  > = {
    A: {
      headline: 'Application received — next step is yours',
      body: "We'll confirm your funding eligibility within 24 hours and send you a direct link to complete your application.",
      primaryLabel: 'Start Application Now',
      primaryHref: applyHref,
      secondaryLabel: 'Browse Programs',
      secondaryHref: '/programs',
    },
    B: {
      headline: "We'll be in touch within 24 hours",
      body: 'An advisor will review your info and confirm which funding options apply to you. Check your email and phone.',
      primaryLabel: 'Browse Programs',
      primaryHref: '/programs',
      secondaryLabel: 'Back to Home',
      secondaryHref: '/',
    },
    C: {
      headline: 'We received your info',
      body: 'An advisor will reach out to walk you through self-pay and employer sponsorship options.',
      primaryLabel: 'View Programs',
      primaryHref: '/programs',
      secondaryLabel: 'Call Us Now',
      secondaryHref: 'tel:3173143757',
    },
  };

  const banner = banners[path];
  const confirm = confirmations[path];

  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section
        className="relative overflow-hidden"
        style={{ minHeight: 'clamp(320px, 40vw, 460px)' }}
      >
        <Image
          src="/images/pages/funding-page-2.webp"
          alt="Check your eligibility for funded career training"
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/85 via-slate-900/60 to-transparent" />
        <div
          className="relative z-10 h-full flex flex-col justify-between px-4 sm:px-6 py-5"
          style={{ minHeight: 'clamp(320px, 40vw, 460px)' }}
        >
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="text-white/80 hover:text-white text-sm font-semibold transition-colors"
            >
              ← Elevate for Humanity
            </Link>
            <a
              href="tel:3173143757"
              className="flex items-center gap-2 text-white/80 hover:text-white text-sm font-semibold transition-colors"
            >
              <Phone className="w-4 h-4" />
              (317) 314-3757
            </a>
          </div>
          <div className="pb-6">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-red-400 mb-2">
              Free Career Training
            </p>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3 max-w-lg leading-tight">
              Check If You Qualify for Funded Training
            </h1>
            <p className="text-white/75 text-base max-w-md">
              3 questions. 30 seconds. We'll match you with WIOA, Workforce Ready Grant, or JRI
              funding.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-xl mx-auto px-4 py-12">
        {step === 1 && (
          <div>
            <div className="flex items-center gap-2 mb-8">
              <div className="flex-1 h-1.5 rounded-full bg-brand-red-600" />
              <div className="flex-1 h-1.5 rounded-full bg-slate-200" />
              <span className="text-xs text-slate-400 ml-1">Step 1 of 2</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">
              Check if you qualify for funded training
            </h1>
            <p className="text-slate-500 text-sm mb-8">3 questions. Takes 30 seconds.</p>
            <div className="space-y-5">
              {(
                [
                  { q: 'Are you currently unemployed or underemployed?', val: q1, set: setQ1 },
                  { q: 'Do you live in Indiana?', val: q2, set: setQ2 },
                  {
                    q: 'Are you interested in earning a job-ready certification?',
                    val: q3,
                    set: setQ3,
                  },
                ] as const
              ).map(({ q, val, set }) => (
                <div key={q} className="bg-white border border-slate-200 rounded-xl p-5">
                  <p className="font-semibold text-slate-900 mb-4">{q}</p>
                  <div className="flex gap-3">
                    {(['yes', 'no'] as const).map((v) => (
                      <button
                        key={v}
                        onClick={() => set(v)}
                        className={`flex-1 py-3 rounded-lg font-bold text-sm border-2 transition-colors ${
                          val === v
                            ? 'bg-brand-red-600 border-brand-red-600 text-white'
                            : 'bg-white border-slate-300 text-slate-700 hover:border-brand-red-400'
                        }`}
                      >
                        {v === 'yes' ? 'Yes' : 'No'}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setStep(2)}
              disabled={!allAnswered}
              className="mt-8 w-full flex items-center justify-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl text-base transition-colors"
            >
              See My Results <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="flex items-center gap-2 mb-8">
              <div className="flex-1 h-1.5 rounded-full bg-brand-red-600" />
              <div className="flex-1 h-1.5 rounded-full bg-brand-red-600" />
              <span className="text-xs text-slate-400 ml-1">Step 2 of 2</span>
            </div>
            <div className={`border rounded-xl p-5 mb-8 flex items-start gap-3 ${banner.bg}`}>
              {banner.icon}
              <div>
                <p className="font-extrabold text-slate-900 text-base">{banner.title}</p>
                <p className="text-slate-700 text-sm mt-1">{banner.body}</p>
              </div>
            </div>
            {/* Auto-matched program recommendations */}
            <div className="mb-8">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                Recommended for you
              </p>
              <div className="space-y-2">
                {recommended.map((p, i) => (
                  <div
                    key={p.slug}
                    onClick={() => setProgram(p.name)}
                    className={`w-full text-left rounded-xl border-2 px-4 py-3 transition-colors cursor-pointer ${
                      program === p.name
                        ? 'border-brand-red-500 bg-brand-red-50'
                        : 'border-slate-200 bg-white hover:border-brand-red-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0">
                        {i === 0 && (
                          <span className="shrink-0 mt-0.5 text-xs font-black bg-brand-red-600 text-white px-1.5 py-0.5 rounded">
                            #1
                          </span>
                        )}
                        <div className="min-w-0">
                          <p
                            className={`font-bold text-sm leading-snug ${program === p.name ? 'text-brand-red-900' : 'text-slate-900'}`}
                          >
                            {p.name}
                          </p>
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                            <span className="flex items-center gap-1 text-xs text-slate-500">
                              <Clock className="w-3 h-3" />
                              {p.duration}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-slate-500">
                              <Briefcase className="w-3 h-3" />
                              {p.outcome}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {p.funded && (
                          <span className="flex items-center gap-1 text-xs font-semibold text-brand-green-700 bg-brand-green-50 border border-brand-green-200 px-2 py-0.5 rounded-full">
                            <DollarSign className="w-3 h-3" />
                            Funded
                          </span>
                        )}
                        <Link
                          href={`/programs/${p.slug}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs text-brand-blue-600 hover:underline font-semibold"
                        >
                          View Program →
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setProgram('')}
                className="mt-2 text-xs text-slate-400 hover:text-slate-600 underline"
              >
                Choose a different program
              </button>
            </div>

            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-extrabold text-slate-900">Tell us about yourself</h2>
              <Link
                href="/programs"
                className="text-xs text-brand-blue-600 hover:underline font-semibold"
              >
                Browse all programs →
              </Link>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full min-h-[48px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(317) 000-0000"
                  className="w-full min-h-[48px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-transparent"
                />
                <p className="text-xs text-slate-400 mt-1">
                  We may text you — reply STOP to opt out anytime.
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="w-full min-h-[48px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-transparent"
                />
              </div>
              {/* Only show program dropdown if user clicked "Choose a different program" */}
              {!recommended.find((r) => r.name === program) && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Program Interest
                  </label>
                  <select
                    value={program}
                    onChange={(e) => setProgram(e.target.value)}
                    className="w-full min-h-[48px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-transparent bg-white"
                  >
                    <option value="">Select a program</option>
                    {dbPrograms.map((p) => (
                      <option key={p.id} value={p.title}>
                        {p.title}
                      </option>
                    ))}
                    <option value="Not Sure Yet">Not Sure Yet</option>
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Employment Status
                </label>
                <select
                  value={employment}
                  onChange={(e) => setEmployment(e.target.value)}
                  className="w-full min-h-[48px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-transparent bg-white"
                >
                  <option value="">Select status</option>
                  {EMPLOYMENT_STATUS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm">
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl text-base transition-colors mt-2"
              >
                {submitting ? 'Submitting...' : banner.cta}
                {!submitting && <ArrowRight className="w-5 h-5" />}
              </button>
              <p className="text-center text-xs text-slate-400">
                Questions? Call or text{' '}
                <a href="tel:3173143757" className="text-slate-600 font-semibold">
                  (317) 314-3757
                </a>
              </p>
            </form>
          </div>
        )}

        {step === 3 && (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-9 h-9 text-green-600" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 mb-3">{confirm.headline}</h2>
            <p className="text-slate-600 mb-2">{confirm.body}</p>

            {/* Show selected program with direct enroll link */}
            {program && (
              <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-xl p-4 mb-6 text-left">
                <p className="text-xs font-bold text-brand-blue-600 uppercase tracking-wider mb-1">
                  Your selected program
                </p>
                <p className="font-extrabold text-slate-900">{program}</p>
                {recommended.find((r) => r.name === program) && (
                  <p className="text-xs text-slate-500 mt-1">
                    {recommended.find((r) => r.name === program)?.duration} ·{' '}
                    {recommended.find((r) => r.name === program)?.outcome}
                  </p>
                )}
                {path === 'A' && (
                  <Link
                    href={applyHref}
                    className="inline-block mt-3 text-xs font-bold text-brand-blue-700 underline"
                  >
                    Apply for this program →
                  </Link>
                )}
              </div>
            )}

            <p className="text-slate-500 text-sm mb-8">
              Can&apos;t wait? Call or text:{' '}
              <a href="tel:3173143757" className="text-brand-red-600 font-bold">
                (317) 314-3757
              </a>
            </p>
            <div className="flex flex-col gap-3">
              <Link
                href={confirm.primaryHref}
                className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-4 rounded-xl transition-colors text-base"
              >
                {confirm.primaryLabel} <ArrowRight className="inline w-4 h-4 ml-1" />
              </Link>
              <Link
                href="/programs"
                className="border border-slate-300 text-slate-700 font-semibold px-8 py-3.5 rounded-xl hover:bg-slate-50 transition-colors"
              >
                View All Programs
              </Link>
              <Link
                href={confirm.secondaryHref}
                className="text-slate-500 text-sm hover:text-slate-600 transition-colors"
              >
                {confirm.secondaryLabel}
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
