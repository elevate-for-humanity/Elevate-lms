import { requireAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/auth/require-role';
import Link from 'next/link';
import { Clock, CheckCircle2, AlertCircle, TrendingUp, User } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

// DOL OJT requirements by program
const OJT_REQUIREMENTS: Record<string, number> = {
  'barber-apprenticeship':          2000,
  'cosmetology-apprenticeship':     1500,
  'esthetician-apprenticeship':     1000,
  'nail-technician-apprenticeship':  600,
  'culinary-apprenticeship':        2000,
  'emt-apprenticeship':             1000,
};
const DEFAULT_OJT_HOURS = 2000;

function pct(completed: number, required: number) {
  return Math.min(100, Math.round((completed / required) * 100));
}

function barColor(p: number) {
  if (p >= 100) return 'bg-green-500';
  if (p >= 50)  return 'bg-blue-500';
  if (p >= 25)  return 'bg-yellow-500';
  return 'bg-red-400';
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    verified: 'bg-green-100 text-green-800',
    approved: 'bg-green-100 text-green-800',
    submitted: 'bg-yellow-100 text-yellow-800',
    pending:   'bg-yellow-100 text-yellow-800',
    rejected:  'bg-red-100 text-red-800',
  };
  return map[status] ?? 'bg-slate-100 text-slate-700';
}

export default async function StudentHoursPage() {
  await requireRole(['admin', 'staff']);
  const db = await requireAdminClient();

  // Load all hour entries
  const { data: entries } = await db
    .from('apprenticeship_hours')
    .select('id, student_id, submitted_by, date_worked, week_ending, hours_worked, hours, program_id, category, notes, approved, status, approved_at, rejection_reason, created_at')
    .order('date_worked', { ascending: false });

  const rows = entries ?? [];

  // Collect all user IDs to hydrate names
  const allIds = [...new Set([
    ...rows.map((r: any) => r.student_id),
    ...rows.map((r: any) => r.submitted_by),
  ].filter(Boolean))];

  const { data: profiles } = allIds.length
    ? await db.from('profiles').select('id, full_name, email').in('id', allIds)
    : { data: [] };
  const nameMap: Record<string, string> = {};
  (profiles ?? []).forEach((p: any) => { nameMap[p.id] = p.full_name?.trim() || p.email || p.id.slice(0, 8); });

  // Resolve program slugs from program_id (stored as UUID in this table)
  const programIds = [...new Set(rows.map((r: any) => r.program_id).filter(Boolean))];
  const { data: programs } = programIds.length
    ? await db.from('programs').select('id, slug, title').in('id', programIds.map((id: string) => id.toLowerCase()))
    : { data: [] };
  const programMap: Record<string, { slug: string; title: string }> = {};
  (programs ?? []).forEach((p: any) => { programMap[p.id.toLowerCase()] = p; });

  // Aggregate by student
  type StudentSummary = {
    student_id: string;
    name: string;
    program_slug: string;
    program_title: string;
    required_hours: number;
    total_hours: number;
    approved_hours: number;
    pending_hours: number;
    entries: any[];
  };

  const byStudent: Record<string, StudentSummary> = {};
  rows.forEach((r: any) => {
    const sid = r.student_id;
    if (!sid) return;
    const hrs = r.hours_worked ?? r.hours ?? 0;
    const prog = programMap[r.program_id?.toLowerCase()] ?? { slug: 'barber-apprenticeship', title: 'Barber Apprenticeship' };
    if (!byStudent[sid]) {
      byStudent[sid] = {
        student_id: sid,
        name: nameMap[sid] || sid.slice(0, 8),
        program_slug: prog.slug,
        program_title: prog.title,
        required_hours: OJT_REQUIREMENTS[prog.slug] ?? DEFAULT_OJT_HOURS,
        total_hours: 0,
        approved_hours: 0,
        pending_hours: 0,
        entries: [],
      };
    }
    byStudent[sid].total_hours += hrs;
    if (r.status === 'verified' || r.approved) byStudent[sid].approved_hours += hrs;
    else byStudent[sid].pending_hours += hrs;
    byStudent[sid].entries.push(r);
  });

  const students = Object.values(byStudent).sort((a, b) => b.total_hours - a.total_hours);

  // Summary stats
  const totalStudents = students.length;
  const totalApproved = students.reduce((s, st) => s + st.approved_hours, 0);
  const pendingEntries = rows.filter((r: any) => r.status === 'submitted' || (!r.approved && r.status !== 'verified')).length;

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
          href="/admin/hours-export"
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
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Total Approved Hrs</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{totalApproved.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Pending Review</p>
          <p className="text-3xl font-bold text-yellow-600 mt-1">{pendingEntries}</p>
          <p className="text-xs text-slate-400 mt-0.5">entries</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">DOL Requirement</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">2,000</p>
          <p className="text-xs text-slate-400 mt-0.5">hrs (barber)</p>
        </div>
      </div>

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
            const p = pct(student.approved_hours, student.required_hours);
            const remaining = Math.max(0, student.required_hours - student.approved_hours);
            const weeksLeft = remaining > 0 ? Math.ceil(remaining / 40) : 0;

            return (
              <div key={student.student_id} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
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
                      <span className="text-sm font-normal text-slate-400"> / {student.required_hours.toLocaleString()} hrs</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {p}% complete · {remaining > 0 ? `${remaining.toLocaleString()} hrs remaining` : 'Complete!'}
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
                    <span className="text-xs font-semibold text-slate-600 w-10 text-right">{p}%</span>
                  </div>
                  <div className="flex gap-6 mt-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                      {student.approved_hours} approved
                    </span>
                    {student.pending_hours > 0 && (
                      <span className="flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-yellow-500" />
                        {student.pending_hours} pending review
                      </span>
                    )}
                    {weeksLeft > 0 && (
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-blue-500" />
                        ~{weeksLeft} weeks at 40 hrs/wk
                      </span>
                    )}
                  </div>
                </div>

                {/* Hour entries table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-slate-500 border-b border-slate-100">
                        <th className="text-left px-5 py-2 font-medium">Week of</th>
                        <th className="text-right px-5 py-2 font-medium">Hours</th>
                        <th className="text-left px-5 py-2 font-medium">Notes</th>
                        <th className="text-left px-5 py-2 font-medium">Status</th>
                        <th className="text-left px-5 py-2 font-medium">Approved</th>
                      </tr>
                    </thead>
                    <tbody>
                      {student.entries
                        .sort((a: any, b: any) => new Date(b.date_worked).getTime() - new Date(a.date_worked).getTime())
                        .map((entry: any) => (
                          <tr key={entry.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                            <td className="px-5 py-2.5 text-slate-700 whitespace-nowrap">
                              {new Date(entry.date_worked).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              {entry.week_ending && (
                                <span className="text-slate-400 text-xs ml-1">
                                  – {new Date(entry.week_ending).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-2.5 text-right font-semibold text-slate-900">
                              {entry.hours_worked ?? entry.hours}
                            </td>
                            <td className="px-5 py-2.5 text-slate-500 text-xs max-w-xs truncate">
                              {entry.notes || entry.category || '—'}
                            </td>
                            <td className="px-5 py-2.5">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(entry.status)}`}>
                                {entry.status ?? 'submitted'}
                              </span>
                            </td>
                            <td className="px-5 py-2.5 text-xs text-slate-400">
                              {entry.approved_at
                                ? new Date(entry.approved_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                : '—'}
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
