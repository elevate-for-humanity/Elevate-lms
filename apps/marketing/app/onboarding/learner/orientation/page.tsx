import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AlertTriangle, ArrowLeft, BookOpen, Clock, Shield, Users } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Learner Orientation | Elevate',
};

type ProgramJoin = {
  title: string | null;
  slug: string | null;
  duration_weeks: number | null;
  description: string | null;
};

type CourseJoin = {
  course_name: string | null;
  slug: string | null;
  duration_hours: number | null;
};

const PROGRAM_META: Record<string, { duration: string; hours: string; credentials: string[]; hasOJT: boolean }> = {
  'hvac-technician': { duration: '6–8 weeks', hours: '240 hours', credentials: ['EPA 608 Universal', 'OSHA 30', 'CPR'], hasOJT: true },
  'barber-apprenticeship': { duration: '15 months', hours: '2,000 OJL hours', credentials: ['Indiana Barber License pathway'], hasOJT: true },
  bookkeeping: { duration: '8 weeks', hours: '80 hours', credentials: ['QuickBooks Certified User', 'Microsoft Office Specialist'], hasOJT: false },
  'business-management': { duration: '5 weeks', hours: '50 hours', credentials: ['Business credential pathway'], hasOJT: false },
  'home-health-aide': { duration: '4 weeks', hours: '80 hours', credentials: ['HHA pathway', 'CPR'], hasOJT: true },
  'medical-assistant': { duration: '21 weeks', hours: 'Program schedule', credentials: ['Medical Assistant credential pathway'], hasOJT: false },
  'pharmacy-technician': { duration: '10 weeks', hours: '120 hours', credentials: ['Pharmacy Technician credential pathway'], hasOJT: false },
  cna: { duration: '4–6 weeks', hours: 'State-required training hours', credentials: ['Indiana CNA certification pathway', 'CPR'], hasOJT: true },
  cdl: { duration: '4 weeks', hours: '160 hours', credentials: ['CDL Class A pathway'], hasOJT: true },
};

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

async function completeOrientation() {
  'use server';

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/onboarding/learner/orientation');

  const now = new Date().toISOString();
  const results = await Promise.all([
    supabase.from('profiles').update({
      orientation_completed: true,
      orientation_completed_at: now,
      onboarding_completed: true,
    }).eq('id', user.id),
    supabase.from('orientation_completions').upsert({
      user_id: user.id,
      completed_at: now,
      orientation_type: 'learner',
    }, { onConflict: 'user_id' }),
    supabase.from('onboarding_progress').upsert({
      user_id: user.id,
      step: 'orientation',
      completed: true,
      completed_at: now,
      updated_at: now,
    }, { onConflict: 'user_id,step' }),
  ]);

  const failed = results.find((result) => result.error)?.error;
  if (failed) throw new Error(`ORIENTATION_COMPLETE_FAILED:${failed.message}`);

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, first_name, full_name')
      .eq('id', user.id)
      .maybeSingle();

    if (profile?.email) {
      const firstName = profile.first_name || profile.full_name?.split(' ')[0] || 'there';
      const { sendEmail } = await import('@/lib/email/resend');
      await sendEmail({
        to: profile.email,
        subject: 'Orientation complete — your course is ready',
        html: `<p>Hi ${firstName},</p><p>Your Elevate orientation is complete. Sign in to your learner dashboard to begin training.</p><p><a href="${PLATFORM_DEFAULTS.siteUrl}/learner/dashboard">Open your dashboard</a></p>`,
      });
    }
  } catch (error) {
    logger.error('[orientation] completion email failed', error instanceof Error ? error : new Error(String(error)));
  }

  redirect('/onboarding/learner/complete');
}

