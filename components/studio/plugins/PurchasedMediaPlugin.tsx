'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Download, ExternalLink, Film, Loader2, RefreshCw, Search, ShieldCheck } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import VideoUploadClient from '@/apps/admin/app/videos/upload/VideoUploadClient';

type Purchase = {
  itemId: string;
  title: string;
  url: string;
  thumbnail: string;
  site: string;
  purchaseCode: string;
  purchasedAt: string;
};

type ApiPayload = {
  connected?: boolean;
  username?: string;
  purchases?: Purchase[];
  downloadUrl?: string;
  error?: string;
};

export default function PurchasedMediaPlugin() {
  const searchParams = useSearchParams();
  const courseId = searchParams.get('courseId') ?? '';
  const [connected, setConnected] = useState<boolean | null>(null);
  const [username, setUsername] = useState('');
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState('');
  const [error, setError] = useState('');

  async function api(action: string, params: Record<string, string> = {}) {
    const url = new URL('/api/admin/integrations/envato', window.location.origin);
    url.searchParams.set('action', action);
    Object.entries(params).forEach(([key, value]) => value && url.searchParams.set(key, value));
    const response = await fetch(url, { cache: 'no-store' });
    const payload = await response.json().catch(() => ({})) as ApiPayload;
    if (!response.ok) throw new Error(payload.error || 'Envato request failed');
    return payload;
  }

  async function refresh() {
    setLoading(true);
    setError('');
    try {
      const [status, library] = await Promise.all([api('status'), api('purchases')]);
      setConnected(Boolean(status.connected));
      setUsername(status.username || '');
      setPurchases(library.purchases || []);
    } catch (cause) {
      setConnected(false);
      setError(cause instanceof Error ? cause.message : 'Envato connection failed');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void refresh(); }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return purchases;
    return purchases.filter((purchase) =>
      [purchase.title, purchase.site, purchase.itemId].some((value) => value.toLowerCase().includes(term)),
    );
  }, [purchases, query]);

  async function download(purchase: Purchase) {
    setDownloading(purchase.itemId);
    setError('');
    try {
      const payload = await api('download', {
        itemId: purchase.itemId,
        purchaseCode: purchase.purchaseCode,
      });
      if (!payload.downloadUrl) throw new Error('No download URL was returned');
      window.location.assign(payload.downloadUrl);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Download could not be started');
    } finally {
      setDownloading('');
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 p-4 text-white sm:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-2xl border border-cyan-800 bg-gradient-to-br from-cyan-950 to-slate-950 p-6">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">Installed Course Builder plugin</p>
          <h1 className="mt-2 text-3xl font-black">Purchased Media</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
            Browse purchases through the protected server connection, download the licensed source, then attach it to the correct course lesson below. Your Envato token never reaches the browser.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a href="https://app.envato.com/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-3 font-black text-slate-950 hover:bg-amber-300">
              <ExternalLink className="h-4 w-4" /> Open Envato
            </a>
            <Link href="/studio/courses" className="inline-flex items-center gap-2 rounded-xl border border-slate-500 px-4 py-3 font-bold text-slate-100 hover:bg-slate-800">
              Back to Course Builder
            </Link>
          </div>
        </header>

        <section className="rounded-2xl border border-slate-700 bg-slate-900 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-black">Envato purchase library</h2>
              <p className="mt-1 text-sm text-slate-400">
                {loading ? 'Checking connection…' : connected ? `Connected${username ? ` as ${username}` : ''} · ${purchases.length} purchases loaded` : 'Connection needs attention'}
              </p>
            </div>
            <button onClick={() => void refresh()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-cyan-500 px-4 py-2 text-sm font-bold text-cyan-100 disabled:opacity-50">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Refresh
            </button>
          </div>
          {error ? <div className="mt-4 rounded-xl border border-rose-700 bg-rose-950/60 p-4 text-sm font-semibold text-rose-100">{error}</div> : null}
          {connected ? (
            <>
              <label className="mt-4 flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-3">
                <Search className="h-4 w-4 text-slate-400" />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find barbering, cosmetology, sanitation…" className="w-full bg-transparent py-3 text-sm outline-none" />
              </label>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {filtered.map((purchase) => (
                  <article key={purchase.itemId || purchase.purchaseCode} className="rounded-xl border border-slate-700 bg-slate-950 p-4">
                    <div className="flex gap-3">
                      {purchase.thumbnail ? <img src={purchase.thumbnail} alt="" className="h-16 w-24 rounded-lg object-cover" /> : <div className="grid h-16 w-24 place-items-center rounded-lg bg-slate-800"><Film className="h-6 w-6" /></div>}
                      <div className="min-w-0 flex-1">
                        <h3 className="line-clamp-2 font-bold">{purchase.title}</h3>
                        <p className="mt-1 text-xs text-slate-400">{purchase.site || 'Envato Market'} · Item {purchase.itemId}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => void download(purchase)} disabled={downloading === purchase.itemId} className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-black text-slate-950 disabled:opacity-50">
                        {downloading === purchase.itemId ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Download licensed file
                      </button>
                      {purchase.url ? <a href={purchase.url} target="_blank" rel="noreferrer" className="rounded-lg border border-slate-600 px-3 py-2 text-sm font-bold">View</a> : null}
                    </div>
                  </article>
                ))}
              </div>
              {!loading && filtered.length === 0 ? <p className="mt-4 rounded-xl bg-slate-950 p-4 text-sm text-slate-300">No matching Market purchases were returned. Envato subscription assets can still be downloaded from “Open Envato” and uploaded below.</p> : null}
            </>
          ) : null}
        </section>

        <section className="rounded-2xl border border-slate-700 bg-slate-900 p-5">
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-emerald-800 bg-emerald-950/40 p-4">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
            <div>
              <h2 className="font-black text-emerald-100">Attach the licensed scene</h2>
              <p className="mt-1 text-sm text-emerald-100/80">After download, choose the source file and the exact lesson. The builder stores it privately, links it to that lesson, and queues the canonical render checks.</p>
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
