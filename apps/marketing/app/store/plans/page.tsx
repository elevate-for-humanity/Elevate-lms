export const dynamic = 'force-static';

import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { PlansPageClient } from './PlansPageClient';

export const metadata: Metadata = {
  title: 'Plans & Add-Ons',
  description:
    'Solo, Business, and Professional plans from $29/month. Add AI assistants, LMS, course building, workforce, apprenticeship, testing, and business modules à la carte.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/store/plans' },
};

export default async function StorePlansPage({
  searchParams,
}: {
  searchParams: Promise<{ vertical?: string; addon?: string }>;
}) {
  const params = await searchParams;
  const vertical = params.vertical;
  const initialAddon = typeof params.addon === 'string' ? params.addon : undefined;

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
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Start simple. Add power as you grow.</h1>
        <p className="text-lg text-slate-600 max-w-3xl mx-auto mb-6">
          Begin with a base plan, then add specialized AI assistants, Website Builder capacity, LMS, Course Builder, workforce, apprenticeship, employer and testing tools as your organization needs them.
        </p>
        <Link href="/store/trial" className="text-brand-blue-600 font-semibold hover:underline">
          Prefer a 14-day organization trial first? Start here →
        </Link>
      </section>

      <PlansPageClient vertical={vertical} initialAddon={initialAddon} />
    </div>
  );
}
