import type { Metadata } from 'next';
import Link from 'next/link';
import UnifiedCourseBuilder from '@/components/admin/course-builder/UnifiedCourseBuilder';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { robots: { index: false, follow: false } };

type CourseBuilderTab =
  | 'courses'
  | 'workspace'
  | 'ai'
  | 'blueprints'
  | 'media'
  | 'monitor'
  | 'governance'
  | 'registry';

const COURSE_BUILDER_TABS: ReadonlySet<string> = new Set([
  'courses',
  'workspace',
  'ai',
  'blueprints',
  'media',
  'monitor',
  'governance',
  'registry',
] as const);

function isCourseBuilderTab(value: string | undefined): value is CourseBuilderTab {
  return Boolean(value && COURSE_BUILDER_TABS.has(value));
}

export default async function StudioCoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ courseId?: string; tab?: string }>;
}) {
  const params = await searchParams;
  const initialTab = isCourseBuilderTab(params.tab) ? params.tab : 'workspace';

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <header className="border-b border-slate-200 bg-white px-5 py-4">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3">
          <div>
            <Link href="/studio" className="text-sm font-semibold text-slate-600 hover:text-slate-950">
              ← Admin AI
            </Link>
            <h1 className="mt-1 text-2xl font-black tracking-tight">Course Builder</h1>
            <p className="mt-1 text-sm text-slate-600">
              Create, govern, review, and publish courses through the canonical Course Factory.
            </p>
          </div>
        </div>
      </header>
      <section>
        <UnifiedCourseBuilder initialCourseId={params.courseId?.trim() || ''} initialTab={initialTab} />
      </section>
    </main>
  );
}
