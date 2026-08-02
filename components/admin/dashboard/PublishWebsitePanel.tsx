'use client';

/**
 * Admin dashboard — one-click publish & update for the public LMS.
 * Refreshes ISR cache on www + triggers Northflank builds (LMS + Admin).
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Globe,
  Loader2,
  RefreshCw,
  Rocket,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

type ServiceStatus = {
  key: string;
  id: string;
  label: string;
  url: string;
  status: string | null;
  lastDeployedAt: string | null;
};

type PublishStatus = {
  northflankReady: boolean;
  deployRelayReady?: boolean;
  liveSiteUrl: string;
  revalidatePathCount: number;
  services: ServiceStatus[];
  content?: {
    unpublishedPrograms: number;
    unpublishedTestimonials: number;
  };
};

type PublishResult = {
  ok: boolean;
  timestamp: string;
  liveSiteUrl: string;
  revalidate: { ok: boolean; error?: string; paths?: string[] };
  deploy: Array<{ service: string; key: string; status: string; detail?: string }>;
};

function formatWhen(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function PublishWebsitePanel() {
  const [status, setStatus] = useState<PublishStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<PublishResult | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/publish-website', { credentials: 'same-origin' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      setStatus(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handlePublish() {
    if (!confirmed) {
      setConfirmed(true);
      return;
    }

    setPublishing(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/admin/publish-website', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: 'PUBLISH', revalidate: true, deploy: status?.northflankReady === true }),
      });
      const json = await res.json();
      if (!res.ok && !json.deploy) throw new Error(json.error ?? `HTTP ${res.status}`);
      setResult(json as PublishResult);
      setConfirmed(false);
      void load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Publish failed');
      setConfirmed(false);
    } finally {
      setPublishing(false);
    }
  }

  return (
    <section
      className="mb-6 rounded-2xl border-2 border-brand-blue-200 bg-gradient-to-br from-brand-blue-50 to-white p-5 sm:p-6 shadow-sm"
      aria-labelledby="publish-website-heading"
    >
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-5 h-5 text-brand-blue-700" aria-hidden="true" />
            <p className="text-xs font-bold uppercase tracking-widest text-brand-blue-600">
              Production
            </p>
          </div>
          <h2 id="publish-website-heading" className="text-xl font-black text-slate-900">
            Publish &amp; Update Website
          </h2>
          <p className="mt-2 text-sm text-slate-600 max-w-xl leading-relaxed">
            Pushes live content updates to{' '}
            <strong>{status?.liveSiteUrl ?? 'www.elevateforhumanity.org'}</strong>: refreshes{' '}
            {status?.revalidatePathCount ?? '40+'} public marketing pages (programs, funding,
            Indianapolis SEO hubs, blog) and triggers Northflank rebuilds for the main site and admin
            dashboard when deploy credentials or the GitHub deploy relay are available.
          </p>

          {status?.content &&
            (status.content.unpublishedPrograms > 0 ||
              status.content.unpublishedTestimonials > 0) && (
              <p className="mt-3 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                {status.content.unpublishedPrograms > 0 && (
                  <span>
                    {status.content.unpublishedPrograms} program(s) still unpublished — use{' '}
                    <Link href="/programs" className="font-semibold underline">
                      Programs
                    </Link>{' '}
                    to publish catalog changes first.{' '}
                  </span>
                )}
                {status.content.unpublishedTestimonials > 0 && (
                  <span>
                    {status.content.unpublishedTestimonials} testimonial draft(s) — publish in CRM /
                    content tools for homepage success stories.
                  </span>
                )}
              </p>
            )}

          {!loading && status && (
            <div className="mt-4 grid sm:grid-cols-2 gap-2">
              {status.services.map((svc) => (
                <div
                  key={svc.key}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
                >
                  <p className="font-semibold text-slate-800">{svc.label}</p>
                  <p className="text-slate-500 mt-0.5">
                    Status: {svc.status ?? (status.northflankReady ? 'unknown' : 'not configured')}
                  </p>
                  <p className="text-slate-400">Last deploy: {formatWhen(svc.lastDeployedAt)}</p>
                </div>
              ))}
            </div>
          )}

          {error && (
            <p className="mt-3 text-sm text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </p>
          )}

          {result && (
            <div
              className={`mt-3 rounded-lg border px-3 py-3 text-sm ${
                result.ok
                  ? 'border-brand-green-200 bg-brand-green-50 text-brand-green-900'
                  : 'border-amber-200 bg-amber-50 text-amber-900'
              }`}
            >
              <p className="font-semibold flex items-center gap-2">
                {result.ok ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                {result.ok ? 'Publish started successfully' : 'Publish completed with issues'}
              </p>
              <ul className="mt-2 space-y-1 text-xs">
                <li>
                  Cache refresh: {result.revalidate.ok ? 'OK' : result.revalidate.error ?? 'failed'}
                </li>
                {result.deploy.map((d) => (
                  <li key={d.service}>
                    {d.service}: {d.status}
                    {d.detail ? ` — ${d.detail}` : ''}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[11px] opacity-80">
                Builds take 15–25 minutes on Northflank. Verify at{' '}
                <a href={result.liveSiteUrl} className="underline font-medium" target="_blank" rel="noopener noreferrer">
                  live site
                </a>
                .
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 shrink-0 w-full lg:w-auto">
          <button
            type="button"
            onClick={() => void handlePublish()}
            disabled={publishing || loading || !status}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-blue-700 px-5 py-3 text-sm font-bold text-white hover:bg-brand-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {publishing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : confirmed ? (
              <Rocket className="w-4 h-4" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {publishing
              ? 'Publishing…'
              : confirmed
                ? 'Confirm — Publish Now'
                : 'Publish & Update Website'}
          </button>
          {confirmed && !publishing && (
            <button
              type="button"
              onClick={() => setConfirmed(false)}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              Cancel
            </button>
          )}
          <a
            href={status?.liveSiteUrl ?? 'https://www.elevateforhumanity.org'}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            View live site <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="text-xs text-slate-500 hover:text-slate-800 disabled:opacity-50"
          >
            Refresh status
          </button>
          {!status?.northflankReady && !loading && (
            <p className="text-[11px] text-amber-700 max-w-[220px]">
              Direct Northflank deploy is not configured here. This button will still refresh public content; use Dev Studio Deploy All for GitHub Actions deploys.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

// Default export for next/dynamic
export default PublishWebsitePanel;
