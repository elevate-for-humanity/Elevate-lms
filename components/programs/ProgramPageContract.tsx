'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { CheckCircle, DollarSign, Award, Users, BookOpen, ArrowRight } from 'lucide-react';
import { ReactNode } from 'react';

/**
 * Program types determine the primary CTA
 */
export type ProgramType = 'apprenticeship' | 'workforce_funded' | 'certificate' | 'paid_course';

/**
 * Funding options for the program
 */
export type FundingOption = 'self_pay' | 'wioa' | 'wrg' | 'employer' | 'grant' | 'bnpl';

/**
 * Program page configuration - all required fields enforced by TypeScript
 */
export interface ProgramPageConfig {
  // Identity
  slug: string;
  title: string;
  subtitle: string;
  programType: ProgramType;

  // Hero
  heroImage?: string;
  heroVideo?: string;
  heroPoster?: string;
  badges?: string[];

  // Snapshot (required for clarity)
  snapshot: {
    programType: string;
    duration: string;
    format: string;
    cost: string;
    credential: string;
  };

  // Who this is for (filtering)
  audience: {
    idealFor: string[];
    notFor: string[];
  };

  // Learning outcomes
  outcomes: {
    knowledge: string[];
    skills: string[];
    compliance: string[];
  };

  // The Path (chronology)
  path: {
    step: number;
    title: string;
    description: string;
  }[];

  // Credential details
  credential: {
    name: string;
    description: string;
    usedFor: string[];
    notIncluded?: string[];
  };

  // Funding
  funding: {
    options: FundingOption[];
    primaryOption?: FundingOption;
    notes?: string;
  };

  // CTAs
  applyUrl: string;
  inquiryUrl?: string;
  eligibilityUrl?: string;

  // Additional content slots
  additionalSections?: ReactNode;
}

/**
 * Get primary CTA text based on program type
 */
function getPrimaryCTA(type: ProgramType): string {
  switch (type) {
    case 'apprenticeship':
      return 'Apply Now';
    case 'workforce_funded':
      return 'Check Eligibility';
    case 'certificate':
    case 'paid_course':
      return 'Enroll & Pay';
  }
}

/**
 * Get funding label
 */
function getFundingLabel(option: FundingOption): string {
  switch (option) {
    case 'self_pay': return 'Self-Pay';
    case 'wioa': return 'WIOA Funding';
    case 'wrg': return 'Workforce Ready Grant';
    case 'employer': return 'Employer Sponsored';
    case 'grant': return 'Grant Funded';
    case 'bnpl': return 'Payment Plan';
  }
}

/**
 * ProgramPageContract - Enforces the program page contract
 * 
 * Every program page must use this layout to ensure consistency
 * and compliance with the program page contract.
 */
