import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'CMI Program Dashboard | Admin',
  description: 'Choice Medical Institute CNA program — enrollment, attendance, clinicals, and certificates.',
};

const STATUS_LABELS: Record<string, string> = {
  enrolled:   'Enrolled',
  training:   'In Training',
  clinical:   'Clinical',
  completed:  'Completed',
  withdrawn:  'Withdrawn',
};

const STATUS_COLORS: Record<string, string> = {
  enrolled:  'bg-blue-100 text-blue-800',
  training:  'bg-amber-100 text-amber-800',
  clinical:  'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  withdrawn: 'bg-slate-100 text-slate-600',
};

export default async function CMIDashboardPage() {
  // Auth — admin layout handles redirect, but double-check role here
  const supabase = await createClient();
  const adminDb = createAdminClient();
  const db = adminDb || supabase;

  if (!supabase) redirect('/login?redirect=/admin/cmi');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/admin/cmi');

  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'super_admin', 'staff'].includes(profile.role)) {
    redirect('/admin');
  }

  // Fetch CMI students with linked application data
  const { data: students, error } = await db
    .from('cmi_students')
    .select(`
      id,
      user_id,
      cohort,
      status,
      enrolled_at,
      completed_at,
      application_id,
      applications (
        first_name,
        last_name,
        email,
        phone,
        program_slug
      )
    `)
    .order('enrolled_at', { ascending: false });

  // Summary counts
  const counts = (students ?? []).reduce<Record<string, number>>((acc, s) => {
    acc[s.status] = (acc[s.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">
          Partner Program
        </p>
        <h1 className="text-3xl font-bold text-slate-900">
          Choice Medical Institute (CMI)
        </h1>
        <p className="mt-1 text-slate-500">
          IDOH Approved CNA Program · Sponsored by Elevate for Humanity
        </p>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <div key={key} className="rounded-xl border border-slate-200 bg-white p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{counts[key] ?? 0}</p>
            <p className="mt-1 text-xs text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Failed to load student data. Apply migration{' '}
          <code className="font-mono">20260503000008_cmi_tables.sql</code> in Supabase Dashboard.
        </div>
      )}

      {/* Student table */}
      <div className="rounded-2xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">
            Students ({students?.length ?? 0})
          </h2>
          <span className="text-xs text-slate-500">
            Routed from CNA applications via approve-cna
          </span>
        </div>

        {!students?.length ? (
          <div className="px-6 py-12 text-center text-slate-500">
            No CMI students yet. Approve a CNA application to enroll the first student.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-slate-600">Student</th>
                <th className="px-6 py-3 text-left font-medium text-slate-600">Cohort</th>
                <th className="px-6 py-3 text-left font-medium text-slate-600">Status</th>
                <th className="px-6 py-3 text-left font-medium text-slate-600">Enrolled</th>
                <th className="px-6 py-3 text-left font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((s) => {
                const app = Array.isArray(s.applications) ? s.applications[0] : s.applications;
                const name = app
                  ? `${app.first_name ?? ''} ${app.last_name ?? ''}`.trim()
                  : s.user_id?.slice(0, 8) ?? '—';
                const email = app?.email ?? '—';
                const enrolledDate = new Date(s.enrolled_at).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric',
                });

                return (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">{name}</p>
                      <p className="text-xs text-slate-500">{email}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {s.cohort ?? <span className="text-slate-400">Unassigned</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[s.status] ?? 'bg-slate-100 text-slate-600'}`}>
                        {STATUS_LABELS[s.status] ?? s.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{enrolledDate}</td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/cmi/${s.id}`}
                        className="text-xs font-medium text-slate-700 hover:text-slate-900 underline underline-offset-2"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
