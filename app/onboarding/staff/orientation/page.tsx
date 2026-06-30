import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Users, CheckCircle } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Staff Orientation',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

const SECTIONS = [
  {
    title: 'Your role at Elevate',
    body: 'Elevate staff support program operations, student services, and compliance. Your specific responsibilities depend on your position — case manager, program coordinator, enrollment specialist, or administrative staff. Review your offer letter and job description for your exact scope. When in doubt, ask your supervisor.',
  },
  {
    title: 'Student records and FERPA',
    body: 'All student information is protected under FERPA. Do not share grades, attendance, enrollment status, or personal information with anyone outside Elevate without written authorization from the student. Use the staff portal for all record-keeping — do not store student data in personal files, email, or external drives.',
  },
  {
    title: 'WIOA and DOL reporting',
    body: 'Many Elevate programs are funded through WIOA and DOL grants. Accurate data entry is a federal compliance requirement. Enter all enrollment, attendance, and outcome data within 24 hours of the event. Errors or late entries can affect program funding — escalate any data issues to your supervisor immediately.',
  },
  {
    title: 'Communication standards',
    body: 'Respond to student and partner inquiries within one business day. Use the staff messaging system for all student communication — do not exchange personal contact information with students. Escalate complaints, grievances, or safety concerns to your supervisor the same day.',
  },
  {
    title: 'System access and security',
    body: 'You have been granted access to the systems required for your role. Do not share your login credentials. Log out of all systems when leaving your workstation. Report any suspected security incidents to IT immediately. Access is reviewed quarterly — unused access is revoked.',
  },
  {
    title: 'Getting help',
    body: `Your supervisor is your first point of contact for operational questions. For HR or payroll questions, contact hr@elevateforhumanity.org. For technical issues, use the staff help desk. For compliance questions, contact compliance@elevateforhumanity.org. For urgent matters, call ${PLATFORM_DEFAULTS.supportPhone}.`,
  },
];

export default async function StaffOrientationPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/onboarding/staff/orientation');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, first_name')
    .eq('id', user.id)
    .maybeSingle();

  if (
    profile &&
    !['staff', 'admin', 'super_admin', 'case_manager'].includes(profile.role ?? '')
  ) {
    redirect('/onboarding/learner');
  }

  const firstName = profile?.first_name || profile?.full_name?.split(' ')[0] || '';

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Breadcrumbs
          items={[
            { label: 'Staff Onboarding', href: '/onboarding/staff' },
            { label: 'Orientation' },
          ]}
        />

        <div className="mt-6 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-brand-blue-700 px-8 py-6">
            <div className="flex items-center gap-3 mb-1">
              <Users className="w-6 h-6 text-white opacity-80" />
              <h1 className="text-2xl font-bold text-white">Staff Orientation</h1>
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
              href="/onboarding/staff"
              className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>
            <Link
              href="/onboarding/staff"
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
