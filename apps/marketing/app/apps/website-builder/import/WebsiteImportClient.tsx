'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileUp, Globe2, Loader2, Sparkles, WandSparkles } from 'lucide-react';

type ImportResult = {
  originalUrl: string;
  extracted: {
    title: string;
    description: string;
    pageCount: number;
    imagesFound: number;
    colorsDetected: string[];
  };
  config: Record<string, any>;
};

type ImportMode = 'preserve' | 'modernize' | 'rebuild';
type ImportSource = 'url' | 'file';

export default function WebsiteImportClient() {
  const [url, setUrl] = useState('');
  const [source, setSource] = useState<ImportSource>('url');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [mode, setMode] = useState<ImportMode>('modernize');
  const [busy, setBusy] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const analyze = async () => {
    setBusy(true);
    setError('');
    setResult(null);
    try {
      const isFile = source === 'file';
      const content = isFile && importFile ? await importFile.text() : undefined;
      const response = await fetch(isFile ? '/api/apps/website-builder/import-data' : '/api/apps/website-builder/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isFile ? { fileName: importFile?.name, content } : { url }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not import website');
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not import website');
    } finally {
      setBusy(false);
    }
  };

  const createImportedSite = async () => {
    if (!result) return;
    setCreating(true);
    setError('');
    try {
      const importedConfig = {
        ...result.config,
        meta: {
          ...(result.config?.meta || {}),
          importMode: mode,
          sourceUrl: result.originalUrl || undefined,
        },
      };
      const response = await fetch('/api/apps/website-builder/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteName: result.extracted.title || (result.originalUrl ? new URL(result.originalUrl).hostname : 'Imported Website'),
          siteConfig: importedConfig,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not create imported website');
      window.location.href = `/apps/website-builder/edit/${data.website.id}?source=import&mode=${mode}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create imported website');
    } finally {
      setCreating(false);
    }
  };

  const modes: Array<{ id: ImportMode; title: string; description: string }> = [
    { id: 'preserve', title: 'Keep structure', description: 'Keep the imported organization and copy as close to the source as possible.' },
    { id: 'modernize', title: 'Modernize', description: 'Keep the brand and content, then use PARIS in the editor to improve hierarchy, clarity and conversion.' },
    { id: 'rebuild', title: 'Rebuild with AI', description: 'Use the imported site as source material and aggressively reshape it with PARIS after import.' },
  ];

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
              <p className="mt-3 max-w-2xl text-slate-300">Enter a public URL. Elevate analyzes visible content, images, branding and navigation, maps the result into an editable site, then opens it beside PARIS for refinement before publishing.</p>
            </div>
          </div>

          <div className="mt-8 flex gap-2" role="tablist" aria-label="Import source">
            <button type="button" role="tab" aria-selected={source === 'url'} onClick={() => { setSource('url'); setResult(null); setError(''); }} className={`rounded-xl px-4 py-2 text-sm font-black ${source === 'url' ? 'bg-white text-slate-950' : 'bg-white/10 text-white'}`}><Globe2 className="mr-2 inline h-4 w-4" />Public URL</button>
            <button type="button" role="tab" aria-selected={source === 'file'} onClick={() => { setSource('file'); setResult(null); setError(''); }} className={`rounded-xl px-4 py-2 text-sm font-black ${source === 'file' ? 'bg-white text-slate-950' : 'bg-white/10 text-white'}`}><FileUp className="mr-2 inline h-4 w-4" />JSON or CSV</button>
          </div>

          <div className="mt-3 rounded-2xl bg-white p-3 text-slate-950 sm:flex">
            {source === 'url' ? (
              <input type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://yourbusiness.com" className="min-w-0 flex-1 rounded-xl px-4 py-3 outline-none" />
            ) : (
              <label className="flex min-w-0 flex-1 cursor-pointer items-center rounded-xl px-4 py-3">
                <FileUp className="mr-3 h-5 w-5 text-slate-500" />
                <span className="truncate">{importFile?.name || 'Choose a JSON or CSV export'}</span>
                <input type="file" accept=".json,.csv,application/json,text/csv" className="sr-only" onChange={(event) => setImportFile(event.target.files?.[0] || null)} />
              </label>
            )}
            <button type="button" onClick={analyze} disabled={busy || (source === 'url' ? !url.trim() : !importFile)} className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-red-600 px-6 py-3 font-black text-white disabled:opacity-50 sm:mt-0">
              {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
              {busy ? 'Analyzing…' : 'Analyze with AI'}
            </button>
          </div>
          <p className="mt-3 text-xs text-slate-400">Import a public site through the URL API or upload a JSON/CSV export. Nothing is published until you review it.</p>
        </section>

        {error && <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-800">{error}</div>}

        {result && (
          <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Analysis complete</p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">{result.extracted.title || 'Imported website'}</h2>
              <p className="mt-2 max-w-2xl text-slate-600">{result.extracted.description || 'The source content has been mapped into an editable Elevate website configuration.'}</p>
            </div>

            <div className="mt-7 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-5"><p className="text-2xl font-black">{result.extracted.pageCount}</p><p className="text-sm text-slate-500">additional pages analyzed</p></div>
              <div className="rounded-2xl bg-slate-50 p-5"><p className="text-2xl font-black">{result.extracted.imagesFound}</p><p className="text-sm text-slate-500">images discovered</p></div>
              <div className="rounded-2xl bg-slate-50 p-5"><p className="text-2xl font-black">{result.extracted.colorsDetected.length}</p><p className="text-sm text-slate-500">brand colors detected</p></div>
            </div>

            <div className="mt-8">
              <div className="flex items-center gap-2"><WandSparkles className="h-5 w-5 text-brand-red-700" /><h3 className="font-black text-slate-950">How should Elevate use the source?</h3></div>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                {modes.map((item) => (
                  <button key={item.id} type="button" onClick={() => setMode(item.id)} className={`rounded-2xl border p-4 text-left ${mode === item.id ? 'border-brand-red-500 bg-brand-red-50' : 'border-slate-200 hover:border-slate-300'}`}>
                    <p className="font-black text-slate-950">{item.title}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-600">{item.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <button type="button" onClick={createImportedSite} disabled={creating} className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 py-3.5 font-black text-white disabled:opacity-50 sm:w-auto">
              {creating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
              {creating ? 'Creating…' : 'Create Draft & Open PARIS Editor'}
            </button>
          </section>
        )}
      </div>
    </main>
  );
}
