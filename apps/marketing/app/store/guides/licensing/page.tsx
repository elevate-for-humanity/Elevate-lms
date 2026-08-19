export const dynamic = 'force-static';

import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Platform Licensing Guide',
  description: 'How Elevate platform licensing, provisioning, access, billing, domains, support, and contract-scoped service terms work.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/store/guides/licensing' },
};

const steps = [
  ['Choose the operating model', 'Select managed platform access or discuss a contract-scoped enterprise arrangement based on your organization’s actual requirements.'],
  ['Complete the applicable agreement', 'Checkout and contract flows identify the organization, billing responsibility, licensed scope, and accepted terms.'],
  ['Provision the organization workspace', 'Approved subscriptions create or activate the organization workspace and administrator access through the canonical tenant workflow.'],
  ['Assign roles', 'Administrators grant only the roles required for staff, instructors, partners, and other authorized users.'],
  ['Configure programs and content', 'Use the Course Builder, approved templates, imports, and organization content according to the licensed feature set.'],
  ['Configure domains', 'Use the provided platform domain or connect an approved custom domain through the supported DNS and TLS workflow.'],
  ['Maintain an active subscription', 'Entitlements are enforced server-side from the applicable subscription and contract state.'],
  ['Use documented support and service terms', 'Support channels, retention, capacity, availability commitments, and response targets are governed by the purchased plan or signed agreement—not unsupported website guarantees.'],
] as const;

export default function LicensingGuidePage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="relative min-h-[300px] overflow-hidden bg-slate-950">
        <Image src="/images/pages/store-guides-hero.webp" alt="Platform licensing and organization setup" fill priority sizes="100vw" className="object-cover opacity-35" />
        <div className="relative mx-auto flex min-h-[300px] max-w-5xl items-end px-4 pb-12 sm:px-6 lg:px-8">
          <div className="max-w-3xl text-white">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-brand-orange-400">Procurement guide</p>
            <h1 className="mt-3 text-4xl font-black sm:text-5xl">Platform Licensing Guide</h1>
            <p className="mt-4 text-lg leading-8 text-slate-200">Understand the access model, responsibilities, and controls before purchasing.</p>
          </div>
        </div>
      </section>

      <div className="border-b bg-white">
        <div className="mx-auto max-w-5xl px-4 py-3"><Breadcrumbs items={[{ label: 'Store', href: '/store' }, { label: 'Guides', href: '/store/guides' }, { label: 'Licensing' }]} /></div>
      </div>

      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-brand-blue-200 bg-brand-blue-50 p-6">
          <div className="flex gap-3"><ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-brand-blue-700" /><div><h2 className="font-black text-brand-blue-950">License boundary</h2><p className="mt-1 leading-7 text-brand-blue-900">Platform products provide licensed access to systems operated by {PLATFORM_DEFAULTS.orgName}. Software, infrastructure, and intellectual-property ownership are not transferred unless a signed agreement explicitly states otherwise.</p></div></div>
        </div>

        <div className="mt-12 space-y-5">
          {steps.map(([title, description], index) => (
            <article key={title} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-[48px_1fr]">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-blue-700 font-black text-white">{index + 1}</div>
              <div><h2 className="text-xl font-black text-slate-950">{title}</h2><p className="mt-2 leading-7 text-slate-600">{description}</p></div>
            </article>
          ))}
        </div>

        <section className="mt-12 rounded-3xl bg-slate-950 p-7 text-white sm:p-9">
          <h2 className="text-2xl font-black">What should be in the purchase record?</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {['Licensed organization and authorized users', 'Included modules and integrations', 'Subscription and billing terms', 'Capacity and storage terms', 'Support and service commitments', 'Data retention and termination terms', 'Security and access responsibilities', 'Implementation and acceptance criteria'].map((item) => <div key={item} className="flex gap-3 text-sm font-semibold text-slate-200"><CheckCircle2 className="h-5 w-5 shrink-0 text-green-400" />{item}</div>)}
          </div>
        </section>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link href="/store/licenses" className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-blue-700 px-6 py-3 font-bold text-white">View License Options <ArrowRight className="h-4 w-4" /></Link>
          <Link href="/contact" className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-6 py-3 font-bold text-slate-900">Discuss Enterprise Terms</Link>
        </div>
      </section>
    </main>
  );
}
