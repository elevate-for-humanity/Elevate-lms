'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Award, Briefcase, CheckCircle2 } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { InView } from '@/components/ui/InView';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import HeroVideo from '@/components/marketing/HeroVideo';

/* ------------------------------------------------------------------ */
/*  Config types — every section is data-driven                        */
/* ------------------------------------------------------------------ */

interface CareerPath {
  title: string;
  salary: string;
  growth?: string;
}

interface CurriculumModule {
  title: string;
  topics: string[];
}

interface FAQ {
  question: string;
  answer: string;
}

interface Step {
  title: string;
  desc: string;
}

export interface ProgramPageConfig {
  // Hero — video or static image
  videoSrc?: string;
  voiceoverSrc?: string;
  heroImage?: string;
  heroImageAlt?: string;

  // Identity
  title: string;
  subtitle: string;
  badge?: string;
  badgeColor?: 'red' | 'green' | 'blue' | 'orange' | 'purple';

  // Quick facts shown inline with title
  duration: string;
  cost: string;
  format: string;
  credential: string;

  // Overview with image
  overview: string;
  highlights: string[];
  overviewImage: string;
  overviewImageAlt: string;

  // Salary callout
  salaryNumber: number;
  salaryLabel: string;
  salaryPrefix?: string;
  salarySuffix?: string;

  // Curriculum
  curriculum?: CurriculumModule[];

  // Credentials
  credentials?: string[];

  // Career paths
  careers?: CareerPath[];

  // How to enroll steps
  steps?: Step[];

  // FAQ
  faqs?: FAQ[];

  // CTA
  applyHref?: string;
  inquiryHref?: string;
  courseHref?: string;

  // Program status notice — shown as amber banner when program is not yet enrolling
  statusNotice?: string;

  // Program details — for workforce partner RFIs
  totalHours?: number;
  schedule?: string;
  eveningSchedule?: string;
  cohortSize?: string;
  admissionRequirements?: string[];
  modality?: string;
  facilityInfo?: string;
  equipmentIncluded?: string;
  bilingualSupport?: string;
  nextLevelJobsEligible?: boolean;
  employerPartners?: string[];
  selfPayCost?: string;
  cohortPricing?: string;
  pricingIncludes?: string[];
  paymentTerms?: string;

  // Instructional delivery — who teaches, where, how
  instructionalDelivery?: {
    description: string;
    qualifications: string;
    labProvider?: string;
    ojtProvider?: string;
  };

  // Training hours breakdown
  hoursBreakdown?: { label: string; hours: number }[];

  // Assessment structure
  assessmentStructure?: {
    requirements: string[];
    passingScore: number;
    retakePolicy?: string;
  };

  // Employer pathway
  employerPathway?: {
    description?: string;
    sectors: string[];
    placementRate?: string;
    placementWindow?: string;
  };

  // Breadcrumbs
  breadcrumbs: { label: string; href?: string }[];
}

/* ------------------------------------------------------------------ */
/*  Badge color map                                                    */
/* ------------------------------------------------------------------ */

