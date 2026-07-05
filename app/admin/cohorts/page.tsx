import { requireAdmin } from '@/lib/auth';
import { Metadata } from 'next';
import { requireAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import {
  Users,
  Calendar,
  Clock,
  Plus,
  GraduationCap,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Cohort Tracker | Admin',
  description: 'Track cohort enrollment, credentials, attendance, and outcomes.',
};

const STATUS_STYLES: Record<string, string> = {
  planned: 'bg-slate-100 text-slate-700',
  enrolling: 'bg-brand-blue-100 text-brand-blue-700',
  active: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-purple-100 text-purple-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default async function CohortTrackerPage() {
  await requireAdmin();
  const db = await requireAdminClient();

  if (!db) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-slate-500 text-sm">Unable to connect to database. Please try again.</p>
      </div>
    );
  }

  const [cohortsRes, programsRes] = await Promise.all([
    db
      .from('cohorts')
      .select(
        'id, code, name, program_id, start_date, end_date, max_capacity, current_enrollment, status, location, notes, created_at',
      )
      .order('start_date', { ascending: false })
      .limit(50),
    db.from('programs').select('id, title').order('title'),
  ]);

  const cohorts = cohortsRes.data ?? [];
  const programs = programsRes.data ?? [];
  const programMap: Record<string, string> = Object.fromEntries(
    programs.map((p) => [p.id, p.title]),
  );

  // Summary stats
  const active = cohorts.filter((c) => c.status === 'active').length;
  const enrolling = cohorts.filter((c) => c.status === 'enrolling').length;
  const totalSeats = cohorts.reduce((sum, c) => sum + (c.max_capacity ?? 0), 0);
  const filled = cohorts.reduce((sum, c) => sum + (c.current_enrollment ?? 0), 0);

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-slate-200 px-6 py-5">
        <div className="max-w-7xl mx-auto">
          <Breadcrumbs
            items={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Cohorts' }]}
          />
          <div className="flex items-center justify-between mt-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Cohort Tracker</h1>
              <p className="text-slate-500 text-sm mt-0.5">
                Track cohort enrollment, status, and outcomes across all programs.
              </p>
            </div>
            <Link
              href="/admin/cohorts/new"
              className="inline-flex items-center gap-2 bg-brand-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-red-700 transition-colors"
            >
              <Plus className="w-4 h-4" /> New Cohort
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Cohorts', value: cohorts.length, icon: GraduationCap },
            { label: 'Active', value: active, icon: CheckCircle2 },
            { label: 'Enrolling', value: enrolling, icon: Users },
            {
              label: 'Seat Fill Rate',
              value: totalSeats > 0 ? `${Math.round((filled / totalSeats) * 100)}%` : '—',
              icon: Clock,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4"
            >
              <stat.icon className="w-8 h-8 text-brand-red-500 flex-shrink-0" />
              <div>
                <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                <div className="text-xs text-slate-500">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Cohort list */}
        {cohorts.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-slate-700 mb-2">No cohorts yet</h2>
            <p className="text-slate-500 text-sm mb-6">
              Create your first cohort to start tracking enrollment and progress.
            </p>
            <Link
              href="/admin/cohorts/new"
              className="inline-flex items-center gap-2 bg-brand-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-red-700 transition-colors"
            >
              <Plus className="w-4 h-4" /> Create Cohort
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">All Cohorts</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3 text-left">Cohort</th>
                    <th className="px-6 py-3 text-left">Program</th>
                    <th className="px-6 py-3 text-left">Dates</th>
                    <th className="px-6 py-3 text-left">Enrollment</th>
                    <th className="px-6 py-3 text-left">Status</th>
                    <th className="px-6 py-3 text-left">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cohorts.map((cohort) => {
                    const fillPct =
                      cohort.max_capacity && cohort.max_capacity > 0
                        ? Math.round(((cohort.current_enrollment ?? 0) / cohort.max_capacity) * 100)
                        : 0;
                    const nearCapacity = fillPct >= 90;
                    return (
                      <tr key={cohort.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <Link
                            href={`/admin/cohorts/${cohort.id}`}
                            className="font-semibold text-slate-900 hover:text-brand-red-600"
                          >
                            {cohort.name}
                          </Link>
                          {cohort.code && (
                            <div className="text-xs text-slate-400 mt-0.5">{cohort.code}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-700">
                          {programMap[cohort.program_id] ?? (
                            <span className="text-slate-400 italic">Unknown program</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 text-slate-700">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              {cohort.start_date
                                ? new Date(cohort.start_date).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })
                                : '—'}
                            </span>
                          </div>
                          {cohort.end_date && (
                            <div className="text-xs text-slate-400 mt-0.5">
                              →{' '}
                              {new Date(cohort.end_date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {nearCapacity && (
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                            )}
                            <span className={nearCapacity ? 'font-semibold text-amber-700' : 'text-slate-700'}>
                              {cohort.current_enrollment ?? 0} / {cohort.max_capacity ?? '—'}
                            </span>
                          </div>
                          {cohort.max_capacity && cohort.max_capacity > 0 && (
                            <div className="mt-1 h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${nearCapacity ? 'bg-amber-400' : 'bg-emerald-400'}`}
                                style={{ width: `${Math.min(fillPct, 100)}%` }}
                              />
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[cohort.status ?? 'planned'] ?? 'bg-slate-100 text-slate-700'}`}
                          >
                            {cohort.status ?? 'planned'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600 text-xs">
                          {cohort.location ?? <span className="text-slate-400 italic">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
