import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createPublicClient } from '@/lib/supabase/public';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import {
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Phone,
  FileText,
  Users,
  ClipboardList,
  Building2,
  Mail,
} from 'lucide-react';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'SNAP E&T Partner Agency',
  description:
    "Refer SNAP recipients to ETPL-approved career training through Indiana's SNAP E&T (IMPACT) program. Case manager and agency partner information.",
  alternates: { canonical: 'https://www.elevateforhumanity.org/snap-et-partner' },
};

const ELIGIBLE_PROGRAMS = [
  { title: 'HVAC Technician', slug: 'hvac-technician', hours: '160 hrs', credential: 'EPA 608' },
  { title: 'CNA / Healthcare', slug: 'cna', hours: '120 hrs', credential: 'State CNA License' },
  {
    title: 'Barber Apprenticeship',
    slug: 'barber-apprenticeship',
    hours: '2,000 hrs OJL',
    credential: 'Indiana Barber License',
  },
  { title: 'IT Help Desk', slug: 'it-help-desk', hours: '160 hrs', credential: 'CompTIA A+' },
  {
    title: 'Peer Recovery Specialist',
    slug: 'peer-recovery-specialist',
    hours: '80 hrs',
    credential: 'CPRS',
  },
  { title: 'CDL Training', slug: 'cdl-training', hours: '160 hrs', credential: 'Class A CDL' },
];

const REFERRAL_STEPS = [
  {
    step: '1',
    title: 'Confirm SNAP Eligibility',
    desc: 'Verify the participant is an able-bodied adult without dependents (ABAWD) or meets SNAP E&T criteria through FSSA/DFR.',
  },
  {
    step: '2',
    title: 'Issue Referral',
    desc: 'Send a referral via your FSSA case management system or contact our agency liaison directly.',
  },
  {
    step: '3',
    title: 'Participant Enrolls',
    desc: 'We screen for program fit, confirm funding, and enroll the participant. You receive confirmation within 2 business days.',
  },
  {
    step: '4',
    title: 'Track Progress',
    desc: 'Attendance and milestone data reported back to your agency. 80-hour participation tracking automated.',
  },
];

export default async function SnapEtPartnerPage() {
  // PUBLIC ROUTE: agency-facing marketing page — no auth required.
  const db = createPublicClient();

  // Live enrollment capacity signal — degrade gracefully if DB unavailable
  let activeEnrollments: number | null = null;
  let completedThisYear: number | null = null;
  try {
    const [activeRes, completedRes] = await Promise.all([
      db.from('program_enrollments').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      db.from('program_enrollments').select('*', { count: 'exact', head: true }).eq('status', 'completed').gte('updated_at', new Date(new Date().getFullYear(), 0, 1).toISOString()),
    ]);
    activeEnrollments = activeRes.count;
    completedThisYear = completedRes.count;
  } catch {
    // DB unavailable — render static fallback
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'FSSA', href: '/fssa' }, { label: 'SNAP E&T Partner' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="bg-slate-900 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-red-400 mb-3">
            For Case Managers &amp; Agency Staff
          </p>
          <h1 className="text-4xl font-extrabold text-white mb-4">SNAP E&T Partner Agency</h1>
          <p className="text-slate-300 text-lg max-w-2xl mb-6">
            {PLATFORM_DEFAULTS.orgName} is an ETPL-approved, DOL-registered training provider participating
            in Indiana's SNAP E&T program (IMPACT) through FSSA/DFR.
          </p>
          <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 max-w-2xl">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-amber-200 text-sm">
              Participants must be referred through FSSA or a WorkOne office. Direct enrollment
              without an agency referral is not available for SNAP E&T funding.
            </p>
          </div>
        </div>
      </section>

      {/* Live stats */}
      <section className="bg-brand-red-600 py-6 px-4">
        <div className="max-w-5xl mx-auto flex flex-wrap justify-center gap-10 text-center">
          <div>
            <p className="text-3xl font-extrabold text-white">{activeEnrollments ?? '—'}</p>
            <p className="text-red-100 text-sm mt-1">Active Participants</p>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-white">{completedThisYear ?? '—'}</p>
            <p className="text-red-100 text-sm mt-1">Completions This Year</p>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-white">{ELIGIBLE_PROGRAMS.length}</p>
            <p className="text-red-100 text-sm mt-1">SNAP E&T Eligible Programs</p>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-white">80-hr</p>
            <p className="text-red-100 text-sm mt-1">Automated Tracking</p>
          </div>
        </div>
      </section>

      {/* Credentials */}
      <section className="py-12 px-4 bg-white border-b">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-bold text-slate-900 mb-5">Provider Credentials</h2>
          <div className="flex flex-wrap gap-3">
            {[
              'ETPL Approved — Indiana DWD',
              'DOL Registered Apprenticeship Sponsor',
              'WIOA / WRG / JRI Approved',
              'FSSA IMPACT Participating Provider',
              'SAM.gov Registered — CAGE: 0Q856',
              '80-Hour Participation Tracking',
            ].map((c) => (
              <span
                key={c}
                className="inline-flex items-center gap-2 rounded-full bg-brand-green-50 border border-brand-green-200 px-4 py-1.5 text-sm font-medium text-brand-green-800"
              >
                <CheckCircle className="w-3.5 h-3.5" /> {c}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Eligible programs */}
      <section className="py-14 px-4 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">SNAP E&T Eligible Programs</h2>
          <p className="text-slate-600 mb-8">
            All programs below qualify for SNAP E&T funding. Hours shown are minimum participation
            requirements.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ELIGIBLE_PROGRAMS.map((p) => (
              <Link
                key={p.slug}
                href={`/programs/${p.slug}`}
                className="block rounded-xl border border-slate-200 bg-white p-5 hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <h3 className="font-bold text-slate-900 mb-1">{p.title}</h3>
                <p className="text-xs text-slate-500 mb-2">{p.credential}</p>
                <span className="inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {p.hours}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Referral process */}
      <section className="py-14 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">Referral Process</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {REFERRAL_STEPS.map((s) => (
              <div key={s.step} className="rounded-xl border border-slate-200 p-6">
                <div className="w-8 h-8 rounded-full bg-brand-red-600 text-white text-sm font-bold flex items-center justify-center mb-4">
                  {s.step}
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{s.title}</h3>
                <p className="text-sm text-slate-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 px-4 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-8 items-start justify-between">
          <div>
            <Building2 className="w-8 h-8 text-brand-red-400 mb-3" />
            <h2 className="text-2xl font-bold mb-2">Ready to Refer a Participant?</h2>
            <p className="text-slate-300 max-w-lg">
              Contact our SNAP E&T liaison or submit a formal partnership request. We respond to
              agency inquiries within one business day.
            </p>
          </div>
          <div className="flex flex-col gap-3 shrink-0">
            <Link
              href="/fssa"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-red-600 px-6 py-3 font-semibold text-white hover:bg-brand-red-700 transition"
            >
              <ClipboardList className="w-4 h-4" /> Submit Partnership Request
            </Link>
            <a
              href="mailto:agencies@elevateforhumanity.org"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white px-6 py-3 font-semibold text-slate-900 hover:bg-white/10 transition"
            >
              <Mail className="w-4 h-4" /> Email Agency Liaison
            </a>
            <a
              href={`tel:${PLATFORM_DEFAULTS.supportPhone.replace(/[^0-9]/g, "")}`}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-600 px-6 py-3 font-semibold text-slate-300 hover:bg-white/5 transition"
            >
              <Phone className="w-4 h-4" /> {PLATFORM_DEFAULTS.supportPhone}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
