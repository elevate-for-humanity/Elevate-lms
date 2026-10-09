'use client';

import { useEffect, useRef, useState } from 'react';
import { ULTIMATE_BUILD_STEPS, type UltimateBuildStep } from '@/lib/ultimate-course-builder/core/types';

type Step = { step: string; state: string; findings?: unknown[]; completed_at?: string | null };
type Lesson = { id: string; lesson_key: string; status: string; ultimate_lesson_steps?: Step[] };
type Check = { name: string; passed: boolean; message: string };

function findingText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'message' in value && typeof value.message === 'string') return value.message;
  return '';
}

export default function UltimateStageInspector({ buildId, updatedAt }: { buildId: string; updatedAt?: string | null }) {
  const [selected, setSelected] = useState<UltimateBuildStep | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [checks, setChecks] = useState<Check[]>([]);
  const [checking, setChecking] = useState(false);
  const [healthError, setHealthError] = useState('');
  const requestToken = useRef(0);

  useEffect(() => {
    setSelected(null);
    setLessons([]);
    setError('');
  }, [buildId]);

  useEffect(() => {
    if (!selected) return;
    const token = ++requestToken.current;
    const controller = new AbortController();
    setLoading(true);
    setError('');
    void fetch('/api/admin/ultimate-course-builder?view=checkpoints&buildId=' + encodeURIComponent(buildId), {
      cache: 'no-store', signal: controller.signal,
    }).then(async response => {
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'Unable to load saved lesson checkpoints');
      if (token !== requestToken.current) return;
      setLessons(Array.isArray(payload.build?.ultimate_lesson_builds) ? payload.build.ultimate_lesson_builds : []);
    }).catch(reason => {
      if (!controller.signal.aborted && token === requestToken.current)
        setError(reason instanceof Error ? reason.message : 'Unable to load saved lesson checkpoints');
    }).finally(() => {
      if (!controller.signal.aborted && token === requestToken.current) setLoading(false);
    });
    return () => controller.abort();
  }, [buildId, selected, updatedAt, retry]);

  async function checkHealth() {
    setChecking(true);
    setHealthError('');
    setChecks([]);
    try {
      const response = await fetch('/api/admin/courses/health', {
        cache: 'no-store', signal: AbortSignal.timeout(30000),
      });
      const payload = await response.json().catch(() => ({}));
      if (!Array.isArray(payload.checks))
        throw new Error(payload.error || 'Course Builder health check failed (' + response.status + ')');
      setChecks(payload.checks);
    } catch (reason) {
      setHealthError(reason instanceof Error ? reason.message : 'Course Builder health check could not complete');
    } finally {
      setChecking(false);
    }
  }

  return (
    <section className="mt-5 space-y-4" aria-label="Course Builder checkpoints">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-bold text-white">Lesson checkpoints</h3>
        <button type="button" onClick={() => void checkHealth()} disabled={checking}
          className="rounded-lg border border-slate-600 px-3 py-2 text-sm disabled:opacity-50">
          {checking ? 'Checking dependencies…' : 'Check Course Builder health'}
        </button>
      </div>
      {healthError ? <p role="alert" className="text-sm text-red-200">{healthError}</p> : null}
      {checks.length ? (
        <ul className="space-y-2">
          {checks.map(check => <li key={check.name} className="rounded-lg border border-slate-700 p-3 text-sm">
            <strong className={check.passed ? 'text-emerald-300' : 'text-amber-200'}>{check.name}: {check.passed ? 'Passed' : 'Needs repair'}</strong>
            <p className="mt-1 text-slate-300">{check.message}</p>
          </li>)}
        </ul>
      ) : null}
      <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {ULTIMATE_BUILD_STEPS.map((step, index) => (
          <li key={step}>
            <button type="button" onClick={() => setSelected(step)} aria-pressed={selected === step}
              className={`w-full rounded-lg border p-3 text-left text-sm ${selected === step ? 'border-cyan-400 bg-cyan-950 text-cyan-100' : 'border-slate-700 bg-slate-950 text-slate-200 hover:border-cyan-500'}`}>
              {index + 1}. {step.replaceAll('_', ' ')}
            </button>
          </li>
        ))}
      </ol>
      {selected ? (
        <div className="rounded-xl border border-slate-700 bg-slate-950 p-4">
          <h4 className="font-bold text-white">{selected.replaceAll('_', ' ')}</h4>
          {loading ? <p role="status" className="mt-2 text-sm">Loading saved lesson checkpoints…</p> : null}
          {error ? <p role="alert" className="mt-2 text-red-200">{error}</p> : null}
          <button type="button" onClick={() => setRetry(value => value + 1)} disabled={loading}
            className="mt-2 text-sm text-cyan-300 underline">Refresh checkpoints</button>
          {!loading && !error && !lessons.length ? <p className="mt-3 text-sm text-slate-300">This build has no saved lesson checkpoints yet. Start the Google worker to begin processing.</p> : null}
          {!loading && !error ? <ul className="mt-3 space-y-2">
            {lessons.map(lesson => {
              const checkpoint = lesson.ultimate_lesson_steps?.find(row => row.step === selected);
              const findings = (checkpoint?.findings ?? []).map(findingText).filter(Boolean);
              return <li key={lesson.id} className="rounded-lg border border-slate-800 p-3 text-sm">
                <strong>{lesson.lesson_key}</strong>
                <p className="mt-1 text-slate-300">{checkpoint?.state ?? 'Not started'}</p>
                {findings.map((finding, index) => <p key={index} className="mt-1 text-amber-200">{finding}</p>)}
              </li>;
            })}
          </ul> : null}
        </div>
      ) : null}
    </section>
  );
}
