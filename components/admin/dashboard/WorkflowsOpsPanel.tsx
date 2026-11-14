'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Loader2, Play, RefreshCw, Zap } from 'lucide-react';

interface WorkflowRow {
  id: string;
  name: string;
  workflow_key: string;
  status: string;
  last_run_status: string | null;
  run_count: number;
}

export function WorkflowsOpsPanel() {
  const [workflows, setWorkflows] = useState<WorkflowRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/workflows');
      const data = await res.json().catch(() => ({}));
      const rows = Array.isArray(data?.workflows) ? data.workflows : Array.isArray(data?.data) ? data.data : [];
      setWorkflows(rows);
    } catch {
      setWorkflows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function runWorkflow(workflowId: string, workflowKey: string) {
    setRunningId(workflowId);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/workflows/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow_id: workflowId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setMessage(data.message ?? 'Workflow run queued.');
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Run failed');
    } finally {
      setRunningId(null);
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#1e1e1e] text-[#cccccc]">
      <div className="flex shrink-0 items-center justify-between border-b border-[#3c3c3c] bg-[#252526] px-3 py-2">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-[#f0a500]" />
          <span className="text-sm font-semibold text-white">Workflows</span>
          <span className="text-[10px] text-[#858585]">enrollment · LMS · compliance · payments</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex h-8 items-center gap-1 rounded border border-[#3c3c3c] px-2 text-[11px]"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link
            href="/studio/workflows"
            className="inline-flex h-8 items-center gap-1 rounded bg-[#0078d4] px-2 text-[11px] font-semibold text-white"
          >
            Full editor
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>
      {message && (
        <p className="shrink-0 border-b border-[#3c3c3c] bg-[#2d2d2d] px-3 py-2 text-[11px] text-[#4ec9b0]">{message}</p>
      )}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex h-32 items-center justify-center gap-2 text-[#858585]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading workflows…
          </div>
        ) : workflows.length === 0 ? (
          <p className="p-4 text-xs text-[#858585]">No workflows returned. Open the full editor to create one.</p>
        ) : (
          workflows.slice(0, 40).map((w) => (
            <div
              key={w.id}
              className="flex items-center justify-between gap-2 border-b border-[#2d2d2d] px-3 py-2.5 text-xs"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-white">{w.name}</p>
                <p className="truncate font-mono text-[10px] text-[#858585]">{w.workflow_key}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="rounded px-1.5 py-0.5 text-[10px] ring-1 ring-[#3c3c3c]">{w.status}</span>
                <button
                  type="button"
                  disabled={runningId === w.id}
                  onClick={() => runWorkflow(w.id, w.workflow_key)}
                  className="inline-flex h-8 items-center gap-1 rounded bg-[#f97316] px-2 text-[10px] font-semibold text-white disabled:opacity-50"
                >
                  {runningId === w.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                  Run
                </button>
                <Link
                  href="/studio/workflows"
                  className="text-[10px] font-semibold text-[#4ec9b0] hover:underline"
                >
                  Edit
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default WorkflowsOpsPanel;
