'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Hammer, RefreshCw, Play } from 'lucide-react';

interface Build {
  id: string;
  service: string;
  environment: string;
  status: string;
  commit_sha: string | null;
  started_at: string;
  completed_at: string | null;
}

export default function BuildsClient() {
  const [builds, setBuilds] = useState<Build[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [triggering, setTriggering] = useState(false);

  async function fetchBuilds() {
    setLoading(true);
    try {
      const res = await fetch('/api/devstudio/builds');
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setBuilds(json.builds ?? []);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  async function triggerBuild(service: string) {
    setTriggering(true);
    try {
      await fetch('/api/devstudio/builds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service }),
      });
      fetchBuilds();
    } finally {
      setTriggering(false);
    }
  }

  useEffect(() => {
    fetchBuilds();
  }, []);

  const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-slate-400',
    building: 'bg-amber-400 animate-pulse',
    deploying: 'bg-blue-400 animate-pulse',
    success: 'bg-emerald-500',
    failed: 'bg-red-500',
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="relative h-[280px] w-full overflow-hidden">
        <Image
          src="/images/pages/admin-dev-hero.jpg"
          alt="Builds & Deploy"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-amber-900/80 to-orange-900/60" />
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-5xl mx-auto px-6 w-full">
            <div className="flex items-center gap-3 mb-3">
              <Hammer className="h-8 w-8 text-white/90" />
              <span className="text-xs font-semibold tracking-widest uppercase bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white">
                CI/CD
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
              Builds & Deploy
            </h1>
            <p className="text-amber-100 text-lg mt-2 max-w-2xl">
              Trigger, monitor, and track Northflank deployments in real time.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Action bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => triggerBuild('admin')}
              disabled={triggering}
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition shadow-sm"
            >
              <Play className="h-4 w-4" /> Deploy Admin
            </button>
            <button
              onClick={() => triggerBuild('lms')}
              disabled={triggering}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition shadow-sm"
            >
              <Play className="h-4 w-4" /> Deploy LMS
            </button>
          </div>
          <button
            onClick={fetchBuilds}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition shadow-sm"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {!process.env.NEXT_PUBLIC_NORTHFLANK_CONFIGURED && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-700 mb-6">
            Integration pending: NORTHFLANK_API_TOKEN env var not configured — builds will record
            but not trigger Northflank
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 mb-6">
            {error}
          </div>
        )}
        <div className="space-y-4">
          {builds.map((b) => (
            <div
              key={b.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900 capitalize">
                    {b.service} — {b.environment}
                  </p>
                  {b.commit_sha && (
                    <p className="text-xs font-mono text-slate-500 mt-0.5">
                      Commit: {b.commit_sha.slice(0, 8)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`h-3 w-3 rounded-full ${STATUS_COLORS[b.status] ?? 'bg-slate-400'}`}
                  />
                  <span className="text-sm font-medium text-slate-700 capitalize">{b.status}</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-3">
                {new Date(b.started_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>

        {!loading && builds.length === 0 && !error && (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 py-16 text-center">
            <Hammer className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-3 text-sm font-medium text-slate-500">No builds recorded yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Integration pending: ai_deployments table migration not yet applied
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
