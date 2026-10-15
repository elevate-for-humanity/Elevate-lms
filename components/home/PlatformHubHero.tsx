import Link from 'next/link';
import Image from 'next/image';
import ImageMetadata from '@/components/marketing/ImageMetadata';

const HOME_IMAGE = '/images/refresh-20261014/home.webp';

export function PlatformHubHero() {
  return (
    <section
      className="relative w-full overflow-hidden bg-slate-950 text-white"
      aria-labelledby="home-hero-heading"
      data-scroll-narration
      data-narration="Elevate for Humanity connects career training, workforce development, registered apprenticeship, employer partnerships, and business technology. Choose the path that fits what you came here to do."
      data-narration-style="instructor"
    >
      <ImageMetadata
        src={HOME_IMAGE}
        description="Illustrative Elevate workforce institute exterior with adult professionals at the entrance"
      />
      <div className="relative aspect-video sm:aspect-auto sm:h-[clamp(240px,38svh,480px)] w-full overflow-hidden bg-sky-100">
        <Image
          src={HOME_IMAGE}
          alt="Illustrative Elevate workforce institute exterior with adult professionals at the entrance"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_74%]"
        />
        <div className="absolute left-4 top-4 max-w-[calc(100%-2rem)] rounded-xl bg-white px-4 py-3 shadow-md sm:left-8 sm:top-6 sm:px-6">
          <p className="text-xl font-black tracking-tight text-slate-950 sm:text-3xl">
            Elevate for Humanity
          </p>
          <p className="mt-1 text-xs font-bold uppercase tracking-wide text-brand-blue-700 sm:text-sm">
            Opportunity · Training · Community
          </p>
        </div>
      </div>
      <div className="relative mx-auto flex max-w-6xl items-center px-5 py-6 sm:px-8 sm:py-8">
        <div className="max-w-3xl">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-red-300">
            Career training • Workforce development • Registered apprenticeship • Business growth
          </p>
          <h1
            id="home-hero-heading"
            className="mt-3 text-3xl font-black leading-[1.1] tracking-tight sm:text-5xl"
          >
            Build a career. Build a workforce. Build a business.
          </h1>
          <p className="mt-4 max-w-3xl text-lg font-semibold leading-8 text-slate-100 sm:text-xl">
            Elevate for Humanity connects individuals, employers, workforce partners, and businesses
            through career training, state and workforce funding pathways for eligible participants,
            Registered Apprenticeship, employer services, and practical business technology.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/programs"
              className="inline-flex min-h-12 items-center rounded-xl bg-brand-red-600 px-6 py-3 font-black text-white hover:bg-brand-red-700"
            >
              Explore Career Training
            </Link>
            <Link
              href="/check-eligibility"
              className="inline-flex min-h-12 items-center rounded-xl bg-white px-6 py-3 font-black text-slate-950 hover:bg-slate-100"
            >
              Check Funding Options
            </Link>
            <Link
              href="/employers"
              className="inline-flex min-h-12 items-center rounded-xl border-2 border-slate-200 px-6 py-3 font-black text-white hover:bg-slate-100 hover:text-slate-950"
            >
              Employers & Partners
            </Link>
            <Link
              href="/store/apps/website-builder"
              className="inline-flex min-h-12 items-center rounded-xl border-2 border-cyan-300 px-6 py-3 font-black text-cyan-100 hover:bg-cyan-50 hover:text-cyan-950"
            >
              Business & Website Builder
            </Link>
          </div>
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm font-bold text-slate-200">
            <span>Registered Apprenticeship</span>
            <span>Workforce training</span>
            <span>Employer partnerships</span>
            <span>Industry credentials</span>
            <span>Compliance & reporting</span>
          </div>
        </div>
      </div>
    </section>
  );
}
