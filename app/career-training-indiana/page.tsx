export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import Link from 'next/link';
import HeroVideo from '@/components/marketing/HeroVideo';
import heroBanners from '@/content/heroBanners';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/career-training-indiana',
  },
  title: 'Career Training Indiana',
  description:
    'Indiana career training and workforce pathways with WIOA-aligned funding options, apprenticeship tracks, and credential programs.',
};

const workforceHighlights = [
  'WIOA-aligned enrollment guidance through Indiana workforce channels',
  'Career pathways across healthcare, skilled trades, technology, and business',
  'Credential-focused training mapped to employer-ready outcomes',
  'Support for residents in Indianapolis, Fort Wayne, Evansville, South Bend, and statewide',
];

const indianaPathways = [
  {
    title: 'Healthcare Programs',
    description:
      'CNA, medical assistant, and patient-support pathways designed for entry-level healthcare employment.',
    href: '/programs/healthcare',
  },
  {
    title: 'Skilled Trades',
    description:
      'CDL, HVAC, electrical, and welding pathways aligned to high-demand Indiana trade sectors.',
    href: '/programs/skilled-trades',
  },
  {
    title: 'Technology & Business',
    description:
      'IT support, cybersecurity, and business administration pathways with practical job-readiness focus.',
    href: '/programs/technology',
  },
  {
    title: 'Apprenticeship Pathways',
    description:
      'Earn-while-you-learn options that combine structured instruction with supervised workplace progression.',
    href: '/programs/apprenticeships',
  },
];

export default function CareerTrainingIndianaPage() {
  const banner = heroBanners['career-training-indiana'] ?? heroBanners['programs'];

  return (
    <div className="min-h-screen bg-white">
      {banner?.videoSrcDesktop && (
        <HeroVideo
          videoSrcDesktop={banner.videoSrcDesktop}
          videoSrcMobile={banner.videoSrcMobile}
          posterImage={banner.posterImage}
          voiceoverSrc={banner.voiceoverSrc}
          microLabel={banner.microLabel ?? 'Indiana'}
          belowHeroHeadline={banner.belowHeroHeadline}
          belowHeroSubheadline={banner.belowHeroSubheadline}
          ctas={[
            { label: 'Apply Now', href: '/apply?program=indiana-workforce', variant: 'primary' },
            { label: 'Request Information', href: '/contact?program=indiana-workforce', variant: 'secondary' },
          ]}
          trustIndicators={banner.trustIndicators}
          transcript={banner.transcript}
          analyticsName={banner.analyticsName}
        />
      )}

      <section className="py-14 border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-6">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
            Indiana Career Training & Workforce Development
          </h1>
          <p className="text-slate-600 leading-relaxed max-w-3xl">
            {PLATFORM_DEFAULTS.orgName} supports Indiana learners with practical career pathways, documented
            training progression, and credential-focused outcomes. Programs are structured for
            residents seeking workforce entry, transition, or advancement.
          </p>
          <div className="mt-8 grid sm:grid-cols-2 gap-4">
            {workforceHighlights.map((item) => (
              <div key={item} className="flex items-start gap-3">
                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-brand-red-500 flex-shrink-0" />
                <p className="text-slate-700">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 bg-slate-50 border-y border-slate-200">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8">
            Indiana Pathways by Career Track
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {indianaPathways.map((pathway) => (
              <div key={pathway.title} className="rounded-xl border border-slate-200 bg-white p-6">
                <h3 className="text-xl font-semibold text-slate-900 mb-2">{pathway.title}</h3>
                <p className="text-slate-600 mb-4">{pathway.description}</p>
                <Link href={pathway.href} className="text-brand-blue-700 font-semibold hover:underline">
                  Apply Now
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">Funding & Access</h2>
          <p className="text-slate-600 leading-relaxed mb-6 max-w-3xl">
            Indiana workforce participants may qualify for funding support depending on eligibility,
            program path, and regional workforce guidance. Our team helps learners evaluate
            eligibility and align next steps with the right pathway.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/contact?program=indiana-workforce"
              className="inline-flex items-center rounded-lg px-6 py-3 bg-brand-red-600 text-white font-semibold hover:bg-brand-red-700"
            >
              Request Information
            </Link>
            <Link
              href="https://www.indianacareerconnect.com/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-lg px-6 py-3 border border-slate-300 text-slate-800 font-semibold hover:bg-slate-50"
            >
              Indiana Career Connect
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
