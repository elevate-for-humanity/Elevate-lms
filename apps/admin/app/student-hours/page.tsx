import { requireAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/auth/require-role';
import Link from 'next/link';
import { loadAdminHours } from '@/lib/apprenticeship/admin-hours';
import {
  formatHoursDate,
  roundHours,
  summarizeHoursLedger,
} from '@/lib/apprenticeship/admin-hours-model';
import ApprenticeshipHoursClient from '../apprenticeships/ApprenticeshipHoursClient';
import { Clock, CheckCircle2, AlertCircle, TrendingUp, User } from 'lucide-react';

export const dynamic = 'force-dynamic';

function pct(completed: number, required: number) {
  return Math.min(100, Math.round((completed / required) * 100));
}

function barColor(p: number) {
  if (p >= 100) return 'bg-green-500';
  if (p >= 50) return 'bg-blue-500';
  if (p >= 25) return 'bg-yellow-500';
  return 'bg-red-400';
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    verified: 'bg-green-100 text-green-800',
    approved: 'bg-green-100 text-green-800',
    submitted: 'bg-yellow-100 text-yellow-800',
    pending: 'bg-yellow-100 text-yellow-800',
    rejected: 'bg-red-100 text-red-800',
  };
  return map[status] ?? 'bg-slate-100 text-slate-700';
}

export default async function StudentHoursPage() {
  await requireRole(['admin', 'staff']);
  const db = await requireAdminClient();

  const { entries: rows, summaries: students, ledger, programs } = await loadAdminHours(db);
  const totalStudents = new Set(students.map((s) => s.student_id)).size;
  const totalApproved = roundHours(students.reduce((sum, s) => sum + s.approved_hours, 0));
  const pendingEntries = rows.filter((r) => r.status === 'submitted' && r.hours_worked > 0).length;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Student OJT Hours</h1>
          <p className="text-sm text-slate-500 mt-1">
            On-the-job training progress toward DOL apprenticeship requirements
          </p>
        </div>
        <Link
          href="/hours-export"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Export Hours
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Apprentices</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{totalStudents}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">
            Verified OJT Hrs
          </p>
          <p className="text-3xl font-bold text-green-600 mt-1">{totalApproved.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">
            Pending Review
          </p>
          <p className="text-3xl font-bold text-yellow-600 mt-1">{pendingEntries}</p>
          <p className="text-xs text-slate-400 mt-0.5">entries</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">
            Program Requirements
          </p>
          <p className="text-3xl font-bold text-slate-900 mt-1">Dynamic</p>
          <p className="text-xs text-slate-400 mt-0.5">per apprentice/program</p>
        </div>
      </div>

      <ApprenticeshipHoursClient />

      {/* Per-student cards */}
      {students.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 p-12 text-center text-slate-400">
          <Clock className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No OJT hours logged yet</p>
          <p className="text-sm mt-1">Hours submitted by apprentices will appear here</p>
        </div>
      ) : (
        <div className="space-y-6">
          {students.map((student) => {
            const p =
              student.required_hours > 0 ? pct(student.approved_hours, student.required_hours) : 0;
            const credit = summarizeHoursLedger(
              ledger,
              student.student_id,
              programs.find((p) => p.id === student.program_key)?.slug,
            );
            const remaining = student.required_hours
              ? Math.max(0, student.required_hours - student.approved_hours)
              : 0;
            const weeksLeft = remaining > 0 ? Math.ceil(remaining / 40) : 0;

            return (
              <div
                key={student.key}
                className="rounded-xl border border-slate-200 bg-white overflow-hidden"
              >
                {/* Student header */}
                <div className="flex items-start justify-between gap-4 p-5 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{student.name}</p>
                      <p className="text-xs text-slate-500">{student.program_title}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-2xl font-bold text-slate-900">
                      {student.approved_hours.toLocaleString()}
                      <span className="text-sm font-normal text-slate-400">
                        {' '}
                        / {student.required_hours?.toLocaleString() ?? '?'} hrs
                      </span>
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {student.required_hours
                        ? `${p}% complete · ${remaining > 0 ? `${roundHours(remaining).toLocaleString()} hrs remaining` : 'Complete!'}`
                        : 'Program requirement not configured'}
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${barColor(p)}`}
                        style={{ width: `${p}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-slate-600 w-10 text-right">
                      {p}%
                    </span>
                  </div>
                  <div className="flex gap-6 mt-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                      {student.approved_hours} verified OJT · {credit.approved} ledger credit
                    </span>
                    {student.pending_hours > 0 && (
                      <span className="flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-yellow-500" />
                        {student.pending_hours} pending review
                      </span>
                    )}
                    {weeksLeft > 0 && (
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-blue-500" />~{weeksLeft} weeks at 40
                        hrs/wk
                      </span>
                    )}
                  </div>
                </div>

                {/* Hour entries table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-slate-500 border-b border-slate-100">
                        <th className="text-left px-5 py-2 font-medium">Work date</th>
                        <th className="text-right px-5 py-2 font-medium">Hours</th>
                        <th className="text-left px-5 py-2 font-medium">Notes</th>
                        <th className="text-left px-5 py-2 font-medium">Status</th>
                        <th className="text-left px-5 py-2 font-medium">Approved</th>
                      </tr>
                    </thead>
                    <tbody>
                      {student.entries
                        .sort((a, b) => b.work_date.localeCompare(a.work_date))
                        .map((entry) => (
                          <tr
                            key={entry.id}
                            className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
                          >
                            <td className="px-5 py-2.5 text-slate-700 whitespace-nowrap">
                              {formatHoursDate(entry.work_date)}
                              {entry.week_ending && (
                                <span className="text-slate-400 text-xs ml-1">
                                  · Week ending {formatHoursDate(entry.week_ending)}
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-2.5 text-right font-semibold text-slate-900">
                              {entry.hours_worked}
                            </td>
                            <td className="px-5 py-2.5 text-slate-500 text-xs max-w-xs truncate">
                              {entry.notes || entry.tasks_completed || '—'}
                            </td>
                            <td className="px-5 py-2.5">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(entry.status)}`}
                              >
                                {entry.status ?? 'submitted'}
                              </span>
                            </td>
                            <td className="px-5 py-2.5 text-xs text-slate-400">
                              {entry.verified_at ? formatHoursDate(entry.verified_at) : '—'}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
