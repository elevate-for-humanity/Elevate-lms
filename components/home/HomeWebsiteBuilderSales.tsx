import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, CalendarDays, CheckCircle2, Mic2 } from 'lucide-react';

const CAPABILITIES = [
  'Business websites and landing pages',
  'Voice or text guided page creation',
  'Business information and service sections',
  'Forms and customer contact sections',
  'Branding, page structure, and content revisions',
  'Preview and publishing workflow',
] as const;

export function HomeWebsiteBuilderSales() {
  return (
    <section className="bg-white px-4 py-10 sm:py-12" aria-labelledby="website-builder-sales-heading">
      <div className="mx-auto grid max-w-6xl gap-9 rounded-[2rem] border border-cyan-200 bg-cyan-50/50 p-6 shadow-xl shadow-cyan-950/5 sm:p-10 lg:grid-cols-[.92fr_1.08fr] lg:items-center">
        <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-white bg-white shadow-2xl ring-1 ring-cyan-900/10">
          <Image src="/images/pages/platform-page-4.webp" alt="Elevate Website Builder workspace for creating business website pages" fill className="object-cover brightness-105 contrast-105 saturate-110" sizes="(max-width: 1024px) 100vw, 45vw" />
        </div>
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-cyan-100 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-cyan-950"><Mic2 className="h-4 w-4" /> Speak it. Build it. Revise it.</div>
          <h2 id="website-builder-sales-heading" className="mt-4 text-4xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">Build your business website with voice or text guidance.</h2>
          <p className="mt-5 text-lg leading-8 text-slate-700">Tell PARIS about your business, services, pages, branding, and content. Use the Website Builder to create a draft, review the page structure, and request revisions without starting from a blank screen.</p>
          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            {CAPABILITIES.map((capability) => <div key={capability} className="flex gap-2 rounded-xl bg-white p-3 text-sm font-bold text-slate-800 shadow-sm"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" /> {capability}</div>)}
          </div>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href="/store/apps/website-builder" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-red-600 px-6 py-3 font-black text-white hover:bg-brand-red-700">Open Website Builder <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/store/demo/capability/website_builder" className="inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-brand-blue-700 bg-brand-blue-50 px-6 py-3 font-black text-brand-blue-950 hover:bg-brand-blue-100">Website Builder Walkthrough</Link>
            <Link href="/schedule-consultation" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-cyan-700 bg-cyan-50 px-6 py-3 font-black text-cyan-950 hover:bg-cyan-100"><CalendarDays className="h-4 w-4" /> Schedule a Website Consultation</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
