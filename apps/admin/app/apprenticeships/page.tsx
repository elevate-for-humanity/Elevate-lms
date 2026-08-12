import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { ChevronRight, Users, Clock, BookOpen } from 'lucide-react';
import ApprenticeshipHoursClient from './ApprenticeshipHoursClient';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Apprenticeships | Admin | Elevate For Humanity' };

export default async function ApprenticeshipsPage() {
  await requireRole(['admin', 'staff']);
  const db = await requireAdminClient();

  const [
    { count: totalEnrollments },
    { count: activeEnrollments },
    pendingHoursResult,
    { data: enrollments },
  ] = await Promise.all([
    db.from('apprenticeship_enrollments').select('*', { count: 'exact', head: true }),
    db.from('apprenticeship_enrollments').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    db
      .from('progress_entries')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'submitted')
      .is('verified_by', null),
    db.from('apprenticeship_enrollments')
      .select(`
        id, status, start_date, total_hours_required, total_hours_completed, created_at,
        profiles:student_id(full_name, email),
        apprenticeship_programs:program_id(name, slug)
      `)
      .order('created_at', { ascending: false })
      .limit(50),
  ]);

  const pendingHours = pendingHoursResult.count ?? 0;

  const stats = [
    { label: 'Total Enrollments', value: totalEnrollments ?? 0, icon: Users, color: 'text-brand-blue-600', bg: 'bg-brand-blue-50' },
    { label: 'Active', value: activeEnrollments ?? 0, icon: BookOpen, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Pending Hours Approval', value: pendingHours, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  const STATUS_STYLES: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    completed: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-red-100 text-red-700',
    pending: 'bg-amber-100 text-amber-700',
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
      <div>
        <nav className="mb-3 flex items-center gap-1.5 text-xs text-slate-500">
          <Link href="/dashboard" className="hover:text-slate-700">Admin</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-slate-900">Apprenticeships</span>
        </nav>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Apprenticeships</h1>
            <p className="mt-1 text-sm text-slate-500">DOL-registered apprenticeship enrollments and OJT hours</p>
          </div>
          <Link
            href="/rapids"
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50"
          >
            RAPIDS Export →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${s.bg}`}>
                <Icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <p className="text-2xl font-bold tabular-nums text-slate-900">{s.value}</p>
              <p className="mt-1 text-xs text-slate-500">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Always mount the queue. It safely renders nothing when there are no submitted entries,
          and avoids hiding actionable hours if the aggregate count request degrades. */}
      <ApprenticeshipHoursClient />

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-800">Enrollments</h2>
        </div>
        {!enrollments?.length ? (
          <p className="py-10 text-center text-sm text-slate-400">No apprenticeship enrollments yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {['Apprentice', 'Program', 'Hours', 'Status', 'Start Date'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {enrollments.map((e: any) => {
                  const pct = e.total_hours_required
                    ? Math.min(100, Math.round(((e.total_hours_completed ?? 0) / e.total_hours_required) * 100))
                    : 0;
                  return (
                    <tr key={e.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <p className="text-xs font-medium text-slate-800">{e.profiles?.full_name ?? '—'}</p>
                        <p className="text-xs text-slate-400">{e.profiles?.email ?? '—'}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">{e.apprenticeship_programs?.name ?? '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full rounded-full bg-brand-blue-500" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs tabular-nums text-slate-600">
                            {e.total_hours_completed ?? 0}/{e.total_hours_required ?? '?'}h
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[e.status] ?? 'bg-slate-100 text-slate-600'}`}>
                          {e.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {e.start_date ? new Date(e.start_date).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
