'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Brain, RefreshCw, Plus } from 'lucide-react';

interface Memory {
  id: string;
  agent_id: string | null;
  category: string;
  key: string;
  value: string;
  updated_at: string;
}

export default function MemoryClient() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  async function fetchMemories() {
    setLoading(true);
    try {
      const res = await fetch('/api/devstudio/memory');
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setMemories(json.memories ?? []);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  async function addMemory() {
    if (!newKey || !newValue) return;
    await fetch('/api/devstudio/memory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: newKey, value: newValue, category: 'manual' }),
    });
    setNewKey('');
    setNewValue('');
    fetchMemories();
  }

  useEffect(() => {
    fetchMemories();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="relative h-[280px] w-full overflow-hidden">
        <Image
          src="/images/pages/admin-advanced-tools-hero.webp"
          alt="AI Memory"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-teal-900/80 to-cyan-900/60" />
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-5xl mx-auto px-6 w-full">
            <div className="flex items-center gap-3 mb-3">
              <Brain className="h-8 w-8 text-white/90" />
              <span className="text-xs font-semibold tracking-widest uppercase bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white">
                Knowledge Store
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
              AI Memory
            </h1>
            <p className="text-teal-100 text-lg mt-2 max-w-2xl">
              Persistent knowledge base for AI agents — store context, decisions, and learned
              patterns.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Add form */}
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-teal-50 to-white p-6 shadow-sm mb-8">
          <p className="text-sm font-bold text-slate-900 mb-3">Store New Memory</p>
          <div className="flex gap-3">
            <input
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              placeholder="Key"
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
            />
            <input
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="Value"
              className="flex-[2] rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
            />
            <button
              onClick={addMemory}
              className="inline-flex items-center gap-2 rounded-full bg-teal-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-teal-700 transition shadow-sm"
            >
              <Plus className="h-4 w-4" /> Store
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-slate-500">{memories.length} memories — newest first</p>
          <button
            onClick={fetchMemories}
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
          {memories.map((m) => (
            <div
              key={m.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-sm font-bold text-teal-700">{m.key}</span>
                <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-[10px] font-medium text-teal-600 capitalize">
                  {m.category}
                </span>
              </div>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{m.value}</p>
              <p className="text-[10px] text-slate-400 mt-3">
                {new Date(m.updated_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>

        {!loading && memories.length === 0 && !error && (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 py-16 text-center">
            <Brain className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-3 text-sm font-medium text-slate-500">No memories stored yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Integration pending: ai_memory table migration not yet applied
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
