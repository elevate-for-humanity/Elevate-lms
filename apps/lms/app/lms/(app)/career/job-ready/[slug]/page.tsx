import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import { jobReadyModule } from '@/lib/career/job-ready';
import { JobReadyPlayer } from '@/components/career/JobReadyPlayer';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Job Ready Indy | Career Plan',
  robots: { index: false, follow: false },
};

export default async function JobReadyLesson({ params }: { params: Promise<{ slug: string }> }) {
  const { user, profile } = await requireRole([
    'student',
    'learner',
    'apprentice',
    'barber_apprentice',
    'cosmetology_apprentice',
    'admin',
    'super_admin',
    'staff',
  ]);
  const lesson = jobReadyModule((await params).slug);
  if (!lesson) notFound();
  const db = await createClient();
  const [{ data: pkg, error: packageError }, { data: enrollment, error: progressError }] =
    await Promise.all([
      db.from('scorm_packages').select('id').eq('id', lesson.id).eq('active', true).maybeSingle(),
      db
        .from('scorm_enrollments')
        .select('cmi_data')
        .eq('user_id', user.id)
        .eq('scorm_package_id', lesson.id)
        .maybeSingle(),
    ]);
  return (
    <main className="mx-auto max-w-6xl space-y-5 px-4 py-6 pb-24">
      <Link
        href="/lms/career/job-ready"
        className="inline-flex min-h-12 items-center font-bold underline"
      >
        Back to Job Ready
      </Link>
      <h1 className="text-3xl font-bold text-slate-950">{lesson.title}</h1>
      <p className="leading-7 text-slate-700">
        {lesson.description} Allow the lesson to finish saving before you leave.
      </p>
      {pkg && !packageError && !progressError ? (
        <JobReadyPlayer
          slug={lesson.slug}
          title={lesson.title}
          initialCmi={enrollment?.cmi_data ?? {}}
          learnerId={user.id}
          learnerName={profile?.full_name || 'Learner'}
        />
      ) : (
        <p role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-5">
          This lesson or your saved progress is temporarily unavailable. Please try again or request
          help.
        </p>
      )}
      <Link
        href="/lms/support"
        className="inline-flex min-h-12 items-center rounded-xl border border-slate-300 px-5 py-3 font-bold"
      >
        Request help with Job Ready
      </Link>
    </main>
  );
}
