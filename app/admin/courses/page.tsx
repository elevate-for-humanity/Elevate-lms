import { Metadata } from 'next';

import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { getAdminCoursesOverview } from '@/lib/admin/course-admin-overview';
import { AdminCoursesTable } from './AdminCoursesTable';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Course Management | Admin | Elevate For Humanity',
};

export default async function AdminCoursesPage() {
  await requireAdmin();

  const courses = await getAdminCoursesOverview();

  const complete   = courses.filter(c => c.status === 'complete').length;
  const partial    = courses.filter(c => c.status === 'partial').length;
  const structured = courses.filter(c => c.status === 'structured').length;
  const empty      = courses.filter(c => c.status === 'empty').length;
  const totalLessons = courses.reduce((sum, c) => sum + c.actualLessons, 0);

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-50 border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Courses' }]} />
        </div>
      </div>

      <section className="bg-brand-blue-700 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">Course Management</h1>
            <p className="text-brand-blue-200 text-sm">
              {courses.length} courses · {totalLessons} lessons in DB
            </p>
          </div>
          <Link
            href="/admin/courses/create"
            className="rounded-lg bg-white text-brand-blue-700 px-4 py-2 text-sm font-semibold hover:bg-brand-blue-50"
          >
            + Create Course
          </Link>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Total',      value: courses.length, cls: 'text-slate-900' },
            { label: 'Complete',   value: complete,        cls: 'text-emerald-700' },
            { label: 'Partial',    value: partial,         cls: 'text-amber-700' },
            { label: 'Structured', value: structured,      cls: 'text-brand-blue-700' },
            { label: 'Empty',      value: empty,           cls: 'text-slate-500' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-lg border p-4">
              <p className="text-xs text-slate-500 mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.cls}`}>{s.value}</p>
            </div>
          ))}
        </div>

        <AdminCoursesTable courses={courses} />
      </div>
    </div>
  );
}
