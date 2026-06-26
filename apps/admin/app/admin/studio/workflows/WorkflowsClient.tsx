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

export default function WorkflowsClient({ embedded = false }: { embedded?: boolean }) {
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

  const header = !embedded ? (
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
  ) : (
    <div className="px-4 py-4 border-b border-[#3c3c3c] bg-[#2d2d2d]">
       <div className="flex items-center gap-2">
         <Workflow className="h-4 w-4 text-[#4ec9b0]" />
         <span className="text-xs font-bold uppercase tracking-widest text-white">Workflow Monitoring</span>
       </div>
    </div>
  );

  return (
    <div className={`flex flex-col h-full overflow-hidden ${embedded ? 'bg-[#1e1e1e]' : 'bg-white'}`}>
      {header}

      <div className={`flex-1 overflow-y-auto ${embedded ? 'px-4 py-6' : 'max-w-5xl mx-auto px-6 py-10 w-full'}`}>
        <div className="flex items-center justify-between mb-8">
          <p className={`text-sm ${embedded ? 'text-slate-400' : 'text-slate-500'}`}>{workflows.length} workflows — newest first</p>
          <button
            onClick={fetchWorkflows}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition shadow-sm ${
              embedded ? 'border-[#3c3c3c] text-slate-300 hover:bg-[#2d2d2d]' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
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
              className={`rounded-2xl border p-5 shadow-sm transition ${
                embedded ? 'border-[#333] bg-[#252526] hover:border-[#444]' : 'border-slate-200 bg-white hover:shadow-md'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`font-bold ${embedded ? 'text-white' : 'text-slate-900'}`}>{w.title}</p>
                  {w.ai_agents && (
                    <p className={`text-sm mt-0.5 ${embedded ? 'text-slate-500' : 'text-slate-500'}`}>Agent: {w.ai_agents.name}</p>
                  )}
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
                  embedded ? 'bg-indigo-900/30 text-indigo-300' : 'bg-indigo-50 text-indigo-700'
                }`}>
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
          <div className={`rounded-2xl border-2 border-dashed py-16 text-center ${
            embedded ? 'border-[#333] bg-[#1e1e1e]' : 'border-slate-200 bg-slate-50'
          }`}>
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
