'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  ExternalLink,
  Loader2,
  Play,
  Plus,
  RefreshCw,
  Workflow,
} from 'lucide-react';
import Link from 'next/link';

interface WorkflowRow {
  id: string;
  name: string;
  status?: string;
  category?: string;
  updated_at?: string;
}

interface WorkflowRunRow {
  id: string;
  status?: string;
  created_at?: string;
  workflow?: { name?: string };
}

export default function DevStudioWorkflowsPanel() {
  const [workflows, setWorkflows] = useState<WorkflowRow[]>([]);
  const [runs, setRuns] = useState<WorkflowRunRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [wfRes, runsRes] = await Promise.all([
        fetch('/api/admin/workflows'),
        fetch('/api/admin/dev-studio/workflows'),
      ]);
      const wfData = await wfRes.json().catch(() => ({}));
      const runsData = await runsRes.json().catch(() => ({}));
      if (!wfRes.ok) throw new Error((wfData as { error?: string }).error ?? 'Failed to load workflows');
      setWorkflows((wfData as { data?: WorkflowRow[] }).data ?? []);
      setRuns((runsData as { runs?: WorkflowRunRow[] }).runs ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load workflows');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function runWorkflow(id: string) {
    setRunningId(id);
    setError(null);
    try {
      const res = await fetch('/api/admin/workflows/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow_id: id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Run failed');
    } finally {
      setRunningId(null);
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <Workflow className="h-4 w-4 text-brand-blue-600" />
          <h2 className="text-sm font-semibold text-slate-900">Automation workflows</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link
            href="/studio/workflows"
            className="inline-flex items-center gap-1 rounded-lg bg-brand-blue-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-brand-blue-700"
          >
            <Plus className="h-3.5 w-3.5" />
            Manage
          </Link>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 space-y-4">
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {loading && workflows.length === 0 && (
          <div className="flex justify-center py-8 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Loading from Supabase…
          </div>
        )}

        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Workflows ({workflows.length})
          </h3>
          {workflows.length === 0 && !loading ? (
            <p className="text-sm text-slate-500">
              No workflows yet.{' '}
              <Link href="/studio/workflows" className="text-brand-blue-600 underline">
                Create one
              </Link>
            </p>
          ) : (
            <ul className="space-y-2">
              {workflows.map((wf) => (
                <li
                  key={wf.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{wf.name}</p>
                    <p className="text-[10px] text-slate-500">
                      {wf.status ?? 'unknown'} · {wf.category ?? 'operations'}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      disabled={runningId === wf.id}
                      onClick={() => void runWorkflow(wf.id)}
                      className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-50"
                    >
                      {runningId === wf.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Play className="h-3 w-3" />
                      )}
                      Run
                    </button>
                    <Link
                      href="/studio/workflows"
                      className="text-xs text-brand-blue-600 hover:underline"
                    >
                      Edit
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Recent runs
          </h3>
          {runs.length === 0 ? (
            <p className="text-xs text-slate-500">No runs yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
              {runs.map((run) => (
                <li key={run.id} className="flex items-center justify-between px-3 py-2 text-xs">
                  <span className="text-slate-800">{run.workflow?.name ?? run.id.slice(0, 8)}</span>
                  <span className="font-mono text-slate-500">{run.status ?? '—'}</span>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/studio/workflows"
            className="mt-2 inline-flex items-center gap-1 text-xs text-brand-blue-600 hover:underline"
          >
            Open workflow builder
            <ExternalLink className="h-3 w-3" />
          </Link>
        </section>
      </div>
    </div>
  );
}
