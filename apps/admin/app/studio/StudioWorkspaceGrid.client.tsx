'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Activity, ArrowRight, RefreshCw } from 'lucide-react';

type Workspace = {
  id: string;
  label: string;
  description: string;
  route: string;
  healthEndpoint: string;
};

type HealthState = 'checking' | 'healthy' | 'degraded' | 'unavailable';

export default function StudioWorkspaceGrid({ workspaces }: { workspaces: Workspace[] }) {
  const [health, setHealth] = useState<Record<string, HealthState>>({});
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setHealth(Object.fromEntries(workspaces.map((workspace) => [workspace.id, 'checking'])));

    void Promise.all(
      workspaces.map(async (workspace) => {
        try {
          const response = await fetch(workspace.healthEndpoint, { cache: 'no-store' });
          const body = await response.json().catch(() => ({}));
          const reported = typeof body?.status === 'string' ? body.status : '';
          const state: HealthState =
            response.ok && (reported === 'healthy' || reported === 'available')
              ? 'healthy'
              : response.ok
                ? 'degraded'
                : 'unavailable';
          if (!cancelled) setHealth((current) => ({ ...current, [workspace.id]: state }));
        } catch {
          if (!cancelled) setHealth((current) => ({ ...current, [workspace.id]: 'unavailable' }));
        }
      }),
    );

    return () => {
      cancelled = true;
    };
  }, [workspaces, refreshToken]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">Admin-owned Studio capabilities</p>
          <p className="mt-1 text-xs text-slate-500">Each workspace opens its canonical route and reports its own runtime health.</p>
        </div>
        <button
          type="button"
          onClick={() => setRefreshToken((value) => value + 1)}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh health
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {workspaces.map((workspace) => {
          const state = health[workspace.id] ?? 'checking';
          return (
            <Link
              key={workspace.id}
              href={workspace.route}
              className="group rounded-2xl border border-slate-800 bg-slate-900/80 p-5 transition hover:border-slate-600 hover:bg-slate-900"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-white">{workspace.label}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{workspace.description}</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-white" />
              </div>
              <div className="mt-4 flex items-center justify-between gap-3 text-xs">
                <span className="truncate font-mono text-slate-500">{workspace.route}</span>
                <span className="inline-flex shrink-0 items-center gap-1.5 text-slate-300">
                  <Activity className="h-3.5 w-3.5" />
                  {state}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
