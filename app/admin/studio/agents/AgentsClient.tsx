'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Bot, RefreshCw } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  role: string;
  status: string;
  capabilities: string[];
  created_at: string;
}

export default function AgentsClient() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchAgents() {
    setLoading(true);
    try {
      const res = await fetch('/api/devstudio/agents');
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setAgents(json.agents ?? []);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load agents');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAgents();
  }, []);

  const STATUS_COLORS: Record<string, string> = {
    idle: 'bg-slate-400',
    active: 'bg-emerald-500',
    busy: 'bg-amber-500',
    error: 'bg-red-500',
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative h-[280px] w-full overflow-hidden">
        <Image
          src="/images/pages/admin-ai-studio-hero.webp"
          alt="AI Agents"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 to-indigo-900/60" />
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-5xl mx-auto px-6 w-full">
            <div className="flex items-center gap-3 mb-3">
              <Bot className="h-8 w-8 text-white/90" />
              <span className="text-xs font-semibold tracking-widest uppercase bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white">
                AI Workforce
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
              AI Agents
            </h1>
            <p className="text-blue-100 text-lg mt-2 max-w-2xl">
              10 autonomous agents powering the Elevate Dev Studio — from code generation to
              compliance.
            </p>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <p className="text-sm text-slate-500">{agents.length} agents registered</p>
          <button
            onClick={fetchAgents}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition shadow-sm"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 mb-6">
            {error}
          </div>
        )}

        {/* Agent Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="group relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all duration-200"
            >
              <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition" />
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100">
                    <Bot className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{agent.name}</p>
                    <p className="text-xs text-slate-500 capitalize">
                      {agent.role?.replace(/_/g, ' ') ?? agent.slug ?? 'Agent'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${STATUS_COLORS[agent.status] ?? 'bg-slate-400'} ${agent.status === 'active' || agent.status === 'busy' ? 'animate-pulse' : ''}`}
                  />
                  <span className="text-[11px] font-medium text-slate-500 capitalize">
                    {agent.status}
                  </span>
                </div>
              </div>
              {agent.capabilities?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {agent.capabilities.map((c) => (
                    <span
                      key={c}
                      className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-medium text-slate-600"
                    >
                      {c.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              )}
              <p className="text-[10px] text-slate-400 mt-4">
                Added {new Date(agent.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>

        {!loading && agents.length === 0 && !error && (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 py-16 text-center">
            <Bot className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-3 text-sm font-medium text-slate-500">No agents found</p>
            <p className="text-xs text-slate-400 mt-1">
              Integration pending: ai_agents table migration not yet applied
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
