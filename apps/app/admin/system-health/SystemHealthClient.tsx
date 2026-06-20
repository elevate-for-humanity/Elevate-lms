'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Activity, AlertTriangle, Bot, CheckCircle, Clock,
  Database, Mail, RefreshCw, Server, Shield, Wifi, XCircle, Zap,
} from 'lucide-react';
import type { PlatformHealthSnapshot, ServiceCheck } from '@/lib/platform/platform-health';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusColor(s: string) {
  if (s === 'healthy') return 'text-green-400';
  if (s === 'degraded') return 'text-amber-400';
  if (s === 'down')     return 'text-red-400';
  return 'text-slate-500';
}

function statusBg(s: string) {
  if (s === 'healthy') return 'bg-green-950/40 border-green-800';
  if (s === 'degraded') return 'bg-amber-950/40 border-amber-800';
  if (s === 'down')     return 'bg-red-950/40 border-red-800';
  return 'bg-slate-800/40 border-slate-700';
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === 'healthy'  ? 'bg-green-400' :
    status === 'degraded' ? 'bg-amber-400' :
    status === 'down'     ? 'bg-red-400'   : 'bg-slate-600';
  return <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${color}`} />;
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60)  return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60)  return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

// ─── Service card ─────────────────────────────────────────────────────────────

const SERVICE_ICONS: Record<string, React.ElementType> = {
  Database: Database,
  Redis:    Zap,
  Stripe:   Shield,
  'Email (SendGrid)': Mail,
  'Storage (Supabase)': Server,
};

function ServiceCard({ check }: { check: ServiceCheck }) {
  const Icon = SERVICE_ICONS[check.name] ?? Wifi;
  return (
    <div className={`rounded-xl border p-4 ${statusBg(check.status)}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center bg-slate-900/60`}>
          <Icon className={`w-4 h-4 ${statusColor(check.status)}`} />
        </div>
        <div className="flex items-center gap-1.5">
          <StatusDot status={check.status} />
          <span className={`text-xs font-medium capitalize ${statusColor(check.status)}`}>
            {check.status}
          </span>
        </div>
      </div>
      <p className="text-white text-sm font-semibold">{check.name}</p>
      {check.latencyMs !== undefined && (
        <p className="text-slate-400 text-xs mt-1">{check.latencyMs}ms</p>
      )}
      {check.message && (
        <p className="text-slate-500 text-xs mt-1 truncate">{check.message}</p>
      )}
      {!check.configured && (
        <p className="text-slate-500 text-xs mt-1">Not configured</p>
      )}
    </div>
  );
}

// ─── Alert row ────────────────────────────────────────────────────────────────

function AlertRow({ alert }: { alert: PlatformHealthSnapshot['alerts'][number] }) {
  const Icon = alert.severity === 'critical' ? XCircle :
               alert.severity === 'warning'  ? AlertTriangle : Activity;
  const color = alert.severity === 'critical' ? 'text-red-400 border-red-800 bg-red-950/30' :
                alert.severity === 'warning'  ? 'text-amber-400 border-amber-800 bg-amber-950/30' :
                                                'text-blue-400 border-blue-800 bg-blue-950/30';
  return (
    <div className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${color}`}>
      <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <div className="min-w-0">
        <span className="text-xs font-semibold uppercase tracking-wide opacity-70">{alert.service}</span>
        <p className="text-sm mt-0.5">{alert.message}</p>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SystemHealthClient({
  initialSnapshot,
}: {
  initialSnapshot: PlatformHealthSnapshot;
}) {
  const [snap, setSnap]           = useState<PlatformHealthSnapshot>(initialSnapshot);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/admin/platform-health');
      if (res.ok) setSnap(await res.json());
    } finally {
      setRefreshing(false);
    }
  }, []);

  // 30s auto-refresh
  useEffect(() => {
    const id = setInterval(refresh, 30_000);
    return () => clearInterval(id);
  }, [refresh]);

  const services = Object.values(snap.services);
  const overallBg =
    snap.overall === 'healthy'  ? 'bg-green-950/40 border-green-800' :
    snap.overall === 'degraded' ? 'bg-amber-950/40 border-amber-800' :
                                  'bg-red-950/40 border-red-800';
  const OverallIcon =
    snap.overall === 'healthy' ? CheckCircle :
    snap.overall === 'degraded' ? AlertTriangle : XCircle;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">System Health</h1>
          <p className="text-slate-400 text-sm mt-0.5 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {formatRelative(snap.timestamp)} · {snap.responseTimeMs}ms
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 text-sm transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Overall status banner */}
      <div className={`rounded-xl border p-4 flex items-center gap-3 ${overallBg}`}>
        <OverallIcon className={`w-5 h-5 flex-shrink-0 ${statusColor(snap.overall)}`} />
        <div>
          <p className={`font-semibold ${statusColor(snap.overall)}`}>
            {snap.overall === 'healthy'  ? 'All Systems Operational' :
             snap.overall === 'degraded' ? 'Platform Degraded'       : 'Platform Down'}
          </p>
          <p className="text-slate-400 text-xs mt-0.5">
            {snap.alerts.length === 0
              ? 'No active alerts'
              : `${snap.alerts.length} active alert${snap.alerts.length !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {/* Active alerts */}
      {snap.alerts.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Active Alerts</h2>
          {snap.alerts.map((a, i) => <AlertRow key={i} alert={a} />)}
        </div>
      )}

      {/* Service grid */}
      <div>
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">Services</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {services.map(svc => <ServiceCard key={svc.name} check={svc} />)}
        </div>
      </div>

      {/* AI providers */}
      <div>
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">AI Providers</h2>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {snap.ai.providers.map(p => (
              <div key={p.name} className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${p.configured ? 'bg-green-950/50' : 'bg-slate-800'}`}>
                  <Bot className={`w-4 h-4 ${p.configured ? 'text-green-400' : 'text-slate-600'}`} />
                </div>
                <div>
                  <p className="text-white text-sm capitalize">{p.name}</p>
                  <p className={`text-xs ${p.configured ? (p.active ? 'text-green-400' : 'text-slate-400') : 'text-slate-600'}`}>
                    {p.configured ? (p.active ? 'Active' : 'Configured') : 'Not set'}
                  </p>
                </div>
              </div>
            ))}
          </div>
          {!snap.ai.anyConfigured && (
            <p className="text-red-400 text-sm mt-3">
              ⚠ No AI provider configured — all AI features offline
            </p>
          )}
        </div>
      </div>

    </div>
  );
}
