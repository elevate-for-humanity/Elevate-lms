import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { ChevronRight, Users, Clock, CheckCircle, BookOpen } from 'lucide-react';
import ApprenticeshipHoursClient from './ApprenticeshipHoursClient';

export const dynamic = 'force-dynamic';
export const revalidate = 60;
export const metadata: Metadata = { title: 'Apprenticeships | Admin | Elevate For Humanity' };

export default async function ApprenticeshipsPage() {
  await requireRole(['admin', 'staff']);
  const db = await requireAdminClient();

  const [
    { count: totalEnrollments },
    { count: activeEnrollments },
    { count: pendingHours },
    { data: enrollments },
  ] = await Promise.all([
    db.from('apprenticeship_enrollments').select('*', { count: 'exact', head: true }),
    db.from('apprenticeship_enrollments').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    db.from('progress_entries').select('*', { count: 'exact', head: true }).eq('status', 'pending').catch(() => ({ count: 0 })),
    db.from('apprenticeship_enrollments')
      .select(`
        id, status, start_date, total_hours_required, total_hours_completed, created_at,
        profiles:student_id(full_name, email),
        apprenticeship_programs:program_id(name, slug)
      `)
      .order('created_at', { ascending: false })
      .limit(50),
  ]);

  const stats = [
    { label: 'Total Enrollments', value: totalEnrollments ?? 0, icon: Users, color: 'text-brand-blue-600', bg: 'bg-brand-blue-50' },
    { label: 'Active', value: activeEnrollments ?? 0, icon: BookOpen, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Pending Hours Approval', value: pendingHours ?? 0, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  const STATUS_STYLES: Record<string, string> = {
    active:    'bg-green-100 text-green-700',
    completed: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-red-100 text-red-700',
    pending:   'bg-amber-100 text-amber-700',
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div>
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
          <Link href="/admin/dashboard" className="hover:text-slate-700">Admin</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-900 font-medium">Apprenticeships</span>
        </nav>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Apprenticeships</h1>
            <p className="text-sm text-slate-500 mt-1">DOL-registered apprenticeship enrollments and OJT hours</p>
          </div>
          <Link href="/admin/rapids"
            className="flex items-center gap-1.5 text-sm text-slate-600 border border-slate-200 rounded-lg px-3 py-2 hover:bg-slate-50 transition-colors">
            RAPIDS Export →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {stats.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <p className="text-2xl font-bold text-slate-900 tabular-nums">{s.value}</p>
              <p className="text-xs text-slate-500 mt-1">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Pending hours approval */}
      {(pendingHours ?? 0) > 0 && <ApprenticeshipHoursClient />}

      {/* Enrollments table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Enrollments</h2>
        </div>
        {!enrollments?.length ? (
          <p className="text-sm text-slate-400 text-center py-10">No apprenticeship enrollments yet</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                {['Apprentice', 'Program', 'Hours', 'Status', 'Start Date'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {enrollments.map((e: any) => {
                const pct = e.total_hours_required
                  ? Math.min(100, Math.round((e.total_hours_completed ?? 0) / e.total_hours_required * 100))
                  : 0;
                return (
                  <tr key={e.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800 text-xs">{e.profiles?.full_name ?? '—'}</p>
                      <p className="text-xs text-slate-400">{e.profiles?.email ?? '—'}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {e.apprenticeship_programs?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-brand-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-slate-600 tabular-nums">
                          {e.total_hours_completed ?? 0}/{e.total_hours_required ?? '?'}h
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[e.status] ?? 'bg-slate-100 text-slate-600'}`}>
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
        )}
      </div>
    </div>
  );
}
