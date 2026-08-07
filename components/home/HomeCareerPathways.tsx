/**
 * HomeCareerPathways — visual priority pathways.
 */

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

const PATHWAYS = [
  {
    slug: 'barber-apprenticeship',
    title: 'Barber Apprenticeship',
    description: 'Earn while you learn through structured on-the-job training and related technical instruction.',
    image: '/images/pages/barber-hero-main.webp',
    imageAlt: 'Barber apprenticeship training at a partner barbershop',
    ctaHref: '/programs/barber-apprenticeship',
    badge: 'Earn While You Learn',
  },
  {
    slug: 'host-shop',
    title: 'Become a Host Shop',
    description: 'Train apprentices at your licensed shop while Elevate supports onboarding, tracking, and compliance.',
    image: '/images/pages/shop-hero.webp',
    imageAlt: 'Barbershop and salon host shop partnership',
    ctaHref: '/partners/barber-host-shop',
    badge: 'For Shop Owners',
  },
  {
    slug: 'cdl-training',
    title: 'CDL Training',
    description: 'Prepare for commercial driving with permit support, safety instruction, and coordinated road training.',
    image: '/images/pages/cdl-hero.webp',
    imageAlt: 'Commercial driver training',
    ctaHref: '/programs/cdl-training',
    badge: 'Transportation',
  },
  {
    slug: 'hvac-technician',
    title: 'HVAC Training',
    description: 'Build hands-on skills in heating, cooling, refrigeration, safety, diagnostics, installation, and maintenance.',
    image: '/images/pages/hvac-technician.webp',
    imageAlt: 'HVAC technician training',
    ctaHref: '/programs/hvac-technician',
    badge: 'Skilled Trades',
  },
  {
    slug: 'business',
    title: 'Business & Career Advancement',
    description: 'Build practical skills for business launch, operations, budgeting, branding, marketing, and career growth.',
    image: '/images/business/office-admin.webp',
    imageAlt: 'Business and entrepreneurship training',
    ctaHref: '/programs/business',
    badge: 'Business',
  },
] as const;

export function HomeCareerPathways() {
  return (
    <section className="bg-white px-4 py-16 sm:py-20" aria-labelledby="featured-pathways-heading">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 max-w-3xl">
          <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.14em] text-brand-red-700">
            Career Pathways
          </p>
          <h2 id="featured-pathways-heading" className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            See yourself in the next step.
          </h2>
          <p className="mt-4 text-lg leading-8 text-slate-700">
            Explore hands-on training, apprenticeships, and career pathways designed around real work and industry credentials.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PATHWAYS.map((p, index) => (
            <article
              key={p.slug}
              className={`group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${index < 2 ? 'lg:col-span-1' : ''}`}
            >
              <Link href={p.ctaHref} className="block">
                <div className="relative h-56 overflow-hidden bg-slate-100 sm:h-64">
                  <Image
                    src={p.image}
                    alt={p.imageAlt}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    loading="lazy"
                  />
                  <div className="absolute left-4 top-4 rounded-full bg-slate-950/85 px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide text-white backdrop-blur-sm">
                    {p.badge}
                  </div>
                </div>
                <div className="p-6 sm:p-7">
                  <h3 className="text-2xl font-black leading-tight text-slate-950">{p.title}</h3>
                  <p className="mt-3 text-base leading-7 text-slate-700">{p.description}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-base font-extrabold text-brand-red-700">
                    Explore pathway <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
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
            Explore All Programs <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
