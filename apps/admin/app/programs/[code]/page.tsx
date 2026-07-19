import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BookOpen, Users, BarChart3, ArrowRight, Edit3 } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  return {
    title: `Program: ${code} | Admin | Elevate For Humanity`,
  };
}

export default async function ProgramPage({ params }: { params: Promise<{ code: string }> }) {
  await requireRole(['admin', 'staff']);
  const { code } = await params;
  const db = await requireAdminClient();
  if (!db) notFound();

  // Try slug first, then id
  const { data: program } = await db
    .from('programs')
    .select(
      'id, title, slug, category, description, is_active, published, estimated_weeks, estimated_hours, credential_type, credential_name, created_at',
    )
    .or(`slug.eq.${code},id.eq.${code}`)
    .maybeSingle();

  if (!program) notFound();

  const [{ data: courses }, { count: enrollmentCount }, { data: modules }] = await Promise.all([
    db
      .from('courses')
      .select('id, title, status, updated_at')
      .eq('program_id', program.id)
      .order('updated_at', { ascending: false }),
    db
      .from('program_enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('program_id', program.id),
    db.from('modules').select('id, title, slug').eq('program_id', program.id).order('created_at'),
  ]);

  const courseRows = courses ?? [];
  const moduleRows = modules ?? [];

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-slate-200 px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 mb-1">
              <Link href="/admin/programs" className="hover:text-blue-600">
                Programs
              </Link>{' '}
              / {program.title}
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{program.title}</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {program.category} ·{' '}
              {program.credential_name ?? program.credential_type ?? 'No credential'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/admin/programs/${code}/dashboard`}
              className="inline-flex items-center gap-1.5 border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              <BarChart3 className="w-4 h-4" /> Dashboard
            </Link>
            <Link
              href={`/admin/compliance/wioa-etpl/${program.id}`}
              className="inline-flex items-center gap-1.5 border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              WIOA compliance
            </Link>
            <Link
              href={`/admin/programs/${code}/manage`}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              <Edit3 className="w-4 h-4" /> Edit
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Enrollments', value: enrollmentCount ?? 0, icon: Users },
            { label: 'Courses', value: courseRows.length, icon: BookOpen },
            { label: 'Modules', value: moduleRows.length, icon: BookOpen },
            { label: 'Est. Hours', value: program.estimated_hours ?? '—', icon: BarChart3 },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-xl border border-slate-200 p-5 text-center"
            >
              <p className="text-3xl font-bold text-blue-600">{s.value}</p>
              <p className="text-sm text-slate-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Program details */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Details</h2>
          <dl className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            {[
              { label: 'Slug', value: program.slug },
              { label: 'Status', value: program.is_active ? 'Active' : 'Inactive' },
              { label: 'Published', value: program.published ? 'Yes' : 'Draft' },
              { label: 'Est. Weeks', value: program.estimated_weeks ?? '—' },
              { label: 'Credential', value: program.credential_name ?? '—' },
              { label: 'Created', value: new Date(program.created_at).toLocaleDateString() },
            ].map((d) => (
              <div key={d.label}>
                <dt className="text-slate-400 text-xs">{d.label}</dt>
                <dd className="font-medium text-slate-900 mt-0.5">{d.value}</dd>
              </div>
            ))}
          </dl>
          {program.description && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <dt className="text-slate-400 text-xs mb-1">Description</dt>
              <dd className="text-slate-700 text-sm">{program.description}</dd>
            </div>
          )}
        </div>

        {/* Courses */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Courses ({courseRows.length})</h2>
            <Link
              href={`/admin/courses/create?program=${program.id}`}
              className="text-sm text-blue-600 hover:underline"
            >
              + Add Course
            </Link>
          </div>
          {courseRows.length === 0 ? (
            <div className="p-8 text-center text-slate-400">No courses yet.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {courseRows.map((c) => (
                <div
                  key={c.id}
                  className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div>
                    <div className="font-medium text-slate-900">{c.title}</div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Updated {new Date(c.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        c.status === 'published'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {c.status}
                    </span>
                    <Link
                      href={`/admin/courses/${c.id}`}
                      className="inline-flex items-center gap-1 text-blue-600 hover:underline text-sm"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
