import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { BulkCourseActions } from './BulkCourseActions';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Bulk Course Operations | Admin',
};

export default async function BulkOperationsPage() {
  await requireRole(['admin', 'super_admin', 'staff']);
  const db = await requireAdminClient();
  if (!db) throw new Error('Admin client unavailable');

  const { data: courses, count } = await db
    .from('lms_courses')
    .select('id, title, slug, status, is_active, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(200);

  const published = courses?.filter((c) => c.status === 'published' && c.is_active).length ?? 0;
  const drafts = courses?.filter((c) => c.status === 'draft').length ?? 0;
  const archived = courses?.filter((c) => c.status === 'archived').length ?? 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <Breadcrumbs items={[
          { label: 'Admin', href: '/admin' },
          { label: 'Courses', href: '/admin/courses' },
          { label: 'Bulk Operations' },
        ]} />

        <div className="flex items-center justify-between mt-4 mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Bulk Course Operations</h1>
            <p className="text-slate-500 text-sm mt-0.5">{count ?? 0} courses total</p>
          </div>
          <Link href="/admin/courses" className="text-sm text-slate-600 hover:underline">
            ← Back to Courses
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Published', value: published, color: 'text-green-700' },
            { label: 'Drafts', value: drafts, color: 'text-amber-700' },
            { label: 'Archived', value: archived, color: 'text-slate-500' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
              <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        <BulkCourseActions courses={courses ?? []} />
      </div>
    </div>
  );
}