export function ProgramPageContract({ config }: { config: ProgramPageConfig }) {
  const primaryCTA = getPrimaryCTA(config.programType);
  const primaryUrl = config.programType === 'workforce_funded' && config.eligibilityUrl
    ? config.eligibilityUrl
    : config.applyUrl;

  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* BREADCRUMBS */}
      <div className="bg-gray-50 border-b">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <Breadcrumbs
            items={[
              { label: 'Programs', href: '/programs' },
              { label: config.title },
            ]}
          />
        </div>
      </div>

      {/* HERO */}
      <section className="relative min-h-[70vh] flex items-center">
        {config.heroVideo ? (
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            poster={config.heroPoster}
          >
            <source src={config.heroVideo} type="video/mp4" />
          </video>
        ) : config.heroImage ? (
          <Image
            src={config.heroImage}
            alt={config.title}
            fill
            className="object-cover"
            priority
          />
        ) : null}

        <div className="absolute inset-0 bg-black/50" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
          <div className="max-w-3xl">
            {/* Badges */}
            {config.badges && config.badges.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {config.badges.map((badge, i) => (
                  <span
                    key={i}
                    className="px-4 py-2 bg-brand-blue-600 text-white text-sm font-bold rounded-full"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            )}

            {/* H1 */}
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight text-white drop-shadow-lg">
              {config.title}
            </h1>

            {/* Subtitle */}
            <p className="mt-4 text-xl md:text-2xl text-white/90 drop-shadow-md">
              {config.subtitle}
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link
                href={primaryUrl}
                className="rounded-2xl bg-purple-600 text-white px-8 py-4 font-semibold shadow-lg hover:bg-purple-700 transition text-center"
              >
                {primaryCTA}
              </Link>
              {config.inquiryUrl && (
                <Link
                  href={config.inquiryUrl}
                  className="rounded-2xl bg-white text-slate-900 px-8 py-4 font-semibold shadow-lg hover:bg-gray-100 transition text-center"
                >
                  Request Information
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* PROGRAM SNAPSHOT */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Program at a Glance</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="text-sm text-gray-500 mb-1">Program Type</div>
              <div className="font-semibold text-gray-900">{config.snapshot.programType}</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="text-sm text-gray-500 mb-1">Duration</div>
              <div className="font-semibold text-gray-900">{config.snapshot.duration}</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="text-sm text-gray-500 mb-1">Format</div>
              <div className="font-semibold text-gray-900">{config.snapshot.format}</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="text-sm text-gray-500 mb-1">Cost</div>
              <div className="font-semibold text-gray-900">{config.snapshot.cost}</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="text-sm text-gray-500 mb-1">Credential</div>
              <div className="font-semibold text-gray-900">{config.snapshot.credential}</div>
            </div>
          </div>
        </div>
      </section>

      {/* WHO THIS IS FOR */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Who This Is For</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-green-50 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-green-900 mb-4 flex items-center gap-2">
                <CheckCircle className="w-6 h-6" />
                Ideal Candidates
              </h3>
              <ul className="space-y-3">
                {config.audience.idealFor.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-green-800">
                    <span className="text-green-600 mt-1">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-amber-50 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-amber-900 mb-4 flex items-center gap-2">
                <Users className="w-6 h-6" />
                May Not Be Right For
              </h3>
              <ul className="space-y-3">
                {config.audience.notFor.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-amber-800">
                    <span className="text-amber-600 mt-1">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* LEARNING OUTCOMES */}
      <section className="bg-brand-blue-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-8">What You Will Learn</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Knowledge
              </h3>
              <ul className="space-y-2">
                {config.outcomes.knowledge.map((item, i) => (
                  <li key={i} className="text-brand-blue-100">• {item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Award className="w-5 h-5" />
                Skills
              </h3>
              <ul className="space-y-2">
                {config.outcomes.skills.map((item, i) => (
                  <li key={i} className="text-brand-blue-100">• {item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Compliance & Readiness
              </h3>
              <ul className="space-y-2">
                {config.outcomes.compliance.map((item, i) => (
                  <li key={i} className="text-brand-blue-100">• {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* THE PATH */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Your Path to Completion</h2>
          <div className="relative">
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200 hidden md:block" />
            <div className="space-y-8">
              {config.path.map((step, i) => (
                <div key={i} className="flex gap-6 items-start">
                  <div className="w-16 h-16 rounded-full bg-purple-600 text-white flex items-center justify-center text-2xl font-bold flex-shrink-0 relative z-10">
                    {step.step}
                  </div>
                  <div className="pt-3">
                    <h3 className="text-xl font-semibold text-gray-900">{step.title}</h3>
                    <p className="mt-2 text-gray-600">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CREDENTIAL & OUTCOME */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">What You Receive</h2>
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <div className="flex items-start gap-4 mb-6">
              <Award className="w-12 h-12 text-purple-600 flex-shrink-0" />
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{config.credential.name}</h3>
                <p className="mt-2 text-gray-600">{config.credential.description}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mt-8">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">This credential can be used for:</h4>
                <ul className="space-y-2">
                  {config.credential.usedFor.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-700">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              {config.credential.notIncluded && config.credential.notIncluded.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Important to note:</h4>
                  <ul className="space-y-2">
                    {config.credential.notIncluded.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-600">
                        <span className="text-amber-500">⚠️</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FUNDING */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Funding & Payment</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {config.funding.options.map((option, i) => (
              <div
                key={i}
                className={`rounded-2xl p-6 ${
                  option === config.funding.primaryOption
                    ? 'bg-green-50 border-2 border-green-500'
                    : 'bg-white border border-gray-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className={`w-5 h-5 ${
                    option === config.funding.primaryOption ? 'text-green-600' : 'text-gray-500'
                  }`} />
                  <span className="font-semibold text-gray-900">{getFundingLabel(option)}</span>
                </div>
                {option === config.funding.primaryOption && (
                  <span className="text-sm text-green-700">Most common option</span>
                )}
              </div>
            ))}
          </div>
          {config.funding.notes && (
            <p className="mt-6 text-gray-600 text-sm">{config.funding.notes}</p>
          )}
        </div>
      </section>

      {/* ADDITIONAL SECTIONS */}
      {config.additionalSections}

      {/* FINAL CTA */}
      <section className="bg-slate-900 text-white py-20">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold">Ready to Get Started?</h2>
          <p className="mt-4 text-lg text-white/90">
            Take the next step toward your new career.
          </p>
          <div className="mt-10 flex justify-center gap-4 flex-col sm:flex-row">
            <Link
              href={primaryUrl}
              className="rounded-2xl bg-purple-600 text-white px-8 py-4 font-semibold hover:bg-purple-700 transition inline-flex items-center justify-center gap-2"
            >
              {primaryCTA}
              <ArrowRight className="w-5 h-5" />
            </Link>
            {config.inquiryUrl && (
              <Link
                href={config.inquiryUrl}
                className="rounded-2xl bg-white text-slate-900 px-8 py-4 font-semibold hover:bg-gray-100 transition"
              >
                Request Information
              </Link>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
