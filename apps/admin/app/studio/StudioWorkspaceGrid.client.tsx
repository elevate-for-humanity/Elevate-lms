'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Activity, ArrowRight, RefreshCw, Search } from 'lucide-react';

type Workspace = {
  id: string;
  label: string;
  description: string;
  route: string;
  healthEndpoint: string;
};

type HealthState = 'not checked' | 'checking' | 'healthy' | 'degraded' | 'unavailable';

const HEALTH_CONCURRENCY = 2;
const HEALTH_TIMEOUT_MS = 5000;

const healthPresentation: Record<HealthState, { label: string; className: string }> = {
  'not checked': { label: 'Not checked', className: 'border-gray-200 bg-gray-50 text-gray-600' },
  checking: { label: 'Checking', className: 'border-blue-200 bg-blue-50 text-blue-700' },
  healthy: { label: 'Healthy', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  degraded: { label: 'Degraded', className: 'border-amber-200 bg-amber-50 text-amber-800' },
  unavailable: { label: 'Unavailable', className: 'border-red-200 bg-red-50 text-red-700' },
};

export default function StudioWorkspaceGrid({ workspaces }: { workspaces: Workspace[] }) {
  const [health, setHealth] = useState<Record<string, HealthState>>(() =>
    Object.fromEntries(workspaces.map((workspace) => [workspace.id, 'not checked'])),
  );
  const [refreshToken, setRefreshToken] = useState(0);
  const [query, setQuery] = useState('');

  const filteredWorkspaces = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return workspaces;
    return workspaces.filter((workspace) =>
      [workspace.label, workspace.description, workspace.route].some((value) => value.toLowerCase().includes(normalized)),
    );
  }, [query, workspaces]);

  useEffect(() => {
    // Capability checks are intentionally user-triggered. Automatically issuing
    // one authenticated request per workspace made every Studio visit fan out
    // into dozens of Supabase auth and table queries, which could destabilize the
    // single Admin container during cold starts and deployment rollovers.
    if (refreshToken === 0) return;

    let cancelled = false;
    setHealth(Object.fromEntries(workspaces.map((workspace) => [workspace.id, 'checking'])));

    async function checkWorkspace(workspace: Workspace) {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);

      try {
        const response = await fetch(workspace.healthEndpoint, {
          cache: 'no-store',
          signal: controller.signal,
        });

        const body = await response.json().catch(() => ({}));
        const reported = typeof body?.status === 'string' ? body.status : '';
        const state: HealthState =
          response.ok && (reported === 'healthy' || reported === 'available')
            ? 'healthy'
            : response.ok && reported === 'degraded'
              ? 'degraded'
              : 'unavailable';

        if (!cancelled) {
          setHealth((current) => ({ ...current, [workspace.id]: state }));
        }
      } catch {
        if (!cancelled) {
          setHealth((current) => ({ ...current, [workspace.id]: 'unavailable' }));
        }
      } finally {
        window.clearTimeout(timeout);
      }
    }

    async function runChecks() {
      for (let index = 0; index < workspaces.length; index += HEALTH_CONCURRENCY) {
        if (cancelled) return;
        const batch = workspaces.slice(index, index + HEALTH_CONCURRENCY);
        await Promise.all(batch.map(checkWorkspace));
      }
    }

    void runChecks();

    return () => {
      cancelled = true;
    };
  }, [workspaces, refreshToken]);

  const isChecking = Object.values(health).some((state) => state === 'checking');

  return (
    <section aria-labelledby="studio-capabilities-heading" className="space-y-5">
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 id="studio-capabilities-heading" className="text-base font-semibold text-gray-950">
              Workspace capabilities
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Search the canonical Studio registry, open a workspace, or run controlled runtime health checks.
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
            <label className="relative block w-full sm:w-80">
              <span className="sr-only">Search Studio workspaces</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search workspaces"
                className="h-10 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm text-gray-950 outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
              />
            </label>
            <button
              type="button"
              onClick={() => setRefreshToken((value) => value + 1)}
              disabled={isChecking}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50 disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2"
            >
              <RefreshCw className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} aria-hidden="true" />
              {isChecking ? 'Checking' : 'Check health'}
            </button>
          </div>
        </div>
      </div>

      {filteredWorkspaces.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
          <p className="text-sm font-medium text-gray-800">No workspaces match “{query}”.</p>
          <button type="button" onClick={() => setQuery('')} className="mt-2 text-sm font-semibold text-gray-700 underline underline-offset-4">
            Clear search
          </button>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filteredWorkspaces.map((workspace) => {
            const state = health[workspace.id] ?? 'not checked';
            const presentation = healthPresentation[state];
            return (
              <Link
                key={workspace.id}
                href={workspace.route}
                className="group flex min-h-48 flex-col justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2"
              >
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-base font-semibold text-gray-950">{workspace.label}</h3>
                    <ArrowRight className="h-4 w-4 shrink-0 text-gray-400 transition group-hover:translate-x-0.5 group-hover:text-gray-800" aria-hidden="true" />
                  </div>
                  <p className="mt-2 text-sm leading-6 text-gray-600">{workspace.description}</p>
                </div>

                <div className="mt-5 flex items-center justify-between gap-3 border-t border-gray-100 pt-4 text-xs">
                  <span className="truncate font-mono text-gray-500">{workspace.route}</span>
                  <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-1 font-medium ${presentation.className}`}>
                    <Activity className="h-3.5 w-3.5" aria-hidden="true" />
                    {presentation.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
