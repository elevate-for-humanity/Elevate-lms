import type { Metadata } from 'next';
import Link from 'next/link';
import {
  GraduationCap,
  Users,
  Building2,
  CheckCircle,
  Brain,
  Zap,
  Shield,
  BarChart3,
  BookOpen,
  MessageSquare,
  FileText,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Platform Features',
  description:
    'Explore Elevate for Humanity workforce-platform capabilities for learners, employers, training providers, apprenticeship partners, and workforce teams.',
};

const PLATFORM_FEATURES = [
  {
    category: 'For Learners',
    icon: GraduationCap,
    features: [
      { title: 'Guided Career Intake', description: 'Structured intake and PARiS-assisted workflows help learners identify appropriate program pathways.' },
      { title: 'Online Learning', description: 'Access assigned coursework, assessments, progress records, and learning resources from the LMS.' },
      { title: 'Certification Preparation', description: 'Configured programs can align lessons and assessments to documented credential objectives.' },
      { title: 'Career Support', description: 'Resume, interview, application, and employment-support workflows can be coordinated from one platform.' },
    ],
  },
  {
    category: 'For Employers & Host Shops',
    icon: Building2,
    features: [
      { title: 'OJL Evidence', description: 'Record and review supervised on-the-job learning evidence tied to active placements.' },
      { title: 'RTI Records', description: 'Track verified related technical instruction records against the applicable program contract.' },
      { title: 'Apprentice Oversight', description: 'Review placements, competencies, attendance, documents, and wage requirements from role-based workspaces.' },
      { title: 'Partner Workflows', description: 'Maintain organization, supervisor, MOU, licensing, and other configured partner records.' },
    ],
  },
  {
    category: 'For Workforce & Training Teams',
    icon: Users,
    features: [
      { title: 'Funding Workflows', description: 'Track configured funding sources, eligibility records, approvals, and participant documentation.' },
      { title: 'Operational Reporting', description: 'Review enrollment, completion, apprenticeship, and program data from permission-controlled dashboards.' },
      { title: 'Partner Network', description: 'Coordinate learners, training providers, employers, host shops, and program staff in connected workflows.' },
      { title: 'Compliance Evidence', description: 'Audit logs, document records, role controls, and registered-program data support compliance review.' },
    ],
  },
];

const CORE_FEATURES = [
  { icon: Brain, title: 'PARiS AI Assistant', description: 'AI-assisted intake, content, support, and administrative workflows with controlled platform integrations.' },
  { icon: Zap, title: 'Workflow Automation', description: 'Reduce repeated administrative steps with server-side workflow and notification automation.' },
  { icon: Shield, title: 'Security Controls', description: 'Role-based access, audit logging, privileged-role MFA enforcement, RLS-protected data, and controlled service-role operations.' },
  { icon: BarChart3, title: 'Operational Analytics', description: 'Review current enrollment, progress, program, and platform records from permission-aware dashboards.' },
  { icon: BookOpen, title: 'Integrated LMS', description: 'Courses, lessons, assessments, progress, RTI-related learning records, and completion workflows share one data model.' },
  { icon: MessageSquare, title: 'CRM Workflows', description: 'Coordinate leads, applicants, communications, and follow-up activity in connected administrative tools.' },
  { icon: FileText, title: 'Digital Records', description: 'Keep participant documents, agreements, evidence, and credential records attached to the appropriate workflow.' },
  { icon: TrendingUp, title: 'Outcome Tracking', description: 'Track configured completion and employment-related records without presenting unsupported outcome guarantees.' },
];

