import { Metadata } from 'next';
import { getAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, CheckCircle, Clock, Plus, ArrowRight } from 'lucide-react';
import { AdminPageShell, AdminCard, AdminEmptyState } from '@/components/admin/AdminPageShell';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Career Courses | Admin',
};

export default async function CareerCoursesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const db = await getAdminClient();
  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single();
  if (!['admin', 'super_admin', 'staff'].includes(profile?.role ?? '')) redirect('/unauthorized');

  const [
    { data: courses, count: total },
    { count: published },
    { count: draft },
  ] = await Promise.all([
    db.from('career_courses')
      .select('id, title, slug, status, created_at, updated_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(50),
    db.from('career_courses').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    db.from('career_courses').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
  ]);

  return (
    <AdminPageShell
      title="Career Courses"
      description="Self-paced career development courses available in the marketplace."
      breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Career Courses' }]}
      stats={[
        { label: 'Total',     value: total ?? 0,     icon: BookOpen,     color: 'slate' },
        { label: 'Published', value: published ?? 0, icon: CheckCircle,  color: 'green' },
        { label: 'Draft',     value: draft ?? 0,     icon: Clock,        color: 'amber' },
      ]}
      actions={
        <Link
          href="/admin/career-courses/create"
          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold px-4 py-2 rounded-lg border border-white/20 transition-colors"
        >
          <Plus className="w-4 h-4" /> New Course
        </Link>
      }
    >
      <AdminCard>
        {courses && courses.length > 0 ? (
          <div className="divide-y divide-slate-100">
            <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-slate-50 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              <div className="col-span-5">Title</div>
              <div className="col-span-3">Slug</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-1">Updated</div>
              <div className="col-span-1" />
            </div>
            {courses.map((course: any) => (
              <div key={course.id} className="grid grid-cols-12 gap-4 px-5 py-4 items-center hover:bg-slate-50 transition-colors">
                <div className="col-span-5">
                  <p className="text-sm font-semibold text-slate-900 truncate">{course.title || '—'}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{course.id.slice(0, 8)}…</p>
                </div>
                <div className="col-span-3">
                  <p className="text-xs text-slate-500 font-mono truncate">{course.slug || '—'}</p>
                </div>
                <div className="col-span-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                    course.status === 'published'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {course.status ?? 'draft'}
                  </span>
                </div>
                <div className="col-span-1">
                  <p className="text-xs text-slate-400">
                    {course.updated_at ? new Date(course.updated_at).toLocaleDateString() : '—'}
                  </p>
                </div>
                <div className="col-span-1 text-right">
                  <Link
                    href={`/admin/career-courses/create?id=${course.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue-600 hover:text-brand-blue-700"
                  >
                    Edit <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <AdminEmptyState message="No career courses yet. Create the first one." />
        )}
      </AdminCard>
    </AdminPageShell>
  );
}
