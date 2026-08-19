export const dynamic = 'force-static';

import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, CreditCard, Globe2, LockKeyhole, ShieldCheck, UsersRound } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Platform Licensing Guide',
  description:
    'How Elevate platform licensing, checkout, organization access, roles, domains, billing enforcement, and support work.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/store/guides/licensing' },
  robots: { index: true, follow: true },
};

const steps = [
  {
    icon: CreditCard,
    title: 'Choose the current Store offer',
    description:
      'Use the Store or the applicable license product page for current pricing, included features, billing terms, and checkout. This guide does not duplicate commercial terms that can change.',
  },
  {
    icon: ShieldCheck,
    title: 'Complete checkout and account setup',
    description:
      'Checkout and subscription state are handled through the platform payment workflow. Access is granted only through the entitlement and organization records created for the purchased product.',
  },
  {
    icon: UsersRound,
    title: 'Configure your organization and roles',
    description:
      'Authorized organization users receive role-based access. Admin, staff, instructor, learner, employer, Host Shop, workforce, and other protected surfaces remain subject to their server-side authorization rules.',
  },
  {
    icon: Globe2,
    title: 'Configure your platform address',
    description:
      'Supported products can use an Elevate-hosted address and, where the purchased plan includes it, a verified custom-domain workflow. Domain availability and verification are checked before use.',
  },
  {
    icon: LockKeyhole,
    title: 'Keep the subscription active',
    description:
      'Protected subscription features require a current entitlement. Expired trials and subscriptions that no longer qualify for access are blocked by the subscription gate while the underlying customer data is preserved according to the applicable product workflow.',
  },
];

const verifiedCapabilities = [
  'Role-based authentication and authorization for protected platform surfaces',
  'Stripe-backed checkout and subscription status handling for configured Store products',
  'Organization, tenant, membership, and entitlement records used to control access',
  'Trial-expiration enforcement for configured self-service applications',
  'Website Builder subscription enforcement for editor APIs and user-owned public hosting',
  'Custom-domain verification workflows where the purchased Website Builder plan includes them',
  'Health, deployment, audit, and integrity checks used by the production release process',
];

export default function LicensingGuidePage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="relative isolate overflow-hidden bg-slate-950">
        <div className="absolute inset-0">
          <Image
            src="/images/pages/store-guides-licensing-hero.jpg"
            alt="Platform licensing and organization administration"
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-35"
          />
        </div>
        <div className="relative mx-auto max-w-5xl px-6 py-20 sm:py-24">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-cyan-300">Store Guide</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight text-white sm:text-5xl">
            Platform licensing without hidden assumptions
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-200">
            Understand how licensing connects checkout, organization access, role permissions, domains, and subscription enforcement. Current prices and contractual terms remain on the applicable Store product page.
          </p>
        </div>
      </section>

      <div className="border-b bg-white">
        <div className="mx-auto max-w-5xl px-4 py-3">
          <Breadcrumbs items={[{ label: 'Store', href: '/store' }, { label: 'Guides', href: '/store/guides' }, { label: 'Licensing' }]} />
        </div>
      </div>

      <section className="px-4 py-14">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 text-blue-950">
            <h2 className="text-xl font-black">What a platform license means</h2>
            <p className="mt-2 leading-7">
              Platform purchases provide licensed access to systems operated by {PLATFORM_DEFAULTS.orgName}. Unless a separately executed agreement explicitly says otherwise, purchasing access does not transfer ownership of Elevate software, infrastructure, source code, trademarks, or other intellectual property.
            </p>
          </div>

          <div className="mt-12 grid gap-5 lg:grid-cols-2">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <article key={step.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Step {index + 1}</p>
                      <h2 className="mt-1 text-xl font-black text-slate-950">{step.title}</h2>
                      <p className="mt-2 text-sm font-medium leading-6 text-slate-700">{step.description}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 px-4 py-14">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl font-black text-slate-950">Capabilities this guide can verify from the platform</h2>
          <p className="mt-2 max-w-3xl text-slate-700">
            These statements describe implemented platform controls. They are not uptime guarantees, support-response guarantees, certification claims, or promises of participant outcomes.
          </p>
          <div className="mt-7 grid gap-3 md:grid-cols-2">
            {verifiedCapabilities.map((item) => (
              <div key={item} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-700" aria-hidden="true" />
                <p className="text-sm font-semibold leading-6 text-slate-800">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-14">
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 p-7">
            <h2 className="text-xl font-black text-slate-950">Self-service plans and products</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Use the Store as the current source for plan pricing, trial availability, included modules, add-ons, and checkout.
            </p>
            <Link href="/store#marketplace" className="mt-5 inline-flex items-center gap-2 font-black text-brand-blue-700 hover:underline">
              View current Store offers <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-200 p-7">
            <h2 className="text-xl font-black text-slate-950">Managed or enterprise licensing</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Enterprise scope, source-use rights, service commitments, implementation responsibilities, and any negotiated service levels must be stated in the applicable executed agreement rather than inferred from this public guide.
            </p>
            <Link href="/store/licenses" className="mt-5 inline-flex items-center gap-2 font-black text-brand-blue-700 hover:underline">
              Review licensing options <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-slate-950 px-4 py-14 text-white">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="text-2xl font-black">Verify the exact product before purchase</h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-300">
            Review the current Store offer and, for enterprise purchases, the executed agreement for the exact features, price, implementation scope, support terms, and service commitments that apply to your organization.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/store" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-6 py-3 font-black text-slate-950">
              Open Store
            </Link>
            <Link href="/contact" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/30 px-6 py-3 font-black text-white hover:bg-white/10">
              Contact Elevate
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
