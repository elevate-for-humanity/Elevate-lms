import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { BookOpen, Layers, ChevronRight, PlusCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/admin/curriculum',
  },
  title: 'Curriculum Management | Admin | Elevate For Humanity',
  description: 'Manage curriculum_lessons rows for all DB-driven LMS courses.',
};

export default async function CurriculumPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/admin/curriculum');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!['admin', 'super_admin', 'staff'].includes(profile?.role ?? '')) {
    redirect('/unauthorized');
  }

  // Aggregate lesson counts per course_id from curriculum_lessons (live table)
  const { data: lessonRows } = await supabase
    .from('curriculum_lessons')
    .select('course_id, step_type');

  // Build per-course stats
  const courseStats = new Map<string, {
    total: number;
    checkpoints: number;
  }>();

  for (const row of lessonRows ?? []) {
    const s = courseStats.get(row.course_id) ?? { total: 0, checkpoints: 0 };
    s.total++;
    if (row.step_type === 'checkpoint' || row.step_type === 'quiz' || row.step_type === 'exam') s.checkpoints++;
    courseStats.set(row.course_id, s);
  }

  const courseIds = Array.from(courseStats.keys());

  // Resolve course names from training_courses
  const { data: trainingCourses } = courseIds.length
    ? await supabase
        .from('courses')
        .select('id, title')
        .in('id', courseIds)
    : { data: [] };

  // Resolve remaining from programs
  const resolvedIds = new Set((trainingCourses ?? []).map((c: any) => c.id));
  const unresolvedIds = courseIds.filter(id => !resolvedIds.has(id));

  const { data: programs } = unresolvedIds.length
    ? await supabase
        .from('programs')
        .select('id, name')
        .in('id', unresolvedIds)
    : { data: [] };

  const nameMap = new Map<string, string>();
  for (const c of trainingCourses ?? []) nameMap.set(c.id, c.title);
  for (const p of programs ?? []) nameMap.set(p.id, p.name);

  // Build display list sorted by lesson count desc
  const courses = courseIds
    .map(id => ({
      id,
      name: nameMap.get(id) ?? id,
      ...courseStats.get(id)!,
    }))
    .sort((a, b) => b.total - a.total);

  const totalLessons = courses.reduce((sum, c) => sum + c.total, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Curriculum' }]} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-brand-blue-600" />
              Curriculum Management
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              DB-driven LMS courses — edit step types, passing scores, and lesson content.
            </p>
          </div>
          <Link
            href="/admin/courses/create"
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white text-sm font-semibold rounded-lg transition"
          >
            <PlusCircle className="w-4 h-4" />
            New course
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Courses</p>
            <p className="text-3xl font-bold text-brand-blue-600">{courses.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Total Lessons</p>
            <p className="text-3xl font-bold text-slate-800">{totalLessons}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Checkpoints</p>
            <p className="text-3xl font-bold text-amber-600">{courses.reduce((sum, c) => sum + c.checkpoints, 0)}</p>
          </div>
        </div>

        {/* Course list */}
        {courses.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <Layers className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No course lessons found.</p>
            <p className="text-sm text-slate-400 mt-1">
              Run the curriculum generator or AI builder to seed lessons.
            </p>
            <Link
              href="/admin/courses/ai-builder"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-brand-blue-700 transition"
            >
              Open AI builder
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
            {courses.map(course => (
                <Link
                  key={course.id}
                  href={`/admin/curriculum/${course.id}`}
                  className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 group-hover:text-brand-blue-600 truncate">
                      {course.name}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5 font-mono">{course.id}</p>
                  </div>

                  <div className="flex items-center gap-6 ml-4 shrink-0">

                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-700">{course.total}</p>
                      <p className="text-xs text-slate-400">lessons</p>
                    </div>

                    {course.checkpoints > 0 && (
                      <div className="text-right hidden md:block">
                        <p className="text-sm font-semibold text-amber-600">{course.checkpoints}</p>
                        <p className="text-xs text-slate-400">gated</p>
                      </div>
                    )}

                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-brand-blue-400 transition" />
                  </div>
                </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
