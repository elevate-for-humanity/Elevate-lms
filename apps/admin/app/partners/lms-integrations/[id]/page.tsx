import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BookOpen, ExternalLink, Globe, Users, Activity } from 'lucide-react';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import LmsIntegrationClientShell from './LmsIntegrationClientShell';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'LMS Integration Details | Admin', robots: { index: false, follow: false } };

export default async function LMSIntegrationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = await requireRole(['admin', 'staff']);
  const { id } = await params;
  const db = await requireAdminClient();

  const { data: provider, error } = await db
    .from('partner_lms_providers')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error || !provider) notFound();

  const { data: courses } = await db
    .from('partner_lms_courses')
    .select('id, course_name, course_url, status, created_at')
    .eq('provider_id', id)
    .order('course_name');

  const courseIds = (courses ?? []).map((course: any) => course.id).filter(Boolean);
  const { count: enrollmentCount } = courseIds.length
    ? await db.from('partner_lms_enrollments').select('id', { count: 'exact', head: true }).in('course_id', courseIds)
    : { count: 0 };

  const { data: syncLogs } = await db
    .from('partner_lms_sync_logs')
    .select('id, status, message, created_at')
    .eq('provider_id', id)
    .order('created_at', { ascending: false })
    .limit(8);

  const firstPlayable = (courses ?? []).find((course: any) => Boolean(course.course_url));
  const providerName = provider.provider_name || provider.name || 'LMS Provider';

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-r from-sky-700 via-blue-700 to-indigo-800 px-6 py-8 text-white">
        <div className="mx-auto max-w-6xl">
          <Link href="/partners/lms-integrations" className="inline-flex items-center gap-2 text-sm font-bold text-white/90 hover:text-white"><ArrowLeft className="h-4 w-4" />Back to LMS integrations</Link>
          <div className="mt-5 flex flex-wrap items-end justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-sky-100"><Globe className="h-5 w-5" />Partner LMS</div>
              <h1 className="mt-2 text-3xl font-black">{providerName}</h1>
              <p className="mt-2 max-w-2xl text-sm font-medium text-sky-50">Review provider status, available courses, enrollment volume, and recent sync activity.</p>
            </div>
            <span className="rounded-full bg-white/15 px-4 py-2 text-sm font-black uppercase">{provider.status || 'configured'}</span>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-6 px-6 py-7">
        <section className="grid gap-4 sm:grid-cols-3">
          {[
            ['Courses', String(courses?.length ?? 0), BookOpen],
            ['Enrollments', String(enrollmentCount ?? 0), Users],
            ['Recent sync events', String(syncLogs?.length ?? 0), Activity],
          ].map(([label, value, Icon]) => {
            const CardIcon = Icon as typeof BookOpen;
            return <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><CardIcon className="h-5 w-5 text-blue-700" /><div className="mt-3 text-xs font-black uppercase tracking-wide text-slate-500">{String(label)}</div><div className="mt-1 text-2xl font-black text-slate-950">{String(value)}</div></div>;
          })}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black text-slate-950">Courses</h2>
            <div className="mt-4 space-y-3">
              {(courses ?? []).length ? (courses ?? []).map((course: any) => (
                <div key={course.id} className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div><div className="font-black text-slate-950">{course.course_name || 'Untitled course'}</div><div className="mt-1 text-xs font-semibold text-slate-500">{course.status || 'active'}</div></div>
                  {course.course_url && <a href={course.course_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-black text-blue-700"><ExternalLink className="h-4 w-4" />Open</a>}
                </div>
              )) : <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm font-semibold text-slate-500">No partner courses configured.</div>}
            </div>
          </div>

          <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-slate-950">Sync history</h2>
            <div className="mt-4 space-y-3">
              {(syncLogs ?? []).length ? (syncLogs ?? []).map((log: any) => <div key={log.id} className="rounded-xl bg-slate-50 p-3"><div className="text-sm font-black text-slate-900">{log.status || 'Sync event'}</div><div className="mt-1 text-xs font-medium text-slate-500">{log.message || 'No message'}{log.created_at ? ` · ${new Date(log.created_at).toLocaleString()}` : ''}</div></div>) : <p className="text-sm font-semibold text-slate-500">No sync activity recorded.</p>}
            </div>
          </aside>
        </section>

        {firstPlayable?.course_url && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-black text-slate-950">Course preview</h2>
            <LmsIntegrationClientShell
              courseId={firstPlayable.id}
              courseName={firstPlayable.course_name || 'Course'}
              partnerName={providerName}
              courseUrl={firstPlayable.course_url}
              userId={user.id}
              enrollmentId={firstPlayable.id}
            />
          </section>
        )}
      </div>
    </main>
  );
}
