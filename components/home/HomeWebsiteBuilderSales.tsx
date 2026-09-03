import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, CalendarDays, CheckCircle2, Mic2 } from 'lucide-react';

const CAPABILITIES = [
  'Business websites and landing pages',
  'Customer portals and web apps',
  'Subscriptions and secure payments',
  'Booking, forms, CRM, and automation',
  'Courses, memberships, and client content',
  'Custom branding, domains, and publishing',
] as const;

export function HomeWebsiteBuilderSales() {
  return (
    <section className="bg-white px-4 py-14 sm:py-20" aria-labelledby="website-builder-sales-heading">
      <div className="mx-auto grid max-w-6xl gap-9 rounded-[2rem] border border-cyan-200 bg-gradient-to-br from-cyan-50 via-white to-rose-50 p-6 shadow-xl shadow-cyan-950/5 sm:p-10 lg:grid-cols-[.92fr_1.08fr] lg:items-center">
        <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-white bg-white shadow-2xl ring-1 ring-cyan-900/10">
          <Image src="/images/pages/platform-page-4.webp" alt="Business website and application being built across connected workspaces" fill className="object-cover brightness-105 contrast-105 saturate-110" sizes="(max-width: 1024px) 100vw, 45vw" />
        </div>

        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-cyan-100 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-cyan-950">
            <Mic2 className="h-4 w-4" /> Speak it. Build it. Launch it.
          </div>
          <h2 id="website-builder-sales-heading" className="mt-4 text-4xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
            Build an animated website or app by talking to it.
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-700">
            PARIS is Elevate&apos;s voice-and-text AI builder. Tell it what your business does, which pages you need, the colors and motion you want, and how customers should book or pay. It creates the first working draft, adds animated sections, and keeps revising the website or app as you speak or type—no coding required.
          </p>

          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            {CAPABILITIES.map((capability) => (
              <div key={capability} className="flex gap-2 rounded-xl bg-white p-3 text-sm font-bold text-slate-800 shadow-sm">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" /> {capability}
              </div>
            ))}
          </div>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href="/store/apps/website-builder" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-red-600 px-6 py-3 font-black text-white hover:bg-brand-red-700">
              Build My Website <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/store/demo/capability/website_builder" className="inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-brand-blue-700 bg-brand-blue-50 px-6 py-3 font-black text-brand-blue-950 hover:bg-brand-blue-100">
              Watch Website Builder Demo
            </Link>
            <Link href="/store/course-builder" className="inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-violet-700 bg-violet-50 px-6 py-3 font-black text-violet-950 hover:bg-violet-100">
              Watch Course Builder Demo
            </Link>
            <Link href="/store/apps/website-builder#plans" className="inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-slate-900 bg-white px-6 py-3 font-black text-slate-950 hover:bg-slate-50">
              View Plans & Subscriptions
            </Link>
            <Link href="/schedule-consultation" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-cyan-700 bg-cyan-50 px-6 py-3 font-black text-cyan-950 hover:bg-cyan-100">
              <CalendarDays className="h-4 w-4" /> Schedule a Build Consultation
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
