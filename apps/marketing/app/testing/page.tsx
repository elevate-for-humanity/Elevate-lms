export const revalidate = 300;

import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CircleDollarSign,
  MapPin,
  ShieldCheck,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import TestingCart, { AddExamToCartButton } from '@/components/testing/TestingCart';
import { SafeHeroVideo } from '@/components/hero/SafeHeroVideo';
const TESTING_VIDEO = 'https://pub-23811be4d3844e45a8bc2d3dc5e7aaec.r2.dev/videos/programs-overview-video-with-narration.mp4';
import { TESTING_CENTER } from '@/lib/testing/testing-config';
import {
  ACTIVE_PROVIDERS,
  type ExamDefinition,
  type CertProvider,
} from '@/lib/testing/proctoring-capabilities';

export const metadata: Metadata = {
  title: 'Testing & Credential Exams',
  description:
    'Workforce credential exams and proctor-supervised certification testing. Choose an available exam, review the configured retail price, and continue to checkout.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/testing' },
};

const PROVIDER_IMAGES: Record<string, string> = {
  esco: '/images/pages/hvac-unit.webp',
  nrf: '/images/pages/certifications-page-1.webp',
  certiport: '/images/pages/testing-page-1.jpg',
  nha: '/images/pages/medical-assistant.webp',
  workkeys: '/images/pages/career-services-page-1.webp',
  careersafe: '/images/pages/programs-emergency-health-safety-hero.webp',
  midland: '/images/pages/competency-test-hero.webp',
};

const CAPABILITY_LABELS: Record<string, string> = {
  IN_PERSON_ONLY: 'In-person proctored',
  IN_PERSON_OR_PROVIDER_REMOTE: 'In-person or provider remote',
  CENTER_REMOTE_ALLOWED: 'In-person or live online',
};

function examName(exam: string | ExamDefinition): string {
  return typeof exam === 'string' ? exam : exam.name;
}

function examAmount(provider: CertProvider, exam: string | ExamDefinition): number | null {
  if (typeof exam === 'object' && exam.amountCents && exam.amountCents > 0) return exam.amountCents;
  if (provider.fees?.length === 1 && provider.fees[0].amount > 0) {
    return Math.round(provider.fees[0].amount * 100);
  }
  return null;
}

function purchasableExams(provider: CertProvider) {
  return provider.exams
    .map((exam) => ({ exam, amountCents: examAmount(provider, exam) }))
    .filter((entry): entry is { exam: string | ExamDefinition; amountCents: number } =>
      Boolean(entry.amountCents && entry.amountCents > 0),
    );
}

function priceLabel(provider: CertProvider): string | null {
  const amounts = purchasableExams(provider).map((entry) => entry.amountCents);
  if (!amounts.length) return null;
  const min = Math.min(...amounts) / 100;
  const max = Math.max(...amounts) / 100;
  return min === max ? `$${min.toFixed(0)}` : `$${min.toFixed(0)}–$${max.toFixed(0)}`;
}

