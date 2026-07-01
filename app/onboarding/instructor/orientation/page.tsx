import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import InstructorOrientationClient from './InstructorOrientationClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Instructor Orientation',
};

export default async function InstructorOrientationPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/onboarding/instructor/orientation');

  const db = await requireAdminClient();
  const { data: profile } = await db
    .from('profiles')
    .select('role, full_name, first_name')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || !['instructor', 'admin', 'staff'].includes(profile.role)) {
    redirect('/onboarding/learner');
  }

  const { data: existing } = await db
    .from('orientation_completions')
    .select('id, completed_at')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();

  const firstName = profile.first_name || profile.full_name?.split(' ')[0] || 'Instructor';

  const sections = [
    {
      title: 'Your Role at Elevate',
      body: 'As an Elevate instructor you are the primary point of contact for your learners. You deliver curriculum, track attendance, assess progress, and communicate any barriers or concerns to the program coordinator. Your relationship with learners directly impacts their outcomes.',
    },
    {
      title: 'Session Expectations',
      body: 'Arrive 10 minutes before each session. Take attendance at the start — this is required for WIOA and DOL reporting. Submit your session log within 24 hours. If you need to cancel, notify your coordinator at least 4 hours in advance.',
    },
    {
      title: 'Student Records & FERPA',
      body: 'All student information is protected under FERPA. Do not share grades, attendance, or personal information with anyone outside Elevate without written authorization. Use the instructor portal for all record-keeping — do not store student data in personal files or email.',
    },
    {
      title: 'Grading & Assessments',
      body: 'Enter grades and checkpoint scores in the LMS within 48 hours of assessment. Checkpoints gate module progression — a student cannot advance until they pass. If a student fails a checkpoint, document the remediation plan in their record.',
    },
    {
      title: 'Communication Standards',
      body: 'Respond to student messages within one business day. Escalate attendance concerns (3+ absences) to the program coordinator immediately. Use the staff messaging system — do not exchange personal contact information with students.',
    },
    {
      title: 'Getting Help',
      body: 'Your program coordinator is your first point of contact for operational questions. For technical issues with the LMS, use the help desk at /lms/help. For payroll or HR questions, contact staff-portal@elevateforhumanity.org.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Breadcrumbs
          items={[
            { label: 'Instructor Onboarding', href: '/onboarding/instructor' },
            { label: 'Orientation' },
          ]}
        />

        <div className="mt-6 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-brand-blue-700 px-8 py-6">
            <h1 className="text-2xl font-bold text-white">Instructor Orientation</h1>
            <p className="text-blue-100 mt-1">
              Welcome{firstName ? `, ${firstName}` : ''}. This takes about 10 minutes.
            </p>
          </div>

          <div className="px-8 py-6 space-y-6">
            {sections.map((s, i) => (
              <div key={i} className="border-l-4 border-brand-blue-200 pl-4">
                <h3 className="font-semibold text-slate-900 mb-1">{s.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>

          <InstructorOrientationClient
            userId={user.id}
            alreadyDone={!!existing}
            completedAt={existing?.completed_at ?? null}
          />
        </div>
      </div>
    </div>
  );
}
