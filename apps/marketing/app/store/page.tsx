export const dynamic = 'force-static';

import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, PlayCircle, Sparkles } from 'lucide-react';
import HeroVideo from '@/components/marketing/HeroVideo';
import heroBanners from '@/content/heroBanners';
import StoreFAQ from './StoreFAQ';
import { ROICalculator } from '@/components/store/ROICalculator';
import { UnifiedSalesMarketplace } from '@/components/store/UnifiedSalesMarketplace';

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
        microLabel="Elevate Business Operating Platform"
        transcript={hero.transcript}
        analyticsName={hero.analyticsName}
        belowHeroHeadline="Start with what you need. Add more when your business is ready."
        belowHeroSubheadline="Website, CRM, AI assistants, education, workforce, testing and operations in one platform."
        ctas={[
          { label: 'Start 14-Day Free Trial', href: '/store/trial' },
          { label: 'Explore Everything', href: '#marketplace', variant: 'secondary' },
          { label: 'Try Interactive Demo', href: '/store/demo/admin', variant: 'secondary' },
        ]}
        trustIndicators={hero.trustIndicators}
      />

      <section className="border-b border-slate-200 bg-slate-50 py-10">
        <div className="mx-auto grid max-w-6xl gap-6 px-5 md:grid-cols-3">
          {[
            {
              title: '1. Start basic',
              text: 'Choose a low-cost platform plan or a focused app and use it for 14 days before committing.',
            },
            {
              title: '2. Add what you need',
              text: 'Upgrade into AI assistants, CRM, LMS, testing, workforce, apprenticeship, compliance and more.',
            },
            {
              title: '3. Keep one system',
              text: 'Your subscriptions, organization, users, customer records and entitlements stay connected.',
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
              <p className="text-sm font-black uppercase tracking-[0.2em] text-brand-red-300">Interactive selling</p>
              <h2 className="mt-3 text-3xl font-black sm:text-4xl">See the platform before you buy it</h2>
              <p className="mt-4 max-w-2xl leading-7 text-slate-300">
                Use sample-data demos to walk through Admin, Student and Employer experiences. Trial users receive real product access; demos never modify production records.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/store/demo/admin" className="inline-flex items-center gap-2 rounded-xl bg-brand-red-600 px-5 py-3 font-black hover:bg-brand-red-500">
                  <PlayCircle className="h-5 w-5" /> Admin Demo
                </Link>
                <Link href="/store/demo/student" className="rounded-xl border border-white/20 px-5 py-3 font-black hover:bg-white/10">Student Demo</Link>
                <Link href="/store/demo/employer" className="rounded-xl border border-white/20 px-5 py-3 font-black hover:bg-white/10">Employer Demo</Link>
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-7">
              <h3 className="text-xl font-black">Ready for a real workspace?</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Start the 14-day trial, build or import a website, then activate the business and education tools you need.
              </p>
              <div className="mt-6 space-y-3">
                <Link href="/store/trial" className="flex items-center justify-between rounded-xl bg-white px-5 py-3 font-black text-slate-950 hover:bg-slate-100">
                  Start Free Trial <ArrowRight className="h-4 w-4" />
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
