import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowRight } from 'lucide-react';
import { hero as heroTokens } from '@/lib/page-design-tokens';
import { RAPIDS_CONFIG } from '@/lib/compliance/rapids-config';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import FeaturedHostPartners from '@/components/programs/beauty/FeaturedHostPartners';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Beauty Apprenticeships',
  description:
    'DOL-registered barber, cosmetology, nail, and esthetician apprenticeships in Indiana. Host shop partnerships and earn-while-you-learn pathways.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/beauty-apprenticeships' },
};

const PROGRAMS = [
  {
    title: 'Barber apprenticeship',
    href: '/programs/barber-apprenticeship',
    hostHref: '/programs/barber-apprenticeship/host-shops',
    applyHostHref: '/partners/barber-host-shop/apply',
    image: '/images/pages/barber-apprenticeship-hero.jpg',
  },
  {
    title: 'Cosmetology apprenticeship',
    href: '/programs/cosmetology-apprenticeship',
    hostHref: '/programs/cosmetology-apprenticeship/host-shops',
    applyHostHref: '/partners/cosmetology-host-shop/apply',
    image: '/images/pages/cosmetology-apprenticeship-hero.webp',
  },
  {
    title: 'Nail technician apprenticeship',
    href: '/programs/nail-technician-apprenticeship',
    hostHref: '/programs/nail-technician-apprenticeship/host-shops',
    applyHostHref: '/partners/nail-technician-apprenticeship/apply',
    image: '/images/pages/nail-tech-hero.webp',
  },
  {
    title: 'Esthetician apprenticeship',
    href: '/programs/esthetician-apprenticeship',
    hostHref: '/programs/esthetician-apprenticeship/host-shops',
    applyHostHref: '/partners/esthetician-apprenticeship/apply',
    image: '/images/beauty/esthetician.webp',
  },
] as const;

export default function BeautyApprenticeshipsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs
            items={[
              { label: 'Programs', href: '/programs' },
              { label: 'Beauty apprenticeships' },
            ]}
          />
        </div>
      </div>

      <section className={heroTokens.imageWrap}>
        <Image
          src="/images/pages/cosmetology-apprenticeship-hero.webp"
          alt="Cosmetology and beauty apprenticeship training"
          fill
          className="object-cover object-center"
          priority
          sizes={heroTokens.imageSizes}
          placeholder="empty"
        />
      </section>

      <section className="border-b border-slate-100 py-10 sm:py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <p className="text-brand-red-600 text-xs font-bold uppercase tracking-widest mb-2">
            RAPIDS {RAPIDS_CONFIG.programNumber} · Indiana
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
            Beauty &amp; Personal Services Apprenticeships
          </h1>
          <p className="text-slate-600 text-lg leading-relaxed max-w-2xl mb-6">
            {PLATFORM_DEFAULTS.orgName} coordinates DOL-registered apprenticeships for barbering,
            cosmetology, nail technology, and esthetics. Apprentices earn on the job at approved host
            shops while completing related technical instruction.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/host-shop/apply"
              className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-6 py-2.5 rounded-lg text-sm"
            >
              Apply as a host shop
            </Link>
            <Link
              href="/apply?program=barber-apprenticeship"
              className="border border-slate-300 text-slate-800 font-bold px-6 py-2.5 rounded-lg text-sm hover:bg-slate-50"
            >
              Apply as an apprentice
            </Link>
          </div>
        </div>
      </section>

      <section className="py-14 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-extrabold text-slate-900 text-center mb-10">Programs</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {PROGRAMS.map((p) => (
              <article
                key={p.title}
                className="rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="relative h-40 w-full">
                  <Image src={p.image} alt={p.title} fill className="object-cover" sizes="50vw" />
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-slate-900 mb-2">{p.title}</h3>
                  <div className="flex flex-col gap-2 text-sm">
                    <Link href={p.href} className="font-semibold text-brand-blue-600 hover:underline">
                      Program details <ArrowRight className="inline w-3 h-3" />
                    </Link>
                    <Link href={p.hostHref} className="text-slate-600 hover:text-slate-900">
                      Host shop information
                    </Link>
                    <Link href={p.applyHostHref} className="text-brand-red-600 font-bold hover:underline">
                      Host shop application
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <FeaturedHostPartners />

      <section className="py-12 px-4 sm:px-6 border-t border-slate-100">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-slate-600 text-sm mb-4">
            Licenses are issued by the Indiana Professional Licensing Agency (or applicable state
            board), not by {PLATFORM_DEFAULTS.orgName}.
          </p>
          <Link href="/legal-entity-structure" className="text-brand-blue-600 font-bold text-sm hover:underline">
            View legal entity structure →
          </Link>
        </div>
      </section>
    </div>
  );
}
