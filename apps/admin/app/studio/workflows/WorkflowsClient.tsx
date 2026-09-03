'use client';

import { useEffect, useState, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  Workflow, RefreshCw, Plus, Play, Pause, Activity, CheckCircle, XCircle,
  Clock, RotateCcw, AlertTriangle, Zap, Bot, ChevronRight,
} from 'lucide-react';

interface UnifiedWorkflow {
  id: string;
  title: string;
  description: string | null;
  type: 'ai_task' | 'general';
  category: string;
  status: string;
  created_at: string;
  updated_at: string;
  last_run_at: string | null;
  last_run_status: string | null;
  run_count: number;
  prompt?: string | null;
  agent_name?: string | null;
  workflow_key?: string | null;
  trigger_count?: number;
  step_count?: number;
}

const TYPE_BADGE: Record<string, string> = {
  ai_task: 'bg-purple-100 text-purple-800',
  general: 'bg-blue-100 text-blue-800',
};

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-slate-100 text-slate-600',
  incomplete: 'bg-amber-100 text-amber-800',
  paused: 'bg-yellow-100 text-yellow-800',
  error: 'bg-red-100 text-red-800',
  pending: 'bg-slate-100 text-slate-600',
  running: 'bg-blue-100 text-blue-800',
  success: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  skipped: 'bg-slate-100 text-slate-500',
};

