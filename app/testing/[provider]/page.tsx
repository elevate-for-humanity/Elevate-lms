import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Clock,
  MapPin,
  Monitor,
  DollarSign,
  ExternalLink,
  CalendarDays,
  Briefcase,
} from 'lucide-react';
import { CERT_PROVIDERS } from '@/lib/testing/proctoring-capabilities';
import { getProvidersForAmount } from '@/lib/bnpl-config';
import { TestingCartProvider } from '@/components/testing/TestingCart';
import { ProviderExamList } from '@/components/testing/ProviderExamList';

export const dynamic = 'force-dynamic';
import { createPublicClient } from '@/lib/supabase/public';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

const LEVEL_COLORS: Record<string, string> = {
  amber: 'bg-amber-50 border-amber-200 text-amber-900',
  slate: 'bg-slate-50 border-slate-200 text-slate-900',
  yellow: 'bg-yellow-50 border-yellow-200 text-yellow-900',
  blue: 'bg-blue-50 border-blue-200 text-blue-900',
};

// Hero images per provider key
const PROVIDER_HERO: Record<string, string> = {
  esco: '/images/pages/hvac-technician.webp',
  certiport: '/images/pages/programs-it-hero.webp',
  nha: '/images/pages/medical-assistant.webp',
  nrf: '/images/pages/apply-employer-hero.webp',
  workkeys: '/images/pages/career-services-page-4.webp',
  careersafe: '/images/pages/apprenticeships-hero.webp',
  midland: '/images/pages/hvac-technician.webp',
};

const PROVIDER_ACCENT: Record<string, string> = {
  esco: 'from-sky-900',
  certiport: 'from-brand-blue-900',
  nha: 'from-emerald-900',
  nrf: 'from-orange-900',
  workkeys: 'from-violet-900',
  careersafe: 'from-yellow-900',
  midland: 'from-sky-900',
};

const CAPABILITY_LABEL: Record<string, { label: string; icon: typeof MapPin }> = {
  IN_PERSON_ONLY: { label: 'In-person proctored only', icon: MapPin },
  IN_PERSON_OR_PROVIDER_REMOTE: { label: 'In-person or remote (provider system)', icon: Monitor },
  CENTER_REMOTE_ALLOWED: { label: 'In-person or live online proctoring', icon: Monitor },
};

