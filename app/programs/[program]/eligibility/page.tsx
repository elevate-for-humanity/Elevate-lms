export const dynamic = 'force-dynamic';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Phone, ExternalLink, MapPin } from 'lucide-react';
import HeroVideo from '@/components/marketing/HeroVideo';
import ProgramFundingGate from '@/components/programs/ProgramFundingGate';
import heroBanners from '@/content/heroBanners';
import { getBeautyProgram } from '@/lib/programs/beauty-programs';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

interface Props {
  params: Promise<{ program: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { program } = await params;
  const cfg = getBeautyProgram(program);
  if (!cfg) return { robots: { index: false, follow: false } };
  return {
    title: `Funding & Enrollment | ${cfg.title} | ${PLATFORM_DEFAULTS.orgName}`,
    description: `Explore funding options for the ${cfg.title} —  for SNAP/TANF recipients, employer sponsorship, or self-pay with flexible payments.`,
  };
}

export default async function BeautyEligibilityPage({ params }: Props) {
  const { program } = await params;
  const cfg = getBeautyProgram(program);
  if (!cfg) return notFound();

  const b = heroBanners[cfg.slug as keyof typeof heroBanners];
  const fullDollars = (cfg.fullTuitionCents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  const depositDollars = (cfg.depositCents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  return (
    <div className="min-h-screen bg-white">
      <HeroVideo
        videoSrcDesktop={
          (b as any)?.videoSrcDesktop ??
          'https://pub-23811be4d3844e45a8bc2d3dc5e7aaec.r2.dev/videos/barber-hero.mp4'
        }
        posterImage={(b as any)?.posterImage ?? '/images/pages/programs-hero.webp'}
        microLabel={cfg.title}
        analyticsName={`${cfg.slug}-eligibility`}
        belowHeroHeadline="Funding & Enrollment"
        belowHeroSubheadline={`The ${cfg.title} is not on Indiana's ETPL and does not qualify for WIOA or Workforce Ready Grant.  (SNAP/TANF), employer sponsorship, and self-pay are all available.`}
        ctas={[
          {
            label: '← Back to Program',
            href: `/programs/${cfg.slug}`,
            variant: 'secondary',
          },
        ]}
      />

      {/* Funding gate */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Find Your Funding Path</h2>
          <p className="text-slate-600 mb-6">
            Answer two quick questions and we&rsquo;ll show you exactly how to enroll.
          </p>
          <ProgramFundingGate
            programName={cfg.title}
            applyHref={`/programs/${cfg.slug}/apply`}
            selfPayCost={fullDollars}
            depositAmount={depositDollars}
            depositHref={cfg.stripeDepositLink}
            fullPayHref={cfg.stripeFullLink}
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
            WIOA Individual Training Accounts and the Workforce Ready Grant require programs to be
            listed on Indiana&rsquo;s Eligible Training Provider List (ETPL). The {cfg.title} is an
            apprenticeship-model program and is not currently on the ETPL.
          </p>
          <p className="text-slate-600 mb-6">
            If you are exploring ETPL-listed programs (such as HVAC or CNA), your WorkOne case
            manager can help you find options that qualify for full funding.
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

      {/* WorkOne reference */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Marion County WorkOne</h2>
          <p className="text-slate-600 mb-4">
            WorkOne case managers can connect you with other funded training programs and free
            career services — résumé help, job search, and more.
          </p>
          <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-slate-600 text-sm">
              <Phone className="w-4 h-4" />
              <a href="tel:3176842400" className="hover:text-blue-600">(317) 684-2400</a>
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
