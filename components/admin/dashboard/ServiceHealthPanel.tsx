'use client';

import { useEffect, useState } from 'react';
import { Activity, RefreshCw, AlertTriangle, XCircle } from 'lucide-react';

type HealthStatus = 'healthy' | 'degraded' | 'down';

interface ServiceCheck {
  name: string;
  status: HealthStatus;
  latencyMs: number | null;
  detail: string;
}

interface HealthSnapshot {
  overallStatus: HealthStatus;
  checkedAt: string;
  services: ServiceCheck[];
}

const STATUS_CONFIG: Record<HealthStatus, { icon: React.ReactNode; badge: string; dot: string }> = {
  healthy: {
    icon: <span className="w-3.5 h-3.5 rounded-full bg-brand-green-500 inline-block flex-shrink-0" aria-hidden="true" />,
    badge: 'bg-brand-green-100 text-brand-green-700',
    dot: 'bg-brand-green-500',
  },
  degraded: {
    icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />,
    badge: 'bg-amber-100 text-amber-700',
    dot: 'bg-amber-500',
  },
  down: {
    icon: <XCircle className="w-3.5 h-3.5 text-red-500" />,
    badge: 'bg-red-100 text-red-700',
    dot: 'bg-red-500',
  },
};

export function ServiceHealthPanel() {
  const [snapshot, setSnapshot] = useState<HealthSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchHealth() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/service-health', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSnapshot(await res.json());
    } catch (e) {
      setError('Could not reach service health endpoint');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchHealth(); }, []);

  const overall = snapshot?.overallStatus ?? null;
  const overallCfg = overall ? STATUS_CONFIG[overall] : null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-semibold text-slate-800">Service Health</span>
          {overallCfg && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${overallCfg.badge}`}>
              {overall}
            </span>
          )}
        </div>
        <button
          onClick={fetchHealth}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Checking…' : 'Refresh'}
        </button>
      </div>

      {error ? (
        <div className="px-5 py-4 text-sm text-red-600">{error}</div>
      ) : !snapshot ? (
        <div className="divide-y divide-slate-100">
          {['Supabase Database', 'Supabase Config', 'SendGrid', 'Stripe', 'Redis / Queue', 'Resend (inbound)', 'AI Provider'].map((name) => (
            <div key={name} className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-slate-200 animate-pulse" />
                <span className="text-sm text-slate-500">{name}</span>
              </div>
              <span className="text-xs text-slate-400">—</span>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="divide-y divide-slate-100">
            {snapshot.services.map((svc) => {
              const cfg = STATUS_CONFIG[svc.status];
              return (
                <div key={svc.name} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                    <span className="text-sm text-slate-800 truncate">{svc.name}</span>
                    {svc.detail && svc.status !== 'healthy' && (
                      <span className="text-xs text-slate-400 truncate hidden sm:block">{svc.detail}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    {svc.latencyMs !== null && (
                      <span className="text-xs text-slate-400">{svc.latencyMs}ms</span>
                    )}
                    {cfg.icon}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="px-5 py-2.5 border-t border-slate-100 bg-slate-50">
            <p className="text-xs text-slate-400">
              Checked {new Date(snapshot.checkedAt).toLocaleTimeString()}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
