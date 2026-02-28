'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Award, Briefcase, CheckCircle2 } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { InView } from '@/components/ui/InView';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import ProgramHeroBanner from '@/components/ProgramHeroBanner';

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
  // Hero — video only, no text overlay
  videoSrc: string;
  voiceoverSrc?: string;

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

      {/* ===== VIDEO HERO — clean, no text ===== */}
      <ProgramHeroBanner videoSrc={c.videoSrc} voiceoverSrc={c.voiceoverSrc} />

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

      {/* ===== TITLE + QUICK FACTS ===== */}
      <InView animation="fade-up">
        <section className="bg-white py-10 sm:py-14">
          <div className="max-w-5xl mx-auto px-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="flex-1 min-w-0">
                {c.badge && (
                  <span className={`inline-block text-xs font-bold text-white px-3 py-1 rounded-full mb-4 ${badgeMap[c.badgeColor || 'red']}`}>
                    {c.badge}
                  </span>
                )}
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 leading-[1.1]">
                  {c.title}
                </h1>
                <p className="text-slate-500 text-lg mt-3 max-w-xl leading-relaxed">
                  {c.subtitle}
                </p>

                {/* Quick facts — inline, not a strip */}
                <div className="flex flex-wrap gap-x-8 gap-y-3 mt-6 text-sm">
                  {[
                    { label: 'Duration', value: c.duration },
                    { label: 'Cost', value: c.cost },
                    { label: 'Format', value: c.format },
                    { label: 'Credential', value: c.credential },
                  ].map((f) => (
                    <div key={f.label}>
                      <span className="text-slate-400">{f.label}</span>
                      <span className="ml-1.5 font-semibold text-slate-900">{f.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div className="flex flex-col gap-2 lg:pt-4 shrink-0">
                <Link
                  href={applyHref}
                  className="inline-flex items-center justify-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-3.5 rounded-lg transition-all shadow-lg shadow-brand-red-600/30 text-base"
                >
                  Apply Now
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/wioa-eligibility"
                  className="text-center text-sm text-slate-500 hover:text-brand-red-600 transition-colors"
                >
                  Check funding eligibility →
                </Link>
              </div>
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
                <p className="text-brand-red-600 font-semibold text-sm uppercase tracking-wider mb-2">Program Overview</p>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-4">What You&apos;ll Get</h2>
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

      {/* ===== CREDENTIALS ===== */}
      {c.credentials && c.credentials.length > 0 && (
        <InView animation="fade-up">
          <section className="py-14 lg:py-20 bg-slate-50 border-t border-slate-100">
            <div className="max-w-5xl mx-auto px-6">
              <div className="text-center mb-8">
                <p className="text-brand-red-600 font-semibold text-sm uppercase tracking-wider mb-2">Credentials</p>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">What You&apos;ll Earn</h2>
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                {c.credentials.map((cr, i) => (
                  <ScrollReveal key={cr} delay={i * 60} direction="up">
                    <div className="flex items-center gap-2 bg-white border border-brand-green-200 rounded-full px-5 py-2.5 shadow-sm">
                      <Award className="w-4 h-4 text-brand-green-600 flex-shrink-0" />
                      <span className="text-sm font-semibold text-brand-green-800">{cr}</span>
                    </div>
                  </ScrollReveal>
                ))}
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
                      <div className="w-12 h-12 bg-brand-red-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
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
                      <span className="ml-4 text-slate-400 group-open:rotate-45 transition-transform text-lg leading-none">+</span>
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
        <section className="py-14 sm:py-20 bg-brand-red-600 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_50%)]" />
          <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
              Ready to Change Your Life?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-lg mx-auto">
              Apply in minutes. Most students begin training within 2–4 weeks.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href={applyHref}
                className="bg-white text-brand-red-600 px-10 py-4 rounded-lg font-bold text-lg hover:bg-slate-50 transition-colors"
              >
                Get Started Today
              </Link>
              <Link
                href="/programs"
                className="bg-brand-red-700 text-white px-10 py-4 rounded-lg font-bold text-lg hover:bg-brand-red-800 transition-colors"
              >
                Browse All Programs
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
