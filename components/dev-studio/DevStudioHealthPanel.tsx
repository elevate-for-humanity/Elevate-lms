'use client';

import { useCallback, useEffect, useState } from 'react';
import { Activity, AlertTriangle, ExternalLink, Loader2, RefreshCw, Server } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

const NorthflankStatusPanel = dynamic(() => import('@/components/dev-studio/NorthflankStatusPanel'), {
  ssr: false,
});

type HealthPayload = Record<string, unknown> & {
  hasGroq?: boolean;
  hasGemini?: boolean;
  hasOpenAI?: boolean;
  hasAnthropic?: boolean;
  hasGitHub?: boolean;
  shell?: {
    configured?: boolean;
    ready?: boolean;
    probe?: { reachable?: boolean; ready?: boolean; status?: string; gitVersion?: string | null };
  };
};

function flag(ok: boolean | undefined) {
  return ok ? 'configured' : 'missing';
}

export default function DevStudioHealthPanel() {
  const [health, setHealth] = useState<HealthPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/devstudio/health');
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

  const rows = health
    ? [
        ['GitHub token', flag(health.hasGitHub)],
        ['Groq', flag(health.hasGroq)],
        ['OpenAI', flag(health.hasOpenAI)],
        ['Anthropic', flag(health.hasAnthropic)],
        ['Gemini', flag(health.hasGemini)],
        [
          'Studio shell',
          health.shell?.ready
            ? 'connected'
            : health.shell?.configured
              ? 'configured, not ready'
              : 'not configured',
        ],
        ['Shell probe', String(health.shell?.probe?.status ?? '—')],
        ['Git in shell', health.shell?.probe?.gitVersion ?? '—'],
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
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 space-y-4">
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
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
                <span className="font-mono text-slate-900">{value}</span>
              </div>
            ))}
          </div>
        )}

        {health?.shell && !health.shell.ready && (
          <p className="text-xs leading-relaxed text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            The <strong>studio shell container</strong> is separate from admin/LMS. Set{' '}
            <code className="rounded bg-white px-1">STUDIO_SHELL_WS_URL</code>,{' '}
            <code className="rounded bg-white px-1">STUDIO_SHELL_SECRET</code>, and{' '}
            <code className="rounded bg-white px-1">STUDIO_TOKEN_SECRET</code> in Dev Studio → Secrets,
            then deploy the studio service. Use the <strong>Terminal</strong> tab when shell is ready.
          </p>
        )}

        <div className="rounded-xl border border-slate-200">
          <div className="flex items-center gap-2 border-b border-slate-200 px-3 py-2">
            <Server className="h-4 w-4 text-slate-500" />
            <span className="text-xs font-semibold text-slate-800">Northflank services</span>
          </div>
          <div className="max-h-[320px] overflow-auto">
            <NorthflankStatusPanel />
          </div>
        </div>

        <Link
          href="/admin/system-health"
          className="inline-flex items-center gap-1 text-xs font-medium text-brand-blue-600 hover:underline"
        >
          Full system health page
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
