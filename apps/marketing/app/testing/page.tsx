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
import { TESTING_CENTER } from '@/lib/testing/testing-config';
import {
  ACTIVE_PROVIDERS,
  type ExamDefinition,
  type CertProvider,
} from '@/lib/testing/proctoring-capabilities';
import {
  getPublicTestingPricingNote,
  isPublicTestingPriceVerified,
} from '@/lib/testing/public-pricing';

export const metadata: Metadata = {
  title: 'Testing & Credential Exams | Elevate for Humanity',
  description:
    'Workforce credential exams and proctor-supervised certification testing. View available providers, exact verified prices when published, and scheduling options.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/testing' },
};

const PROVIDER_IMAGES: Record<string, string> = {
  esco: '/images/pages/hvac-unit.jpg',
  nrf: '/images/pages/certifications-page-1.webp',
  certiport: '/images/pages/testing-page-1.jpg',
  nha: '/images/pages/medical-assistant.webp',
  workkeys: '/images/pages/career-services-page-1.webp',
  careersafe: '/images/pages/programs-emergency-health-safety-hero.jpg',
  midland: '/images/pages/competency-test-hero.jpg',
};

const CAPABILITY_LABELS: Record<string, string> = {
  IN_PERSON_ONLY: 'In-person proctored',
  IN_PERSON_OR_PROVIDER_REMOTE: 'In-person or provider remote',
  CENTER_REMOTE_ALLOWED: 'In-person or live online',
};

function examName(exam: string | ExamDefinition): string {
  return typeof exam === 'string' ? exam : exam.name;
}

function examAmount(exam: string | ExamDefinition): number | null {
  if (typeof exam === 'string') return null;
  return exam.amountCents && exam.amountCents > 0 ? exam.amountCents : null;
}

function verifiedPriceLabel(provider: CertProvider): string | null {
  if (!isPublicTestingPriceVerified(provider.key)) return null;
  const amounts = provider.exams
    .map(examAmount)
    .filter((amount): amount is number => typeof amount === 'number');
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
        <Image
          src="/images/pages/testing-center-hero.webp"
          alt="Credential testing and career readiness"
          fill
          sizes="100vw"
          className="object-cover object-center"
          priority
        />
      </section>

      <section className="border-b border-slate-100 bg-white py-10">
        <div className="mx-auto max-w-5xl px-4">
          <p className="mb-3 text-sm font-bold uppercase tracking-widest text-brand-red-600">
            Elevate Testing Center
          </p>
          <h1 className="max-w-4xl text-4xl font-black leading-tight text-slate-950 sm:text-5xl">
            Choose the credential exam. See the real price. Then schedule.
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-slate-600">
            This is the canonical public testing catalog. Published prices appear only when Elevate
            has explicitly verified the retail total. Provider-cost estimates and planning numbers
            are not used as customer prices.
          </p>

          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <p className="mt-2 font-bold text-slate-900">No estimate-based checkout</p>
              <p className="mt-1 text-sm text-slate-600">Unverified provider costs are quote-only.</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <MapPin className="h-5 w-5 text-brand-blue-600" />
              <p className="mt-2 font-bold text-slate-900">Appointment required</p>
              <p className="mt-1 text-sm text-slate-600">No walk-ins. Bring valid photo ID.</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <CalendarDays className="h-5 w-5 text-brand-red-600" />
              <p className="mt-2 font-bold text-slate-900">Exact exam selection</p>
              <p className="mt-1 text-sm text-slate-600">Payment is tied to the specific exam chosen.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-14">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-3xl font-black text-slate-950">Available providers</h2>
              <p className="mt-2 text-slate-600">
                Open a provider to review exams, delivery mode, and current payment status.
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
              const verified = isPublicTestingPriceVerified(provider.key);
              const priceLabel = verifiedPriceLabel(provider);
              return (
                <article
                  key={provider.key}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  <Link href={`/testing/${provider.key}`} className="relative block h-56 overflow-hidden">
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
                      {verified ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 ring-1 ring-emerald-200">
                          <BadgeCheck className="h-4 w-4" /> Verified price
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-900 ring-1 ring-amber-200">
                          <CircleDollarSign className="h-4 w-4" /> Price confirmation required
                        </span>
                      )}
                    </div>

                    <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-slate-600">
                      {provider.description}
                    </p>

                    <div className="mt-5 rounded-xl bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Public pricing
                        </p>
                        {priceLabel && <p className="text-2xl font-black text-slate-950">{priceLabel}</p>}
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600">
                        {getPublicTestingPricingNote(provider.key)}
                      </p>
                    </div>

                    <div className="mt-5 space-y-2">
                      {provider.exams.slice(0, 4).map((exam) => {
                        const name = examName(exam);
                        const cents = verified ? examAmount(exam) : null;
                        return (
                          <div
                            key={name}
                            className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2 text-sm last:border-0 last:pb-0"
                          >
                            <span className="font-medium text-slate-700">{name}</span>
                            {cents ? (
                              <span className="font-black text-slate-950">${(cents / 100).toFixed(0)}</span>
                            ) : (
                              <span className="text-xs font-semibold text-slate-500">Price on confirmation</span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                      <Link
                        href={`/testing/${provider.key}`}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-bold text-slate-800 hover:bg-slate-50"
                      >
                        View exams <ArrowRight className="h-4 w-4" />
                      </Link>
                      {verified ? (
                        <Link
                          href={`/testing/checkout?provider=${provider.key}`}
                          className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-red-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-red-700"
                        >
                          Choose exam & pay <ArrowRight className="h-4 w-4" />
                        </Link>
                      ) : (
                        <Link
                          href={`/contact?topic=testing-pricing&provider=${provider.key}`}
                          className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-blue-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-blue-800"
                        >
                          Request current price <ArrowRight className="h-4 w-4" />
                        </Link>
                      )}
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
                Appointment required. Arrive {TESTING_CENTER.policy.arriveMinutesBefore} minutes early
                for in-person exams. Testing modes vary by provider.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="font-bold text-slate-900">Funding and payment</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {TESTING_CENTER.policy.workforceFunding} Self-pay is available only when the exact
                public price has been verified for online checkout.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
