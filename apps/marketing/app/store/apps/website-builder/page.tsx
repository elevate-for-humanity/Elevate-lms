import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Globe2, Layout, Search, Palette, Upload, Pencil } from 'lucide-react';
import { IndividualAppPlansSection } from '@/components/store/IndividualAppPlansSection';
import ProductWalkthrough from '@/components/store/ProductWalkthrough';
import ZeroCodeSetup from '@/components/store/ZeroCodeSetup';
import { INDIVIDUAL_APP_CATALOG } from '@/lib/apps/individual-app-plans';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Website Builder for Training Providers | Elevate Store',
  description:
    'Create, edit, preview, and publish a training-provider website with Elevate. Includes organization branding, homepage content, SEO fields, subdomain publishing, and plan-based site limits.',
  keywords: [
    'website builder',
    'training provider website',
    'workforce website builder',
    'education website builder',
    'SEO website builder',
  ],
  alternates: { canonical: 'https://www.elevateforhumanity.org/store/apps/website-builder' },
  openGraph: {
    title: 'Website Builder for Training Providers | Elevate Store',
    description: 'Create and publish training-provider websites from your Elevate account.',
    url: 'https://www.elevateforhumanity.org/store/apps/website-builder',
    type: 'website',
  },
};

const catalog = INDIVIDUAL_APP_CATALOG['website-builder'];

const features = [
  {
    icon: Layout,
    title: 'Structured site setup',
    desc: 'Start from an Elevate training-provider site configuration instead of a blank page.',
  },
  {
    icon: Pencil,
    title: 'Live editing',
    desc: 'Edit site identity, homepage hero content, branding, and search metadata from the authenticated editor.',
  },
  {
    icon: Globe2,
    title: 'Subdomain publishing',
    desc: 'Choose an available Elevate subdomain and publish the current site configuration.',
  },
  {
    icon: Search,
    title: 'SEO fields',
    desc: 'Manage the site title and description stored with the website configuration.',
  },
  {
    icon: Palette,
    title: 'Brand controls',
    desc: 'Manage logo text, tagline, primary color, and secondary color.',
  },
  {
    icon: Upload,
    title: 'Existing-site intake',
    desc: 'The Store includes a separate import entry point for organizations bringing an existing site into the workflow.',
  },
];

const walkthrough = [
  {
    label: '1. Describe it',
    title: 'Tell AI what business you are building',
    description:
      'Example: “Build a professional home-healthcare agency website in Indianapolis with services, an about section and a contact call to action.”',
  },
  {
    label: '2. Generate',
    title: 'Elevate creates your first draft',
    description:
      'AI turns your business description into a starting website structure and content so you are not staring at a blank canvas.',
  },
  {
    label: '3. Make it yours',
    title: 'Edit the words, brand and look',
    description:
      'Update your business name, hero message, colors, tagline and search metadata from the visual workspace—no code required.',
  },
  {
    label: '4. Preview',
    title: 'Review before anybody sees it',
    description:
      'Preview the site, refine the message and make sure the business is represented correctly before publishing.',
  },
  {
    label: '5. Publish',
    title: 'Choose your web address and go live',
    description:
      'Select an available Elevate subdomain and publish the saved website configuration when you are ready.',
  },
];

