'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Brain, CheckCircle2, Clock3, Cpu, Database, FileText, GitBranch, RefreshCw, Rocket, ShieldCheck } from 'lucide-react';

type Overlay = 'critical' | 'storage' | 'stale' | 'retry';
type PipelineSummary = {
  modules: number;
  lessons: number;
  videosComplete: number;
  queuedJobs: number;
  runningJobs: number;
  failedJobs: number;
  approvedJobs: number;
  staleJobs: number;
  storageFailures: number;
  retryBudgetExhausted: number;
  deadLetterJobs: number;
};

const layers = [
  { name: 'Input', icon: FileText, nodes: ['Requirements', 'Evidence', 'Domain profile'] },
  { name: 'Intelligence', icon: Brain, nodes: ['Canonical RAG', 'Configured AI', 'Scene plan'] },
  { name: 'Rendering', icon: Cpu, nodes: ['Atomic queue', 'GPU scenes', 'Remotion compositor', 'Resumable upload'] },
  { name: 'Quality', icon: ShieldCheck, nodes: ['Media decode', 'Narration/STT', 'Visual evidence', 'Safety & access'] },
  { name: 'Promotion', icon: Rocket, nodes: ['Automated decision', 'Immutable version', 'Learner URL'] },
  { name: 'State', icon: GitBranch, nodes: ['Lease', 'Heartbeat', 'Checkpoint', 'Completion'] },
  { name: 'Error', icon: AlertTriangle, nodes: ['Classification', 'Backoff', 'Stale recovery', 'Dead letter'] },
] as const;

export default function CoursePipelineDiagram({ courseId }: { courseId: string }) {
  const [overlays, setOverlays] = useState<Overlay[]>(['critical', 'storage', 'stale', 'retry']);
  const [summary, setSummary] = useState<PipelineSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    if (!courseId) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/course-builder/pipeline-status?courseId=${encodeURIComponent(courseId)}`, { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Unable to load pipeline status');
      setSummary(payload.summary);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load pipeline status');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [courseId]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggle(value: Overlay) {
    setOverlays((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  }

  const alerts = [
    overlays.includes('storage') && summary?.storageFailures ? `${summary.storageFailures} storage/413 failure${summary.storageFailures === 1 ? '' : 's'}` : null,
    overlays.includes('stale') && summary?.staleJobs ? `${summary.staleJobs} expired rendering lease${summary.staleJobs === 1 ? '' : 's'}` : null,
    overlays.includes('retry') && summary?.retryBudgetExhausted ? `${summary.retryBudgetExhausted} exhausted retry budget${summary.retryBudgetExhausted === 1 ? '' : 's'}` : null,
    summary?.deadLetterJobs ? `${summary.deadLetterJobs} dead-letter job${summary.deadLetterJobs === 1 ? '' : 's'}` : null,
  ].filter(Boolean) as string[];

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5" aria-labelledby="course-pipeline-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2"><Database className="h-5 w-5 text-cyan-400" /><h2 id="course-pipeline-title" className="text-lg font-bold">Course and video pipeline</h2></div>
          <p className="mt-1 text-sm text-slate-400">Seven-layer production path with live course-specific failure overlays.</p>
        </div>
        <button onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm font-bold hover:bg-slate-800 disabled:opacity-50">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2" aria-label="Pipeline overlays">
        {([
          ['critical', 'Critical path'],
          ['storage', '413/storage'],
          ['stale', 'Stale leases'],
          ['retry', 'Retry budgets'],
        ] as const).map(([value, label]) => (
          <button key={value} onClick={() => toggle(value)} aria-pressed={overlays.includes(value)} className={`rounded-full border px-3 py-1.5 text-xs font-bold ${overlays.includes(value) ? 'border-cyan-400 bg-cyan-400/15 text-cyan-200' : 'border-slate-700 text-slate-400'}`}>{label}</button>
        ))}
      </div>

      <div className="mt-5 grid gap-3 xl:grid-cols-7">
        {layers.map((layer, index) => {
          const Icon = layer.icon;
          return <div key={layer.name} className={`relative rounded-xl border p-3 ${layer.name === 'Error' && alerts.length ? 'border-red-700 bg-red-950/30' : 'border-slate-700 bg-slate-950'}`}>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-300"><Icon className="h-4 w-4 text-cyan-400" />{layer.name}</div>
            <div className="mt-3 space-y-2">{layer.nodes.map((node) => <div key={node} className="rounded-lg border border-slate-800 bg-slate-900 px-2 py-2 text-xs text-slate-300">{node}</div>)}</div>
            {index < layers.length - 1 && <span className="absolute -right-2 top-1/2 z-10 hidden text-cyan-500 xl:block" aria-hidden>→</span>}
          </div>;
        })}
      </div>

      {error && <div className="mt-4 rounded-lg border border-red-800 bg-red-950/40 p-3 text-sm text-red-200">{error}</div>}
      {summary && <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
        <Metric label="Modules" value={summary.modules} />
        <Metric label="Lessons" value={summary.lessons} />
        <Metric label="Complete" value={summary.videosComplete} />
        <Metric label="Queued" value={summary.queuedJobs} />
        <Metric label="Rendering" value={summary.runningJobs} />
        <Metric label="Failed" value={summary.failedJobs} />
        <Metric label="Approved" value={summary.approvedJobs} />
        <Metric label="Dead letter" value={summary.deadLetterJobs} />
      </div>}
      <div className={`mt-4 flex items-start gap-2 rounded-lg border p-3 text-sm ${alerts.length ? 'border-amber-700 bg-amber-950/30 text-amber-100' : 'border-emerald-800 bg-emerald-950/30 text-emerald-100'}`}>
        {alerts.length ? <Clock3 className="mt-0.5 h-4 w-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
        <span>{alerts.length ? alerts.join(' · ') : 'No active storage, stale-lease, retry-budget, or dead-letter overlay for this course.'}</span>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2"><div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</div><div className="mt-1 text-lg font-black text-white">{value}</div></div>;
}