export default function TestingPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <Breadcrumbs items={[{ label: 'Testing & Credential Exams' }]} />
        </div>
      </div>

      <section className="relative min-h-[340px] overflow-hidden bg-slate-100 sm:min-h-[430px]">
        <SafeHeroVideo src={TESTING_VIDEO} poster="/images/pages/testing-page-1.webp" ariaLabel="Credential testing and career readiness" className="absolute inset-0 h-full w-full object-cover object-center" />
      </section>

      <section className="border-b border-slate-100 bg-white py-10">
        <div className="mx-auto max-w-5xl px-4">
          <p className="mb-3 text-sm font-bold uppercase tracking-widest text-brand-red-600">
            Elevate Testing Center
          </p>
          <h1 className="max-w-4xl text-4xl font-black leading-tight text-slate-950 sm:text-5xl">
            Choose the credential exam. See the price. Check out securely.
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-slate-600">
            Compare available credential exams, delivery options, and published prices. Select the
            exact exam you need before continuing to secure checkout.
          </p>

          <div className="mt-7 flex flex-col gap-3 min-[420px]:flex-row min-[420px]:flex-wrap">
            <Link href="/testing/book" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-red-600 px-6 py-3 font-black text-white hover:bg-brand-red-700">
              <CalendarDays className="h-5 w-5" /> Book a testing appointment
            </Link>
            <Link href="#providers" className="inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-slate-300 bg-white px-6 py-3 font-black text-slate-900 hover:bg-slate-50">
              Browse exams & prices
            </Link>
            <Link href="/testing/for-employers" className="inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-brand-blue-200 bg-brand-blue-50 px-6 py-3 font-black text-brand-blue-900">
              Employer / group testing
            </Link>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <p className="mt-2 font-bold text-slate-900">Verified checkout pricing</p>
              <p className="mt-1 text-sm text-slate-600">
                The selected exam and published amount are verified again before payment.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <MapPin className="h-5 w-5 text-brand-blue-600" />
              <p className="mt-2 font-bold text-slate-900">Appointment required</p>
              <p className="mt-1 text-sm text-slate-600">
                Testing modes and check-in requirements vary by provider.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <CalendarDays className="h-5 w-5 text-brand-red-600" />
              <p className="mt-2 font-bold text-slate-900">Exact exam selection</p>
              <p className="mt-1 text-sm text-slate-600">
                Payment is tied to the specific exam selected.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="providers" className="scroll-mt-24 py-14">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-3xl font-black text-slate-950">Available providers</h2>
              <p className="mt-2 text-slate-600">
                Open a provider to review exams, delivery mode, and purchase options.
              </p>
            </div>
            <Link
              href="/testing/for-employers"
              className="inline-flex items-center gap-2 font-bold text-brand-blue-700 hover:underline"
            >
              Employer / cohort testing <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {ACTIVE_PROVIDERS.map((provider) => {
              const pricedExams = purchasableExams(provider);
              const providerPriceLabel = priceLabel(provider);
              const canCheckout = pricedExams.length > 0;
              return (
                <article
                  key={provider.key}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  <Link
                    href={`/testing/${provider.key}`}
                    className="relative block h-56 overflow-hidden"
                  >
                    <Image
                      src={PROVIDER_IMAGES[provider.key] || '/images/pages/tech-classroom.webp'}
                      alt={provider.name}
                      fill
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-cover object-center transition-transform duration-300 hover:scale-[1.02]"
                    />
                  </Link>

                  <div className="p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-2xl font-black text-slate-950">{provider.name}</h3>
                        <p className="mt-1 text-sm font-semibold text-slate-500">
                          {CAPABILITY_LABELS[provider.capability]}
                        </p>
                      </div>
                      {canCheckout ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 ring-1 ring-emerald-200">
                          <BadgeCheck className="h-4 w-4" /> Online checkout
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-900 ring-1 ring-amber-200">
                          <CircleDollarSign className="h-4 w-4" /> Pricing not configured
                        </span>
                      )}
                    </div>

                    <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-slate-600">
                      {provider.description}
                    </p>

                    <div className="mt-5 rounded-xl bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Available retail pricing
                        </p>
                        {providerPriceLabel && (
                          <p className="text-2xl font-black text-slate-950">{providerPriceLabel}</p>
                        )}
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600">
                        {canCheckout
                          ? 'Select the exact exam to see its configured total and continue to secure checkout.'
                          : 'This provider currently has no exam-level retail amount configured for online purchase.'}
                      </p>
                    </div>

                    <div className="mt-5 space-y-2">
                      {provider.exams.slice(0, 4).map((exam) => {
                        const name = examName(exam);
                        const cents = examAmount(provider, exam);
                        return (
                          <div
                            key={name}
                            className="flex flex-col items-stretch gap-3 border-b border-slate-100 pb-3 text-sm last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <span className="min-w-0 break-words font-medium leading-6 text-slate-700">{name}</span>
                            {cents ? (
                              <div className="flex shrink-0 flex-col gap-2 min-[420px]:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                                <Link
                                  href={`/testing/checkout?provider=${encodeURIComponent(provider.key)}&exam=${encodeURIComponent(name)}`}
                                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-brand-red-700"
                                >
                                  Pay {`${(cents / 100).toFixed(2)}`} now
                                  <ArrowRight className="h-3.5 w-3.5" />
                                </Link>
                                <AddExamToCartButton
                                  examType={provider.key}
                                  examName={name}
                                  amountCents={cents}
                                  active
                                />
                              </div>
                            ) : (
                              <span className="text-xs font-semibold text-slate-500">
                                Not configured
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-6 flex flex-col gap-3 min-[420px]:flex-row min-[420px]:flex-wrap">
                      <Link
                        href={`/testing/${provider.key}`}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-bold text-slate-800 hover:bg-slate-50"
                      >
                        View exams <ArrowRight className="h-4 w-4" />
                      </Link>
                      {canCheckout ? (
                        <Link
                          href={`/testing/checkout?provider=${provider.key}`}
                          className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-red-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-red-700"
                        >
                          Choose exam & pay <ArrowRight className="h-4 w-4" />
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mx-auto mt-12 max-w-2xl">
            <h2 className="mb-4 text-2xl font-black text-slate-950">Your testing cart</h2>
            <TestingCart />
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 py-12">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-2xl font-black text-slate-950">Testing policies</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="font-bold text-slate-900">Scheduling</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Appointment required. Arrive {TESTING_CENTER.policy.arriveMinutesBefore} minutes
                early for in-person exams. Testing modes vary by provider.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="font-bold text-slate-900">Funding and payment</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {TESTING_CENTER.policy.workforceFunding} Self-pay checkout is available for exams
                with a configured retail amount in the canonical testing registry.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