const OPERATING_PRINCIPLES = [
  { value: 'Role-based', label: 'Access control' },
  { value: 'Auditable', label: 'Administrative actions' },
  { value: 'Integrated', label: 'LMS + workforce data' },
  { value: 'Evidence-led', label: 'Compliance claims' },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 py-24 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="mb-6 text-4xl font-bold md:text-5xl lg:text-6xl">A Connected Workforce Platform</h1>
            <p className="mb-8 text-xl text-blue-100 md:text-2xl">
              Recruit, enroll, train, document, support, and report through connected role-based workflows.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link href="/demo" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 font-bold text-brand-blue-700 transition-colors hover:bg-blue-50">
                View the Platform <ArrowRight className="h-5 w-5" />
              </Link>
              <Link href="/contact" className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white/30 px-8 py-4 font-bold text-white transition-colors hover:bg-white/10">
                Schedule a Walkthrough
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {OPERATING_PRINCIPLES.map((item) => (
              <div key={item.label} className="text-center">
                <div className="mb-2 text-3xl font-bold text-brand-blue-700 md:text-4xl">{item.value}</div>
                <div className="font-medium text-slate-600">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-slate-900">Platform Capabilities</h2>
            <p className="mx-auto max-w-2xl text-lg text-slate-600">
              Core tools are organized around real workforce, training, apprenticeship, and administrative workflows.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {CORE_FEATURES.map((feature) => {
              const IconComponent = feature.icon;
              return (
                <article key={feature.title} className="rounded-xl bg-white p-6 shadow-sm transition-shadow hover:shadow-lg">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-brand-blue-100">
                    <IconComponent className="h-6 w-6 text-brand-blue-600" />
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-slate-900">{feature.title}</h3>
                  <p className="text-sm leading-6 text-slate-600">{feature.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-slate-900">Built for Each Stakeholder</h2>
            <p className="mx-auto max-w-2xl text-lg text-slate-600">
              Permission-aware workspaces surface the records and actions appropriate to each role.
            </p>
          </div>
          <div className="space-y-16">
            {PLATFORM_FEATURES.map((category) => {
              const IconComponent = category.icon;
              return (
                <div key={category.category} className="grid items-center gap-12 lg:grid-cols-2">
                  <div>
                    <div className="mb-6 flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-blue-600">
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-900">{category.category}</h3>
                    </div>
                    <div className="space-y-6">
                      {category.features.map((feature) => (
                        <div key={feature.title} className="flex gap-4">
                          <CheckCircle className="mt-0.5 h-6 w-6 flex-shrink-0 text-green-600" />
                          <div>
                            <h4 className="mb-1 font-bold text-slate-900">{feature.title}</h4>
                            <p className="text-slate-600">{feature.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex aspect-video items-center justify-center rounded-2xl border border-slate-200 bg-slate-100">
                    <div className="p-8 text-center">
                      <IconComponent className="mx-auto mb-4 h-16 w-16 text-brand-blue-300" />
                      <p className="font-semibold text-slate-600">{category.category} workspace</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-slate-900 py-20 text-white">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <h2 className="mb-6 text-3xl font-bold">Integration-Ready Architecture</h2>
            <p className="mb-8 text-lg leading-8 text-slate-300">
              The platform uses authenticated APIs, webhooks, and service integrations for configured payment, scheduling, communication, data, and workforce workflows.
            </p>
            <div className="grid grid-cols-2 gap-4 text-slate-300">
              {['Payments', 'Scheduling', 'Email & messaging', 'Workforce data', 'Credential workflows', 'Custom integrations'].map((integration) => (
                <div key={integration} className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span>{integration}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl bg-slate-800 p-8">
            <h3 className="mb-4 text-lg font-bold">Controlled API Access</h3>
            <p className="mb-6 text-slate-400">Administrative APIs and service integrations are protected by role, authentication, and server-side authorization boundaries.</p>
            <Link href="/contact" className="inline-flex items-center gap-2 text-brand-blue-300 hover:text-brand-blue-200">
              Discuss an integration <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-brand-blue-700 py-20 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="mb-6 text-3xl font-bold md:text-4xl">Evaluate the Platform Against Your Workflow</h2>
          <p className="mb-8 text-xl text-blue-100">Review the actual role-based workflows, controls, and integrations your organization would use.</p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/demo" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 font-bold text-brand-blue-700 hover:bg-blue-50">
              Request a Demo <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/contact" className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white px-8 py-4 font-bold text-white hover:bg-white/10">
              Talk to the Team
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
