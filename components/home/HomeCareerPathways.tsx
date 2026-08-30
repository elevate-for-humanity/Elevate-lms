/**
 * HomeCareerPathways — primary conversion pathways for first-time visitors.
 */

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

const PATHWAYS = [
  {
    slug: 'business',
    title: 'Business & Entrepreneurship',
    description:
      'Learn how to start, organize, market, and grow a business while building practical career and office skills you can use right away.',
    image: '/images/pages/business-meeting.webp',
    imageAlt: 'Business and entrepreneurship team collaborating in a modern office',
    ctaHref: '/programs/business',
    badge: 'Business',
    cta: 'Explore Business Training',
  },
  {
    slug: 'hvac-technician',
    title: 'HVAC Technician Training',
    description:
      'Train for hands-on work with heating and cooling systems, safety, diagnostics, installation, maintenance, and service calls.',
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
      'Prepare for commercial driving with permit preparation, safety instruction, and coordinated behind-the-wheel training.',
    image: '/images/pages/cdl-cab-interior.webp',
    imageAlt: 'Commercial driver training inside a truck cab',
    ctaHref: '/programs/cdl-training',
    badge: 'Transportation',
    cta: 'Explore CDL Training',
  },
  {
    slug: 'barber-apprenticeship',
    title: 'Barber Apprenticeship',
    description:
      'Learn in a real barbershop, build your skills with experienced professionals, and earn wages while completing your apprenticeship pathway.',
    image: '/images/pages/barber-hero-main.webp',
    imageAlt: 'Barber apprentice serving a client in a working barbershop',
    ctaHref: '/programs/barber-apprenticeship',
    badge: 'Earn While You Learn',
    cta: 'Explore Barber Apprenticeship',
  },
  {
    slug: 'beauty-apprenticeships',
    title: 'Beauty Apprenticeships',
    description:
      'Turn your interest in hair, skin, nails, and client service into supervised workplace training in the beauty industry.',
    image: '/images/pages/cosmetology-apprenticeship-hero.webp',
    imageAlt: 'Beauty professional working with a client in a salon',
    ctaHref: '/barber-and-beauty-apprenticeships',
    badge: 'Beauty Industry',
    cta: 'Explore Beauty Apprenticeships',
  },
  {
    slug: 'host-shop',
    title: 'Host an Apprentice — Sign Up Free',
    description:
      'Grow your salon, barbershop, spa, or nail business with an apprentice while Elevate supports onboarding, training records, and program administration. There is no cost for a business to apply or enroll as a Host Shop.',
    image: '/images/partners/salon-saloon/team-sign.webp',
    imageAlt: 'Salon Saloon team at an Elevate participating Host Salon',
    ctaHref: '/partners/host-shops',
    badge: 'For Shop Owners',
    cta: 'See Host Shop Benefits & Sign Up',
  },
] as const;

export function HomeCareerPathways() {
  return (
    <section className="bg-white px-4 py-16 sm:py-20" aria-labelledby="featured-pathways-heading">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 max-w-3xl">
          <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.14em] text-brand-red-700">
            Start With a Career Path
          </p>
          <h2 id="featured-pathways-heading" className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Choose where you want to go next.
          </h2>
          <p className="mt-4 text-lg leading-8 text-slate-700">
            Elevate connects career training, apprenticeships, funding guidance, and employer-based learning. Pick a pathway below to see what the experience looks like and how to get started.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PATHWAYS.map((p) => (
            <article key={p.slug} className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-md ring-1 ring-black/[0.02] transition hover:-translate-y-1 hover:shadow-2xl">
              <Link href={p.ctaHref} className="block h-full">
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
                <div className="p-6 sm:p-7">
                  <h3 className="text-2xl font-black leading-tight text-slate-950">{p.title}</h3>
                  <p className="mt-3 text-base leading-7 text-slate-700">{p.description}</p>
                  {p.slug === 'host-shop' && (
                    <ul className="mt-4 space-y-2 text-sm font-semibold leading-6 text-slate-800">
                      <li>• Build and train your future workforce</li>
                      <li>• Earn revenue from supervised client services</li>
                      <li>• Get help with apprenticeship records and compliance</li>
                      <li>• Explore available workforce rebates and tax-credit eligibility</li>
                    </ul>
                  )}
                  <span className="mt-5 inline-flex items-center gap-2 text-base font-extrabold text-brand-red-700">
                    {p.cta} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            </article>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Link href="/programs" className="inline-flex items-center gap-2 rounded-xl bg-brand-red-600 px-8 py-4 text-base font-extrabold text-white transition hover:bg-brand-red-700">
            View Every Program <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
