import { Metadata } from 'next';
import Link from 'next/link';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { BulkCourseActions } from './BulkCourseActions';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Bulk Course Operations | Dev Studio' };

export default async function BulkOperationsPage() {
  await requireRole(['admin', 'staff']);
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
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <Breadcrumbs items={[{ label: 'Dev Studio', href: '/studio' }, { label: 'Course Builder', href: '/studio/courses' }, { label: 'Bulk Operations' }]} />
        <div className="mb-6 mt-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Bulk Course Operations</h1>
            <p className="mt-0.5 text-sm text-slate-500">{count ?? 0} courses total</p>
          </div>
          <Link href="/studio/courses" className="text-sm text-slate-600 hover:underline">← Back to Course Builder</Link>
        </div>
        <div className="mb-6 grid grid-cols-3 gap-4">
          {[{ label: 'Published', value: published, cls: 'text-green-700' }, { label: 'Drafts', value: drafts, cls: 'text-amber-700' }, { label: 'Archived', value: archived, cls: 'text-slate-500' }].map(({ label, value, cls }) => (
            <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 text-center">
              <p className={`text-2xl font-extrabold ${cls}`}>{value}</p>
              <p className="mt-0.5 text-xs font-semibold text-slate-500">{label}</p>
            </div>
          ))}
        </div>
        <BulkCourseActions courses={courses ?? []} />
      </div>
    </div>
  );
}
