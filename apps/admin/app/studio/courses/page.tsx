import { requireRole } from '@/lib/auth/require-role';
import type { Metadata } from 'next';
import Link from 'next/link';
import CourseProductionWorkspace from '@/components/admin/course-builder/CourseProductionWorkspace';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { manifest: '/manifest-course-builder.json', robots: { index: false, follow: false } };

type CourseBuilderTab = 'courses' | 'ultimate' | 'registry' | 'media';

const COURSE_BUILDER_TABS: ReadonlySet<string> = new Set([
  'courses',
  'ultimate',
  'registry',
  'media',
] as const);

function isCourseBuilderTab(value: string | undefined): value is CourseBuilderTab {
  return Boolean(value && COURSE_BUILDER_TABS.has(value));
}

export default async function StudioCoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ courseId?: string; tab?: string }>;
}) {
  await requireRole(['super_admin', 'admin']);
  const params = await searchParams;
  const initialTab = isCourseBuilderTab(params.tab) ? params.tab : 'ultimate';

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <header className="border-b border-slate-200 bg-white px-5 py-4">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3">
          <div>
            <Link href="/studio" className="text-sm font-semibold text-slate-600 hover:text-slate-950">
              ← Admin AI
            </Link>
            <h1 className="mt-1 text-2xl font-black tracking-tight">Course Production Studio</h1>
            <p className="mt-1 text-sm text-slate-600">
              Create lessons, preview media, diagnose checkpoints, and publish verified courses.
            </p>
          </div>
        </div>
      </header>
      <section>
        <CourseProductionWorkspace initialCourseId={params.courseId?.trim() || ''} initialTab={initialTab} />
      </section>
    </main>
  );
}
