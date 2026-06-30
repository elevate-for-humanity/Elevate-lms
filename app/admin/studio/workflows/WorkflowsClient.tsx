'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Workflow, RefreshCw } from 'lucide-react';

interface WorkflowItem {
  id: string;
  title: string;
  status: string;
  ai_agents: { name: string; role: string } | null;
  updated_at: string;
}

export default function WorkflowsClient() {
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchWorkflows() {
    setLoading(true);
    try {
      const res = await fetch('/api/devstudio/workflows');
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setWorkflows(json.workflows ?? []);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchWorkflows();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <div className="relative h-[280px] w-full overflow-hidden">
        <Image
          src="/images/pages/admin-grants-workflow-detail.webp"
          alt="Workflows"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/80 to-violet-900/60" />
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-5xl mx-auto px-6 w-full">
            <div className="flex items-center gap-3 mb-3">
              <Workflow className="h-8 w-8 text-white/90" />
              <span className="text-xs font-semibold tracking-widest uppercase bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white">
                Automation
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
              Workflows
            </h1>
            <p className="text-indigo-100 text-lg mt-2 max-w-2xl">
              Automated task execution pipelines — track agent workflows in real time.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <p className="text-sm text-slate-500">{workflows.length} workflows — newest first</p>
          <button
            onClick={fetchWorkflows}
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

        <div className="space-y-4">
          {workflows.map((w) => (
            <div
              key={w.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">{w.title}</p>
                  {w.ai_agents && (
                    <p className="text-sm text-slate-500 mt-0.5">Agent: {w.ai_agents.name}</p>
                  )}
                </div>
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 capitalize">
                  {w.status.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-3">
                {new Date(w.updated_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>

        {!loading && workflows.length === 0 && !error && (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 py-16 text-center">
            <Workflow className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-3 text-sm font-medium text-slate-500">No workflows yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Integration pending: ai_tasks table migration not yet applied
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
