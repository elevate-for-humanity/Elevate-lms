'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Rocket, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';

interface Deployment {
  id: string;
  service: string;
  environment: string;
  status: string;
  commit_sha: string | null;
  health_check: Record<string, unknown> | null;
  started_at: string;
  completed_at: string | null;
}

export default function DeploymentsClient() {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchDeployments() {
    setLoading(true);
    try {
      const res = await fetch('/api/devstudio/builds');
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setDeployments(json.builds ?? []);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDeployments();
  }, []);

  const STATUS_ICONS: Record<string, typeof Clock> = {
    success: CheckCircle,
    failed: XCircle,
    pending: Clock,
    building: Clock,
    deploying: Rocket,
  };

  const STATUS_COLORS: Record<string, string> = {
    success: 'text-emerald-500 bg-emerald-50',
    failed: 'text-red-500 bg-red-50',
    pending: 'text-slate-400 bg-slate-100',
    building: 'text-amber-500 bg-amber-50',
    deploying: 'text-blue-500 bg-blue-50',
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="relative h-[280px] w-full overflow-hidden">
        <Image
          src="/images/pages/admin-dev-studio-detail.webp"
          alt="Deployments"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-900/80 to-blue-900/60" />
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-5xl mx-auto px-6 w-full">
            <div className="flex items-center gap-3 mb-3">
              <Rocket className="h-8 w-8 text-white/90" />
              <span className="text-xs font-semibold tracking-widest uppercase bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white">
                Production
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
              Deployments
            </h1>
            <p className="text-cyan-100 text-lg mt-2 max-w-2xl">
              Production deployment history — track every release to Northflank.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <p className="text-sm text-slate-500">{deployments.length} deployments — newest first</p>
          <button
            onClick={fetchDeployments}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition shadow-sm"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 mb-6">
            {error}
          </div>
        )}

        <div className="relative space-y-4">
          <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-slate-200" />
          {deployments.map((d) => {
            const Icon = STATUS_ICONS[d.status] ?? Clock;
            const colorClass = STATUS_COLORS[d.status] ?? 'text-slate-400 bg-slate-100';
            const [textColor, bgColor] = colorClass.split(' ');
            return (
              <div key={d.id} className="relative pl-16">
                <div
                  className={`absolute left-3 top-4 flex h-8 w-8 items-center justify-center rounded-full ${bgColor} ring-4 ring-white`}
                >
                  <Icon className={`h-4 w-4 ${textColor}`} />
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900 capitalize">{d.service}</p>
                      <p className="text-xs text-slate-500">{d.environment}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-slate-700 capitalize">
                        {d.status}
                      </span>
                      {d.commit_sha && (
                        <p className="text-[10px] font-mono text-slate-400">
                          {d.commit_sha.slice(0, 8)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-3">
                    <span>{new Date(d.started_at).toLocaleString()}</span>
                    {d.completed_at && (
                      <span>Completed: {new Date(d.completed_at).toLocaleString()}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {!loading && deployments.length === 0 && !error && (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 py-16 text-center">
            <Rocket className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-3 text-sm font-medium text-slate-500">No deployments yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Integration pending: ai_deployments table migration not yet applied
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
