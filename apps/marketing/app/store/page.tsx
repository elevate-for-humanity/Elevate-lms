export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, PlayCircle, Sparkles } from 'lucide-react';
import heroBanners from '@/content/heroBanners';
import HeroVideo from '@/components/marketing/HeroVideo';
import StoreFAQ from './StoreFAQ';
import { ROICalculator } from '@/components/store/ROICalculator';
import { UnifiedSalesMarketplace } from '@/components/store/UnifiedSalesMarketplace';
import { GuidedProductInterview } from '@/components/store/GuidedProductInterview';
import { HomeBusinessLaunch } from '@/components/home/HomeBusinessLaunch';
import WebsiteBuilderCommercial from '@/components/store/WebsiteBuilderCommercial';

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
    <main className="min-h-screen bg-white font-medium text-slate-950">
      <section className="border-b border-cyan-100 bg-gradient-to-b from-cyan-50 via-white to-rose-50 py-6 sm:py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="overflow-hidden rounded-3xl border border-white bg-white shadow-2xl shadow-cyan-900/10 ring-1 ring-slate-200">
            <HeroVideo
              videoSrcDesktop={hero.videoSrcDesktop}
              videoSrcMobile={hero.videoSrcMobile}
              posterImage={hero.posterImage || '/images/pages/store-licensing-hero.webp'}
              voiceoverSrc={hero.voiceoverSrc}
              analyticsName="store-commercial"
              mediaFit="cover"
              heightClassName="aspect-video h-auto min-h-[260px] max-h-none"
            />
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white py-10 sm:py-12">
        <div className="mx-auto max-w-5xl px-5 text-center">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-brand-red-700">Elevate Business Operating Platform</p>
          <h1 className="mt-3 text-3xl font-black text-slate-950 sm:text-5xl">Start with what you need. Add more when your business is ready.</h1>
          <p className="mx-auto mt-4 max-w-3xl text-base font-semibold leading-7 text-slate-800 sm:text-lg">
            Website, CRM, AI assistants, education, workforce, testing and operations in one connected platform.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href="/store/trial" className="rounded-xl bg-brand-red-700 px-6 py-3 font-black text-white hover:bg-brand-red-800">Start 14-Day Free Trial</Link>
            <Link href="#website-builder-commercial" className="rounded-xl border-2 border-slate-800 px-6 py-3 font-black text-slate-950 hover:bg-slate-100">See Website Builder Demo</Link>
            <Link href="#marketplace" className="rounded-xl border-2 border-slate-800 px-6 py-3 font-black text-slate-950 hover:bg-slate-100">Browse Product Demos</Link>
            <Link href="/online-apps" className="rounded-xl border-2 border-brand-red-700 px-6 py-3 font-black text-brand-red-800 hover:bg-brand-red-50">Open Live Apps & Portals</Link>
          </div>
          {hero.trustIndicators?.length ? (
            <div className="mt-7 flex flex-wrap justify-center gap-x-6 gap-y-2">
              {Array.from(new Set(hero.trustIndicators)).map((item) => (
                <span key={item} className="text-sm font-bold text-slate-900">• {item}</span>
              ))}
            </div>
          ) : null}
        </div>
      </section>

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
            <article key={item.title} className="rounded-2xl border border-slate-300 bg-white p-6 shadow-sm">
              <CheckCircle2 className="h-6 w-6 text-brand-red-700" />
              <h2 className="mt-4 text-lg font-black text-slate-950">{item.title}</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-800">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <div id="website-builder-commercial">
        <WebsiteBuilderCommercial />
      </div>

      <GuidedProductInterview />
      <UnifiedSalesMarketplace />
      <HomeBusinessLaunch />

      <section className="py-16">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-red-50 px-4 py-2 text-sm font-black text-brand-red-800">
              <Sparkles className="h-4 w-4" /> See the business case
            </span>
            <h2 className="mt-4 text-3xl font-black text-slate-950">Calculate what one connected platform can replace</h2>
            <p className="mt-3 font-semibold text-slate-800">
              Compare the cost of separate website, CRM, messaging, learning, workforce and automation tools against one Elevate stack.
            </p>
          </div>
          <div className="mt-10">
            <ROICalculator />
          </div>
        </div>
      </section>

      <section className="border-y border-cyan-100 bg-gradient-to-br from-cyan-50 via-white to-rose-50 py-16 text-slate-950">
        <div className="mx-auto max-w-6xl px-5">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-brand-red-700">Interactive proof</p>
              <h2 className="mt-3 text-3xl font-black sm:text-4xl">See the product move, then open the real portals.</h2>
              <p className="mt-4 max-w-2xl font-semibold leading-7 text-slate-700">
                Product demos should show the working experience—not bury it in dark slides. Use the interactive product walkthroughs, then open role-based portal experiences and live proof links from Online Apps.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="#marketplace" className="inline-flex items-center gap-2 rounded-xl bg-brand-red-700 px-5 py-3 font-black text-white hover:bg-brand-red-800">
                  <PlayCircle className="h-5 w-5" /> Browse Product Demos
                </Link>
                <Link href="/online-apps" className="rounded-xl border-2 border-slate-800 bg-white px-5 py-3 font-black hover:bg-slate-50">Open Online Apps</Link>
                <Link href="/store/demo/admin" className="rounded-xl border-2 border-slate-300 bg-white px-5 py-3 font-black hover:bg-slate-50">Admin Demo</Link>
                <Link href="/store/demo/student" className="rounded-xl border-2 border-slate-300 bg-white px-5 py-3 font-black hover:bg-slate-50">Student Demo</Link>
                <Link href="/store/demo/employer" className="rounded-xl border-2 border-slate-300 bg-white px-5 py-3 font-black hover:bg-slate-50">Employer Demo</Link>
              </div>
            </div>
            <div className="rounded-3xl border border-white bg-white p-7 shadow-xl shadow-cyan-900/10 ring-1 ring-slate-200">
              <h3 className="text-xl font-black">Ready for a real workspace?</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                Start the 14-day trial, build or import a website, then activate the business and education tools you need.
              </p>
              <div className="mt-6 space-y-3">
                <Link href="/store/trial" className="flex items-center justify-between rounded-xl bg-brand-red-700 px-5 py-3 font-black text-white hover:bg-brand-red-800">
                  Start Free Trial <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/store/plans" className="flex items-center justify-between rounded-xl border-2 border-slate-800 px-5 py-3 font-black text-slate-950 hover:bg-slate-50">
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
