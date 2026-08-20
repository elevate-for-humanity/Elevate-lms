import type { Metadata } from 'next';
import Link from 'next/link';
import UnifiedCourseBuilder from '@/components/admin/course-builder/UnifiedCourseBuilder';
import styles from './course-builder-light.module.css';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function StudioCoursesPage() {
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
          <nav className="flex flex-wrap gap-2" aria-label="Course Builder tools">
            <Link
              href="/studio/courses/bulk-operations"
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 shadow-sm hover:bg-slate-50"
            >
              Bulk Operations
            </Link>
            <Link
              href="/studio/courses/lifecycle"
              className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-slate-800"
            >
              Governance · Versions · SCORM
            </Link>
          </nav>
        </div>
      </header>
      <section className={styles.courseBuilderLight}>
        <UnifiedCourseBuilder />
      </section>
    </main>
  );
}
