export const dynamic = 'force-static';

import { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowRight, Bot, Workflow, Database, Container, Code, Activity } from 'lucide-react';
import { getAdminUrl } from '@/lib/config/admin-url';
import PictureFirstPageHero from '@/components/site/PictureFirstPageHero';

export const metadata: Metadata = {
  title: 'Dev Studio',
  description: 'Development and operations workspace for platform automation, code, workflows, data, and service management.',
  keywords: ['dev studio', 'workflow automation', 'container management', 'development tools'],
  alternates: { canonical: 'https://www.elevateforhumanity.org/store/dev-studio' },
};

const capabilities = [
  { icon: Bot, title: 'AI-Assisted Development', desc: 'Use the available development assistant inside the Admin Studio for supported coding and platform tasks.' },
  { icon: Workflow, title: 'Workflow Tools', desc: 'Work with enrollment, compliance, and operational workflows from the canonical Admin Studio.' },
  { icon: Container, title: 'Service Operations', desc: 'Review deployment and service-operation tools that are actually connected to the platform.' },
  { icon: Database, title: 'Data Tools', desc: 'Use approved database and schema-management tools through controlled admin workflows.' },
  { icon: Code, title: 'Development Workspace', desc: 'Centralize platform-development tasks instead of maintaining multiple public mock editors.' },
  { icon: Activity, title: 'Operational Visibility', desc: 'Use the Admin environment for real status, logs, and platform operations where available.' },
];

export default function DevStudioPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-4">
        <Breadcrumbs items={[{ label: 'Store', href: '/store' }, { label: 'Dev Studio' }]} />
      </div>

      <PictureFirstPageHero
        image="/images/location-1.webp"
        alt="Administrative development and operations workspace"
        eyebrow="Dev Studio"
        title="Build and Operate from One Admin Workspace"
        description="Dev Studio is owned by the Admin platform. This page now points to the real workspace instead of showing a synthetic gradient hero, fake terminal output, or fabricated workflow metrics."
        actions={(
          <>
            <a href={getAdminUrl('/studio')} className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-red-600 px-8 py-4 font-bold text-white hover:bg-brand-red-700">Open Dev Studio <ArrowRight className="h-5 w-5" /></a>
            <Link href="/store/workflow-studio" className="inline-flex items-center justify-center rounded-xl border-2 border-slate-300 bg-white px-8 py-4 font-bold text-slate-900 hover:border-slate-500">Workflow Studio</Link>
          </>
        )}
      />

      <section className="bg-slate-50 px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-black text-slate-950">Platform Development Capabilities</h2>
            <p className="mx-auto mt-3 max-w-2xl text-slate-700">These describe the platform workspace at a high level without claiming integrations or usage metrics that are not verified.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {capabilities.map((item) => (
              <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-6">
                <item.icon className="mb-4 h-8 w-8 text-brand-blue-700" />
                <h3 className="font-bold text-slate-950">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-700">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-8">
            <h2 className="text-2xl font-black text-slate-950">Canonical ownership</h2>
            <p className="mt-3 leading-7 text-slate-700">Development, Course Builder, Workflow Studio, and operational tools should open the Admin service. Public Store pages explain the capability; they do not maintain a second editable implementation.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href={getAdminUrl('/studio')} className="rounded-xl bg-slate-950 px-6 py-3 font-bold text-white hover:bg-slate-800">Admin Dev Studio</a>
              <a href={getAdminUrl('/course-builder')} className="rounded-xl border border-slate-300 px-6 py-3 font-bold text-slate-900 hover:bg-slate-50">Admin Course Builder</a>
              <a href={getAdminUrl('/studio/workflows')} className="rounded-xl border border-slate-300 px-6 py-3 font-bold text-slate-900 hover:bg-slate-50">Admin Workflow Studio</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
