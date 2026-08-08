import { hero as heroTokens } from '@/lib/page-design-tokens';
import { blurDataURL } from '@/lib/ui/blur-placeholder';
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { BNPL_DESCRIPTION } from '@/lib/bnpl-config';
import { ArrowRight } from 'lucide-react';
import { VERIFIED_WORKFORCE_FUNDED_PROGRAMS } from '@/lib/programs/funding-registry';

export const dynamic = 'force-dynamic';

// EligibilityScreener uses browser APIs — imported via a 'use client' wrapper.
import EligibilityScreener from '@/components/funding/EligibilityScreenerClient';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/funding' },
  title: 'Workforce Funding',
  description:
    'Review the four Elevate programs confirmed for workforce-funding consideration: CDL, HVAC, Business Administration, and Financial Literacy.',
  openGraph: {
    title: 'Workforce Funding',
    description:
      'CDL, HVAC, Business Administration, and Financial Literacy are the four confirmed workforce-fundable pathways. Agency authorization is required.',
    url: 'https://www.elevateforhumanity.org/funding',
    siteName: PLATFORM_DEFAULTS.orgName,
    images: [
      {
        url: '/images/pages/funding-page-5.webp',
        width: 1200,
        height: 630,
        alt: 'Career training funding options',
      },
    ],
    type: 'website',
  },
};

const FUNDING_OPTIONS = [
  {
    tag: 'Federal',
    tagColor: 'bg-brand-blue-100 text-brand-blue-800',
    title: 'WIOA — Workforce Innovation & Opportunity Act',
    desc: 'WIOA may authorize approved training costs for an eligible participant after WorkOne reviews the applicant and program.',
    bullets: [
      'Applicant eligibility is determined by WorkOne',
      'Written authorization is required before training',
      'Authorized amounts and services vary by participant',
      'Applies only to an approved program selection',
    ],
    bulletColor: 'bg-brand-blue-500',
    image: '/images/pages/funding-page-3.webp',
    imageAlt: 'WIOA workforce funding',
    link: '/wioa-eligibility',
    linkText: 'Learn about WIOA eligibility',
  },
  {
    tag: 'State — Indiana',
    tagColor: 'bg-brand-orange-100 text-brand-orange-800',
    title: 'WRG — Workforce Ready Grant',
    desc: "Indiana's Workforce Ready Grant may support eligible high-demand training after the responsible agency confirms program and participant eligibility.",
    bullets: [
      'Confirmed here only for CDL and HVAC',
      'Indiana eligibility requirements apply',
      'Agency approval is required before enrollment',
      'The agency determines the authorized amount',
    ],
    bulletColor: 'bg-brand-orange-500',
    image: '/images/pages/funding-page-3.webp',
    imageAlt: 'Workforce Ready Grant',
    link: 'https://www.nextleveljobs.org',
    linkText: 'Learn about WRG at Next Level Jobs',
    external: true,
  },
];

const HOW_TO_STEPS = [
  {
    step: '1',
    title: 'Register at Indiana Career Connect',
    desc: 'Create your free account at indianacareerconnect.com.',
    link: 'https://www.indianacareerconnect.com',
    linkText: 'Register Now',
    external: true,
  },
  {
    step: '2',
    title: 'Schedule a WorkOne Appointment',
    desc: 'Visit your local WorkOne office to discuss funding options.',
    link: 'https://www.in.gov/dwd/workone/workone-locations/',
    linkText: 'Find WorkOne Locations',
    external: true,
  },
  {
    step: '3',
    title: 'Get Your Eligibility Determined',
    desc: 'WorkOne reviews your situation and determines which programs you qualify for.',
  },
  {
    step: '4',
    title: 'Apply at Elevate',
    desc: 'Submit your student application and select your training program.',
    link: '/apply',
    linkText: 'Apply Now',
  },
  {
    step: '5',
    title: 'Confirm Authorization and Start',
    desc: 'Enroll after the funding agency issues written authorization for your selected program.',
  },
];

