'use client';

import { useCallback, useEffect, useState } from 'react';
import { Activity, AlertTriangle, ExternalLink, Loader2, RefreshCw, Server } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

const ServicesPanel = dynamic(
  () => import('@/components/studio/ServicesPanel').then((m) => m.default || m),
  { ssr: false },
);

type HealthPayload = Record<string, unknown> & {
  probes?: Partial<Record<'ai' | 'cloudflare' | 'github', { status: 'completed' | 'timed_out' | 'unavailable'; checkedAt?: string }>>;
  githubAuthError?: string | null;
  hasElevate?: boolean;
  hasCloudflare?: boolean;
  hasGroq?: boolean;
  hasXAI?: boolean;
  hasGemini?: boolean;
  hasOpenAI?: boolean;
  hasAnthropic?: boolean;
  hasGitHub?: boolean;
  githubTokenValid?: boolean;
  supabaseUrlPresent?: boolean;
  supabaseServiceKeyPresent?: boolean;
  execution?: {
    mode?: string;
    ready?: boolean;
    repositoryWritesReady?: boolean | null;
    legacyShellRemoved?: boolean;
    status?: string;
  };
  google?: { ready?: boolean; project?: string; deploymentDispatchReady?: boolean | null };
};

function flag(ok: boolean | undefined) {
  return ok === undefined ? 'not reported' : ok ? 'configured' : 'missing';
}

function operationStatus(ready?: boolean | null) {
  if (ready === true) return 'verified';
  if (ready === false) return 'repository access unavailable';
  return 'not tested by this check';
}

function incompleteProbe(status?: string) {
  if (status === 'timed_out') return 'not verified — check timed out';
  if (status === 'unavailable') return 'not verified — check unavailable';
  return null;
}

export default function DevStudioHealthPanel() {
  const [health, setHealth] = useState<HealthPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/dev-studio/health', {
        signal: AbortSignal.timeout(15000),
        cache: 'no-store',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`);
      setHealth(data as HealthPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Health check failed');
      setHealth(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const aiUnknown = incompleteProbe(health?.probes?.ai?.status);
  const githubUnknown = incompleteProbe(health?.probes?.github?.status);
  const incomplete = health?.probes && Object.entries(health.probes).filter(([, probe]) => probe?.status !== 'completed');
  const rows = health
    ? [
        [
          'Container GitHub token',
          githubUnknown ?? (health.githubAuthError ? `not verified (${health.githubAuthError})` : health.hasGitHub === undefined
            ? 'not reported'
            : !health.hasGitHub
              ? 'missing'
              : health.githubTokenValid === undefined
                ? 'not verified'
                : health.githubTokenValid
                  ? 'valid'
                  : 'invalid'),
        ],
        ['Groq', aiUnknown ?? flag(health.hasGroq)],
        ['Grok / xAI', aiUnknown ?? flag(health.hasXAI)],
        ['OpenAI', aiUnknown ?? flag(health.hasOpenAI)],
        ['Anthropic', aiUnknown ?? flag(health.hasAnthropic)],
        ['Gemini', aiUnknown ?? flag(health.hasGemini)],
        ['Cloudflare Workers AI', incompleteProbe(health.probes?.cloudflare?.status) ?? (health.hasCloudflare ? 'verified reachable' : 'not verified')],
        ['Supabase URL', flag(health.supabaseUrlPresent)],
        ['Supabase service key', flag(health.supabaseServiceKeyPresent)],
        ['Execution mode', health.execution?.mode ?? 'admin-native'],
        ['Dev Studio core', health.execution?.ready ? 'ready' : health.execution?.status === 'verification-incomplete' ? 'verification incomplete' : 'prerequisites incomplete'],
        ['Paris owned inference', aiUnknown ?? (health.hasElevate ? 'verified reachable' : 'not verified')],
        ['Repository writes', githubUnknown ?? operationStatus(health.execution?.repositoryWritesReady)],
        ['Deployment dispatch', githubUnknown ?? operationStatus(health.google?.deploymentDispatchReady)],
        ['Google runtime', flag(health.google?.ready)],
        ['Google project', health.google?.project ?? 'unavailable'],
      ]
    : [];

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-brand-blue-600" />
          <h2 className="text-sm font-semibold text-slate-900">Platform health</h2>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 space-y-4">
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
        {incomplete && incomplete.length > 0 && (
          <div role="status" className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            Some checks did not complete: {incomplete.map(([name, probe]) => `${name}: ${probe?.status === 'timed_out' ? 'timed out' : 'unavailable'}`).join('; ')}.
            {' '}This does not establish a service outage. Completed checks remain visible below.
          </div>
        )}
        {loading && !health && (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading live health from admin container…
          </div>
        )}

        {rows.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-slate-50">
            <div className="border-b border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Admin runtime
            </div>
            {rows.map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between border-b border-slate-100 px-3 py-2 text-xs last:border-0"
              >
                <span className="text-slate-600">{label}</span>
                <span className="min-w-0 max-w-[60%] break-words text-right font-mono text-slate-900">{value}</span>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-xl border border-slate-200">
          <div className="flex items-center gap-2 border-b border-slate-200 px-3 py-2">
            <Server className="h-4 w-4 text-slate-500" />
            <span className="text-xs font-semibold text-slate-800">Google Cloud services</span>
          </div>
          <div className="max-h-[320px] overflow-auto">
            <ServicesPanel />
          </div>
        </div>

        <Link
          href="/system-health"
          className="inline-flex items-center gap-1 text-xs font-medium text-brand-blue-600 hover:underline"
        >
          Full system health page <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
