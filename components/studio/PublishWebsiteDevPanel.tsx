'use client';

import { useCallback, useState } from 'react';
import { Globe, Loader2, Rocket, CheckCircle2, AlertCircle } from 'lucide-react';

type PublishResult = {
  ok: boolean;
  revalidate?: { ok: boolean; error?: string };
  deploy?: Array<{ service: string; status: string; detail?: string }>;
  error?: string;
};

export default function PublishWebsiteDevPanel() {
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PublishResult | null>(null);
  const [error, setError] = useState('');

  const publish = useCallback(async () => {
    if (!confirm) {
      setConfirm(true);
      return;
    }
    setConfirm(false);
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/admin/publish-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: 'PUBLISH' }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      setResult(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Publish failed');
    } finally {
      setLoading(false);
    }
  }, [confirm]);

  return (
    <section
      className="mt-4 rounded-md border p-4"
      style={{ borderColor: '#3c3c3c', background: '#252526' }}
    >
      <div className="mb-3 flex items-center gap-2">
        <Globe className="h-4 w-4" style={{ color: '#4ec9b0' }} />
        <h3 className="text-sm font-semibold text-white">Publish &amp; Update Website</h3>
      </div>
      <p className="mb-3 text-[11px] leading-relaxed" style={{ color: '#9ca3af' }}>
        Bust ISR cache on the public LMS and trigger Northflank builds for LMS + Admin. Same flow as
        the admin dashboard publish control.
      </p>
      {error && (
        <p className="mb-2 flex items-start gap-2 text-[11px] text-red-300">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}
      {result && (
        <div className="mb-3 space-y-1 text-[11px]" style={{ color: '#d4d4d4' }}>
          <p className="flex items-center gap-1.5">
            {result.ok ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
            ) : (
              <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
            )}
            Revalidate: {result.revalidate?.ok ? 'OK' : result.revalidate?.error ?? 'failed'}
          </p>
          {result.deploy?.map((d) => (
            <p key={d.service}>
              {d.service}: {d.status}
              {d.detail ? ` — ${d.detail}` : ''}
            </p>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={publish}
        disabled={loading}
        className="inline-flex h-9 items-center gap-2 rounded px-3 text-xs font-semibold disabled:opacity-50"
        style={{
          background: confirm ? '#f59e0b' : '#0078d4',
          color: confirm ? '#111827' : '#fff',
        }}
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Rocket className="h-3.5 w-3.5" />
        )}
        {confirm ? 'Confirm publish' : 'Publish & update website'}
      </button>
    </section>
  );
}
