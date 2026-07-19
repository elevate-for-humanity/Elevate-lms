'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  Zap, Play, Plus, CheckCircle, XCircle, Clock, Pause,
  AlertTriangle, ChevronRight, RefreshCw, Activity, RotateCcw,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Workflow {
  id: string;
  name: string;
  workflow_key: string;
  category: string;
  status: 'active' | 'inactive' | 'paused' | 'error';
  last_run_at: string | null;
  last_run_status: string | null;
  run_count: number;
  trigger_count: number;
  step_count: number;
  metadata: Record<string, unknown>;
}

interface WorkflowRun {
  id: string;
  workflow_id: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
  triggered_by: string;
  created_at: string;
  completed_at: string | null;
  error_message: string | null;
  workflow: { name: string; category: string } | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, string> = {
  active:   'bg-green-100 text-green-800',
  inactive: 'bg-slate-100 text-slate-600',
  paused:   'bg-yellow-100 text-yellow-800',
  error:    'bg-red-100 text-red-800',
  success:  'bg-green-100 text-green-800',
  failed:   'bg-red-100 text-red-800',
  running:  'bg-blue-100 text-blue-800',
  pending:  'bg-slate-100 text-slate-600',
  skipped:  'bg-slate-100 text-slate-500',
};

const CATEGORY_COLORS: Record<string, string> = {
  enrollment: 'bg-blue-50 text-blue-700',
  lms:        'bg-purple-50 text-purple-700',
  compliance: 'bg-orange-50 text-orange-700',
  payment:    'bg-green-50 text-green-700',
  system:     'bg-slate-100 text-slate-600',
};

function RunStatusIcon({ status }: { status: string }) {
  if (status === 'success') return <CheckCircle className="w-3.5 h-3.5 text-green-500" />;
  if (status === 'failed')  return <XCircle className="w-3.5 h-3.5 text-red-500" />;
  if (status === 'running') return <RefreshCw className="w-3.5 h-3.5 text-blue-500 animate-spin" />;
  return <Clock className="w-3.5 h-3.5 text-slate-400" />;
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${d}d ago`;
}

// ── Main component ────────────────────────────────────────────────────────────

export default function WorkflowsClient({
  workflows,
  recentRuns,
}: {
  workflows: Workflow[];
  recentRuns: WorkflowRun[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [runningId, setRunningId] = useState<string | null>(null);
  const [runResult, setRunResult] = useState<{ id: string; ok: boolean; msg: string } | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('system');
  const [creating, setCreating] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [replayingRunId, setReplayingRunId] = useState<string | null>(null);

  const active   = workflows.filter(w => w.status === 'active').length;
  const totalRuns = workflows.reduce((s, w) => s + (w.run_count ?? 0), 0);
  const failed   = recentRuns.filter(r => r.status === 'failed').length;

  const categories = ['all', ...Array.from(new Set(workflows.map(w => w.category)))];
  const filtered = categoryFilter === 'all'
    ? workflows
    : workflows.filter(w => w.category === categoryFilter);

  async function handleRun(workflowId: string) {
    setRunningId(workflowId);
    setRunResult(null);
    try {
      const res = await fetch('/api/admin/workflows/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow_id: workflowId }),
      });
      const data = await res.json();
      setRunResult({
        id: workflowId,
        ok: res.ok && data.status !== 'failed',
        msg: data.status === 'failed' ? (data.error ?? 'Run failed') : `Run ${data.runId?.slice(0, 8)} completed`,
      });
    } catch (err: any) {
      setRunResult({ id: workflowId, ok: false, msg: err.message });
    } finally {
      setRunningId(null);
      startTransition(() => router.refresh());
    }
  }

  async function handleReplay(runId: string) {
    setReplayingRunId(runId);
    try {
      const res = await fetch(`/api/admin/workflows/runs/${runId}/replay`, { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.status !== 'failed') {
        toast.success(`Replayed — new run ${data.newRunId?.slice(0, 8) ?? ''} ${data.status}`);
      } else {
        toast.error(data.error ?? `Replay failed: ${data.status}`);
      }
    } catch (err: any) {
      toast.error(err.message ?? 'Replay request failed');
    } finally {
      setReplayingRunId(null);
      startTransition(() => router.refresh());
    }
  }

  async function handleToggleStatus(w: Workflow) {
    const next = w.status === 'active' ? 'inactive' : 'active';
    await fetch(`/api/admin/workflows/${w.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    });
    startTransition(() => router.refresh());
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    const res = await fetch('/api/admin/workflows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), category: newCategory }),
    });
    const data = await res.json();
    setCreating(false);
    if (res.ok) {
      setShowNewForm(false);
      setNewName('');
      startTransition(() => router.refresh());
      if (data.workflow?.id) router.push(`/admin/workflows/${data.workflow.id}`);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <Zap className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Workflow Engine</h1>
            <p className="text-slate-500 text-sm">Trigger → Event → Action → Automation</p>
          </div>
        </div>
        <button
          onClick={() => setShowNewForm(true)}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Workflow
        </button>
      </div>

      {/* New workflow form */}
      {showNewForm && (
        <div className="bg-white border border-amber-200 rounded-xl p-5 shadow-sm">
          <h2 className="font-semibold text-slate-900 mb-4">Create Workflow</h2>
          <form onSubmit={handleCreate} className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-600 mb-1">Name</label>
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="e.g. Enrollment Welcome Email"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Category</label>
              <select
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                {['enrollment', 'lms', 'compliance', 'payment', 'system'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={creating}
              className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {creating ? 'Creating…' : 'Create'}
            </button>
            <button
              type="button"
              onClick={() => setShowNewForm(false)}
              className="text-slate-500 hover:text-slate-700 text-sm px-3 py-2"
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Workflows', value: workflows.length, icon: Zap, color: 'text-amber-600 bg-amber-50' },
          { label: 'Active', value: active, icon: Activity, color: 'text-green-600 bg-green-50' },
          { label: 'Total Runs', value: totalRuns.toLocaleString(), icon: Play, color: 'text-blue-600 bg-blue-50' },
          { label: 'Recent Failures', value: failed, icon: AlertTriangle, color: failed > 0 ? 'text-red-600 bg-red-50' : 'text-slate-400 bg-slate-50' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white rounded-xl border p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${kpi.color}`}>
                <kpi.icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-900">{kpi.value}</p>
                <p className="text-xs text-slate-500">{kpi.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Run result toast */}
      {runResult && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-sm ${
          runResult.ok ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {runResult.ok ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {runResult.msg}
          <button onClick={() => setRunResult(null)} className="ml-auto text-xs opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Workflow list */}
        <div className="lg:col-span-2 space-y-3">
          {/* Category filter */}
          <div className="flex items-center gap-2 flex-wrap">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  categoryFilter === cat
                    ? 'bg-amber-500 text-white'
                    : 'bg-white border text-slate-600 hover:bg-slate-50'
                }`}
              >
                {cat === 'all' ? 'All' : cat}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b bg-slate-50 flex items-center justify-between">
              <h2 className="font-semibold text-slate-800">Workflows ({filtered.length})</h2>
            </div>
            <div className="divide-y">
              {filtered.map(w => (
                <div key={w.id} className="px-4 py-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/admin/workflows/${w.id}`}
                          className="font-semibold text-slate-900 hover:text-amber-600 transition-colors"
                        >
                          {w.name}
                        </Link>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[w.status] ?? 'bg-slate-100 text-slate-600'}`}>
                          {w.status}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${CATEGORY_COLORS[w.category] ?? 'bg-slate-100 text-slate-600'}`}>
                          {w.category}
                        </span>
                      </div>
                      {(w.metadata as any)?.description && (
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{(w.metadata as any).description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-500">
                        <span>{w.trigger_count} trigger{w.trigger_count !== 1 ? 's' : ''}</span>
                        <span>{w.step_count} step{w.step_count !== 1 ? 's' : ''}</span>
                        <span>{w.run_count} run{w.run_count !== 1 ? 's' : ''}</span>
                        {w.last_run_at && (
                          <span>Last: {formatRelative(w.last_run_at)}</span>
                        )}
                        {w.last_run_status && (
                          <span className={`px-1.5 py-0.5 rounded ${STATUS_BADGE[w.last_run_status] ?? ''}`}>
                            {w.last_run_status}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Toggle active/inactive */}
                      <button
                        onClick={() => handleToggleStatus(w)}
                        title={w.status === 'active' ? 'Pause workflow' : 'Activate workflow'}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          w.status === 'active'
                            ? 'border-green-200 text-green-600 hover:bg-green-50'
                            : 'border-slate-200 text-slate-400 hover:bg-slate-50'
                        }`}
                      >
                        {w.status === 'active' ? <Pause className="w-3.5 h-3.5" /> : <Activity className="w-3.5 h-3.5" />}
                      </button>
                      {/* Manual run */}
                      <button
                        onClick={() => handleRun(w.id)}
                        disabled={runningId === w.id}
                        title="Run manually"
                        className="p-1.5 rounded-lg border border-amber-200 text-amber-600 hover:bg-amber-50 transition-colors disabled:opacity-50"
                      >
                        {runningId === w.id
                          ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          : <Play className="w-3.5 h-3.5" />
                        }
                      </button>
                      {/* Detail link */}
                      <Link
                        href={`/admin/workflows/${w.id}`}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="px-4 py-10 text-center text-slate-500 text-sm">
                  No workflows{categoryFilter !== 'all' ? ` in "${categoryFilter}"` : ''}. Create one to get started.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent runs feed */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b bg-slate-50">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-500" />
              Recent Runs
            </h2>
          </div>
          <div className="divide-y max-h-[600px] overflow-y-auto">
            {recentRuns.length > 0 ? recentRuns.map(run => (
              <div key={run.id} className="px-4 py-3 hover:bg-slate-50">
                <div className="flex items-start gap-2">
                  <RunStatusIcon status={run.status} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-800 truncate">
                      {(run.workflow as any)?.name ?? 'Unknown'}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`px-1.5 py-0.5 rounded text-xs ${STATUS_BADGE[run.status] ?? ''}`}>
                        {run.status}
                      </span>
                      <span className="text-xs text-slate-400 capitalize">{run.triggered_by}</span>
                    </div>
                    {run.error_message && (
                      <p className="text-xs text-red-500 mt-0.5 truncate">{run.error_message}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-slate-400">{formatRelative(run.created_at)}</span>
                    {(run.status === 'failed' || run.status === 'cancelled') && (
                      <button
                        onClick={() => handleReplay(run.id)}
                        disabled={replayingRunId === run.id}
                        title="Replay this run"
                        className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-amber-600 transition-colors disabled:opacity-50"
                      >
                        {replayingRunId === run.id
                          ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          : <RotateCcw className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )) : (
              <div className="px-4 py-8 text-center text-slate-500 text-sm">
                No runs yet. Trigger a workflow manually to see results here.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
