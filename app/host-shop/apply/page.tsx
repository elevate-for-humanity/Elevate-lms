import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowRight, FileText, Shield } from 'lucide-react';
import { hero as heroTokens } from '@/lib/page-design-tokens';
import { RAPIDS_CONFIG } from '@/lib/compliance/rapids-config';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Host Shop Application',
  description:
    'Apply to become a DOL-registered apprenticeship host shop with Elevate for Humanity. Barber, cosmetology, nail, and esthetician pathways.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/host-shop/apply' },
};

const OCCUPATIONS = [
  {
    title: 'Barber host shop',
    description: 'Barbershop or institute hosting barber apprentices. EIN, shop license, supervisor barber license, insurance, and MOU required.',
    applyHref: '/partners/barber-host-shop/apply',
    infoHref: '/programs/barber-apprenticeship/host-shops',
  },
  {
    title: 'Cosmetology host salon',
    description: 'Salon hosting cosmetology apprentices under USDOL registered apprenticeship.',
    applyHref: '/partners/cosmetology-host-shop/apply',
    infoHref: '/programs/cosmetology-apprenticeship/host-shops',
  },
  {
    title: 'Nail technician host salon',
    description: 'Nail salon hosting nail technician apprentices (Indiana IPLA-aligned pathway).',
    applyHref: '/partners/nail-technician-apprenticeship/apply',
    infoHref: '/programs/nail-technician-apprenticeship/host-shops',
  },
  {
    title: 'Esthetician host spa/salon',
    description: 'Spa or salon hosting esthetician apprentices.',
    applyHref: '/partners/esthetician-apprenticeship/apply',
    infoHref: '/programs/esthetician-apprenticeship/host-shops',
  },
] as const;

const REQUIRED_DOCS = [
  'Business legal name and EIN',
  'Shop address and Indiana facility license (where applicable)',
  'Supervisor name and professional license number',
  'Certificate of insurance (COI) with sponsor as certificate holder',
  'Signed host shop MOU after application review',
];

export default function HostShopApplyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs
            items={[
              { label: 'Employers', href: '/employers' },
              { label: 'Host shop application' },
            ]}
          />
        </div>
      </div>

      <section className={heroTokens.imageWrap} aria-label="Host shop application hero">
        <Image
          src="/images/pages/barber-apprenticeship-hero.jpg"
          alt="Professional barbershop training environment"
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
            DOL Registered Sponsor · RAPIDS {RAPIDS_CONFIG.programNumber}
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
            Host Shop Application
          </h1>
          <p className="text-slate-600 text-lg leading-relaxed max-w-2xl mb-6">
            {PLATFORM_DEFAULTS.orgName} sponsors registered apprenticeships in Indiana. Select your
            occupation below to start the correct application — each trade has its own compliance
            checklist and MOU.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/beauty-apprenticeships"
              className="text-sm font-bold text-brand-blue-600 hover:underline"
            >
              Beauty apprenticeship overview
            </Link>
            <span className="text-slate-300">|</span>
            <Link
              href="/legal-entity-structure"
              className="text-sm font-bold text-brand-blue-600 hover:underline"
            >
              Legal entity structure
            </Link>
          </div>
        </div>
      </section>

      <section className="py-12 px-4 sm:px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Choose your occupation</h2>
          <p className="text-slate-600 text-sm mb-8">
            Applications are reviewed in order received. Approved shops are registered as RAPIDS
            worksites after MOU and insurance verification.
          </p>
          <div className="grid sm:grid-cols-2 gap-5">
            {OCCUPATIONS.map((occ) => (
              <div
                key={occ.title}
                className="border border-slate-200 rounded-2xl p-5 flex flex-col hover:border-brand-red-200 hover:shadow-sm transition-all"
              >
                <h3 className="font-bold text-slate-900 mb-2">{occ.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed flex-1 mb-4">{occ.description}</p>
                <div className="flex flex-col gap-2">
                  <Link
                    href={occ.applyHref}
                    className="inline-flex items-center justify-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-4 py-2.5 rounded-lg text-sm"
                  >
                    Start application <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href={occ.infoHref}
                    className="text-center text-sm font-semibold text-brand-blue-600 hover:underline"
                  >
                    Program & host shop requirements
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 px-4 sm:px-6 bg-slate-50 border-t border-slate-100">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-brand-red-600" />
              <h2 className="text-xl font-extrabold text-slate-900">What you will need</h2>
            </div>
            <ul className="space-y-2">
              {REQUIRED_DOCS.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-red-500 mt-2 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-brand-red-600" />
              <h2 className="text-xl font-extrabold text-slate-900">Sponsor verification</h2>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mb-3">
              Sponsor of record: <strong>{RAPIDS_CONFIG.sponsorOfRecord}</strong>
              <br />
              Program brand: <strong>{RAPIDS_CONFIG.programBrand}</strong>
              <br />
              RAPIDS: <strong>{RAPIDS_CONFIG.programNumber}</strong>
            </p>
            <Link
              href="/compliance/apprenticeship-structure"
              className="text-sm font-bold text-brand-blue-600 hover:underline"
            >
              Apprenticeship compliance documentation →
            </Link>
          </div>
        </div>
      </section>

      <section className="py-14 px-4 sm:px-6 bg-slate-900 text-center">
        <h2 className="text-2xl font-extrabold text-white mb-4">Not sure which application?</h2>
        <p className="text-slate-300 text-sm mb-6 max-w-lg mx-auto">
          Contact us with your shop type and we will send the correct checklist.
        </p>
        <Link
          href="/contact?topic=host-shop"
          className="inline-block bg-white text-slate-900 font-bold px-8 py-3 rounded-lg text-sm hover:bg-slate-100"
        >
          Contact admissions
        </Link>
      </section>
    </div>
  );
}