export default async function OrientationPage() {
  const sessionClient = await createClient();
  const { data: { user } } = await sessionClient.auth.getUser();
  if (!user) redirect('/login?redirect=/onboarding/learner/orientation');

  const db = await requireAdminClient();
  const [{ data: enrollment }, { data: courseEnrollment }] = await Promise.all([
    db.from('program_enrollments')
      .select('program_id, programs ( title, slug, duration_weeks, description )')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    db.from('program_enrollments')
      .select('training_courses ( course_name, slug, duration_hours )')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const program = firstRelation(enrollment?.programs as ProgramJoin | ProgramJoin[] | null);
  const legacyCourse = firstRelation(courseEnrollment?.training_courses as CourseJoin | CourseJoin[] | null);
  const slug = program?.slug ?? legacyCourse?.slug ?? '';
  const meta = PROGRAM_META[slug];
  const programTitle = program?.title ?? legacyCourse?.course_name ?? 'Your training program';
  const duration = meta?.duration ?? (program?.duration_weeks ? `${program.duration_weeks} weeks` : 'See your enrollment plan');
  const hours = meta?.hours ?? (legacyCourse?.duration_hours ? `${legacyCourse.duration_hours} hours` : '');
  const credentials = meta?.credentials ?? [];
  const hasOJT = meta?.hasOJT ?? false;

  const sections = [
    {
      title: `Program Overview — ${programTitle}`,
      icon: BookOpen,
      items: [
        `Your current program duration is ${duration}${hours ? ` (${hours})` : ''}.`,
        'Related Technical Instruction and assigned coursework are tracked in the Elevate LMS.',
        ...(hasOJT ? ['On-the-job learning is completed and verified through the apprenticeship/worksite workflow.'] : []),
        credentials.length ? `Credential pathway: ${credentials.join(', ')}.` : 'Credential requirements are listed inside your assigned program.',
      ],
    },
    {
      title: 'Attendance & Expectations',
      icon: Clock,
      items: [
        'Complete assigned coursework, quizzes, assessments, and required activities on schedule.',
        'Communicate absences or schedule conflicts to program staff promptly.',
        'Maintain professional conduct in class, online, and at employer or clinical sites.',
        'Review your dashboard regularly for assignments, documents, and staff messages.',
      ],
    },
    {
      title: 'Safety & Compliance',
      icon: Shield,
      items: [
        'Complete required safety training before hands-on work.',
        'Follow worksite, clinical, and lab safety requirements, including required PPE.',
        'Report safety concerns to your instructor or site supervisor immediately.',
        'Employer or clinical placements may require additional screening or documentation.',
      ],
    },
    {
      title: 'Support Services',
      icon: Users,
      items: [
        'Career services are available during and after training.',
        'Contact your case manager or program staff for approved supportive-service needs.',
        'Tutoring and additional instruction may be requested when available.',
        'Use the student handbook and grievance process for formal concerns.',
      ],
    },
    {
      title: 'Academic Integrity',
      icon: AlertTriangle,
      items: [
        'Submit your own work and follow exam/proctoring rules.',
        'Do not use unauthorized materials during assessments.',
        'Assessment and completion records are maintained in the LMS.',
        'Program-specific passing requirements are shown with each course or credential.',
      ],
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="border-b bg-slate-950 text-white">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-blue-300">Learner onboarding</p>
          <h1 className="mt-3 text-4xl font-black">Orientation</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-200">Review how your training, progress, safety, support, and responsibilities work before entering the learner dashboard.</p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <Breadcrumbs items={[{ label: 'Onboarding', href: '/onboarding/learner' }, { label: 'Orientation' }]} />
        <Link href="/onboarding/learner" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-brand-blue-700"><ArrowLeft className="h-4 w-4" /> Back to onboarding</Link>

        <div className="mt-6 space-y-5">
          {sections.map(({ title, icon: Icon, items }) => (
            <section key={title} className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7">
              <div className="flex items-center gap-3"><Icon className="h-6 w-6 text-brand-blue-700" /><h2 className="text-xl font-black">{title}</h2></div>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
                {items.map((item) => <li key={item} className="flex gap-3"><span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand-blue-600" />{item}</li>)}
              </ul>
            </section>
          ))}
        </div>

        <form action={completeOrientation} className="mt-8 rounded-2xl border border-green-200 bg-green-50 p-6 sm:flex sm:items-center sm:justify-between sm:gap-5">
          <div>
            <h2 className="font-black text-green-950">Ready to continue?</h2>
            <p className="mt-1 text-sm text-green-900">Completing orientation unlocks the next learner onboarding step.</p>
          </div>
          <button type="submit" className="mt-4 min-h-12 rounded-xl bg-green-700 px-6 font-black text-white hover:bg-green-800 sm:mt-0">Complete orientation</button>
        </form>
      </div>
    </main>
  );
}
