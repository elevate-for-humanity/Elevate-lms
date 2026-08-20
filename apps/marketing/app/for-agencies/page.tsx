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
    'WorkOne case managers, DWD staff, and workforce boards: participant tracking, workforce documentation, credential records, employer-placement reporting, and registered-apprenticeship workflows in one system.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/for-agencies' },
};

const COMPLIANCE = [
  { label: 'DOL Registered Apprenticeship Sponsor', href: '/programs/apprenticeships' },
  { label: 'Program-Specific ETPL Listings', href: '/funding/how-it-works' },
  { label: 'Program and Participant Funding Eligibility Varies', href: '/funding/how-it-works#wioa' },
  { label: 'WorkOne Referral Coordination', href: '/apply' },
  { label: 'RAPIDS-Tracked Apprenticeship Activity', href: '/contact' },
  { label: 'SAM.gov Registered — CAGE: 0Q856', href: '/about' },
];

const HOW_IT_WORKS = [
  {
    step: '1',
    title: 'Refer Your Client',
    desc: 'Send clients to the application flow or contact our team. Agency referrals and direct applications enter the same documented intake workflow.',
    icon: Users,
  },
  {
    step: '2',
    title: 'Coordinate Eligibility Documentation',
    desc: 'Our enrollment team helps gather program and participant documentation. WorkOne or the responsible agency determines eligibility and authorizes funding.',
    icon: ClipboardList,
  },
  {
    step: '3',
    title: 'Training Begins After Authorization',
    desc: 'Once enrollment and any required funding authorization are complete, attendance, progress, and configured milestones can be tracked in the platform.',
    icon: TrendingUp,
  },
  {
    step: '4',
    title: 'Document Outcomes',
    desc: 'Authorized staff can maintain available credential, placement, wage, and registered-apprenticeship records for reporting workflows.',
    icon: FileText,
  },
];

