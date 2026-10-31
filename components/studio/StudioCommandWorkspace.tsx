'use client';

import { coursePreviewTarget } from '@/lib/studio/course-preview-target';

import dynamic from 'next/dynamic';
import ParisSupervisionPanel from '@/components/admin/ParisSupervisionPanel';
import { CommunicationTodos } from '@/components/communications/CommunicationTodos';
import '@/apps/admin/styles/studio-mobile-safety.css';
import Link from 'next/link';
import { useEffect, useId, useMemo, useState } from 'react';
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
  Menu,
  X,
} from 'lucide-react';
import UnifiedEllieChat from './UnifiedEllieChat';
import { ResizableWorkspace } from './ResizableWorkspace';
import { useStudioViewport } from './useStudioViewport';
import RepositoryLivePreview from './RepositoryLivePreview';
import StudioCapabilityRail from './StudioCapabilityRail';
import type { OrchestratedPlanCheckpoint } from '@/lib/devstudio/ellie-unified-handlers';

const CloudBrowserWorkspace = dynamic(() => import('./CloudBrowserWorkspace'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-white text-sm text-slate-600">
      Connecting isolated browser…
    </div>
  ),
});
const WorkflowsWorkspace = dynamic(
  () => import('@/apps/admin/app/studio/workflows/WorkflowsClient'),
  { ssr: false },
);
const IntelligenceWorkspace = dynamic(() => import('./StudioIntelligencePanel'), {
  ssr: false,
});
const TasksWorkspace = dynamic(() => import('@/apps/admin/app/studio/tasks/TasksClient'), {
  ssr: false,
});
const UnifiedCourseBuilder = dynamic(
  () => import('@/components/admin/course-builder/UnifiedCourseBuilder'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-white text-sm text-slate-600">
        Loading Course Builder…
      </div>
    ),
  },
);

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
  const attachmentInputId = useId();
  const [conversationKey, setConversationKey] = useState(0);
  const [surface, setSurface] = useState<StudioSurface>(
    initialWorkspace === 'browser'
      ? 'browser'
      : initialWorkspace === 'courses'
        ? 'course'
        : initialWorkspace
          ? 'capability'
          : 'commands',
  );
  const [lastSurface, setLastSurface] = useState<StudioSurface>('browser');
  useEffect(() => {
    if (surface !== 'commands') setLastSurface(surface);
  }, [surface]);
  const [previewUrl, setPreviewUrl] = useState('');
  const [browserTarget, setBrowserTarget] = useState('');
  const [browserCommand, setBrowserCommand] = useState('');
  const [activeTask, setActiveTask] = useState<OrchestratedPlanCheckpoint | null>(null);
  const [activeCapability, setActiveCapability] = useState<string | null>(
    initialWorkspace === 'browser' || initialWorkspace === 'courses'
      ? null
      : (initialWorkspace ?? null),
  );
  const [visitedTools, setVisitedTools] = useState<Set<string>>(() => new Set());
  const currentTool = surface === 'capability' ? activeCapability : surface;
  useEffect(() => {
    if (!currentTool || currentTool === 'commands') return;
    setVisitedTools((visited) =>
      visited.has(currentTool) ? visited : new Set([...visited, currentTool]),
    );
  }, [currentTool]);
  const hasOpenedTool = (tool: string) => currentTool === tool || visitedTools.has(tool);
  const [suggestedPrompt, setSuggestedPrompt] = useState('');
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const viewportStyle = useStudioViewport();
  const [focusMode, setFocusMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Array<{ id: string; title: string }>>([]);
  const [historyError, setHistoryError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    void fetch('/api/admin/dev-studio/conversations?summary=1', {
      cache: 'no-store',
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('Could not load saved conversations.');
        const payload = await response.json();
        setConversations(Array.isArray(payload.conversations) ? payload.conversations : []);
        setHistoryError('');
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setHistoryError(
            error instanceof Error ? error.message : 'Could not load saved conversations.',
          );
      });
    return () => controller.abort();
  }, [activeConversationId]);

  useEffect(() => {
    if (surface === 'course') setFocusMode(true);
  }, [surface]);

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
    setBrowserTarget(explicitUrl || (/\benvato\b/i.test(command) ? 'https://app.envato.com' : ''));
    setBrowserCommand(browserIntent ? command : '');
    setSurface('commands');
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
    if (id === 'courses') {
      setActiveCapability(null);
      setSurface('course');
      return;
    }
    if (id === 'browser') {
      setActiveCapability(null);
      setSurface('browser');
      return;
    }
    setActiveCapability(id);
    setSurface('capability');
  };

  return (
    <div
      data-studio-root="unified"
      className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-white"
      style={
        viewportStyle ??
        (focusMode
          ? {
              position: 'fixed',
              inset: 0,
              zIndex: 100,
              width: '100vw',
              height: '100dvh',
            }
          : undefined)
      }
    >
      <header className="shrink-0 border-b border-slate-200 bg-white text-slate-950">
        <div className="flex min-h-14 min-w-0 flex-wrap items-center gap-1 px-2 sm:gap-2 sm:px-5">
          <button
            type="button"
            onClick={() => setSidebarOpen((value) => !value)}
            aria-label={sidebarOpen ? 'Close Studio sidebar' : 'Open Studio sidebar'}
            aria-expanded={sidebarOpen}
            className="min-h-11 min-w-11 rounded-lg p-2 text-slate-700"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <span className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-blue-50 sm:flex text-brand-blue-700">
            <Bot className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1 basis-3/4 sm:basis-auto">
            <span className="block truncate text-xl font-black tracking-tight sm:text-2xl">
              Elevate Studio
            </span>
            <span className="hidden text-sm font-semibold text-slate-500 sm:block">
              Build, inspect, and operate
            </span>
          </div>
          <label
            htmlFor={attachmentInputId}
            className="inline-flex min-h-11 shrink-0 cursor-pointer items-center rounded-lg border border-slate-300 bg-white px-3 text-base font-bold text-slate-900 hover:bg-slate-100"
          >
            Upload files
          </label>
          <div className="ml-auto flex shrink-0 items-center gap-1">
            <Link
              href="/dashboard"
              className="inline-flex min-h-11 min-w-11 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-base font-bold hover:bg-slate-100 sm:px-3"
              aria-label="Open admin dashboard"
            >
              <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
              <span className="hidden min-[430px]:inline">Dashboard</span>
            </Link>
            <Link
              href="/phone"
              className="inline-flex min-h-11 min-w-11 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-base font-bold hover:bg-slate-100 sm:px-3"
              aria-label="Open phone system"
            >
              <Phone className="h-4 w-4" aria-hidden="true" />
              <span className="hidden min-[430px]:inline">Phone</span>
            </Link>
          </div>
          <button
            type="button"
            aria-label="New task"
            onClick={() => {
              setConversationKey((value) => value + 1);
              setSelectedConversationId(null);
              setActiveConversationId(null);
              setActiveTask(null);
              setActiveCapability(null);
              setPreviewUrl('');
              setBrowserTarget('');
              setSurface('commands');
            }}
            className="inline-flex min-h-11 min-w-11 shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-base font-bold hover:bg-slate-100 sm:px-3"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />{' '}
            <span className="hidden min-[430px]:inline">New task</span>
          </button>
        </div>
        <nav
          aria-label="Studio modes"
          className="flex min-w-0 items-center gap-1 overflow-x-auto border-t border-slate-100 px-2 py-1.5"
        >
          <button
            type="button"
            onClick={() => {
              setActiveCapability(null);
              setSurface('commands');
            }}
            aria-pressed={surface === 'commands'}
            className={`inline-flex min-h-11 min-w-11 shrink-0 items-center gap-2 rounded-lg px-3 text-base font-bold ${surface === 'commands' ? 'bg-slate-100 text-slate-950' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <MessageSquare className="h-4 w-4" aria-hidden="true" /> Chat
          </button>
          <button
            type="button"
            onClick={() => {
              setSurface(lastSurface);
            }}
            aria-pressed={surface !== 'commands'}
            className={`inline-flex min-h-11 min-w-11 shrink-0 items-center gap-2 rounded-lg px-3 text-base font-bold ${surface !== 'commands' ? 'bg-slate-100 text-slate-950' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <PanelRightOpen className="h-4 w-4" aria-hidden="true" /> Work
          </button>
          <button
            type="button"
            aria-expanded={toolsOpen}
            aria-controls="studio-tool-navigation"
            onClick={() => setToolsOpen((open) => !open)}
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg px-3 text-base font-bold text-slate-700 hover:bg-slate-100"
          >
            <Menu className="h-4 w-4" aria-hidden="true" /> Tools
          </button>
          <span className="ml-2 hidden text-sm font-semibold text-slate-500 sm:inline">
            One workspace · governed workflow · verified evidence
          </span>
        </nav>
        <nav
          hidden={!toolsOpen}
          id="studio-tool-navigation"
          aria-label="Studio tools"
          className={`${toolsOpen ? 'flex' : 'hidden'} min-w-0 gap-1 overflow-x-auto overscroll-x-contain border-t border-slate-200 bg-white px-2 py-1 [scrollbar-width:thin]`}
        >
          {workspaces.map((workspace) => (
            <button
              type="button"
              key={workspace.id}
              onClick={() => {
                openCapability(workspace.id);
                setToolsOpen(false);
              }}
              aria-pressed={
                currentTool === workspace.id || (workspace.id === 'courses' && surface === 'course')
              }
              className={`inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-lg px-3 text-base font-bold ${currentTool === workspace.id || (workspace.id === 'courses' && surface === 'course') ? 'bg-slate-900 text-white' : 'text-slate-800 hover:bg-slate-100'}`}
            >
              {workspace.label}
            </button>
          ))}
        </nav>
      </header>

      <div className="relative flex min-h-0 min-w-0 flex-1 overflow-hidden">
        <div
          className={
            sidebarOpen
              ? 'absolute inset-y-0 left-0 z-20 h-full shadow-xl md:relative md:shadow-none'
              : 'hidden h-full md:block'
          }
        >
          <StudioCapabilityRail
            workspaces={workspaces}
            mobile={sidebarOpen}
            activeWorkspaceId={
              surface === 'course'
                ? 'courses'
                : surface === 'browser'
                  ? 'browser'
                  : activeCapability
            }
            onNavigate={() => setSidebarOpen(false)}
            onOpenWorkspace={openCapability}
          >
            <nav aria-label="Saved Studio conversations" className="mb-4 space-y-1">
              <CommunicationTodos inboxPath="/phone/email" />
              <p className="px-2 py-2 text-xs font-semibold text-slate-700">Your conversations</p>
              {historyError ? (
                <p role="alert" className="px-2 text-xs text-amber-300">
                  {historyError}
                </p>
              ) : null}
              {conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  type="button"
                  aria-current={activeConversationId === conversation.id ? 'page' : undefined}
                  onClick={() => {
                    setSelectedConversationId(conversation.id);
                    setActiveConversationId(null);
                    setActiveTask(null);
                    setConversationKey((value) => value + 1);
                    setSurface('commands');
                    setSidebarOpen(false);
                  }}
                  className="block w-full truncate rounded-lg px-2 py-2 text-left text-xs text-slate-700 hover:bg-slate-200 disabled:opacity-50"
                  title={conversation.title}
                >
                  {conversation.title || 'Untitled conversation'}
                </button>
              ))}
            </nav>
          </StudioCapabilityRail>
        </div>
        <main className="min-h-0 min-w-0 flex-1 overflow-hidden" aria-label="Studio workspace">
          <ResizableWorkspace
            mobileExclusive
            hideClosedToolbar
            initialPanelSize={65}
            className="h-full"
            title="Studio side panel"
            open={surface !== 'commands'}
            onOpenChange={(open) => setSurface(open ? lastSurface : 'commands')}
            panel={
              <section
                className={
                  surface === 'commands'
                    ? 'hidden'
                    : 'flex h-full min-h-0 min-w-0 flex-col bg-white'
                }
                aria-label="Active Studio tool"
              >
                <header className="flex min-h-12 shrink-0 flex-wrap items-center gap-1.5 border-b border-slate-200 bg-slate-50 px-2 py-2 text-slate-950 sm:flex-nowrap sm:gap-2 sm:px-3">
                  <span className="min-w-0 basis-full truncate text-base font-black sm:mr-auto sm:basis-auto">
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
                    className={`inline-flex min-h-11 flex-1 items-center justify-center gap-1 rounded-md px-2 py-2 text-base font-bold sm:min-h-0 sm:flex-none sm:px-3 ${surface === 'preview' || surface === 'course' ? 'bg-cyan-500 text-slate-950' : 'text-slate-700 hover:bg-slate-200'}`}
                  >
                    <Eye className="h-4 w-4" aria-hidden="true" />{' '}
                    {previewUrl ? 'Preview' : 'Course Builder'}
                  </button>
                  <button
                    type="button"
                    aria-pressed={surface === 'browser'}
                    onClick={() => {
                      setActiveCapability(null);
                      setSurface('browser');
                    }}
                    className={`inline-flex shrink-0 items-center gap-1 rounded-md px-3 py-2 text-base font-bold ${surface === 'browser' ? 'bg-violet-500 text-white' : 'text-slate-700 hover:bg-slate-200'}`}
                  >
                    <Globe2 className="h-4 w-4" aria-hidden="true" /> Browser
                  </button>
                  <button
                    type="button"
                    onClick={() => setFocusMode((value) => !value)}
                    className="inline-flex min-h-11 flex-1 items-center justify-center gap-1 rounded-md px-2 py-2 text-base font-bold text-slate-700 hover:bg-slate-200 sm:min-h-0 sm:flex-none sm:px-3"
                    aria-label={
                      focusMode ? 'Exit full screen workspace' : 'Expand workspace to full screen'
                    }
                  >
                    {focusMode ? (
                      <Minimize2 className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Maximize2 className="h-4 w-4" aria-hidden="true" />
                    )}
                    <span className="hidden sm:inline">
                      {focusMode ? 'Exit full screen' : 'Full screen'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSurface('commands')}
                    className="min-h-11 flex-1 rounded-md px-2 py-2 text-base font-bold text-slate-700 hover:bg-slate-200 sm:min-h-0 sm:flex-none sm:px-3"
                  >
                    Chat
                  </button>
                </header>
                <div
                  className={`min-h-0 min-w-0 flex-1 overflow-hidden ${focusMode ? 'p-0' : 'p-0 sm:p-2'}`}
                >
                  <div
                    className={
                      surface === 'capability' && activeCapability === 'workflows'
                        ? 'h-full'
                        : 'hidden'
                    }
                  >
                    {hasOpenedTool('workflows') ? <WorkflowsWorkspace embedded /> : null}
                  </div>
                  <div
                    className={
                      surface === 'capability' && activeCapability === 'intelligence'
                        ? 'h-full'
                        : 'hidden'
                    }
                  >
                    {hasOpenedTool('intelligence') ? (
                      <IntelligenceWorkspace onAskAI={askAdminAI} />
                    ) : null}
                  </div>
                  <div
                    className={
                      surface === 'capability' && activeCapability === 'tasks' ? 'h-full' : 'hidden'
                    }
                  >
                    {hasOpenedTool('tasks') ? (
                      <TasksWorkspace embedded conversationId={activeConversationId} />
                    ) : null}
                  </div>
                  <div
                    className={
                      surface === 'capability' && activeCapability && mountedWorkspaceUrl
                        ? 'h-full'
                        : 'hidden'
                    }
                  >
                    {activeCapability === 'health' && (
                      <details className="border-b border-slate-200 p-3">
                        <summary className="cursor-pointer font-semibold">
                          PARIS execution and recovery evidence
                        </summary>
                        <ParisSupervisionPanel active={surface === 'capability'} />
                      </details>
                    )}
                    {mountedWorkspaceUrl ? (
                      <RepositoryLivePreview
                        filePath={null}
                        content=""
                        initialUrl={mountedWorkspaceUrl}
                        trustedInteractive
                        allowManualTarget={false}
                        allowExternalOpen={false}
                        targetLabel="Active capability"
                      />
                    ) : null}
                  </div>
                  <div className={surface === 'course' ? 'h-full' : 'hidden'}>
                    {hasOpenedTool('course') ? <UnifiedCourseBuilder embedded /> : null}
                  </div>
                  <div className={surface === 'preview' ? 'h-full' : 'hidden'}>
                    {hasOpenedTool('preview') ? (
                      <RepositoryLivePreview
                        filePath={null}
                        content=""
                        initialUrl={previewUrl || courseBuilderUrl}
                        trustedInteractive
                        allowManualTarget={false}
                        allowExternalOpen={Boolean(activeTask?.runId)}
                        targetLabel="Active run preview"
                      />
                    ) : null}
                  </div>
                  <div className={surface === 'browser' ? 'h-full' : 'hidden'}>
                    {hasOpenedTool('browser') ? (
                      <CloudBrowserWorkspace
                        unifiedTask={activeTask}
                        conversationId={activeConversationId}
                        autoStart={surface === 'browser'}
                        initialTarget={browserTarget}
                        initialTask={browserCommand}
                        autoRunTask={surface === 'browser'}
                      />
                    ) : null}
                  </div>
                </div>
              </section>
            }
          >
            <section
              className="flex h-full min-h-0 min-w-0 flex-col"
              aria-label="Elevate Studio conversation"
            >
              <UnifiedEllieChat
                key={conversationKey}
                embedded
                attachmentInputId={attachmentInputId}
                onOpenPreview={() => openPreview()}
                onPreviewTarget={openPreview}
                onCourseResult={(courseId, lessonId) => {
                  const target = coursePreviewTarget(courseId, lessonId);
                  if (target) openPreview(target);
                }}
                onTaskCheckpoint={setActiveTask}
                onCommandStart={handleCommandStart}
                onOpenTasks={() => openCapability('tasks')}
                suggestedPrompt={suggestedPrompt}
                restoreLatest={conversationKey === 0}
                selectedConversationId={selectedConversationId}
                restoredCheckpoint={activeTask}
                onConversationChange={setActiveConversationId}
              />
            </section>
          </ResizableWorkspace>
        </main>
      </div>
    </div>
  );
}
