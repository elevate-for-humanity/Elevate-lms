'use client';

import { useEffect, useState } from 'react';
import { GitBranch, Loader2, RefreshCw, Zap } from 'lucide-react';

type Rule = {
  id: string;
  name: string;
  description?: string | null;
  status?: string | null;
  trigger_type?: string | null;
  action_type?: string | null;
  enabled?: boolean | null;
  run_count?: number | null;
  last_triggered_at?: string | null;
};
type Workflow = {
  id: string;
  name: string;
  workflow_key?: string | null;
  category?: string | null;
  status?: string | null;
  last_run_at?: string | null;
  last_run_status?: string | null;
  run_count?: number | null;
};

export default function CourseAutomationSummary({ courseId }: { courseId: string }) {
  const [rules, setRules] = useState<Rule[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [scope, setScope] = useState('platform');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(
        `/api/admin/course-builder/automation-summary?courseId=${encodeURIComponent(courseId)}`,
        { cache: 'no-store' },
      );
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Automation summary failed');
      setRules(
        Array.isArray(body.courseScopedRules) && body.courseScopedRules.length
          ? body.courseScopedRules
          : Array.isArray(body.recentRules)
            ? body.recentRules.slice(0, 12)
            : [],
      );
      setWorkflows(Array.isArray(body.workflows) ? body.workflows.slice(0, 12) : []);
      setScope(body.workflowScope ?? 'platform');
      setNote(body.note ?? '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Automation summary failed');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [courseId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-400">
            <Zap className="h-4 w-4" /> Course automation context
          </div>
          <h2 className="mt-1 text-xl font-bold text-white">Rules + workflows</h2>
          <p className="mt-1 text-sm text-slate-400">
            Preserves the old Course Studio automation dashboard while keeping the full Workflow
            Designer at its canonical Studio route. Workflow scope: {scope}.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => void load()}
            disabled={loading}
            className="rounded-lg border border-slate-700 p-2 text-slate-300 hover:bg-slate-800"
            title="Refresh automation context"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </button>
          <a
            href="/studio/workflows"
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400"
          >
            <GitBranch className="h-4 w-4" /> Open Workflow Designer
          </a>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-900 bg-red-950/30 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
          <h3 className="font-semibold text-white">Automation rules</h3>
          <div className="mt-3 space-y-2">
            {rules.length ? (
              rules.map((rule) => (
                <div key={rule.id} className="rounded-lg border border-slate-800 bg-slate-900 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium text-white">{rule.name}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        {rule.trigger_type || 'trigger'} → {rule.action_type || 'action'} · runs{' '}
                        {rule.run_count ?? 0}
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        rule.enabled === false || rule.status === 'inactive'
                          ? 'bg-slate-800 text-slate-400'
                          : 'bg-green-950 text-green-300'
                      }`}
                    >
                      {rule.enabled === false ? 'disabled' : rule.status || 'enabled'}
                    </span>
                  </div>
                  {rule.description && (
                    <p className="mt-2 text-xs text-slate-400">{rule.description}</p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No automation rules are currently visible.</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
          <h3 className="font-semibold text-white">Workflow Designer flows</h3>
          <div className="mt-3 space-y-2">
            {workflows.length ? (
              workflows.map((workflow) => (
                <div key={workflow.id} className="rounded-lg border border-slate-800 bg-slate-900 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium text-white">{workflow.name}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        {workflow.category || 'workflow'} · runs {workflow.run_count ?? 0}
                        {workflow.last_run_status ? ` · last ${workflow.last_run_status}` : ''}
                      </div>
                    </div>
                    <span className="rounded-full bg-cyan-950 px-2 py-0.5 text-[11px] font-semibold text-cyan-300">
                      {workflow.status || 'draft'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No workflows are currently visible for this scope.</p>
            )}
          </div>
        </div>
      </div>

      {note && <p className="mt-4 text-xs text-slate-500">{note}</p>}
    </section>
  );
}
