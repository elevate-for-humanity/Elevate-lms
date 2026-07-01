import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Building2, CheckCircle } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'School Partner Orientation',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

const SECTIONS = [
  {
    title: 'Your role as a school partner',
    body: 'As an Elevate school partner you host training programs at your site and support enrolled students through their credential pathway. You are responsible for attendance tracking, site compliance, and communicating student progress to your Elevate coordinator. You do not deliver curriculum — Elevate instructors handle that.',
  },
  {
    title: 'How programs are structured',
    body: 'Each program runs 4–16 weeks depending on the credential. Students complete online coursework through the Elevate LMS and attend in-person sessions at your site. Checkpoints gate module progression — a student cannot advance until they pass. Your site coordinator receives weekly progress reports.',
  },
  {
    title: 'WIOA and DOL compliance',
    body: 'All programs are ETPL-listed and subject to WIOA performance reporting. You must maintain accurate attendance records, report any student barriers within 48 hours, and cooperate with DOL audits. Elevate provides all required forms and reporting templates in your partner portal.',
  },
  {
    title: 'Student support responsibilities',
    body: 'You are the first point of contact for students at your site. Escalate attendance concerns (3+ absences) to your Elevate coordinator immediately. For academic issues, direct students to the LMS help desk. For personal barriers (transportation, childcare, housing), contact your coordinator — Elevate has supportive services funding available.',
  },
  {
    title: 'Memorandum of Understanding',
    body: 'Your MOU defines the specific terms of your partnership including program offerings, site requirements, and reporting obligations. You must sign the MOU before any students can be enrolled at your site. The MOU is reviewed annually and updated when program terms change.',
  },
  {
    title: 'Getting help',
    body: `Your Elevate program coordinator is your primary contact for operational questions. For portal or technical issues, use the help desk at /program-holder/support. For compliance questions, email compliance@elevateforhumanity.org. For urgent student safety concerns, call ${PLATFORM_DEFAULTS.supportPhone}.`,
  },
];

export default async function SchoolOrientationPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/onboarding/school/orientation');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, first_name')
    .eq('id', user.id)
    .maybeSingle();

  if (
    profile &&
    !['program_holder', 'admin', 'staff'].includes(profile.role ?? '')
  ) {
    redirect('/onboarding/learner');
  }

  const firstName = profile?.first_name || profile?.full_name?.split(' ')[0] || '';

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Breadcrumbs
          items={[
            { label: 'School Onboarding', href: '/onboarding/school' },
            { label: 'Orientation' },
          ]}
        />

        <div className="mt-6 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-brand-blue-700 px-8 py-6">
            <div className="flex items-center gap-3 mb-1">
              <Building2 className="w-6 h-6 text-white opacity-80" />
              <h1 className="text-2xl font-bold text-white">School Partner Orientation</h1>
            </div>
            <p className="text-blue-100">
              Welcome{firstName ? `, ${firstName}` : ''}. This takes about 10 minutes.
            </p>
          </div>

          <div className="px-8 py-6 space-y-6">
            {SECTIONS.map((s, i) => (
              <div key={i} className="border-l-4 border-brand-blue-200 pl-4">
                <h3 className="font-semibold text-slate-900 mb-1">{s.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>

          <div className="px-8 py-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-4">
            <Link
              href="/onboarding/school"
              className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>
            <Link
              href="/onboarding/school"
              className="inline-flex items-center gap-2 bg-brand-blue-700 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-brand-blue-800 transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              Continue to next step
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
