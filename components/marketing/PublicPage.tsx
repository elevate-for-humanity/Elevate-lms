import Image from 'next/image';
import Link from 'next/link';
import { Breadcrumbs, BreadcrumbItem } from '@/components/ui/Breadcrumbs';
import { ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface CtaConfig {
  title: string;
  description: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
}

export interface PublicPageConfig {
  breadcrumbs: BreadcrumbItem[];
  heroImage: {
    src: string;
    alt: string;
  };
  heroHeight?: string; // e.g. 'h-[300px] sm:h-[380px]' — defaults to standard
  cta?: CtaConfig;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function PublicPage({
  config,
  children,
}: {
  config: PublicPageConfig;
  children: ReactNode;
}) {
  const heroHeight = config.heroHeight || 'h-[240px] sm:h-[320px] md:h-[400px]';

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Breadcrumbs items={config.breadcrumbs} />
        </div>
      </div>

      {/* Hero Image — no text overlay */}
      <section className={`relative ${heroHeight} overflow-hidden`}>
        <Image
          src={config.heroImage.src}
          alt={config.heroImage.alt}
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
      </section>

      {/* Page Content — rendered by the consuming page */}
      {children}

      {/* CTA */}
      {config.cta && (
        <section className="py-16 sm:py-24 bg-slate-900">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              {config.cta.title}
            </h2>
            <p className="text-xl text-slate-300 mb-10">
              {config.cta.description}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={config.cta.primaryHref}
                className="inline-flex items-center justify-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white px-10 py-5 rounded-full font-bold text-xl transition hover:scale-105 shadow-lg"
              >
                {config.cta.primaryLabel}
                <ArrowRight className="w-5 h-5" />
              </Link>
              {config.cta.secondaryLabel && config.cta.secondaryHref && (
                <Link
                  href={config.cta.secondaryHref}
                  className="inline-flex items-center justify-center gap-2 border-2 border-slate-500 text-white px-10 py-5 rounded-full font-bold text-xl transition hover:border-white"
                >
                  {config.cta.secondaryLabel}
                  <ArrowRight className="w-5 h-5" />
                </Link>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
