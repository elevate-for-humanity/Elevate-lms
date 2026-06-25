import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { ChevronRight, TrendingUp, Users, CheckCircle, AlertTriangle, Calendar } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Completion Forecast | Admin' };

// ─── Types ────────────────────────────────────────────────────────────────────

interface WeekBucket {
  week: string;       // ISO date of Monday
  label: string;      // "Jan 6"
  enrolled: number;
  completed: number;
  completionRate: number;
}

interface ProgramForecast {
  programId: string;
  programTitle: string;
  activeEnrollments: number;
  avgWeeksToComplete: number | null;
  projectedCompletions30d: number;
  currentCompletionRate: number;
  trend: 'up' | 'down' | 'flat';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isoWeekMonday(date: Date): string {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

function weekLabel(isoMonday: string): string {
  const d = new Date(isoMonday + 'T00:00:00Z');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

/** Simple linear regression slope over the last N data points */
function linearSlope(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  const xMean = (n - 1) / 2;
  const yMean = values.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (values[i] - yMean);
    den += (i - xMean) ** 2;
  }
  return den === 0 ? 0 : num / den;
}

function trendFromSlope(slope: number): 'up' | 'down' | 'flat' {
  if (slope > 1) return 'up';
  if (slope < -1) return 'down';
  return 'flat';
}

// ─── Bar chart component (server-side SVG) ────────────────────────────────────

function MiniBarChart({
  data,
  valueKey,
  color,
  height = 48,
}: {
  data: WeekBucket[];
  valueKey: 'enrolled' | 'completed' | 'completionRate';
  color: string;
  height?: number;
}) {
  const values = data.map((d) => d[valueKey]);
  const max = Math.max(...values, 1);
  const width = 280;
  const barW = Math.max(4, Math.floor(width / data.length) - 2);

  return (
    <svg width={width} height={height} className="overflow-visible">
      {data.map((d, i) => {
        const val = d[valueKey];
        const barH = Math.max(2, Math.round((val / max) * height));
        const x = i * (barW + 2);
        const y = height - barH;
        return (
          <rect
            key={d.week}
            x={x}
            y={y}
            width={barW}
            height={barH}
            rx={1}
            className={color}
            opacity={0.85}
          />
        );
      })}
    </svg>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  accent: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
        </div>
        <div className={`p-2 rounded-lg ${accent}`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
    </div>
  );
}

// ─── Trend badge ──────────────────────────────────────────────────────────────

function TrendBadge({ trend }: { trend: 'up' | 'down' | 'flat' }) {
  if (trend === 'up')
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
        ↑ Improving
      </span>
    );
  if (trend === 'down')
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
        ↓ Declining
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
      → Stable
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ForecastPage() {
  await requireRole(['admin', 'staff']);
  const db = await requireAdminClient();

  // Pull 16 weeks of enrollment + completion data
  const sixteenWeeksAgo = new Date();
  sixteenWeeksAgo.setUTCDate(sixteenWeeksAgo.getUTCDate() - 112);

  const [enrollmentsRes, programsRes] = await Promise.allSettled([
    db
      .from('program_enrollments')
      .select('id, program_id, status, enrolled_at, completed_at')
      .gte('enrolled_at', sixteenWeeksAgo.toISOString())
      .order('enrolled_at', { ascending: true }),

    db
      .from('programs')
      .select('id, title, slug')
      .eq('is_active', true)
      .order('title'),
  ]);

  const enrollments =
    enrollmentsRes.status === 'fulfilled' ? (enrollmentsRes.value.data ?? []) : [];
  const programs =
    programsRes.status === 'fulfilled' ? (programsRes.value.data ?? []) : [];

  const programMap = Object.fromEntries(programs.map((p: any) => [p.id, p.title]));

  // ── Build weekly buckets (last 16 weeks) ──────────────────────────────────
  const bucketMap = new Map<string, { enrolled: number; completed: number }>();

  // Pre-populate all 16 weeks so gaps show as zero
  for (let i = 15; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i * 7);
    const key = isoWeekMonday(d);
    if (!bucketMap.has(key)) bucketMap.set(key, { enrolled: 0, completed: 0 });
  }

  for (const e of enrollments as any[]) {
    if (e.enrolled_at) {
      const key = isoWeekMonday(new Date(e.enrolled_at));
      const b = bucketMap.get(key);
      if (b) b.enrolled++;
    }
    if (e.completed_at) {
      const key = isoWeekMonday(new Date(e.completed_at));
      const b = bucketMap.get(key);
      if (b) b.completed++;
    }
  }

  const weekBuckets: WeekBucket[] = Array.from(bucketMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, { enrolled, completed }]) => ({
      week,
      label: weekLabel(week),
      enrolled,
      completed,
      completionRate: enrolled > 0 ? Math.round((completed / enrolled) * 100) : 0,
    }));

