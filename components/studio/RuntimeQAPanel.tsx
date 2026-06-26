'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Terminal,
  Bug,
  XCircle,
  Filter,
  Download,
  RefreshCcw,
} from 'lucide-react';

type ErrorLevel = 'error' | 'warning' | 'info';

interface RuntimeError {
  id: string;
  timestamp: string;
  level: ErrorLevel;
  source: 'console' | 'api' | 'build' | 'typescript' | 'network';
  message: string;
  source_file?: string;
  line_number?: number;
  stack?: string;
  resolved: boolean;
  auto_fixable: boolean;
  fix_applied?: string;
}

interface BuildCheck {
  type: 'lint' | 'typecheck' | 'build';
  status: 'passed' | 'failed' | 'running' | 'skipped';
  errors: number;
  warnings: number;
  last_run?: string;
  details?: string[];
}

interface RuntimeQAResult {
  errors: RuntimeError[];
  build_checks: BuildCheck[];
  api_health: {
    status: 'healthy' | 'degraded' | 'down';
    latency_ms: number;
    endpoints_tested: number;
    failures: number;
  };
  supabase_health: {
    status: 'connected' | 'error' | 'timeout';
    latency_ms: number;
  };
  cloudflare_health: {
    status: 'ok' | 'error' | 'cache_miss';
    assets_tested: number;
    failures: number;
  };
  summary: {
    total_errors: number;
    critical_errors: number;
    auto_fixable_count: number;
    score: number; // 0-100
  };
}

function SeverityBadge({ level }: { level: ErrorLevel }) {
  const config = {
    error: { color: 'bg-red-100 text-red-700', icon: XCircle },
    warning: { color: 'bg-amber-100 text-amber-700', icon: AlertCircle },
    info: { color: 'bg-blue-100 text-blue-700', icon: Activity },
  };
  const { color, icon: Icon } = config[level];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
      <Icon className="w-3 h-3" />
      {level}
    </span>
  );
}

