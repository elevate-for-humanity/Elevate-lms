import { Metadata } from 'next';
import Link from 'next/link';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import { Users, GraduationCap, Clock3, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Apprentices | Employer Portal',
  description: 'Track active apprentices, progress, and completion status.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/employer/apprentices' },
};

const STATUS_STYLE: Record<string, string> = {
  active: 'bg-brand-green-100 text-brand-green-800',
  completed: 'bg-brand-blue-100 text-brand-blue-800',
  suspended: 'bg-brand-red-100 text-brand-red-800',
  pending: 'bg-amber-100 text-amber-800',
};

function extractHours(row: any): number {
  const candidates = [row.total_hours_completed, row.total_hours, row.completed_hours];
  for (const value of candidates) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
  }
  return 0;
}

export default async function EmployerApprenticesPage() {
  const { user } = await requireRole(['employer', 'admin', 'super_admin']);
  const supabase = await createClient();

  const { data: programs } = await supabase
    .from('apprenticeships')
    .select('id, title, status')
    .eq('employer_id', user.id)
    .order('created_at', { ascending: false });

  const apprenticeshipIds = (programs ?? []).map((p: any) => p.id);
  const apprenticeshipMap = Object.fromEntries((programs ?? []).map((p: any) => [p.id, p]));

  const { data: enrollments } = apprenticeshipIds.length
    ? await supabase
        .from('apprenticeship_enrollments')
        .select('*')
        .in('apprenticeship_id', apprenticeshipIds)
        .order('created_at', { ascending: false })
    : { data: [] };

  const studentIds = [
    ...new Set(
      (enrollments ?? [])
        .map((r: any) => r.student_id || r.user_id)
        .filter((id: any) => typeof id === 'string' && id.length > 0),
    ),
  ];

  const { data: students } = studentIds.length
    ? await supabase.from('profiles').select('id, full_name, email').in('id', studentIds)
    : { data: [] };

  const studentMap = Object.fromEntries((students ?? []).map((s: any) => [s.id, s]));

  const rows = (enrollments ?? []).map((row: any) => {
    const studentId = row.student_id || row.user_id;
    return {
      ...row,
      student: studentMap[studentId] || null,
      apprenticeship: apprenticeshipMap[row.apprenticeship_id] || null,
      hours: extractHours(row),
    };
  });

  const activeCount = rows.filter((r: any) => r.status === 'active').length;
  const completedCount = rows.filter((r: any) => r.status === 'completed').length;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-brand-blue-600 mb-1">
              Employer Portal
            </p>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Apprentices</h1>
            <p className="text-slate-600 mt-1">Monitor apprentice participation and completion across your programs.</p>
          </div>
          <Link
            href="/employer/apprenticeships"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100"
          >
            View Programs
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatCard label="Total Apprentices" value={rows.length} icon={<Users className="w-5 h-5 text-brand-blue-600" />} />
          <StatCard label="Active" value={activeCount} icon={<Clock3 className="w-5 h-5 text-brand-green-600" />} />
          <StatCard label="Completed" value={completedCount} icon={<GraduationCap aria-label="graduationcap" className="w-5 h-5 text-brand-blue-600" />} />
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="font-bold text-slate-900">Apprentice Roster</h2>
            <span className="text-sm text-slate-500">{rows.length} records</span>
          </div>

          {rows.length === 0 ? (
            <div className="p-10 text-center">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="font-semibold text-slate-800">No apprentices enrolled yet</p>
              <p className="text-sm text-slate-500 mt-1">
                Add or activate apprenticeship programs to begin tracking apprentice cohorts.
              </p>
              <div className="mt-5">
                <Link
                  href="/employer/apprenticeships/new"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-blue-600 text-white hover:bg-brand-blue-700"
                >
                  Create Program
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-5 py-3 font-semibold text-slate-700">Apprentice</th>
                    <th className="text-left px-5 py-3 font-semibold text-slate-700">Program</th>
                    <th className="text-left px-5 py-3 font-semibold text-slate-700">Status</th>
                    <th className="text-left px-5 py-3 font-semibold text-slate-700">Hours</th>
                    <th className="text-left px-5 py-3 font-semibold text-slate-700">Started</th>
                    <th className="text-left px-5 py-3 font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((row: any) => (
                    <tr key={row.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3">
                        <p className="font-semibold text-slate-900">{row.student?.full_name || 'Apprentice'}</p>
                        <p className="text-slate-600">{row.student?.email || 'Email not available'}</p>
                      </td>
                      <td className="px-5 py-3 text-slate-700">
                        {row.apprenticeship?.title || 'Program unavailable'}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLE[row.status] || 'bg-slate-100 text-slate-700'}`}
                        >
                          {row.status || 'pending'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-700">{row.hours.toFixed(1)}</td>
                      <td className="px-5 py-3 text-slate-700">
                        {row.created_at ? new Date(row.created_at).toLocaleDateString() : 'Unknown'}
                      </td>
                      <td className="px-5 py-3">
                        {row.apprenticeship_id ? (
                          <Link
                            href={`/employer/apprenticeships/${row.apprenticeship_id}`}
                            className="inline-flex items-center gap-1 text-brand-blue-700 hover:text-brand-blue-800 font-medium"
                          >
                            View Program <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        ) : (
                          <span className="text-slate-500">N/A</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-slate-600">{label}</span>
        {icon}
      </div>
      <p className="text-2xl font-extrabold text-slate-900">{value}</p>
    </div>
  );
}
