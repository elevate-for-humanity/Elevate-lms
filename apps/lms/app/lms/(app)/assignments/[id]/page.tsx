import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { resolveCourseEnrollment } from '@/lib/enrollment/resolve-course-enrollment';
import { AssignmentForm } from './AssignmentForm';
export const dynamic = 'force-dynamic';
export default async function AssignmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await createClient();
  const {
    data: { user },
  } = await auth.auth.getUser();
  if (!user) redirect('/login');
  const db = await requireAdminClient();
  const { data: assignment, error } = await db
    .from('assignments')
    .select('id,course_id,title,description,instructions,due_date,max_points,submission_type')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!assignment?.course_id) notFound();
  const enrollment = await resolveCourseEnrollment(user.id, assignment.course_id);
  if (
    !enrollment ||
    !['active', 'enrolled', 'in_progress', 'confirmed', 'completed'].includes(enrollment.status)
  )
    notFound();
  const { data: submission, error: submissionError } = await db
    .from('assignment_submissions')
    .select(
      'id,status,submission_text,submission_url,file_path,file_paths,grade,feedback,submitted_at',
    )
    .eq('assignment_id', id)
    .or(`user_id.eq.${user.id},student_id.eq.${user.id}`)
    .order('submitted_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (submissionError) throw submissionError;
  const paths = Array.isArray(submission?.file_paths)
    ? submission.file_paths
    : submission?.file_path
      ? [submission.file_path]
      : [];
  const attachments = await Promise.all(
    paths
      .filter(
        (path: unknown): path is string =>
          typeof path === 'string' && path.startsWith(`${user.id}/assignments/${id}/`),
      )
      .map(async (path: string) => {
        const { data, error } = await db.storage.from('documents').createSignedUrl(path, 600);
        if (error) throw error;
        return { name: path.split('/').pop() || 'Evidence file', url: data.signedUrl };
      }),
  );
  return (
    <main className="mx-auto max-w-3xl space-y-5 px-4 py-8">
      <Link href="/lms/assignments" className="font-bold underline">
        Back to assignments
      </Link>
      <h1 className="text-3xl font-black">{assignment.title}</h1>
      <p className="whitespace-pre-wrap text-slate-700">{assignment.description}</p>
      <div className="whitespace-pre-wrap rounded-xl border p-5">{assignment.instructions}</div>
      <p>
        {assignment.due_date
          ? `Due ${new Date(assignment.due_date).toLocaleDateString('en-US')}`
          : 'No due date assigned'}{' '}
        · {assignment.max_points} points
      </p>
      {submission && (
        <section className="rounded-xl border bg-slate-50 p-5">
          <h2 className="font-bold">Your submission</h2>
          <p>
            {submission.status} ·{' '}
            {submission.submitted_at
              ? new Date(submission.submitted_at).toLocaleDateString('en-US')
              : ''}
          </p>
          {submission.grade !== null && (
            <p>
              Grade: {submission.grade} / {assignment.max_points}
            </p>
          )}
          <p className="whitespace-pre-wrap">{submission.submission_text}</p>
          <p className="whitespace-pre-wrap">{submission.feedback}</p>
          {submission.submission_url && /^https?:\/\//i.test(submission.submission_url) && (
            <a
              href={submission.submission_url}
              target="_blank"
              rel="noreferrer"
              className="block font-bold underline"
            >
              Open submitted evidence link
            </a>
          )}
          {attachments.map((file) => (
            <a
              key={file.url}
              href={file.url}
              target="_blank"
              rel="noreferrer"
              className="mt-2 block font-bold underline"
            >
              Open evidence: {file.name}
            </a>
          ))}
        </section>
      )}
      <AssignmentForm
        id={id}
        initialText={submission?.submission_text || ''}
        initialUrl={submission?.submission_url || ''}
        graded={submission?.grade != null}
        closed={enrollment.status === 'completed'}
      />
    </main>
  );
}
