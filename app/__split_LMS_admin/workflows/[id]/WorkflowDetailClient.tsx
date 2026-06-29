'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Zap, Play, Plus, CheckCircle, XCircle, Clock,
  RefreshCw, Trash2, ChevronDown, ChevronUp, AlertTriangle,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Workflow {
  id: string; name: string; workflow_key: string; category: string;
  status: string; last_run_at: string | null; last_run_status: string | null;
  run_count: number; metadata: Record<string, unknown>;
}
interface WorkflowTrigger {
  id: string; workflow_id: string; trigger_type: string;
  event_filter: Record<string, unknown>; cron_expr: string | null; enabled: boolean;
}
interface WorkflowStep {
  id: string; workflow_id: string; step_order: number; action_type: string;
  action_config: Record<string, unknown>; enabled: boolean;
}
interface WorkflowRun {
  id: string; status: string; triggered_by: string;
  created_at: string; completed_at: string | null;
  error_message: string | null; steps_total: number; steps_done: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-green-100 text-green-800', inactive: 'bg-slate-100 text-slate-600',
  paused: 'bg-yellow-100 text-yellow-800', error: 'bg-red-100 text-red-800',
  success: 'bg-green-100 text-green-800', failed: 'bg-red-100 text-red-800',
  running: 'bg-blue-100 text-blue-800', pending: 'bg-slate-100 text-slate-600',
};

const ACTION_LABELS: Record<string, string> = {
  send_email: 'Send Email', send_notification: 'Send Notification',
  update_record: 'Update Record', create_record: 'Create Record',
  emit_event: 'Emit Event', webhook_call: 'Webhook Call',
  ai_action: 'AI Action', condition: 'Condition / Branch',
};

const TRIGGER_LABELS: Record<string, string> = {
  event: 'Platform Event', schedule: 'Schedule (Cron)',
  manual: 'Manual', webhook: 'Inbound Webhook',
};

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

// ── Sub-components ────────────────────────────────────────────────────────────

