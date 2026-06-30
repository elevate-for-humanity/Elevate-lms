'use client';

import { useCallback, useEffect, useState } from 'react';

interface StudioStatus {
  ready: string[];
  rendering: string | null;
  updatedAt: string;
}

export function BarberVideoStudioClient() {
  const [status, setStatus] = useState<StudioStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/dev/barber-video-studio');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStatus(await res.json());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load status');
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 5000);
    return () => clearInterval(id);
  }, [refresh]);

  const ready = status?.ready ?? [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <header>
          <h1 className="text-2xl font-bold">Barber lesson video studio</h1>
          <p className="text-slate-400 text-sm mt-1">
            Auto-refreshes every 5s. Local files: <code className="text-amber-300">public/videos/barber-lessons/</code>
          </p>
          {status?.rendering && (
            <p className="text-amber-400 text-sm mt-2">Rendering: {status.rendering}</p>
          )}
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        </header>

        <p className="text-sm text-slate-400">{ready.length} videos ready · updated {status?.updatedAt ?? '—'}</p>

        <ul className="grid gap-6 sm:grid-cols-2">
          {ready.map((slug) => (
            <li key={slug} className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
              <p className="px-3 py-2 text-sm font-mono text-slate-300 border-b border-slate-800">{slug}</p>
              <video
                src={`/videos/barber-lessons/${slug}.mp4`}
                controls
                preload="metadata"
                className="w-full aspect-video bg-black"
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
