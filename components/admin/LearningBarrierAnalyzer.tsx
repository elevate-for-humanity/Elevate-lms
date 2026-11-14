'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';

type EnrollmentRow = { id: string; user_id: string | null; status: string | null; program_slug: string | null };
type ProgressRow = { user_id: string | null; completed_at: string | null; updated_at?: string | null };

export function LearningBarrierAnalyzer() {
  const [enrollments, setEnrollments] = useState<EnrollmentRow[]>([]);
  const [progress, setProgress] = useState<ProgressRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const runBarrierAnalysis = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const [enrollmentResult, progressResult] = await Promise.all([
        supabase.from('program_enrollments').select('id,user_id,status,program_slug').in('status', ['active', 'enrolled', 'in_progress']).limit(1000),
        supabase.from('lesson_progress').select('user_id,completed_at,updated_at').limit(5000),
      ]);
      if (enrollmentResult.error) throw enrollmentResult.error;
      if (progressResult.error) throw progressResult.error;
      setEnrollments((enrollmentResult.data ?? []) as EnrollmentRow[]);
      setProgress((progressResult.data ?? []) as ProgressRow[]);
    } catch (analysisError) {
      logger.error('[learning-barriers] analysis failed', analysisError instanceof Error ? analysisError : new Error(String(analysisError)));
      setEnrollments([]);
      setProgress([]);
      setError('Learning-barrier data is temporarily unavailable.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void runBarrierAnalysis(); }, [runBarrierAnalysis]);

  const summary = useMemo(() => {
    const progressByUser = new Map<string, { completed: number; lastActivity: number }>();
    for (const row of progress) {
      if (!row.user_id) continue;
      const current = progressByUser.get(row.user_id) ?? { completed: 0, lastActivity: 0 };
      if (row.completed_at) current.completed += 1;
      const timestamp = new Date(row.updated_at || row.completed_at || 0).getTime();
      current.lastActivity = Math.max(current.lastActivity, Number.isFinite(timestamp) ? timestamp : 0);
      progressByUser.set(row.user_id, current);
    }

    const noCompletion = enrollments.filter((row) => !row.user_id || (progressByUser.get(row.user_id)?.completed ?? 0) === 0);
    const staleCutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;
    const stale = enrollments.filter((row) => {
      if (!row.user_id) return false;
      const activity = progressByUser.get(row.user_id)?.lastActivity ?? 0;
      return activity > 0 && activity < staleCutoff;
    });
    const programCounts = noCompletion.reduce<Record<string, number>>((counts, row) => {
      const key = row.program_slug || 'unassigned';
      counts[key] = (counts[key] || 0) + 1;
      return counts;
    }, {});

    return { noCompletion, stale, programCounts };
  }, [enrollments, progress]);

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-brand-blue-700" /></div>;

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-black text-slate-950">Learning Barrier Analyzer</h2><p className="text-sm text-slate-600">Live engagement signals from active enrollments and lesson progress. No simulated learner records.</p></div><button type="button" onClick={() => void runBarrierAnalysis()} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700"><RefreshCw className="h-4 w-4" />Refresh</button></div>
      {error && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">{error}</div>}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><Users className="h-5 w-5 text-brand-blue-700" /><p className="mt-3 text-2xl font-black text-slate-950">{enrollments.length}</p><p className="text-xs font-bold text-slate-500">Active learners evaluated</p></div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><AlertTriangle className="h-5 w-5 text-amber-700" /><p className="mt-3 text-2xl font-black text-slate-950">{summary.noCompletion.length}</p><p className="text-xs font-bold text-slate-500">No recorded lesson completion</p></div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><AlertTriangle className="h-5 w-5 text-rose-700" /><p className="mt-3 text-2xl font-black text-slate-950">{summary.stale.length}</p><p className="text-xs font-bold text-slate-500">No activity in 14+ days</p></div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h3 className="font-black text-slate-950">Programs needing attention</h3>{Object.keys(summary.programCounts).length === 0 ? <div className="mt-4 flex items-center gap-2 text-sm font-bold text-emerald-700"><CheckCircle2 className="h-5 w-5" />No zero-progress learners detected.</div> : <div className="mt-4 space-y-2">{Object.entries(summary.programCounts).sort((a,b) => b[1]-a[1]).map(([program, count]) => <div key={program} className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3"><span className="font-bold text-slate-800">{program.replaceAll('-',' ')}</span><span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">{count} learners</span></div>)}</div>}</div>
    </section>
  );
}
