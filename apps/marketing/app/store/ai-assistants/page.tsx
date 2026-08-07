import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Bot, GraduationCap, Settings, ShieldCheck, Route } from 'lucide-react';

export const metadata: Metadata = {
  title: 'AI Assistants | PARS, ELLIE, LIZZY & ZORA | Elevate Store',
  description:
    'Explore Elevate role-based AI assistants for admissions, student support, operations, compliance, career placement, and intent routing.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/store/ai-assistants',
  },
  openGraph: {
    title: 'AI Assistants | Elevate Store',
    description: 'Role-based AI assistance across admissions, student support, operations, compliance, and routing.',
    url: 'https://www.elevateforhumanity.org/store/ai-assistants',
    type: 'website',
  },
};

const assistants = [
  {
    name: 'PARS / PARIS',
    icon: Bot,
    purpose: 'Admissions & eligibility',
    description: 'Supports admission interviews, eligibility assessment, program questions, and application workflows.',
  },
  {
    name: 'ELLIE',
    icon: GraduationCap,
    purpose: 'Student support & learning',
    description: 'Supports student success, enrollment guidance, course navigation, notifications, and Course Builder workflows.',
  },
  {
    name: 'LIZZY',
    icon: Settings,
    purpose: 'Operations & administration',
    description: 'Supports administrative operations, document processing, review queues, and operational task workflows.',
  },
  {
    name: 'ZORA',
    icon: ShieldCheck,
    purpose: 'Compliance & career placement',
    description: 'Supports compliance monitoring, credential tracking, workforce reporting, regulatory review, and career-placement workflows.',
  },
  {
    name: 'AI Router',
    icon: Route,
    purpose: 'Intent routing',
    description: 'Routes requests to the appropriate specialized assistant based on task intent and platform context.',
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Elevate AI Assistants',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  url: 'https://www.elevateforhumanity.org/store/ai-assistants',
  description:
    'Role-based AI assistance for admissions, student support, operations, compliance, career placement, and workflow routing.',
  publisher: {
    '@type': 'Organization',
    name: 'Elevate for Humanity',
    url: 'https://www.elevateforhumanity.org',
  },
};

export default function AiAssistantsStorePage() {
  return (
    <main className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="border-b border-slate-200 bg-slate-950 px-4 py-20 text-white">
        <div className="mx-auto max-w-5xl text-center">
          <p className="mb-3 text-sm font-bold uppercase tracking-widest text-brand-red-400">Elevate AI</p>
          <h1 className="text-4xl font-black md:text-6xl">Role-Based AI Assistants</h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-300">
            Elevate uses specialized assistants instead of one generic chatbot. Each assistant is mapped to a defined operational role and task family.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/store/plans" className="rounded-xl bg-brand-red-600 px-6 py-3 font-bold text-white hover:bg-brand-red-700">
              View Plans
            </Link>
            <Link href="/store/apps" className="rounded-xl border border-white/30 px-6 py-3 font-bold text-white hover:bg-white/10">
              Search All Apps
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 py-16">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2 xl:grid-cols-3">
          {assistants.map((assistant) => (
            <article key={assistant.name} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <assistant.icon className="h-8 w-8 text-brand-red-700" />
              <p className="mt-5 text-xs font-bold uppercase tracking-wider text-slate-500">{assistant.purpose}</p>
              <h2 className="mt-1 text-2xl font-bold text-slate-900">{assistant.name}</h2>
              <p className="mt-3 leading-7 text-slate-600">{assistant.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 px-4 py-14">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-black text-slate-900">Add AI where it improves the workflow</h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-600">
            AI access should be granted through the organization plan or add-on entitlement rather than a separate disconnected login.
          </p>
          <Link href="/store/plans" className="mt-7 inline-flex items-center gap-2 font-bold text-brand-red-700 hover:underline">
            Compare plan and add-on options <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
