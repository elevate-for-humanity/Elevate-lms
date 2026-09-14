/**
 * HomeCareerPathways — primary conversion pathways for first-time visitors.
 */

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

const PATHWAYS = [
  {
    slug: 'barber-apprenticeship',
    title: 'Barber Apprenticeship',
    description:
      'Train with professionals in a working barbershop while earning wages.',
    image: '/images/partners/kountry-kutz/interior-active.webp',
    imageAlt: 'Barbers and clients inside Kountry Kutz apprenticeship host shop',
    ctaHref: '/programs/barber-apprenticeship',
    badge: 'Featured Apprenticeship',
    cta: 'Explore Barber Apprenticeship',
  },
  {
    slug: 'beauty-apprenticeships',
    title: 'Cosmetology Apprenticeship',
    description:
      'Develop professional salon skills through structured instruction and supervised work.',
    image: '/images/partners/salon-saloon/team-studio.webp',
    imageAlt: 'Salon Saloon team in the cosmetology apprenticeship service area',
    ctaHref: '/programs/cosmetology-apprenticeship',
    badge: 'Featured Apprenticeship',
    cta: 'Explore Cosmetology Apprenticeship',
  },
  {
    slug: 'hvac-technician',
    title: 'HVAC Technician Training',
    description:
      'Train in heating, cooling, safety, diagnostics, installation, and service.',
    image: '/images/hvac-hero.webp',
    imageAlt: 'HVAC technician inspecting a residential air-conditioning system',
    ctaHref: '/programs/hvac-technician',
    badge: 'Skilled Trades',
    cta: 'Explore HVAC Training',
  },
  {
    slug: 'cdl-training',
    title: 'CDL Training',
    description:
      'Prepare for commercial driving with permit, safety, and road training.',
    image: '/images/pages/cdl-loading-dock.webp',
    imageAlt: 'Commercial truck positioned at a loading dock for driver training',
    ctaHref: '/programs/cdl-training',
    badge: 'Transportation',
    cta: 'Explore CDL Training',
  },
  {
    slug: 'business',
    title: 'Business & Entrepreneurship',
    description:
      'Build practical skills to start, organize, market, and grow a business.',
    image: '/images/pages/business-meeting.webp',
    imageAlt: 'Business and entrepreneurship team collaborating in a modern office',
    ctaHref: '/programs/business',
    badge: 'Business',
    cta: 'Explore Business Training',
  },
  {
    slug: 'host-shop',
    title: 'Host an Apprentice — Sign Up Free',
    description:
      'Train future talent while Elevate supports onboarding, records, and compliance.',
    image: '/images/partners/salon-saloon/team-sign.webp',
    imageAlt: 'Salon Saloon team at an Elevate participating Host Salon',
    ctaHref: '/partners/host-shops',
    badge: 'For Shop Owners',
    cta: 'See Host Shop Benefits & Sign Up',
  },
] as const;

export function HomeCareerPathways() {
  return (
    <section className="bg-white px-4 py-10 sm:py-12" aria-labelledby="featured-pathways-heading">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 max-w-3xl">
          <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.14em] text-brand-red-700">
            Apprenticeships first, then career training
          </p>
          <h2
            id="featured-pathways-heading"
            className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl"
          >
            Start with paid, work-based learning—or choose a skilled trade.
          </h2>
          <p className="mt-4 text-lg leading-8 text-slate-700">
            Featured apprenticeship pathways appear first, followed by skilled trades and other career programs.
          </p>
        </div>

        <div className="grid items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PATHWAYS.map((p) => (
            <article
              key={p.slug}
              className="group h-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-md ring-1 ring-black/[0.02] transition hover:-translate-y-1 hover:shadow-2xl"
            >
              <Link href={p.ctaHref} className="flex h-full flex-col">
                <div className="relative aspect-[4/3] overflow-hidden bg-white">
                  <Image
                    src={p.image}
                    alt={p.imageAlt}
                    fill
                    className="object-cover brightness-105 contrast-105 saturate-110 transition duration-500 group-hover:scale-[1.04] group-hover:brightness-110"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    loading="lazy"
                  />
                  {p.slug !== 'host-shop' && (
                    <div className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide text-slate-950 shadow-sm">
                      {p.badge}
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-6 sm:p-7">
                  <h3 className="text-2xl font-black leading-tight text-slate-950">{p.title}</h3>
                  <p className="mt-3 text-base leading-7 text-slate-700">{p.description}</p>
                  <span className="mt-auto inline-flex items-center gap-2 pt-5 text-base font-extrabold text-brand-red-700">
                    {p.cta}{' '}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            </article>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            href="/programs"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-red-600 px-8 py-4 text-base font-extrabold text-white transition hover:bg-brand-red-700"
          >
            View Every Program <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
