'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { ListTodo, RefreshCw, CheckCircle, XCircle, Clock, ShieldAlert } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  requires_approval: boolean;
  approval_reason: string | null;
  ai_agents: { name: string; role: string } | null;
  created_at: string;
}

export default function TasksClient() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchTasks() {
    setLoading(true);
    try {
      const res = await fetch('/api/devstudio/tasks');
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setTasks(json.tasks ?? []);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }

  async function approveTask(id: string) {
    await fetch(`/api/devstudio/tasks/${id}/approve`, { method: 'POST' });
    fetchTasks();
  }

  async function rollbackTask(id: string) {
    await fetch(`/api/devstudio/tasks/${id}/rollback`, { method: 'POST' });
    fetchTasks();
  }

  useEffect(() => {
    fetchTasks();
  }, []);

  const STATUS_STYLES: Record<string, { icon: typeof Clock; color: string; bg: string }> = {
    pending: { icon: Clock, color: 'text-slate-500', bg: 'bg-slate-100' },
    awaiting_approval: { icon: ShieldAlert, color: 'text-amber-600', bg: 'bg-amber-50' },
    approved: { icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-50' },
    running: { icon: RefreshCw, color: 'text-blue-600', bg: 'bg-blue-50' },
    completed: { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    failed: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
    rolled_back: { icon: XCircle, color: 'text-slate-500', bg: 'bg-slate-100' },
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative h-[280px] w-full overflow-hidden">
        <Image
          src="/images/pages/admin-ai-console-hero.webp"
          alt="AI Tasks"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/80 to-fuchsia-900/60" />
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-5xl mx-auto px-6 w-full">
            <div className="flex items-center gap-3 mb-3">
              <ListTodo className="h-8 w-8 text-white/90" />
              <span className="text-xs font-semibold tracking-widest uppercase bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white">
                Task Runner
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
              AI Tasks
            </h1>
            <p className="text-purple-100 text-lg mt-2 max-w-2xl">
              Autonomous task execution with approval gating for risky operations.
            </p>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <p className="text-sm text-slate-500">{tasks.length} tasks — sorted newest first</p>
          <button
            onClick={fetchTasks}
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

        {/* Tasks Timeline */}
        <div className="relative space-y-4">
          <div className="absolute left-[23px] top-4 bottom-4 w-0.5 bg-slate-200" />
          {tasks.map((task) => {
            const style = STATUS_STYLES[task.status] ?? STATUS_STYLES.pending;
            const Icon = style.icon;
            return (
              <div key={task.id} className="relative pl-14">
                <div
                  className={`absolute left-2 top-4 flex h-10 w-10 items-center justify-center rounded-full ${style.bg} ring-4 ring-white`}
                >
                  <Icon className={`h-5 w-5 ${style.color}`} />
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900">{task.title}</p>
                      {task.ai_agents && (
                        <p className="text-sm text-slate-500 mt-0.5">
                          Agent: {task.ai_agents.name}
                        </p>
                      )}
                      {task.approval_reason && (
                        <p className="mt-2 inline-block rounded-lg bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs text-amber-700 font-medium">
                          Requires approval: {task.approval_reason}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {task.status === 'awaiting_approval' && (
                        <>
                          <button
                            onClick={() => approveTask(task.id)}
                            className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-sm"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => rollbackTask(task.id)}
                            className="rounded-full bg-red-100 px-4 py-2 text-xs font-bold text-red-700 hover:bg-red-200 transition"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
                    <span
                      className={`rounded-full px-2.5 py-0.5 font-medium capitalize ${style.bg} ${style.color}`}
                    >
                      {task.status.replace(/_/g, ' ')}
                    </span>
                    <span>{new Date(task.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {!loading && tasks.length === 0 && !error && (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 py-16 text-center">
            <ListTodo className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-3 text-sm font-medium text-slate-500">No tasks yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Integration pending: ai_tasks table migration not yet applied
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
