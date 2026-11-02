import { IMAGE_LOADING_BLUR } from '@/lib/ui/blur-placeholder';
import Link from 'next/link';
import Image from 'next/image';
import ImageMetadata from '@/components/marketing/ImageMetadata';

const HOME_IMAGE = '/images/refresh-20261014/home-signed-20261017.webp';

export function PlatformHubHero({ compact = false }: { compact?: boolean }) {
  const Heading = compact ? 'h2' : 'h1';
  return (
    <section
      className="relative w-full overflow-hidden bg-slate-950 text-white"
      aria-labelledby="home-hero-heading"
      data-scroll-narration
      data-narration="Explore career training and apprenticeships with Elevate for Humanity. Choose a program, check your funding options, and apply."
      data-narration-style="instructor"
    >
      <ImageMetadata
        src={HOME_IMAGE}
        description="Illustrative Elevate workforce institute exterior with adult professionals at the entrance"
      />
      <div className={`${compact ? 'relative h-28 w-full overflow-hidden sm:h-36' : 'relative h-48 w-full overflow-hidden sm:h-64 lg:h-80'} bg-sky-100`}>
        <Image
          placeholder="blur"
          blurDataURL={IMAGE_LOADING_BLUR}
          src={HOME_IMAGE}
          alt="Illustrative Elevate workforce institute exterior with adult professionals at the entrance"
          fill
          priority={!compact}
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>
      <div className="relative mx-auto flex max-w-6xl items-center px-5 py-6 sm:px-8 sm:py-8">
        <div className="max-w-3xl">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-red-300">
            Career training & apprenticeships
          </p>
          <Heading
            id="home-hero-heading"
            className="mt-3 text-3xl font-black leading-[1.1] tracking-tight sm:text-3xl"
          >
            Train for your next career.
          </Heading>
          <p className="mt-4 max-w-3xl text-base font-medium leading-7 text-slate-100">
            Choose a career training program or apprenticeship. See what you’ll learn,
            review tuition and funding options, and apply when you’re ready.
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
              className="inline-flex min-h-12 items-center rounded-xl border border-slate-500 px-5 py-3 font-semibold text-slate-950 hover:bg-slate-50"
            >
              Check Funding Options
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
}
