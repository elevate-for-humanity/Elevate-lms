import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import {
  Brain, TrendingDown, TrendingUp, AlertTriangle,
  Users, Target, ArrowRight, Info,
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Institutional Intelligence | Admin' };

function ProbBar({ value, color }: { value: number | null; color: string }) {
  const pct = value != null ? Math.round(value * 100) : null;
  if (pct == null) return <span className="text-slate-600 text-xs">—</span>;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-slate-800 rounded-full h-1.5 min-w-[60px]">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-slate-300 w-8 text-right">{pct}%</span>
    </div>
  );
}

export default async function IntelligencePage() {
  await requireRole(['admin', 'staff']);
  const db = await requireAdminClient();

  const [
    riskRows,
    cohortStats,
    programStats,
  ] = await Promise.allSettled([
    // Students with AI-scored probabilities
    db.from('student_risk_status')
      .select(`
        id, user_id, status, risk_score,
        placement_probability, completion_probability, probabilities_updated_at,
        days_since_activity, overdue_count, progress_percentage,
        profiles!student_risk_status_user_id_fkey (full_name, email),
        programs (title, slug)
      `)
      .in('status', ['watch', 'at_risk', 'critical'])
      .not('risk_score', 'is', null)
      .order('risk_score', { ascending: false })
      .limit(50),

    // Aggregate cohort stats
    db.from('student_risk_status')
      .select('status, risk_score, placement_probability, completion_probability')
      .not('risk_score', 'is', null),

    // Per-program risk breakdown
    db.from('student_risk_status')
      .select('status, program_id, programs!student_risk_status_program_id_fkey(title)')
      .in('status', ['watch', 'at_risk', 'critical']),
  ]);

  const students = riskRows.status === 'fulfilled' ? (riskRows.value.data ?? []) : [];
  const allScored = cohortStats.status === 'fulfilled' ? (cohortStats.value.data ?? []) : [];
  const programRisk = programStats.status === 'fulfilled' ? (programStats.value.data ?? []) : [];

  // Cohort aggregates
  const avgCompletion = allScored.length > 0
    ? allScored.reduce((s, r: any) => s + (r.completion_probability ?? 0), 0) / allScored.length
    : null;
  const avgPlacement = allScored.length > 0
    ? allScored.reduce((s, r: any) => s + (r.placement_probability ?? 0), 0) / allScored.length
    : null;
  const highRiskCount = allScored.filter((r: any) => (r.risk_score ?? 0) >= 70).length;
  const criticalCount = allScored.filter((r: any) => r.status === 'critical').length;

  // Per-program breakdown
  const byProgram: Record<string, { title: string; count: number }> = {};
  for (const r of programRisk as any[]) {
    const pid = r.program_id ?? 'unknown';
    const title = r.programs?.title ?? 'Unknown Program';
    if (!byProgram[pid]) byProgram[pid] = { title, count: 0 };
    byProgram[pid].count++;
  }
  const programList = Object.values(byProgram).sort((a, b) => b.count - a.count).slice(0, 6);

  const STATUS_STYLES: Record<string, string> = {
    critical: 'bg-red-900/50 text-red-300 border border-red-800',
    at_risk:  'bg-orange-900/50 text-orange-300 border border-orange-800',
    watch:    'bg-amber-900/50 text-amber-300 border border-amber-800',
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 space-y-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Brain className="w-6 h-6 text-brand-blue-400" />
            <div>
              <h1 className="text-2xl font-bold text-white">Institutional Intelligence</h1>
              <p className="text-slate-400 text-sm mt-0.5">AI-scored dropout risk · Placement & completion probabilities · Cohort forecasting</p>
            </div>
          </div>
          <Link href="/admin/at-risk" className="text-sm text-brand-blue-400 hover:text-brand-blue-300 flex items-center gap-1">
            At-Risk Students <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Cohort summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: 'Avg Completion Probability',
              value: avgCompletion != null ? `${Math.round(avgCompletion * 100)}%` : '—',
              icon: TrendingUp,
              color: 'text-emerald-400',
            },
            {
              label: 'Avg Placement Probability',
              value: avgPlacement != null ? `${Math.round(avgPlacement * 100)}%` : '—',
              icon: Target,
              color: 'text-brand-blue-400',
            },
            {
              label: 'High Dropout Risk (≥70)',
              value: String(highRiskCount),
              icon: TrendingDown,
              color: 'text-orange-400',
            },
            {
              label: 'Critical Status',
              value: String(criticalCount),
              icon: AlertTriangle,
              color: 'text-red-400',
            },
          ].map((s) => (
            <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <s.icon className={`w-5 h-5 ${s.color} mb-3`} />
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-xs text-slate-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Program risk breakdown */}
        {programList.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-slate-400" />
              <h2 className="text-sm font-semibold text-white">At-Risk by Program</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {programList.map((p) => (
                <div key={p.title} className="bg-slate-800 rounded-lg px-4 py-3">
                  <p className="text-white text-sm font-medium truncate">{p.title}</p>
                  <p className="text-slate-400 text-xs mt-1">{p.count} student{p.count !== 1 ? 's' : ''} flagged</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Student risk table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-2">
            <Brain className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-white">AI-Scored Students</h2>
            <span className="ml-auto text-xs text-slate-500">{students.length} shown · sorted by dropout risk</span>
          </div>

          {students.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <Info className="w-8 h-8 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No AI-scored students yet.</p>
              <p className="text-slate-600 text-xs mt-1">
                Run <code className="bg-slate-800 px-1 rounded">POST /api/internal/dropout-score</code> to generate scores.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="px-5 py-3 text-left text-xs text-slate-500 font-medium">Student</th>
                    <th className="px-4 py-3 text-left text-xs text-slate-500 font-medium">Status</th>
                    <th className="px-4 py-3 text-left text-xs text-slate-500 font-medium w-32">Dropout Risk</th>
                    <th className="px-4 py-3 text-left text-xs text-slate-500 font-medium w-36">Completion</th>
                    <th className="px-4 py-3 text-left text-xs text-slate-500 font-medium w-36">Placement</th>
                    <th className="px-4 py-3 text-left text-xs text-slate-500 font-medium">Inactive</th>
                    <th className="px-4 py-3 text-left text-xs text-slate-500 font-medium">Overdue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {students.map((s: any) => {
                    const profile = s.profiles;
                    const riskScore = s.risk_score ?? 0;
                    const riskColor = riskScore >= 70 ? 'text-red-400' : riskScore >= 40 ? 'text-amber-400' : 'text-emerald-400';
                    return (
                      <tr key={s.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="px-5 py-3">
                          <p className="text-white font-medium">{profile?.full_name ?? '—'}</p>
                          <p className="text-slate-500 text-xs">{profile?.email ?? ''}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[s.status] ?? ''}`}>
                            {s.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-lg font-bold ${riskColor}`}>{riskScore}</span>
                          <span className="text-slate-600 text-xs">/100</span>
                        </td>
                        <td className="px-4 py-3">
                          <ProbBar value={s.completion_probability} color="bg-emerald-500" />
                        </td>
                        <td className="px-4 py-3">
                          <ProbBar value={s.placement_probability} color="bg-brand-blue-500" />
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs">
                          {s.days_since_activity != null ? `${s.days_since_activity}d` : '—'}
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs">
                          {s.overdue_count ?? 0}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="text-slate-600 text-xs text-center">
          Scores generated by <code>POST /api/internal/dropout-score</code> · Probabilities: completion = 1 − (score/100), placement adjusted for overdue items
        </p>
      </div>
    </div>
  );
}
