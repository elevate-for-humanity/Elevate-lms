import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { BookOpen, ArrowLeft, Layers } from 'lucide-react';
import CurriculumLessonManager from '@/components/admin/CurriculumLessonManager';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Curriculum Editor | Admin | Elevate For Humanity',
};

export default async function CurriculumCourseEditorPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const supabase = await createClient();
  const db = createAdminClient() || supabase;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/admin/curriculum/' + courseId);

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!['admin', 'super_admin', 'staff'].includes(profile?.role ?? '')) {
    redirect('/unauthorized');
  }

  // Resolve course name — try training_courses first, then programs table
  const { data: trainingCourse } = await supabase
    .from('courses')
    .select('id, title')
    .eq('id', courseId)
    .maybeSingle();

  const { data: program } = !trainingCourse
    ? await supabase.from('programs').select('id, name').eq('id', courseId).maybeSingle()
    : { data: null };

  const courseName =
    trainingCourse?.title ?? program?.name ?? null;

  // Verify at least one curriculum_lessons row exists for this courseId
  const { count: lessonCount } = await supabase
    .from('course_lessons')
    .select('id', { count: 'exact', head: true })
    .eq('course_id', courseId);

  if (lessonCount === 0 && !trainingCourse && !program) {
    notFound();
  }

  // HVAC remains legacy-driven pending content migration.
  // training_lessons (95 rows, course f0593164) is the live learner path.
  // curriculum_lessons (47 rows, program 4226f7f6) is an unpopulated skeleton
  // and must NOT be published or marketed as the live course until a full
  // content parity migration is completed and verified.
  const LEGACY_DRIVEN_COURSES: Record<string, string> = {
    '0ba9a61c-1f1b-4019-be6f-90e92eba2bc0':
      'HVAC Technician — live learner path is training_lessons (95 lessons). ' +
      'These curriculum_lessons rows are an unpopulated migration skeleton. ' +
      'Do not publish or route learners here until content parity is verified.',
  };
  const legacyWarning = LEGACY_DRIVEN_COURSES[courseId] ?? null;

  // Module summary for the sidebar
  const { data: moduleSummary } = await supabase
    .from('course_lessons')
    .select('module_order, module_title, step_type, status')
    .eq('course_id', courseId)
    .order('module_order')
    .order('lesson_order');

  // Group by module_order
  const moduleMap = new Map<number, { title: string; count: number; published: number }>();
  for (const row of moduleSummary ?? []) {
    const existing = moduleMap.get(row.module_order) ?? {
      title: (row as any).module_title ?? `Module ${row.module_order + 1}`,
      count: 0,
      published: 0,
    };
    existing.count++;
    if (row.status === 'published') existing.published++;
    moduleMap.set(row.module_order, existing);
  }
  const modules = Array.from(moduleMap.entries()).sort(([a], [b]) => a - b);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Breadcrumbs
            items={[
              { label: 'Admin', href: '/admin' },
              { label: 'Curriculum', href: '/admin/curriculum' },
              { label: courseName ?? courseId },
            ]}
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Legacy path warning — shown when curriculum_lessons is not the live path */}
        {legacyWarning && (
          <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 flex gap-3">
            <span className="text-amber-600 font-bold text-sm shrink-0">⚠️ LEGACY PATH ACTIVE</span>
            <p className="text-sm text-amber-800">{legacyWarning}</p>
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <Link
              href="/admin/curriculum"
              className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              All courses
            </Link>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-brand-blue-600" />
              {courseName ?? 'Curriculum Editor'}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {lessonCount ?? 0} lesson{lessonCount !== 1 ? 's' : ''} across {modules.length} module{modules.length !== 1 ? 's' : ''}
            </p>
          </div>

          <Link
            href={`/admin/courses/${courseId}/edit`}
            className="text-sm px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium"
          >
            Course settings
          </Link>
        </div>

        <div className="flex gap-6">
          {/* Sidebar — module overview */}
          {modules.length > 0 && (
            <aside className="w-56 shrink-0 hidden lg:block">
              <div className="bg-white rounded-xl border border-slate-200 p-4 sticky top-6">
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  Modules
                </h2>
                <ul className="space-y-1">
                  {modules.map(([order, mod]) => (
                    <li key={order}>
                      <a
                        href={`#module-${order}`}
                        className="flex items-center justify-between text-sm text-slate-700 hover:text-brand-blue-600 py-1 px-2 rounded hover:bg-slate-50 transition"
                      >
                        <span className="truncate">{mod.title}</span>
                        <span className="text-xs text-slate-400 ml-2 shrink-0">
                          {mod.published}/{mod.count}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          )}

          {/* Main — lesson editor */}
          <div className="flex-1 min-w-0">
            <CurriculumLessonManager courseId={courseId} />
          </div>
        </div>
      </div>
    </div>
  );
}
