import { Metadata } from 'next';
import Link from 'next/link';
import {
  Building2,
  Users,
  BarChart,
  FileText,
  CheckCircle,
  Globe,
  Award,
  TrendingUp,
  Shield,
  DollarSign,
} from 'lucide-react';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/platform/workforce-boards',
  },
  title: 'Workforce Board Platform | Elevate For Humanity',
  description:
    'Explore workforce-board case management, participant tracking, provider management, reporting, and integration capabilities available through the Elevate platform.',
};

const PORTAL_FEATURES = [
  {
    icon: Users,
    title: 'Participant Management',
    description:
      'Organize participant records, assignments, eligibility documentation, services, and outcomes in a shared workforce workflow.',
  },
  {
    icon: FileText,
    title: 'Case Management',
    description:
      'Maintain case records, notes, service history, follow-up activity, and supporting documentation in one operational workspace.',
  },
  {
    icon: BarChart,
    title: 'Performance Reporting',
    description:
      'Structure dashboards and reports around employment, earnings, credential attainment, measurable skill gains, and other configured indicators.',
  },
  {
    icon: Building2,
    title: 'Provider Management',
    description:
      'Maintain provider records, program relationships, training activity, and outcome information across participating organizations.',
  },
  {
    icon: DollarSign,
    title: 'Financial Tracking',
    description:
      'Support tracking for participant services, training obligations, supportive services, and other configured workforce expenditures.',
  },
  {
    icon: Shield,
    title: 'Compliance Workflows',
    description:
      'Create repeatable documentation, review, reporting, and audit workflows. Final compliance remains subject to the applicable agency and funding rules.',
  },
];

const WIOA_PROGRAMS = [
  { name: 'Adult Program', description: 'Workflow support for adult employment and training services.' },
  { name: 'Dislocated Worker', description: 'Workflow support for dislocated-worker services.' },
  { name: 'Youth Program', description: 'Workflow support for in-school and out-of-school youth services.' },
  { name: 'Grant Programs', description: 'Configurable workflows for additional workforce grants and initiatives.' },
];

const PERFORMANCE_INDICATORS = [
  { metric: 'Employment Rate Q2', description: 'Employment in the second quarter after exit.' },
  { metric: 'Employment Rate Q4', description: 'Employment in the fourth quarter after exit.' },
  { metric: 'Median Earnings Q2', description: 'Median earnings in the second quarter after exit.' },
  { metric: 'Credential Attainment', description: 'Credential attainment within the applicable reporting window.' },
  { metric: 'Measurable Skill Gains', description: 'Documented progress toward skill or educational goals.' },
  { metric: 'Employer Measures', description: 'Configured employer-engagement and effectiveness measures.' },
];

const INTEGRATION_CAPABILITIES = [
  'API and import/export workflows for external workforce systems',
  'Configurable eligibility and documentation workflows',
  'Reporting exports that can be mapped to required data specifications',
  'Scheduled and on-demand operational reporting',
  'PIRL-oriented data mapping where configured and validated',
];

