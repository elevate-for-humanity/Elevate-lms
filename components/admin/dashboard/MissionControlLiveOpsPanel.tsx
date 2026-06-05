'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Activity, AlertTriangle, Clock, RefreshCw, ArrowRight } from 'lucide-react';

type LiveOpsSummary = {
  activeClockIns?: number;
  unresolvedAlerts?: number;
  lessonCompletions24h?: number;
  adminAlertCount?: number;
};

type PlatformAlert = {
  id: string;
  severity: string;
  message: string | null;
  created_at: string;
};

/**
 * Live ops strip formerly only on /admin/dashboard — embedded in unified dashboard.
 */
export function MissionControlLiveOpsPanel() {
  const [summary, setSummary] = useState<LiveOpsSummary | null>(null);
  const [alerts, setAlerts] = useState<PlatformAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/mission-control/live-ops', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setSummary(data.summary ?? null);
        setAlerts((data.alerts ?? []).slice(0, 5));
      }
    } catch {
      setSummary(null);
      setAlerts([]);
    } finally {
      setLoading(false);
      setLastRefresh(new Date());
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [load]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden mb-6">
      <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-slate-500" />
          <h2 className="font-bold text-slate-900">Live operations</h2>
          {lastRefresh && (
            <span className="text-xs text-slate-400">
              Updated {lastRefresh.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link
            href="/admin/at-risk"
            className="text-xs font-semibold text-brand-blue-600 hover:underline flex items-center gap-1"
          >
            Mission details
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-slate-100">
        {[
          { label: 'Active clock-ins', value: summary?.activeClockIns ?? '—', icon: Clock },
          { label: 'Open alerts', value: summary?.unresolvedAlerts ?? '—', icon: AlertTriangle, urgent: (summary?.unresolvedAlerts ?? 0) > 0 },
          { label: 'Lessons (24h)', value: summary?.lessonCompletions24h ?? '—', icon: Activity },
          { label: 'Admin signals', value: summary?.adminAlertCount ?? '—', icon: AlertTriangle },
        ].map(({ label, value, icon: Icon, urgent }) => (
          <div
            key={label}
            className={`bg-white px-4 py-3 ${urgent ? 'bg-amber-50' : ''}`}
          >
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
              <Icon className="w-3.5 h-3.5" />
              {label}
            </div>
            <p className={`text-xl font-black tabular-nums ${urgent ? 'text-amber-800' : 'text-slate-900'}`}>
              {loading ? '…' : value}
            </p>
          </div>
        ))}
      </div>

      {alerts.length > 0 && (
        <div className="divide-y divide-slate-100 border-t border-slate-100">
          {alerts.map((a) => (
            <div key={a.id} className="px-4 sm:px-6 py-2.5 flex items-start gap-2 text-sm">
              <span
                className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                  a.severity === 'critical' ? 'bg-rose-500' : 'bg-amber-400'
                }`}
              />
              <div className="min-w-0">
                <p className="text-slate-800 line-clamp-2">{a.message ?? a.id}</p>
                <p className="text-xs text-slate-400">{new Date(a.created_at).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