const setupQuestions = [
  {
    id: 'business',
    prompt: 'What business or organization are you building this website for?',
    placeholder: 'Example: A home healthcare agency serving Indianapolis...',
  },
  {
    id: 'goal',
    prompt: 'What should the website help you accomplish?',
    choices: [
      { label: 'Get leads', value: 'lead-generation', description: 'Calls, forms and consultations.' },
      { label: 'Sell services', value: 'sell-services', description: 'Explain offers and drive purchases.' },
      { label: 'Enroll students', value: 'student-enrollment', description: 'Programs, applications and enrollment.' },
      { label: 'Build credibility', value: 'credibility', description: 'Professional presence and trust.' },
    ],
  },
  {
    id: 'style',
    prompt: 'How should the site feel?',
    choices: [
      { label: 'Professional', value: 'professional' },
      { label: 'Modern', value: 'modern' },
      { label: 'Warm', value: 'warm' },
      { label: 'Bold', value: 'bold' },
    ],
  },
  {
    id: 'pages',
    prompt: 'What should the first version include?',
    placeholder: 'Example: Home, About, Services, Contact, booking form and testimonials.',
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: `Elevate ${catalog.displayName}`,
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  url: 'https://www.elevateforhumanity.org/store/apps/website-builder',
  description: 'Website creation and publishing tools for training providers and workforce organizations.',
  offers: catalog.plans.map((plan) => ({
    '@type': 'Offer',
    price: String(plan.priceMonthly),
    priceCurrency: 'USD',
    category: `${plan.name} monthly subscription`,
  })),
};

export default function WebsiteBuilderStorePage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="border-b border-slate-200 bg-slate-950 px-4 py-10 text-white sm:py-14">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-widest text-white">Elevate Apps</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              Website Builder for Training Providers
            </h1>
            <p className="mt-6 max-w-2xl text-base font-medium leading-7 text-slate-100 sm:text-lg">
              Build and publish an Elevate-hosted training website from your account. The editor covers site identity, homepage content, branding, SEO, preview, save, publishing, and supported domain workflows.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="#guided-setup"
                className="rounded-xl bg-brand-red-700 px-6 py-3 font-black text-white hover:bg-brand-red-800"
              >
                Guided setup
              </Link>
              <Link
                href="#walkthrough"
                className="rounded-xl border-2 border-white px-6 py-3 font-black text-white hover:bg-white/10"
              >
                Watch walkthrough
              </Link>
              <Link
                href={catalog.appHref}
                className="rounded-xl border-2 border-white/70 px-6 py-3 font-bold text-white hover:bg-white/10"
              >
                Open Website Builder
              </Link>
            </div>
          </div>

          <div className="relative min-h-[300px] overflow-hidden rounded-2xl border border-white/20 bg-slate-800 shadow-2xl sm:min-h-[380px]">
            <Image
              src="/images/pages/platform-page-12.webp"
              alt="Elevate platform workspace used to configure digital workforce tools"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 52vw"
              className="object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 to-transparent p-5 pt-16">
              <p className="text-sm font-bold text-white">Create → edit → preview → publish from one workspace.</p>
            </div>
          </div>
        </div>
      </section>

      <div id="walkthrough">
        <ProductWalkthrough
          title="From business idea to a publishable website"
          subtitle="See the customer journey the Website Builder is designed around. Let it play automatically or choose a step."
          steps={walkthrough}
          tryHref={catalog.appHref}
        />
      </div>

      <div id="guided-setup">
        <ZeroCodeSetup
          productName="AI Website Builder"
          intro="Answer four simple questions and Elevate carries that context into the Website Builder so you can start with a configured direction instead of an empty canvas."
          questions={setupQuestions}
          startHref={catalog.appHref}
          trialHref={catalog.trialHref}
          advancedNote="Professional and Enterprise can expose custom domains, imports, white-label, API and multi-user controls after the basic zero-code workflow is working."
        />
      </div>

      <section className="px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <article key={feature.title} className="rounded-2xl border border-slate-300 bg-white p-6 shadow-sm">
                <feature.icon className="h-7 w-7 text-brand-red-700" />
                <h2 className="mt-5 text-xl font-black text-slate-950">{feature.title}</h2>
                <p className="mt-2 font-medium leading-7 text-slate-700">{feature.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 px-4 py-14">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-black text-slate-950">How the flow works</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {['Start trial or subscribe', 'Create a website', 'Edit and preview', 'Choose a domain and publish'].map(
              (step, index) => (
                <div key={step} className="rounded-xl border border-slate-300 bg-white p-5">
                  <div className="text-sm font-black text-brand-red-700">{index + 1}</div>
                  <div className="mt-2 font-black text-slate-950">{step}</div>
                </div>
              ),
            )}
          </div>
          <p className="mt-6 text-sm font-medium leading-6 text-slate-700">
            Domain capabilities depend on the active plan and enabled services. The product page describes the supported customer workflow without creating a second Website Builder implementation.
          </p>
        </div>
      </section>

      <IndividualAppPlansSection catalog={catalog} />

      <section className="px-4 py-14 text-center">
        <Link
          href={catalog.trialHref}
          className="inline-flex items-center gap-2 font-black text-brand-red-700 hover:underline"
        >
          Start the Website Builder trial <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </main>
  );
}