function RunRow({ run }: { run: WorkflowRun }) {
  const [open, setOpen] = useState(false);
  const pct = run.steps_total > 0 ? Math.round((run.steps_done / run.steps_total) * 100) : 0;
  return (
    <div className="border-b last:border-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 text-left"
      >
        {run.status === 'success' && <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />}
        {run.status === 'failed'  && <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}
        {run.status === 'running' && <RefreshCw className="w-4 h-4 text-blue-500 animate-spin flex-shrink-0" />}
        {!['success','failed','running'].includes(run.status) && <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[run.status] ?? ''}`}>{run.status}</span>
            <span className="text-xs text-slate-500 capitalize">{run.triggered_by}</span>
            <span className="text-xs text-slate-400">{formatRelative(run.created_at)}</span>
          </div>
          {run.steps_total > 0 && (
            <div className="mt-1 flex items-center gap-2">
              <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${run.status === 'failed' ? 'bg-red-400' : 'bg-green-400'}`} style={{ width: `${pct}%` }} />
              </div>
              <span className="text-xs text-slate-400">{run.steps_done}/{run.steps_total}</span>
            </div>
          )}
        </div>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
      </button>
      {open && run.error_message && (
        <div className="px-4 pb-3">
          <p className="text-xs text-red-600 bg-red-50 rounded px-3 py-2 font-mono">{run.error_message}</p>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function WorkflowDetailClient({
  workflow, triggers, steps, runs,
}: {
  workflow: Workflow;
  triggers: WorkflowTrigger[];
  steps: WorkflowStep[];
  runs: WorkflowRun[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [status, setStatus] = useState(workflow.status);
  const [savingStatus, setSavingStatus] = useState(false);

  // New step form
  const [showStepForm, setShowStepForm] = useState(false);
  const [stepAction, setStepAction] = useState('send_notification');
  const [stepConfig, setStepConfig] = useState('{}');
  const [addingStep, setAddingStep] = useState(false);

  // New trigger form
  const [showTriggerForm, setShowTriggerForm] = useState(false);
  const [triggerType, setTriggerType] = useState('manual');
  const [triggerFilter, setTriggerFilter] = useState('{}');
  const [cronExpr, setCronExpr] = useState('');
  const [addingTrigger, setAddingTrigger] = useState(false);

  async function handleRun() {
    setRunning(true);
    setRunResult(null);
    try {
      const res = await fetch('/api/admin/workflows/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow_id: workflow.id }),
      });
      const data = await res.json();
      setRunResult({
        ok: res.ok && data.status !== 'failed',
        msg: data.status === 'failed' ? (data.error ?? 'Run failed') : `Run ${data.runId?.slice(0,8)} — ${data.stepsRun} step(s) executed`,
      });
    } catch (err: any) {
      setRunResult({ ok: false, msg: err.message });
    } finally {
      setRunning(false);
      startTransition(() => router.refresh());
    }
  }

  async function handleStatusChange(next: string) {
    setSavingStatus(true);
    await fetch(`/api/admin/workflows/${workflow.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    });
    setStatus(next);
    setSavingStatus(false);
    startTransition(() => router.refresh());
  }

  async function handleAddStep(e: React.FormEvent) {
    e.preventDefault();
    let config: Record<string, unknown>;
    try { config = JSON.parse(stepConfig); } catch { return; }
    setAddingStep(true);
    await fetch(`/api/admin/workflows/${workflow.id}/steps`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action_type: stepAction, action_config: config, step_order: steps.length }),
    });
    setAddingStep(false);
    setShowStepForm(false);
    setStepConfig('{}');
    startTransition(() => router.refresh());
  }

  async function handleDeleteStep(stepId: string) {
    await fetch(`/api/admin/workflows/${workflow.id}/steps/${stepId}`, { method: 'DELETE' });
    startTransition(() => router.refresh());
  }

  async function handleAddTrigger(e: React.FormEvent) {
    e.preventDefault();
    let parsedFilter: Record<string, unknown>;
    try { parsedFilter = JSON.parse(triggerFilter); } catch { return; }
    setAddingTrigger(true);
    await fetch(`/api/admin/workflows/${workflow.id}/triggers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trigger_type: triggerType, event_filter: parsedFilter, cron_expr: cronExpr || null }),
    });
    setAddingTrigger(false);
    setShowTriggerForm(false);
    startTransition(() => router.refresh());
  }

  async function handleDeleteTrigger(triggerId: string) {
    await fetch(`/api/admin/workflows/${workflow.id}/triggers/${triggerId}`, { method: 'DELETE' });
    startTransition(() => router.refresh());
  }

  return (
    <div className="space-y-6 mt-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{workflow.name}</h1>
            <span className={`px-2 py-0.5 rounded text-sm font-medium ${STATUS_BADGE[status] ?? 'bg-slate-100 text-slate-600'}`}>{status}</span>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            {workflow.category} · {workflow.run_count} runs
            {workflow.last_run_at && ` · last run ${formatRelative(workflow.last_run_at)}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={status}
            onChange={e => handleStatusChange(e.target.value)}
            disabled={savingStatus}
            className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            {['active','inactive','paused'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button
            onClick={handleRun}
            disabled={running}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {running ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {running ? 'Running…' : 'Run Now'}
          </button>
        </div>
      </div>

      {runResult && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-sm ${runResult.ok ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          {runResult.ok ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {runResult.msg}
          <button onClick={() => setRunResult(null)} className="ml-auto text-xs opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Triggers + Steps */}
        <div className="lg:col-span-2 space-y-5">

          {/* Triggers */}
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b bg-slate-50 flex items-center justify-between">
              <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                Triggers ({triggers.length})
              </h2>
              <button onClick={() => setShowTriggerForm(t => !t)} className="text-xs text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Add Trigger
              </button>
            </div>

            {showTriggerForm && (
              <form onSubmit={handleAddTrigger} className="px-4 py-4 border-b bg-amber-50 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
                    <select value={triggerType} onChange={e => setTriggerType(e.target.value)} className="w-full border rounded px-2 py-1.5 text-sm">
                      {Object.entries(TRIGGER_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                  {triggerType === 'schedule' && (
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Cron Expression</label>
                      <input value={cronExpr} onChange={e => setCronExpr(e.target.value)} placeholder="0 9 * * *" className="w-full border rounded px-2 py-1.5 text-sm font-mono" />
                    </div>
                  )}
                  {triggerType === 'event' && (
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Event Filter (JSON)</label>
                      <input value={triggerFilter} onChange={e => setTriggerFilter(e.target.value)} placeholder='{"event_type":"student.enrolled"}' className="w-full border rounded px-2 py-1.5 text-sm font-mono" />
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={addingTrigger} className="bg-amber-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50">
                    {addingTrigger ? 'Adding…' : 'Add'}
                  </button>
                  <button type="button" onClick={() => setShowTriggerForm(false)} className="text-slate-500 text-xs px-3 py-1.5">Cancel</button>
                </div>
              </form>
            )}

            <div className="divide-y">
              {triggers.map(t => (
                <div key={t.id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-slate-800">{TRIGGER_LABELS[t.trigger_type] ?? t.trigger_type}</span>
                    {t.cron_expr && <span className="ml-2 text-xs text-slate-500 font-mono">{t.cron_expr}</span>}
                    {t.event_filter && Object.keys(t.event_filter).length > 0 && (
                      <span className="ml-2 text-xs text-slate-500 font-mono">{JSON.stringify(t.event_filter)}</span>
                    )}
                  </div>
                  <button onClick={() => handleDeleteTrigger(t.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {triggers.length === 0 && !showTriggerForm && (
                <p className="px-4 py-4 text-sm text-slate-500">No triggers yet. Add one to define when this workflow fires.</p>
              )}
            </div>
          </div>

          {/* Steps */}
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b bg-slate-50 flex items-center justify-between">
              <h2 className="font-semibold text-slate-800">Steps ({steps.length})</h2>
              <button onClick={() => setShowStepForm(s => !s)} className="text-xs text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Add Step
              </button>
            </div>

            {showStepForm && (
              <form onSubmit={handleAddStep} className="px-4 py-4 border-b bg-amber-50 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Action</label>
                    <select value={stepAction} onChange={e => setStepAction(e.target.value)} className="w-full border rounded px-2 py-1.5 text-sm">
                      {Object.entries(ACTION_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Config (JSON)</label>
                    <input value={stepConfig} onChange={e => setStepConfig(e.target.value)} placeholder='{"title":"Hello","message":"..."}' className="w-full border rounded px-2 py-1.5 text-sm font-mono" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={addingStep} className="bg-amber-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50">
                    {addingStep ? 'Adding…' : 'Add Step'}
                  </button>
                  <button type="button" onClick={() => setShowStepForm(false)} className="text-slate-500 text-xs px-3 py-1.5">Cancel</button>
                </div>
              </form>
            )}

            <div className="divide-y">
              {steps.map((step, i) => (
                <div key={step.id} className="px-4 py-3 flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-slate-800">{ACTION_LABELS[step.action_type] ?? step.action_type}</span>
                    {Object.keys(step.action_config).length > 0 && (
                      <p className="text-xs text-slate-500 font-mono truncate mt-0.5">{JSON.stringify(step.action_config)}</p>
                    )}
                  </div>
                  <button onClick={() => handleDeleteStep(step.id)} className="text-slate-400 hover:text-red-500 transition-colors flex-shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {steps.length === 0 && !showStepForm && (
                <p className="px-4 py-4 text-sm text-slate-500">No steps yet. Add actions to define what this workflow does.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right: Run history */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b bg-slate-50">
            <h2 className="font-semibold text-slate-800">Run History ({runs.length})</h2>
          </div>
          <div className="divide-y max-h-[600px] overflow-y-auto">
            {runs.length > 0
              ? runs.map(run => <RunRow key={run.id} run={run} />)
              : <p className="px-4 py-8 text-center text-sm text-slate-500">No runs yet.</p>
            }
          </div>
        </div>
      </div>
    </div>
  );
}
