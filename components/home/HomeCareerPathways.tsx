/**
 * HomeCareerPathways — 5 priority homepage pathways
 *
 * Barber Apprenticeship → Host Shop → CDL → HVAC → Business
 */

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

const PATHWAYS = [
  {
    slug: 'barber-apprenticeship',
    label: 'Earn While You Learn',
    title: 'Barber Apprenticeship',
    description:
      'Earn while you learn through a structured barber apprenticeship combining paid on-the-job learning, related technical instruction, competency tracking, and state-required training hours.',
    bestFor: 'Future barbers seeking a work-based pathway',
    image: '/images/pages/barber-hero-main.webp',
    imageAlt: 'Barber apprenticeship — paid training at partner barbershops',
    cta: 'Apply for Barber Apprenticeship',
    ctaHref: '/programs/barber-apprenticeship',
    badge: 'Earn While You Learn',
    badgeColor: 'bg-brand-green-700',
  },
  {
    slug: 'host-shop',
    label: 'For Shop Owners',
    title: 'Become a Host Shop',
    description:
      'Partner with Elevate to train barber, beauty, cosmetology, esthetics, or nail apprentices at your business. Elevate supports onboarding, hour tracking, competency documentation, and apprenticeship compliance.',
    bestFor: 'Licensed shop owners and participating employers',
    image: '/images/pages/shop-hero.webp',
    imageAlt: 'Host shop partnership — train apprentices at your barbershop or salon',
    cta: 'Become a Host Shop',
    ctaHref: '/host-shop',
    badge: 'For Shop Owners',
    badgeColor: 'bg-purple-700',
  },
  {
    slug: 'cdl-training',
    label: 'High-Demand Career',
    title: 'CDL Training',
    description:
      'Prepare for commercial driving opportunities through structured classroom preparation, permit support, safety instruction, and coordinated behind-the-wheel training.',
    bestFor: 'Individuals pursuing transportation careers',
    image: '/images/pages/cdl-hero.webp',
    imageAlt: 'CDL training — commercial driving career preparation',
    cta: 'Explore CDL Training',
    ctaHref: '/programs/cdl-training',
    badge: 'High-Demand Career',
    badgeColor: 'bg-emerald-700',
  },
  {
    slug: 'hvac-technician',
    label: 'Skilled Trades',
    title: 'HVAC Training',
    description:
      'Build foundational skills in heating, ventilation, air conditioning, refrigeration, workplace safety, tools, diagnostics, installation, and maintenance.',
    bestFor: 'Individuals pursuing skilled-trades careers',
    image: '/images/pages/hvac-technician.webp',
    imageAlt: 'HVAC technician training — heating, ventilation, and air conditioning',
    cta: 'Explore HVAC Training',
    ctaHref: '/programs/hvac-technician',
    badge: 'Skilled Trades',
    badgeColor: 'bg-amber-700',
  },
  {
    slug: 'business',
    label: 'Start or Grow a Business',
    title: 'Business Start-Up & Career Advancement',
    description:
      'Learn how to plan, launch, operate, and grow a business. Training may include business formation, budgeting, branding, marketing, digital tools, compliance, and workforce credentials.',
    bestFor: 'Entrepreneurs, contractors, and career changers',
    image: '/images/business/office-admin.webp',
    imageAlt: 'Business training — entrepreneurship and career advancement',
    cta: 'Explore Business Training',
    ctaHref: '/programs/business',
    badge: 'Start or Grow a Business',
    badgeColor: 'bg-slate-700',
  },
] as const;

export function HomeCareerPathways() {
  return (
    <section className="bg-white py-16 px-4" aria-labelledby="featured-pathways-heading">
      <div className="max-w-6xl mx-auto">
        {/* Heading */}
        <div className="mb-8 text-center">
          <p className="text-brand-red-600 text-xs font-bold uppercase tracking-widest mb-2">
            Featured Career Pathways
          </p>
          <h2
            id="featured-pathways-heading"
            className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3"
          >
            Choose your pathway
          </h2>
          <p className="text-slate-500 text-sm max-w-xl mx-auto">
            A training or apprenticeship pathway designed to lead to a credential,
            employment, business ownership, or workforce advancement.
          </p>
        </div>

        {/* Pathway cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-8">
          {PATHWAYS.map((p) => (
            <article
              key={p.slug}
              className="group flex flex-col rounded-2xl overflow-hidden bg-white border border-slate-200 hover:border-brand-red-300 hover:shadow-lg transition-all hover:-translate-y-0.5"
            >
              {/* Image */}
              <div className="relative h-36 overflow-hidden bg-slate-100">
                <Image
                  src={p.image}
                  alt={p.imageAlt}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw"
                  loading="lazy"
                />
                <div className="absolute top-3 left-3">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-white ${p.badgeColor}`}>
                    {p.badge}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="flex flex-col flex-1 p-4 gap-2">
                <h3 className="font-extrabold text-slate-900 text-sm leading-snug">
                  {p.title}
                </h3>

                <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-3 flex-1">
                  {p.description}
                </p>

                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                  Best for: {p.bestFor}
                </p>

                <div className="mt-auto pt-2 flex flex-col gap-2">
                  <Link
                    href={p.ctaHref}
                    className="w-full text-center py-2.5 rounded-xl bg-brand-red-600 hover:bg-brand-red-700 text-white text-sm font-bold transition-colors"
                  >
                    {p.cta}
                  </Link>
                  <Link
                    href={p.ctaHref}
                    className="w-full text-center py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-700 text-xs font-semibold transition-colors"
                  >
                    View Details <ArrowRight className="inline w-3 h-3 ml-1" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* View All Programs */}
        <div className="text-center">
          <Link
            href="/programs"
            className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-3 rounded-xl transition-colors text-sm"
          >
            View All Programs <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
