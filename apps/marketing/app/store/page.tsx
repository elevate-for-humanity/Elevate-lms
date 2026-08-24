export const dynamic = 'force-static';
export const revalidate = 300;

import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, PlayCircle, Sparkles } from 'lucide-react';
import heroBanners from '@/content/heroBanners';
import HeroVideo from '@/components/marketing/HeroVideo';
import StoreFAQ from './StoreFAQ';
import { ROICalculator } from '@/components/store/ROICalculator';
import { UnifiedSalesMarketplace } from '@/components/store/UnifiedSalesMarketplace';
import { GuidedProductInterview } from '@/components/store/GuidedProductInterview';
import { StoreGlossary } from '@/components/store/StoreGlossary';
import WebsiteBuilderCommercial from '@/components/store/WebsiteBuilderCommercial';

export const metadata: Metadata = {
  title: 'Elevate Store | AI Business, Workforce & Education Platform',
  description: 'Start with Elevate and add the tools your organization needs: AI website builder, CRM, virtual assistants, LMS, course builder, testing, workforce, apprenticeship, compliance and business apps.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/store' },
  robots: { index: true, follow: true },
};

const ROLE_DEMOS = [
  { label: 'Admin', href: '/store/demo/admin', description: 'Operations, learners, applications and programs.' },
  { label: 'Student', href: '/store/demo/student', description: 'Learner courses, progress and training experience.' },
  { label: 'Employer', href: '/store/demo/employer', description: 'Jobs, candidates, interviews and workforce requests.' },
  { label: 'Institutional', href: '/store/demo/institutional', description: 'Organization-level workflow and licensing experience.' },
];

export default function StorePage() {
  const hero = heroBanners.store;

  return (
    <main className="min-h-screen bg-white font-medium text-slate-950">
      <section className="border-b border-cyan-100 bg-gradient-to-b from-cyan-50 via-white to-rose-50 py-6 sm:py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="overflow-hidden rounded-3xl border border-white bg-white shadow-2xl shadow-cyan-900/10 ring-1 ring-slate-200">
            <HeroVideo videoSrcDesktop={hero.videoSrcDesktop} videoSrcMobile={hero.videoSrcMobile} posterImage={hero.posterImage || '/images/pages/store-licensing-hero.webp'} voiceoverSrc={hero.voiceoverSrc} analyticsName="store-commercial" mediaFit="cover" heightClassName="aspect-[16/9] h-auto min-h-[260px] max-h-[520px] sm:aspect-[21/9]" />
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white py-10 sm:py-12">
        <div className="mx-auto max-w-5xl px-5 text-center">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-brand-red-700">Elevate Business Operating Platform</p>
          <h1 className="mt-3 text-3xl font-black text-slate-950 sm:text-5xl">Start with what you need. Keep one connected workspace as you grow.</h1>
          <p className="mx-auto mt-4 max-w-3xl text-base font-semibold leading-7 text-slate-800 sm:text-lg">Website, CRM, AI assistants, education, workforce, testing and operations in one connected platform.</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href="/store/trial" className="rounded-xl bg-brand-red-700 px-6 py-3 font-black text-white hover:bg-brand-red-800">Start Free Trial</Link>
            <Link href="#role-demos" className="rounded-xl border-2 border-slate-800 px-6 py-3 font-black text-slate-950 hover:bg-slate-100">See Role Demos</Link>
          </div>
          <p className="mt-4 text-sm font-semibold text-slate-600">14 days · no card required · build new or connect an existing website</p>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-slate-50 py-12">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mx-auto max-w-3xl text-center"><p className="text-sm font-black uppercase tracking-[0.18em] text-brand-red-700">Why Elevate</p><h2 className="mt-3 text-3xl font-black">One customer record, one workspace, one upgrade path.</h2></div>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              { title: '1. Start basic', text: 'Use a focused app or workspace trial before committing to a paid plan.' },
              { title: '2. Add what you need', text: 'Add CRM, AI, learning, workforce, apprenticeship, testing and compliance capabilities as your organization needs them.' },
              { title: '3. Keep one system', text: 'Your organization, users, workspace, subscriptions and entitlements stay connected instead of forcing a new setup for every product.' },
            ].map((item) => <article key={item.title} className="rounded-2xl border border-slate-300 bg-white p-6 shadow-sm"><CheckCircle2 className="h-6 w-6 text-brand-red-700" /><h3 className="mt-4 text-lg font-black text-slate-950">{item.title}</h3><p className="mt-2 text-sm font-semibold leading-6 text-slate-800">{item.text}</p></article>)}
          </div>
        </div>
      </section>

      <GuidedProductInterview />

      <section id="role-demos" className="border-y border-cyan-100 bg-gradient-to-br from-cyan-50 via-white to-rose-50 py-16 text-slate-950">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mx-auto max-w-3xl text-center"><p className="text-sm font-black uppercase tracking-[0.2em] text-brand-red-700">Role demos</p><h2 className="mt-3 text-3xl font-black sm:text-4xl">See the platform from the role that matters to you.</h2><p className="mt-4 font-semibold leading-7 text-slate-700">These are role-based sample experiences. Capability pages below are product tours unless explicitly labeled as an interactive sandbox.</p></div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ROLE_DEMOS.map((demo) => <Link key={demo.href} href={demo.href} className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm hover:border-brand-red-300 hover:shadow-md"><PlayCircle className="h-6 w-6 text-brand-red-700" /><h3 className="mt-3 text-lg font-black">{demo.label} Demo</h3><p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{demo.description}</p><span className="mt-4 inline-flex items-center gap-2 text-sm font-black text-brand-red-700">Open role demo <ArrowRight className="h-4 w-4" /></span></Link>)}
          </div>
        </div>
      </section>

      <UnifiedSalesMarketplace />

      <div id="website-builder-commercial">
        <WebsiteBuilderCommercial />
      </div>

      <section className="py-16">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mx-auto max-w-3xl text-center"><span className="inline-flex items-center gap-2 rounded-full bg-brand-red-50 px-4 py-2 text-sm font-black text-brand-red-800"><Sparkles className="h-4 w-4" /> Business case</span><h2 className="mt-4 text-3xl font-black text-slate-950">Calculate what one connected platform can replace</h2><p className="mt-3 font-semibold text-slate-800">Compare separate website, CRM, messaging, learning, workforce and automation costs against one Elevate stack. Estimates are illustrative and should be adjusted to your actual costs.</p></div>
          <div className="mt-10"><ROICalculator /></div>
        </div>
      </section>

      <StoreGlossary />

      <section className="border-y border-slate-200 bg-slate-50 py-12">
        <div className="mx-auto grid max-w-5xl gap-6 px-5 md:grid-cols-[1fr_auto] md:items-center">
          <div><h2 className="text-2xl font-black">Ready to use your own workspace?</h2><p className="mt-2 font-semibold text-slate-700">Start free, keep guided recommendations or sample progress where supported, then choose a paid plan only when you are ready.</p></div>
          <div className="flex flex-wrap gap-3"><Link href="/store/trial" className="inline-flex items-center gap-2 rounded-xl bg-brand-red-700 px-5 py-3 font-black text-white hover:bg-brand-red-800">Start Free Trial <ArrowRight className="h-4 w-4" /></Link><Link href="/store/plans" className="rounded-xl border-2 border-slate-800 bg-white px-5 py-3 font-black text-slate-950 hover:bg-slate-100">Compare Plans</Link></div>
        </div>
      </section>

      <section className="py-16"><div className="mx-auto max-w-5xl px-5"><StoreFAQ /></div></section>
    </main>
  );
}
