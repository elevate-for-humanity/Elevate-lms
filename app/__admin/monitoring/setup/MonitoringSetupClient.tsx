'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  CheckCircle, XCircle, AlertTriangle, Loader2, RefreshCw,
  Activity, Zap, Shield, Clock,
} from 'lucide-react';

type HealthStatus = 'healthy' | 'degraded' | 'down' | 'unknown';

interface SystemStatus {
  overall: HealthStatus;
  timestamp: string;
  checks: Record<string, { status: string; latency?: number; message?: string }>;
  metrics: Record<string, unknown>;
  responseTime: number;
}

interface PerfMetrics {
  timestamp: string;
  timeRange: string;
  metrics: {
    totalRequests?: number;
    errorRate?: number;
    avgResponseTime?: number;
    p95ResponseTime?: number;
  };
}

interface RateLimitData {
  limits: Record<string, { used: number; limit: number; resetAt: string }>;
}

interface AuditHealth {
  status: string;
  recentCount?: number;
  failureCount?: number;
  message?: string;
}

const STATUS_ICON = {
  healthy: <CheckCircle className="w-4 h-4 text-green-500" />,
  degraded: <AlertTriangle className="w-4 h-4 text-amber-500" />,
  down: <XCircle className="w-4 h-4 text-red-500" />,
  unknown: <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />,
};

const STATUS_BADGE: Record<string, string> = {
  healthy: 'bg-green-100 text-green-700',
  degraded: 'bg-amber-100 text-amber-700',
  down: 'bg-red-100 text-red-700',
  ok: 'bg-green-100 text-green-700',
  error: 'bg-red-100 text-red-700',
};

