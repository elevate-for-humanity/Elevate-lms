'use client';

import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, CheckCircle, AlertCircle, Clock, Server, Cpu } from 'lucide-react';

interface PlatformService {
  name: string;
  status: string;
  runningCount: number;
  desiredCount: number;
  pendingCount: number;
  deployBranch?: string;
  taskDefinition?: string;
  lastDeployedAt: string | null;
  healthy: boolean;
  reason?: string;
}

interface PlatformStatusData {
  cluster: string;
  services: PlatformService[];
  fetchedAt: string;
}

const TASK_CONFIG: Record<string, { cpu: string; memory: string; port: number }> = {
  'elevate-lms': { cpu: 'Northflank', memory: 'configured', port: 8080 },
  'elevate-admin': { cpu: 'Northflank', memory: 'configured', port: 8080 },
};

function StatusBadge({ healthy, status }: { healthy: boolean; status: string }) {
  if (status === 'NOT_FOUND') {
    return (
      <span className="flex items-center gap-1 text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
        <AlertCircle className="w-3 h-3" /> Not found
      </span>
    );
  }
  if (healthy) {
    return (
      <span className="flex items-center gap-1 text-xs text-brand-green-700 bg-brand-green-50 px-2 py-0.5 rounded-full">
        <CheckCircle className="w-3 h-3" /> Healthy
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-xs text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
      <AlertCircle className="w-3 h-3" /> {status}
    </span>
  );
}

function ServiceCard({ svc }: { svc: PlatformService }) {
  const cfg = TASK_CONFIG[svc.name];
  const label = svc.name === 'elevate-lms' ? 'LMS' : 'Admin';
  const deployedAt = svc.lastDeployedAt
    ? new Date(svc.lastDeployedAt).toLocaleString('en-US', {
        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
        timeZone: 'America/Indiana/Indianapolis',
      }) + ' ET'
    : null;

  return (
    <div className={`rounded-xl border p-4 ${svc.healthy ? 'border-brand-green-200 bg-brand-green-50/40' : 'border-red-200 bg-red-50/40'}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-slate-500" />
          <span className="font-semibold text-slate-800 text-sm">{label}</span>
          <span className="text-xs text-slate-400 font-mono">{svc.name}</span>
        </div>
        <StatusBadge healthy={svc.healthy} status={svc.status} />
      </div>

      {svc.reason && (
        <p className="text-xs text-red-600 mb-3 bg-red-50 px-2 py-1 rounded">{svc.reason}</p>
      )}

      <div className="grid grid-cols-3 gap-3 mb-3">
        <Stat label="Running" value={String(svc.runningCount)} highlight={svc.runningCount > 0} />
        <Stat label="Desired" value={String(svc.desiredCount)} />
        <Stat label="Pending" value={String(svc.pendingCount)} warn={svc.pendingCount > 0} />
      </div>

      <div className="space-y-1.5 text-xs text-slate-600">
        {cfg && (
          <div className="flex items-center gap-1.5">
            <Cpu className="w-3 h-3 text-slate-400" />
            <span>{cfg.cpu} · {cfg.memory} · port {cfg.port}</span>
          </div>
        )}
        {(svc.deployBranch ?? svc.taskDefinition) && (
          <div className="flex items-center gap-1.5 font-mono text-slate-400 truncate">
            <span className="shrink-0">Branch:</span>
            <span className="truncate">{svc.deployBranch ?? svc.taskDefinition}</span>
          </div>
        )}
        {deployedAt && (
          <div className="flex items-center gap-1.5 text-slate-400">
            <Clock className="w-3 h-3" />
            <span>Last deployed {deployedAt}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, highlight, warn }: { label: string; value: string; highlight?: boolean; warn?: boolean }) {
  return (
    <div className="text-center">
      <div className={`text-xl font-bold ${highlight ? 'text-brand-green-700' : warn ? 'text-amber-600' : 'text-slate-700'}`}>
        {value}
      </div>
      <div className="text-[10px] text-slate-400 uppercase tracking-wide">{label}</div>
    </div>
  );
}

export default function NorthflankStatusPanel() {
  const [data, setData] = useState<PlatformStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/devstudio/northflank-status');
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error((d as { error?: string }).error ?? `HTTP ${res.status}`);
      }
      setData(await res.json());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const fetchedAt = data?.fetchedAt
    ? new Date(data.fetchedAt).toLocaleTimeString('en-US', {
        hour: 'numeric', minute: '2-digit', second: '2-digit',
        timeZone: 'America/Indiana/Indianapolis',
      }) + ' ET'
    : null;

  return (
    <div className="flex flex-col h-full bg-white overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-slate-500" />
          <span className="font-semibold text-sm text-slate-700">Northflank Services</span>
        </div>
        <div className="flex items-center gap-3">
          {fetchedAt && <span className="text-xs text-slate-400">Updated {fetchedAt}</span>}
          <button
            onClick={load}
            disabled={loading}
            className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-40 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="flex-1 p-4">
        {loading && !data && (
          <div className="flex items-center justify-center h-40 text-slate-400 text-sm gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" /> Fetching Northflank status…
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Could not reach Northflank</p>
              <p className="text-xs mt-1 text-red-500">{error}</p>
              <p className="text-xs mt-2 text-red-400">
                Requires NORTHFLANK_API_TOKEN and NORTHFLANK_PROJECT_ID.
              </p>
            </div>
          </div>
        )}

        {data && (
          <div className="space-y-4">
            {/* Summary strip */}
            <div className="flex items-center gap-4 text-xs text-slate-500 pb-2 border-b border-slate-100">
              <span className="font-mono text-slate-400">project: {data.cluster}</span>
              <span className="ml-auto">
                {data.services.filter((s) => s.healthy).length}/{data.services.length} healthy
              </span>
            </div>

            {data.services.map((svc) => (
              <ServiceCard key={svc.name} svc={svc} />
            ))}

            {data.services.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-8">No services found in cluster.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
