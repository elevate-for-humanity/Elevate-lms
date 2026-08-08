import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { BookOpen, CheckCircle2, Clock3, PlayCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Course | Elevate LMS',
  robots: { index: false, follow: false },
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export default async function CourseLandingPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=${encodeURIComponent(`/lms/courses/${courseId}`)}`);
  }

  let courseQuery = supabase
    .from('courses')
    .select('id,title,slug,description,status,is_active')
    .eq('is_active', true);
  courseQuery = isUuid(courseId) ? courseQuery.eq('id', courseId) : courseQuery.eq('slug', courseId);
  const { data: course } = await courseQuery.maybeSingle();
  if (!course) notFound();

  const [{ data: modules }, { data: lessons }] = await Promise.all([
    supabase
      .from('course_modules')
      .select('id,title,description,order_index,is_published')
      .eq('course_id', course.id)
      .eq('is_published', true)
      .order('order_index'),
    supabase
      .from('course_lessons')
      .select('id,module_id,slug,title,lesson_type,order_index,duration_minutes,is_published')
      .eq('course_id', course.id)
      .eq('is_published', true)
      .order('order_index'),
  ]);

  const publishedModules = modules ?? [];
  const publishedLessons = lessons ?? [];
  const totalMinutes = publishedLessons.reduce(
    (sum, lesson) => sum + Number(lesson.duration_minutes ?? 0),
    0,
  );

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-cyan-800">Elevate LMS</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">{course.title}</h1>
          <p className="mt-4 max-w-4xl text-base font-medium leading-7 text-slate-700">
            {course.description || 'Course lessons, checkpoints, and required assessments.'}
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm font-bold text-slate-800">
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2">
              <BookOpen className="h-4 w-4" /> {publishedLessons.length} lessons
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2">
              <Clock3 className="h-4 w-4" /> {Math.round((totalMinutes / 60) * 10) / 10} scheduled lesson hours
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-2 text-emerald-900">
              <CheckCircle2 className="h-4 w-4" /> Published
            </span>
          </div>
          {course.slug === 'barber-apprenticeship' ? (
            <div className="mt-6 rounded-xl border border-cyan-200 bg-cyan-50 p-4 text-sm font-semibold leading-6 text-cyan-950">
              This LMS curriculum supports the registered Barber Apprenticeship RTI requirement. Registered completion requires 144 RTI hours and 2,000 approved OJL hours tracked separately; the lesson-duration total shown above is scheduled digital lesson time, not the full registered RTI requirement.
            </div>
          ) : null}
        </div>
      </section>

      <section className="mx-auto max-w-6xl space-y-5 px-4 py-8 sm:px-6">
        {publishedModules.map((module) => {
          const moduleLessons = publishedLessons.filter((lesson) => lesson.module_id === module.id);
          return (
            <article key={module.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
                <h2 className="text-xl font-extrabold text-slate-950">{module.title}</h2>
                {module.description ? (
                  <p className="mt-1 text-sm font-medium text-slate-700">{module.description}</p>
                ) : null}
              </div>
              <div className="divide-y divide-slate-100">
                {moduleLessons.map((lesson, index) => (
                  <Link
                    key={lesson.id}
                    href={`/lms/courses/${course.id}/lessons/${lesson.id}`}
                    className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-600">
                        {lesson.lesson_type === 'exam'
                          ? 'Final exam'
                          : lesson.lesson_type === 'checkpoint'
                            ? 'Module checkpoint'
                            : `Lesson ${index + 1}`}
                      </p>
                      <p className="mt-1 font-bold text-slate-950">{lesson.title}</p>
                      <p className="mt-1 text-sm font-medium text-slate-600">
                        {Number(lesson.duration_minutes ?? 0)} min
                      </p>
                    </div>
                    <PlayCircle className="h-6 w-6 shrink-0 text-cyan-700" aria-hidden />
                  </Link>
                ))}
              </div>
            </article>
          );
        })}

        {publishedModules.length === 0 ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 font-semibold text-amber-950">
            This course is published, but no published modules are currently available. Contact support before continuing.
          </div>
        ) : null}
      </section>
    </main>
  );
}
