'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  Bot,
  Boxes,
  Brain,
  Cable,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  FileCode2,
  Globe2,
  ListChecks,
  MemoryStick,
  PlugZap,
  ShieldCheck,
  Workflow,
} from 'lucide-react';

export type StudioSpecialist = 'PARIS' | 'ELLIE' | 'LIZZY' | 'ZORA';
type Workspace = { id: string; label: string; route: string };

const AGENTS: Array<{ id: StudioSpecialist; label: string; detail: string }> = [
  { id: 'PARIS', label: 'PARIS', detail: 'Websites & pathways' },
  { id: 'ELLIE', label: 'ELLIE', detail: 'Courses & coaching' },
  { id: 'LIZZY', label: 'LIZZY', detail: 'Platform operations' },
  { id: 'ZORA', label: 'ZORA', detail: 'Compliance & evidence' },
];

const ICONS: Record<string, typeof Bot> = {
  courses: Brain,
  repository: FileCode2,
  browser: Globe2,
  workflows: Workflow,
  tasks: ListChecks,
  containers: Boxes,
  memory: MemoryStick,
  claims: ShieldCheck,
  settings: Cable,
};

const PRIMARY = new Set([
  'courses',
  'repository',
  'browser',
  'workflows',
  'tasks',
  'containers',
  'memory',
  'claims',
  'settings',
]);

export default function StudioCapabilityRail({
  workspaces,
  specialist,
  onSpecialistChange,
}: {
  workspaces: Workspace[];
  specialist: StudioSpecialist | null;
  onSpecialistChange: (agent: StudioSpecialist | null) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [plugins, setPlugins] = useState<'checking' | 'healthy' | 'degraded' | 'blocked'>(
    'checking',
  );
  const [agentCount, setAgentCount] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch('/api/admin/dev-studio/plugins/health', { cache: 'no-store' }).then(
        async (response) => ({ response, body: await response.json().catch(() => ({})) }),
      ),
      fetch('/api/admin/dev-studio/agents', { cache: 'no-store' }).then(async (response) => ({
        response,
        body: await response.json().catch(() => ({})),
      })),
    ])
      .then(([pluginResult, agentResult]) => {
        if (!active) return;
        setPlugins(
          !pluginResult.response.ok || pluginResult.body.status === 'unavailable'
            ? 'blocked'
            : pluginResult.body.status === 'degraded'
              ? 'degraded'
              : 'healthy',
        );
        const rows = Array.isArray(agentResult.body.agents)
          ? agentResult.body.agents
          : Array.isArray(agentResult.body)
            ? agentResult.body
            : [];
        setAgentCount(agentResult.response.ok ? rows.length : null);
      })
      .catch(() => {
        if (active) setPlugins('blocked');
      });
    return () => {
      active = false;
    };
  }, []);

  const visible = workspaces.filter((workspace) => PRIMARY.has(workspace.id));

  return (
    <aside
      className={`${expanded ? 'w-64' : 'w-16'} hidden shrink-0 flex-col border-r border-slate-200 bg-slate-950 text-white transition-[width] duration-200 md:flex`}
      aria-label="Studio capabilities"
    >
      <div className="flex h-12 items-center border-b border-slate-800 px-3">
        {expanded ? (
          <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-300">
            Intelligence
          </span>
        ) : null}
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="ml-auto rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
          aria-label={expanded ? 'Collapse capability sidebar' : 'Expand capability sidebar'}
        >
          {expanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
        {expanded ? (
          <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Agents {agentCount !== null ? `· ${agentCount} active` : ''}
          </p>
        ) : null}
        <div className="space-y-1">
          {AGENTS.map((agent) => {
            const selected = specialist === agent.id;
            return (
              <button
                key={agent.id}
                type="button"
                onClick={() => onSpecialistChange(selected ? null : agent.id)}
                title={`${agent.label} — ${agent.detail}`}
                className={`flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition ${selected ? 'bg-cyan-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
              >
                <Bot className="h-5 w-5 shrink-0" aria-hidden="true" />
                {expanded ? (
                  <span className="min-w-0">
                    <span className="block text-xs font-black">{agent.label}</span>
                    <span
                      className={`block truncate text-[10px] ${selected ? 'text-slate-800' : 'text-slate-500'}`}
                    >
                      {agent.detail}
                    </span>
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="my-3 border-t border-slate-800" />
        {expanded ? (
          <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Tools
          </p>
        ) : null}
        <nav className="space-y-1">
          {visible.map((workspace) => {
            const Icon = ICONS[workspace.id] ?? CircleDot;
            return (
              <Link
                key={workspace.id}
                href={workspace.route}
                title={workspace.label}
                className="flex items-center gap-3 rounded-xl px-2 py-2 text-slate-300 transition hover:bg-slate-800 hover:text-white"
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                {expanded ? (
                  <span className="truncate text-xs font-semibold">{workspace.label}</span>
                ) : null}
              </Link>
            );
          })}
        </nav>
      </div>

      <Link
        href="/studio/settings"
        className="flex items-center gap-3 border-t border-slate-800 px-4 py-3 text-slate-300 hover:bg-slate-900 hover:text-white"
        title="Connected capabilities"
      >
        {plugins === 'healthy' ? (
          <PlugZap className="h-5 w-5 shrink-0 text-emerald-400" />
        ) : (
          <Cable className="h-5 w-5 shrink-0 text-amber-400" />
        )}
        {expanded ? (
          <span className="min-w-0">
            <span className="block text-xs font-bold">Plugins & connections</span>
            <span className="block text-[10px] text-slate-500">
              {plugins === 'checking'
                ? 'Checking…'
                : plugins === 'healthy'
                  ? 'Connected'
                  : plugins === 'degraded'
                    ? 'Partially connected'
                    : 'Needs configuration'}
            </span>
          </span>
        ) : null}
      </Link>
    </aside>
  );
}
