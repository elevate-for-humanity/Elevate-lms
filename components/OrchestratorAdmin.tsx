'use client';

import { useEffect, useState } from 'react';

interface Autopilot {
  name: string;
  endpoint: string;
  capabilities: string[];
  needs: {
    kvNamespaces?: string[];
    r2Buckets?: string[];
    workers?: unknown[];
  };
}

interface DiagnoseReport {
  token: { error?: unknown };
  resources: {
    kv?: unknown[] | { error?: unknown };
    r2?: unknown[] | { error?: unknown };
    workers?: unknown[] | { error?: unknown };
  };
  timestamp: string;
}

const ORCHESTRATOR_URL = process.env.NEXT_PUBLIC_AUTOPILOT_ORCHESTRATOR_URL?.replace(/\/$/, '') || '';

async function orchestratorRequest<T>(path: string, init?: RequestInit): Promise<T> {
  if (!ORCHESTRATOR_URL) {
    throw new Error('NEXT_PUBLIC_AUTOPILOT_ORCHESTRATOR_URL is not configured');
  }

  const response = await fetch(`${ORCHESTRATOR_URL}${path}`, init);
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Orchestrator request failed (${response.status})${body ? `: ${body}` : ''}`);
  }
  return response.json() as Promise<T>;
}

export default function OrchestratorAdmin() {
  const [autopilots, setAutopilots] = useState<Autopilot[]>([]);
  const [diagnose, setDiagnose] = useState<DiagnoseReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [taskResult, setTaskResult] = useState<unknown>(null);
  const [selectedTask, setSelectedTask] = useState('generate_page');

  useEffect(() => {
    void loadAutopilots();
    void runDiagnose();
  }, []);

  async function loadAutopilots() {
    try {
      setError(null);
      const data = await orchestratorRequest<{ autopilots?: Autopilot[] }>('/autopilot/list');
      setAutopilots(data.autopilots || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load autopilots');
    }
  }

  async function runDiagnose() {
    setLoading(true);
    try {
      setError(null);
      setDiagnose(await orchestratorRequest<DiagnoseReport>('/autopilot/diagnose'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Diagnostics failed');
    } finally {
      setLoading(false);
    }
  }

  async function ensureInfra() {
    setLoading(true);
    try {
      setError(null);
      const data = await orchestratorRequest<unknown>('/autopilot/ensure-infra', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          want: {
            kvNamespaces: ['REGISTRY', 'AI_EMPLOYEE_LOGS'],
            r2Buckets: ['efh-assets', 'efh-images', 'efh-pages', 'efh-private'],
          },
        }),
      });
      setTaskResult(data);
      await runDiagnose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to ensure infrastructure');
    } finally {
      setLoading(false);
    }
  }

  async function runTask() {
    setLoading(true);
    setTaskResult(null);
    try {
      setError(null);
      setTaskResult(
        await orchestratorRequest<unknown>('/autopilot/plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            task: selectedTask,
            meta: { pageType: 'home', description: 'Test page' },
          }),
        }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Task execution failed');
    } finally {
      setLoading(false);
    }
  }

  const getStatusColor = (hasError: boolean) =>
    hasError ? 'bg-brand-surface text-brand-red-800' : 'bg-brand-surface text-brand-success';

  const resourceHasError = (value: DiagnoseReport['resources']['kv']) =>
    !!value && !Array.isArray(value) && 'error' in value && !!value.error;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="font-bold text-brand-orange-600 mb-2 text-2xl md:text-3xl lg:text-4xl">
          Autopilot Orchestrator
        </h1>
        <p className="text-brand-text-muted">Master controller for all AI systems</p>
        <p className="text-xs text-brand-text-light mt-1">
          {ORCHESTRATOR_URL ? `Endpoint: ${ORCHESTRATOR_URL}` : 'Orchestrator endpoint is not configured.'}
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-brand-text">System Diagnostics</h2>
            <button
              onClick={() => void runDiagnose()}
              disabled={loading || !ORCHESTRATOR_URL}
              className="bg-brand-info hover:bg-brand-info-hover text-white px-4 py-2 rounded-lg transition-colors disabled:bg-slate-400"
            >
              {loading ? 'Checking...' : 'Refresh'}
            </button>
          </div>

          {diagnose ? (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-brand-text mb-2">API Token</h3>
                <div className={`px-3 py-2 rounded ${getStatusColor(!!diagnose.token?.error)}`}>
                  {diagnose.token?.error ? <span>❌ Token error</span> : <span>• Valid</span>}
                </div>
              </div>

              {(['kv', 'r2', 'workers'] as const).map((key) => {
                const value = diagnose.resources[key];
                return (
                  <div key={key}>
                    <h3 className="font-semibold text-brand-text mb-2 uppercase">{key}</h3>
                    <div className={`px-3 py-2 rounded ${getStatusColor(resourceHasError(value))}`}>
                      {resourceHasError(value) ? (
                        <span>❌ Resource error</span>
                      ) : (
                        <span>• {Array.isArray(value) ? value.length : 0} resources</span>
                      )}
                    </div>
                  </div>
                );
              })}

              <button
                onClick={() => void ensureInfra()}
                disabled={loading || !ORCHESTRATOR_URL}
                className="w-full bg-brand-success hover:bg-brand-success-hover text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:bg-slate-400"
              >
                {loading ? 'Working...' : '🔧 Ensure Infrastructure'}
              </button>
            </div>
          ) : (
            <div className="text-center text-brand-text-light py-8">
              {ORCHESTRATOR_URL ? 'Loading diagnostics...' : 'Configure the orchestrator endpoint to enable diagnostics.'}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-brand-text mb-4">Run Task</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-brand-text mb-2">Select Task</label>
            <select
              className="w-full border border-brand-border-dark rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-focus focus:border-transparent"
              value={selectedTask}
              onChange={(e) => setSelectedTask(e.target.value)}
            >
              <option value="generate_page">Generate Page</option>
              <option value="deploy_page">Deploy Page</option>
              <option value="generate_asset">Generate Asset</option>
              <option value="process_email">Process Email</option>
              <option value="create_lead">Create Lead</option>
              <option value="send_followup">Send Follow-up</option>
              <option value="make_checkout">Make Checkout</option>
              <option value="run_payout_batch">Run Payout Batch</option>
            </select>
          </div>
          <button
            onClick={() => void runTask()}
            disabled={loading || !ORCHESTRATOR_URL}
            className="w-full bg-brand-info hover:bg-brand-info-hover text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:bg-slate-400 mb-4"
          >
            {loading ? 'Running...' : 'Run Task'}
          </button>
          {taskResult != null && (
            <div className="bg-brand-surface rounded-lg p-4 overflow-auto max-h-64">
              <pre className="text-xs">{JSON.stringify(taskResult, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-brand-text">Registered Autopilots ({autopilots.length})</h2>
          <button
            onClick={() => void loadAutopilots()}
            disabled={!ORCHESTRATOR_URL}
            className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors disabled:bg-slate-400"
          >
            Refresh
          </button>
        </div>
        {autopilots.length === 0 ? (
          <div className="text-center text-brand-text-light py-8">No registered autopilots reported.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {autopilots.map((ap) => (
              <div key={ap.name} className="border border-brand-border rounded-lg p-4">
                <h3 className="font-semibold text-brand-text mb-2">{ap.name}</h3>
                <p className="text-xs text-brand-text-muted mb-3 truncate">{ap.endpoint}</p>
                <div className="mb-3">
                  <h4 className="text-xs font-medium text-brand-text mb-1">Capabilities:</h4>
                  <div className="flex flex-wrap gap-1">
                    {ap.capabilities.map((cap) => (
                      <span key={cap} className="px-2 py-2 bg-brand-surface text-brand-info rounded text-xs">
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>
                {(ap.needs.kvNamespaces?.length || ap.needs.r2Buckets?.length) && (
                  <div>
                    <h4 className="text-xs font-medium text-brand-text mb-1">Needs:</h4>
                    <div className="text-xs text-brand-text-muted">
                      {!!ap.needs.kvNamespaces?.length && <div>KV: {ap.needs.kvNamespaces.join(', ')}</div>}
                      {!!ap.needs.r2Buckets?.length && <div>R2: {ap.needs.r2Buckets.join(', ')}</div>}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