const badgeMap: Record<string, string> = {
  red: 'bg-brand-red-600',
  green: 'bg-brand-green-600',
  blue: 'bg-brand-blue-600',
  orange: 'bg-brand-orange-500',
  purple: 'bg-purple-600',
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function ProgramPageLayout({
  config,
  children,
}: {
  config: ProgramPageConfig;
  children?: React.ReactNode;
}) {
  const c = config;
  const applyHref = c.applyHref || '/apply';
  const inquiryHref = c.inquiryHref || `/inquiry?program=${encodeURIComponent(c.title)}`;

  return (
    <div className="min-h-screen bg-white">

      {/* ===== HERO — video or poster image, no text on video ===== */}
      {c.videoSrc ? (
        <HeroVideo
          videoSrcDesktop={c.videoSrc}
          posterImage={c.heroImage || c.overviewImage}
          voiceoverSrc={c.voiceoverSrc}
          analyticsName={c.title}
        />
      ) : c.heroImage ? (
        <div
          className="relative w-full overflow-hidden bg-slate-900"
          style={{ height: 'clamp(280px, 56vw, 680px)' }}
        >
          <Image
            src={c.heroImage}
            alt={c.heroImageAlt || c.title}
            fill
            sizes="100vw"
            className="object-cover object-center"
            priority
          />
        </div>
      ) : null}

      {/* ===== BREADCRUMBS ===== */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-6 py-3">
          <Breadcrumbs items={c.breadcrumbs} />
        </div>
      </div>

      {/* ===== STATUS NOTICE (e.g. "Accepting interest — not yet enrolling") ===== */}
      {c.statusNotice && (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="max-w-5xl mx-auto px-6 py-3 flex items-center gap-3">
            <span className="flex-shrink-0 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">!</span>
            </span>
            <p className="text-amber-800 text-sm font-medium">{c.statusNotice}</p>
          </div>
        </div>
      )}

      {/* ===== PROGRAM IDENTITY — two-column compressed block ===== */}
      <InView animation="fade-up">
        <section className="bg-white py-8 sm:py-10 border-b border-slate-100">
          <div className="max-w-5xl mx-auto px-6">
            {/* Row 1: Title + CTA */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
              <div className="flex-1 min-w-0">
                <p className="text-brand-red-600 font-bold text-xs uppercase tracking-wider mb-2">Credential Pathway</p>
                <div className="flex items-center gap-3 mb-2">
                  {c.badge && (
                    <span className={`text-[11px] font-bold text-white px-2.5 py-0.5 rounded-full ${badgeMap[c.badgeColor || 'red']}`}>
                      {c.badge}
                    </span>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 leading-tight">
                  {c.title}
                </h1>
                <p className="text-slate-500 mt-1 max-w-2xl leading-relaxed text-sm sm:text-base">
                  {c.subtitle}
                </p>
              </div>
              <div className="flex flex-row gap-2 shrink-0">
                <Link
                  href={applyHref}
                  className="inline-flex items-center justify-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-6 py-3 rounded-lg transition-all shadow-lg shadow-brand-red-600/30 text-sm"
                >
                  Apply Now
                  <ArrowRight className="w-4 h-4" />
                </Link>
                {c.courseHref && (
                  <Link
                    href={c.courseHref}
                    className="inline-flex items-center justify-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold px-6 py-3 rounded-lg transition-all text-sm"
                  >
                    Access Course
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </div>

            {/* Row 2: Four fact cards — single glance */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: 'Duration', value: c.duration, icon: '⏱' },
                { label: 'Format', value: c.format, icon: '📍' },
                { label: 'Cost', value: c.cost, icon: '💰' },
                { label: 'Credentials', value: c.credential, icon: '🏆' },
              ].map((f) => (
                <div key={f.label} className="bg-slate-50 rounded-lg px-4 py-3 border border-slate-100">
                  <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">{f.icon} {f.label}</div>
                  <div className="font-bold text-slate-900 text-sm mt-0.5 leading-snug">{f.value}</div>
                </div>
              ))}
            </div>

            {/* Funding link */}
            <div className="mt-3 text-center lg:text-left">
              <Link
                href="/wioa-eligibility"
                className="text-xs text-slate-400 hover:text-brand-red-600 transition-colors"
              >
                Check funding eligibility →
              </Link>
            </div>
          </div>
        </section>
      </InView>

      {/* ===== OVERVIEW + IMAGE ===== */}
      <InView animation="fade-up">
        <section className="py-14 lg:py-20 bg-slate-50 border-t border-slate-100">
          <div className="max-w-5xl mx-auto px-6">
            <div className="grid lg:grid-cols-5 gap-10 items-start">
              <div className="lg:col-span-3">
                <p className="text-brand-red-600 font-semibold text-sm uppercase tracking-wider mb-2">Credential Pathway Overview</p>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-4">What This Pathway Includes</h2>
                <p className="text-slate-600 leading-relaxed">{c.overview}</p>
                <ul className="mt-6 space-y-3">
                  {c.highlights.map((h) => (
                    <li key={h} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-5 h-5 bg-brand-green-100 rounded-full flex items-center justify-center mt-0.5">
                        <span className="text-brand-green-600 text-xs font-bold">✓</span>
                      </span>
                      <span className="text-slate-700 text-sm">{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="lg:col-span-2">
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-xl">
                  <Image
                    src={c.overviewImage}
                    alt={c.overviewImageAlt}
                    fill
                    sizes="(max-width: 1024px) 100vw, 40vw"
                    className="object-cover"
                  />
                </div>
                {/* Salary callout */}
                <div className="mt-4 bg-white rounded-xl p-5 border border-slate-200 text-center">
                  <div className="text-3xl font-extrabold text-brand-green-600">
                    <AnimatedCounter
                      end={c.salaryNumber}
                      prefix={c.salaryPrefix || '$'}
                      suffix={c.salarySuffix || ''}
                      duration={2000}
                    />
                  </div>
                  <p className="text-slate-500 text-sm mt-1">{c.salaryLabel}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </InView>

      {/* ===== CURRICULUM ===== */}
      {c.curriculum && c.curriculum.length > 0 && (
        <InView animation="fade-up">
          <section className="py-14 lg:py-20 bg-white border-t border-slate-100">
            <div className="max-w-5xl mx-auto px-6">
              <div className="text-center mb-10">
                <p className="text-brand-red-600 font-semibold text-sm uppercase tracking-wider mb-2">Curriculum</p>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">What You&apos;ll Learn</h2>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {c.curriculum.map((mod, i) => (
                  <ScrollReveal key={mod.title} delay={i * 80} direction="up">
                    <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 h-full hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                      <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide mb-3">{mod.title}</h3>
                      <ul className="space-y-2">
                        {mod.topics.map((t) => (
                          <li key={t} className="flex items-start gap-2 text-sm text-slate-600">
                            <span className="w-1 h-1 rounded-full bg-brand-red-500 mt-2 flex-shrink-0" />
                            {t}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </section>
        </InView>
      )}

      {/* ===== INSTRUCTIONAL DELIVERY ===== */}
      {c.instructionalDelivery && (
        <InView animation="fade-up">
          <section className="py-14 lg:py-20 bg-white border-t border-slate-100">
            <div className="max-w-5xl mx-auto px-6">
              <div className="text-center mb-10">
                <p className="text-brand-red-600 font-semibold text-sm uppercase tracking-wider mb-2">Instructional Delivery</p>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">How Training Is Delivered</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
                  <h3 className="font-bold text-slate-900 mb-2">Delivery Model</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{c.instructionalDelivery.description}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
                  <h3 className="font-bold text-slate-900 mb-2">Instructor Qualifications</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{c.instructionalDelivery.qualifications}</p>
                </div>
                {c.instructionalDelivery.labProvider && (
                  <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
                    <h3 className="font-bold text-slate-900 mb-2">Lab Training</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{c.instructionalDelivery.labProvider}</p>
                  </div>
                )}
                {c.instructionalDelivery.ojtProvider && (
                  <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
                    <h3 className="font-bold text-slate-900 mb-2">On-the-Job Training</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{c.instructionalDelivery.ojtProvider}</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        </InView>
      )}

      {/* ===== TRAINING HOURS BREAKDOWN ===== */}
      {c.hoursBreakdown && c.hoursBreakdown.length > 0 && (
        <InView animation="fade-up">
          <section className="py-14 lg:py-20 bg-slate-50 border-t border-slate-100">
            <div className="max-w-5xl mx-auto px-6">
              <div className="text-center mb-10">
                <p className="text-brand-red-600 font-semibold text-sm uppercase tracking-wider mb-2">Training Hours</p>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Hours Breakdown</h2>
              </div>
              <div className="max-w-2xl mx-auto">
                <div className="space-y-3">
                  {c.hoursBreakdown.map((item) => {
                    const total = c.hoursBreakdown!.reduce((sum, h) => sum + h.hours, 0);
                    const pct = Math.round((item.hours / total) * 100);
                    return (
                      <div key={item.label} className="bg-white rounded-xl p-4 border border-slate-100">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-semibold text-slate-900 text-sm">{item.label}</span>
                          <span className="font-bold text-brand-red-600">{item.hours} hours</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2.5">
                          <div className="bg-white h-2.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-6 text-center">
                  <div className="inline-flex items-center gap-2 bg-brand-red-50 text-brand-red-700 font-bold px-6 py-3 rounded-full text-lg">
                    Total: {c.hoursBreakdown.reduce((sum, h) => sum + h.hours, 0)} hours
                  </div>
                </div>
              </div>
            </div>
          </section>
        </InView>
      )}

      {/* ===== ASSESSMENT STRUCTURE ===== */}
      {c.assessmentStructure && (
        <InView animation="fade-up">
          <section className="py-14 lg:py-20 bg-white border-t border-slate-100">
            <div className="max-w-5xl mx-auto px-6">
              <div className="text-center mb-10">
                <p className="text-brand-red-600 font-semibold text-sm uppercase tracking-wider mb-2">Assessment</p>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Program Assessment Structure</h2>
              </div>
              <div className="max-w-3xl mx-auto">
                <div className="bg-slate-50 rounded-xl p-8 border border-slate-100">
                  <h3 className="font-bold text-slate-900 mb-4">Students must complete:</h3>
                  <ul className="space-y-3 mb-6">
                    {c.assessmentStructure.requirements.map((req) => (
                      <li key={req} className="flex items-start gap-3 text-sm text-slate-700">
                        <CheckCircle2 className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                        {req}
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-200">
                    <div className="bg-white rounded-lg px-5 py-3 border border-slate-200">
                      <span className="text-xs text-slate-500 block">Minimum Passing Score</span>
                      <span className="text-xl font-extrabold text-brand-red-600">{c.assessmentStructure.passingScore}%</span>
                    </div>
                    {c.assessmentStructure.retakePolicy && (
                      <div className="bg-white rounded-lg px-5 py-3 border border-slate-200 flex-1 min-w-[200px]">
                        <span className="text-xs text-slate-500 block">Retake Policy</span>
                        <span className="text-sm font-semibold text-slate-900">{c.assessmentStructure.retakePolicy}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </InView>
      )}

      {/* ===== EMPLOYER PATHWAY ===== */}
      {c.employerPathway && (
        <InView animation="fade-up">
          <section className="py-14 lg:py-20 bg-slate-50 border-t border-slate-100">
            <div className="max-w-5xl mx-auto px-6">
              <div className="text-center mb-10">
                <p className="text-brand-red-600 font-semibold text-sm uppercase tracking-wider mb-2">Career Placement</p>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Where Graduates Work</h2>
              </div>
              <div className="max-w-3xl mx-auto">
                {c.employerPathway.description && (
                  <p className="text-slate-600 text-center mb-8 leading-relaxed">{c.employerPathway.description}</p>
                )}
                <div className="grid sm:grid-cols-2 gap-4 mb-8">
                  {c.employerPathway.sectors.map((sector) => (
                    <div key={sector} className="flex items-center gap-3 bg-white rounded-xl p-4 border border-slate-100">
                      <Briefcase className="w-5 h-5 text-brand-blue-600 flex-shrink-0" />
                      <span className="font-medium text-slate-900 text-sm">{sector}</span>
                    </div>
                  ))}
                </div>
                {c.employerPathway.placementRate && (
                  <div className="text-center bg-white rounded-xl p-6 border border-slate-200">
                    <div className="text-3xl font-extrabold text-brand-green-600 mb-1">{c.employerPathway.placementRate}</div>
                    <p className="text-sm text-slate-500">
                      placement rate{c.employerPathway.placementWindow ? ` within ${c.employerPathway.placementWindow}` : ''}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>
        </InView>
      )}

      {/* ===== CREDENTIALS — institutional seal cards ===== */}
      {c.credentials && c.credentials.length > 0 && (
        <InView animation="fade-up">
          <section className="py-14 lg:py-20 bg-slate-50 border-t border-slate-100">
            <div className="max-w-5xl mx-auto px-6">
              <div className="text-center mb-10">
                <p className="text-brand-red-600 font-semibold text-sm uppercase tracking-wider mb-2">National Credentials</p>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Credentials You&apos;ll Earn</h2>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {c.credentials.map((cr, i) => {
                  // Split credential on " — " to get name and issuer
                  const parts = cr.split(' — ');
                  const name = parts[0];
                  const issuer = parts[1] || '';
                  return (
                    <ScrollReveal key={cr} delay={i * 60} direction="up">
                      <div className="bg-white rounded-xl p-5 border border-slate-200 text-center h-full flex flex-col items-center justify-center shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 rounded-full bg-brand-green-50 flex items-center justify-center mb-3">
                          <Award className="w-6 h-6 text-brand-green-600" />
                        </div>
                        <h3 className="font-bold text-slate-900 text-sm leading-snug mb-1">{name}</h3>
                        {issuer && <p className="text-xs text-slate-500 leading-snug">{issuer}</p>}
                      </div>
                    </ScrollReveal>
                  );
                })}
              </div>
            </div>
          </section>
        </InView>
      )}

      {/* ===== EXTRA SECTIONS ===== */}
      {children}

      {/* ===== PROGRAM DETAILS (workforce partner info) ===== */}
      {(c.totalHours || c.schedule || c.cohortSize || c.modality || c.bilingualSupport || c.employerPartners || c.selfPayCost) && (
        <InView animation="fade-up">
          <section className="py-14 lg:py-20 bg-white border-t border-slate-100">
            <div className="max-w-5xl mx-auto px-6">
              <div className="text-center mb-10">
                <p className="text-brand-red-600 font-semibold text-sm uppercase tracking-wider mb-2">Program Details</p>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Structure & Delivery</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-8">
                {/* Left column — Training Structure */}
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-900 text-lg border-b border-slate-200 pb-2">Training Structure</h3>
                  {c.totalHours && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Total Instructional Hours</span>
                      <span className="font-semibold text-slate-900">{c.totalHours} hours</span>
                    </div>
                  )}
                  {c.schedule && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Standard Schedule</span>
                      <span className="font-semibold text-slate-900">{c.schedule}</span>
                    </div>
                  )}
                  {c.eveningSchedule && (
                    <div className="text-sm bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <span className="font-semibold text-amber-800">Evening/Weekend Option:</span>
                      <span className="text-amber-700 ml-1">{c.eveningSchedule}</span>
                    </div>
                  )}
                  {c.cohortSize && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Cohort Size</span>
                      <span className="font-semibold text-slate-900">{c.cohortSize}</span>
                    </div>
                  )}
                  {c.modality && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Modality</span>
                      <span className="font-semibold text-slate-900">{c.modality}</span>
                    </div>
                  )}
                  {c.facilityInfo && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Training Location</span>
                      <span className="font-semibold text-slate-900 text-right max-w-[60%]">{c.facilityInfo}</span>
                    </div>
                  )}
                  {c.equipmentIncluded && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Equipment & Materials</span>
                      <span className="font-semibold text-slate-900 text-right max-w-[60%]">{c.equipmentIncluded}</span>
                    </div>
                  )}
                  {c.bilingualSupport && (
                    <div className="text-sm bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-3">
                      <span className="font-semibold text-brand-blue-800">Language Support:</span>
                      <span className="text-brand-blue-700 ml-1">{c.bilingualSupport}</span>
                    </div>
                  )}
                  {c.nextLevelJobsEligible && (
                    <div className="flex items-center gap-2 text-sm bg-brand-green-50 border border-brand-green-200 rounded-lg p-3">
                      <CheckCircle2 className="w-4 h-4 text-brand-green-600 flex-shrink-0" />
                      <span className="font-semibold text-brand-green-800">Next Level Jobs Eligible</span>
                    </div>
                  )}
                  {c.admissionRequirements && c.admissionRequirements.length > 0 && (
                    <div className="text-sm">
                      <span className="text-slate-500 block mb-1">Admission Requirements</span>
                      <ul className="space-y-1">
                        {c.admissionRequirements.map((req) => (
                          <li key={req} className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-brand-green-600 mt-0.5 flex-shrink-0" />
                            <span className="text-slate-700">{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Right column — Pricing & Partners */}
                <div className="space-y-4">
                  {(c.selfPayCost || c.cohortPricing || c.pricingIncludes) && (
                    <>
                      <h3 className="font-bold text-slate-900 text-lg border-b border-slate-200 pb-2">Pricing & Funding</h3>
                      {c.selfPayCost && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Self-Pay Tuition</span>
                          <span className="font-semibold text-slate-900">{c.selfPayCost}</span>
                        </div>
                      )}
                      {c.cohortPricing && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Cohort/Partner Rate</span>
                          <span className="font-semibold text-slate-900">{c.cohortPricing}</span>
                        </div>
                      )}
                      {c.pricingIncludes && c.pricingIncludes.length > 0 && (
                        <div className="text-sm">
                          <span className="text-slate-500 block mb-1">Tuition Includes</span>
                          <ul className="space-y-1">
                            {c.pricingIncludes.map((item) => (
                              <li key={item} className="flex items-start gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-brand-green-600 mt-0.5 flex-shrink-0" />
                                <span className="text-slate-700">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {c.paymentTerms && (
                        <div className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3">{c.paymentTerms}</div>
                      )}
                    </>
                  )}
                  {c.employerPartners && c.employerPartners.length > 0 && (
                    <>
                      <h3 className="font-bold text-slate-900 text-lg border-b border-slate-200 pb-2 mt-6">Employer Partners</h3>
                      <ul className="space-y-2">
                        {c.employerPartners.map((partner) => (
                          <li key={partner} className="flex items-center gap-2 text-sm">
                            <Briefcase className="w-4 h-4 text-brand-blue-600 flex-shrink-0" />
                            <span className="text-slate-700">{partner}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              </div>
            </div>
          </section>
        </InView>
      )}

      {/* ===== CAREER PATHS ===== */}
      {c.careers && c.careers.length > 0 && (
        <InView animation="fade-up">
          <section className="py-14 lg:py-20 bg-white border-t border-slate-100">
            <div className="max-w-5xl mx-auto px-6">
              <div className="text-center mb-10">
                <p className="text-brand-red-600 font-semibold text-sm uppercase tracking-wider mb-2">After Graduation</p>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Career Paths</h2>
                <p className="text-slate-500 mt-2 max-w-md mx-auto">Where our graduates work after completing this program.</p>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {c.careers.map((career, i) => (
                  <ScrollReveal key={career.title} delay={i * 80} direction="up">
                    <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 text-center hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                      <Briefcase className="w-7 h-7 text-brand-blue-600 mx-auto mb-3" />
                      <h3 className="font-bold text-slate-900">{career.title}</h3>
                      <div className="text-brand-green-600 font-bold text-lg mt-1">{career.salary}</div>
                      {career.growth && <p className="text-xs text-slate-500 mt-1">{career.growth}</p>}
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </section>
        </InView>
      )}

      {/* ===== HOW TO ENROLL ===== */}
      {c.steps && c.steps.length > 0 && (
        <InView animation="fade-up">
          <section className="py-14 lg:py-20 bg-slate-50 border-t border-slate-100">
            <div className="max-w-5xl mx-auto px-6">
              <div className="text-center mb-10">
                <p className="text-brand-red-600 font-semibold text-sm uppercase tracking-wider mb-2">Get Started</p>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">How to Enroll</h2>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {c.steps.map((step, i) => (
                  <ScrollReveal key={step.title} delay={i * 100} direction="up">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-white text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                        {i + 1}
                      </div>
                      <h3 className="font-bold text-slate-900 mb-2">{step.title}</h3>
                      <p className="text-slate-600 text-sm">{step.desc}</p>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </section>
        </InView>
      )}

      {/* ===== FAQ ===== */}
      {c.faqs && c.faqs.length > 0 && (
        <InView animation="fade-up">
          <section className="py-14 lg:py-20 bg-white border-t border-slate-100">
            <div className="max-w-3xl mx-auto px-6">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-8 text-center">Frequently Asked Questions</h2>
              <div className="space-y-3">
                {c.faqs.map((faq) => (
                  <details key={faq.question} className="group bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                    <summary className="flex items-center justify-between cursor-pointer px-6 py-4 font-semibold text-slate-900 hover:text-brand-red-600 transition-colors text-sm">
                      {faq.question}
                      <span className="ml-4 text-slate-500 group-open:rotate-45 transition-transform text-lg leading-none">+</span>
                    </summary>
                    <div className="px-6 pb-4 text-slate-600 text-sm leading-relaxed">
                      {faq.answer}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          </section>
        </InView>
      )}

      {/* ===== FINAL CTA ===== */}
      <InView animation="fade-up">
        <section className="py-14 sm:py-20 bg-white border-t border-slate-100">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
              Start This Credential Pathway
            </h2>
            <p className="text-lg text-slate-600 mb-8 max-w-lg mx-auto">
              Apply in minutes. Training may be fully funded. Graduate with nationally recognized credentials.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href={applyHref}
                className="bg-brand-red-600 text-white px-10 py-4 rounded-lg font-bold text-lg hover:bg-brand-red-700 transition-colors"
              >
                Apply Now
              </Link>
              <Link
                href="/programs"
                className="border border-slate-300 text-slate-700 px-10 py-4 rounded-lg font-bold text-lg hover:bg-slate-50 transition-colors"
              >
                All Credential Pathways
              </Link>
            </div>
          </div>
        </section>
      </InView>

      {/* ===== TRUST BAR ===== */}
      <section className="py-8 bg-slate-50 border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Recognized By</p>
          <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-4 mb-4">
            {[
              { src: '/images/partners/usdol.webp', alt: 'U.S. Department of Labor' },
              { src: '/images/partners/dwd.webp', alt: 'Indiana DWD' },
              { src: '/images/partners/workone.webp', alt: 'WorkOne Indiana' },
              { src: '/images/partners/nextleveljobs.webp', alt: 'Next Level Jobs' },
            ].map((logo) => (
              <Image key={logo.alt} src={logo.src} alt={logo.alt} width={100} height={40} className="object-contain h-8 w-auto opacity-70 hover:opacity-100 transition-opacity" />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
