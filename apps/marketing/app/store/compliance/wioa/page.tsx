export const dynamic = 'force-static';

import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, FileCheck2, Database, BarChart3, ShieldCheck } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: `WIOA Reporting & Evidence Tools | ${PLATFORM_DEFAULTS.orgName} Store`,
  description:
    'Workforce reporting support with participant records, PIRL mapping/export infrastructure, performance records, document evidence, and auditable report workflows.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/store/compliance/wioa' },
};

const capabilities = [
  {
    icon: FileCheck2,
    title: 'Participant & Service Records',
    description:
      'The production schema includes WIOA participant, application, case, service, document, and compliance-report records for supported workflows.',
  },
  {
    icon: Database,
    title: 'PIRL Mapping & Export Infrastructure',
    description:
      'PIRL mapping, export, and export-issue tables support controlled transformation and validation workflows. A generated export still requires source data and authorized review.',
  },
  {
    icon: BarChart3,
    title: 'Performance Evidence',
    description:
      'Employment outcomes, performance metrics, quarterly performance records, and report-run history can be retained when the organization uses those workflows.',
  },
  {
    icon: ShieldCheck,
    title: 'Program-Specific Funding Controls',
    description:
      'Public WIOA and related funding statements are limited to programs with verified regulatory evidence; participant eligibility and authorization remain agency decisions.',
  },
];

const workflow = [
  ['1', 'Configure', 'Map the governing program, required fields, and reporting expectations.'],
  ['2', 'Collect', 'Record participant, service, enrollment, document, credential, and outcome evidence.'],
  ['3', 'Validate', 'Review source completeness, mapping issues, and exceptions before an export or report is accepted.'],
  ['4', 'Export', 'Generate the applicable report/export from recorded data and retain the run history for audit review.'],
] as const;

export default function WIOACompliancePage() {
  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-4">
        <Breadcrumbs items={[{ label: 'Store', href: '/store' }, { label: 'Compliance', href: '/store/compliance' }, { label: 'WIOA Reporting' }]} />
      </div>

      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 opacity-25">
          <Image src="/images/pages/wioa-meeting.webp" alt="Workforce reporting review" fill className="object-cover" priority sizes="100vw" />
        </div>
        <div className="relative mx-auto max-w-5xl px-4 py-24 text-center">
          <span className="mb-4 inline-block rounded-full border border-white/20 bg-white/10 px-4 py-1 text-sm font-bold">Workforce Reporting Infrastructure</span>
          <h1 className="mb-4 text-4xl font-black md:text-5xl">WIOA Evidence &amp; Reporting Tools</h1>
          <p className="mx-auto mb-8 max-w-3xl text-lg text-slate-200">
            Support participant records, PIRL mapping and exports, performance evidence, and auditable reporting workflows without representing funding or compliance outcomes as guaranteed.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/store/demos" className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 font-bold text-slate-950 hover:bg-slate-100">Request Demo <ArrowRight className="h-5 w-5" /></Link>
            <Link href="/compliance/center" className="rounded-lg border border-white/30 px-6 py-3 font-bold text-white hover:bg-white/10">Review Compliance Center</Link>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-black text-slate-950">Implemented Data Contracts</h2>
            <p className="mx-auto mt-3 max-w-3xl text-slate-600">These capabilities map to production database objects and application workflows. They are reporting tools, not a blanket certification of WIOA compliance.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {capabilities.map(({ icon: Icon, title, description }) => (
              <div key={title} className="rounded-2xl border border-slate-200 bg-slate-50 p-7">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100"><Icon className="h-6 w-6 text-blue-700" /></div>
                <h3 className="text-xl font-bold text-slate-950">{title}</h3>
                <p className="mt-2 leading-relaxed text-slate-600">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-10 text-center text-3xl font-black text-slate-950">Controlled Reporting Workflow</h2>
          <div className="grid gap-6 md:grid-cols-4">
            {workflow.map(([step, title, description]) => (
              <div key={step} className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-blue-700 font-black text-white">{step}</div>
                <h3 className="font-bold text-slate-950">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-5xl px-4">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8">
            <h2 className="text-2xl font-black text-slate-950">Acceptance boundaries</h2>
            <ul className="mt-5 space-y-3 text-slate-700">
              <li>• The platform does not determine or guarantee participant WIOA eligibility.</li>
              <li>• The platform does not guarantee that an agency will authorize or reimburse tuition.</li>
              <li>• The platform does not guarantee performance-indicator outcomes.</li>
              <li>• A report cannot be considered accurate when required source data is missing or incorrect.</li>
              <li>• Governing agency instructions and review requirements control the final submission process.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-blue-800 py-16 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-3xl font-black">Evaluate the Workflow Against Your Reporting Requirements</h2>
          <p className="mx-auto mt-4 max-w-2xl text-blue-100">Bring your required fields, reporting format, authorization controls, and acceptance criteria. The review should prove the workflow with actual records rather than rely on a feature list.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/store/demos" className="inline-flex items-center gap-2 rounded-lg bg-white px-8 py-4 font-bold text-blue-800 hover:bg-blue-50">Request Demo <ArrowRight className="h-5 w-5" /></Link>
            <Link href="/contact" className="rounded-lg border border-white/30 px-8 py-4 font-bold text-white hover:bg-white/10">Contact Sales</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
