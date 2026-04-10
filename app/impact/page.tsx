
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import HeroVideo from '@/components/marketing/HeroVideo';

export const dynamic = 'force-static';
export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Impact & Outcomes | Elevate for Humanity',
  description:
    'Support sustainable workforce systems with measurable outcomes. See how Elevate for Humanity creates lasting impact for learners, employers, and communities.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/impact',
  },
};

const FUNDER_REASONS = [
  {
    image: '/images/pages/admin-compliance-hero.jpg',
    alt: 'WIOA compliance dashboard showing participant tracking and reporting',
    title: 'Aligned with Funding Requirements',
    desc: 'Programs designed to meet WIOA, WRG, DOL, and state workforce board requirements. Built-in compliance and reporting.',
  },
  {
    image: '/images/pages/healthcare-grad.jpg',
    alt: 'Graduate receiving credential after completing workforce training',
    title: 'Proven Outcomes',
    desc: 'High completion rates, strong job placement, and wage gains. Real-time tracking and transparent reporting.',
  },
  {
    image: '/images/pages/admin-analytics-hero.jpg',
    alt: 'Platform analytics showing enrollment and outcome metrics',
    title: 'Scalable Infrastructure',
    desc: 'Technology platform that can be licensed and deployed across multiple sites, maximizing your investment.',
  },
  {
    image: '/images/pages/employer-handshake.jpg',
    alt: 'Employer and graduate meeting — sustainable workforce placement',
    title: 'Sustainable Model',
    desc: 'Designed for long-term sustainability through employer partnerships, licensing, and diversified funding.',
  },
];

export default function ImpactPage() {
  return (
    <div className="bg-white">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Impact' }]} />
        </div>
      </div>

      <HeroVideo
        videoSrcDesktop="/videos/graduation-success.mp4"
        posterImage="/images/pages/impact-video-poster.jpg"
        voiceoverSrc="/audio/welcome-voiceover.mp3"
        microLabel="Impact & Outcomes"
        analyticsName="impact"
      />

      {/* Why Funders Choose Elevate */}
      <section className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-3">
            Why Funders Choose Elevate
          </h2>
          <p className="text-slate-600 text-center mb-12 max-w-2xl mx-auto">
            Workforce boards, foundations, and government agencies fund Elevate because outcomes are measurable and compliance is built in.
          </p>

          <div className="grid sm:grid-cols-2 gap-8">
            {FUNDER_REASONS.map((item) => (
              <div key={item.title} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="relative w-full aspect-[4/3]" style={{ aspectRatio: '16/10' }}>
                  <Image
                    src={item.image}
                    alt={item.alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 50vw"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Outcome metrics strip */}
      <section className="py-12 bg-slate-50 border-y border-slate-200">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '14+', label: 'Program Types' },
              { value: '$0', label: 'Cost with WIOA Funding' },
              { value: '15+', label: 'Industry Credentials' },
              { value: '100%', label: 'Job Placement Support' },
            ].map((m) => (
              <div key={m.label}>
                <div className="text-3xl font-black text-brand-red-600 mb-1">{m.value}</div>
                <div className="text-sm text-slate-600">{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partnership Opportunities */}
      <section className="py-16 sm:py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-3">
            Partnership Opportunities
          </h2>
          <p className="text-slate-600 text-center mb-12 max-w-2xl mx-auto">
            Multiple ways to invest in workforce development with clear, measurable outcomes.
          </p>

          <div className="space-y-4">
            {[
              {
                title: 'Program Sponsorship',
                desc: 'Fund specific training programs or cohorts. Direct impact with clear outcomes — you know exactly how many people trained and placed.',
              },
              {
                title: 'Platform Licensing',
                desc: 'Support deployment of the Elevate platform to additional workforce organizations and regions. Multiplies your investment across multiple providers.',
              },
              {
                title: 'Barrier Removal Fund',
                desc: 'Support wraparound services: transportation, childcare, emergency assistance. Keeps participants in training who would otherwise drop out.',
              },
              {
                title: 'Innovation & Expansion',
                desc: 'Fund new program development, technology enhancements, or geographic expansion into underserved communities.',
              },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-5 p-6 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
                <div className="w-2 h-2 rounded-full bg-brand-red-600 mt-2 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">{item.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20 border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
            Ready to Make an Impact?
          </h2>
          <p className="text-slate-600 mb-8 max-w-xl mx-auto">
            Let&apos;s discuss how your support can create lasting change in workforce development.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/apply"
              className="inline-flex items-center justify-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white px-10 py-4 rounded-lg font-bold transition-colors"
            >
              Apply Now <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-10 py-4 rounded-lg font-bold transition-colors"
            >
              Contact Us <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center justify-center gap-2 border border-slate-300 text-slate-700 px-10 py-4 rounded-lg font-bold hover:bg-white transition-colors"
            >
              Learn More About Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