  // ── Aggregate stats ───────────────────────────────────────────────────────
  const totalEnrolled16w = weekBuckets.reduce((s, b) => s + b.enrolled, 0);
  const totalCompleted16w = weekBuckets.reduce((s, b) => s + b.completed, 0);
  const overallRate16w =
    totalEnrolled16w > 0 ? Math.round((totalCompleted16w / totalEnrolled16w) * 100) : 0;

  // Avg weekly completions over last 4 weeks → 30-day projection
  const last4 = weekBuckets.slice(-4);
  const avgWeeklyCompletions =
    last4.reduce((s, b) => s + b.completed, 0) / Math.max(last4.length, 1);
  const projected30d = Math.round(avgWeeklyCompletions * 4.3);

  // Trend: slope of weekly completion counts over last 8 weeks
  const last8completions = weekBuckets.slice(-8).map((b) => b.completed);
  const overallTrend = trendFromSlope(linearSlope(last8completions));

  // ── Per-program forecasts ─────────────────────────────────────────────────
  const programForecasts: ProgramForecast[] = [];

  for (const program of programs as any[]) {
    const pe = (enrollments as any[]).filter((e) => e.program_id === program.id);
    const active = pe.filter((e) => e.status !== 'completed' && e.status !== 'cancelled').length;
    const completed = pe.filter((e) => e.status === 'completed');

    // Avg days to complete
    const durations = completed
      .filter((e) => e.enrolled_at && e.completed_at)
      .map((e) => {
        const ms =
          new Date(e.completed_at).getTime() - new Date(e.enrolled_at).getTime();
        return ms / (1000 * 60 * 60 * 24 * 7); // weeks
      });
    const avgWeeks =
      durations.length > 0
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : null;

    // Completion rate for this program (16w window)
    const enrolled16w = pe.length;
    const completed16w = completed.length;
    const rate = enrolled16w > 0 ? Math.round((completed16w / enrolled16w) * 100) : 0;

    // 30-day projection: active students × (1 / avgWeeks) × 4.3
    const weeklyThroughput = avgWeeks && avgWeeks > 0 ? 1 / avgWeeks : 0;
    const proj30d = Math.round(active * weeklyThroughput * 4.3);

    // Trend from weekly completions
    const progWeekly = weekBuckets.map((b) => {
      return (enrollments as any[]).filter(
        (e) =>
          e.program_id === program.id &&
          e.completed_at &&
          isoWeekMonday(new Date(e.completed_at)) === b.week,
      ).length;
    });
    const trend = trendFromSlope(linearSlope(progWeekly.slice(-8)));

    if (enrolled16w > 0 || active > 0) {
      programForecasts.push({
        programId: program.id,
        programTitle: program.title,
        activeEnrollments: active,
        avgWeeksToComplete: avgWeeks,
        projectedCompletions30d: proj30d,
        currentCompletionRate: rate,
        trend,
      });
    }
  }

  programForecasts.sort((a, b) => b.projectedCompletions30d - a.projectedCompletions30d);

  // ── At-risk: active enrollments older than 2× avg completion time ─────────
  const atRiskCount = (enrollments as any[]).filter((e) => {
    if (e.status === 'completed' || e.status === 'cancelled') return false;
    if (!e.enrolled_at) return false;
    const weeksEnrolled =
      (Date.now() - new Date(e.enrolled_at).getTime()) / (1000 * 60 * 60 * 24 * 7);
    const pf = programForecasts.find((p) => p.programId === e.program_id);
    const threshold = pf?.avgWeeksToComplete ? pf.avgWeeksToComplete * 2 : 24;
    return weeksEnrolled > threshold;
  }).length;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
          <Link href="/admin/dashboard" className="hover:text-slate-700">Admin</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/admin/intelligence" className="hover:text-slate-700">Intelligence</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-900 font-medium">Completion Forecast</span>
        </nav>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Completion Forecast</h1>
            <p className="text-sm text-slate-500 mt-1">
              16-week cohort trend · 30-day projection · per-program throughput
            </p>
          </div>
          <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <Calendar className="w-3 h-3" />
            Last 16 weeks
          </span>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6 max-w-6xl">

