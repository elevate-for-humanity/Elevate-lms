'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Globe2, Loader2, Sparkles } from 'lucide-react';

type ImportResult = {
  originalUrl: string;
  extracted: {
    title: string;
    description: string;
    pageCount: number;
    imagesFound: number;
    colorsDetected: string[];
  };
  config: Record<string, unknown>;
};

export default function WebsiteImportClient() {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState<ImportResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const analyze = async () => {
    setBusy(true);
    setError('');
    setResult(null);
    try {
      const response = await fetch('/api/apps/website-builder/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await response.json();
      if (!response.ok) {
        const err = new Error(data.error || 'Could not import website') as Error & { upgradeUrl?: string };
        err.upgradeUrl = data.upgradeUrl;
        throw err;
      }
      setResult(data);
    } catch (err) {
      const typed = err as Error & { upgradeUrl?: string };
      setError(typed.message || 'Could not import website');
    } finally {
      setBusy(false);
    }
  };

  const createImportedSite = async () => {
    if (!result) return;
    setCreating(true);
    setError('');
    try {
      const response = await fetch('/api/apps/website-builder/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteName: result.extracted.title || new URL(result.originalUrl).hostname,
          siteConfig: result.config,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not create imported website');
      window.location.href = `/apps/website-builder/edit/${data.website.id}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create imported website');
    } finally {
      setCreating(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <Link href="/apps/website-builder" className="inline-flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-slate-950">
          <ArrowLeft className="h-4 w-4" /> Back to Website Builder
        </Link>

        <section className="mt-6 rounded-3xl bg-slate-950 p-8 text-white shadow-xl md:p-10">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-white/10 p-3"><Globe2 className="h-7 w-7" /></div>
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-300">Website Import</p>
              <h1 className="mt-2 text-3xl font-black md:text-4xl">Bring your existing website into Elevate</h1>
              <p className="mt-3 max-w-2xl text-slate-300">Enter a public website URL. Elevate reads the site's visible content and structure, uses AI to map it into the Website Builder, then opens the result in your editor before anything is published.</p>
            </div>
          </div>

          <div className="mt-8 rounded-2xl bg-white p-3 text-slate-950 sm:flex">
            <input
              type="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://yourbusiness.com"
              className="min-w-0 flex-1 rounded-xl px-4 py-3 outline-none"
            />
            <button
              type="button"
              onClick={analyze}
              disabled={busy || !url.trim()}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-red-600 px-6 py-3 font-black text-white disabled:opacity-50 sm:mt-0"
            >
              {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
              {busy ? 'Analyzing…' : 'Import with AI'}
            </button>
          </div>
          <p className="mt-3 text-xs text-slate-400">Only public pages are read. Private/local network URLs are blocked. Nothing is published until you review it.</p>
        </section>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-800">
            {error}{' '}
            {error.toLowerCase().includes('professional') && (
              <Link href="/store/apps/website-builder" className="font-black underline">View Website Builder upgrades</Link>
            )}
          </div>
        )}

        {result && (
          <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Import ready</p>
                <h2 className="mt-2 text-2xl font-black text-slate-950">{result.extracted.title || 'Imported website'}</h2>
                <p className="mt-2 max-w-2xl text-slate-600">{result.extracted.description || 'The source content has been mapped into an editable Elevate website configuration.'}</p>
              </div>
              <button
                type="button"
                onClick={createImportedSite}
                disabled={creating}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 py-3 font-black text-white disabled:opacity-50"
              >
                {creating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                {creating ? 'Creating…' : 'Create & Open Editor'}
              </button>
            </div>

            <div className="mt-7 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-5"><p className="text-2xl font-black">{result.extracted.pageCount}</p><p className="text-sm text-slate-500">additional pages analyzed</p></div>
              <div className="rounded-2xl bg-slate-50 p-5"><p className="text-2xl font-black">{result.extracted.imagesFound}</p><p className="text-sm text-slate-500">images discovered</p></div>
              <div className="rounded-2xl bg-slate-50 p-5"><p className="text-2xl font-black">{result.extracted.colorsDetected.length}</p><p className="text-sm text-slate-500">brand colors detected</p></div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
