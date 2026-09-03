import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, BadgeCheck, ExternalLink, MapPin, ShieldCheck } from 'lucide-react';
import {
  CERT_PROVIDERS,
  type ExamDefinition,
} from '@/lib/testing/proctoring-capabilities';
import {
  getPublicTestingPricingNote,
  isPublicTestingPriceVerified,
} from '@/lib/testing/public-pricing';
import { TESTING_CENTER } from '@/lib/testing/testing-config';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { AddExamToCartButton } from '@/components/testing/TestingCart';
import TestingCart from '@/components/testing/TestingCart';

export const dynamic = 'force-dynamic';

const PROVIDER_HERO: Record<string, string> = {
  esco: '/images/pages/hvac-technician.webp',
  certiport: '/images/pages/programs-it-hero.webp',
  nha: '/images/pages/medical-assistant.webp',
  nrf: '/images/pages/apply-employer-hero.webp',
  workkeys: '/images/pages/career-services-page-4.webp',
  careersafe: '/images/pages/apprenticeships-hero.webp',
  midland: '/images/pages/hvac-technician.webp',
};

const CAPABILITY_LABELS: Record<string, string> = {
  IN_PERSON_ONLY: 'In-person proctored',
  IN_PERSON_OR_PROVIDER_REMOTE: 'In-person or provider-managed remote',
  CENTER_REMOTE_ALLOWED: 'In-person or live online',
};

interface Props {
  params: Promise<{ provider: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { provider: key } = await params;
  const provider = CERT_PROVIDERS[key];
  if (!provider) return {};
  return {
    title: `${provider.name} | Testing Center | ${PLATFORM_DEFAULTS.orgName}`,
    description: provider.description,
    alternates: { canonical: `${PLATFORM_DEFAULTS.siteUrl}/testing/${key}` },
  };
}

function examName(exam: string | ExamDefinition): string {
  return typeof exam === 'string' ? exam : exam.name;
}

function examDescription(exam: string | ExamDefinition): string | undefined {
  return typeof exam === 'string' ? undefined : exam.description;
}

function examAmount(exam: string | ExamDefinition): number | null {
  if (typeof exam === 'string') return null;
  return exam.amountCents && exam.amountCents > 0 ? exam.amountCents : null;
}

export default async function ProviderPage({ params }: Props) {
  const { provider: key } = await params;
  const provider = CERT_PROVIDERS[key];
  if (!provider || provider.publicVisible === false) notFound();

  const verified = isPublicTestingPriceVerified(key);
  const hero = PROVIDER_HERO[key] ?? '/images/pages/career-services-page-1.webp';

  return (
    <main className="min-h-screen bg-white">
      <section className="relative h-[300px] overflow-hidden bg-slate-100 sm:h-[420px]">
        <Image
          src={hero}
          alt={provider.name}
          fill
          sizes="100vw"
          className="object-cover object-center"
          priority
        />
      </section>

      <section className="border-b border-slate-100 bg-white py-9">
        <div className="mx-auto max-w-5xl px-4">
          <Link
            href="/testing"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-brand-red-700"
          >
            <ArrowLeft className="h-4 w-4" /> Testing Center
          </Link>

          <div className="mt-5 flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
            <div className="max-w-3xl">
              <h1 className="text-4xl font-black text-slate-950">{provider.name}</h1>
              <p className="mt-3 text-sm font-bold text-slate-500">
                {CAPABILITY_LABELS[provider.capability]}
              </p>
              <p className="mt-5 text-lg leading-relaxed text-slate-600">{provider.description}</p>
            </div>

            {verified ? (
              <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-800 ring-1 ring-emerald-200">
                <BadgeCheck className="h-4 w-4" /> Verified public price
              </span>
            ) : (
              <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-sm font-bold text-amber-900 ring-1 ring-amber-200">
                <ShieldCheck className="h-4 w-4" /> Price confirmation required
              </span>
            )}
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-5xl px-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">Pricing policy</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              {getPublicTestingPricingNote(key)}
            </p>
          </div>

          <div className="mt-10">
            <h2 className="text-3xl font-black text-slate-950">Available exams</h2>
            <p className="mt-2 text-slate-600">
              Select the exact exam. Verified prices are shown per exam; unverified provider costs
              are confirmed before any payment is collected.
            </p>

            <div className="mt-6 space-y-4">
              {provider.exams.map((exam) => {
                const name = examName(exam);
                const description = examDescription(exam);
                const cents = verified ? examAmount(exam) : null;
                return (
                  <article key={name} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                      <div className="max-w-3xl">
                        <h3 className="text-lg font-black text-slate-950">{name}</h3>
                        {description && (
                          <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
                        )}
                        {typeof exam !== 'string' && exam.durationMinutes && (
                          <p className="mt-2 text-xs font-semibold text-slate-500">
                            Typical duration: {exam.durationMinutes} minutes
                          </p>
                        )}
                      </div>

                      <div className="shrink-0 sm:text-right">
                        {cents ? (
                          <p className="text-2xl font-black text-slate-950">${(cents / 100).toFixed(0)}</p>
                        ) : (
                          <p className="text-sm font-bold text-amber-800">Price confirmed before payment</p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      {verified && cents ? (
                        <>
                          <Link
                            href={`/testing/checkout?provider=${key}&exam_name=${encodeURIComponent(name)}`}
                            className="inline-flex items-center gap-2 rounded-lg bg-brand-red-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-red-700"
                          >
                            Pay ${(cents / 100).toFixed(0)} now <ArrowRight className="h-4 w-4" />
                          </Link>
                          <AddExamToCartButton
                            examType={key}
                            examName={name}
                            amountCents={cents}
                            active
                            className="inline-flex items-center gap-2 rounded-lg border-2 border-brand-blue-600 bg-white px-5 py-2.5 text-sm font-bold text-brand-blue-700 hover:bg-brand-blue-50"
                          />
                        </>
                      ) : (
                        <Link
                          href={`/contact?topic=testing-pricing&provider=${key}&exam=${encodeURIComponent(name)}`}
                          className="inline-flex items-center gap-2 rounded-lg bg-brand-blue-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-blue-800"
                        >
                          Request current price <ArrowRight className="h-4 w-4" />
                        </Link>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          <section className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
            <h2 className="text-2xl font-black text-slate-950">Testing cart</h2>
            <p className="mt-2 mb-5 text-sm text-slate-600">
              Add one or more exams, then pay the server-verified retail total. Scheduling stays locked until Stripe confirms payment.
            </p>
            <TestingCart />
          </section>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <MapPin className="h-5 w-5 text-brand-red-600" />
              <h2 className="mt-3 font-black text-slate-950">Testing location</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{TESTING_CENTER.address}</p>
              <p className="mt-2 text-sm text-slate-600">Appointment required. No walk-ins.</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <ShieldCheck className="h-5 w-5 text-brand-blue-600" />
              <h2 className="mt-3 font-black text-slate-950">Credential authority</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Credentials are issued by the named credentialing organization upon successful
                completion of its requirements; Elevate provides testing access and proctoring.
              </p>
              {provider.verifyUrl && (
                <a
                  href={provider.verifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-brand-blue-700 hover:underline"
                >
                  Provider information <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
