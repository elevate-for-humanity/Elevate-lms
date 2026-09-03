import type { Metadata } from 'next';
import Link from 'next/link';
import { Building2, Bell, FileText, Search, Users, ArrowRight } from 'lucide-react';
import { IndividualAppPlansSection } from '@/components/store/IndividualAppPlansSection';
import { SubscriptionAccessNotice } from '@/components/store/SubscriptionAccessNotice';
import ZeroCodeSetup from '@/components/store/ZeroCodeSetup';
import { INDIVIDUAL_APP_CATALOG } from '@/lib/apps/individual-app-plans';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'SAM.gov Manager | Elevate Store',
  description: 'Organize SAM.gov entity records, documents, compliance reminders, and registration preparation from an Elevate workspace. Final registration and federal approval remain on SAM.gov.',
  keywords: ['SAM.gov manager', 'SAM registration tracking', 'UEI', 'CAGE code', 'federal contractor records', 'government contracting'],
  alternates: { canonical: 'https://www.elevateforhumanity.org/store/apps/sam-gov' },
  openGraph: { title: 'SAM.gov Manager | Elevate Store', description: 'Organize entity records, supporting documents, and compliance reminders before working in the official SAM.gov system.', url: 'https://www.elevateforhumanity.org/store/apps/sam-gov', type: 'website' },
};

const catalog = INDIVIDUAL_APP_CATALOG['sam-gov'];
const features = [
  { icon: Building2, title: 'Entity records', desc: 'Maintain organization records, registration status, UEI/CAGE information when available, and related business details.' },
  { icon: FileText, title: 'Document organization', desc: 'Associate supporting documents with entity records in the account workspace.' },
  { icon: Bell, title: 'Compliance reminders', desc: 'Surface stored alerts and renewal-related reminders tied to entity records.' },
  { icon: Search, title: 'Lookup workflow', desc: 'The repository includes a UEI search integration path for supported SAM.gov lookup workflows, with timeout and transient-failure handling.' },
  { icon: Users, title: 'Account-based workspace', desc: 'Individual store subscriptions are tied to one authenticated Elevate account. Organization licensing is handled separately through procurement review.' },
];
const setupQuestions = [
  { id: 'entity', prompt: 'What business or organization are you preparing for SAM.gov?', placeholder: 'Example: ABC Training LLC, workforce training and consulting.' },
  { id: 'status', prompt: 'Where are you in the process?', choices: [
    { label: 'Brand new', value: 'new-registration', description: 'I have not started registration.' },
    { label: 'In progress', value: 'in-progress', description: 'I started and need organization.' },
    { label: 'Renewal', value: 'renewal', description: 'I need to maintain or renew records.' },
    { label: 'Already active', value: 'active', description: 'I want tracking and reminders.' },
  ]},
  { id: 'goal', prompt: 'What are you trying to accomplish?', placeholder: 'Example: become eligible to pursue federal contracting opportunities and keep compliance records organized.' },
  { id: 'team', prompt: 'Who will manage this account?', choices: [
    { label: 'Just me', value: 'single-user' },
    { label: 'Small team', value: 'small-team' },
    { label: 'Multiple entities/team', value: 'multi-entity-team' },
  ]},
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: `Elevate ${catalog.displayName}`,
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  url: 'https://www.elevateforhumanity.org/store/apps/sam-gov',
  description: 'Entity record, document, and compliance tracking workspace that supports preparation for official SAM.gov processes.',
  offers: catalog.plans.map((plan) => ({ '@type': 'Offer', price: String(plan.priceMonthly), priceCurrency: 'USD', category: `${plan.name} monthly subscription` })),
};

export default async function SamGovStorePage({ searchParams }: { searchParams: Promise<{ reason?: string }> }) {
  const { reason } = await searchParams;
  return (
    <main className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SubscriptionAccessNotice reason={reason} />
      <section className="border-b border-slate-200 bg-slate-950 px-4 py-20 text-white"><div className="mx-auto max-w-5xl"><p className="text-sm font-bold uppercase tracking-widest text-brand-red-400">Government contracting tools</p><h1 className="mt-3 max-w-4xl text-4xl font-black md:text-6xl">SAM.gov Manager</h1><p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">Organize entity information, supporting documents, and compliance reminders in Elevate while keeping the official federal submission process where it belongs: SAM.gov.</p><div className="mt-8 flex flex-wrap gap-3"><a href="#guided-setup" className="rounded-xl bg-brand-red-600 px-6 py-3 font-bold text-white hover:bg-brand-red-700">Guide me through setup</a><Link href={catalog.appHref} className="rounded-xl border border-white/30 px-6 py-3 font-bold text-white hover:bg-white/10">Open SAM.gov Manager</Link><Link href="/store/apps" className="rounded-xl border border-white/30 px-6 py-3 font-bold text-white hover:bg-white/10">Search all apps</Link></div></div></section>
      <div id="guided-setup"><ZeroCodeSetup productName="SAM.gov Manager" intro="Answer a few plain-English questions and Elevate carries the setup context into the workspace around your entity, registration stage and goal. You should not have to understand the internal data model to begin." questions={setupQuestions} startHref={catalog.appHref} trialHref={catalog.trialHref} advancedNote="Individual higher tiers can add more entity capacity and advanced compliance workspace features where listed in the plan. Shared organization access, white-label delivery, and contractual service levels require a separate enterprise procurement agreement. Official registration and approval still occur through SAM.gov." /></div>
      <section className="px-4 py-16"><div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-3">{features.map((feature) => <article key={feature.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><feature.icon className="h-7 w-7 text-brand-red-700" /><h2 className="mt-5 text-xl font-black text-slate-900">{feature.title}</h2><p className="mt-2 leading-7 text-slate-600">{feature.desc}</p></article>)}</div></section>
      <section className="border-y border-blue-200 bg-blue-50 px-4 py-12"><div className="mx-auto max-w-4xl"><h2 className="text-2xl font-black text-blue-950">Important distinction</h2><p className="mt-4 leading-7 text-blue-900">Elevate's SAM.gov Manager is not SAM.gov and does not issue UEIs, CAGE codes, federal registrations, contract awards, or government approvals. Official submission and approval remain with the applicable federal systems and agencies.</p></div></section>
      <div id="plans"><IndividualAppPlansSection catalog={catalog} /></div>
      <section className="px-4 py-14 text-center"><Link href={catalog.trialHref} className="inline-flex items-center gap-2 font-bold text-brand-red-700 hover:underline">Start the SAM.gov Manager trial <ArrowRight className="h-4 w-4" /></Link></section>
    </main>
  );
}
