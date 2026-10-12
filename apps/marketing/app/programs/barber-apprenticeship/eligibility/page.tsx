import { Phone } from 'lucide-react';
export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import Link from 'next/link';
import HeroVideo from '@/components/marketing/HeroVideo';
import ProgramFundingGate from '@/components/programs/ProgramFundingGate';
import heroBanners from '@/content/heroBanners';
import { TransferHoursCalculator } from '../TransferHoursCalculator';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Self-Pay Enrollment | Barber Apprenticeship',
  description: 'Review apprenticeship self-pay tuition, payment options, and enrollment steps.',
};

export default function BarberEligibilityPage() {
  const b = heroBanners['barber-apprenticeship'];
  return (
    <div className="min-h-screen bg-white">
      <HeroVideo
        videoSrcDesktop={b?.videoSrcDesktop ?? 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/videos/barber-hero-final.mp4'}
        
        microLabel="Barber Apprenticeship"
        analyticsName="barber-eligibility"
        belowHeroHeadline="Self-Pay Enrollment"
        belowHeroSubheadline="Apprenticeship programs are self-pay only. Review published tuition and payment terms before applying."
        ctas={[
          {
            label: '← Back to Program',
            href: '/programs/barber-apprenticeship',
            variant: 'secondary',
          },
        ]}
      />

      {/* Funding gate questionnaire */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Review Your Self-Pay Enrollment</h2>
          <p className="text-slate-600 mb-6">
            Answer two quick questions and we&rsquo;ll show you exactly how to enroll.
          </p>
          <ProgramFundingGate
            selfPayOnly
            programName="Barber Apprenticeship"
            applyHref="/programs/barber-apprenticeship/apply"
            selfPayCost="$4,980"
            depositAmount="$1,743"
            depositHref="/programs/barber-apprenticeship/apply"
            fullPayHref="/programs/barber-apprenticeship/apply"
          />
        </div>
      </section>

      {/* Payment calculator */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Weekly Payment Calculator</h2>
          <p className="text-slate-600 mb-6">
            Estimate your weekly payment based on transfer hours and deposit amount.
          </p>
          <TransferHoursCalculator />
        </div>
      </section>

      {/* Contact footer */}
      <section className="py-12 bg-slate-900 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl font-bold mb-3">Questions About Enrollment?</h2>
          <p className="text-slate-300 mb-6">
            Our team can walk you through self-pay payment terms and help you get started.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href={`tel:${PLATFORM_DEFAULTS.mainPhone.replace(/[^0-9]/g, "")}`}
              className="inline-flex items-center gap-2 bg-white text-slate-900 px-6 py-3 rounded-lg font-medium hover:bg-slate-100 transition"
            >
              <Phone className="w-5 h-5" />
              {PLATFORM_DEFAULTS.mainPhone}
            </a>
            <a
              href="mailto:elevate4humanityedu@gmail.com"
              className="inline-flex items-center gap-2 bg-slate-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-slate-600 transition"
            >
              Email Us
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
