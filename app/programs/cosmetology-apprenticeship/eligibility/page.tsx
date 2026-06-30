export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import Link from 'next/link';
import { Phone, ExternalLink } from 'lucide-react';
import HeroVideo from '@/components/marketing/HeroVideo';
import ProgramFundingGate from '@/components/programs/ProgramFundingGate';
import heroBanners from '@/content/heroBanners';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Funding & Enrollment | Cosmetology Apprenticeship',
  description:
    'Explore funding options for the Cosmetology Apprenticeship — FSSA IMPACT for SNAP/TANF recipients, employer sponsorship, or self-pay with flexible weekly payments.',
};

export default function CosmetologyEligibilityPage() {
  const b = heroBanners['cosmetology-apprenticeship'];
  return (
    <div className="min-h-screen bg-white">
      <HeroVideo
        videoSrcDesktop={b?.videoSrcDesktop ?? 'https://pub-23811be4d3844e45a8bc2d3dc5e7aaec.r2.dev/videos/hero-home-fast.mp4'}
        posterImage={b?.posterImage ?? '/images/pages/programs-cosmetology-hero.webp'}
        microLabel="Cosmetology Apprenticeship"
        analyticsName="cosmetology-eligibility"
        belowHeroHeadline="Funding & Enrollment"
        belowHeroSubheadline="The Cosmetology Apprenticeship is not on Indiana's ETPL — it does not qualify for WIOA or Workforce Ready Grant. FSSA IMPACT (SNAP/TANF), employer sponsorship, and self-pay are all available."
        ctas={[
          {
            label: '← Back to Program',
            href: '/programs/cosmetology-apprenticeship',
            variant: 'secondary',
          },
        ]}
      />

      {/* Funding gate questionnaire */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Find Your Funding Path</h2>
          <p className="text-slate-600 mb-6">
            Answer two quick questions and we&rsquo;ll show you exactly how to enroll.
          </p>
          <ProgramFundingGate programSlug="cosmetology-apprenticeship" />
        </div>
      </section>

      {/* Contact support */}
      <section className="py-12 bg-white border-t border-slate-200">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Questions About Funding?</h2>
          <p className="text-slate-600 mb-6">
            Our enrollment team can help you explore all available options.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:elevate4humanityedu@gmail.com"
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition font-semibold"
            >
              <Phone className="w-4 h-4" />
              Contact Us
            </a>
            <a
              href={`tel:${PLATFORM_DEFAULTS.supportPhone.replace(/[^0-9]/g, "")}`}
              className="inline-flex items-center gap-2 px-6 py-3 border border-brand-blue-600 text-brand-blue-600 rounded-lg hover:bg-blue-50 transition font-semibold"
            >
              <ExternalLink className="w-4 h-4" />
              Call {PLATFORM_DEFAULTS.supportPhone}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