export default async function ForAgenciesPage() {
  // PUBLIC ROUTE: agency-facing marketing page — no auth required.
  // Use public client; a Supabase failure renders the page without fabricated metrics.
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
    // Supabase unavailable — render static content without invented fallback counts.
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Agencies', href: '/agencies' }, { label: 'Refer Clients' }]} />
        </div>
      </div>

      <section className="relative h-[280px] sm:h-[360px] overflow-hidden">
        <Image src="/images/pages/government-1.webp" alt="Workforce agency partnership" fill sizes="100vw" className="object-cover" priority />
        <div className="absolute inset-0 bg-slate-900/60" />
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-4xl mx-auto px-4 pb-10 w-full">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-red-400 mb-2">For WorkOne, DWD &amp; Case Managers</p>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">Refer Clients to Career Training</h1>
            <p className="text-slate-200 text-lg max-w-2xl">
              Program-specific funding records and RAPIDS-tracked apprenticeship activity support enrollment, training, and outcome reporting. The responsible agency controls participant eligibility and funding authorization.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-slate-900 py-6 px-4">
        <div className="max-w-5xl mx-auto flex flex-wrap justify-center gap-8 text-center">
          <div><p className="text-3xl font-extrabold text-white">{totalEnrollments ?? '—'}</p><p className="text-slate-400 text-sm mt-1">Active Enrollments</p></div>
          <div><p className="text-3xl font-extrabold text-white">{completedEnrollments ?? '—'}</p><p className="text-slate-400 text-sm mt-1">Program Completions</p></div>
          <div><p className="text-3xl font-extrabold text-white">{programs?.length ?? '—'}</p><p className="text-slate-400 text-sm mt-1">Current Program Listings</p></div>
          <div><p className="text-3xl font-extrabold text-white">Agency</p><p className="text-slate-400 text-sm mt-1">Funding Coordination</p></div>
        </div>
      </section>

      <section className="py-14 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">Compliance &amp; Evidence</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {COMPLIANCE.map((item) => (
              <Link key={item.label} href={item.href} className="flex items-start gap-3 rounded-xl border border-slate-200 p-4 hover:bg-slate-50 transition">
                <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <span className="text-sm font-medium text-slate-800">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 px-4 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">How Referrals Work</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.step} className="bg-white rounded-xl border border-slate-200 p-6">
                  <div className="w-8 h-8 rounded-full bg-brand-red-600 text-white text-sm font-bold flex items-center justify-center mb-4">{step.step}</div>
                  <Icon className="w-6 h-6 text-slate-400 mb-3" />
                  <h3 className="font-bold text-slate-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-slate-600">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {programs && programs.length > 0 && (
        <section className="py-14 px-4 bg-white">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-slate-900">Current Training Programs</h2>
              <Link href="/programs" className="text-sm font-semibold text-brand-red-600 hover:underline flex items-center gap-1">All programs <ArrowRight className="w-4 h-4" /></Link>
            </div>
            <p className="mb-6 text-sm text-slate-600">Program publication here does not establish ETPL status or participant funding eligibility. Use the program evidence and responsible agency records for those determinations.</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {programs.map((p) => (
                <Link key={p.id} href={`/programs/${p.slug}`} className="block rounded-xl border border-slate-200 p-4 hover:shadow-md hover:-translate-y-0.5 transition-all">
                  <p className="text-xs font-semibold text-brand-red-600 uppercase tracking-wide mb-1">{p.credential_type ?? 'Certificate'}</p>
                  <h3 className="font-bold text-slate-900 text-sm leading-snug">{p.title}</h3>
                  {p.short_description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{p.short_description}</p>}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <WorkforceSystemDiagram />

      <section className="py-16 px-4 bg-white border-t border-slate-100">
        <div className="max-w-6xl mx-auto">
          <p className="text-brand-red-600 text-xs font-bold uppercase tracking-widest text-center mb-3">What the system does</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 text-center mb-4">Built for workforce operations and evidence.</h2>
          <p className="text-slate-500 text-sm text-center max-w-2xl mx-auto mb-12">The platform connects intake, training, credential records, employer activity, and reporting documentation while preserving the responsible agency&apos;s authority over eligibility and funding.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: <ClipboardList className="w-6 h-6 text-brand-red-600" />, title: 'Workforce Documentation', body: 'Eligibility documentation, IEP-aligned records, and registered-apprenticeship data support authorized case management and audit preparation.' },
              { icon: <TrendingUp className="w-6 h-6 text-brand-red-600" />, title: 'Progress Reporting', body: 'Authorized users can review available enrollment status, lesson completion, checkpoint results, and credential records.' },
              { icon: <CheckCircle className="w-6 h-6 text-brand-red-600" />, title: 'Credential Verification', body: 'Configured credential records can be checked through verification workflows when a verification record is available.' },
              { icon: <Building2 className="w-6 h-6 text-brand-red-600" />, title: 'Employer Activity Tracking', body: 'Configured OJT, work-experience, apprenticeship-hour, placement, and wage records can be maintained for authorized reporting.' },
              { icon: <Users className="w-6 h-6 text-brand-red-600" />, title: 'Cohort & Attendance Management', body: 'Schedule cohorts, track attendance, and manage instructor assignments tied to participant records.' },
              { icon: <FileText className="w-6 h-6 text-brand-red-600" />, title: 'Funding Documentation', body: 'Funding-source and authorization records can be maintained per participant with exportable documentation where configured.' },
            ].map((item) => (
              <div key={item.title} className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                <div className="mb-3">{item.icon}</div><h3 className="font-bold text-slate-900 text-sm mb-2">{item.title}</h3><p className="text-slate-500 text-xs leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-slate-950">
        <div className="max-w-5xl mx-auto">
          <p className="text-brand-red-400 text-xs font-bold uppercase tracking-widest text-center mb-3">Agency visibility</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white text-center mb-4">Participant records. Outcomes. Reports.</h2>
          <p className="text-slate-400 text-sm text-center max-w-xl mx-auto mb-12">Authorized workforce users can receive a dedicated view of configured participant and program records.</p>
          <div className="grid sm:grid-cols-2 gap-4 mb-10">
            {[
              { label: 'Participant enrollment status', detail: 'Available active, completed, and withdrawn status records' },
              { label: 'Lesson and checkpoint progress', detail: 'Available completion, activity, and assessment records' },
              { label: 'Credential records', detail: 'Available issue date, credential type, and verification data' },
              { label: 'Employer placement', detail: 'Available employer, job, start-date, and wage records' },
              { label: 'Funding source per participant', detail: 'Funding-source and authorization records maintained per participant' },
              { label: 'Attendance and cohort records', detail: 'Session dates, logged hours, and sign-off records' },
              { label: 'Role-based data access', detail: 'Role controls, consent records, and audit logging where configured' },
              { label: 'Exportable outcome reports', detail: 'CSV and PDF reporting workflows for authorized operational use' },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3 bg-slate-900 border border-slate-800 rounded-lg px-5 py-4">
                <CheckCircle className="w-4 h-4 text-brand-red-400 mt-0.5 shrink-0" />
                <div><p className="text-white text-sm font-semibold">{item.label}</p><p className="text-slate-400 text-xs mt-0.5">{item.detail}</p></div>
              </div>
            ))}
          </div>
          <div className="text-center"><Link href="/apply" className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-3.5 rounded-lg transition-colors text-sm"><Users className="w-4 h-4" /> Refer a Client <ArrowRight className="w-4 h-4" /></Link></div>
        </div>
      </section>

      <section className="py-14 px-4 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-10 items-start">
          <div className="flex-1">
            <Building2 className="w-8 h-8 text-brand-red-400 mb-4" />
            <h2 className="text-2xl font-bold mb-3">Ready to Refer a Client?</h2>
            <p className="text-slate-300 mb-6">Contact our agency liaison or send clients to the enrollment page. Agency timelines and authorization requirements remain controlled by the responsible agency.</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/apply" className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-red-600 px-6 py-3 font-semibold text-white hover:bg-brand-red-700 transition"><Users className="w-4 h-4" /> Send Client to Enrollment</Link>
              <a href="mailto:agencies@elevateforhumanity.org" className="inline-flex items-center justify-center gap-2 rounded-lg border border-white px-6 py-3 font-semibold text-white hover:bg-white/10 transition"><Mail className="w-4 h-4" /> Email Agency Liaison</a>
            </div>
          </div>
          <div className="w-full md:w-64 bg-slate-800 rounded-xl p-6 shrink-0">
            <h3 className="font-bold text-white mb-4">Agency Contacts</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2 text-slate-300"><Phone className="w-4 h-4 text-brand-red-400 shrink-0" /><a href="tel:+13173143757" className="hover:text-white">(317) 314-3757</a></li>
              <li className="flex items-center gap-2 text-slate-300"><Mail className="w-4 h-4 text-brand-red-400 shrink-0" /><a href="mailto:agencies@elevateforhumanity.org" className="hover:text-white break-all">agencies@elevateforhumanity.org</a></li>
              <li className="flex items-center gap-2 text-slate-300"><FileText className="w-4 h-4 text-brand-red-400 shrink-0" /><Link href="/agencies" className="hover:text-white">Full agency overview</Link></li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
