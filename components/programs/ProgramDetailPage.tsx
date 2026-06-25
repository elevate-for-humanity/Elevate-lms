'use client';

/**
 * ProgramDetailPage — Institutional Program Detail Template v1
 *
 * Renders all 10 required sections in fixed order.
 * Validates the program schema at render time in development.
 * HVAC Technician is the canonical reference implementation.
 */

import EnrollmentPipeline from '@/components/programs/EnrollmentPipeline';

import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import HeroVideo from '@/components/marketing/HeroVideo';
import HeroPicture from '@/components/marketing/HeroPicture';
import ProgramApplyForm from '@/components/programs/ProgramApplyForm';
import { PayNowButton } from '@/components/programs/PayNowButton';
import type { HeroBannerConfig } from '@/content/heroBanners';
import {
  BookOpen,
  Clock,
  DollarSign,
  MapPin,
  Shield,
  TrendingUp,
  ChevronRight,
  Award,
  ExternalLink,
  Layers,
} from 'lucide-react';
import type { ProgramSchema } from '@/lib/programs/program-schema';
import {
  validateProgram,
  getTotalHoursRange,
  getTotalHoursFromBreakdown,
  getPrimaryCTA,
  getEnrollmentTracks,
} from '@/lib/programs/program-schema';
import { DeliveryBadge, FundingSection } from './ProgramTruthBadges';
import ProgramFundingProcessSection from './ProgramFundingProcessSection';
import { resolveProgramFundingStatus } from '@/lib/programs/funding-visibility';
import { ICC_URL, ICC_INSTRUCTION, hero as heroTokens } from '@/lib/page-design-tokens';
import { DEFAULT_HERO_VIDEO, resolveHeroPosterSrc } from '@/lib/images/hero-banner-media';
import { formatDeliveryDisclosure } from '@/lib/programs/program-schema';
import { CredentialAuthorityFootnote } from '@/components/compliance/CredentialAuthorityFootnote';
import ProgramAtAGlance from '@/components/programs/ProgramAtAGlance';
import ProgramCredentialsSection from '@/components/programs/ProgramCredentialsSection';
import ProgramEmploymentPathway from '@/components/programs/ProgramEmploymentPathway';
import PaymentPlanCalculator from '@/components/programs/PaymentPlanCalculator';
import { ACTIVE_BNPL_PROVIDERS, BNPL_PROVIDER_SUMMARY } from '@/lib/bnpl-config';
import { PAYMENT_TERM_WEEKS as BARBER_PAYMENT_WEEKS } from '@/lib/barber/pricing';

/** Self-pay installment weeks — may differ from program duration (e.g. barber: 29 vs 52). */
const PAYMENT_WEEKS_BY_SLUG: Record<string, number> = {
  'barber-apprenticeship': BARBER_PAYMENT_WEEKS,
};

/** Programs with a dedicated multi-step apply flow — skip generic inline form. */
const DEDICATED_APPLY_SLUGS = new Set([
  'barber-apprenticeship',
  'cosmetology-apprenticeship',
  'esthetician-apprenticeship',
  'nail-technician-apprenticeship',
]);

interface Props {
  program: ProgramSchema;
  /** Banner data passed from the server page — bypasses client-side JSON cache limitation. */
  banner?: HeroBannerConfig | null;
  /** Replaces the default video/image hero entirely. */
  heroOverride?: React.ReactNode;
  /** Optional alert strip below the hero (e.g. enrollment open banner). */
  announcement?: React.ReactNode;
  /** Program-specific process section (e.g. apprenticeship steps) — renders after overview. */
  processSlot?: React.ReactNode;
  children?: React.ReactNode;
}

