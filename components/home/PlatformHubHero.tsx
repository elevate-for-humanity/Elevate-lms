import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { SafeHeroVideo } from '@/components/hero/SafeHeroVideo';

const HOME_VIDEO =
  'https://pub-23811be4d3844e45a8bc2d3dc5e7aaec.r2.dev/videos/hero-home-fast.mp4';

export function PlatformHubHero() {
  return (
    <section
      className="relative isolate w-full overflow-hidden bg-slate-950"
      aria-label="Elevate for Humanity career training and apprenticeship hero"
      data-scroll-narration
      data-narration="Welcome to Elevate for Humanity. Earn while you learn through apprenticeships, explore career training, and see how to get started."
      data-narration-style="instructor"
    >
      <div className="absolute inset-0 -z-10">
        <SafeHeroVideo
          src={HOME_VIDEO}
          poster="/images/pages/hero-home-first-frame.webp"
          priority
          loop
          ariaLabel="Elevate for Humanity career training, apprenticeship, and workforce programs"
          className="h-full w-full object-cover object-center"
        />
      </div>
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-slate-950/25" aria-hidden="true" />
      <div className="mx-auto flex min-h-[540px] max-w-6xl flex-col justify-center px-5 py-16 sm:min-h-[600px] sm:px-8 lg:min-h-[620px]">
        <p className="mb-4 text-sm font-bold uppercase tracking-[0.18em] text-amber-300">Career training • Apprenticeships • Employer connections</p>
        <h2 className="max-w-3xl text-4xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-6xl">
          Build a career. <span className="text-amber-300">Earn while you learn.</span>
        </h2>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-white sm:text-xl">
          Explore hands-on pathways in barbering, cosmetology, esthetics, nail technology, HVAC, CDL, bookkeeping and business. Compare programs, find a host shop, and take your next step.
        </p>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-100">
          Apprenticeship wages depend on an eligible paid placement. Workforce funding may be available to qualified applicants with agency approval.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/programs" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-amber-300 px-6 py-3 font-bold text-slate-950 hover:bg-amber-200">
            Explore programs <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </Link>
          <Link href="/apprenticeships" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-white bg-slate-950/50 px-6 py-3 font-bold text-white hover:bg-slate-800">
            Earn while you learn <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </Link>
          <Link href="/partners/host-shops" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/70 px-6 py-3 font-bold text-white hover:bg-white/15">
            Find a host shop
          </Link>
        </div>
      </div>
    </section>
  );
}
