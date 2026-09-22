'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  Bot,
  Eye,
  Globe2,
  LayoutDashboard,
  MessageSquare,
  PanelRightOpen,
  Maximize2,
  Minimize2,
  Phone,
  Plus,
} from 'lucide-react';
import UnifiedEllieChat from './UnifiedEllieChat';
import RepositoryLivePreview from './RepositoryLivePreview';
import type { OrchestratedPlanCheckpoint } from '@/lib/devstudio/ellie-unified-handlers';

const CloudBrowserWorkspace = dynamic(() => import('./CloudBrowserWorkspace'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-slate-950 text-sm text-slate-400">
      Connecting isolated browser…
    </div>
  ),
});
const WorkflowsWorkspace = dynamic(
  () => import('@/apps/admin/app/studio/workflows/WorkflowsClient'),
  { ssr: false },
);
const IntelligenceWorkspace = dynamic(() => import('./StudioIntelligencePanel'), { ssr: false });
const TasksWorkspace = dynamic(() => import('@/apps/admin/app/studio/tasks/TasksClient'), {
  ssr: false,
});

type StudioSurface = 'commands' | 'course' | 'preview' | 'browser' | 'capability';
type NativeCapability = 'workflows' | 'intelligence' | 'tasks' | 'browser';

function isNativeCapability(id: string): id is NativeCapability {
  return id === 'workflows' || id === 'intelligence' || id === 'tasks' || id === 'browser';
}

export function buildConversationWorkspaceUrl(
  route: string,
  conversationId: string | null,
  taskId: string | null,
) {
  const url = new URL(route, 'https://admin.elevateforhumanity.org');
  url.searchParams.set('embedded', 'studio');
  if (conversationId) url.searchParams.set('studioConversationId', conversationId);
  if (taskId) url.searchParams.set('studioTaskId', taskId);
  return `${url.pathname}${url.search}${url.hash}`;
}

function checkpointStatus(status: string): OrchestratedPlanCheckpoint['status'] {
  if (status === 'completed') return 'done';
  if (status === 'failed') return 'failed';
  if (status === 'awaiting_approval') return 'awaiting_approval';
  return 'running';
}

