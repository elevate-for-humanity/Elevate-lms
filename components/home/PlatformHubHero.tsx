import Link from 'next/link';
import { SafeHeroVideo } from '@/components/hero/SafeHeroVideo';

const HOME_VIDEO =
  'https://pub-23811be4d3844e45a8bc2d3dc5e7aaec.r2.dev/videos/hero-home-fast.mp4';

export function PlatformHubHero() {
  return (
    <section
      className="relative w-full overflow-hidden bg-slate-950 text-white"
      aria-labelledby="home-hero-heading"
      data-scroll-narration
      data-narration="Elevate for Humanity connects career training, workforce development, registered apprenticeship, employer partnerships, and business technology. Choose the path that fits what you came here to do."
      data-narration-style="instructor"
    >
      <div className="absolute inset-0">
        <SafeHeroVideo
          src={HOME_VIDEO}
          poster="/images/pages/hero-home-first-frame.webp"
          priority
          loop
          ariaLabel="Elevate for Humanity career training, apprenticeship, workforce, and business programs"
          className="h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-slate-950/65" />
      </div>
      <div className="relative mx-auto flex min-h-[clamp(560px,78svh,820px)] max-w-7xl items-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-4xl">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-red-300">Career training • Workforce development • Registered apprenticeship • Business growth</p>
          <h1 id="home-hero-heading" className="mt-5 text-4xl font-black leading-[1.03] tracking-tight sm:text-6xl lg:text-7xl">
            Build a career. Build a workforce. Build a business.
          </h1>
          <p className="mt-6 max-w-3xl text-lg font-semibold leading-8 text-slate-100 sm:text-xl">
            Elevate for Humanity connects individuals, employers, workforce partners, and businesses through career training, state and workforce funding pathways for eligible participants, Registered Apprenticeship, employer services, and practical business technology.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/programs" className="inline-flex min-h-12 items-center rounded-xl bg-brand-red-600 px-6 py-3 font-black text-white hover:bg-brand-red-700">Explore Career Training</Link>
            <Link href="/check-eligibility" className="inline-flex min-h-12 items-center rounded-xl bg-white px-6 py-3 font-black text-slate-950 hover:bg-slate-100">Check Funding Options</Link>
            <Link href="/employers" className="inline-flex min-h-12 items-center rounded-xl border-2 border-slate-200 px-6 py-3 font-black text-white hover:bg-slate-100 hover:text-slate-950">Employers & Partners</Link>
            <Link href="/store/apps/website-builder" className="inline-flex min-h-12 items-center rounded-xl border-2 border-cyan-300 px-6 py-3 font-black text-cyan-100 hover:bg-cyan-50 hover:text-cyan-950">Business & Website Builder</Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-bold text-slate-200">
            <span>Registered Apprenticeship</span><span>Workforce training</span><span>Employer partnerships</span><span>Industry credentials</span><span>Compliance & reporting</span>
          </div>
        </div>
      </div>
    </section>
  );
}
