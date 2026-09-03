import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus, BookOpen, ChevronRight } from 'lucide-react';
import { requireAdmin } from '@/lib/auth';
import { requireAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const revalidate = 60;
export const metadata: Metadata = { title: 'Program Courses | Elevate Admin' };

export default async function ProgramCoursesPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  await requireAdmin();
  const db = await requireAdminClient();

  const { data: program } = await db
    .from('programs')
    .select('id,title,code,slug')
    .or(`code.eq.${code},slug.eq.${code}`)
    .maybeSingle();
  if (!program) return <div className="p-8"><h1 className="text-2xl font-bold">Program not found</h1></div>;

  const { data: courses, error: courseError } = await db
    .from('courses')
    .select('id,title,slug,status,duration_hours,is_active,created_at')
    .eq('program_id', program.id)
    .order('created_at', { ascending: true });
  if (courseError) throw courseError;

  const courseIds = (courses ?? []).map((course) => course.id);
  const lessonCounts: Record<string, number> = {};
  if (courseIds.length) {
    const { data: lessons, error: lessonError } = await db
      .from('course_lessons')
      .select('course_id')
      .in('course_id', courseIds);
    if (lessonError) throw lessonError;
    for (const lesson of lessons ?? []) lessonCounts[lesson.course_id] = (lessonCounts[lesson.course_id] ?? 0) + 1;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <nav className="mb-4 text-sm text-slate-600">
        <Link href="/programs" className="hover:underline">Programs</Link><span className="px-2">/</span>
        <Link href={`/programs/${code}/dashboard`} className="hover:underline">{program.title}</Link><span className="px-2">/</span><span>Courses</span>
      </nav>

      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-950">Courses — {program.title}</h1>
        <Link href="/course-builder" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-brand-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-blue-700">
          <Plus className="h-4 w-4" /> Build Course
        </Link>
      </div>

      {!courses?.length ? (
        <div className="rounded-lg border bg-white p-12 text-center">
          <BookOpen className="mx-auto mb-4 h-12 w-12 text-slate-400" />
          <h2 className="mb-2 text-lg font-medium text-slate-900">No courses yet</h2>
          <p className="mb-4 text-slate-600">Create this program's first canonical course in Course Builder.</p>
          <Link href="/course-builder" className="font-medium text-brand-blue-700 hover:underline">Open Course Builder</Link>
        </div>
      ) : (
        <div className="divide-y rounded-lg border bg-white">
          {courses.map((course) => (
            <Link key={course.id} href={`/course-builder?courseId=${encodeURIComponent(course.id)}`} className="flex items-center justify-between p-4 hover:bg-slate-50">
              <div className="flex-1">
                <h2 className="font-medium text-slate-900">{course.title}</h2>
                <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-slate-600">
                  <span>{lessonCounts[course.id] ?? 0} lessons</span>
                  {course.duration_hours ? <span>{course.duration_hours}h</span> : null}
                  <span>{course.status || (course.is_active ? 'active' : 'inactive')}</span>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