export default function WorkforceBoardsPage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 text-white">
        <div className="absolute inset-0 bg-[url('/images/patterns/grid.svg')] opacity-5" />
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-20">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-500/20 px-4 py-2 text-sm font-medium text-blue-300 backdrop-blur">
                <Building2 className="h-4 w-4" />
                <span>For Workforce Boards & Agencies</span>
              </div>
              <h1 className="mb-6 text-4xl font-black md:text-5xl lg:text-6xl">
                Workforce Operations Platform
              </h1>
              <p className="mb-8 text-xl leading-relaxed text-slate-300">
                A configurable workforce-management environment for participant records, case workflows,
                provider relationships, reporting, and agency operations.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/workforce-board/dashboard"
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-4 font-bold text-white shadow-lg transition hover:bg-blue-700"
                >
                  Access Portal
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-8 py-4 font-bold text-white backdrop-blur transition hover:bg-white/20"
                >
                  Request Demo
                </Link>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="rounded-2xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-200">Illustrative Product Preview</p>
                    <p className="text-xl font-black text-white">Workforce Dashboard</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="rounded-xl bg-white p-5 text-slate-900">
                  <p className="text-xs font-bold uppercase tracking-wide text-blue-700">Demo interface</p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    Numbers shown in product demonstrations are sample data unless a page explicitly identifies
                    a metric as a verified Elevate result and provides its reporting period or source.
                  </p>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {[
                    { icon: Users, label: 'Participants' },
                    { icon: Award, label: 'Credentials' },
                    { icon: TrendingUp, label: 'Outcomes' },
                    { icon: BarChart, label: 'Reporting' },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="rounded-xl bg-white/10 p-3">
                      <Icon className="mb-2 h-5 w-5 text-blue-200" />
                      <p className="text-sm font-bold text-white">{label}</p>
                      <p className="text-xs text-blue-100">Configured by tenant</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-black text-slate-900 md:text-4xl">Workforce Management Capabilities</h2>
            <p className="mx-auto max-w-3xl text-xl text-slate-600">
              The platform is designed to connect operational workflows without presenting demo data as production outcomes.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {PORTAL_FEATURES.map((feature) => {
              const IconComponent = feature.icon;
              return (
                <div key={feature.title} className="rounded-2xl bg-slate-50 p-8 transition hover:shadow-lg">
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-100">
                    <IconComponent className="h-7 w-7 text-blue-600" />
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-slate-900">{feature.title}</h3>
                  <p className="text-slate-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-black text-slate-900 md:text-4xl">WIOA-Oriented Workflows</h2>
            <p className="mx-auto max-w-3xl text-xl text-slate-600">
              Program configuration and reporting requirements vary by grant, state, local board, and contract.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {WIOA_PROGRAMS.map((program) => (
              <div key={program.name} className="rounded-xl border border-slate-200 bg-white p-6 transition hover:border-blue-300 hover:shadow-md">
                <h3 className="mb-2 text-lg font-bold text-slate-900">{program.name}</h3>
                <p className="text-sm text-slate-600">{program.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-black text-slate-900 md:text-4xl">Performance Indicator Support</h2>
            <p className="mx-auto max-w-3xl text-xl text-slate-600">
              These are reporting categories the platform can support—not Elevate performance results or universal target values.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {PERFORMANCE_INDICATORS.map((item) => (
              <div key={item.metric} className="rounded-xl border border-slate-200 bg-white p-6">
                <h3 className="mb-2 font-bold text-slate-900">{item.metric}</h3>
                <p className="text-sm text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-900 py-20 text-white">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="mb-6 text-3xl font-black md:text-4xl">Integration-Ready Architecture</h2>
              <p className="mb-8 text-lg text-slate-300">
                External agency integrations are enabled only after the required system access, data-sharing permissions,
                credentials, specifications, and validation are in place.
              </p>
              <div className="space-y-4">
                {INTEGRATION_CAPABILITIES.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle className="mt-0.5 h-6 w-6 flex-shrink-0 text-green-400" />
                    <span className="text-slate-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl border border-slate-600 bg-slate-800 p-6">
              <div className="mb-4 flex items-center justify-between border-b border-slate-700 pb-4">
                <div>
                  <p className="text-sm text-slate-400">Connector Status</p>
                  <h3 className="text-lg font-bold text-white">Configured Per Deployment</h3>
                </div>
                <Globe className="h-6 w-6 text-slate-400" />
              </div>
              <p className="text-sm leading-relaxed text-slate-300">
                This public page does not represent a state MIS, wage-record system, unemployment-insurance system,
                or PIRL feed as connected unless that integration has been separately implemented and validated for the customer deployment.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-br from-blue-600 to-indigo-700 py-20 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="mb-6 text-3xl font-black md:text-4xl">Evaluate the Platform for Your Workforce Operation</h2>
          <p className="mb-8 text-xl text-blue-100">
            Review the workflows, required integrations, data model, security requirements, and reporting needs for your organization.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/contact" className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 font-bold text-blue-600 transition hover:bg-blue-50">
              Schedule a Demo
            </Link>
            <Link href="/for-agencies" className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-blue-500/30 px-8 py-4 font-bold text-white transition hover:bg-blue-500/40">
              Agency Information
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
