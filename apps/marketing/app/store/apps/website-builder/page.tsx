import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Globe2, Layout, Search, Palette, Upload, Pencil } from 'lucide-react';
import { IndividualAppPlansSection } from '@/components/store/IndividualAppPlansSection';
import { SubscriptionAccessNotice } from '@/components/store/SubscriptionAccessNotice';
import ProductWalkthrough from '@/components/store/ProductWalkthrough';
import ZeroCodeSetup from '@/components/store/ZeroCodeSetup';
import WebsiteBuilderCommercial from '@/components/store/WebsiteBuilderCommercial';
import { INDIVIDUAL_APP_CATALOG } from '@/lib/apps/individual-app-plans';
import { WEBSITE_BUILDER_TRIAL } from '@/lib/apps/website-builder-trial';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'AI Website Builder You Can Talk To | Elevate Store',
  description:
    'Talk or type to PARIS and build a business website through conversation. Start with a limited 14-day trial, then add AI assistants, marketing, grants, images, video, courses, CRM, booking and automation.',
  keywords: [
    'AI website builder',
    'website builder you can talk to',
    'small business website builder',
    'training provider website',
    'AI business assistant',
    'no code website builder',
  ],
  alternates: { canonical: 'https://www.elevateforhumanity.org/store/apps/website-builder' },
  openGraph: {
    title: 'AI Website Builder You Can Talk To | Elevate Store',
    description: 'Tell PARIS what you want and keep building by voice or text as your website changes.',
    url: 'https://www.elevateforhumanity.org/store/apps/website-builder',
    type: 'website',
  },
};

const catalog = INDIVIDUAL_APP_CATALOG['website-builder'];

const features = [
  { icon: Layout, title: 'Start by talking to PARIS', desc: 'Describe the business, audience, services, style and goal. PARIS creates the first website draft instead of giving you a blank canvas.' },
  { icon: Pencil, title: 'Keep building by conversation', desc: 'Say or type what you want changed. PARIS stays in the editor, updates the saved draft and keeps the website moving with you.' },
  { icon: Globe2, title: 'Preview and publish', desc: 'Review the website before it is public, publish to an Elevate web address, and unlock supported custom-domain workflows when you upgrade.' },
  { icon: Search, title: 'SEO controls', desc: 'Manage site title, description, keywords and search-facing content as part of the website configuration.' },
  { icon: Palette, title: 'Brand controls', desc: 'Change logo text, tagline, primary color, secondary color and the visual direction without writing code.' },
  { icon: Upload, title: 'Import an existing website', desc: 'Bring an existing public website into the Elevate workflow, map its content and branding, then review the result before publishing.' },
];

const walkthrough = [
  { label: '1. Describe it', title: 'Tell PARIS what business you are building', description: 'Example: “Build a professional home-healthcare agency website in Indianapolis with services, an about section and a contact call to action.”' },
  { label: '2. Generate', title: 'PARIS creates your first draft', description: 'AI turns your business interview into a starting website structure, branding and conversion-focused content so you are not staring at a blank canvas.' },
  { label: '3. Keep talking', title: 'Tell PARIS what to change next', description: 'Say “make it more professional,” “rewrite my services,” “change the colors,” or “improve the homepage.” PARIS updates the current site instead of starting over.' },
  { label: '4. Preview', title: 'Watch the site change as you build', description: 'Preview the saved website, refine the message and make sure the business is represented correctly before anything is published.' },
  { label: '5. Publish + upgrade', title: 'Go live, then add the business tools you need', description: 'Publish when ready and unlock custom domains, more credits, AI assistants, marketing, grant writing, images, commercial video, courses and automation as the business grows.' },
];

const setupQuestions = [
  { id: 'business', prompt: 'What business or organization are you building this website for?', placeholder: 'Example: A home healthcare agency serving Indianapolis...' },
  { id: 'goal', prompt: 'What should the website help you accomplish?', choices: [
    { label: 'Get leads', value: 'lead-generation', description: 'Calls, forms and consultations.' },
    { label: 'Sell services', value: 'sell-services', description: 'Explain offers and drive purchases.' },
    { label: 'Enroll students', value: 'student-enrollment', description: 'Programs, applications and enrollment.' },
    { label: 'Build credibility', value: 'credibility', description: 'Professional presence and trust.' },
  ]},
  { id: 'style', prompt: 'How should the site feel?', choices: [
    { label: 'Professional', value: 'professional' },
    { label: 'Modern', value: 'modern' },
    { label: 'Warm', value: 'warm' },
    { label: 'Bold', value: 'bold' },
  ]},
  { id: 'pages', prompt: 'What should the first version include?', placeholder: 'Example: Home, About, Services, Contact, booking form and testimonials.' },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: `Elevate ${catalog.displayName}`,
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  url: 'https://www.elevateforhumanity.org/store/apps/website-builder',
  description: 'Conversational AI website creation, editing, preview and publishing for businesses and training providers.',
  offers: catalog.plans.map((plan) => ({ '@type': 'Offer', price: String(plan.priceMonthly), priceCurrency: 'USD', category: `${plan.name} monthly subscription` })),
};

