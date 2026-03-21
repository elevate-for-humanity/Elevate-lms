'use client';

/**
 * ProgramDetailPage — Institutional Program Detail Template v1
 *
 * Renders all 10 required sections in fixed order.
 * Validates the program schema at render time in development.
 * HVAC Technician is the canonical reference implementation.
 */

import Image from 'next/image';
import Link from 'next/link';
import PageVideoHero from '@/components/ui/PageVideoHero';
import {
  BookOpen, Clock, DollarSign,
  MapPin, Shield, TrendingUp, ChevronRight,
  Award, ExternalLink, CheckCircle2, Layers,
} from 'lucide-react';
import type { ProgramSchema } from '@/lib/programs/program-schema';
import { validateProgram, getTotalHoursRange, getTotalHoursFromBreakdown, getPrimaryCTA } from '@/lib/programs/program-schema';
import { DeliveryBadge, FundingSection } from './ProgramTruthBadges';
import { ICC_URL, ICC_INSTRUCTION } from '@/lib/page-design-tokens';

interface Props {
  program: ProgramSchema;
  /** Replaces the default video/image hero entirely. */
  heroOverride?: React.ReactNode;
  children?: React.ReactNode;
}

export default function ProgramDetailPage({ program: p, heroOverride, children }: Props) {
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



  return (
    <div className="min-h-screen bg-white">
      {/* ═══ A. HERO ════════════════════════════════════════════════ */}
      <section>
        {heroOverride ?? (p.videoSrc ? (
          <PageVideoHero
            videoSrc={p.videoSrc}
            posterSrc={p.heroImage}
            posterAlt={p.heroImageAlt}
            size="program"
          />
        ) : (
          <div className="relative h-[45vh] min-h-[280px] max-h-[560px] w-full overflow-hidden">
            <Image
              src={p.heroImage}
              alt={p.heroImageAlt}
              fill
              className="object-cover object-center"
              priority
              sizes="100vw"
            />
          </div>
        ))}

        {/* Hero content panel — below image, no overlay */}
        <div className="bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-5">
              {p.breadcrumbs.map((b, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  {i > 0 && <ChevronRight className="w-3 h-3" />}
                  {b.href ? (
                    <Link href={b.href} className="hover:text-slate-600 transition-colors">{b.label}</Link>
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
                    <span className={`inline-block text-xs font-bold text-white px-3 py-1 rounded-full ${
                      p.badgeColor === 'orange' ? 'bg-brand-orange-500' :
                      p.badgeColor === 'green'  ? 'bg-brand-green-500' :
                      p.badgeColor === 'red'    ? 'bg-brand-red-500' :
                      'bg-brand-blue-500'
                    }`}>
                      {p.badge}
                    </span>
                  )}
                  {p.deliveryModelDetail && (
                    <DeliveryBadge model={p.deliveryModelDetail} />
                  )}
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
                    { icon: <Clock className="w-3.5 h-3.5" />, val: `${p.durationWeeks} ${p.durationWeeks === 1 ? 'week' : 'weeks'}` },
                    { icon: <BookOpen className="w-3.5 h-3.5" />, val: `${p.hoursPerWeekMin}–${p.hoursPerWeekMax} hrs/week` },
                    { icon: <Award className="w-3.5 h-3.5" />, val: `${p.credentials.length} credential${p.credentials.length !== 1 ? 's' : ''}` },
                    { icon: <MapPin className="w-3.5 h-3.5" />, val: p.deliveryMode === 'hybrid' ? 'Hybrid' : p.deliveryMode === 'online' ? 'Online' : 'In-Person' },
                  ].map(({ icon, val }) => (
                    <span key={val} className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-200">
                      {icon}{val}
                    </span>
                  ))}
                </div>
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
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Already Enrolled?</p>
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

      {/* ═══ CREDIBILITY STRIP ══════════════════════════════════════ */}
      <section className="py-8 border-y border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl font-extrabold text-slate-900">{p.laborMarket?.salaryRange ?? '—'}</div>
              <div className="text-xs text-slate-500 mt-0.5">Typical wage range</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-slate-900">{totalHours > 0 ? `${totalHours} hrs` : hoursRange}</div>
              <div className="text-xs text-slate-500 mt-0.5">Total training hours</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-slate-900">{p.credentials.length} credential{p.credentials.length !== 1 ? 's' : ''}</div>
              <div className="text-xs text-slate-500 mt-0.5">{p.credentials[0]?.issuingBody ?? 'Industry recognized'}</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-slate-900">{p.laborMarket?.growthRate ?? '—'}</div>
              <div className="text-xs text-slate-500 mt-0.5">Job growth ({p.laborMarket?.sourceYear ?? ''})</div>
            </div>
          </div>
          {p.complianceAlignment.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-100 flex flex-wrap items-center gap-2 justify-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Aligned with:</span>
              {p.complianceAlignment.map((a) => (
                <span key={a.standard} className="inline-flex items-center gap-1.5 bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-200">
                  <Shield className="w-3 h-3 text-slate-400" />
                  {a.standard}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ═══ CURRICULUM ══════════════════════════════════════════════ */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">What You&apos;ll Learn</h2>
          <p className="text-slate-500 text-sm mb-8">Full curriculum broken down by module. Every topic is covered in class and assessed before you advance.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {p.curriculum.map((mod, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 rounded-full text-[11px] font-extrabold flex items-center justify-center flex-shrink-0 bg-slate-900 text-white">{i + 1}</span>
                  <h3 className="font-bold text-sm text-slate-900">{mod.title}</h3>
                </div>
                <ul className="space-y-1.5">
                  {mod.topics.map((t, j) => (
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

      {/* ═══ WHAT'S INCLUDED ════════════════════════════════════════ */}
      {((p.partnerCourses && p.partnerCourses.length > 0) || (p.microCourses && p.microCourses.length > 0) || p.lmsCourseSlug) && (
        <section className="py-12 bg-slate-50 border-y border-slate-100">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900">What&apos;s Included in This Program</h2>
                <p className="text-slate-500 text-sm mt-0.5">All training components delivered as part of your enrollment</p>
              </div>
            </div>

            <div className="space-y-6">

              {/* Internal LMS training */}
              {p.lmsCourseSlug && (
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Elevate Internal Training</p>
                  <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-start gap-4">
                    <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-5 h-5 text-brand-blue-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-slate-900 text-sm">{p.title} — Full Curriculum</h3>
                        <span className="bg-brand-blue-100 text-brand-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Elevate LMS</span>
                      </div>
                      <p className="text-slate-500 text-xs mt-1">
                        Modules, lessons, quizzes, and checkpoints delivered through the Elevate learning platform.
                        Progress is tracked and gated — you advance when you&apos;re ready.
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="flex items-center gap-1 text-brand-green-600 text-xs font-semibold">
                        <CheckCircle2 className="w-4 h-4" /> Required
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Partner courses */}
              {p.partnerCourses && p.partnerCourses.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Partner-Delivered Training</p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {p.partnerCourses.map((c) => (
                      <div key={c.courseId} className="bg-white rounded-xl border border-slate-200 p-5 flex items-start gap-4">
                        <div className="w-10 h-10 bg-brand-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <ExternalLink className="w-4 h-4 text-brand-orange-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-slate-900 text-sm">{c.label}</h3>
                            {c.required && (
                              <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Required</span>
                            )}
                          </div>
                          <p className="text-slate-500 text-xs mt-0.5">
                            {c.partnerName}{c.duration ? ` · ${c.duration}` : ''}
                          </p>
                          {c.credentialIssued && (
                            <p className="text-brand-green-700 text-xs font-semibold mt-1 flex items-center gap-1">
                              <Award className="w-3 h-3" /> {c.credentialIssued}
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
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Included Certifications</p>
                  <div className="flex flex-wrap gap-3">
                    {p.microCourses.map((c) => (
                      <div key={c.courseId} className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex items-center gap-3">
                        <CheckCircle2 className="w-4 h-4 text-brand-green-600 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">{c.label}</p>
                          <p className="text-slate-500 text-xs">{c.partnerName}{c.duration ? ` · ${c.duration}` : ''}</p>
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

      {/* ═══ ENROLLMENT TRACKS ══════════════════════════════════════ */}
      {p.enrollmentTracks && (
        <section className="py-14 border-y border-slate-100">
          <div className="max-w-5xl mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-extrabold text-slate-900 mb-2">How to Enroll</h2>
              <p className="text-slate-500 text-base max-w-2xl mx-auto">
                {p.fundingOptions && p.fundingOptions.some(f => f === 'wioa' || f === 'wrg')
                  ? 'Workforce funding is available for eligible Indiana residents. Students from other states can enroll through the self-pay option.'
                  : p.fundingOptions?.includes('employer_paid')
                  ? 'This is a paid apprenticeship — you earn wages while you train. A self-pay option is available for those without an employer sponsor.'
                  : 'Choose the enrollment option that works for you.'}
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">

              {/* Track 1: Indiana funded */}
              <div className="bg-white rounded-2xl border-2 border-brand-green-500 shadow-sm p-7 flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                  <span className="bg-brand-green-100 text-brand-green-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Workforce Funded
                  </span>
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 mb-1">{p.enrollmentTracks.funded.label}</h3>
                <p className="text-xs font-semibold text-brand-green-700 mb-3">
                  Requirement: {p.enrollmentTracks.funded.requirement}
                </p>
                <p className="text-slate-600 text-sm leading-relaxed mb-6 flex-1">
                  {p.enrollmentTracks.funded.description}
                </p>
                <div className="space-y-2">
                  <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Eligible programs include</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {['WorkOne', 'WIOA', 'Trade Act', 'SNAP E&T', 'JRI'].map(prog => (
                      <span key={prog} className="bg-slate-100 text-slate-600 text-xs font-semibold px-2.5 py-1 rounded-lg">{prog}</span>
                    ))}
                  </div>
                  <Link
                    href={p.enrollmentTracks.funded.applyHref}
                    className="block w-full text-center bg-brand-green-600 hover:bg-brand-green-700 text-white font-bold py-3.5 rounded-xl transition-colors text-sm"
                  >
                    Apply — Check My Eligibility
                  </Link>
                  <p className="text-center text-xs text-slate-500 mt-1">Free to apply · eligibility verified before enrollment</p>
                </div>
              </div>

              {/* Track 2: Self-pay national */}
              <div className={`bg-white rounded-2xl border-2 shadow-sm p-7 flex flex-col ${p.enrollmentTracks.selfPay.available ? 'border-brand-blue-400' : 'border-slate-200'}`}>
                <div className="flex items-center gap-2 mb-4">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${p.enrollmentTracks.selfPay.available ? 'bg-brand-blue-100 text-brand-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                    {p.enrollmentTracks.selfPay.available ? 'Self-Pay' : 'Enrollment Pending'}
                  </span>
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 mb-1">{p.enrollmentTracks.selfPay.label}</h3>
                <p className="text-2xl font-extrabold text-slate-900 mb-3">
                  {p.enrollmentTracks.selfPay.cost}
                  <span className="text-sm font-normal text-slate-500 ml-1">tuition</span>
                </p>
                <p className="text-slate-600 text-sm leading-relaxed mb-4 flex-1">
                  {p.enrollmentTracks.selfPay.description}
                </p>
                <div className="bg-slate-50 rounded-xl p-4 mb-5 text-sm text-slate-600 space-y-1.5">
                  <p className="font-semibold text-slate-700 text-xs uppercase tracking-wider mb-2">What you get</p>
                  {[
                    'Full online training curriculum',
                    'Industry certification exam preparation',
                    'OSHA 10-Hour included',
                    'Exam proctored on-site at Elevate (Indianapolis)',
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                {p.enrollmentTracks.selfPay.available ? (
                  <Link
                    href={p.enrollmentTracks.selfPay.applyHref}
                    className="block w-full text-center bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold py-3.5 rounded-xl transition-colors text-sm"
                  >
                    Enroll — Self-Pay
                  </Link>
                ) : (
                  <div>
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-3 text-sm text-amber-800">
                      {p.enrollmentTracks.selfPay.comingSoonMessage}
                    </div>
                    <Link
                      href="/contact?subject=hvac-self-pay-waitlist"
                      className="block w-full text-center border-2 border-slate-300 hover:border-brand-blue-400 text-slate-700 hover:text-brand-blue-700 font-bold py-3.5 rounded-xl transition-colors text-sm"
                    >
                      Join the Waitlist
                    </Link>
                  </div>
                )}
              </div>

            </div>

            {/* Expansion note */}
            <p className="text-center text-slate-500 text-sm mt-8">
              Workforce-funded training currently available for Indiana residents.
              Additional states will be added as partnerships develop.
            </p>

            {/* Indiana Career Connect */}
            <div className="mt-8 bg-brand-blue-50 border border-brand-blue-200 rounded-xl p-6">
              <p className="text-brand-blue-900 font-semibold text-sm mb-1">Indiana Career Connect</p>
              <p className="text-brand-blue-800 text-sm leading-relaxed mb-4">{ICC_INSTRUCTION}</p>
              <a
                href={ICC_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold px-6 py-2.5 rounded-lg transition-colors text-sm"
              >
                Go to Indiana Career Connect
              </a>
            </div>
          </div>
        </section>
      )}

      {/* ═══ CTA ════════════════════════════════════════════════════ */}
      <section className="py-16 bg-slate-900">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
            Ready to Start Your {p.title} Career?
          </h2>
          <p className="text-slate-300 text-base max-w-xl mx-auto mb-10 leading-relaxed">{p.fundingStatement}</p>

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
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Already Enrolled</span>
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

      {children && <div>{children}</div>}
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
