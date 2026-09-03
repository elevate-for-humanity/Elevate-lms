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
    'Explore current funding and self-pay enrollment options for the Cosmetology Apprenticeship.',
};

const APPLY_HREF = '/programs/cosmetology-apprenticeship/apply';

export default function CosmetologyEligibilityPage() {
  const b = heroBanners['cosmetology-apprenticeship'];
  return (
    <div className="min-h-screen bg-white">
      <HeroVideo
        videoSrcDesktop={b?.videoSrcDesktop ?? 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/videos/hero-home-fast.mp4'}
        microLabel="Cosmetology Apprenticeship"
        analyticsName="cosmetology-eligibility"
        belowHeroHeadline="Funding & Enrollment"
        belowHeroSubheadline="Funding eligibility is verified individually. Apply first so Elevate can confirm the funding or self-pay path available for your enrollment."
        ctas={[{ label: '← Back to Program', href: '/programs/cosmetology-apprenticeship', variant: 'secondary' }]}
      />

      <section className="py-12 bg-slate-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Find Your Funding Path</h2>
          <p className="text-slate-700 mb-6">
            Answer the questions below to identify the next enrollment step. Final eligibility is confirmed during application review.
          </p>
          <ProgramFundingGate
            programName="Cosmetology Apprenticeship"
            applyHref={APPLY_HREF}
            selfPayCost="$5,500"
            depositAmount="$600"
            depositHref={APPLY_HREF}
            fullPayHref={APPLY_HREF}
          />
        </div>
      </section>

      <section className="py-12 bg-white border-t border-slate-200">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Questions About Funding?</h2>
          <p className="text-slate-700 mb-6">
            Our enrollment team can review your application and explain the funding or payment options available to you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand-blue-700 text-white rounded-lg hover:bg-brand-blue-800 transition font-semibold"
            >
              <Phone className="w-4 h-4" /> Contact Admissions
            </Link>
            <a
              href={`tel:${PLATFORM_DEFAULTS.supportPhone.replace(/[^0-9]/g, '')}`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-brand-blue-700 text-brand-blue-700 rounded-lg hover:bg-blue-50 transition font-semibold"
            >
              <ExternalLink className="w-4 h-4" /> Call {PLATFORM_DEFAULTS.supportPhone}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
