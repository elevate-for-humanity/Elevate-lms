import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function StudentAssignmentDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/student-portal/assignments/' + id);

  const { data: assignment } = await supabase
    .from('assignments')
    .select('*')
    .eq('id', id)
    .single();

  if (!assignment) notFound();

  const { data: submission } = await supabase
    .from('step_submissions')
    .select('*')
    .eq('lesson_id', assignment.lesson_id ?? id)
    .eq('user_id', user.id)
    .maybeSingle();

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
        <nav className="text-sm text-gray-500">
          <ol className="flex items-center gap-2">
            <li><Link href="/student-portal" className="hover:text-gray-900">Portal</Link></li>
            <li>/</li>
            <li><Link href="/student-portal/assignments" className="hover:text-gray-900">Assignments</Link></li>
            <li>/</li>
            <li className="text-gray-900 font-medium">{assignment.title}</li>
          </ol>
        </nav>

        <div>
          <h1 className="text-3xl font-bold text-gray-900">{assignment.title}</h1>
          {assignment.due_date && (
            <p className="mt-2 text-sm text-gray-500">
              Due: {new Date(assignment.due_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          )}
        </div>

        <div className="rounded-xl border p-6 bg-gray-50">
          <p className="text-gray-700 whitespace-pre-wrap">
            {assignment.description || 'No description provided.'}
          </p>
        </div>

        {submission ? (
          <div className="rounded-xl border border-green-200 bg-green-50 p-6">
            <p className="font-semibold text-green-800">Submitted</p>
            <p className="text-sm text-green-700 mt-1">
              Submitted on {new Date(submission.created_at).toLocaleDateString()}
            </p>
            {submission.instructor_feedback && (
              <div className="mt-4">
                <p className="font-semibold text-green-800 text-sm">Instructor Feedback</p>
                <p className="text-sm text-green-700 mt-1">{submission.instructor_feedback}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border p-6">
            <h2 className="text-lg font-semibold mb-4">Submit Your Work</h2>
            <p className="text-sm text-gray-500">
              Submission form — complete this assignment through your course lesson page.
            </p>
            {assignment.lesson_id && (
              <Link
                href={`/lms/courses/${assignment.course_id ?? ''}/lessons/${assignment.lesson_id}?activity=assignment`}
                className="inline-block mt-4 bg-brand-green-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-brand-green-700"
              >
                Go to Lesson →
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
