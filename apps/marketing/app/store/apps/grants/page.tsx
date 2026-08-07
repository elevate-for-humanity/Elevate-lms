import type { Metadata } from 'next';
import Link from 'next/link';
import { Search, Bell, FileText, CalendarDays, ArrowRight } from 'lucide-react';
import { IndividualAppPlansSection } from '@/components/store/IndividualAppPlansSection';
import { INDIVIDUAL_APP_CATALOG } from '@/lib/apps/individual-app-plans';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Grants Discovery & Management | Elevate Store',
  description:
    'Review grant opportunities, saved grants, and application records from one Elevate workspace. Start with a 14-day individual trial.',
  keywords: ['grant management', 'grant discovery', 'grant opportunities', 'grant applications', 'workforce grants'],
  alternates: { canonical: 'https://www.elevateforhumanity.org/store/apps/grants' },
  openGraph: {
    title: 'Grants Discovery & Management | Elevate Store',
    description: 'A workspace for reviewing grant opportunities and grant application activity.',
    url: 'https://www.elevateforhumanity.org/store/apps/grants',
    type: 'website',
  },
};

const features = [
  { icon: Search, title: 'Opportunity workspace', desc: 'Review open grant opportunity records loaded into the Elevate grants database.' },
  { icon: Bell, title: 'Deadline visibility', desc: 'Surface deadline information attached to available grant records.' },
  { icon: FileText, title: 'Application tracking', desc: 'Review grant application records and their current status from your account.' },
  { icon: CalendarDays, title: 'Saved-grant organization', desc: 'Keep saved opportunities visible alongside application activity.' },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Elevate Grants Discovery & Management',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  url: 'https://www.elevateforhumanity.org/store/apps/grants',
  description: 'Grant opportunity and application tracking workspace for organizations and individual users.',
  offers: [
    { '@type': 'Offer', price: '79', priceCurrency: 'USD', category: 'Starter monthly subscription' },
    { '@type': 'Offer', price: '199', priceCurrency: 'USD', category: 'Professional monthly subscription' },
    { '@type': 'Offer', price: '499', priceCurrency: 'USD', category: 'Enterprise monthly subscription' },
  ],
};

export default function GrantsStorePage() {
  const catalog = INDIVIDUAL_APP_CATALOG.grants;
  return (
    <main className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="border-b border-slate-200 bg-slate-950 px-4 py-20 text-white">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-bold uppercase tracking-widest text-brand-red-400">Funding tools</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-black md:text-6xl">Grants Discovery & Management</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
            Organize grant opportunities, saved records, deadlines, and application activity in one account-based workspace.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={catalog.trialHref} className="rounded-xl bg-brand-red-600 px-6 py-3 font-bold text-white hover:bg-brand-red-700">Start 14-day trial</Link>
            <Link href={catalog.appHref} className="rounded-xl border border-white/30 px-6 py-3 font-bold text-white hover:bg-white/10">Open Grants workspace</Link>
            <Link href="/store/apps" className="rounded-xl border border-white/30 px-6 py-3 font-bold text-white hover:bg-white/10">Search all apps</Link>
          </div>
        </div>
      </section>

      <section className="px-4 py-16">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <article key={feature.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <feature.icon className="h-7 w-7 text-brand-red-700" />
              <h2 className="mt-5 text-lg font-black text-slate-900">{feature.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{feature.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 px-4 py-12">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-black text-slate-900">Built around the records in your workspace</h2>
          <p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-600">
            Availability and completeness of grant opportunities depend on the data sources and records loaded into the platform. Elevate does not guarantee grant awards or funding outcomes.
          </p>
        </div>
      </section>

      <IndividualAppPlansSection catalog={catalog} />

      <section className="px-4 py-14 text-center">
        <Link href={catalog.trialHref} className="inline-flex items-center gap-2 font-bold text-brand-red-700 hover:underline">Start the Grants trial <ArrowRight className="h-4 w-4" /></Link>
      </section>
    </main>
  );
}
