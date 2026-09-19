'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Download, ExternalLink, Film, Loader2, RefreshCw, ShieldCheck } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import VideoUploadClient from '@/apps/admin/app/videos/upload/VideoUploadClient';

type Purchase = {
  itemId: string;
  title: string;
  url: string;
  site: string;
  purchaseCode: string;
};

type EnvatoResponse = {
  connected?: boolean;
  username?: string;
  purchases?: Purchase[];
  downloadUrl?: string;
  error?: string;
};

async function requestEnvato(action: string, params: Record<string, string> = {}) {
  const search = new URLSearchParams({ action });
  Object.entries(params).forEach(([key, value]) => {
    if (value) search.set(key, value);
  });
  const response = await fetch(`/api/admin/integrations/envato?${search.toString()}`, {
    cache: 'no-store',
  });
  const payload = await response.json().catch(() => ({})) as EnvatoResponse;
  if (!response.ok) throw new Error(payload.error || 'Envato request failed');
  return payload;
}

export default function PurchasedMediaPlugin() {
  const searchParams = useSearchParams();
  const courseId = searchParams.get('courseId') ?? '';
  const [username, setUsername] = useState('');
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState('');
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [status, library] = await Promise.all([
        requestEnvato('status'),
        requestEnvato('purchases'),
      ]);
      setUsername(status.username || '');
      setPurchases(library.purchases || []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Envato connection failed');
      setPurchases([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function downloadPurchase(purchase: Purchase) {
    setDownloading(purchase.itemId);
    setError('');
    try {
      const result = await requestEnvato('download', {
        itemId: purchase.itemId,
        purchaseCode: purchase.purchaseCode,
      });
      if (!result.downloadUrl) throw new Error('Envato did not return a download link');
      window.location.assign(result.downloadUrl);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Download could not be started');
    } finally {
      setDownloading('');
    }
  }

  const term = query.trim().toLowerCase();
  const visiblePurchases = term
    ? purchases.filter((purchase) =>
        `${purchase.title} ${purchase.site} ${purchase.itemId}`.toLowerCase().includes(term),
      )
    : purchases;

  return (
    <main className="min-h-screen bg-slate-950 p-4 text-white sm:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-2xl border border-cyan-800 bg-cyan-950 p-6">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">
            Installed Course Builder plugin
          </p>
          <h1 className="mt-2 text-3xl font-black">Purchased Media</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
            Browse licensed Envato Market purchases, download the correct source, and attach it to a
            specific course lesson. The Envato token stays on the server.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href="https://app.envato.com/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-3 font-black text-slate-950"
            >
              <ExternalLink className="h-4 w-4" /> Open Envato
            </a>
            <Link
              href="/studio/courses"
              className="rounded-xl border border-slate-500 px-4 py-3 font-bold"
            >
              Back to Course Builder
            </Link>
          </div>
        </header>

        <section className="rounded-2xl border border-slate-700 bg-slate-900 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-black">Envato purchase library</h2>
              <p className="mt-1 text-sm text-slate-400">
                {loading
                  ? 'Checking connection…'
                  : error
                    ? 'Connection needs attention'
                    : `Connected${username ? ` as ${username}` : ''} · ${purchases.length} purchases`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void refresh()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-cyan-500 px-4 py-2 text-sm font-bold disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Refresh
            </button>
          </div>

          {error ? (
            <div className="mt-4 rounded-xl border border-rose-700 bg-rose-950 p-4 text-sm">
              {error}
            </div>
          ) : null}

          {!loading && !error ? (
            <>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Find barbering, cosmetology, sanitation…"
                className="mt-4 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm"
              />
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {visiblePurchases.map((purchase) => (
                  <article
                    key={purchase.purchaseCode || purchase.itemId}
                    className="rounded-xl border border-slate-700 bg-slate-950 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <Film className="mt-1 h-6 w-6 shrink-0 text-cyan-300" />
                      <div className="min-w-0">
                        <h3 className="font-bold">{purchase.title}</h3>
                        <p className="mt-1 text-xs text-slate-400">
                          {purchase.site || 'Envato Market'} · Item {purchase.itemId}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void downloadPurchase(purchase)}
                        disabled={downloading === purchase.itemId}
                        className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-black text-slate-950 disabled:opacity-50"
                      >
                        {downloading === purchase.itemId
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : <Download className="h-4 w-4" />}
                        Download licensed file
                      </button>
                      {purchase.url ? (
                        <a
                          href={purchase.url}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg border border-slate-600 px-3 py-2 text-sm font-bold"
                        >
                          View item
                        </a>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
              {visiblePurchases.length === 0 ? (
                <p className="mt-4 rounded-xl bg-slate-950 p-4 text-sm text-slate-300">
                  No matching Market purchases were returned. Subscription assets can still be
                  downloaded from Envato and uploaded below.
                </p>
              ) : null}
            </>
          ) : null}
        </section>

        <section className="rounded-2xl border border-slate-700 bg-slate-900 p-5">
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-emerald-800 bg-emerald-950 p-4">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
            <div>
              <h2 className="font-black text-emerald-100">Attach the licensed scene</h2>
              <p className="mt-1 text-sm text-emerald-100">
                Select the downloaded source and exact lesson. The builder stores it privately and
                queues the canonical media checks.
              </p>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-4 text-slate-950 sm:p-6">
            <VideoUploadClient initialCourseId={courseId} embedded />
          </div>
        </section>
      </div>
    </main>
  );
}
