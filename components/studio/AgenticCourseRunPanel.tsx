'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Bot, CheckCircle2, CircleDashed, Clock3, Loader2, Play, RefreshCw, ShieldCheck, Video } from 'lucide-react';

interface TaskRow {
  id: string;
  worker: string;
  action: string;
  status: string;
  output?: Record<string, any> | null;
  error?: string | null;
  requires_approval?: boolean;
}

interface Snapshot {
  project?: { id: string; target_id?: string | null; title?: string; status?: string };
  run?: { id: string; status: string; error?: string | null; credits_used?: number } | null;
  tasks?: TaskRow[];
  course?: Record<string, any> | null;
  media?: Record<string, number> | null;
}

const STATUS_STYLE: Record<string, string> = {
  completed: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  running: 'border-blue-200 bg-blue-50 text-blue-800',
  queued: 'border-slate-200 bg-slate-50 text-slate-700',
  waiting_review: 'border-amber-200 bg-amber-50 text-amber-900',
  failed: 'border-red-200 bg-red-50 text-red-800',
};

function statusIcon(status: string) {
  if (status === 'completed') return <CheckCircle2 className="h-4 w-4" />;
  if (status === 'running') return <Loader2 className="h-4 w-4 animate-spin" />;
  if (status === 'waiting_review') return <ShieldCheck className="h-4 w-4" />;
  if (status === 'failed') return <CircleDashed className="h-4 w-4" />;
  return <Clock3 className="h-4 w-4" />;
}

export function AgenticCourseRunPanel({
  courseId,
  programId,
  courseTitle,
}: {
  courseId: string;
  programId?: string | null;
  courseTitle: string;
}) {
  const storageKey = `elevate:course-agent:${courseId}`;
  const [goal, setGoal] = useState(`Finish ${courseTitle} as a complete learner-ready governed course, repair missing instructional content and assessments, generate required media, validate every required checklist, approve with Course Builder AI when all gates pass, then publish through the canonical Course Builder while preserving human review and editing controls.`);
  const [projectId, setProjectId] = useState('');
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');

  const terminal = Boolean(projectId && snapshot?.run && ['completed', 'failed', 'canceled'].includes(snapshot.run.status));
  const active = Boolean(projectId && snapshot?.run && !terminal);

  function resetRun() {
    window.localStorage.removeItem(storageKey);
    setProjectId('');
    setSnapshot(null);
    setError('');
  }

  async function refresh(id = projectId) {
    if (!id) return;
    const response = await fetch(`/api/admin/dev-studio/course-agent?projectId=${encodeURIComponent(id)}`, { cache: 'no-store' });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || 'Unable to load Course Builder run');
    setSnapshot(body);
  }

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (saved) {
      setProjectId(saved);
      void refresh(saved).catch(() => window.localStorage.removeItem(storageKey));
    }
  }, [storageKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!projectId) return;
    const timer = window.setInterval(() => void refresh(projectId).catch(() => undefined), 5000);
    return () => window.clearInterval(timer);
  }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function start(event: FormEvent) {
    event.preventDefault();
    if (!goal.trim() || starting) return;
    setStarting(true);
    setError('');
    try {
      const response = await fetch('/api/admin/dev-studio/course-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', goal, programId, courseId, title: courseTitle }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.projectId) throw new Error(body.error || 'Unable to start Course Builder agent');
      window.localStorage.setItem(storageKey, body.projectId);
      setProjectId(body.projectId);
      await refresh(body.projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start Course Builder agent');
    } finally {
      setStarting(false);
    }
  }

  const progress = useMemo(() => {
    const tasks = snapshot?.tasks ?? [];
    if (!tasks.length) return 0;
    return Math.round((tasks.filter((task) => task.status === 'completed').length / tasks.length) * 100);
  }, [snapshot?.tasks]);

  return (
    <section className="mb-6 rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-violet-700">
            <Bot className="h-4 w-4" /> Agentic Course Builder
          </div>
          <h3 className="mt-1 text-base font-bold text-slate-950">Visible build plan · persistent task graph</h3>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-600">
            Course Builder AI performs the first governed review and approves only after every persisted checklist passes. Human operators can inspect, edit, reject, unpublish, or republish afterward.
          </p>
        </div>
        {projectId ? (
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void refresh()} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </button>
            {terminal ? (
              <button type="button" onClick={resetRun} className="inline-flex items-center gap-1 rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-700">
                <Play className="h-3.5 w-3.5" /> Start new run
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {!projectId ? (
        <form onSubmit={start} className="mt-4 space-y-3">
          <textarea
            value={goal}
            onChange={(event) => setGoal(event.target.value)}
            rows={4}
            className="w-full rounded-xl border border-violet-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
          />
          {error ? <p className="text-xs font-medium text-red-700">{error}</p> : null}
          <button disabled={starting || !goal.trim()} className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-bold text-white hover:bg-violet-700 disabled:opacity-50">
            {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {starting ? 'Creating plan…' : 'Build from this goal'}
          </button>
        </form>
      ) : (
        <div className="mt-4 space-y-4">
          <div>
            <div className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-600">
              <span>{snapshot?.run?.status ?? 'loading'} · {progress}% tasks complete</span>
              <span>{snapshot?.tasks?.length ?? 0} tasks</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-violet-600 transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="grid gap-2 md:grid-cols-2">
            {(snapshot?.tasks ?? []).map((task) => (
              <div key={task.id} className={`rounded-xl border p-3 ${STATUS_STYLE[task.status] ?? STATUS_STYLE.queued}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold">
                    {statusIcon(task.status)}
                    <span>{task.worker}</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wide">{task.status.replaceAll('_', ' ')}</span>
                </div>
                <p className="mt-1 text-xs opacity-80">{task.action.replaceAll('_', ' ')}</p>
                {task.error ? <p className="mt-2 text-xs font-semibold text-red-700">{task.error}</p> : null}
                {task.output?.summary ? <p className="mt-2 text-xs">{String(task.output.summary)}</p> : null}
                {Array.isArray(task.output?.blocking_issues) && task.output.blocking_issues.length ? (
                  <div className="mt-2 space-y-1 text-xs">
                    {task.output.blocking_issues.slice(0, 4).map((issue: string) => <div key={issue}>• {issue}</div>)}
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          {snapshot?.media ? (
            <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-700 sm:grid-cols-4">
              <div className="flex items-center gap-1.5"><Video className="h-3.5 w-3.5" /> Lesson complete: <b>{snapshot.media.lessonComplete ?? 0}</b></div>
              <div>Lesson rendering: <b>{snapshot.media.lessonRendering ?? 0}</b></div>
              <div>Microclips complete: <b>{snapshot.media.microclipComplete ?? 0}</b></div>
              <div>Failed media: <b>{snapshot.media.failed ?? 0}</b></div>
            </div>
          ) : null}

          {snapshot?.course ? (
            <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-700">
              <b>{String(snapshot.course.title ?? courseTitle)}</b> · {String(snapshot.course.status ?? 'draft')} · review {String(snapshot.course.review_status ?? 'draft')} · generation {String(snapshot.course.generation_status ?? 'draft')}
            </div>
          ) : null}

          {snapshot?.run?.error ? <p className="rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-700">{snapshot.run.error}</p> : null}
          {active ? <p className="text-[11px] text-slate-500">This run is persisted in Supabase and continues independently of this browser tab.</p> : null}
        </div>
      )}
    </section>
  );
}
