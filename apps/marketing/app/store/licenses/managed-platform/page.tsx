import Link from 'next/link';
import { Check, Shield, Headphones, ArrowRight } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { LicenseDemo } from '@/components/store/LicenseDemo';

export const dynamic = 'force-static';

export const metadata = {
  title: 'Managed Platform | Elevate Store',
  description: 'Managed workforce LMS licensing with onboarding, hosting, support, and organization-specific configuration.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/store/licenses/managed-platform' },
};

const managedPlans = [
  {
    name: 'Growth',
    monthly: '$1,500/month',
    setup: '$7,500 setup',
    description: 'For training providers establishing or expanding a managed workforce platform.',
    features: ['Managed hosting', 'Organization branding', 'LMS and enrollment workflows', 'Admin workspace', 'Standard support'],
  },
  {
    name: 'Professional',
    monthly: '$2,500/month',
    setup: '$10,000 setup',
    description: 'For established providers that need workforce, employer, and compliance workflows.',
    features: ['Everything in Growth', 'Workforce tools', 'Employer portal', 'Compliance workflows', 'Priority onboarding'],
  },
  {
    name: 'Enterprise',
    monthly: 'Custom agreement',
    setup: 'Scoped during discovery',
    description: 'For agencies and multi-location organizations requiring integrations or custom implementation.',
    features: ['Custom implementation scope', 'Multi-location configuration', 'Integration planning', 'Dedicated onboarding', 'Support agreement'],
  },
];

export default function ManagedPlatformPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-4">
        <Breadcrumbs items={[{ label: 'Store', href: '/store' }, { label: 'Managed Platform' }]} />
      </div>

      <section className="border-y border-slate-200 bg-slate-950 px-4 py-20 text-white">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold">
            <Shield className="h-4 w-4" /> Managed Platform Licensing
          </div>
          <h1 className="text-4xl font-black sm:text-5xl">Your organization. Your workflows. Managed infrastructure.</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-300">
            Managed subscriptions include platform access, hosting, configuration, and support. They are separate from one-time source-use or code licenses.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/store/trial" className="rounded-xl bg-brand-red-600 px-7 py-3.5 font-bold text-white hover:bg-brand-red-700">Start 14-Day Trial</Link>
            <Link href="/contact?subject=Managed%20Platform%20Licensing" className="rounded-xl border border-white/30 px-7 py-3.5 font-bold text-white hover:bg-white/10">Talk to Licensing</Link>
          </div>
        </div>
      </section>

      <section className="px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 lg:grid-cols-3">
            {managedPlans.map((plan) => (
              <article key={plan.name} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
                <h2 className="text-2xl font-black text-slate-950">{plan.name}</h2>
                <p className="mt-1 text-xl font-bold text-brand-red-700">{plan.monthly}</p>
                <p className="text-sm font-semibold text-slate-500">{plan.setup}</p>
                <p className="mt-4 text-sm leading-6 text-slate-600">{plan.description}</p>
                <ul className="mt-6 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2 text-sm text-slate-700"><Check className="mt-0.5 h-4 w-4 flex-none text-green-600" />{feature}</li>
                  ))}
                </ul>
                <Link href={`/contact?subject=${encodeURIComponent(`Managed Platform - ${plan.name}`)}`} className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 font-bold text-white hover:bg-slate-800">
                  Request Agreement <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-slate-500">
            Managed Platform pricing is not processed through the one-time source-license checkout. Final scope and recurring billing are confirmed in the managed-services agreement.
          </p>
        </div>
      </section>

      <LicenseDemo
        tourId="institution_admin"
        licenseName="Managed Platform"
        workflows={[
          'Configure organization branding',
          'Create and manage programs',
          'Enroll learners',
          'Review compliance workflows',
          'Invite employer partners',
        ]}
        ctaHref="/store/trial"
        ctaLabel="Start 14-Day Trial"
      />

      <section className="bg-slate-50 px-4 py-14">
        <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-8">
          <div className="flex items-start gap-3">
            <Headphones className="mt-1 h-6 w-6 flex-none text-brand-red-600" />
            <div>
              <h2 className="text-xl font-black text-slate-950">Need a source-use license instead?</h2>
              <p className="mt-2 text-slate-600">Source-use licensing and managed subscriptions are different products. Review them separately before purchasing.</p>
              <Link href="/store/licenses" className="mt-4 inline-flex font-bold text-brand-red-700 hover:underline">View licensing options →</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
