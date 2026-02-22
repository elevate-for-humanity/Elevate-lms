import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { generateInternalMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = generateInternalMetadata({
  title: 'Complete Course',
  description: 'Mark course as completed',
  path: '/lms/courses',
});

import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';


interface Params {
  courseId: string;
}

export default async function CompleteCourse({ params }: { params: Params }) {
  const { courseId } = await params;
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: course } = await db
    .from('training_courses')
    .select('id, title, delivery_mode')
    .eq('id', courseId)
    .single();

  if (!course) redirect('/lms/courses');

  // Check current progress
  const { data: progress } = await db
    .from('lms_progress')
    .select('status, completed_at')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .single();

  const isAlreadyCompleted = progress?.status === 'completed';

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link
        href={`/lms/courses/${courseId}`}
        className="text-sm text-brand-blue-600 hover:underline"
      >
        ← Back to Course
      </Link>

      <h1 className="mt-4 text-3xl font-bold">
        {isAlreadyCompleted ? 'Course Completed' : 'Mark Course Complete'}
      </h1>

      {isAlreadyCompleted ? (
        <div className="mt-4 rounded-xl border border-brand-green-200 bg-brand-green-50 p-6">
          <p className="font-semibold text-brand-green-800">
            • You completed this course on{' '}
            {new Date(progress.completed_at!).toLocaleDateString()}
          </p>
        </div>
      ) : (
        <>
          <p className="mt-2 opacity-80">
            Upload proof of completion for <b>{course.course_name}</b>
          </p>
          <p className="mt-1 text-sm opacity-70">
            (Certificate PDF, screenshot, or completion code)
          </p>

          <form
            action="/api/lms/progress/complete"
            method="post"
            className="mt-6 space-y-4"
          >
            <input type="hidden" name="courseId" value={course.id} />

            <div>
              <label className="block font-semibold">
                Evidence URL (optional)
              </label>
              <input
                name="evidenceUrl"
                type="url"
                className="mt-2 w-full rounded-xl border px-4 py-3"
                placeholder="Paste a file link or leave blank"
              />
              <p className="mt-1 text-xs opacity-60">
                Upload your certificate to Supabase Storage or another service,
                then paste the link here
              </p>
            </div>

            <button
              type="submit"
              className="rounded-xl bg-brand-orange-600 px-6 py-3 font-semibold text-white hover:bg-brand-orange-700"
            >
              Mark Complete
            </button>
          </form>
        </>
      )}
    </div>
  );
}
