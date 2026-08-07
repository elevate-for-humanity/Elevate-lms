import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Globe2, Layout, Search, Palette, Upload, Pencil } from 'lucide-react';
import { IndividualAppPlansSection } from '@/components/store/IndividualAppPlansSection';
import { INDIVIDUAL_APP_CATALOG } from '@/lib/apps/individual-app-plans';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Website Builder for Training Providers | Elevate Store',
  description:
    'Create, edit, preview, and publish a training-provider website with Elevate. Includes organization branding, homepage content, SEO fields, subdomain publishing, and plan-based site limits.',
  keywords: ['website builder', 'training provider website', 'workforce website builder', 'education website builder', 'SEO website builder'],
  alternates: { canonical: 'https://www.elevateforhumanity.org/store/apps/website-builder' },
  openGraph: {
    title: 'Website Builder for Training Providers | Elevate Store',
    description: 'Create and publish training-provider websites from your Elevate account.',
    url: 'https://www.elevateforhumanity.org/store/apps/website-builder',
    type: 'website',
  },
};

const features = [
  { icon: Layout, title: 'Structured site setup', desc: 'Start from an Elevate training-provider site configuration instead of a blank page.' },
  { icon: Pencil, title: 'Live editing', desc: 'Edit site identity, homepage hero content, branding, and search metadata from the authenticated editor.' },
  { icon: Globe2, title: 'Subdomain publishing', desc: 'Choose an available Elevate subdomain and publish the current site configuration.' },
  { icon: Search, title: 'SEO fields', desc: 'Manage the site title and description stored with the website configuration.' },
  { icon: Palette, title: 'Brand controls', desc: 'Manage logo text, tagline, primary color, and secondary color.' },
  { icon: Upload, title: 'Existing-site intake', desc: 'The Store includes a separate import entry point for organizations bringing an existing site into the workflow.' },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Elevate Website Builder',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  url: 'https://www.elevateforhumanity.org/store/apps/website-builder',
  description: 'Website creation and publishing tools for training providers and workforce organizations.',
  offers: [
    { '@type': 'Offer', price: '29', priceCurrency: 'USD', category: 'Starter monthly subscription' },
    { '@type': 'Offer', price: '79', priceCurrency: 'USD', category: 'Professional monthly subscription' },
    { '@type': 'Offer', price: '199', priceCurrency: 'USD', category: 'Enterprise monthly subscription' },
  ],
};

export default function WebsiteBuilderStorePage() {
  const catalog = INDIVIDUAL_APP_CATALOG['website-builder'];
  return (
    <main className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="border-b border-slate-200 bg-slate-950 px-4 py-20 text-white">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-bold uppercase tracking-widest text-brand-red-400">Elevate Apps</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-black md:text-6xl">Website Builder for Training Providers</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
            Build and publish an Elevate-hosted training website from your account. The current editor covers the core site identity, homepage, branding, SEO, preview, save, and publish workflow.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={catalog.trialHref} className="rounded-xl bg-brand-red-600 px-6 py-3 font-bold text-white hover:bg-brand-red-700">Start 14-day trial</Link>
            <Link href={catalog.appHref} className="rounded-xl border border-white/30 px-6 py-3 font-bold text-white hover:bg-white/10">Open Website Builder</Link>
            <Link href="/store/apps" className="rounded-xl border border-white/30 px-6 py-3 font-bold text-white hover:bg-white/10">Search all apps</Link>
          </div>
        </div>
      </section>

      <section className="px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <article key={feature.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <feature.icon className="h-7 w-7 text-brand-red-700" />
                <h2 className="mt-5 text-xl font-black text-slate-900">{feature.title}</h2>
                <p className="mt-2 leading-7 text-slate-600">{feature.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 px-4 py-14">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-black text-slate-900">How the flow works</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {['Start trial or subscribe', 'Create a website', 'Edit and preview', 'Choose subdomain and publish'].map((step, index) => (
              <div key={step} className="rounded-xl bg-white p-5 ring-1 ring-slate-200">
                <div className="text-sm font-black text-brand-red-700">{index + 1}</div>
                <div className="mt-2 font-bold text-slate-900">{step}</div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm leading-6 text-slate-600">
            Custom apex-domain automation and more advanced visual block editing should be treated as expansion features unless they are separately enabled for the customer.
          </p>
        </div>
      </section>

      <IndividualAppPlansSection catalog={catalog} />

      <section className="px-4 py-14 text-center">
        <Link href={catalog.trialHref} className="inline-flex items-center gap-2 font-bold text-brand-red-700 hover:underline">Start the Website Builder trial <ArrowRight className="h-4 w-4" /></Link>
      </section>
    </main>
  );
}
