'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertCircle, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import type { PreviewTarget } from './ColoredLivePreviewFrame';

type SiteStatusState = 'healthy' | 'degraded' | 'down' | null;

async function checkSite(url: string): Promise<{ state: SiteStatusState; latencyMs: number }> {
  const start = Date.now();
  try {
    const res = await fetch(`/api/admin/site-health?url=${encodeURIComponent(url)}`, { cache: 'no-store' });
    if (!res.ok) return { state: 'down', latencyMs: Date.now() - start };
    const data = await res.json();
    const latencyMs = data.latencyMs ?? Date.now() - start;
    if (!data.ok) return { state: 'down', latencyMs };
    if (data.degraded) return { state: 'degraded', latencyMs };
    return { state: latencyMs > 2000 ? 'degraded' : 'healthy', latencyMs };
  } catch {
    return { state: 'down', latencyMs: Date.now() - start };
  }
}

/** Optional health row under preview chips — only thing SitePreviewPanel had that preview frame lacked. */
export function SiteHealthStrip({ targets }: { targets: PreviewTarget[] }) {
  const [statuses, setStatuses] = useState<Record<string, { state: SiteStatusState; latencyMs: number }>>({});
  const [checking, setChecking] = useState(false);
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);

  async function runChecks() {
    setChecking(true);
    const results = await Promise.all(
      targets.map((t) => checkSite(t.url).then((r) => ({ url: t.url, ...r }))),
    );
    setStatuses(Object.fromEntries(results.map((r) => [r.url, { state: r.state, latencyMs: r.latencyMs }])));
    setCheckedAt(new Date());
    setChecking(false);
  }

  return (
    <div className="shrink-0 border-b border-slate-100 bg-slate-50/80 px-2 py-2">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Site health</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={runChecks}
            disabled={checking}
            className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 hover:text-slate-900 disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${checking ? 'animate-spin' : ''}`} />
            Check
          </button>
          <Link href="/monitoring" className="text-[10px] font-semibold text-brand-blue-600 hover:underline">
            Monitoring →
          </Link>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {targets.map((t) => {
          const s = statuses[t.url];
          return (
            <div
              key={t.url}
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-2 py-0.5 text-[10px] ring-1 ring-slate-200"
              title={t.url}
            >
              {s?.state === 'healthy' ? (
                <CheckCircle className="h-3 w-3 text-brand-green-500" />
              ) : s?.state === 'degraded' ? (
                <AlertCircle className="h-3 w-3 text-amber-500" />
              ) : s?.state === 'down' ? (
                <AlertCircle className="h-3 w-3 text-red-500" />
              ) : (
                <Clock className="h-3 w-3 text-slate-300" />
              )}
              <span className="font-medium text-slate-700">{t.label}</span>
              {s?.state && (
                <span className="text-slate-500">
                  {s.state === 'healthy' ? `${s.latencyMs}ms` : s.state}
                </span>
              )}
            </div>
          );
        })}
      </div>
      {checkedAt && (
        <p className="mt-1 text-[10px] text-slate-400">Checked {checkedAt.toLocaleTimeString()}</p>
      )}
    </div>
  );
}
