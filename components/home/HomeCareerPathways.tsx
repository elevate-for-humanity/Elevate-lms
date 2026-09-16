/**
 * HomeCareerPathways — primary conversion pathways for first-time visitors.
 */

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

const PATHWAYS = [
  {
    slug: 'hvac-technician',
    title: 'HVAC Technician Training',
    description: 'Train in heating, cooling, safety, diagnostics, installation, and service.',
    image: '/images/hvac-hero.webp',
    imageAlt: 'HVAC technician inspecting a residential air-conditioning system',
    ctaHref: '/programs/hvac-technician',
    cta: 'Explore HVAC Training',
  },
  {
    slug: 'cdl-training',
    title: 'CDL Training',
    description: 'Prepare for commercial driving with permit, safety, and road training.',
    image: '/images/pages/cdl-loading-dock.webp',
    imageAlt: 'Commercial truck positioned at a loading dock for driver training',
    ctaHref: '/programs/cdl-training',
    cta: 'Explore CDL Training',
  },
  {
    slug: 'bookkeeping',
    title: 'Bookkeeping Training',
    description: 'Build practical bookkeeping, QuickBooks, payroll, and financial-record skills.',
    image: '/images/pages/bookkeeping.webp',
    imageAlt: 'Bookkeeping learner working with business financial records',
    ctaHref: '/programs/bookkeeping',
    cta: 'Explore Bookkeeping Training',
  },
  {
    slug: 'business',
    title: 'Business & Entrepreneurship',
    description: 'Build practical skills to start, organize, market, and grow a business.',
    image: '/images/pages/business-meeting.webp',
    imageAlt: 'Business and entrepreneurship team collaborating in a modern office',
    ctaHref: '/programs/business',
    cta: 'Explore Business Training',
  },
] as const;

export function HomeCareerPathways() {
  return (
    <section className="bg-white px-4 py-10 sm:py-12" aria-labelledby="featured-pathways-heading">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 max-w-3xl">
          <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.14em] text-brand-red-700">
            Workforce-funded career training
          </p>
          <h2
            id="featured-pathways-heading"
            className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl"
          >
            Training may be free for people who qualify.
          </h2>
          <p className="mt-4 text-lg leading-8 text-slate-700">
            HVAC, CDL, Bookkeeping, and Business training may be available at no cost when you qualify through WorkOne or another approved workforce funding source. Eligibility and written authorization are required before training begins.
          </p>
        </div>

        <div className="grid items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    loading="lazy"
                  />
                  <div className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide text-slate-950 shadow-sm">
                      Funding may cover tuition
                    </div>
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