        {/* Summary stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Enrolled (16w)"
            value={totalEnrolled16w.toLocaleString()}
            icon={Users}
            accent="bg-blue-500"
          />
          <StatCard
            label="Completed (16w)"
            value={totalCompleted16w.toLocaleString()}
            sub={`${overallRate16w}% completion rate`}
            icon={CheckCircle}
            accent="bg-emerald-500"
          />
          <StatCard
            label="Projected (30d)"
            value={projected30d.toLocaleString()}
            sub="Based on last 4-week avg"
            icon={TrendingUp}
            accent="bg-violet-500"
          />
          <StatCard
            label="At-Risk Enrollments"
            value={atRiskCount.toLocaleString()}
            sub="Enrolled > 2× avg duration"
            icon={AlertTriangle}
            accent="bg-amber-500"
          />
        </div>

        {/* Weekly trend chart */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Weekly Enrollment vs Completions</h2>
              <p className="text-xs text-slate-400 mt-0.5">16-week window</p>
            </div>
            <TrendBadge trend={overallTrend} />
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mb-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-blue-400 inline-block" /> Enrolled
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-emerald-400 inline-block" /> Completed
            </span>
          </div>

          {/* Dual bar chart */}
          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              {/* Bars */}
              <div className="flex items-end gap-1 h-24">
                {weekBuckets.map((b) => {
                  const maxVal = Math.max(
                    ...weekBuckets.map((x) => Math.max(x.enrolled, x.completed)),
                    1,
                  );
                  const enrollH = Math.max(2, Math.round((b.enrolled / maxVal) * 80));
                  const compH = Math.max(2, Math.round((b.completed / maxVal) * 80));
                  return (
                    <div key={b.week} className="flex-1 flex items-end gap-0.5 group relative">
                      <div
                        className="flex-1 bg-blue-400 rounded-t opacity-80 group-hover:opacity-100 transition-opacity"
                        style={{ height: enrollH }}
                        title={`Enrolled: ${b.enrolled}`}
                      />
                      <div
                        className="flex-1 bg-emerald-400 rounded-t opacity-80 group-hover:opacity-100 transition-opacity"
                        style={{ height: compH }}
                        title={`Completed: ${b.completed}`}
                      />
                    </div>
                  );
                })}
              </div>
              {/* X-axis labels — show every 4th */}
              <div className="flex gap-1 mt-1">
                {weekBuckets.map((b, i) => (
                  <div key={b.week} className="flex-1 text-center">
                    {i % 4 === 0 && (
                      <span className="text-[10px] text-slate-400">{b.label}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 30-day projection callout */}
        <div className="bg-violet-50 border border-violet-200 rounded-xl p-5 flex items-start gap-4">
          <div className="p-2 bg-violet-100 rounded-lg shrink-0">
            <TrendingUp className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-violet-900">
              30-Day Projection: {projected30d} completions
            </p>
            <p className="text-xs text-violet-700 mt-1">
              Extrapolated from the last 4-week average of{' '}
              <strong>{avgWeeklyCompletions.toFixed(1)}</strong> completions/week.
              Assumes current enrollment pace and no major program changes.
            </p>
          </div>
        </div>

        {/* Per-program table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900">Per-Program Forecast</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Active enrollments, throughput, and 30-day projected completions
            </p>
          </div>

          {programForecasts.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-400 text-sm">
              No enrollment data in the last 16 weeks.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">
                      Program
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">
                      Active
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">
                      Avg Duration
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">
                      Rate (16w)
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">
                      Proj. 30d
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">
                      Trend
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {programForecasts.map((pf) => (
                    <tr key={pf.programId} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3.5">
                        <Link
                          href={`/admin/programs/${pf.programId}`}
                          className="font-medium text-slate-900 hover:text-blue-600 transition-colors"
                        >
                          {pf.programTitle}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 text-right text-slate-700 tabular-nums">
                        {pf.activeEnrollments}
                      </td>
                      <td className="px-4 py-3.5 text-right text-slate-500 tabular-nums">
                        {pf.avgWeeksToComplete != null
                          ? `${pf.avgWeeksToComplete}w`
                          : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3.5 text-right tabular-nums">
                        <span
                          className={
                            pf.currentCompletionRate >= 70
                              ? 'text-emerald-600 font-medium'
                              : pf.currentCompletionRate >= 40
                              ? 'text-amber-600'
                              : 'text-red-600'
                          }
                        >
                          {pf.currentCompletionRate}%
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-semibold text-slate-900 tabular-nums">
                        {pf.projectedCompletions30d}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <TrendBadge trend={pf.trend} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Methodology note */}
        <p className="text-xs text-slate-400 pb-4">
          Projection methodology: 30-day estimate = (avg weekly completions over last 4 weeks) × 4.3.
          Per-program projection = active enrollments × (1 / avg weeks to complete) × 4.3.
          At-risk threshold = enrolled for more than 2× the program's average completion duration.
        </p>
      </div>
    </div>
  );
}
