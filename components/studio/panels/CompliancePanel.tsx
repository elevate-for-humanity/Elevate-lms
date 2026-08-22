'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, RefreshCw, XCircle } from 'lucide-react';
import { useCourse } from '../CourseProvider';

interface PersistedAudit {
  pass: boolean;
  blocking_issues: string[];
  metrics: Record<string, unknown>;
}

export function CompliancePanel() {
  const { state } = useCourse();
  const [audit, setAudit] = useState<PersistedAudit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const lessonMinutes = state.lessons.reduce((sum, lesson) => sum + Number(lesson.duration_minutes ?? 0), 0);
  const targetHours = state.modules.reduce((sum, module) => sum + Number(module.target_hours ?? 0), 0);
  const signoffs = state.lessons.filter((lesson) => lesson.requires_instructor_signoff).length;
  const missingObjectives = state.lessons.filter((lesson) => !Array.isArray(lesson.learning_objectives) || lesson.learning_objectives.length === 0).length;
  const unapproved = state.lessons.filter((lesson) => !lesson.approved).length;

  async function loadAudit() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/course-builder/audit?courseId=${encodeURIComponent(state.course.id)}`, { cache: 'no-store' });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.result) throw new Error(body.error || 'Unable to run persisted course audit');
      setAudit(body.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to run persisted course audit');
      setAudit(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAudit();
  }, [state.course.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const cards = [
    ['Course declared hours', String(state.course.duration_hours ?? '—')],
    ['Lesson seat hours', (lessonMinutes / 60).toFixed(2)],
    ['Module target hours', targetHours.toFixed(2)],
    ['Instructor sign-offs', String(signoffs)],
    ['Missing objectives', String(missingObjectives)],
    ['Lessons awaiting approval', String(unapproved)],
  ];

  return (
    <section className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-950">Compliance and completion readiness</h2>
          <p className="mt-1 text-sm text-slate-600">The readiness result below is executed against the persisted canonical course, not inferred from UI state.</p>
        </div>
        <button onClick={() => void loadAudit()} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Run audit
        </button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(([label, value]) => <div key={label} className="rounded-xl border border-slate-200 bg-white p-4"><div className="text-xs uppercase tracking-wide text-slate-500">{label}</div><div className="mt-1 text-2xl font-black text-slate-950">{value}</div></div>)}
      </div>

      <div className={`mt-5 rounded-xl border p-4 ${audit?.pass ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
        <div className="flex items-center gap-2 font-bold text-slate-950">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : audit?.pass ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <XCircle className="h-5 w-5 text-amber-700" />}
          {loading ? 'Running canonical readiness audit…' : audit?.pass ? 'Persisted course passes publication readiness' : 'Publication blockers remain'}
        </div>
        {error ? <p className="mt-2 text-sm font-medium text-red-700">{error}</p> : null}
        {!loading && audit && !audit.pass ? (
          <ul className="mt-3 max-h-80 space-y-1 overflow-y-auto text-sm text-slate-700">
            {audit.blocking_issues.map((issue) => <li key={issue}>• {issue}</li>)}
          </ul>
        ) : null}
        {!loading && audit?.metrics ? (
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
            {Object.entries(audit.metrics).slice(0, 10).map(([key, value]) => (
              <span key={key} className="rounded-full border border-slate-200 bg-white px-2 py-1">{key.replaceAll('_', ' ')}: <b>{String(value ?? '—')}</b></span>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