export default function FundingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Workforce Funding' }]} />
        </div>
      </div>

      {/* Hero — standard height, no text overlay */}
      <section className={`${heroTokens.imageWrap} w-full overflow-hidden`}>
        <Image
          placeholder="blur"
          blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg=="
          src="/images/pages/funding-page-5.webp"
          alt="Workforce funding options for career training"
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
      </section>

      {/* Page identity — below hero */}
      <section className="border-b border-slate-100 py-10 px-4">
        <div className="max-w-5xl mx-auto">
          <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-3">
            Indiana Residents · All Students
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-4">
            Workforce Funding
          </h1>
          <p className="text-black text-base sm:text-lg max-w-2xl leading-relaxed mb-2">
            CDL, HVAC, Business Administration, and Financial Literacy are the four Elevate programs
            confirmed for workforce-funding consideration.
          </p>
          <p className="text-black text-sm max-w-2xl leading-relaxed mb-6">
            Funding is not automatic or guaranteed. WorkOne or the responsible agency determines
            participant eligibility, covered costs, and authorization. All other programs are
            presented as self-pay unless an agency provides written authorization.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="https://www.indianacareerconnect.com"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold px-7 py-3 rounded-xl transition-colors text-sm"
            >
              Go to Indiana Career Connect
            </a>
            <Link
              href="/apply"
              className="border-2 border-slate-300 hover:border-brand-blue-400 text-slate-700 font-bold px-7 py-3 rounded-xl transition-colors text-sm"
            >
              Apply for Training
            </Link>
          </div>
        </div>
      </section>

      <section className="py-14 border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4">
          <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-2">
            Confirmed Program List
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3">
            Four Workforce-Fundable Pathways
          </h2>
          <p className="text-black text-base max-w-3xl leading-relaxed mb-8">
            This list controls the funding labels across the website. Appearing here does not
            guarantee that a particular applicant will be approved.
          </p>
          <div className="grid sm:grid-cols-2 gap-5">
            {VERIFIED_WORKFORCE_FUNDED_PROGRAMS.map((program) => (
              <article key={program.slug} className="rounded-xl border border-slate-200 p-5">
                <h3 className="font-bold text-slate-900 text-lg mb-2">{program.title}</h3>
                <p className="text-black text-sm leading-relaxed mb-4">{program.description}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {program.wioaEligible && (
                    <span className="rounded-full bg-brand-blue-50 px-3 py-1 text-xs font-bold text-brand-blue-800">
                      WIOA consideration
                    </span>
                  )}
                  {program.wrgEligible && (
                    <span className="rounded-full bg-brand-orange-50 px-3 py-1 text-xs font-bold text-brand-orange-800">
                      WRG consideration
                    </span>
                  )}
                </div>
                <Link
                  href={`/programs/${program.slug}`}
                  className="inline-flex items-center gap-2 text-brand-blue-600 font-semibold text-sm hover:underline"
                >
                  View program <ArrowRight className="w-4 h-4" />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Eligibility screener */}
      <section className="py-12 bg-slate-50 border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-8">
            <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-2">
              2-minute screener
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">
              Find Out What You Qualify For
            </h2>
            <p className="text-black text-sm max-w-md mx-auto">
              Answer 4 questions and we'll point you to the right funding path — or self-pay options
              if funding doesn't apply.
            </p>
          </div>
          <EligibilityScreener />
        </div>
      </section>

      {/* Funding options */}
      <section className="py-14">
        <div className="max-w-5xl mx-auto px-4">
          <div className="mb-10">
            <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-2">
              Funding Sources
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Funding Options</h2>
            <p className="text-black text-base mt-2 max-w-2xl leading-relaxed">
              WIOA may be considered for all four confirmed programs. WRG is shown only for CDL and
              HVAC. WorkOne or the responsible agency makes the final decision.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {FUNDING_OPTIONS.map((opt) => (
              <div key={opt.title} className="rounded-xl overflow-hidden border border-slate-200">
                <div className="relative h-[180px] overflow-hidden">
                  <Image
                    src={opt.image}
                    alt={opt.imageAlt}
                    fill
                    sizes="(max-width: 640px) 100vw, 50vw"
                    className="object-cover"
                    placeholder="empty"
                  />
                  <span
                    className={`absolute top-3 left-3 text-xs font-bold px-3 py-1 rounded-full ${opt.tagColor}`}
                  >
                    {opt.tag}
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-slate-900 text-base mb-2">{opt.title}</h3>
                  <p className="text-black text-sm leading-relaxed mb-3">{opt.desc}</p>
                  <div className="space-y-1.5 mb-4">
                    {opt.bullets.map((b) => (
                      <div key={b} className="flex items-center gap-2">
                        <span
                          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${opt.bulletColor}`}
                        />
                        <span className="text-slate-700 text-sm">{b}</span>
                      </div>
                    ))}
                  </div>
                  {opt.external ? (
                    <a
                      href={opt.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-brand-blue-600 font-semibold text-sm hover:underline"
                    >
                      {opt.linkText} <ArrowRight className="w-4 h-4" />
                    </a>
                  ) : (
                    <Link
                      href={opt.link}
                      className="inline-flex items-center gap-2 text-brand-blue-600 font-semibold text-sm hover:underline"
                    >
                      {opt.linkText} <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Self-pay options */}
      <section className="py-14 bg-slate-50 border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-2">
              No Funding? No Problem
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Self-Pay Options</h2>
            <p className="text-black text-base mt-2 max-w-xl mx-auto leading-relaxed">
              If you do not qualify for state or federal funding, we offer flexible payment options
              that may help you plan for enrollment.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              {
                tag: 'Best Value',
                title: 'Pay in Full',
                desc: 'One-time payment at enrollment. Some programs offer a discount for full payment.',
              },
              {
                tag: 'Flexible',
                title: 'Payment Plan',
                desc: 'Ask admissions whether an installment arrangement is available for your selected program.',
              },
              {
                tag: 'BNPL',
                title: 'Buy Now, Pay Later',
                desc: BNPL_DESCRIPTION,
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col"
              >
                <span className="text-xs font-bold text-brand-blue-700 bg-brand-blue-50 border border-brand-blue-200 px-2.5 py-1 rounded-full self-start mb-3">
                  {item.tag}
                </span>
                <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-black text-sm leading-relaxed mb-4 flex-1">{item.desc}</p>
                <Link
                  href="/apply"
                  className="inline-flex items-center gap-2 text-brand-blue-600 font-semibold text-sm hover:underline mt-auto"
                >
                  Apply Now <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How to get funded */}
      <section className="py-14 border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-2">
              Step by Step
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              How to Get Funded
            </h2>
          </div>
          <div className="space-y-3">
            {HOW_TO_STEPS.map((item) => (
              <div
                key={item.step}
                className="flex items-start gap-4 bg-slate-50 rounded-xl border border-slate-200 p-5"
              >
                <div className="w-9 h-9 bg-brand-red-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm mb-1">{item.title}</h3>
                  <p className="text-black text-sm leading-relaxed">{item.desc}</p>
                  {item.link &&
                    (item.external ? (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-brand-blue-600 text-sm font-semibold hover:underline mt-1.5"
                      >
                        {item.linkText} <ArrowRight className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <Link
                        href={item.link}
                        className="inline-flex items-center gap-1.5 text-brand-blue-600 text-sm font-semibold hover:underline mt-1.5"
                      >
                        {item.linkText} <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Indiana Career Connect callout */}
      <section className="py-10 bg-brand-blue-50 border-t border-brand-blue-100">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="flex-1">
              <p className="text-brand-blue-900 font-bold text-base mb-1">Indiana Career Connect</p>
              <p className="text-brand-blue-800 text-sm leading-relaxed">
                For WIOA-eligible and apprenticeship pathway applicants, the next step may require
                Indiana Career Connect. Register for free to begin the eligibility process.
              </p>
            </div>
            <a
              href="https://www.indianacareerconnect.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold px-7 py-3 rounded-xl transition-colors text-sm"
            >
              Go to Indiana Career Connect
            </a>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-14 bg-slate-900">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
            Find Out What You Qualify For
          </h2>
          <p className="text-white text-base leading-relaxed mb-8 max-w-xl mx-auto">
            Register at Indiana Career Connect and schedule a WorkOne appointment to explore your
            funding options. Or apply directly and we will help you navigate the process.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://www.indianacareerconnect.com"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold px-8 py-4 rounded-xl transition-colors text-base"
            >
              Go to Indiana Career Connect
            </a>
            <Link
              href="/apply"
              className="border-2 border-slate-600 hover:border-slate-400 text-white font-bold px-8 py-4 rounded-xl transition-colors text-base"
            >
              Apply for Training
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
