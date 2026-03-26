import { Metadata } from 'next';

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Inspect Course | Admin | Elevate For Humanity',
};

async function getCourseDetail(courseId: string) {
  const supabase = createAdminClient();

  const { data: course, error } = await supabase
    .from('training_courses')
    .select('id, slug, course_name, description, is_active, updated_at, program_id, programs(slug, title)')
    .eq('id', courseId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!course) return null;

  // course_lessons is the live source lms_lessons view reads from
  const { data: lessons } = await supabase
    .from('course_lessons')
    .select('id, title, slug, lesson_type, order_index, passing_score, updated_at')
    .eq('course_id', courseId)
    .order('order_index', { ascending: true });

  return { course, lessons: lessons ?? [] };
}

export default async function InspectCoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  await requireAdmin();
  const { courseId } = await params;
  const detail = await getCourseDetail(courseId);

  if (!detail) notFound();

  const { course, lessons } = detail;
  const program = course.programs as { slug: string; title: string } | null;
  const published = lessons.filter((l: any) => l.is_published).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-brand-blue-700 text-white py-6 px-4">
        <div className="max-w-5xl mx-auto flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold">{course.course_name}</h1>
            <p className="text-brand-blue-200 text-sm mt-0.5">
              {lessons.length} lessons · {program?.title ?? 'No program linked'}
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Link
              href="/admin/courses"
              className="rounded-lg bg-brand-blue-600 hover:bg-brand-blue-500 text-white px-3 py-1.5 text-sm font-medium"
            >
              ← Courses
            </Link>
            <Link
              href={`/admin/courses/${courseId}/content`}
              className="rounded-lg bg-white text-brand-blue-700 hover:bg-brand-blue-50 px-3 py-1.5 text-sm font-medium"
            >
              Edit Content
            </Link>
            <Link
              href={`/lms/courses/${courseId}`}
              className="rounded-lg bg-white text-brand-blue-700 hover:bg-brand-blue-50 px-3 py-1.5 text-sm font-medium"
            >
              Open LMS
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Meta */}
        <div className="bg-white rounded-xl border p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-xs text-slate-500 mb-0.5">Slug</p>
            <p className="font-mono text-slate-800">{course.slug ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-0.5">Program</p>
            <p className="font-medium">{program?.slug ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-0.5">Status</p>
            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${course.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
              {course.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-0.5">Updated</p>
            <p className="text-slate-700">{course.updated_at ? new Date(course.updated_at).toLocaleDateString() : '—'}</p>
          </div>
        </div>

        {/* Lesson table */}
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="border-b px-4 py-3 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Lessons <span className="text-slate-400 font-normal text-sm">({lessons.length})</span></h2>
            <span className="text-xs text-slate-500">{published} published</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 font-semibold w-10">#</th>
                  <th className="px-4 py-2.5 font-semibold">Title</th>
                  <th className="px-4 py-2.5 font-semibold">Slug</th>
                  <th className="px-4 py-2.5 font-semibold">Type</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Pass %</th>
                  <th className="px-4 py-2.5 font-semibold">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lessons.map((lesson: any) => (
                  <tr key={lesson.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 text-slate-400 tabular-nums">{lesson.order_index}</td>
                    <td className="px-4 py-2.5 font-medium text-slate-900">{lesson.title}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-slate-500">{lesson.slug}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex rounded px-1.5 py-0.5 text-xs font-medium ${
                        lesson.lesson_type === 'checkpoint' ? 'bg-amber-100 text-amber-800' :
                        lesson.lesson_type === 'quiz'       ? 'bg-purple-100 text-purple-800' :
                        lesson.lesson_type === 'exam'       ? 'bg-brand-red-100 text-brand-red-800' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {lesson.lesson_type ?? 'lesson'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">
                      {lesson.passing_score ? `${lesson.passing_score}%` : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-400">
                      {lesson.updated_at ? new Date(lesson.updated_at).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
                {lessons.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                      No lessons in DB for this course.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
