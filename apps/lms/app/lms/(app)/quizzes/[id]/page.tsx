import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { resolveCourseEnrollment } from '@/lib/enrollment/resolve-course-enrollment';
export const dynamic = 'force-dynamic';
export default async function AssessmentLink({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) redirect('/login');
  // Old numeric quiz bookmarks are not course grants. Never guess a current
  // UUID course or award credit from an unassigned legacy assessment.
  if (/^[0-9a-f-]{36}$/i.test(id)) {
    const { data: lesson, error } = await db
      .from('course_lessons')
      .select('id,course_id')
      .eq('id', id)
      .eq('is_published', true)
      .maybeSingle();
    if (error) throw error;
    if (lesson?.course_id) {
      const enrollment = await resolveCourseEnrollment(user.id, lesson.course_id);
      if (
        enrollment &&
        ['active', 'enrolled', 'in_progress', 'confirmed', 'completed'].includes(enrollment.status)
      )
        redirect(`/lms/courses/${lesson.course_id}/lessons/${lesson.id}`);
    }
  }
  return (
    <main className="mx-auto max-w-3xl space-y-4 px-4 py-8">
      <h1 className="text-2xl font-black">Open your assigned assessment</h1>
      <p>
        This older assessment link is not available in your current course. Your assigned
        checkpoints, exams and recorded results are available below.
      </p>
      <Link
        href="/lms/quizzes"
        className="inline-flex min-h-11 items-center rounded-xl bg-slate-950 px-5 font-bold text-white"
      >
        My assigned assessments
      </Link>
    </main>
  );
}
