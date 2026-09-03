import type { Metadata } from 'next';
import Link from 'next/link';
import { Film, Image as ImageIcon, WandSparkles } from 'lucide-react';
import { requireAdmin } from '@/lib/auth';
import { requireAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const revalidate = 60;
export const metadata: Metadata = { title: 'Program Media | Elevate Admin' };

export default async function ProgramMediaPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  await requireAdmin();
  const db = await requireAdminClient();

  const { data: program } = await db
    .from('programs')
    .select('id,title')
    .or(`code.eq.${code},slug.eq.${code}`)
    .maybeSingle();

  if (!program) {
    return <div className="p-8"><h1 className="text-2xl font-bold">Program not found</h1></div>;
  }

  const { data: courses, error: courseError } = await db
    .from('courses')
    .select('id,title')
    .eq('program_id', program.id)
    .order('title');
  if (courseError) throw courseError;

  const courseIds = (courses ?? []).map((course) => course.id);
  const { data: lessons, error: lessonError } = courseIds.length
    ? await db
        .from('course_lessons')
        .select('id,title,video_url,course_id')
        .in('course_id', courseIds)
        .order('order_index')
        .limit(1000)
    : { data: [], error: null };
  if (lessonError) throw lessonError;

  const withVideo = (lessons ?? []).filter((lesson) => Boolean(lesson.video_url));
  const withoutVideo = (lessons ?? []).filter((lesson) => !lesson.video_url);
  const courseTitle = new Map((courses ?? []).map((course) => [course.id, course.title]));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <nav className="mb-4 text-sm text-slate-600">
        <Link href="/programs" className="hover:underline">Programs</Link>
        <span className="px-2">/</span>
        <Link href={`/programs/${code}/dashboard`} className="hover:underline">{program.title}</Link>
        <span className="px-2">/</span><span>Media</span>
      </nav>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Media — {program.title}</h1>
          <p className="mt-1 text-sm text-slate-600">Canonical course lesson media across {courses?.length ?? 0} course(s).</p>
        </div>
        <Link href="/course-builder" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-brand-blue-600 px-4 py-2 font-bold text-white hover:bg-brand-blue-700">
          <WandSparkles className="h-4 w-4" /> Manage in Course Builder
        </Link>
      </div>

      <div className="mb-8 grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border bg-white p-6">
          <div className="mb-2 flex items-center gap-3"><Film className="h-5 w-5 text-brand-blue-600" /><h2 className="font-medium">Lesson videos</h2></div>
          <p className="text-3xl font-bold">{withVideo.length}</p>
          <p className="text-sm text-slate-600">of {lessons?.length ?? 0} canonical lessons have video</p>
        </div>
        <div className="rounded-lg border bg-white p-6">
          <div className="mb-2 flex items-center gap-3"><ImageIcon className="h-5 w-5 text-amber-600" /><h2 className="font-medium">Missing video</h2></div>
          <p className="text-3xl font-bold">{withoutVideo.length}</p>
          <p className="text-sm text-slate-600">canonical lessons still needing video</p>
        </div>
      </div>

      {withoutVideo.length > 0 && (
        <section className="mb-8 overflow-hidden rounded-lg border bg-white">
          <h2 className="border-b bg-amber-50 px-4 py-3 font-medium text-amber-900">Lessons missing video</h2>
          <ul className="max-h-96 divide-y overflow-y-auto">
            {withoutVideo.map((lesson) => (
              <li key={lesson.id} className="px-4 py-3 text-sm">
                <span className="font-medium">{lesson.title || lesson.id}</span>
                <span className="ml-2 text-slate-500">{courseTitle.get(lesson.course_id) || 'Course'}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {withVideo.length > 0 && (
        <section className="overflow-hidden rounded-lg border bg-white">
          <h2 className="border-b bg-emerald-50 px-4 py-3 font-medium text-emerald-900">Lessons with video</h2>
          <ul className="max-h-96 divide-y overflow-y-auto">
            {withVideo.map((lesson) => (
              <li key={lesson.id} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                <div><span className="font-medium">{lesson.title || lesson.id}</span><span className="ml-2 text-slate-500">{courseTitle.get(lesson.course_id) || 'Course'}</span></div>
                <span className="max-w-xs truncate font-mono text-xs text-slate-500">{lesson.video_url}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
