export const dynamic = 'force-static';

import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { Workflow, ArrowRight, CheckCircle, Zap } from 'lucide-react';
import { getAdminUrl } from '@/lib/config/admin-url';
import PictureFirstPageHero from '@/components/site/PictureFirstPageHero';

export const metadata: Metadata = {
  title: 'Workflow Studio',
  description: 'Visual workflow automation for enrollment pipelines, compliance tasks, notifications, and business processes.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/store/workflow-studio' },
};

const triggers = [
  { name: 'Form Submission', desc: 'Start a workflow when an application or form is submitted.' },
  { name: 'Payment Received', desc: 'Continue a workflow after a verified payment event.' },
  { name: 'Document Uploaded', desc: 'Respond to a document or evidence upload.' },
  { name: 'Schedule Event', desc: 'Run time-based workflow steps.' },
  { name: 'Webhook', desc: 'Receive an approved external system event.' },
];

const actions = [
  { name: 'Send Email', desc: 'Send a workflow email or notification.' },
  { name: 'Create Record', desc: 'Create a supported platform record.' },
  { name: 'Update Status', desc: 'Move a record to the next verified state.' },
  { name: 'Notify Team', desc: 'Surface work that requires staff attention.' },
  { name: 'Generate Document', desc: 'Create approved workflow documents.' },
  { name: 'API Call', desc: 'Call an approved connected service.' },
];

const templates = [
  { name: 'Student Enrollment', desc: 'Application, review, approval, onboarding, and enrollment steps.' },
  { name: 'Payment Processing', desc: 'Payment confirmation and post-payment fulfillment.' },
  { name: 'Credential Issuance', desc: 'Completion review and credential-processing steps.' },
  { name: 'Compliance Alerts', desc: 'Surface missing, expiring, or review-required records.' },
];

export default function WorkflowStudioPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-4">
        <Breadcrumbs items={[{ label: 'Store', href: '/store' }, { label: 'Workflow Studio' }]} />
      </div>

      <PictureFirstPageHero
        image="/images/micro-classes-hero.webp"
        alt="Workflow automation studio interface"
        eyebrow="Workflow Studio"
        title="Automate Business Processes"
        description="Build enrollment, compliance, notification, and operational workflows without placing marketing copy over the hero image."
        actions={(
          <>
            <a href={getAdminUrl('/studio/workflows')} className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-red-600 px-8 py-4 font-bold text-white transition-colors hover:bg-brand-red-700">Open Workflow Studio <ArrowRight className="h-5 w-5" /></a>
            <Link href="#templates" className="inline-flex items-center justify-center rounded-xl border-2 border-slate-300 bg-white px-8 py-4 font-bold text-slate-900 transition-colors hover:border-slate-500">View Templates</Link>
          </>
        )}
      />

      <section className="px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-900 px-4 py-3">
              <span className="h-3 w-3 rounded-full bg-red-400" />
              <span className="h-3 w-3 rounded-full bg-yellow-400" />
              <span className="h-3 w-3 rounded-full bg-green-400" />
              <span className="ml-2 text-xs font-semibold text-slate-300">Workflow Builder</span>
            </div>
            <div className="p-6">
              <p className="font-bold text-slate-950">Example: Student Enrollment Pipeline</p>
              <div className="mt-5 flex flex-wrap items-center gap-2">
                {['Application', 'Validate', 'Review', 'Enroll', 'Onboard'].map((label, index, list) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-800">{label}</span>
                    {index < list.length - 1 ? <ArrowRight className="h-4 w-4 text-slate-400" /> : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-slate-950">Build in Three Steps</h2>
            <p className="text-lg text-slate-700">Choose a trigger, add supported actions, then activate and review the workflow.</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              { step: 1, icon: Zap, title: 'Choose Trigger', desc: 'Start from a supported form, payment, upload, schedule, or webhook event.' },
              { step: 2, icon: Workflow, title: 'Add Steps', desc: 'Configure conditions and supported actions without duplicating business logic.' },
              { step: 3, icon: CheckCircle, title: 'Activate', desc: 'Turn on the workflow and review its execution and exception handling.' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <item.icon className="mx-auto mb-4 h-10 w-10 text-orange-600" />
                <span className="text-sm font-bold text-orange-700">Step {item.step}</span>
                <h3 className="mt-2 text-xl font-bold text-slate-950">{item.title}</h3>
                <p className="mt-3 text-slate-700">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 px-4 py-16">
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2">
          <div>
            <h3 className="mb-6 text-2xl font-bold text-slate-950">Triggers</h3>
            <div className="space-y-3">
              {triggers.map((item) => (
                <div key={item.name} className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="font-bold text-slate-950">{item.name}</p>
                  <p className="mt-1 text-sm text-slate-700">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="mb-6 text-2xl font-bold text-slate-950">Actions</h3>
            <div className="space-y-3">
              {actions.map((item) => (
                <div key={item.name} className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="font-bold text-slate-950">{item.name}</p>
                  <p className="mt-1 text-sm text-slate-700">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="templates" className="px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-slate-950">Workflow Templates</h2>
            <p className="text-lg text-slate-700">Use templates as starting structures; actual execution depends on the configured platform integrations and permissions.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {templates.map((template) => (
              <div key={template.name} className="rounded-xl border border-slate-200 bg-white p-6">
                <Workflow className="mb-4 h-8 w-8 text-orange-600" />
                <h3 className="font-bold text-slate-950">{template.name}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-700">{template.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 px-4 py-16 text-white">
        <div className="mx-auto max-w-3xl text-center">
          <Workflow className="mx-auto mb-6 h-12 w-12 text-orange-400" />
          <h2 className="text-3xl font-bold">Ready to automate?</h2>
          <p className="mt-4 text-lg text-slate-300">Open the Admin Workflow Studio to work with the actual platform workflow tools.</p>
          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <a href={getAdminUrl('/studio/workflows')} className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-red-600 px-8 py-4 font-bold text-white hover:bg-brand-red-700">Open Workflow Studio <ArrowRight className="h-5 w-5" /></a>
            <Link href="/store/trial" className="inline-flex items-center justify-center rounded-xl border border-slate-600 px-8 py-4 font-bold text-white hover:bg-slate-800">Start Trial</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