export default function ProgramDetailPage({
  program: p,
  banner: bannerProp,
  heroOverride,
  announcement,
  processSlot,
  children,
}: Props) {
  
  // Dev-time validation
  if (process.env.NODE_ENV === 'development') {
    const errors = validateProgram(p);
    if (errors.length > 0) {
      console.warn(`[ProgramDetailPage] Validation errors for "${p.slug}":`);
      errors.forEach((e) => console.warn(`  ${e.field}: ${e.message}`));
    }
  }

  const totalHours = getTotalHoursFromBreakdown(p);
  const hoursRange = getTotalHoursRange(p);
  const primaryCTA = getPrimaryCTA(p);
  const enrollmentTracks = getEnrollmentTracks(p);
  const deliveryDisclosure = formatDeliveryDisclosure(p.deliveredBy);
  const selfPayNumeric = Number((p.selfPayCost || '').replace(/[^0-9.]/g, '')) || 0;
  // Use depositAmount from program data if set, otherwise fall back to $600 minimum.
  const bnplDepositStart = p.depositAmount
    ? Number(p.depositAmount.replace(/[^0-9.]/g, ''))
    : ['barber-apprenticeship', 'cosmetology-apprenticeship', 'esthetician', 'nail-technician-apprenticeship'].includes(p.slug)
      ? 600
      : null;
  const paymentPlanWeeks = PAYMENT_WEEKS_BY_SLUG[p.slug] ?? p.durationWeeks;
  const estimatedWeeklyAfterDeposit =
    bnplDepositStart && selfPayNumeric > bnplDepositStart && paymentPlanWeeks > 0
      ? Math.ceil((selfPayNumeric - bnplDepositStart) / paymentPlanWeeks)
      : null;
  const hasDedicatedApply = DEDICATED_APPLY_SLUGS.has(p.slug);
  const fundingStatus = resolveProgramFundingStatus(p);
  const hasIndianaFunding =
    fundingStatus.showWorkforceFundingProcess || fundingStatus.isImpactFundable;
  const hasWIOAFunding = fundingStatus.isWioaFundable || fundingStatus.isWrgFundable;
  const hasImpactOnly =
    fundingStatus.isImpactFundable && !fundingStatus.showWorkforceFundingProcess;
  // Only beauty/apprenticeship programs have a working /eligibility page
  // (served by [program]/eligibility which calls getBeautyProgram)
  const eligibilityPageSlugs = new Set([
    'barber-apprenticeship',
    'cosmetology-apprenticeship',
    'esthetician-apprenticeship',
    'nail-technician-apprenticeship',
  ]);
  const hasEligibilityPage = eligibilityPageSlugs.has(p.slug);
  const requestInfoHref = p.cta?.requestInfoHref || `/contact?program=${encodeURIComponent(p.slug)}`;
  const employerPartners = Array.isArray(p.employerPartners) ? p.employerPartners : [];
  const pathwaySteps = [
    { step: 'Step 1', title: 'Eligibility & Intake', detail: 'Funding and readiness screening to start the right track immediately.' },
    { step: 'Step 2', title: 'Training & Assessments', detail: 'Structured modules, lessons, and checkpoints in a tracked LMS path.' },
    { step: 'Step 3', title: 'Credential', detail: 'Industry credential completion plus verifiable training records.' },
    { step: 'Step 4', title: 'Employer Placement', detail: 'Placement support through named employer partners and matching workflow.' },
    { step: 'Step 5', title: 'Wage Outcome', detail: `Target entry wages aligned to ${p.laborMarket?.salaryRange ?? 'regional labor data'}.` },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* A. HERO */}
      <section>
        {heroOverride ??
          (() => {
            // bannerProp is passed from the server page.tsx — use it first.
            // heroBanners Proxy returns {} on the client (loadJsonOnce is server-only).
            // Check pageKey to distinguish a real banner from the empty fallback object.
            const banner = bannerProp;
            const heroPosterSrc = resolveHeroPosterSrc(p.slug, {
              banner,
              heroImage: p.heroImage,
            });
            // Render the video hero only when a real video source is configured.
            // Programs without a dedicated video (e.g. beauty/culinary, which have
            // no beauty video assets) fall through to the still-image hero so they
            // never inherit another program's video.
            if (banner?.pageKey && banner.videoSrcDesktop) {
              const bannerCtas = [
                banner.primaryCta,
                ...(banner.secondaryCta ? [banner.secondaryCta] : []),
              ];
              return (
                <HeroVideo
                  videoSrcDesktop={banner.videoSrcDesktop ?? DEFAULT_HERO_VIDEO}
                  videoSrcMobile={banner.videoSrcMobile}
                  voiceoverSrc={banner.voiceoverSrc}
                  microLabel={banner.microLabel}
                  analyticsName={banner.analyticsName}
                  belowHeroHeadline={banner.belowHeroHeadline}
                  belowHeroSubheadline={banner.belowHeroSubheadline}
                  ctas={bannerCtas}
                  trustIndicators={banner.trustIndicators}
                  transcript={banner.transcript}
                />
              );
            }
            // Fallback: picture hero when hero-banners.json has no entry
            return (
              <HeroPicture
                src={heroPosterSrc}
                alt={p.heroImageAlt ?? p.title}
                heightStyle={heroTokens.imageWrap}
                microLabel={p.badge ?? p.category}
                belowHeroHeadline={p.title}
                belowHeroSubheadline={p.subtitle}
                ctas={primaryCTA ? [{ label: primaryCTA.label, href: primaryCTA.href }] : undefined}
              />
            );
          })()}

        {/* Hero content panel — below image, no overlay */}
        <div className="bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-5">
              {(p.breadcrumbs ?? []).map((b, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  {i > 0 && <ChevronRight className="w-3 h-3" />}
                  {b.href ? (
                    <Link href={b.href} className="hover:text-slate-600 transition-colors">
                      {b.label}
                    </Link>
                  ) : (
                    <span className="text-slate-600 font-medium">{b.label}</span>
                  )}
                </span>
              ))}
            </nav>

            <div className="flex flex-col lg:flex-row lg:items-start gap-8">
              <div className="flex-1">
                {/* Badges row — program badge + delivery model */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {p.badge && (
                    <span
                      className={`inline-block text-xs font-bold text-white px-3 py-1 rounded-full ${
                        p.badgeColor === 'orange'
                          ? 'bg-brand-orange-500'
                          : p.badgeColor === 'green'
                            ? 'bg-brand-green-500'
                            : p.badgeColor === 'red'
                              ? 'bg-brand-red-500'
                              : 'bg-brand-blue-500'
                      }`}
                    >
                      {p.badge}
                    </span>
                  )}
                  {p.deliveryModelDetail && <DeliveryBadge model={p.deliveryModelDetail} />}
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-3">
                  {p.title}
                </h1>
                <p className="text-slate-600 text-base sm:text-lg max-w-2xl leading-relaxed mb-6">
                  {p.subtitle}
                </p>

                {/* Quick fact chips */}
                <div className="flex flex-wrap gap-2">
                  {[
                    {
                      icon: <Clock className="w-3.5 h-3.5" />,
                      val: `${p.durationWeeks} ${p.durationWeeks === 1 ? 'week' : 'weeks'}`,
                    },
                    {
                      icon: <BookOpen className="w-3.5 h-3.5" />,
                      val: `${p.hoursPerWeekMin}–${p.hoursPerWeekMax} hrs/week`,
                    },
                    {
                      icon: <Award aria-label="award" className="w-3.5 h-3.5" />,
                      val: `${p.credentials.length} credential${p.credentials.length !== 1 ? 's' : ''}`,
                    },
                    {
                      icon: <MapPin className="w-3.5 h-3.5" />,
                      val:
                        p.deliveryMode === 'hybrid'
                          ? 'Hybrid'
                          : p.deliveryMode === 'online'
                            ? 'Online'
                            : 'In-Person',
                    },
                  ].map(({ icon, val }) => (
                    <span
                      key={val}
                      className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-200"
                    >
                      {icon}
                      {val}
                    </span>
                  ))}
                </div>

                {/* Delivery disclosure */}
                {deliveryDisclosure && (
                  <p className="mt-4 text-xs text-slate-500">{deliveryDisclosure}</p>
                )}
              </div>

              {/* CTA card */}
              <div className="lg:w-64 flex-shrink-0">
                <div className="bg-white rounded-2xl shadow-xl p-5">
                  {/* Cost */}
                  <p className="text-2xl font-extrabold text-slate-900 mb-0.5">{p.selfPayCost}</p>

                  {/* Funding — only verified options, no fallback text */}
                  {p.fundingOptions && p.fundingOptions.length > 0 && (
                    <div className="mb-4 mt-2">
                      <FundingSection fundingOptions={p.fundingOptions} />
                    </div>
                  )}

                  {primaryCTA && (
                    <>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                        {primaryCTA.external ? 'Enrollment' : 'New Applicant'}
                      </p>
                      <Link
                        href={primaryCTA.href}
                        target={primaryCTA.external ? '_blank' : '_self'}
                        rel={primaryCTA.external ? 'noopener noreferrer' : undefined}
                        className="block w-full text-center bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold py-3 rounded-xl transition-colors text-sm mb-3"
                      >
                        {primaryCTA.label}
                      </Link>
                    </>
                  )}

                  {p.cta.enrollHref && (
                    <>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                        Already Enrolled?
                      </p>
                      <Link
                        href={p.cta.enrollHref}
                        className="block w-full text-center bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold py-3 rounded-xl transition-colors text-sm mb-3"
                      >
                        Go to My Courses
                      </Link>
                    </>
                  )}

                  <Link
                    href={p.cta.advisorHref || '/contact'}
                    className="block w-full text-center border-2 border-slate-200 hover:border-brand-blue-400 text-slate-700 font-semibold py-2.5 rounded-xl transition-colors text-sm"
                  >
                    Talk to an Advisor
                  </Link>
                  {p.cta.courseHref && (
                    <Link
                      href={p.cta.courseHref}
                      className="block w-full text-center text-brand-blue-600 hover:text-brand-blue-800 font-semibold py-2 text-xs mt-1"
                    >
                      View Course Details →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {announcement ? (
        <section className="border-b border-slate-100 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">{announcement}</div>
        </section>
      ) : null}

      <ProgramAtAGlance program={p} />
      <ProgramCredentialsSection program={p} />
      <ProgramEmploymentPathway program={p} />

      {processSlot}

      {/* CREDIBILITY STRIP */}
      <section className="py-8 border-y border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl font-extrabold text-slate-900">
                {p.laborMarket?.salaryRange ?? '—'}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">Typical wage range</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-slate-900">
                {totalHours > 0 ? `${totalHours} hrs` : hoursRange}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">Total training hours</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-slate-900">
                {`${p.credentials.length} credential${p.credentials.length !== 1 ? 's' : ''}`}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {p.credentials[0]?.issuingBody ?? 'Industry recognized'}
              </div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-slate-900">
                {p.laborMarket?.growthRate ?? '—'}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Job growth ({p.laborMarket?.sourceYear ?? ''})
              </div>
            </div>
          </div>
          {(p.complianceAlignment?.length ?? 0) > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-100 flex flex-wrap items-center gap-2 justify-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Aligned with:
              </span>
              {(p.complianceAlignment ?? []).map((a) => (
                <span
                  key={a.standard}
                  className="inline-flex items-center gap-1.5 bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-200"
                >
                  <Shield className="w-3 h-3 text-slate-400" />
                  {a.standard}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 5-STEP WORKFORCE PATHWAY — hidden when a program supplies its own process narrative */}
      {!processSlot && (
        <section className="py-12 bg-slate-50 border-y border-slate-100">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Full Workforce Pathway</h2>
            <p className="text-slate-600 text-sm mb-8">Built for agency deployment: intake to wage outcome in one system.</p>
            <div className="grid gap-3 md:grid-cols-5">
              {pathwaySteps.map((item) => (
                <div key={item.step} className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-brand-red-600 mb-2">{item.step}</p>
                  <h3 className="text-sm font-extrabold text-slate-900 mb-1">{item.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CURRICULUM */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">What You&apos;ll Learn</h2>
          <p className="text-slate-500 text-sm mb-8">
            Full curriculum broken down by module. Every topic is covered in class and assessed
            before you advance.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(p.curriculum ?? []).map((mod, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 rounded-full text-[11px] font-extrabold flex items-center justify-center flex-shrink-0 bg-slate-900 text-white">
                    {i + 1}
                  </span>
                  <h3 className="font-bold text-sm text-slate-900">{mod.title}</h3>
                </div>
                <ul className="space-y-1.5">
                  {(mod.topics ?? []).map((t, j) => (
                    <li key={j} className="flex items-start gap-2 text-xs text-slate-600">
                      <span className="mt-0.5 text-slate-400 flex-shrink-0">·</span>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TECHNOLOGY ETPL SECTIONS - Only show for tech programs */}
      {p.technologyCareerPathways && p.technologyCareerPathways.length > 0 && (
        <>
          {/* Technology Career Pathways */}
          <section className="py-12 bg-slate-50 border-y border-slate-100">
            <div className="max-w-6xl mx-auto px-4">
              <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Technology Career Pathways</h2>
              <p className="text-slate-500 text-sm mb-6">
                This program prepares you for multiple entry points into the technology industry.
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {p.technologyCareerPathways.map((career, i) => (
                  <div key={i} className="flex items-center gap-3 bg-white rounded-lg border border-slate-200 p-3">
                    <div className="w-8 h-8 rounded-full bg-brand-blue-100 flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-4 h-4 text-brand-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-slate-700">{career}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Additional Technology Certifications */}
          {p.additionalCertifications && p.additionalCertifications.length > 0 && (
            <section className="py-12">
              <div className="max-w-6xl mx-auto px-4">
                <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Additional Technology Certifications Supported</h2>
                <p className="text-slate-500 text-sm mb-6">
                  Beyond the primary credentials, this program prepares you for additional industry certifications.
                </p>
                <div className="flex flex-wrap gap-2">
                  {p.additionalCertifications.map((cert, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 bg-brand-blue-50 text-brand-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-brand-blue-200">
                      <Award className="w-3.5 h-3.5" />
                      {cert}
                    </span>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Technology Skills */}
          {p.technologySkills && p.technologySkills.length > 0 && (
            <section className="py-12 bg-slate-900 text-white">
              <div className="max-w-6xl mx-auto px-4">
                <h2 className="text-2xl font-extrabold mb-2">Technology Skills You&apos;ll Learn</h2>
                <p className="text-slate-300 text-sm mb-6">
                  Core competencies developed throughout this program align with industry standards.
                </p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {p.technologySkills.map((skill, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full bg-brand-red-500 flex-shrink-0" />
                      <span className="text-slate-100">{skill}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* WIOA Eligible Technology Pathway */}
          {p.etplProgramId && (
            <section className="py-8 bg-brand-green-50 border-y-2 border-brand-green-500">
              <div className="max-w-6xl mx-auto px-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-brand-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900 mb-1">WIOA Eligible Technology Pathway</h2>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      This program is approved on Indiana ETPL (Program ID {p.etplProgramId}) and may qualify for{' '}
                      <strong>WIOA, WorkOne, Workforce Ready Grant, JRI, Vocational Rehabilitation,</strong> and approved workforce funding sources.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}
        </>
      )}

      {/* WHAT'S INCLUDED */}
      {((p.partnerCourses && p.partnerCourses.length > 0) ||
        (p.microCourses && p.microCourses.length > 0) ||
        p.lmsCourseSlug) && (
        <section className="py-12 bg-slate-50 border-y border-slate-100">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900">
                  What&apos;s Included in This Program
                </h2>
                <p className="text-slate-500 text-sm mt-0.5">
                  All training components delivered as part of your enrollment
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Internal LMS training */}
              {p.lmsCourseSlug && (
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                    Elevate Internal Training
                  </p>
                  <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-start gap-4">
                    <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-5 h-5 text-brand-blue-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-slate-900 text-sm">
                          {p.title} — Full Curriculum
                        </h3>
                        <span className="bg-brand-blue-100 text-brand-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Elevate LMS
                        </span>
                      </div>
                      <p className="text-slate-500 text-xs mt-1">
                        Modules, lessons, quizzes, and checkpoints delivered through the Elevate
                        learning platform. Progress is tracked and gated — you advance when
                        you&apos;re ready.
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="flex items-center gap-1 text-brand-green-600 text-xs font-semibold">
                        <span
                          aria-hidden
                          className="w-1.5 h-1.5 rounded-full bg-brand-red-500 inline-block"
                        />{' '}
                        Required
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Partner courses */}
              {p.partnerCourses && p.partnerCourses.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                    Partner-Delivered Training
                  </p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {p.partnerCourses.map((c) => (
                      <div
                        key={c.courseId}
                        className="bg-white rounded-xl border border-slate-200 p-5 flex items-start gap-4"
                      >
                        <div className="w-10 h-10 bg-brand-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <ExternalLink className="w-4 h-4 text-brand-orange-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-slate-900 text-sm">{c.label}</h3>
                            {c.required && (
                              <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                Required
                              </span>
                            )}
                          </div>
                          <p className="text-slate-500 text-xs mt-0.5">
                            {c.partnerName}
                            {c.duration ? ` · ${c.duration}` : ''}
                          </p>
                          {c.credentialIssued && (
                            <p className="text-brand-green-700 text-xs font-semibold mt-1 flex items-center gap-1">
                              <Award aria-label="award" className="w-3 h-3" /> {c.credentialIssued}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Micro courses / certifications */}
              {p.microCourses && p.microCourses.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                    Included Certifications
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {p.microCourses.map((c) => (
                      <div
                        key={c.courseId}
                        className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex items-center gap-3"
                      >
                        <span
                          aria-hidden
                          className="w-1.5 h-1.5 rounded-full bg-brand-red-500 flex-shrink-0"
                        />
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">{c.label}</p>
                          <p className="text-slate-500 text-xs">
                            {c.partnerName}
                            {c.duration ? ` · ${c.duration}` : ''}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ENROLLMENT TRACKS */}
      <section className="py-14 border-y border-slate-100">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-green-600 mb-3">
              How You Can Start
            </p>
            <h2 className="text-2xl font-extrabold text-slate-900 mb-3">
              Choose the path that fits your situation.
            </h2>
            <p className="text-slate-500 text-base max-w-2xl mx-auto">
              There&apos;s a path to enrollment whether you qualify for funding or not. We&apos;ll
              help you figure out which one.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {/* Track 1: Funded */}
            <div className="bg-white rounded-2xl border-2 border-brand-green-500 shadow-sm p-7 flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-brand-green-100 text-brand-green-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Lowest Cost Path
                </span>
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 mb-1">
                {enrollmentTracks.funded.label}
              </h3>
              <p className="text-xs font-semibold text-brand-green-700 mb-3">
                {enrollmentTracks.funded.requirement}
              </p>
              <p className="text-slate-600 text-sm leading-relaxed mb-6 flex-1">
                {enrollmentTracks.funded.description}
              </p>
              <div className="space-y-2">
                {hasWIOAFunding && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {['WorkOne', 'WIOA', 'Trade Act', 'JRI'].map((prog) => (
                      <span
                        key={prog}
                        className="bg-slate-100 text-slate-600 text-xs font-semibold px-2.5 py-1 rounded-lg"
                      >
                        {prog}
                      </span>
                    ))}
                  </div>
                )}
                {hasImpactOnly && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {['Indiana Only'].map((prog) => (
                      <span
                        key={prog}
                        className="bg-purple-100 text-purple-700 text-xs font-semibold px-2.5 py-1 rounded-lg"
                      >
                        {prog}
                      </span>
                    ))}
                  </div>
                )}
                <Link
                  href={hasEligibilityPage ? `/programs/${p.slug}/eligibility` : enrollmentTracks.funded.applyHref}
                  className="block w-full text-center bg-brand-green-600 hover:bg-brand-green-700 text-white font-bold py-3.5 rounded-xl transition-colors text-sm"
                >
                  {hasImpactOnly ? 'Check Funding Eligibility' : 'Apply Now — $0 Tuition if Eligible'}
                </Link>
                <p className="text-center text-xs text-slate-500 mt-1">
                  {hasImpactOnly
                    ? 'Indiana residents · contact WorkOne for funding options'
                    : 'Free to apply · no payment today · takes 2 minutes'}
                </p>
              </div>
            </div>

            {/* Track 2: Self-pay */}
            <div
              className={`bg-white rounded-2xl border-2 shadow-sm p-7 flex flex-col ${enrollmentTracks.selfPay.available ? 'border-brand-blue-400' : 'border-slate-200'}`}
            >
              <div className="flex items-center gap-2 mb-4">
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${enrollmentTracks.selfPay.available ? 'bg-brand-blue-100 text-brand-blue-700' : 'bg-slate-100 text-slate-500'}`}
                >
                  {enrollmentTracks.selfPay.available ? 'Start Immediately' : 'Enrollment Pending'}
                </span>
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 mb-1">
                {enrollmentTracks.selfPay.label}
              </h3>
              <p className="text-2xl font-extrabold text-slate-900 mb-3">
                {enrollmentTracks.selfPay.cost}
                <span className="text-sm font-normal text-slate-500 ml-1">tuition</span>
              </p>
                <p className="text-slate-600 text-sm leading-relaxed mb-4 flex-1">
                  {enrollmentTracks.selfPay.description}
                </p>

                {/* Pay & Enroll button — shown when self-pay is available and a checkout href is configured */}
                {enrollmentTracks.selfPay.available && p.cta.stripeCheckoutHref && (
                  <div className="mt-2 mb-4">
                    <PayNowButton
                      slug={p.slug}
                      cost={enrollmentTracks.selfPay.cost}
                      stripeCheckoutHref={p.cta.stripeCheckoutHref}
                    />
                  </div>
                )}

                {/* Apply Now fallback — shown when self-pay is available but no Stripe checkout configured */}
                {enrollmentTracks.selfPay.available && !p.cta.stripeCheckoutHref && (
                  <Link
                    href={enrollmentTracks.selfPay.applyHref}
                    className="block w-full text-center bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold py-3.5 rounded-xl transition-colors text-sm mt-2 mb-4"
                  >
                    Apply Now — Self-Pay
                  </Link>
                )}

              {!enrollmentTracks.selfPay.available && (
                <div className="mt-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-3 text-sm text-amber-800">
                    {enrollmentTracks.selfPay.comingSoonMessage}
                  </div>
                  <Link
                    href={`/contact?subject=${p.slug}-waitlist`}
                    className="block w-full text-center border-2 border-slate-300 hover:border-brand-blue-400 text-slate-700 hover:text-brand-blue-700 font-bold py-3.5 rounded-xl transition-colors text-sm"
                  >
                    Join the Waitlist
                  </Link>
                </div>
              )}
            </div>
          </div>

          {(enrollmentTracks.selfPay.available || p.fundingOptions?.includes('self_pay')) && (
            <div id="payment-calculator" className="mt-10 max-w-2xl mx-auto scroll-mt-24">
              <div className="text-center mb-6">
                <p className="text-xs font-bold uppercase tracking-widest text-brand-blue-600 mb-2">
                  Self-pay options
                </p>
                <h3 className="text-xl font-extrabold text-slate-900">Payment plan calculator</h3>
                <p className="text-slate-500 text-sm mt-2">
                  Adjust your deposit to see weekly payments. BNPL available at checkout.
                </p>
              </div>
              <PaymentPlanCalculator programSlug={p.slug} />
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {ACTIVE_BNPL_PROVIDERS.map((provider) => (
                  <span
                    key={provider.id}
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${provider.badgeBg} ${provider.badgeText}`}
                  >
                    {provider.name}
                  </span>
                ))}
              </div>
              <p className="text-center text-xs text-slate-500 mt-3">{BNPL_PROVIDER_SUMMARY}</p>
              <p className="text-center text-sm mt-4">
                <Link
                  href={p.cta.applyHref || `/apply?program=${p.slug}`}
                  className="font-semibold text-brand-blue-600 hover:underline"
                >
                  Start application →
                </Link>
              </p>
            </div>
          )}

          {/* Reassurance line */}
          <p className="text-center text-slate-500 text-sm mt-8">
            Not in Indiana or not currently funding-eligible?{' '}
            <Link href="/contact" className="text-brand-blue-600 hover:underline font-medium">
              Talk to an advisor about self-pay and payment plan options
            </Link>{' '}
            — we&apos;ll map the right next step in about 10 minutes.
          </p>

          {/* Indiana funding context — shown for IMPACT-only programs */}
          {hasImpactOnly && (
            <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-5 text-sm text-amber-900 max-w-3xl mx-auto">
              <p className="font-bold mb-1">Indiana residents: additional funding may be available</p>
              <p className="text-amber-800 mb-3">
                This program may not be on Indiana&rsquo;s ETPL and does not qualify for WIOA or the
                Workforce Ready Grant. However, additional Indiana workforce funding sources may be available.
                Contact your local WorkOne office to learn about eligibility.
              </p>
              <p className="text-amber-800">
                <strong>Outside Indiana?</strong> Self-pay enrollment is available to everyone —
                no residency required. Payment plans, BNPL, and employer sponsorship are all options.
              </p>
              {hasEligibilityPage && (
                <Link
                  href={hasEligibilityPage ? `/programs/${p.slug}/eligibility` : `/apply?program=${p.slug}`}
                  className="inline-flex items-center gap-1.5 mt-3 text-amber-900 font-semibold underline underline-offset-2 hover:text-amber-700 text-sm"
                >
                  See all funding options for this program →
                </Link>
              )}
            </div>
          )}

          {/* Next Step CTAs */}
          <div className="mt-8 rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4">Next Step</p>
            <div className="flex flex-col sm:flex-row gap-3">
              {primaryCTA && (
                <Link
                  href={primaryCTA.external ? primaryCTA.href : '#apply'}
                  target={primaryCTA.external ? '_blank' : '_self'}
                  rel={primaryCTA.external ? 'noopener noreferrer' : undefined}
                  className="inline-flex items-center justify-center bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-5 py-3 rounded-lg transition-colors text-sm"
                >
                  {primaryCTA.external ? primaryCTA.label : 'Apply Now'}
                </Link>
              )}
              <Link
                href={requestInfoHref}
                className="inline-flex items-center justify-center border border-slate-300 hover:border-slate-400 text-slate-700 font-semibold px-5 py-3 rounded-lg transition-colors text-sm"
              >
                Request Information
              </Link>
              {hasIndianaFunding && (
                <a
                  href={ICC_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold px-5 py-3 rounded-lg transition-colors text-sm"
                >
                  Indiana Career Connect
                </a>
              )}
            </div>
            {hasIndianaFunding && (
              <p className="text-slate-500 text-xs mt-3">{ICC_INSTRUCTION}</p>
            )}
          </div>
        </div>{/* max-w-5xl */}
      </section>

      <ProgramFundingProcessSection program={p} />

      {/* EMPLOYER PROOF */}
      <section className="py-12 border-t border-slate-100 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Employer Proof & Placement Pipeline</h2>
          <p className="text-slate-600 text-sm mb-6">
            This pathway is aligned to active hiring demand. Placement follows intake profile matching, employer-ready credential completion, and supported introductions.
          </p>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">Named Employer Partners</p>
              <ul className="space-y-2">
                {employerPartners.length > 0 ? employerPartners.map((partner) => (
                  <li key={partner} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-red-500 flex-shrink-0" />
                    <span>{partner}</span>
                  </li>
                )) : (
                  <li className="text-sm text-slate-600">Employer partner list is being finalized for this pathway.</li>
                )}
              </ul>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">Placement Pipeline</p>
              <ul className="space-y-2 text-sm text-slate-700">
                {[
                  'Intake profile maps learner goals, schedule, and funding pathway.',
                  'Training milestones and credentials are tracked to completion.',
                  'Employer introductions are prioritized for interview-ready graduates.',
                  'Placement support continues through first wage outcome reporting window.',
                ].map((line) => (
                  <li key={line} className="flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-red-500 flex-shrink-0" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ===== APPLICATION ===== */}
      <section id="apply" className="py-16 bg-white border-t border-slate-100">
        <div className="max-w-2xl mx-auto px-4">
          <div className="mb-8 text-center">
            <span className="inline-block bg-brand-red-50 text-brand-red-700 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">
              Apply Now
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 mb-2">
              Start Your {p.title} Journey
            </h2>
            <p className="text-slate-500 text-base">
              Free to apply · No payment required · An advisor will contact you within 1 business day
            </p>
          </div>
          {hasDedicatedApply ? (
            <div className="text-center">
              <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                This program uses a guided application with eligibility and host-shop matching steps.
                {processSlot ? (
                  <>
                    {' '}
                    Review{' '}
                    <Link href="#how-it-works" className="font-semibold text-brand-blue-600 hover:underline">
                      how it works
                    </Link>{' '}
                    above, then continue when you are ready.
                  </>
                ) : (
                  ' Continue when you are ready.'
                )}
              </p>
              <Link
                href={p.cta.applyHref || `/programs/${p.slug}/apply`}
                className="inline-block bg-brand-red-600 hover:bg-brand-red-700 text-white px-10 py-4 rounded-xl font-extrabold text-base transition-colors"
              >
                Continue to Application
              </Link>
            </div>
          ) : (
            <ProgramApplyForm programSlug={p.slug} programTitle={p.title} />
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-slate-900">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
            Ready to Start Your {p.title} Career?
          </h2>
          <p className="text-slate-300 text-base max-w-xl mx-auto mb-8 leading-relaxed">
            {p.fundingStatement}
          </p>

          {/* Enrollment pipeline */}
          <EnrollmentPipeline
            applyHref={p.cta.applyHref || `/apply?program=${p.slug}`}
            showCta={false}
            className="mb-8 text-left"
          />

          {/* Two distinct paths — applicant vs enrolled */}
          <div className="flex flex-col sm:flex-row items-stretch justify-center gap-4 mb-4">
            {/* Primary CTA — driven by enrollmentType */}
            {primaryCTA && (
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {primaryCTA.external ? 'Enrollment' : 'New Applicant'}
                </span>
                <Link
                  href={primaryCTA.href}
                  target={primaryCTA.external ? '_blank' : '_self'}
                  rel={primaryCTA.external ? 'noopener noreferrer' : undefined}
                  className="bg-brand-red-600 hover:bg-brand-red-700 text-white px-10 py-4 rounded-xl font-extrabold text-base transition-colors whitespace-nowrap"
                >
                  {primaryCTA.external ? primaryCTA.label : 'Apply to This Program'}
                </Link>
                {!primaryCTA.external && (
                  <span className="text-slate-400 text-xs">Free to apply · takes 5 min</span>
                )}
              </div>
            )}

            {/* Already enrolled — only render when an LMS course exists for this program */}
            {p.cta.enrollHref && (
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Already Enrolled
                </span>
                <Link
                  href={p.cta.enrollHref}
                  className="bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-10 py-4 rounded-xl font-extrabold text-base transition-colors whitespace-nowrap"
                >
                  Go to My Courses
                </Link>
                <span className="text-slate-400 text-xs">Log in to access your training</span>
              </div>
            )}
          </div>

          <Link
            href={p.cta.advisorHref || '/contact'}
            className="inline-block border-2 border-slate-600 hover:border-slate-400 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors mt-2"
          >
            Questions? Talk to an Advisor
          </Link>
        </div>
      </section>

      {/* Program Resources — dynamic links to sub-pages */}
      <section className="py-8 border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Program Resources</p>
          <div className="flex flex-wrap gap-2">
            {hasEligibilityPage && (
              <Link href={`/programs/${p.slug}/eligibility`} className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:border-brand-blue-300 transition-colors">
                Eligibility
              </Link>
            )}
            <Link href={`/programs/${p.slug}/apply`} className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:border-brand-blue-300 transition-colors">
              Apply
            </Link>
            {eligibilityPageSlugs.has(p.slug) && (
              <Link href={`/programs/${p.slug}/orientation`} className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:border-brand-blue-300 transition-colors">
                Orientation
              </Link>
            )}
            {p.slug === 'hvac-technician' && (
              <>
                <Link href={`/programs/${p.slug}/curriculum`} className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:border-brand-blue-300 transition-colors">
                  Curriculum
                </Link>
                <Link href={`/programs/${p.slug}/course`} className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:border-brand-blue-300 transition-colors">
                  Course Details
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {children && <div>{children}</div>}

      <CredentialAuthorityFootnote />
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title }: { icon: any; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
        <Icon className="w-5 h-5 text-slate-700" />
      </div>
      <h2 className="text-xl font-bold text-slate-900">{title}</h2>
    </div>
  );
}

function SpecItem({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="text-center">
      <Icon className="w-5 h-5 text-brand-blue-600 mx-auto mb-1" />
      <div className="text-xs text-slate-500 uppercase">{label}</div>
      <div className="font-semibold text-slate-900 text-sm">{value}</div>
    </div>
  );
}

function HoursBar({ label, hours, total }: { label: string; hours: number; total: number }) {
  const pct = total > 0 ? Math.round((hours / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs text-slate-600 mb-1">
        <span>{label}</span>
        <span className="font-medium">{hours} hrs</span>
      </div>
      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
        <div className="h-full bg-white rounded-full" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
