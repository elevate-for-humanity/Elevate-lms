import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createPublicClient } from '@/lib/supabase/public';
import {
  CheckCircle,
  ArrowRight,
  Phone,
  Mail,
  FileText,
  Users,
  TrendingUp,
  ClipboardList,
  Building2,
} from 'lucide-react';
import { WorkforceSystemDiagram } from '@/components/marketing/WorkforceSystemDiagram';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'For Workforce Agencies | Elevate for Humanity',
  description:
    'WorkOne case managers, DWD staff, and workforce boards: real-time participant tracking, WIOA documentation, credential verification, employer placement reporting, and RAPIDS-compatible outcomes — all in one system.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/for-agencies' },
};

const COMPLIANCE = [
  { label: 'DOL Registered Apprenticeship Sponsor', href: '/programs/apprenticeships' },
  { label: 'Indiana ETPL Certified Provider', href: '/funding/how-it-works' },
  { label: 'WIOA / WRG / JRI / Job Ready Indy Approved', href: '/funding/how-it-works#wioa' },
  { label: 'WorkOne Referrals Accepted', href: '/apply' },
  { label: 'RAPIDS-Tracked Outcomes', href: '/contact' },
  { label: 'SAM.gov Registered — CAGE: 0Q856', href: '/about' },
];

const HOW_IT_WORKS = [
  {
    step: '1',
    title: 'Refer Your Client',
    desc: 'Send clients to /apply or call us directly. We accept WorkOne referrals, FSSA IMPACT referrals, and direct walk-ins.',
    icon: Users,
  },
  {
    step: '2',
    title: 'We Handle Eligibility',
    desc: 'Our enrollment team screens for WIOA, WRG, and program-specific eligibility. We notify you of the outcome.',
    icon: ClipboardList,
  },
  {
    step: '3',
    title: 'Training Begins',
    desc: 'Clients enroll in their approved program. Attendance, progress, and milestones are tracked in real time.',
    icon: TrendingUp,
  },
  {
    step: '4',
    title: 'Outcomes Reported',
    desc: 'Placement, credential attainment, and wage data reported back to your agency. RAPIDS entries completed.',
    icon: FileText,
  },
];

