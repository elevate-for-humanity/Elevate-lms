import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, TrendingUp, Shield, Building2, Users } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Guides & Resources | Elevate Store',
  description:
    'Practical guides for workforce development organizations — capital readiness, compliance, licensing, and funding navigation.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/store/guides',
  },
};

const GUIDES = [
  {
    id: 'capital-readiness',
    title: 'Capital Readiness Guide',
    subtitle: 'For Licensed & Workforce Organizations',
    description:
      'Most workforce organizations lose funding opportunities not because they lack programs, but because their documentation, governance, and audit trail are not ready when a funder asks. This guide walks through exactly what auditors and grant reviewers look for — and how to have it ready before they ask.',
    href: '/store/guides/capital-readiness',
    price: '$297',
    originalPrice: '$497',
    badge: 'Best Seller',
    badgeColor: 'bg-brand-blue-600',
    image: '/images/pages/admin-compliance-hero.jpg',
    imageAlt: 'Compliance audit dashboard showing documentation readiness',
    features: [
      '150+ page practical guide',
      'Audit preparation checklists',
      'Compliance documentation templates',
      'Funding source directory',
      'Case studies from funded organizations',
      'Lifetime updates included',
    ],
    cta: 'View Details',
    ctaHref: '/store/guides/capital-readiness',
    secondaryCta: 'Purchase Now',
    secondaryHref: '/store/guides/capital-readiness?buy=true',
  },
  {
    id: 'licensing',
    title: 'Platform Licensing Guide',
    subtitle: 'Understanding Your License',
    description:
      'A clear walkthrough of how the Elevate platform license works — what each tier includes, how provisioning works, what you own versus what you access, and how billing and enforcement operate. Included with every managed license at no extra cost.',
    href: '/store/guides/licensing',
    price: 'Included',
    originalPrice: null,
    badge: 'Included with License',
    badgeColor: 'bg-brand-green-600',
    image: '/images/pages/admin-analytics-hero.jpg',
    imageAlt: 'Platform analytics dashboard showing license usage and feature access',
    features: [
      'License tier comparison',
      'Feature availability matrix',
      'Compliance requirements by tier',
      'Upgrade and downgrade pathways',
      'Support options and SLA details',
      'Billing, enforcement, and data retention policy',
    ],
    cta: 'Download Guide',
    ctaHref: '/store/guides/licensing',
    secondaryCta: null,
    secondaryHref: null,
  },
];

const CATEGORIES = [
  { name: 'Funding & Grants', count: 3, icon: TrendingUp },
  { name: 'Compliance', count: 5, icon: Shield },
  { name: 'Operations', count: 4, icon: Building2 },
  { name: 'Training', count: 6, icon: Users },
];

export default function GuidesPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Store', href: '/store' }, { label: 'Guides' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative h-56 md:h-72 overflow-hidden">
        <Image
          src="/images/pages/store-guides-hero.jpg"
          alt="Workforce development guides and resources"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
      </section>

      {/* Headline — below the image */}
      <section className="pt-8 pb-4">
        <div className="max-w-6xl mx-auto px-6">
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-2">Guides &amp; Resources</h1>
          <p className="text-slate-600 text-base max-w-xl">
            Practical documentation for workforce organizations — written from the inside, not from a consulting firm.
          </p>
        </div>
      </section>

      {/* Category filter */}
      <section className="py-6 border-b">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-wrap gap-3 justify-center">
            <button className="px-4 py-2 bg-brand-blue-600 text-white rounded-full text-sm font-semibold">
              All Guides
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.name}
                className="px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-full text-sm font-medium hover:bg-slate-50 transition-colors flex items-center gap-2"
              >
                <cat.icon className="w-4 h-4" />
                {cat.name}
                <span className="text-slate-400">({cat.count})</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Guides */}
      <section className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="space-y-12">
            {GUIDES.map((guide, index) => (
              <div
                key={guide.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className={`grid lg:grid-cols-2 ${index % 2 === 1 ? 'lg:grid-flow-dense' : ''}`}>
                  {/* Image */}
                  <div className={`relative min-h-[280px] lg:min-h-[380px] ${index % 2 === 1 ? 'lg:col-start-2' : ''}`}>
                    <Image
                      src={guide.image}
                      alt={guide.imageAlt}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                    <div className="absolute top-4 left-4">
                      <span className={`inline-block px-3 py-1.5 rounded-full text-xs font-bold text-white ${guide.badgeColor}`}>
                        {guide.badge}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-8 lg:p-10 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between mb-4">
                        <p className="text-sm font-semibold text-brand-blue-600">{guide.subtitle}</p>
                        <div className="text-right">
                          <div className="text-2xl font-black text-brand-blue-600">{guide.price}</div>
                          {guide.originalPrice && (
                            <div className="text-sm text-slate-500 line-through">{guide.originalPrice}</div>
                          )}
                        </div>
                      </div>

                      <h2 className="text-2xl font-bold text-slate-900 mb-3">{guide.title}</h2>
                      <p className="text-slate-600 leading-relaxed mb-6">{guide.description}</p>

                      <div className="mb-8">
                        <h3 className="font-semibold text-slate-900 text-sm mb-3">What&apos;s included:</h3>
                        <ul className="grid sm:grid-cols-2 gap-2">
                          {guide.features.map((f) => (
                            <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                              <span className="w-1.5 h-1.5 rounded-full bg-brand-blue-500 mt-1.5 flex-shrink-0" />
                              {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Link
                        href={guide.ctaHref}
                        className="inline-flex items-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors text-sm"
                      >
                        {guide.cta} <ArrowRight className="w-4 h-4" />
                      </Link>
                      {guide.secondaryCta && guide.secondaryHref && (
                        <Link
                          href={guide.secondaryHref}
                          className="inline-flex items-center gap-2 border-2 border-brand-blue-600 text-brand-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-brand-blue-50 transition-colors text-sm"
                        >
                          {guide.secondaryCta}
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-blue-700">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Need Custom Training Materials?</h2>
          <p className="text-white mb-8">
            We develop custom guides and compliance documentation for enterprise clients and licensing partners.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-white text-brand-blue-700 px-8 py-4 rounded-lg font-bold hover:bg-brand-blue-50 transition-colors"
            >
              Contact Us
            </Link>
            <Link
              href="/store"
              className="inline-flex items-center gap-2 border-2 border-white/40 text-white px-8 py-4 rounded-lg font-bold hover:bg-white/10 transition-colors"
            >
              Back to Store
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
