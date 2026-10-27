'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Brain, RefreshCw, Workflow } from 'lucide-react';

type Finding = {
  id: string;
  kind: 'learner' | 'workflow' | 'alert';
  title: string;
  detail: string;
  severity: string;
};
type IntelligenceSnapshot = {
  counts: { atRisk: number; failedTasks: number; alerts: number };
  findings: Finding[];
  generatedAt: string;
};

export default function StudioIntelligencePanel({
  onAskAI,
}: {
  onAskAI: (prompt: string) => void;
}) {
  const [snapshot, setSnapshot] = useState<IntelligenceSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/dev-studio/intelligence', { cache: 'no-store' });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? 'Unable to load intelligence');
      setSnapshot(body);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load intelligence');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="h-full overflow-y-auto bg-slate-950 p-4 text-white sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-cyan-400" />
            <h2 className="text-lg font-black">Operational intelligence</h2>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Live findings share Admin AI’s task, approval, workflow, and evidence system.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-700 px-3 text-sm font-bold"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>
      {error ? (
        <p
          role="alert"
          className="mt-5 rounded-xl border border-red-800 bg-red-950/50 p-4 text-sm text-red-200"
        >
          {error}
        </p>
      ) : null}
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          ['At-risk learners', snapshot?.counts.atRisk ?? 0],
          ['Failed AI tasks', snapshot?.counts.failedTasks ?? 0],
          ['Open alerts', snapshot?.counts.alerts ?? 0],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-2xl font-black">{value}</p>
            <p className="mt-1 text-xs text-slate-400">{label}</p>
          </div>
        ))}
      </div>
      <div className="mt-5 space-y-3">
        {snapshot?.findings.map((finding) => (
          <article
            key={`${finding.kind}-${finding.id}`}
            className="rounded-xl border border-slate-800 bg-slate-900 p-4"
          >
            <div className="flex items-start gap-3">
              {finding.kind === 'workflow' ? (
                <Workflow className="mt-0.5 h-5 w-5 text-violet-400" />
              ) : (
                <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-400" />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-bold">{finding.title}</p>
                <p className="mt-1 text-sm leading-6 text-slate-400">{finding.detail}</p>
                <button
                  type="button"
                  onClick={() =>
                    onAskAI(
                      `Investigate and resolve this intelligence finding using the unified task, workflow, approval, and evidence system: ${finding.title}. ${finding.detail}`,
                    )
                  }
                  className="mt-3 rounded-lg bg-cyan-500 px-3 py-2 text-xs font-black text-slate-950"
                >
                  Ask Admin AI to resolve
                </button>
              </div>
            </div>
          </article>
        ))}
        {!loading && !error && !snapshot?.findings.length ? (
          <p className="rounded-xl border border-slate-800 bg-slate-900 p-6 text-sm text-slate-400">
            No active intelligence findings.
          </p>
        ) : null}
      </div>
    </div>
  );
}
