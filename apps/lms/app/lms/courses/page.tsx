import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, Play, Scissors } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { getUserEnrollments } from '@/lib/enrollments/getUserEnrollments';

export const metadata: Metadata = { title: `My Courses | ${PLATFORM_DEFAULTS.orgName} LMS`, description: 'Access your enrolled courses and track your learning progress.' };
export const dynamic = 'force-dynamic';

export default async function LMSCoursesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50"><div className="text-center"><BookOpen className="mx-auto mb-4 h-16 w-16 text-slate-300" /><h1 className="mb-2 text-xl font-bold">Sign in to view your courses</h1><Link href="/login?redirect=/lms/courses" className="mt-4 inline-flex rounded-lg bg-blue-600 px-6 py-3 font-medium text-white">Sign In</Link></div></div>;
  }

  const { enrollments, error } = await getUserEnrollments(user.id);

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white px-6 py-8"><div className="mx-auto max-w-6xl"><h1 className="text-2xl font-bold">My Courses</h1><p className="mt-1 text-slate-500">Track your enrolled courses and progress.</p></div></section>
      <section className="px-6 py-8"><div className="mx-auto max-w-6xl">
        {error ? (
          <div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-6 text-red-950">
            <h2 className="font-bold">We could not load your course assignments</h2>
            <p className="mt-2 text-sm">Your enrollment has not been removed. Please contact learner support so the record can be reviewed.</p>
          </div>
        ) : enrollments.length ? (
          <div className="space-y-4">
            {enrollments.map((enrollment) => {
              const progress = Math.max(0, Math.min(100, enrollment.progress));
              const title = enrollment.course_title || enrollment.program_title || 'Course assignment pending';
              const isExternal = enrollment.delivery_mode === 'partner';
              return <article key={`${enrollment.source_table}:${enrollment.enrollment_id}`} className="rounded-xl border border-slate-200 bg-white p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-cyan-100"><Scissors className="h-8 w-8 text-cyan-700" /></div>
                  <div className="min-w-0 flex-1"><h2 className="text-lg font-bold text-slate-950">{title}</h2><p className="mt-1 text-sm text-slate-600">{enrollment.course_description || (isExternal ? 'Training is delivered by the approved industry provider. Elevate tracks your evidence and completion.' : 'Your enrollment is recorded. Course details will appear when the curriculum assignment is complete.')}</p><p className="mt-2 text-xs font-bold uppercase tracking-wide text-slate-500">{enrollment.provider_name || (isExternal ? 'Industry partner' : 'Elevate for Humanity')} · {enrollment.status.replace(/_/g, ' ')}</p></div>
                  {enrollment.duration_hours ? <div className="text-sm text-slate-600">{enrollment.duration_hours} hours</div> : null}
                  <Link href={enrollment.continue_url} className="inline-flex items-center gap-2 rounded-lg bg-cyan-700 px-4 py-2 font-medium text-white"><Play className="h-4 w-4" /> {isExternal ? 'Open instructions' : enrollment.course_id ? 'Continue' : 'View status'}</Link>
                </div>
                {progress > 0 ? <><div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-cyan-500" style={{ width: `${progress}%` }} /></div><p className="mt-1 text-right text-xs text-slate-500">{progress}% complete</p></> : <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">{isExternal ? 'External provider progress' : enrollment.course_id ? 'Ready to begin' : 'Course assignment pending'}</p>}
              </article>;
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-12 text-center"><BookOpen className="mx-auto mb-4 h-16 w-16 text-amber-700" /><h2 className="text-xl font-bold">Course assignment pending</h2><p className="mt-2 text-sm text-slate-700">No course assignment is connected to your learner record yet. Review onboarding requirements or contact learner support.</p><div className="mt-6 flex justify-center gap-3"><Link href="/lms/onboarding" className="inline-flex rounded-lg bg-blue-700 px-6 py-3 font-medium text-white">Review onboarding</Link><Link href="/lms/support" className="inline-flex rounded-lg border border-slate-400 bg-white px-6 py-3 font-medium text-slate-900">Get help</Link></div></div>
        )}
      </div></section>
    </main>
  );
}
