import type { Metadata } from 'next';
import Link from 'next/link';
import UnifiedCourseBuilder from '@/components/admin/course-builder/UnifiedCourseBuilder';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function StudioCoursesPage() {
  return (
    <>
      <div className="border-b border-slate-800 bg-slate-950 px-5 py-3 text-sm text-slate-300">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-2">
          <Link href="/studio" className="font-semibold text-slate-300 hover:text-white">
            ← Dev Studio
          </Link>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/course-builder/bulk-operations"
              className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 font-bold text-slate-200 hover:bg-slate-800"
            >
              Bulk Operations
            </Link>
            <Link
              href="/course-builder/lifecycle"
              className="rounded-lg border border-cyan-700 bg-cyan-950/40 px-4 py-2 font-bold text-cyan-300 hover:bg-cyan-950"
            >
              Governance · Versions · SCORM
            </Link>
          </div>
        </div>
      </div>
      <UnifiedCourseBuilder />
    </>
  );
}