export default async function ForAgenciesPage() {
  // PUBLIC ROUTE: agency-facing marketing page — no auth required.
  // Use public client; wrap in try/catch so a Supabase timeout never
  // crashes this high-value page.
  const db = createPublicClient();

  let programs: { id: string; title: string; slug: string; short_description: string | null; credential_type: string | null }[] | null = null;
  let totalEnrollments: number | null = null;
  let completedEnrollments: number | null = null;

  try {
    const [progRes, enrollRes, completedRes] = await Promise.all([
      db.from('programs').select('id, title, slug, short_description, credential_type')
        .eq('published', true).eq('is_active', true).order('title').limit(8),
      db.from('program_enrollments').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      db.from('program_enrollments').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
    ]);
    programs = progRes.data;
    totalEnrollments = enrollRes.count;
    completedEnrollments = completedRes.count;
  } catch {
    // Supabase unavailable — render static fallback content
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs
            items={[{ label: 'Agencies', href: '/agencies' }, { label: 'Refer Clients' }]}
          />
        </div>
      </div>

      {/* Hero */}
      <section className="relative h-[280px] sm:h-[360px] overflow-hidden">
        <Image
          src="/images/pages/government-1.webp"
          alt="Workforce agency partnership"
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-slate-900/60" />
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-4xl mx-auto px-4 pb-10 w-full">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-red-400 mb-2">
              For WorkOne, DWD &amp; Case Managers
            </p>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
              Refer Clients to Funded Career Training
            </h1>
            <p className="text-slate-200 text-lg max-w-2xl">
              ETPL-approved. WIOA-funded. RAPIDS-tracked. We handle enrollment, training, and
              outcome reporting — you focus on your clients.
            </p>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-slate-900 py-6 px-4">
        <div className="max-w-5xl mx-auto flex flex-wrap justify-center gap-8 text-center">
          <div>
            <p className="text-3xl font-extrabold text-white">{totalEnrollments ?? '500'}+</p>
            <p className="text-slate-400 text-sm mt-1">Active Enrollments</p>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-white">{completedEnrollments ?? '300'}+</p>
            <p className="text-slate-400 text-sm mt-1">Program Completions</p>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-white">{programs?.length ?? 20}+</p>
            <p className="text-slate-400 text-sm mt-1">ETPL-Approved Programs</p>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-white">WIOA</p>
            <p className="text-slate-400 text-sm mt-1">Funding Accepted</p>
          </div>
        </div>
      </section>

      {/* Compliance credentials */}
      <section className="py-14 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">Compliance &amp; Credentials</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {COMPLIANCE.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-start gap-3 rounded-xl border border-slate-200 p-4 hover:bg-slate-50 transition"
              >
                <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <span className="text-sm font-medium text-slate-800">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How referrals work */}
      <section className="py-14 px-4 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">How Referrals Work</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.step} className="bg-white rounded-xl border border-slate-200 p-6">
                  <div className="w-8 h-8 rounded-full bg-brand-red-600 text-white text-sm font-bold flex items-center justify-center mb-4">
                    {step.step}
                  </div>
                  <Icon className="w-6 h-6 text-slate-400 mb-3" />
                  <h3 className="font-bold text-slate-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-slate-600">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Available programs */}
      {programs && programs.length > 0 && (
        <section className="py-14 px-4 bg-white">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-slate-900">ETPL-Approved Programs</h2>
              <Link
                href="/programs"
                className="text-sm font-semibold text-brand-red-600 hover:underline flex items-center gap-1"
              >
                All programs <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {programs.map((p) => (
                <Link
                  key={p.id}
                  href={`/programs/${p.slug}`}
                  className="block rounded-xl border border-slate-200 p-4 hover:shadow-md hover:-translate-y-0.5 transition-all"
                >
                  <p className="text-xs font-semibold text-brand-red-600 uppercase tracking-wide mb-1">
                    {p.credential_type ?? 'Certificate'}
                  </p>
                  <h3 className="font-bold text-slate-900 text-sm leading-snug">{p.title}</h3>
                  {p.short_description && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {p.short_description}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* SYSTEM DIAGRAM */}
      <WorkforceSystemDiagram />

      {/* PLATFORM CAPABILITIES */}
      <section className="py-16 px-4 bg-white border-t border-slate-100">
        <div className="max-w-6xl mx-auto">
          <p className="text-brand-red-600 text-xs font-bold uppercase tracking-widest text-center mb-3">
            What the system does
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 text-center mb-4">
            Built for how workforce agencies actually operate.
          </h2>
          <p className="text-slate-500 text-sm text-center max-w-2xl mx-auto mb-12">
            Most training providers hand you a completion certificate and walk away. Elevate runs
            the full cycle — intake, training, credentialing, placement, and the documentation your
            agency needs for reporting.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <ClipboardList className="w-6 h-6 text-brand-red-600" />,
                title: 'WIOA Documentation',
                body: 'Eligibility verification, IEP alignment, and RAPIDS-compatible outcome tracking. Every participant record is audit-ready.',
              },
              {
                icon: <TrendingUp className="w-6 h-6 text-brand-red-600" />,
                title: 'Real-Time Progress Reporting',
                body: 'Case managers can see enrollment status, lesson completion, checkpoint scores, and credential issuance — without calling us.',
              },
              {
                icon: <CheckCircle className="w-6 h-6 text-brand-red-600" />,
                title: 'Credential Verification',
                body: 'Every certificate issued is publicly verifiable. Employers and agencies can confirm credentials instantly via a unique verification link.',
              },
              {
                icon: <Building2 className="w-6 h-6 text-brand-red-600" />,
                title: 'Employer Placement Tracking',
                body: 'OJT agreements, WEX placements, and apprenticeship hours are tracked in the system. Wage outcomes are recorded at placement.',
              },
              {
                icon: <Users className="w-6 h-6 text-brand-red-600" />,
                title: 'Cohort & Attendance Management',
                body: 'Schedule cohorts, track attendance, and manage instructor assignments — all tied to the participant record.',
              },
              {
                icon: <FileText className="w-6 h-6 text-brand-red-600" />,
                title: 'Funding Documentation',
                body: 'WIOA, Workforce Ready Grant, FSSA IMPACT, and Job Ready Indy funding is tracked per participant with exportable documentation.',
              },
            ].map((item) => (
              <div key={item.title} className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                <div className="mb-3">{item.icon}</div>
                <h3 className="font-bold text-slate-900 text-sm mb-2">{item.title}</h3>
                <p className="text-slate-500 text-xs leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT AGENCIES SEE */}
      <section className="py-16 px-4 bg-slate-950">
        <div className="max-w-5xl mx-auto">
          <p className="text-brand-red-400 text-xs font-bold uppercase tracking-widest text-center mb-3">
            Agency visibility
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white text-center mb-4">
            Your clients. Your outcomes. Your reports.
          </h2>
          <p className="text-slate-400 text-sm text-center max-w-xl mx-auto mb-12">
            Workforce boards and case managers get a dedicated view — not a generic training portal.
            Here's what's visible from day one.
          </p>
          <div className="grid sm:grid-cols-2 gap-4 mb-10">
            {[
              {
                label: 'Participant enrollment status',
                detail: 'Active, completed, withdrawn — updated in real time',
              },
              {
                label: 'Lesson and checkpoint progress',
                detail: 'Percentage complete, last activity, pass/fail on assessments',
              },
              {
                label: 'Credential issuance',
                detail: 'Date issued, credential type, verification link',
              },
              {
                label: 'Employer placement',
                detail: 'Employer name, job title, start date, hourly wage',
              },
              {
                label: 'Funding source per participant',
                detail: 'WIOA, WRG, IMPACT, or self-pay — tracked per record',
              },
              {
                label: 'Attendance and cohort records',
                detail: 'Session dates, hours logged, instructor sign-off',
              },
              {
                label: 'FERPA-compliant data access',
                detail: 'Role-based access controls, consent tracking, audit log',
              },
              {
                label: 'Exportable outcome reports',
                detail: 'CSV and PDF exports formatted for DWD and RAPIDS submission',
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-start gap-3 bg-slate-900 border border-slate-800 rounded-lg px-5 py-4"
              >
                <CheckCircle className="w-4 h-4 text-brand-red-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-white text-sm font-semibold">{item.label}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center">
            <Link
              href="/apply"
              className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-3.5 rounded-lg transition-colors text-sm"
            >
              <Users className="w-4 h-4" /> Refer a Client Now <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Contact / refer CTA */}
      <section className="py-14 px-4 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-10 items-start">
          <div className="flex-1">
            <Building2 className="w-8 h-8 text-brand-red-400 mb-4" />
            <h2 className="text-2xl font-bold mb-3">Ready to Refer a Client?</h2>
            <p className="text-slate-300 mb-6">
              Contact our agency liaison directly or send clients to our enrollment page. We respond
              to agency inquiries within one business day.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/apply"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-red-600 px-6 py-3 font-semibold text-white hover:bg-brand-red-700 transition"
              >
                <Users className="w-4 h-4" /> Send Client to Enrollment
              </Link>
              <a
                href="mailto:agencies@elevateforhumanity.org"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white px-6 py-3 font-semibold text-white hover:bg-white/10 transition"
              >
                <Mail className="w-4 h-4" /> Email Agency Liaison
              </a>
            </div>
          </div>
          <div className="w-full md:w-64 bg-slate-800 rounded-xl p-6 shrink-0">
            <h3 className="font-bold text-white mb-4">Agency Contacts</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2 text-slate-300">
                <Phone className="w-4 h-4 text-brand-red-400 shrink-0" />
                <a href="tel:+13173143757" className="hover:text-white">
                  (317) 314-3757
                </a>
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <Mail className="w-4 h-4 text-brand-red-400 shrink-0" />
                <a
                  href="mailto:agencies@elevateforhumanity.org"
                  className="hover:text-white break-all"
                >
                  agencies@elevateforhumanity.org
                </a>
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <FileText className="w-4 h-4 text-brand-red-400 shrink-0" />
                <Link href="/agencies" className="hover:text-white">
                  Full agency overview
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