export default async function WebsiteBuilderStorePage({ searchParams }: { searchParams: Promise<{ reason?: string }> }) {
  const { reason } = await searchParams;
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SubscriptionAccessNotice reason={reason} />

      <section className="border-b border-cyan-100 bg-gradient-to-br from-cyan-50 via-white to-rose-50 px-4 py-10 sm:py-14">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-widest text-brand-red-700">Talk it. Type it. Build it.</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">A Website Builder You Can Actually Talk To</h1>
            <p className="mt-6 max-w-2xl text-base font-medium leading-7 text-slate-700 sm:text-lg">Tell PARIS what you want and watch the website take shape. Keep talking or typing as you go—PARIS stays in the builder, changes the saved draft, and helps you move from idea to publishable website without code.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={catalog.trialHref} className="rounded-xl bg-brand-red-700 px-6 py-3 font-black text-white hover:bg-brand-red-800">Start 14-day trial</Link>
              <Link href="#commercial" className="rounded-xl border-2 border-slate-900 bg-white px-6 py-3 font-black text-slate-950 hover:bg-slate-50">Watch commercial</Link>
              <Link href={catalog.appHref} className="rounded-xl border-2 border-cyan-700 bg-cyan-50 px-6 py-3 font-bold text-cyan-900 hover:bg-cyan-100">Open Website Builder</Link>
            </div>
          </div>
          <div className="relative min-h-[300px] overflow-hidden rounded-3xl border border-white bg-white shadow-2xl shadow-cyan-900/10 ring-1 ring-slate-200 sm:min-h-[380px]">
            <Image src="/images/pages/platform-page-12.webp" alt="Elevate AI Website Builder workspace" fill priority sizes="(max-width: 1024px) 100vw, 52vw" className="object-contain p-2" />
            <div className="absolute inset-x-0 bottom-0 border-t border-slate-200 bg-white/95 p-4 backdrop-blur"><p className="text-sm font-bold text-slate-800">Interview → first draft → talk or type changes → preview → publish → upgrade.</p></div>
          </div>
        </div>
      </section>

      <div id="commercial"><WebsiteBuilderCommercial /></div>

      <section className="border-b border-slate-200 bg-cyan-50 px-4 py-14">
        <div className="mx-auto max-w-6xl"><div className="grid gap-7 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-brand-red-700">Limited 14-day trial</p>
            <h2 className="mt-2 text-3xl font-black text-slate-950">Try the builder and the upgrades before you buy them.</h2>
            <p className="mt-4 leading-7 text-slate-700">The Website Builder trial includes {WEBSITE_BUILDER_TRIAL.credits} shared AI credits, one website, up to five pages, PARIS, and limited preview access to the upgrade tools. Heavy AI work uses more credits than quick text changes.</p>
            <p className="mt-3 text-sm font-semibold text-slate-600">Domain purchases, white-labeling and API access are paid upgrades. Trial publishing uses an Elevate web address.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">{WEBSITE_BUILDER_TRIAL.includedPreviewCapabilities.map((capability) => <div key={capability} className="rounded-xl border border-cyan-200 bg-white p-4 text-sm font-bold text-slate-800 shadow-sm">{capability}</div>)}</div>
        </div></div>
      </section>

      <div id="walkthrough"><ProductWalkthrough title="From business idea to a publishable website" subtitle="Click through the builder workflow, switch desktop and mobile preview, and use PARIS-style quick edits to see how the website changes." steps={walkthrough} tryHref={catalog.appHref} /></div>
      <div id="guided-setup"><ZeroCodeSetup productName="AI Website Builder" intro="Answer four simple questions and Elevate carries that context into the Website Builder so PARIS can start with the business direction instead of an empty canvas." questions={setupQuestions} startHref={catalog.appHref} trialHref={catalog.trialHref} advancedNote="Upgrade for more websites, more credits, custom domains, advanced capacity and additional business assistants and tools." /></div>

      <section className="px-4 py-16"><div className="mx-auto max-w-6xl"><div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{features.map((feature) => <article key={feature.title} className="rounded-2xl border border-slate-300 bg-white p-6 shadow-sm"><feature.icon className="h-7 w-7 text-brand-red-700" /><h2 className="mt-5 text-xl font-black text-slate-950">{feature.title}</h2><p className="mt-2 font-medium leading-7 text-slate-700">{feature.desc}</p></article>)}</div></div></section>

      <section className="border-y border-slate-200 bg-slate-50 px-4 py-14"><div className="mx-auto max-w-5xl"><h2 className="text-3xl font-black text-slate-950">How the revenue journey works</h2><div className="mt-8 grid gap-4 md:grid-cols-4">{['Start the limited trial', 'Build with PARIS + credits', 'Upgrade tools as needed', 'Publish, grow and add capacity'].map((step, index) => <div key={step} className="rounded-xl border border-slate-300 bg-white p-5"><div className="text-sm font-black text-brand-red-700">{index + 1}</div><div className="mt-2 font-black text-slate-950">{step}</div></div>)}</div><p className="mt-6 text-sm font-medium leading-6 text-slate-700">The base subscription gets the customer into the builder. Additional AI capacity, assistants and business capabilities can be activated as the customer asks PARIS to do more.</p></div></section>

      <div id="plans"><IndividualAppPlansSection catalog={catalog} /></div>
      <section className="px-4 py-14 text-center"><Link href={catalog.trialHref} className="inline-flex items-center gap-2 font-black text-brand-red-700 hover:underline">Start the Website Builder trial <ArrowRight className="h-4 w-4" /></Link></section>
    </main>
  );
}