export default function MonitoringSetupClient() {
  const [status, setStatus]     = useState<SystemStatus | null>(null);
  const [perf, setPerf]         = useState<PerfMetrics | null>(null);
  const [rateLimits, setRateLimits] = useState<RateLimitData | null>(null);
  const [auditHealth, setAuditHealth] = useState<AuditHealth | null>(null);
  const [loading, setLoading]   = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [s, p, r, a] = await Promise.allSettled([
      fetch('/api/admin/monitoring/status').then(res => res.json()),
      fetch('/api/admin/monitoring/performance').then(res => res.json()),
      fetch('/api/admin/monitoring/rate-limits').then(res => res.json()),
      fetch('/api/admin/monitoring/audit-health').then(res => res.json()),
    ]);
    if (s.status === 'fulfilled') setStatus(s.value);
    if (p.status === 'fulfilled') setPerf(p.value);
    if (r.status === 'fulfilled') setRateLimits(r.value);
    if (a.status === 'fulfilled') setAuditHealth(a.value);
    setLastRefresh(new Date());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const overall = status?.overall ?? 'unknown';

  return (
    <div className="space-y-5">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {STATUS_ICON[overall]}
          <span className={`text-sm font-semibold capitalize px-2.5 py-1 rounded-full ${STATUS_BADGE[overall] ?? 'bg-slate-100 text-slate-600'}`}>
            System {overall}
          </span>
          {lastRefresh && (
            <span className="text-xs text-slate-400">
              Updated {lastRefresh.toLocaleTimeString()}
            </span>
          )}
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50 transition-colors disabled:opacity-50">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* System checks */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <Activity className="w-4 h-4 text-brand-blue-600" />
          <h2 className="font-semibold text-slate-800">System Checks</h2>
          {status?.responseTime && (
            <span className="ml-auto text-xs text-slate-400">{status.responseTime}ms</span>
          )}
        </div>
        {loading && !status ? (
          <div className="flex items-center gap-2 text-slate-400 text-sm px-5 py-6">
            <Loader2 className="w-4 h-4 animate-spin" /> Checking systems…
          </div>
        ) : !status?.checks ? (
          <p className="text-sm text-slate-400 px-5 py-6">Could not load system status</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {Object.entries(status.checks).map(([key, check]) => (
              <div key={key} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-2">
                  {STATUS_ICON[(check.status as HealthStatus) ?? 'unknown']}
                  <span className="text-sm font-medium text-slate-700 capitalize">{key.replace(/_/g, ' ')}</span>
                  {check.message && <span className="text-xs text-slate-400">— {check.message}</span>}
                </div>
                <div className="flex items-center gap-3">
                  {check.latency != null && (
                    <span className="text-xs text-slate-400 tabular-nums">{check.latency}ms</span>
                  )}
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_BADGE[check.status] ?? 'bg-slate-100 text-slate-600'}`}>
                    {check.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Performance metrics */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4 text-brand-blue-600" />
          <h2 className="font-semibold text-slate-800">Performance (Last Hour)</h2>
        </div>
        {loading && !perf ? (
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </div>
        ) : !perf?.metrics ? (
          <p className="text-sm text-slate-400">No performance data</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total Requests', value: perf.metrics.totalRequests?.toLocaleString() ?? '—' },
              { label: 'Error Rate', value: perf.metrics.errorRate != null ? `${(perf.metrics.errorRate * 100).toFixed(1)}%` : '—' },
              { label: 'Avg Response', value: perf.metrics.avgResponseTime != null ? `${perf.metrics.avgResponseTime}ms` : '—' },
              { label: 'p95 Response', value: perf.metrics.p95ResponseTime != null ? `${perf.metrics.p95ResponseTime}ms` : '—' },
            ].map(m => (
              <div key={m.label} className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-500 mb-1">{m.label}</p>
                <p className="text-lg font-bold text-slate-800 tabular-nums">{m.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rate limits */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <Clock className="w-4 h-4 text-brand-blue-600" />
          <h2 className="font-semibold text-slate-800">Rate Limit Usage</h2>
        </div>
        {loading && !rateLimits ? (
          <div className="flex items-center gap-2 text-slate-400 text-sm px-5 py-6">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </div>
        ) : !rateLimits?.limits || Object.keys(rateLimits.limits).length === 0 ? (
          <p className="text-sm text-slate-400 px-5 py-6">No rate limit data available</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {Object.entries(rateLimits.limits).map(([tier, data]) => {
              const pct = data.limit > 0 ? Math.min(100, Math.round((data.used / data.limit) * 100)) : 0;
              return (
                <div key={tier} className="px-5 py-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-slate-700 capitalize">{tier}</span>
                    <span className="text-xs text-slate-500 tabular-nums">{data.used} / {data.limit}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${pct > 80 ? 'bg-red-500' : pct > 50 ? 'bg-amber-500' : 'bg-green-500'}`}
                      style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Audit pipeline health */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-brand-blue-600" />
          <h2 className="font-semibold text-slate-800">Audit Pipeline Health</h2>
        </div>
        {loading && !auditHealth ? (
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </div>
        ) : !auditHealth ? (
          <p className="text-sm text-slate-400">Could not load audit health</p>
        ) : (
          <div className="flex items-start gap-3">
            {STATUS_ICON[(auditHealth.status as HealthStatus) ?? 'unknown']}
            <div>
              <p className={`text-sm font-semibold capitalize ${
                auditHealth.status === 'healthy' || auditHealth.status === 'ok' ? 'text-green-700' :
                auditHealth.status === 'degraded' ? 'text-amber-700' : 'text-red-700'
              }`}>
                {auditHealth.status}
              </p>
              {auditHealth.message && <p className="text-xs text-slate-500 mt-0.5">{auditHealth.message}</p>}
              <div className="flex gap-4 mt-2">
                {auditHealth.recentCount != null && (
                  <span className="text-xs text-slate-600">
                    <span className="font-semibold">{auditHealth.recentCount}</span> recent events
                  </span>
                )}
                {auditHealth.failureCount != null && auditHealth.failureCount > 0 && (
                  <span className="text-xs text-red-600">
                    <span className="font-semibold">{auditHealth.failureCount}</span> failures
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
