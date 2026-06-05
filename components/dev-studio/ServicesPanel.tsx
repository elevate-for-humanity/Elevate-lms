'use client';

/**
 * Northflank services: LMS and Admin.
 */

import { useEffect, useState, useCallback } from 'react';
import {
  RefreshCw, CheckCircle, AlertCircle, Circle, Play, Square,
  RotateCcw, ExternalLink, Loader2, Clock,
} from 'lucide-react';

interface ServiceHealth {
  ok: boolean;
  latencyMs: number;
  status: number | null;
}

interface NorthflankDeploymentInfo {
  runningCount: number;
  desiredCount: number;
  status: string;
  lastDeployedAt: string | null;
  deployBranch: string;
  pendingCount?: number;
}

interface ShellProbeInfo {
  reachable: boolean;
  ready: boolean;
  status: string;
  setupStatus?: string;
}

interface Service {
  key: string;
  label: string;
  serviceId: string;
  url: string | null;
  color: string;
  northflank: NorthflankDeploymentInfo | null;
  health: ServiceHealth | null;
  running: boolean | null;
  healthy: boolean | null;
  shellProbe?: ShellProbeInfo;
  shellSetupStatus?: string;
  hasNorthflank?: boolean;
}

interface ServicesData {
  services: Service[];
  cluster: string;
  fetchedAt: string;
}

type ActionState = Record<string, 'idle' | 'loading' | 'done' | 'error'>;

const COLOR_MAP: Record<string, string> = {
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
  green: 'bg-brand-green-500',
};

function StatusDot({ running, healthy }: { running: boolean | null; healthy: boolean | null }) {
  if (running === null) return <Circle className="w-3 h-3 text-slate-300" />;
  if (!running) return <Circle className="w-3 h-3 text-slate-400" />;
  if (healthy === true) return <CheckCircle className="w-3 h-3 text-brand-green-500" />;
  if (healthy === false) return <AlertCircle className="w-3 h-3 text-amber-500" />;
  return <Circle className="w-3 h-3 text-slate-400" />;
}

function StatusLabel({
  running,
  healthy,
  northflank,
  shellSetupStatus,
  shellProbe,
}: {
  running: boolean | null;
  healthy: boolean | null;
  northflank: NorthflankDeploymentInfo | null;
  shellSetupStatus?: string;
  shellProbe?: ShellProbeInfo;
}) {
  if (running === null && !northflank) return <span className="text-xs text-slate-400">Unknown</span>;
  if (northflank?.status === 'NOT_FOUND') return <span className="text-xs text-slate-400">Not deployed</span>;
  if (!running && northflank) {
    return <span className="text-xs text-slate-500">Stopped ({northflank.desiredCount} desired)</span>;
  }
  if (running && healthy === true) return <span className="text-xs text-brand-green-600">Running · ready</span>;
  if (running && healthy === false) {
    const detail = shellSetupStatus || shellProbe?.setupStatus || shellProbe?.status;
    return (
      <span className="text-xs text-amber-600">
        Running · {detail ?? 'starting — deploy new runtime image if stuck'}
      </span>
    );
  }
  if (running) return <span className="text-xs text-brand-green-600">Running</span>;
  return <span className="text-xs text-slate-400">Stopped</span>;
}

export default function ServicesPanel() {
  const [data, setData] = useState<ServicesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actions, setActions] = useState<ActionState>({});
  const [actionMsg, setActionMsg] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/devstudio/services');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load services');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function doAction(serviceKey: string, action: string) {
    setActions((prev) => ({ ...prev, [serviceKey + action]: 'loading' }));
    setActionMsg((prev) => ({ ...prev, [serviceKey]: '' }));
    try {
      const res = await fetch('/api/devstudio/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, service: serviceKey }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      setActions((prev) => ({ ...prev, [serviceKey + action]: 'done' }));
      setActionMsg((prev) => ({ ...prev, [serviceKey]: `${action} triggered — new image rolls out on deploy/restart` }));
      setTimeout(load, 5000);
    } catch (e) {
      setActions((prev) => ({ ...prev, [serviceKey + action]: 'error' }));
      setActionMsg((prev) => ({ ...prev, [serviceKey]: e instanceof Error ? e.message : 'Action failed' }));
    }
  }

  function isLoading(serviceKey: string, action: string) {
    return actions[serviceKey + action] === 'loading';
  }

  return (
    <div className="h-full flex flex-col bg-[#0d1117] text-slate-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
        <div>
          <p className="text-sm font-semibold text-white">Services</p>
          {data && (
            <p className="text-[10px] text-slate-500 mt-0.5">
              {data.cluster} · {new Date(data.fetchedAt).toLocaleTimeString()}
            </p>
          )}
        </div>
        <button onClick={load} disabled={loading} className="p-1.5 rounded hover:bg-white/10 text-slate-400" title="Refresh">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {error && <p className="text-xs text-red-400">{error}</p>}
        {loading && !data && <p className="text-xs text-slate-500">Loading…</p>}
        {data?.services.map((svc) => (
          <div key={svc.key} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
              <div className={`w-2 h-2 rounded-full ${COLOR_MAP[svc.color] ?? 'bg-slate-500'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-white">{svc.label}</p>
                  <StatusDot running={svc.running} healthy={svc.healthy} />
                </div>
                <StatusLabel
                  running={svc.running}
                  healthy={svc.healthy}
                  northflank={svc.northflank}
                  shellSetupStatus={svc.shellSetupStatus}
                  shellProbe={svc.shellProbe}
                />
              </div>
              {svc.url && (
                <a href={svc.url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-slate-500 hover:text-white">
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
            {actionMsg[svc.key] && (
              <p className="px-4 py-2 text-[10px] text-amber-400 border-b border-white/5">{actionMsg[svc.key]}</p>
            )}
            <div className="flex flex-wrap gap-2 px-4 py-3">
              <button
                onClick={() => doAction(svc.key, 'restart')}
                disabled={isLoading(svc.key, 'restart')}
                className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-amber-600/20 text-amber-400 disabled:opacity-40"
              >
                {isLoading(svc.key, 'restart') ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                Restart build
              </button>
              <button
                onClick={() => doAction(svc.key, 'deploy')}
                disabled={isLoading(svc.key, 'deploy')}
                className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-blue-600/20 text-blue-400 disabled:opacity-40"
              >
                {isLoading(svc.key, 'deploy') ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                Deploy
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
