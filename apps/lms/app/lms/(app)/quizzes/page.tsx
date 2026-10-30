import { resolvePortalPreviewSubject } from '@/lib/admin/portal-preview';
import { loadLearnerCourseIds } from '@/lib/lms/learner-course-ids';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { LmsHeroBanner } from '@/components/lms/LmsHeroBanner';
import { LessonAssessmentResults } from '@/components/lms/LessonAssessmentResults';
import { loadLessonAssessmentResults } from '@/lib/lms/lesson-assessment-results';
export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'My Quizzes | Student Portal',
  description: 'Assigned lesson assessments and recorded results.',
};
export default async function QuizzesPage() {
  const auth = await createClient();
  const {
    data: { user: authenticatedUser },
  } = await auth.auth.getUser();
  const previewDb = await requireAdminClient();
  const subject = await resolvePortalPreviewSubject(previewDb, authenticatedUser?.id);
  if (!subject.userId) redirect('/login');
  // The signed preview subject, or the authenticated learner, owns every read.
  const user = { id: subject.userId };

  const db = await requireAdminClient();
  const courseIds = await loadLearnerCourseIds(db, user.id);
  // Current courses and course_lessons have UUID identities. The legacy quizzes
  // table has integer course IDs and cannot be joined to these enrollments.
  // Read only assessment metadata here; the lesson route enforces pacing/access.
  const results = await loadLessonAssessmentResults(db, user.id, courseIds);
  const attempted = results.filter((row) => row.bestScore !== null);
  const passed = results.filter((row) => row.passed).length;
  const average = attempted.length
    ? Math.round(attempted.reduce((sum, row) => sum + Number(row.bestScore), 0) / attempted.length)
    : 0;
  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      {subject.previewing ? (
        <p
          role="status"
          className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950"
        >
          Administrator preview: viewing this learner’s saved records. Changes and submissions are
          disabled.
        </p>
      ) : null}
      <LmsHeroBanner
        title="Quizzes & Assessments"
        subtitle={`${results.length} assigned assessments · ${passed} passed`}
        image="/images/pages/training-classroom.webp"
        eyebrow="Test Your Knowledge"
      />
      <section aria-label="Assessment summary" className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          ['Assigned', results.length],
          ['Attempted', attempted.length],
          ['Passed', passed],
          ['Average', `${average}%`],
        ].map(([label, value]) => (
          <article key={label} className="rounded-xl border bg-white p-5">
            <p className="text-2xl font-black">{value}</p>
            <p className="text-sm text-slate-600">{label}</p>
          </article>
        ))}
      </section>
      <LessonAssessmentResults results={results} />
      {!results.length && (
        <section className="rounded-2xl border bg-white p-8 text-center">
          <h2 className="text-xl font-bold">No assigned assessments yet</h2>
          <p className="mt-2 text-slate-600">
            Published checkpoints and exams appear here when they are assigned to your current
            course.
          </p>
          <Link
            href="/lms/courses"
            className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-slate-950 px-5 font-bold text-white"
          >
            Open my courses
          </Link>
        </section>
      )}
    </main>
  );
}
