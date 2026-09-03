'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Bug, RefreshCw, ShieldAlert } from 'lucide-react';

type ErrorsPayload = {
  sentry: { configured: boolean; environment: string };
  shell: Record<string, string>;
  intake: { idempotencyTtlSeconds: number };
  auditFailures: Array<{
    id: string;
    endpoint: string | null;
    error_message: string | null;
    created_at: string;
    resolved: boolean;
  }>;
  auditFailuresDegraded?: boolean;
};

export function LizzyErrorsPanel() {
  const [data, setData] = useState<ErrorsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/monitoring/errors');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setData(json as ErrorsPayload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load errors');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#1e1e1e] text-[#cccccc]">
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-[#3c3c3c] bg-[#252526] px-3">
        <div className="flex items-center gap-2 text-[11px] font-semibold">
          <Bug className="h-3.5 w-3.5 text-rose-400" />
          Errors &amp; monitoring
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-1 rounded border border-[#3c3c3c] px-2 py-1 text-[10px] hover:bg-[#2d2d2d]"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3 space-y-4 text-[11px]">
        {error && (
          <p className="rounded border border-rose-900/50 bg-rose-950/40 px-3 py-2 text-rose-300">{error}</p>
        )}

        {data && (
          <>
            <section>
              <h3 className="mb-2 font-bold uppercase tracking-wider text-[#858585]">Sentry</h3>
              <div className="rounded border border-[#3c3c3c] bg-[#252526] p-3 space-y-1">
                <Row
                  label="DSN"
                  ok={data.sentry.configured}
                  detail={data.sentry.configured ? `env: ${data.sentry.environment}` : 'Set SENTRY_DSN on the admin container'}
                />
                <Link href="/api/sentry-test" target="_blank" className="text-[#4fc1ff] hover:underline">
                  Trigger test event (dev)
                </Link>
              </div>
            </section>


            <section>
              <h3 className="mb-2 font-bold uppercase tracking-wider text-[#858585]">Intake TTL</h3>
              <p className="text-[#858585]">
                Application idempotency Redis TTL:{' '}
                <span className="text-[#cccccc]">{data.intake.idempotencyTtlSeconds}s</span>
                {' '}(APPLICATION_INTAKE_IDEMPOTENCY_TTL_SECONDS)
              </p>
            </section>

            <section>
              <h3 className="mb-2 flex items-center gap-2 font-bold uppercase tracking-wider text-[#858585]">
                <ShieldAlert className="h-3.5 w-3.5" />
                Unresolved audit failures ({data.auditFailures.length})
              </h3>
              {data.auditFailuresDegraded && (
                <p className="mb-2 text-amber-400">Could not query audit_failures — check service role.</p>
              )}
              {data.auditFailures.length === 0 ? (
                <p className="text-[#858585]">No unresolved audit failures in the last day.</p>
              ) : (
                <ul className="space-y-2">
                  {data.auditFailures.map((row) => (
                    <li key={row.id} className="rounded border border-[#3c3c3c] bg-[#252526] p-2">
                      <p className="font-mono text-[#4fc1ff]">{row.endpoint ?? 'unknown'}</p>
                      <p className="mt-1 text-[#cccccc] line-clamp-3">{row.error_message ?? '—'}</p>
                      <p className="mt-1 text-[#858585]">{new Date(row.created_at).toLocaleString()}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}

        {!data && !error && loading && (
          <p className="text-[#858585]">Loading monitoring data…</p>
        )}
      </div>
    </div>
  );
}

function Row({ label, ok, detail }: { label: string; ok: boolean; detail: string }) {
  return (
    <div className="flex items-start gap-2">
      {ok ? (
        <span className="text-emerald-400">●</span>
      ) : (
        <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-400" />
      )}
      <div>
        <span className="font-mono text-[#cccccc]">{label}</span>
        <span className="ml-2 text-[#858585]">{detail}</span>
      </div>
    </div>
  );
}