export default function StudioCommandWorkspace({
  workspaces,
  initialWorkspace,
}: {
  workspaces: Array<{ id: string; label: string; route: string }>;
  initialWorkspace?: string;
}) {
  const [conversationKey, setConversationKey] = useState(0);
  const [surface, setSurface] = useState<StudioSurface>(
    initialWorkspace ? 'capability' : 'commands',
  );
  const [previewUrl, setPreviewUrl] = useState('');
  const [browserTarget, setBrowserTarget] = useState('');
  const [browserCommand, setBrowserCommand] = useState('');
  const [activeTask, setActiveTask] = useState<OrchestratedPlanCheckpoint | null>(null);
  const [activeCapability, setActiveCapability] = useState<string | null>(initialWorkspace ?? null);
  const [suggestedPrompt, setSuggestedPrompt] = useState('');
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [focusMode, setFocusMode] = useState(false);

  const courseBuilderUrl = useMemo(
    () =>
      `https://admin.elevateforhumanity.org${buildConversationWorkspaceUrl('/studio/courses', activeConversationId, activeTask?.taskId ?? null)}`,
    [activeConversationId, activeTask?.taskId],
  );

  useEffect(() => {
    if (!activeConversationId) return;
    const controller = new AbortController();
    void fetch(
      `/api/admin/dev-studio/tasks?conversationId=${encodeURIComponent(activeConversationId)}&limit=20`,
      { cache: 'no-store', signal: controller.signal },
    )
      .then((response) =>
        response.ok ? response.json() : Promise.reject(new Error('Task restore failed')),
      )
      .then((payload) => {
        const tasks = Array.isArray(payload.tasks) ? payload.tasks : [];
        const current = tasks.find((task: Record<string, unknown>) =>
          ['running', 'awaiting_approval', 'planning'].includes(String(task.status ?? '')),
        );
        if (!current) return;
        setActiveTask({
          planId: String(current.trace_id ?? '').split(':')[0] || 'restored',
          taskId: String(current.id),
          runId: current.studio_run_id ? String(current.studio_run_id) : undefined,
          title: current.title ? String(current.title) : undefined,
          reason: current.approval_reason ? String(current.approval_reason) : undefined,
          status: checkpointStatus(String(current.status ?? 'running')),
        });
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
      });
    return () => controller.abort();
  }, [activeConversationId]);

  const openPreview = (url?: string) => {
    if (url) setPreviewUrl(url);
    setActiveCapability(null);
    setSurface('preview');
  };
  const askAdminAI = (prompt: string) => {
    setSuggestedPrompt(prompt);
    setActiveCapability(null);
    setSurface('commands');
  };
  const handleCommandStart = (command: string) => {
    setActiveCapability(null);
    const explicitUrl = command.match(/https?:\/\/[^\s"'<>]+/i)?.[0]?.replace(/[),.;]+$/, '') ?? '';
    const browserIntent =
      Boolean(explicitUrl) || /\b(envato|browser|website|download|sign[ -]?in)\b/i.test(command);
    setBrowserTarget(
      explicitUrl || (/\benvato\b/i.test(command) ? 'https://app.envato.com' : ''),
    );
    setBrowserCommand(browserIntent ? command : '');
    setSurface(
      browserIntent
        ? 'browser'
        : /\b(course|lesson|curriculum|quiz|assessment|learning object|media)\b/i.test(command)
          ? 'course'
          : 'browser',
    );
  };

  const activeWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.id === activeCapability) ?? null,
    [activeCapability, workspaces],
  );
  const mountedWorkspaceUrl = useMemo(() => {
    if (!activeWorkspace || isNativeCapability(activeWorkspace.id)) return null;
    return buildConversationWorkspaceUrl(
      activeWorkspace.route,
      activeConversationId,
      activeTask?.taskId ?? null,
    );
  }, [activeConversationId, activeTask?.taskId, activeWorkspace]);
  const openCapability = (id: string) => {
    if (!workspaces.some((workspace) => workspace.id === id)) return;
    setActiveCapability(id);
    setSurface('capability');
  };

  return (
    <div
      data-studio-root="unified"
      className={`flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-white ${focusMode ? 'fixed inset-0 z-[100] h-[100dvh] w-screen' : ''}`}
    >
      <header className="shrink-0 border-b-4 border-brand-red-600 bg-brand-blue-700 text-white shadow-sm">
        <div className="flex min-h-14 min-w-0 items-center gap-2 px-3 sm:px-5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25">
            <Bot className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 shrink-0">
            <span className="block text-sm font-black tracking-tight">Elevate Studio</span>
            <span className="hidden text-[10px] font-semibold text-blue-100 sm:block">
              Build, inspect, and operate
            </span>
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-1">
            <Link
              href="/dashboard"
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-white/20 px-2.5 text-xs font-bold hover:bg-white/10 sm:px-3"
              aria-label="Open admin dashboard"
            >
              <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
              <span className="hidden min-[430px]:inline">Dashboard</span>
            </Link>
            <Link
              href="/phone"
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-white/20 px-2.5 text-xs font-bold hover:bg-white/10 sm:px-3"
              aria-label="Open phone system"
            >
              <Phone className="h-4 w-4" aria-hidden="true" />
              <span className="hidden min-[430px]:inline">Phone</span>
            </Link>
          </div>
          <button
            type="button"
            onClick={() => {
              setConversationKey((value) => value + 1);
              setActiveConversationId(null);
              setActiveTask(null);
              setActiveCapability(null);
              setPreviewUrl('');
              setBrowserTarget('');
              setSurface('commands');
            }}
            className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg border border-white/20 px-2.5 text-xs font-bold hover:bg-white/10 sm:px-3"
          >
            <Plus className="h-4 w-4" aria-hidden="true" /> New task
          </button>
          <div className="hidden rounded-lg bg-white/10 px-3 py-2 text-xs font-black text-white sm:block">
            Automated workflow
          </div>
        </div>
        <nav
          aria-label="Command workflow"
          className="flex min-w-0 items-center gap-1 overflow-x-auto border-t border-white/10 px-2 py-1.5"
        >
          <button
            type="button"
            onClick={() => {
              setActiveCapability(null);
              setSurface('commands');
            }}
            aria-pressed={surface === 'commands'}
            className={`inline-flex min-h-9 shrink-0 items-center gap-2 rounded-lg px-3 text-xs font-bold ${surface === 'commands' ? 'bg-white text-brand-blue-800' : 'bg-white/10 text-white hover:bg-white/15'}`}
          >
            <MessageSquare className="h-4 w-4" aria-hidden="true" /> Commands
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveCapability(null);
              setSurface('course');
            }}
            aria-pressed={surface === 'course'}
            className={`inline-flex min-h-9 shrink-0 items-center gap-2 rounded-lg px-3 text-xs font-bold ${surface === 'course' ? 'bg-white text-brand-blue-800' : 'bg-white/10 text-white hover:bg-white/15'}`}
          >
            <PanelRightOpen className="h-4 w-4" aria-hidden="true" /> Course Builder live
          </button>
          <span className="ml-2 hidden text-[11px] font-semibold text-blue-100 sm:inline">
            One workspace · governed workflow · verified evidence
          </span>
        </nav>
      </header>

      <main className="min-h-0 min-w-0 flex-1 overflow-hidden" aria-label="Studio workspace">
        <section
          className={surface === 'commands' ? 'flex h-full min-h-0 min-w-0 flex-col' : 'hidden'}
          aria-label="Elevate Studio conversation"
        >
          <UnifiedEllieChat
            key={conversationKey}
            embedded
            onOpenPreview={() => openPreview()}
            onPreviewTarget={openPreview}
            onTaskCheckpoint={setActiveTask}
            onCommandStart={handleCommandStart}
            onOpenTasks={() => openCapability('tasks')}
            suggestedPrompt={suggestedPrompt}
            restoreLatest={conversationKey === 0}
            onConversationChange={setActiveConversationId}
          />
        </section>

        <section
          className={
            surface === 'commands' ? 'hidden' : 'flex h-full min-h-0 min-w-0 flex-col bg-slate-950'
          }
          aria-label="Active Studio tool"
        >
          <header className="flex min-h-12 shrink-0 items-center gap-2 overflow-x-auto border-b border-slate-800 bg-slate-900 px-3 text-white">
            <span className="mr-auto shrink-0 text-xs font-black">
              {activeWorkspace?.label ??
                (surface === 'course' ? 'Course Builder' : 'Active run tools')}
            </span>
            <button
              type="button"
              aria-pressed={surface === 'preview' || surface === 'course'}
              onClick={() => {
                setActiveCapability(null);
                setSurface(previewUrl ? 'preview' : 'course');
              }}
              className={`inline-flex shrink-0 items-center gap-1 rounded-md px-3 py-2 text-xs font-bold ${surface === 'preview' || surface === 'course' ? 'bg-cyan-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <Eye className="h-4 w-4" aria-hidden="true" /> Preview
            </button>
            <button
              type="button"
              aria-pressed={surface === 'browser'}
              onClick={() => {
                setActiveCapability(null);
                setSurface('browser');
              }}
              className={`inline-flex shrink-0 items-center gap-1 rounded-md px-3 py-2 text-xs font-bold ${surface === 'browser' ? 'bg-violet-500 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <Globe2 className="h-4 w-4" aria-hidden="true" /> Browser
            </button>
            <button
              type="button"
              onClick={() => setFocusMode((value) => !value)}
              className="inline-flex shrink-0 items-center gap-1 rounded-md px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-800"
              aria-label={focusMode ? 'Exit full screen workspace' : 'Expand workspace to full screen'}
            >
              {focusMode ? <Minimize2 className="h-4 w-4" aria-hidden="true" /> : <Maximize2 className="h-4 w-4" aria-hidden="true" />}
              {focusMode ? 'Exit full screen' : 'Full screen'}
            </button>
            <button
              type="button"
              onClick={() => setSurface('commands')}
              className="shrink-0 rounded-md px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-800"
            >
              Commands
            </button>
          </header>
          <div className={`min-h-0 min-w-0 flex-1 overflow-hidden ${focusMode ? 'p-0' : 'p-0 sm:p-2'}`}>
            <div
              className={
                surface === 'capability' && activeCapability === 'workflows' ? 'h-full' : 'hidden'
              }
            >
              <WorkflowsWorkspace embedded />
            </div>
            <div
              className={
                surface === 'capability' && activeCapability === 'intelligence'
                  ? 'h-full'
                  : 'hidden'
              }
            >
              <IntelligenceWorkspace onAskAI={askAdminAI} />
            </div>
            <div
              className={
                surface === 'capability' && activeCapability === 'tasks' ? 'h-full' : 'hidden'
              }
            >
              <TasksWorkspace embedded conversationId={activeConversationId} />
            </div>
            <div
              className={
                surface === 'capability' && activeCapability === 'browser' ? 'h-full' : 'hidden'
              }
            >
              <CloudBrowserWorkspace
                unifiedTask={activeTask}
                conversationId={activeConversationId}
                autoStart={surface === 'capability' && activeCapability === 'browser'}
                initialTarget={browserTarget}
                initialTask={browserCommand}
                autoRunTask={surface === 'capability' && activeCapability === 'browser'}
              />
            </div>
            <div
              className={
                surface === 'capability' && activeCapability && mountedWorkspaceUrl
                  ? 'h-full'
                  : 'hidden'
              }
            >
              {mountedWorkspaceUrl ? (
                <RepositoryLivePreview
                  filePath={null}
                  content=""
                  initialUrl={`https://admin.elevateforhumanity.org${mountedWorkspaceUrl}`}
                  trustedInteractive
                  allowManualTarget={false}
                  allowExternalOpen={false}
                  targetLabel="Active capability"
                />
              ) : null}
            </div>
            <div className={surface === 'course' ? 'h-full' : 'hidden'}>
              <RepositoryLivePreview
                filePath={null}
                content=""
                initialUrl={courseBuilderUrl}
                trustedInteractive
                allowManualTarget={false}
                allowExternalOpen={false}
                targetLabel="Course Builder · active conversation"
              />
            </div>
            <div className={surface === 'preview' ? 'h-full' : 'hidden'}>
              <RepositoryLivePreview
                filePath={null}
                content=""
                initialUrl={previewUrl || courseBuilderUrl}
                trustedInteractive
                allowManualTarget={false}
                allowExternalOpen={Boolean(activeTask?.runId)}
                targetLabel="Active run preview"
              />
            </div>
            <div className={surface === 'browser' ? 'h-full' : 'hidden'}>
              <CloudBrowserWorkspace
                unifiedTask={activeTask}
                conversationId={activeConversationId}
                autoStart={surface === 'browser'}
                initialTarget={browserTarget}
                initialTask={browserCommand}
                autoRunTask={surface === 'browser'}
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
