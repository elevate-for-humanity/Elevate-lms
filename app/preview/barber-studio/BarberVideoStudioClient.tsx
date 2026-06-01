'use client';

import { useCallback, useEffect, useState } from 'react';

type StudioItem = {
  slug: string;
  title: string;
  order_index: number;
  status: 'missing' | 'ready' | 'rendering';
  localUrl: string | null;
  cdnUrl: string | null;
  sizeMb: number | null;
  isCurrent: boolean;
};

type Payload = {
  studio: {
    updatedAt: string;
    currentSlug: string | null;
    currentTitle: string | null;
    phase: string;
    message: string | null;
    completed: string[];
    failed: { slug: string; error: string }[];
  };
  readyCount: number;
  totalLessons: number;
  items: StudioItem[];
  refreshedAt: string;
};

export function BarberVideoStudioClient() {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [filter, setFilter] = useState<'all' | 'ready' | 'missing' | 'rendering'>('all');

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/dev/barber-video-studio', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, [autoRefresh, load]);

  const studio = data?.studio;
  const items =
    data?.items.filter((item) => filter === 'all' || item.status === filter) ?? [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <header className="border-b border-amber-500/30 pb-6 mb-6">
        <p className="text-xs font-semibold tracking-[0.2em] text-amber-400 uppercase">
          Live preview · no OpenAI required
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold mt-2">Barber Video Studio</h1>
        <p className="text-sm text-zinc-400 mt-2 max-w-2xl">
          Keep this page open while videos are generated. It refreshes every 5 seconds. Click play
          on any ready lesson — use your device volume; click the speaker icon if you hear nothing.
        </p>
      </header>

      <div className="flex flex-wrap gap-3 items-center mb-6 text-sm">
        <label className="flex items-center gap-2 text-zinc-300">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
            className="rounded"
          />
          Auto-refresh (5s)
        </label>
        <button
          type="button"
          onClick={() => load()}
          className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium"
        >
          Refresh now
        </button>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as typeof filter)}
          className="bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-zinc-200"
        >
          <option value="all">All lessons</option>
          <option value="ready">Ready only</option>
          <option value="rendering">Rendering now</option>
          <option value="missing">Not started</option>
        </select>
        {data && (
          <span className="text-zinc-400">
            {data.readyCount} / {data.totalLessons} ready
          </span>
        )}
      </div>

      {studio?.currentSlug && (
        <div className="mb-6 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
          <p className="text-amber-300 text-xs font-bold uppercase tracking-wide">Now rendering</p>
          <p className="font-semibold text-white mt-1">
            {studio.currentTitle ?? studio.currentSlug}
          </p>
          <p className="text-sm text-amber-100/80 mt-1">
            Phase: {studio.phase}
            {studio.message ? ` — ${studio.message}` : ''}
          </p>
        </div>
      )}

      {error && (
        <p className="mb-4 text-red-400 text-sm">Could not refresh: {error}</p>
      )}

      <ul className="space-y-8">
        {items.map((item) => (
          <li
            key={item.slug}
            className={`rounded-xl border p-4 ${
              item.isCurrent
                ? 'border-amber-500 bg-zinc-900'
                : item.status === 'ready'
                  ? 'border-zinc-700 bg-zinc-900/80'
                  : 'border-zinc-800 bg-zinc-900/40'
            }`}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-semibold text-white">
                {item.order_index + 1}. {item.title}
              </h2>
              <span
                className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                  item.status === 'ready'
                    ? 'bg-emerald-900 text-emerald-300'
                    : item.status === 'rendering'
                      ? 'bg-amber-900 text-amber-300 animate-pulse'
                      : 'bg-zinc-800 text-zinc-500'
                }`}
              >
                {item.status}
                {item.sizeMb != null ? ` · ${item.sizeMb} MB` : ''}
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-1">{item.slug}</p>

            {item.localUrl ? (
              <video
                key={item.localUrl + (data?.refreshedAt ?? '')}
                className="mt-4 w-full rounded-lg bg-black aspect-video"
                src={item.localUrl}
                controls
                playsInline
                preload="metadata"
              />
            ) : (
              <div className="mt-4 aspect-video rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-500 text-sm">
                {item.status === 'rendering' ? 'Encoding… check back in a minute' : 'Not generated yet'}
              </div>
            )}
          </li>
        ))}
      </ul>

      {studio?.failed && studio.failed.length > 0 && (
        <div className="mt-10 rounded-xl border border-red-500/40 bg-red-950/40 p-4">
          <h3 className="font-semibold text-red-300">Failed lessons</h3>
          <ul className="mt-2 text-sm text-red-200/90 space-y-1">
            {studio.failed.map((f) => (
              <li key={f.slug}>
                <strong>{f.slug}</strong>: {f.error}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-10 text-xs text-zinc-600 text-center">
        Open in LMS: Prestige Elevation™ course → Video tab on each lesson (after Supabase upload).
      </p>
    </div>
  );
}
