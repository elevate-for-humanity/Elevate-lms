import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, Play, Scissors } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = { title: `My Courses | ${PLATFORM_DEFAULTS.orgName} LMS`, description: 'Access your enrolled courses and track your learning progress.' };
export const dynamic = 'force-dynamic';

type CourseRow = { id: string; title: string; slug: string; short_description?: string | null; thumbnail_url?: string | null; total_lessons?: number | null; duration_hours?: number | null };
function normalizeCourse(value: CourseRow | CourseRow[] | null | undefined): CourseRow | null { return Array.isArray(value) ? value[0] ?? null : value ?? null; }

export default async function LMSCoursesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50"><div className="text-center"><BookOpen className="mx-auto mb-4 h-16 w-16 text-slate-300" /><h1 className="mb-2 text-xl font-bold">Sign in to view your courses</h1><Link href="/login?redirect=/lms/courses" className="mt-4 inline-flex rounded-lg bg-blue-600 px-6 py-3 font-medium text-white">Sign In</Link></div></div>;
  }

  const { data: enrolledCourses } = await supabase
    .from('lms_progress')
    .select('id,status,progress_percent,started_at,last_activity_at,course:course_id(id,title,slug,short_description,thumbnail_url,total_lessons,duration_hours)')
    .eq('user_id', user.id)
    .eq('course.is_active', true);

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white px-6 py-8"><div className="mx-auto max-w-6xl"><h1 className="text-2xl font-bold">My Courses</h1><p className="mt-1 text-slate-500">Track your enrolled courses and progress.</p></div></section>
      <section className="px-6 py-8"><div className="mx-auto max-w-6xl">
        {enrolledCourses?.length ? (
          <div className="space-y-4">
            {enrolledCourses.map((enrollment: any) => {
              const course = normalizeCourse(enrollment.course as CourseRow | CourseRow[] | null);
              if (!course) return null;
              const progress = Math.max(0, Math.min(100, Number(enrollment.progress_percent || 0)));
              return <article key={enrollment.id} className="rounded-xl border border-slate-200 bg-white p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-cyan-100">{course.thumbnail_url ? <img src={course.thumbnail_url} alt="" className="h-full w-full object-cover" /> : <Scissors className="h-8 w-8 text-cyan-600" />}</div>
                  <div className="min-w-0 flex-1"><h2 className="truncate text-lg font-bold text-slate-950">{course.title}</h2><p className="truncate text-sm text-slate-500">{course.short_description || ''}</p></div>
                  <div className="text-sm text-slate-600">{course.total_lessons || 0} lessons · {course.duration_hours || 0}h</div>
                  <Link href={`/lms/courses/${course.slug}`} className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 font-medium text-white"><Play className="h-4 w-4" /> Continue</Link>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-cyan-500" style={{ width: `${progress}%` }} /></div>
                <p className="mt-1 text-right text-xs text-slate-500">{progress}% complete</p>
              </article>;
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center"><BookOpen className="mx-auto mb-4 h-16 w-16 text-slate-300" /><h2 className="text-xl font-bold">No Courses Yet</h2><p className="mt-2 text-sm text-slate-500">Courses appear here only after an enrollment grants access.</p><Link href="/programs" className="mt-6 inline-flex rounded-lg bg-blue-600 px-6 py-3 font-medium text-white">Browse Programs</Link></div>
        )}
      </div></section>
    </main>
  );
}