function SourceBadge({ source }: { source: string }) {
  const colors: Record<string, string> = {
    console: 'bg-slate-100 text-slate-600',
    api: 'bg-purple-100 text-purple-700',
    build: 'bg-orange-100 text-orange-700',
    typescript: 'bg-blue-100 text-blue-700',
    network: 'bg-cyan-100 text-cyan-700',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs ${colors[source] || 'bg-slate-100'}`}>
      {source}
    </span>
  );
}

export default function RuntimeQAPanel() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qaResult, setQaResult] = useState<RuntimeQAResult | null>(null);
  const [filter, setFilter] = useState<'all' | ErrorLevel>('all');
  const [runningChecks, setRunningChecks] = useState(false);

  const loadQA = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/devstudio/runtime-qa');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'QA check failed');
      setQaResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load QA data');
    } finally {
      setLoading(false);
    }
  }, []);

  const runChecks = useCallback(async () => {
    setRunningChecks(true);
    try {
      const res = await fetch('/api/devstudio/runtime-qa/check', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Check failed');
      await loadQA();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Check failed');
    } finally {
      setRunningChecks(false);
    }
  }, [loadQA]);

  const autoFix = useCallback(async (errorId: string) => {
    try {
      const res = await fetch(`/api/devstudio/runtime-qa/fix/${errorId}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Fix failed');
      await loadQA();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fix failed');
    }
  }, [loadQA]);

  useEffect(() => {
    void loadQA();
  }, [loadQA]);

  const filteredErrors = qaResult?.errors.filter(e => 
    filter === 'all' || e.level === filter
  ) || [];

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <Bug className="h-4 w-4 text-brand-blue-600" />
          <h2 className="text-sm font-semibold text-slate-900">Runtime QA</h2>
          {qaResult && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              qaResult.summary.score >= 80 ? 'bg-green-100 text-green-700' :
              qaResult.summary.score >= 50 ? 'bg-amber-100 text-amber-700' :
              'bg-red-100 text-red-700'
            }`}>
              Score: {qaResult.summary.score}/100
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void runChecks()}
            disabled={runningChecks}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {runningChecks ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCcw className="h-3.5 w-3.5" />
            )}
            Run Checks
          </button>
          <button
            type="button"
            onClick={() => void loadQA()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="min-h-0 flex-1 overflow-y-auto p-4 space-y-4">
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Summary Cards */}
        {qaResult && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-lg border bg-white p-3">
              <p className="text-2xl font-bold text-slate-900">{qaResult.summary.total_errors}</p>
              <p className="text-xs text-slate-500">Total Errors</p>
            </div>
            <div className="rounded-lg border bg-white p-3">
              <p className="text-2xl font-bold text-red-600">{qaResult.summary.critical_errors}</p>
              <p className="text-xs text-slate-500">Critical</p>
            </div>
            <div className="rounded-lg border bg-white p-3">
              <p className="text-2xl font-bold text-amber-600">{qaResult.summary.auto_fixable_count}</p>
              <p className="text-xs text-slate-500">Auto-fixable</p>
            </div>
            <div className="rounded-lg border bg-white p-3">
              <p className="text-2xl font-bold text-green-600">{qaResult.summary.score}</p>
              <p className="text-xs text-slate-500">Health Score</p>
            </div>
          </div>
        )}

        {/* Build Checks */}
        {qaResult && qaResult.build_checks.length > 0 && (
          <div className="rounded-lg border">
            <div className="flex items-center justify-between border-b px-4 py-2">
              <h3 className="text-sm font-semibold text-slate-900">Build Checks</h3>
            </div>
            <div className="divide-y">
              {qaResult.build_checks.map((check, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-2">
                  <div className="flex items-center gap-2">
                    {check.status === 'passed' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : check.status === 'failed' ? (
                      <XCircle className="h-4 w-4 text-red-500" />
                    ) : (
                      <RefreshCw className="h-4 w-4 text-slate-400 animate-spin" />
                    )}
                    <span className="text-sm text-slate-700">{check.type}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="text-red-600">{check.errors} errors</span>
                    <span className="text-amber-600">{check.warnings} warnings</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Health Status */}
        {qaResult && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className={`rounded-lg border p-3 ${
              qaResult.api_health.status === 'healthy' ? 'border-green-200 bg-green-50' :
              qaResult.api_health.status === 'degraded' ? 'border-amber-200 bg-amber-50' :
              'border-red-200 bg-red-50'
            }`}>
              <p className="text-xs font-medium text-slate-700">API Health</p>
              <p className={`text-lg font-bold ${
                qaResult.api_health.status === 'healthy' ? 'text-green-600' :
                qaResult.api_health.status === 'degraded' ? 'text-amber-600' :
                'text-red-600'
              }`}>{qaResult.api_health.status}</p>
              <p className="text-xs text-slate-500">{qaResult.api_health.latency_ms}ms latency</p>
            </div>
            <div className={`rounded-lg border p-3 ${
              qaResult.supabase_health.status === 'connected' ? 'border-green-200 bg-green-50' :
              'border-red-200 bg-red-50'
            }`}>
              <p className="text-xs font-medium text-slate-700">Supabase</p>
              <p className={`text-lg font-bold ${
                qaResult.supabase_health.status === 'connected' ? 'text-green-600' : 'text-red-600'
              }`}>{qaResult.supabase_health.status}</p>
              <p className="text-xs text-slate-500">{qaResult.supabase_health.latency_ms}ms latency</p>
            </div>
            <div className={`rounded-lg border p-3 ${
              qaResult.cloudflare_health.status === 'ok' ? 'border-green-200 bg-green-50' :
              'border-red-200 bg-red-50'
            }`}>
              <p className="text-xs font-medium text-slate-700">Cloudflare Assets</p>
              <p className={`text-lg font-bold ${
                qaResult.cloudflare_health.status === 'ok' ? 'text-green-600' : 'text-red-600'
              }`}>{qaResult.cloudflare_health.status}</p>
              <p className="text-xs text-slate-500">{qaResult.cloudflare_health.failures} failures</p>
            </div>
          </div>
        )}

        {/* Filter */}
        {qaResult && qaResult.errors.length > 0 && (
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="text-xs border rounded px-2 py-1"
            >
              <option value="all">All ({qaResult.errors.length})</option>
              <option value="error">Errors ({qaResult.errors.filter(e => e.level === 'error').length})</option>
              <option value="warning">Warnings ({qaResult.errors.filter(e => e.level === 'warning').length})</option>
              <option value="info">Info ({qaResult.errors.filter(e => e.level === 'info').length})</option>
            </select>
            <button
              type="button"
              onClick={() => {
                const csv = filteredErrors.map(e => 
                  `${e.timestamp},${e.level},${e.source},"${e.message}"`
                ).join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `runtime-errors-${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
              }}
              className="ml-auto inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
            >
              <Download className="h-3 w-3" />
              Export CSV
            </button>
          </div>
        )}

        {/* Error List */}
        {loading && !qaResult && (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        )}

        {filteredErrors.map((err) => (
          <div key={err.id} className={`rounded-lg border p-3 ${
            err.level === 'error' ? 'border-red-200 bg-red-50/50' :
            err.level === 'warning' ? 'border-amber-200 bg-amber-50/50' :
            'border-blue-200 bg-blue-50/50'
          }`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <SeverityBadge level={err.level} />
                  <SourceBadge source={err.source} />
                  {err.resolved && (
                    <span className="text-xs text-green-600 bg-green-100 px-1.5 py-0.5 rounded">Resolved</span>
                  )}
                  {err.auto_fixable && !err.resolved && (
                    <span className="text-xs text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">Auto-fixable</span>
                  )}
                </div>
                <p className="text-sm text-slate-800 break-words">{err.message}</p>
                {err.source_file && (
                  <p className="text-xs text-slate-500 mt-1">
                    {err.source_file}:{err.line_number}
                  </p>
                )}
                {err.stack && (
                  <pre className="text-xs text-slate-500 mt-2 p-2 bg-white rounded overflow-x-auto">
                    {err.stack}
                  </pre>
                )}
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-slate-400">
                  {new Date(err.timestamp).toLocaleTimeString()}
                </span>
                {err.auto_fixable && !err.resolved && (
                  <button
                    type="button"
                    onClick={() => void autoFix(err.id)}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Fix
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {qaResult && qaResult.errors.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-slate-500">
            <CheckCircle2 className="h-8 w-8 text-green-500 mb-2" />
            <p className="text-sm">No runtime errors detected</p>
            <p className="text-xs">All systems operational</p>
          </div>
        )}
      </div>
    </div>
  );
}
