'use client';

/**
 * Google Cloud Run services: Marketing, LMS and Admin.
 */

import { useEffect, useState, useCallback } from 'react';
import {
  RefreshCw, CheckCircle, AlertCircle, Circle,
  RotateCcw, ExternalLink, Loader2,
} from 'lucide-react';

interface ServiceHealth {
  ok: boolean;
  latencyMs: number;
  status: number | null;
  commit?: string | null;
}

interface DeploymentInfo {
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
  deployment: DeploymentInfo | null;
  health: ServiceHealth | null;
  running: boolean | null;
  healthy: boolean | null;
  shellProbe?: ShellProbeInfo;
  shellSetupStatus?: string;
  provider?: string;
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
  deployment,
  shellSetupStatus,
  shellProbe,
}: {
  running: boolean | null;
  healthy: boolean | null;
  deployment: DeploymentInfo | null;
  shellSetupStatus?: string;
  shellProbe?: ShellProbeInfo;
}) {
  if (running === null && !deployment) return <span className="text-xs text-slate-400">Unknown</span>;
  if (deployment?.status === 'NOT_FOUND') return <span className="text-xs text-slate-400">Not deployed</span>;
  if (!running && deployment) {
    return <span className="text-xs text-slate-500">Stopped ({deployment.desiredCount} desired)</span>;
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
  const [imageShas, setImageShas] = useState<Record<string, string>>({});
  const [actions, setActions] = useState<ActionState>({});
  const [actionMsg, setActionMsg] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/dev-studio/services');
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
    if (!window.confirm(action === 'build' ? `Build a Google image for ${serviceKey}? This does not deploy.` : `Deploy the specified image for ${serviceKey} on Google Cloud Run?`)) return;
    const confirmation = window.prompt('Type CONFIRM DEPLOY to queue this operation.');
    if (confirmation !== 'CONFIRM DEPLOY') return;
    setActions((prev) => ({ ...prev, [serviceKey + action]: 'loading' }));
    setActionMsg((prev) => ({ ...prev, [serviceKey]: '' }));
    try {
      const res = await fetch('/api/admin/dev-studio/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, service: serviceKey, confirmation, image_sha: imageShas[serviceKey]?.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      setActions((prev) => ({ ...prev, [serviceKey + action]: 'done' }));
      setActionMsg((prev) => ({ ...prev, [serviceKey]: json.message || `${action} queued; verify completion in GitHub Actions` }));
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
    <div className="h-full flex flex-col bg-white text-slate-900 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 shrink-0">
        <div>
          <p className="text-sm font-semibold text-slate-950">Services</p>
          {data && (
            <p className="text-[10px] text-slate-500 mt-0.5">
              {data.cluster} · {new Date(data.fetchedAt).toLocaleTimeString()}
            </p>
          )}
        </div>
        <button onClick={load} disabled={loading} className="p-1.5 rounded hover:bg-slate-100 text-slate-500" title="Refresh">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {error && <p className="text-xs text-red-700">{error}</p>}
        {loading && !data && <p className="text-xs text-slate-500">Loading…</p>}
        {data?.services.map((svc) => (
          <div key={svc.key} className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
              <div className={`w-2 h-2 rounded-full ${COLOR_MAP[svc.color] ?? 'bg-slate-500'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-950">{svc.label}</p>
                  <StatusDot running={svc.running} healthy={svc.healthy} />
                </div>
                <StatusLabel
                  running={svc.running}
                  healthy={svc.healthy}
                  deployment={svc.deployment}
                  shellSetupStatus={svc.shellSetupStatus}
                  shellProbe={svc.shellProbe}
                />
              </div>
              {svc.url && (
                <a href={svc.url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-slate-500 hover:text-slate-950">
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
            {actionMsg[svc.key] && (
              <p className="px-4 py-2 text-[10px] text-amber-400 border-b border-slate-100">{actionMsg[svc.key]}</p>
            )}
            <div className="px-4 pt-3 text-xs text-slate-600">Google Cloud Run · {svc.serviceId}<br />Current revision: {svc.health?.commit || 'unknown'}</div>
            <div className="px-4 pt-3"><label className="text-xs font-semibold">Uploaded image commit SHA<input aria-label={`${svc.label} uploaded image commit SHA`} value={imageShas[svc.key] || ''} onChange={e => setImageShas(prev => ({...prev, [svc.key]: e.target.value}))} placeholder="Full 40-character SHA from a successful image build" className="mt-1 w-full rounded border border-slate-300 p-2 text-xs" /></label></div>
            <div className="flex flex-wrap gap-2 px-4 py-3">
              <button
                onClick={() => doAction(svc.key, 'build')}
                disabled={isLoading(svc.key, 'build')}
                className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-amber-50 text-amber-700 border border-amber-200 disabled:opacity-40"
              >
                {isLoading(svc.key, 'build') ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                Build image
              </button>
              <button
                onClick={() => doAction(svc.key, 'deploy')}
                disabled={isLoading(svc.key, 'deploy') || !/^[a-f0-9]{40}$/.test((imageShas[svc.key] || '').trim())}
                className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-blue-50 text-blue-700 border border-blue-200 disabled:opacity-40"
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
