import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, Clock, Play, CheckCircle, Video, Scissors, ArrowRight, Award } from 'lucide-react';
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

  const { data: barberCourse } = await supabase
    .from('courses')
    .select('id,title,slug,short_description,thumbnail_url,total_lessons,duration_hours')
    .eq('slug', 'barber-apprenticeship')
    .eq('is_active', true)
    .maybeSingle();

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
        ) : barberCourse ? (
          <article className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="bg-gradient-to-r from-cyan-600 to-blue-700 p-8 text-white"><div className="flex items-center gap-4"><div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20"><Scissors className="h-10 w-10" /></div><div><div className="mb-1 flex items-center gap-2 text-sm text-cyan-100"><Award className="h-4 w-4" /> Barber Apprenticeship Training</div><h2 className="text-2xl font-bold">{barberCourse.title}</h2></div></div></div>
            <div className="p-6"><div className="mb-6 flex flex-wrap gap-6 text-sm text-slate-700"><span className="flex items-center gap-2"><Video className="h-5 w-5 text-cyan-600" />{barberCourse.total_lessons || 0} lessons</span><span className="flex items-center gap-2"><Clock className="h-5 w-5 text-cyan-600" />{barberCourse.duration_hours || 0}h training</span><span className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-emerald-600" />Exam preparation</span></div><div className="flex flex-wrap gap-4"><Link href="/apprentice/course" className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-6 py-3 font-bold text-white"><Play className="h-5 w-5" /> Start Training</Link><Link href="/apprentice" className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-6 py-3 font-medium text-slate-700">View Dashboard <ArrowRight className="h-4 w-4" /></Link></div></div>
          </article>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center"><BookOpen className="mx-auto mb-4 h-16 w-16 text-slate-300" /><h2 className="text-xl font-bold">No Courses Yet</h2><Link href="/programs" className="mt-6 inline-flex rounded-lg bg-blue-600 px-6 py-3 font-medium text-white">Browse Programs</Link></div>
        )}
      </div></section>
    </main>
  );
}
