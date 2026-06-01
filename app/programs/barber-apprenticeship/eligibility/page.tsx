export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import Link from 'next/link';
import { Phone, ExternalLink, MapPin } from 'lucide-react';
import HeroVideo from '@/components/marketing/HeroVideo';
import ProgramFundingGate from '@/components/programs/ProgramFundingGate';
import heroBanners from '@/content/heroBanners';
import { TransferHoursCalculator } from '../TransferHoursCalculator';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Funding & Enrollment | Barber Apprenticeship',
  description:
    'Explore funding options for the Barber Apprenticeship — FSSA IMPACT for SNAP/TANF recipients, employer sponsorship, or self-pay with flexible weekly payments.',
};

export default function BarberEligibilityPage() {
  const b = heroBanners['barber-apprenticeship'];
  return (
    <div className="min-h-screen bg-white">
      <HeroVideo
        videoSrcDesktop={b?.videoSrcDesktop ?? 'https://pub-23811be4d3844e45a8bc2d3dc5e7aaec.r2.dev/videos/barber-hero-final.mp4'}
        posterImage={b?.posterImage ?? '/hero-images/barber-hero.webp'}
        microLabel="Barber Apprenticeship"
        analyticsName="barber-eligibility"
        belowHeroHeadline="Funding & Enrollment"
        belowHeroSubheadline="Indiana residents may qualify for WIOA, Workforce Ready Grant, or FSSA IMPACT. Employer sponsorship and self-pay with flexible weekly payments are also available."
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
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Find Your Funding Path</h2>
          <p className="text-slate-600 mb-6">
            Answer two quick questions and we&rsquo;ll show you exactly how to enroll.
          </p>
          <ProgramFundingGate
            programName="Barber Apprenticeship"
            applyHref="/programs/barber-apprenticeship/apply"
            selfPayCost="$4,980"
            depositAmount="$1,743"
            depositHref="https://buy.stripe.com/8x2bJ21986rletw0dN8EN0o"
            fullPayHref="https://buy.stripe.com/6oUdRa4lkaHB7141hR8EN0b"
          />
        </div>
      </section>

      {/* Why not WIOA/WRG */}
      <section className="py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">
            Why isn&rsquo;t this program WIOA or WRG eligible?
          </h2>
          <p className="text-slate-600 mb-4">
            WIOA Individual Training Accounts (ITAs) and the Workforce Ready Grant can only be used
            at programs listed on Indiana&rsquo;s Eligible Training Provider List (ETPL). The Barber
            Apprenticeship is an apprenticeship-model program — it is not currently on the ETPL.
          </p>
          <p className="text-slate-600 mb-6">
            If you are exploring other ETPL-listed programs (such as HVAC or CNA), your WorkOne
            case manager can help you find options that qualify for full funding.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="https://www.indianacareerconnect.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition text-sm"
            >
              Indiana Career Connect
              <ExternalLink className="w-4 h-4" />
            </a>
            <Link
              href="/programs/hvac-technician"
              className="inline-flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-5 py-2.5 rounded-lg font-medium hover:bg-slate-50 transition text-sm"
            >
              View WIOA-Eligible Programs
            </Link>
          </div>
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

      {/* WorkOne reference */}
      <section className="py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Marion County WorkOne</h2>
          <p className="text-slate-600 mb-4">
            WorkOne case managers can connect you with other funded training programs and free
            career services — résumé help, job search, and more.
          </p>
          <div className="bg-slate-50 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-slate-600 text-sm">
              <Phone className="w-4 h-4" />
              <a href="tel:3176842400" className="hover:text-blue-600">
                (317) 684-2400
              </a>
            </div>
            <div className="flex items-center gap-2 text-slate-600 text-sm">
              <MapPin className="w-4 h-4" />
              <span>3500 DePauw Blvd, Indianapolis, IN 46268</span>
            </div>
          </div>
        </div>
      </section>

      {/* Contact footer */}
      <section className="py-12 bg-slate-900 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl font-bold mb-3">Questions About Enrollment?</h2>
          <p className="text-slate-300 mb-6">
            Our team can walk you through every funding option and help you get started.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href={`tel:${PLATFORM_DEFAULTS.supportPhone.replace(/[^0-9]/g, "")}`}
              className="inline-flex items-center gap-2 bg-white text-slate-900 px-6 py-3 rounded-lg font-medium hover:bg-slate-100 transition"
            >
              <Phone className="w-5 h-5" />
              {PLATFORM_DEFAULTS.supportPhone}
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
