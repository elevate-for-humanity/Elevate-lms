import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import CommerceCatalogClient from '@/components/store/CommerceCatalogClient';
import { COMMERCE_CATALOG } from '@/lib/store/commerce-catalog';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Software, Apps & Add-Ons | Elevate Store',
  description:
    'Search Elevate software, Website Builder, AI assistants, LMS tools, testing, workforce, apprenticeship, government-contracting, grants, operations, and enterprise products.',
  keywords: [
    'workforce software',
    'website builder',
    'AI assistants',
    'LMS',
    'course builder',
    'testing center software',
    'apprenticeship software',
    'workforce development software',
    'SAM.gov manager',
    'grant management software',
  ],
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/store/apps',
  },
  openGraph: {
    title: 'Software, Apps & Add-Ons | Elevate Store',
    description:
      'Search the Elevate commerce catalog across platform plans, apps, AI, education, workforce, operations, and enterprise tools.',
    url: 'https://www.elevateforhumanity.org/store/apps',
    type: 'website',
  },
};

export default function AppsPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-4">
        <Breadcrumbs items={[{ label: 'Store', href: '/store' }, { label: 'Software & Apps' }]} />
      </div>

      <section className="border-y border-slate-200 bg-white px-4 py-14">
        <div className="mx-auto max-w-5xl text-center">
          <p className="mb-3 text-sm font-bold uppercase tracking-widest text-brand-red-700">Elevate Store</p>
          <h1 className="text-4xl font-black text-slate-900 md:text-5xl">Search the Full Platform Catalog</h1>
          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-600">
            Find platform plans, standalone apps, add-ons, AI tools, education technology, workforce modules,
            operations tools, and enterprise licensing from one authoritative catalog.
          </p>
        </div>
      </section>

      <section className="px-4 py-12">
        <div className="mx-auto max-w-7xl">
          <CommerceCatalogClient items={COMMERCE_CATALOG} />
        </div>
      </section>
    </main>
  );
}
