export const dynamic = 'force-static';

import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { PlansPageClient } from './PlansPageClient';

export const metadata: Metadata = {
  title: 'Plans & Add-Ons | Elevate Store',
  description:
    'Solo, Business, and Professional plans from $29/month. Add LMS, workforce, apprenticeship, and AI modules à la carte.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/store/plans' },
};

export default async function StorePlansPage({
  searchParams,
}: {
  searchParams: Promise<{ vertical?: string }>;
}) {
  const params = await searchParams;
  const vertical = params.vertical;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs
          items={[
            { label: 'Store', href: '/store' },
            { label: 'Plans & Add-Ons' },
          ]}
        />
      </div>

      <section className="py-12 px-4 text-center border-b border-slate-200">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Simple plans. Powerful add-ons.</h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-6">
          One entry point for barbers, spas, and training providers. Subscribe to a base plan, then
          turn on only the modules you need.
        </p>
        <Link
          href="/store/trial"
          className="text-brand-blue-600 font-semibold hover:underline"
        >
          Prefer a 14-day org trial first? Start here →
        </Link>
      </section>

      <PlansPageClient vertical={vertical} />
    </div>
  );
}
