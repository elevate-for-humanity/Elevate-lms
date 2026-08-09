export const dynamic = 'force-static';

import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, PlayCircle, Sparkles } from 'lucide-react';
import HeroVideo from '@/components/marketing/HeroVideo';
import heroBanners from '@/content/heroBanners';
import StoreFAQ from './StoreFAQ';
import { ROICalculator } from '@/components/store/ROICalculator';
import { UnifiedSalesMarketplace } from '@/components/store/UnifiedSalesMarketplace';
import { GuidedProductInterview } from '@/components/store/GuidedProductInterview';

export const metadata: Metadata = {
  title: 'Elevate Store | AI Business, Workforce & Education Platform',
  description:
    'Start with Elevate and add the tools your organization needs: AI website builder, CRM, virtual assistants, LMS, course builder, testing, workforce, apprenticeship, compliance and business apps.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/store' },
  robots: { index: true, follow: true },
};

export default function StorePage() {
  const hero = heroBanners.store;

  return (
    <main className="min-h-screen bg-white">
      <HeroVideo
        videoSrcDesktop={hero.videoSrcDesktop}
        videoSrcMobile={hero.videoSrcMobile}
        posterImage={hero.posterImage}
        voiceoverSrc=""
        microLabel="Zero-Code AI Business Operating Platform"
        transcript={hero.transcript}
        analyticsName={hero.analyticsName}
        belowHeroHeadline="Tell Elevate what you want to build. AI helps set it up."
        belowHeroSubheadline="Build a website, create courses, launch a community, manage customers, find grants, operate workforce programs and add advanced tools only when you need them."
        ctas={[
          { label: 'Find My Best Setup', href: '#guided-setup' },
          { label: 'Watch Website Builder Demo', href: '/store/apps/website-builder#demo', variant: 'secondary' },
          { label: 'Explore Everything', href: '#marketplace', variant: 'secondary' },
        ]}
        trustIndicators={['No code required to start', '14-day trial paths', 'Advanced tools available when needed']}
      />

      <section className="border-b border-slate-200 bg-slate-50 py-10">
        <div className="mx-auto grid max-w-6xl gap-6 px-5 md:grid-cols-3">
          {[
            {
              title: '1. Describe your goal',
              text: 'Use plain English. You should not need to understand APIs, databases, hosting, workflow engines or developer settings.',
            },
            {
              title: '2. Let Elevate guide setup',
              text: 'Start in simple mode with AI-assisted recommendations, onboarding and product configuration instead of an empty dashboard.',
            },
            {
              title: '3. Upgrade when the need is real',
              text: 'Advanced tools stay optional. Elevate recommends the correct higher tier when you need features such as custom domains, API access, white-labeling or larger limits.',
            },
          ].map((item) => (
            <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <CheckCircle2 className="h-6 w-6 text-brand-red-600" />
              <h2 className="mt-4 text-lg font-black text-slate-950">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <GuidedProductInterview />
      <UnifiedSalesMarketplace />

      <section className="py-16">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-red-50 px-4 py-2 text-sm font-bold text-brand-red-700">
              <Sparkles className="h-4 w-4" /> See the business case
            </span>
            <h2 className="mt-4 text-3xl font-black text-slate-950">Calculate what one connected platform can replace</h2>
            <p className="mt-3 text-slate-600">
              Compare the cost of separate website, CRM, messaging, learning, workforce and automation tools against one Elevate stack.
            </p>
          </div>
          <div className="mt-10">
            <ROICalculator />
          </div>
        </div>
      </section>

      <section className="bg-slate-950 py-16 text-white">
        <div className="mx-auto max-w-6xl px-5">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-brand-red-300">Watch before you buy</p>
              <h2 className="mt-3 text-3xl font-black sm:text-4xl">Every product should show the customer what happens next</h2>
              <p className="mt-4 max-w-2xl leading-7 text-slate-300">
                Guided walkthroughs explain the workflow without requiring visitors to click blindly through dashboards. Product demos use sample data; trial workspaces are where customers create real records.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/store/apps/website-builder#demo" className="inline-flex items-center gap-2 rounded-xl bg-brand-red-600 px-5 py-3 font-black hover:bg-brand-red-500">
                  <PlayCircle className="h-5 w-5" /> Website Builder Walkthrough
                </Link>
                <Link href="/store/demo/admin" className="rounded-xl border border-white/20 px-5 py-3 font-black hover:bg-white/10">Admin Demo</Link>
                <Link href="/store/demo/student" className="rounded-xl border border-white/20 px-5 py-3 font-black hover:bg-white/10">Student Demo</Link>
                <Link href="/store/demo/employer" className="rounded-xl border border-white/20 px-5 py-3 font-black hover:bg-white/10">Employer Demo</Link>
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-7">
              <h3 className="text-xl font-black">Ready for a real workspace?</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Start the guided setup, create or import a website, and add business, education and workforce tools as your organization grows.
              </p>
              <div className="mt-6 space-y-3">
                <Link href="#guided-setup" className="flex items-center justify-between rounded-xl bg-white px-5 py-3 font-black text-slate-950 hover:bg-slate-100">
                  Find My Setup <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/store/plans" className="flex items-center justify-between rounded-xl border border-white/20 px-5 py-3 font-black text-white hover:bg-white/10">
                  Compare Plans <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-5xl px-5">
          <StoreFAQ />
        </div>
      </section>
    </main>
  );
}
