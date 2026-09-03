import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Briefcase, Building2, CheckCircle, FileText, Mail, Phone, Users } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Employer Orientation',
  robots: { index: false, follow: false },
};

const SECTIONS = [
  {
    icon: Building2,
    title: 'How the employer partnership works',
    points: [
      'Use the employer portal for approved job postings, candidate applications, and apprenticeship records available to your organization.',
      'Program funding, credential, and eligibility rules vary by program and participant; review the current program record before relying on a funding pathway.',
      'Only information released for employer use should be used when reviewing candidates or apprentices.',
    ],
  },
  {
    icon: Users,
    title: 'Candidate and apprentice access',
    points: [
      'Candidate access is limited to records your organization is authorized to view.',
      'Apprenticeship activity must remain tied to the approved placement, program, and supervising site.',
      'Employment and training outcomes should be updated when they can be verified.',
    ],
  },
  {
    icon: FileText,
    title: 'Compliance responsibilities',
    points: [
      'Keep company, contact, and required compliance documents current.',
      'Do not upload or share applicant information outside the authorized workflow.',
      'Use the portal record for hours, placement, document, and status actions so the audit trail remains intact.',
    ],
  },
  {
    icon: Briefcase,
    title: 'Using the employer dashboard',
    points: [
      'Create and manage approved job postings.',
      'Review applications assigned to your organization.',
      'Manage apprenticeship records and company profile information available to your account.',
    ],
  },
];

export default async function EmployerOrientationPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/onboarding/employer/orientation');

  try {
    await supabase
      .from('employer_onboarding_progress')
      .upsert(
        {
          user_id: user.id,
          orientation_viewed: true,
          orientation_viewed_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );
  } catch {
    // Orientation remains usable even if optional progress telemetry is unavailable.
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-brand-blue-700">Employer onboarding</p>
        <h1 className="mt-2 text-3xl font-extrabold text-slate-950">Employer Partner Orientation</h1>
        <p className="mt-4 text-lg leading-8 text-slate-700">
          Review the operating and compliance expectations for using Elevate&apos;s employer portal before continuing your onboarding.
        </p>

        <div className="mt-8 space-y-5">
          {SECTIONS.map(({ icon: Icon, title, points }) => (
            <section key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blue-50 text-brand-blue-700">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h2 className="font-bold text-slate-950">{title}</h2>
              </div>
              <ul className="mt-4 space-y-3">
                {points.map((point) => (
                  <li key={point} className="flex items-start gap-2.5 text-sm leading-6 text-slate-700">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand-green-700" aria-hidden="true" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="font-bold text-slate-950">Need help with employer onboarding?</h2>
          <div className="mt-4 flex flex-col gap-3 text-sm sm:flex-row sm:gap-6">
            <a href={`tel:${PLATFORM_DEFAULTS.supportPhone.replace(/[^0-9+]/g, '')}`} className="inline-flex items-center gap-2 font-semibold text-brand-blue-700 hover:underline">
              <Phone className="h-4 w-4" /> {PLATFORM_DEFAULTS.supportPhone}
            </a>
            <a href={`mailto:${PLATFORM_DEFAULTS.supportEmail}`} className="inline-flex items-center gap-2 font-semibold text-brand-blue-700 hover:underline">
              <Mail className="h-4 w-4" /> {PLATFORM_DEFAULTS.supportEmail}
            </a>
          </div>
        </section>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/onboarding/employer/hiring-needs" className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-blue-700 px-6 py-3 font-bold text-white hover:bg-brand-blue-800">
            Continue to Hiring Needs <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/onboarding/employer" className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-800 hover:bg-slate-100">
            Back to Onboarding
          </Link>
        </div>
      </div>
    </main>
  );
}