const CATEGORY_COLORS: Record<string, string> = {
  enrollment: 'bg-blue-50 text-blue-700',
  lms: 'bg-purple-50 text-purple-700',
  compliance: 'bg-orange-50 text-orange-700',
  payment: 'bg-green-50 text-green-700',
  system: 'bg-slate-100 text-slate-600',
  ai: 'bg-purple-50 text-purple-700',
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

export default function WorkflowsClient({ embedded = false }: { embedded?: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [workflows, setWorkflows] = useState<UnifiedWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<'all' | 'ai_task' | 'general'>('all');
  const [runningId, setRunningId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createType, setCreateType] = useState<'ai_task' | 'general'>('general');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('system');
  const [newPrompt, setNewPrompt] = useState('');
  const [newAgent, setNewAgent] = useState('');
  const [creating, setCreating] = useState(false);

  async function fetchWorkflows() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/workflows/unified');
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setWorkflows(json.workflows ?? []);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load workflows');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchWorkflows(); }, []);

  async function handleToggleStatus(w: UnifiedWorkflow) {
    if (w.type !== 'general') return;
    if ((w.trigger_count ?? 0) < 1 || (w.step_count ?? 0) < 1) {
      toast.error('Add at least one trigger and one step before activation.');
      return;
    }
    const next = w.status === 'active' ? 'inactive' : 'active';
    await fetch(`/api/admin/workflows/${w.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    });
    startTransition(() => router.refresh());
    fetchWorkflows();
  }

  async function handleRun(w: UnifiedWorkflow) {
    if (w.type !== 'general') return;
    if ((w.step_count ?? 0) < 1) {
      toast.error('This workflow has no executable steps.');
      return;
    }
    setRunningId(w.id);
    try {
      const res = await fetch('/api/admin/workflows/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow_id: w.id }),
      });
      const data = await res.json();
      if (res.ok && data.status !== 'failed') {
        toast.success(`Run started — ${data.runId?.slice(0, 8) ?? ''}`);
      } else {
        toast.error(data.error ?? 'Run failed');
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setRunningId(null);
      startTransition(() => router.refresh());
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/admin/workflows/unified', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: createType,
          title: newName.trim(),
          name: newName.trim(),
          category: createType === 'ai_task' ? 'ai' : newCategory,
          prompt: createType === 'ai_task' ? newPrompt : undefined,
          agent_name: createType === 'ai_task' ? newAgent : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowCreateForm(false);
        setNewName('');
        setNewPrompt('');
        setNewAgent('');
        toast.success(`${createType === 'ai_task' ? 'AI Task' : 'Workflow'} created`);
        fetchWorkflows();
      } else {
        toast.error(data.error ?? 'Failed to create');
      }
    } finally {
      setCreating(false);
    }
  }

  const filtered = typeFilter === 'all'
    ? workflows
    : workflows.filter(w => w.type === typeFilter);

  const activeCount = workflows.filter(w => w.type === 'general' && w.status === 'active').length;
  const totalRuns = workflows.reduce((s, w) => s + (w.run_count ?? 0), 0);
  const failedCount = workflows.filter(w => w.last_run_status === 'failed').length;

  const header = !embedded ? (
    <div className="relative h-[260px] w-full overflow-hidden">
      <Image src="/images/pages/admin-grants-workflow-detail.webp" alt="Workflows" fill className="object-cover" priority sizes="100vw" />
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/80 to-violet-900/60" />
      <div className="absolute inset-0 flex items-center">
        <div className="max-w-6xl mx-auto px-6 w-full">
          <div className="flex items-center gap-3 mb-2">
            <Workflow className="h-8 w-8 text-white/90" />
            <span className="text-xs font-semibold tracking-widest uppercase bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white">
              Automation
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
            ONE Workflow Engine
          </h1>
          <p className="text-indigo-100 text-base mt-1 max-w-2xl">
            AI agent pipelines and general automations — unified in one place.
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white text-indigo-900 font-bold text-sm px-5 py-2.5 shadow-lg hover:shadow-xl transition-all"
          >
            <Plus className="h-4 w-4" /> New Workflow
          </button>
        </div>
      </div>
    </div>
  ) : (
    <div className="px-4 py-4 border-b border-[#3c3c3c] bg-[#2d2d2d] flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Workflow className="h-4 w-4 text-[#4ec9b0]" />
        <span className="text-xs font-bold uppercase tracking-widest text-white">Workflows</span>
      </div>
      <button
        onClick={() => setShowCreateForm(true)}
        className="inline-flex items-center gap-1 rounded bg-[#4ec9b0] text-black text-xs font-bold px-3 py-1.5 hover:bg-[#6ed8c4] transition-colors"
      >
        <Plus className="h-3 w-3" /> New
      </button>
    </div>
  );

  return (
    <div className={`flex flex-col h-full overflow-hidden ${embedded ? 'bg-[#1e1e1e]' : 'bg-white'}`}>
      {header}

      <div className={`flex-1 overflow-y-auto ${embedded ? 'px-4 py-6' : 'max-w-6xl mx-auto px-6 py-8 w-full'}`}>

        {/* Create form */}
        {showCreateForm && (
          <div className={`rounded-2xl border p-5 mb-6 shadow-sm ${embedded ? 'border-[#333] bg-[#1e1e1e]' : 'border-indigo-200 bg-indigo-50'}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`font-bold ${embedded ? 'text-white' : 'text-slate-900'}`}>New Workflow</h2>
              <button onClick={() => setShowCreateForm(false)} className={`text-sm ${embedded ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-700'}`}>✕</button>
            </div>

            {/* Type selector */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setCreateType('general')}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${createType === 'general'
                  ? 'bg-blue-600 text-white shadow'
                  : embedded ? 'bg-[#2d2d2d] text-slate-400 hover:text-white' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                <Zap className="h-4 w-4" /> General Workflow
              </button>
              <button
                onClick={() => setCreateType('ai_task')}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${createType === 'ai_task'
                  ? 'bg-purple-600 text-white shadow'
                  : embedded ? 'bg-[#2d2d2d] text-slate-400 hover:text-white' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                <Bot className="h-4 w-4" /> AI Agent Task
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className={`block text-xs font-medium mb-1 ${embedded ? 'text-slate-400' : 'text-slate-600'}`}>
                  {createType === 'ai_task' ? 'Task Title' : 'Workflow Name'}
                </label>
                <input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder={createType === 'ai_task' ? 'e.g. Daily student progress summary' : 'e.g. Enrollment Welcome Email'}
                  className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                    embedded ? 'bg-[#2d2d2d] border-[#3c3c3c] text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}
                  required
                />
              </div>

              {createType === 'ai_task' ? (
                <>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${embedded ? 'text-slate-400' : 'text-slate-600'}`}>Agent Name</label>
                    <input
                      value={newAgent}
                      onChange={e => setNewAgent(e.target.value)}
                      placeholder="e.g. Ellie, Lizzy, PARIS"
                      className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 ${
                        embedded ? 'bg-[#2d2d2d] border-[#3c3c3c] text-white' : 'bg-white border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${embedded ? 'text-slate-400' : 'text-slate-600'}`}>Prompt</label>
                    <textarea
                      value={newPrompt}
                      onChange={e => setNewPrompt(e.target.value)}
                      placeholder="What should this AI task do?"
                      rows={4}
                      className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none ${
                        embedded ? 'bg-[#2d2d2d] border-[#3c3c3c] text-white' : 'bg-white border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className={`block text-xs font-medium mb-1 ${embedded ? 'text-slate-400' : 'text-slate-600'}`}>Category</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                      embedded ? 'bg-[#2d2d2d] border-[#3c3c3c] text-white' : 'bg-white border-slate-200 text-slate-900'
                    }`}
                  >
                    {['enrollment', 'lms', 'compliance', 'payment', 'system'].map(c => (
                      <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={creating}
                  className={`rounded-xl font-bold text-sm px-6 py-2.5 transition-colors disabled:opacity-50 ${
                    createType === 'ai_task'
                      ? 'bg-purple-600 hover:bg-purple-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {creating ? 'Creating…' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className={`rounded-xl font-medium text-sm px-6 py-2.5 ${embedded ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Workflows', value: workflows.length, icon: Workflow, color: 'text-indigo-600 bg-indigo-50' },
            { label: 'Active', value: activeCount, icon: Activity, color: 'text-green-600 bg-green-50' },
            { label: 'Total Runs', value: totalRuns.toLocaleString(), icon: Play, color: 'text-blue-600 bg-blue-50' },
            { label: 'Failures', value: failedCount, icon: AlertTriangle, color: failedCount > 0 ? 'text-red-600 bg-red-50' : `${embedded ? 'text-slate-500 bg-slate-800' : 'text-slate-400 bg-slate-50'}` },
          ].map(kpi => (
            <div key={kpi.label} className={`rounded-xl border p-4 shadow-sm ${embedded ? 'border-[#333] bg-[#1e1e1e]' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${kpi.color}`}>
                  <kpi.icon className="w-4 h-4" />
                </div>
                <div>
                  <p className={`text-xl font-bold ${embedded ? 'text-white' : 'text-slate-900'}`}>{kpi.value}</p>
                  <p className={`text-xs ${embedded ? 'text-slate-500' : 'text-slate-500'}`}>{kpi.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className={`rounded-xl border px-5 py-4 text-sm mb-6 ${embedded ? 'border-red-900 bg-red-900/20 text-red-400' : 'border-red-200 bg-red-50 text-red-700'}`}>
            {error}
          </div>
        )}

        {/* Filter + refresh */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            {(['all', 'ai_task', 'general'] as const).map(type => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  typeFilter === type
                    ? 'bg-indigo-600 text-white'
                    : embedded ? 'bg-[#2d2d2d] text-slate-400 hover:text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {type === 'all' ? 'All' : type === 'ai_task' ? 'AI Tasks' : 'General'}
              </button>
            ))}
          </div>
          <button
            onClick={fetchWorkflows}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
              embedded ? 'border-[#3c3c3c] text-slate-300 hover:bg-[#2d2d2d]' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        <p className={`text-sm mb-4 ${embedded ? 'text-slate-500' : 'text-slate-500'}`}>
          {filtered.length} of {workflows.length} workflows
        </p>

        {/* Unified list */}
        <div className={`rounded-2xl border overflow-hidden ${embedded ? 'border-[#333] bg-[#1e1e1e]' : 'border-slate-200 bg-white'}`}>
          <div className={`px-5 py-3 border-b ${embedded ? 'border-[#333] bg-[#252526]' : 'bg-slate-50 border-slate-200'}`}>
            <h2 className={`font-semibold ${embedded ? 'text-slate-300' : 'text-slate-800'}`}>
              All Workflows — newest first
            </h2>
          </div>
          <div className="divide-y">
            {filtered.map(w => (
              <div key={w.id} className={`px-5 py-4 hover:opacity-90 transition ${embedded ? 'hover:bg-[#252526]' : 'hover:bg-slate-50'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`font-bold ${embedded ? 'text-white' : 'text-slate-900'}`}>{w.title}</p>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${TYPE_BADGE[w.type] ?? 'bg-slate-100 text-slate-600'}`}>
                        {w.type === 'ai_task' ? 'AI' : 'General'}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[w.status] ?? 'bg-slate-100 text-slate-600'}`}>
                        {w.status}
                      </span>
                      {w.type === 'general' && (
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${CATEGORY_COLORS[w.category] ?? 'bg-slate-100 text-slate-600'}`}>
                          {w.category}
                        </span>
                      )}
                      {w.type === 'ai_task' && w.agent_name && (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                          {w.agent_name}
                        </span>
                      )}
                    </div>
                    <div className={`flex items-center gap-4 mt-1.5 text-xs ${embedded ? 'text-slate-500' : 'text-slate-500'}`}>
                      {w.type === 'general' ? (
                        <>
                          <span>{w.trigger_count ?? 0} triggers</span>
                          <span>{w.step_count ?? 0} steps</span>
                        </>
                      ) : null}
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
                    {w.description && (
                      <p className={`text-xs mt-1 truncate ${embedded ? 'text-slate-500' : 'text-slate-500'}`}>
                        {w.description}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {w.type === 'general' && (
                      <button
                        onClick={() => handleToggleStatus(w)}
                        title={w.status === 'active' ? 'Pause' : 'Activate'}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          w.status === 'active'
                            ? 'border-green-200 text-green-600 hover:bg-green-50'
                            : embedded ? 'border-[#333] text-slate-500 hover:text-white' : 'border-slate-200 text-slate-400 hover:bg-slate-50'
                        }`}
                      >
                        {w.status === 'active' ? <Pause className="w-3.5 h-3.5" /> : <Activity className="w-3.5 h-3.5" />}
                      </button>
                    )}
                    {w.type === 'general' && (
                      <button
                        onClick={() => handleRun(w)}
                        disabled={runningId === w.id || (w.step_count ?? 0) < 1}
                        title={(w.step_count ?? 0) < 1 ? 'Add a step before running' : 'Run'}
                        className={`p-1.5 rounded-lg border transition-colors disabled:opacity-50 ${
                          embedded ? 'border-[#333] text-slate-500 hover:text-white' : 'border-blue-200 text-blue-600 hover:bg-blue-50'
                        }`}
                      >
                        {runningId === w.id
                          ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          : <Play className="w-3.5 h-3.5" />
                        }
                      </button>
                    )}
                    {w.type === 'general' ? (
                      <Link
                        href={`/studio/workflows/${w.id}`}
                        title="View workflow detail"
                        className={`p-1.5 rounded-lg border transition-colors hover:border-indigo-300 hover:text-indigo-600 ${
                          embedded ? 'border-[#333] text-slate-500' : 'border-slate-200 text-slate-400'
                        }`}
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    ) : (
                      <span className={`${embedded ? 'text-slate-600' : 'text-slate-400'}`}>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <div className={`px-5 py-12 text-center ${embedded ? 'text-slate-500' : 'text-slate-500'}`}>
                <Workflow className="mx-auto h-10 w-10 text-slate-300" />
                <p className="mt-2 text-sm font-medium">No workflows{typeFilter !== 'all' ? ` in "${typeFilter}"` : ''}</p>
                <Link href="/studio/workflows/new" className="mt-3 inline-block text-sm font-semibold text-indigo-600 hover:underline">
                  Create the first one →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