interface Props {
  params: Promise<{ provider: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { provider: key } = await params;
  const p = CERT_PROVIDERS[key];
  if (!p) return {};
  return {
    title: `${p.name} | Testing Center | ${PLATFORM_DEFAULTS.orgName}`,
    description: p.description,
    alternates: { canonical: `${PLATFORM_DEFAULTS.siteUrl}/testing/${key}` },
  };
}

export default async function ProviderPage({ params }: Props) {
  const { provider: key } = await params;

  // Try DB first — fall back to static file if table is empty or row missing
  let dbOverride: {
    description?: string;
    status?: string;
    fees?: any;
    website_url?: string;
  } | null = null;
  // PUBLIC ROUTE: testing provider detail — no auth required.
  try {
    const db = createPublicClient();
    const { data } = await db
      .from('testing_providers')
      .select('description,status,fees,website_url')
      .eq('key', key)
      .maybeSingle();
    if (data) dbOverride = data;
  } catch {
    /* fall through to static */
  }

  const provider = CERT_PROVIDERS[key];
  if (!provider) notFound();

  // Merge DB overrides on top of static data
  if (dbOverride) {
    if (dbOverride.description) (provider as any).description = dbOverride.description;
    if (dbOverride.status) (provider as any).status = dbOverride.status;
    if (dbOverride.fees) (provider as any).fees = dbOverride.fees;
    if (dbOverride.website_url) (provider as any).verifyUrl = dbOverride.website_url;
  }

  const heroImg = PROVIDER_HERO[key] ?? '/images/pages/career-services-hero.webp';
  const accent = PROVIDER_ACCENT[key] ?? 'from-brand-blue-900';
  const capInfo = CAPABILITY_LABEL[provider.capability];
  const CapIcon = capInfo?.icon ?? MapPin;
  const isActive = provider.status === 'active';

  return (
    <TestingCartProvider>
    <main className="min-h-screen bg-white">
      {/* HERO */}
      <section
        className="relative flex items-end overflow-hidden"
        style={{ minHeight: 'clamp(260px, 45vw, 520px)' }}
      >
        {/* IMAGE-CONTRACT: placeholder-review required (blurDataURL or approved fallback) */}
        <Image sizes="100vw"
          src={heroImg}
          alt={provider.name}
          fill
          className="object-cover object-center"
          priority
        />
        {/* gradient overlay — bottom only, no text on video rule doesn't apply to static images */}
        <div
          className={`absolute inset-0 bg-gradient-to-t ${accent} via-transparent to-transparent opacity-90`}
        />
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pb-8 sm:pb-12 w-full">
          {/* Breadcrumb */}
          <nav className="text-sm text-white/60 mb-4">
            <Link href="/testing" className="hover:text-white transition-colors">
              Testing Center
            </Link>
            <span className="mx-2">/</span>
            <span className="text-white">{provider.name}</span>
          </nav>
          {/* Status badge */}
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4 ${
              isActive
                ? 'bg-brand-green-500/20 text-brand-green-300 border border-brand-green-500/30'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-brand-green-400' : 'bg-amber-400'}`}
            />
            {isActive ? 'Authorized Testing Site' : 'Available Through Partner'}
          </span>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-3">
            {provider.name}
          </h1>
          <div className="flex items-center gap-2 text-white/70 text-sm">
            <CapIcon className="w-4 h-4 flex-shrink-0" />
            <span>{capInfo?.label}</span>
          </div>
        </div>
      </section>

      {/* BODY */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 grid lg:grid-cols-3 gap-8 lg:gap-10">
        {/* Left — description + exams */}
        <div className="lg:col-span-2 space-y-10">
          {/* About */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">About This Exam</h2>
            <p className="text-slate-600 text-base leading-relaxed">{provider.description}</p>
            {provider.verifyUrl && (
              <a
                href={provider.verifyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-4 text-sm text-blue-600 hover:underline font-medium"
              >
                Official verification / more info <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </section>

          {/* Exams available */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Exams Available</h2>
            <ProviderExamList
              providerKey={key}
              exams={provider.exams}
              isActive={isActive}
            />
          </section>

          {/* Proctoring options */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">How It Works</h2>
            <p className="text-slate-600 text-sm mb-4">
              All exams are proctored. Most are administered in-person at our Indianapolis testing
              center.
              {provider.capability !== 'IN_PERSON_ONLY'
                ? ' This provider also supports remote proctoring — see options below.'
                : ''}
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                <MapPin className="w-5 h-5 text-brand-red-600 mb-2" />
                <h3 className="font-semibold text-slate-900 mb-1">In-Person (Required)</h3>
                <p className="text-slate-600 text-sm">
                  Proctored at our Indianapolis testing center. Appointment required — no walk-ins.
                  Arrive 15 minutes early with valid government-issued photo ID.
                </p>
              </div>
              {provider.capability !== 'IN_PERSON_ONLY' && (
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                  <Monitor className="w-5 h-5 text-blue-600 mb-2" />
                  <h3 className="font-semibold text-slate-900 mb-1">
                    {provider.capability === 'CENTER_REMOTE_ALLOWED'
                      ? 'Live Online Proctoring'
                      : 'Remote (Provider System)'}
                  </h3>
                  <p className="text-slate-600 text-sm">
                    {provider.capability === 'CENTER_REMOTE_ALLOWED'
                      ? 'We proctor you live via video. Take the exam from home with a webcam and stable internet. Appointment still required.'
                      : 'This provider operates their own remote proctoring system. You may test remotely through their platform or in-person at our center.'}
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Jobs this credential unlocks */}
          {'ncrcJobProfiles' in provider && Array.isArray((provider as any).ncrcJobProfiles) && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Briefcase className="w-6 h-6 text-brand-blue-600" />
                <h2 className="text-2xl font-bold text-slate-900">Jobs This Credential Unlocks</h2>
              </div>
              <p className="text-slate-700 text-sm mb-6">
                Employers use these credentials as a hiring filter. Knowing the target level before
                you test helps you prepare to the right standard.
              </p>
              <div className="space-y-4">
                {((provider as any).ncrcJobProfiles as any[])?.map((tier: any) => (
                  <div
                    key={tier.level}
                    className={`rounded-xl border p-5 ${LEVEL_COLORS[tier.color] ?? LEVEL_COLORS.slate}`}
                  >
                    <div className="flex items-baseline gap-3 mb-3">
                      <span className="font-extrabold text-base">{tier.level}</span>
                      <span className="text-xs font-medium opacity-70">{tier.score}</span>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {(tier.jobs ?? []).map((job: any) => (
                        <div key={job.title} className="flex items-start gap-2">
                          <span className="text-slate-300 flex-shrink-0 select-none mt-0.5">—</span>
                          <div>
                            <p className="text-sm font-semibold leading-snug">{job.title}</p>
                            {job.note && (
                              <p className="text-xs opacity-70 leading-snug">{job.note}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right — exam portal + pricing + CTA */}
        <aside className="space-y-6">
          {/* Pricing card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-900 px-6 py-4">
              <div className="flex items-center gap-2 text-white">
                <DollarSign className="w-5 h-5" />
                <h3 className="font-bold text-lg">Pricing</h3>
              </div>
            </div>
            <div className="px-6 py-5 space-y-4">
              {provider.fees && provider.fees.length > 0 ? (
                provider.fees.map((fee, i) => (
                  <div key={i} className={i > 0 ? 'pt-4 border-t border-slate-100' : ''}>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-slate-700 text-sm font-medium">{fee.label}</span>
                      <span className="text-2xl font-extrabold text-slate-900">${fee.amount}</span>
                    </div>
                    {fee.note && <p className="text-slate-600 text-xs mt-1">{fee.note}</p>}
                  </div>
                ))
              ) : (
                <p className="text-slate-700 text-sm">
                  Pricing quoted on request — contact us for details.
                </p>
              )}
              {provider.groupDiscount && (
                <div className="bg-brand-green-50 rounded-lg p-3 border border-brand-green-100 mt-2">
                  <p className="text-brand-green-800 text-xs font-medium">{provider.groupDiscount}</p>
                </div>
              )}

              {/* BNPL badges */}
              {provider.fees && provider.fees.length > 0 && (() => {
                const minFee = Math.min(...provider.fees.map((f: any) => f.amount));
                const bnpl = getProvidersForAmount(minFee);
                if (!bnpl.length) return null;
                return (
                  <div className="pt-3 border-t border-slate-100">
                    <p className="text-xs text-slate-500 mb-2">Split your payment — accepted at checkout</p>
                    <div className="flex flex-wrap gap-1.5">
                      {bnpl.map((p) => (
                        <span
                          key={p.id}
                          className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full ${p.badgeBg} ${p.badgeText}`}
                        >
                          {p.name}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })()}

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                Funding assistance is currently centered on Indiana workforce pathways. We are
                expanding to additional regions. If funding is unavailable for your location, use
                self-pay checkout to reserve your exam seat.
              </div>
            </div>
          </div>

          {/* Book CTA */}
          {isActive && (
            <div className="space-y-3">
              <Link
                href={`/testing/book?exam=${key}`}
                className="flex items-center justify-center gap-2 w-full bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-6 py-4 rounded-xl transition-colors"
              >
                <CalendarDays className="w-5 h-5" />
                Book at Elevate Testing Center
              </Link>

              <Link
                href="/testing"
                className="flex items-center justify-center w-full border border-slate-200 text-slate-700 font-medium px-6 py-3 rounded-xl hover:bg-slate-50 transition-colors text-sm"
              >
                ← All Testing Options
              </Link>
            </div>
          )}
          {!isActive && (
            <div className="space-y-3">
              <Link
                href="/contact"
                className="flex items-center justify-center gap-2 w-full bg-slate-800 hover:bg-slate-900 text-white font-bold px-6 py-4 rounded-xl transition-colors"
              >
                Contact Us for Access
              </Link>
              <Link
                href="/testing"
                className="flex items-center justify-center w-full border border-slate-200 text-slate-700 font-medium px-6 py-3 rounded-xl hover:bg-slate-50 transition-colors text-sm"
              >
                ← All Testing Options
              </Link>
            </div>
          )}

          {/* What to bring */}
          <div className="bg-amber-50 rounded-xl p-5 border border-amber-100">
            <h4 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" /> What to Bring
            </h4>
            <ul className="text-amber-800 text-sm space-y-1.5">
              <li>• Valid government-issued photo ID</li>
              <li>• Confirmation email / booking reference</li>
              <li>• Arrive 15 minutes early</li>
              {provider.capability !== 'IN_PERSON_ONLY' && (
                <li>• Webcam + stable internet (remote option)</li>
              )}
            </ul>
          </div>
        </aside>
      </div>

      {/* BOTTOM CTA */}
      <section className="bg-slate-900 py-12 sm:py-16 px-4 sm:px-6 text-center">
        <h2 className="text-3xl font-extrabold text-white mb-3">Ready to Get Certified?</h2>
        <p className="text-slate-300 mb-8 max-w-xl mx-auto">
          All exams are by appointment only. Walk-ins are not accepted. Same-day appointments may be
          available depending on capacity — call us to check.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          {isActive && (
            <Link
              href={`/testing/book?exam=${key}`}
              className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-4 rounded-full transition-colors"
            >
              Book Now
            </Link>
          )}
          <Link
            href="/testing"
            className="border border-slate-500 text-white hover:text-white hover:border-white font-bold px-8 py-4 rounded-full transition-colors"
          >
            View All Exams
          </Link>
        </div>
      </section>
    </main>
    </TestingCartProvider>
  );
}
