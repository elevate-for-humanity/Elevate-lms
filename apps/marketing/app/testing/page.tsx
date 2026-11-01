import { PublicEditorialHero } from '@/components/marketing/PublicEditorialHero';
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
import { getPublicExamAmountCents } from '@/lib/testing/exam-pricing';
import { TESTING_PROVIDER_IMAGES } from '@/lib/testing/provider-images';
import TestingCart, { AddExamToCartButton } from '@/components/testing/TestingCart';
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

const CAPABILITY_LABELS: Record<string, string> = {
  IN_PERSON_ONLY: 'In-person proctored',
  IN_PERSON_OR_PROVIDER_REMOTE: 'In-person or provider remote',
  CENTER_REMOTE_ALLOWED: 'In-person or live online',
};

function examName(exam: string | ExamDefinition): string {
  return typeof exam === 'string' ? exam : exam.name;
}

function purchasableExams(provider: CertProvider) {
  return provider.exams
    .map((exam) => ({ exam, amountCents: getPublicExamAmountCents(provider, exam) }))
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

      <PublicEditorialHero
        eyebrow="Elevate Testing Center"
        title="Choose your exam. Take your next step."
        description="Compare credential exams, review prices and delivery options, then choose your testing date. You will see the exact exam and total before payment."
        image="/images/licensed-envato/testing-exam-291b8cff.webp"
        imageAlt="Adult learners concentrating on a written classroom exam"
      >
        <Link
          href="/testing/book"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-red-600 px-6 py-3 font-black text-white hover:bg-brand-red-700"
        >
          <CalendarDays className="h-5 w-5" /> Choose exam & testing date
        </Link>
        <Link
          href="#providers"
          className="inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-slate-300 bg-white px-6 py-3 font-black text-slate-900 hover:bg-slate-50"
        >
          Browse exams & prices
        </Link>
        <Link
          href="/testing/for-employers"
          className="inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-brand-blue-200 bg-brand-blue-50 px-6 py-3 font-black text-brand-blue-900"
        >
          Employer / group testing
        </Link>
      </PublicEditorialHero>
      <section className="border-b border-slate-100 bg-white py-6">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <p className="mt-2 font-bold text-slate-900">Review before payment</p>
              <p className="mt-1 text-sm text-slate-600">
                Your exact exam, appointment and total are shown before you pay.
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

          <div className="mb-6">
            <TestingCart />
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
                      src={
                        TESTING_PROVIDER_IMAGES[provider.key]?.src ||
                        '/images/refresh-20261014/technology.webp'
                      }
                      alt={
                        TESTING_PROVIDER_IMAGES[provider.key]?.alt ||
                        `Illustrative training for ${provider.name}`
                      }
                      fill
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-cover object-[center_30%] transition-transform duration-300 motion-safe:hover:scale-[1.02] motion-reduce:transition-none"
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
                          <CircleDollarSign className="h-4 w-4" /> Ask for current pricing
                        </span>
                      )}
                    </div>

                    <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-slate-600">
                      {provider.description}
                    </p>

                    <div className="mt-5 rounded-xl bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Exam fees
                        </p>
                        {providerPriceLabel && (
                          <p className="text-2xl font-black text-slate-950">{providerPriceLabel}</p>
                        )}
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600">
                        {canCheckout
                          ? 'Select your exam, choose an available date, and review the total before checkout.'
                          : 'Contact the Testing Center to confirm the current fee and available dates.'}
                      </p>
                    </div>

                    <div className="mt-5 space-y-2">
                      {provider.exams.slice(0, 4).map((exam) => {
                        const name = examName(exam);
                        const cents = getPublicExamAmountCents(provider, exam);
                        return (
                          <div
                            key={name}
                            className="flex flex-col items-stretch gap-3 border-b border-slate-100 pb-3 text-sm last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <span className="min-w-0 break-words font-medium leading-6 text-slate-700">
                              {name}
                            </span>
                            {cents ? (
                              <div className="flex shrink-0 flex-col gap-2 min-[420px]:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                                <Link
                                  href={`/testing/checkout?provider=${encodeURIComponent(provider.key)}&exam=${encodeURIComponent(name)}`}
                                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-brand-red-700"
                                >
                                  Book — {`$${(cents / 100).toFixed(2)}`}
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
                                Contact for pricing
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
                        View all {provider.exams.length} exams <ArrowRight className="h-4 w-4" />
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
