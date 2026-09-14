'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import {
  Bot,
  Eye,
  Globe2,
  MessageSquare,
  PanelRightClose,
  PanelRightOpen,
  Plus,
} from 'lucide-react';
import UnifiedEllieChat from './UnifiedEllieChat';
import RepositoryLivePreview from './RepositoryLivePreview';
import type { StudioSpecialist } from '@/lib/devstudio/ellie-unified-handlers';
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

type InspectionMode = 'preview' | 'browser';
type EmbeddedCapability = 'workflows' | 'intelligence' | 'tasks';

function isEmbeddedCapability(id: string): id is EmbeddedCapability {
  return id === 'workflows' || id === 'intelligence' || id === 'tasks';
}

export default function StudioCommandWorkspace({
  workspaces,
  initialWorkspace,
}: {
  workspaces: Array<{ id: string; label: string; route: string }>;
  initialWorkspace?: EmbeddedCapability;
}) {
  const [conversationKey, setConversationKey] = useState(0);
  const [selectedAgent, setSelectedAgent] = useState<StudioSpecialist>('LIZZY');
  const [mode, setMode] = useState<InspectionMode>('browser');
  const [previewUrl, setPreviewUrl] = useState('https://admin.elevateforhumanity.org/dashboard');
  // Mobile must open on the command composer. The browser remains one tap away
  // and receives the same active task context after submission.
  const [mobileSurface, setMobileSurface] = useState<'chat' | 'tool'>('chat');
  const [activeTask, setActiveTask] = useState<OrchestratedPlanCheckpoint | null>(null);
  const [activeCapability, setActiveCapability] = useState<EmbeddedCapability | null>(
    initialWorkspace ?? null,
  );
  const [suggestedPrompt, setSuggestedPrompt] = useState('');
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [workspaceVisible, setWorkspaceVisible] = useState(false);

  const openPreview = (url?: string) => {
    if (url) setPreviewUrl(url);
    setMode('preview');
    setMobileSurface('tool');
    setWorkspaceVisible(true);
    setActiveCapability(null);
  };

  const askAdminAI = (prompt: string) => {
    setSuggestedPrompt(prompt);
    setMobileSurface('chat');
    setWorkspaceVisible(false);
  };

  const openCapability = (id: string) => {
    if (!isEmbeddedCapability(id)) return;
    setActiveCapability(id);
    setMobileSurface('tool');
    setWorkspaceVisible(true);
  };

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-white">
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
          <button
            type="button"
            onClick={() => {
              setConversationKey((value) => value + 1);
              setMobileSurface('chat');
              setWorkspaceVisible(false);
            }}
            className="ml-auto inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg border border-white/20 px-3 text-xs font-bold hover:bg-white/10"
          >
            <Plus className="h-4 w-4" aria-hidden="true" /> New task
          </button>
          <div
            className="hidden items-center gap-1 sm:flex"
            role="group"
            aria-label="Choose AI agent"
          >
            {(['ELLIE', 'LIZZY', 'PARIS'] as const).map((agent) => (
              <button
                key={agent}
                type="button"
                aria-pressed={selectedAgent === agent}
                onClick={() => {
                  setSelectedAgent(agent);
                  setConversationKey((value) => value + 1);
                }}
                className={`rounded-lg px-3 py-2 text-xs font-black ${selectedAgent === agent ? 'bg-white text-slate-950' : 'text-slate-300 hover:bg-white/10'}`}
              >
                {agent[0] + agent.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
        <nav
          aria-label="Studio tools"
          className="scrollbar-hide flex min-w-0 items-center gap-1 overflow-x-auto border-t border-white/10 px-2 py-1.5"
        >
          <button
            type="button"
            onClick={() => {
              setMobileSurface('chat');
              setWorkspaceVisible(false);
            }}
            aria-pressed={!workspaceVisible}
            className={`inline-flex min-h-9 shrink-0 items-center gap-2 rounded-lg px-3 text-xs font-bold ${!workspaceVisible ? 'bg-white text-brand-blue-800' : 'bg-white/10 text-white hover:bg-white/15'}`}
          >
            <MessageSquare className="h-4 w-4" aria-hidden="true" /> Chat
          </button>
          <button
            type="button"
            onClick={() => {
              setWorkspaceVisible((visible) => !visible);
              setMobileSurface(workspaceVisible ? 'chat' : 'tool');
            }}
            aria-pressed={workspaceVisible}
            className="inline-flex min-h-9 shrink-0 items-center gap-2 rounded-lg bg-white/10 px-3 text-xs font-bold text-white hover:bg-white/15"
          >
            {workspaceVisible ? (
              <PanelRightClose className="h-4 w-4" aria-hidden="true" />
            ) : (
              <PanelRightOpen className="h-4 w-4" aria-hidden="true" />
            )}
            {workspaceVisible ? 'Close tools' : 'Open tools'}
          </button>
          {workspaces.map((workspace) =>
            isEmbeddedCapability(workspace.id) ? (
              <button
                key={workspace.id}
                type="button"
                onClick={() => openCapability(workspace.id)}
                className="inline-flex min-h-9 shrink-0 items-center rounded-lg px-3 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                {workspace.label}
              </button>
            ) : (
              <button
                key={workspace.id}
                type="button"
                onClick={() => openPreview(`${window.location.origin}${workspace.route}`)}
                className="inline-flex min-h-9 shrink-0 items-center rounded-lg px-3 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                {workspace.label}
              </button>
            ),
          )}
        </nav>
      </header>

      <div className="flex min-h-0 min-w-0 flex-1">
        <section
          className={`${mobileSurface === 'chat' ? 'flex' : 'hidden'} min-h-0 min-w-0 flex-1 flex-col border-r border-slate-200 ${workspaceVisible ? 'lg:flex lg:basis-[48%]' : 'lg:flex lg:basis-full'}`}
          aria-label="Elevate Studio conversation"
        >
          <div className="flex shrink-0 items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2 sm:hidden">
            <span className="text-xs font-bold text-slate-700">
              Agent: {selectedAgent[0] + selectedAgent.slice(1).toLowerCase()}
            </span>
            <button
              type="button"
              onClick={() => {
                setMobileSurface('tool');
                setWorkspaceVisible(true);
              }}
              className="ml-auto rounded-lg bg-brand-blue-700 px-3 py-2 text-xs font-bold text-white"
            >
              Open tools
            </button>
          </div>
          <UnifiedEllieChat
            key={conversationKey}
            preferredAgent={selectedAgent}
            embedded
            onOpenPreview={() => openPreview()}
            onPreviewTarget={openPreview}
            onTaskCheckpoint={setActiveTask}
            onOpenTasks={() => openCapability('tasks')}
            suggestedPrompt={suggestedPrompt}
            restoreLatest={conversationKey === 0}
            onConversationChange={setActiveConversationId}
          />
        </section>

        <section
          className={`${mobileSurface === 'tool' ? 'flex' : 'hidden'} min-h-0 min-w-0 flex-1 flex-col bg-slate-950 ${workspaceVisible ? 'lg:flex lg:basis-[52%]' : 'lg:hidden'}`}
          aria-label="Studio workspace"
        >
          <header className="flex min-h-12 shrink-0 items-center gap-2 border-b border-slate-800 bg-slate-900 px-3 text-white">
            <span className="mr-auto text-xs font-black">
              {activeCapability === 'workflows'
                ? 'Workflow Designer'
                : activeCapability === 'intelligence'
                  ? 'Intelligence'
                  : activeCapability === 'tasks'
                    ? 'Conversation activity'
                    : 'Conversation tools'}
            </span>
            <button
              type="button"
              onClick={() => {
                setActiveCapability(null);
                setMode('preview');
              }}
              className={`inline-flex items-center gap-1 rounded-md px-3 py-2 text-xs font-bold ${!activeCapability && mode === 'preview' ? 'bg-cyan-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <Eye className="h-4 w-4" aria-hidden="true" /> Preview
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveCapability(null);
                setMode('browser');
              }}
              className={`inline-flex items-center gap-1 rounded-md px-3 py-2 text-xs font-bold ${!activeCapability && mode === 'browser' ? 'bg-violet-500 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <Globe2 className="h-4 w-4" aria-hidden="true" /> Browser
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileSurface('chat');
                setWorkspaceVisible(false);
              }}
              className="rounded-md px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-800 lg:hidden"
            >
              Admin AI
            </button>
          </header>
          <div className="min-h-0 flex-1 overflow-hidden lg:p-2">
            <div className={activeCapability === 'workflows' ? 'h-full' : 'hidden'}>
              <WorkflowsWorkspace embedded />
            </div>
            <div className={activeCapability === 'intelligence' ? 'h-full' : 'hidden'}>
              <IntelligenceWorkspace onAskAI={askAdminAI} />
            </div>
            <div className={activeCapability === 'tasks' ? 'h-full' : 'hidden'}>
              <TasksWorkspace embedded conversationId={activeConversationId} />
            </div>
            <div
              className={!activeCapability && mode === 'preview' ? 'h-full' : 'hidden'}
              aria-hidden={Boolean(activeCapability) || mode !== 'preview'}
            >
              <RepositoryLivePreview
                filePath={null}
                content=""
                initialUrl={previewUrl}
                trustedInteractive={
                  previewUrl.startsWith('https://admin.elevateforhumanity.org') ||
                  previewUrl.startsWith(window.location.origin)
                }
              />
            </div>
            <div
              className={!activeCapability && mode === 'browser' ? 'h-full' : 'hidden'}
              aria-hidden={Boolean(activeCapability) || mode !== 'browser'}
            >
              <CloudBrowserWorkspace
                unifiedTask={activeTask}
                conversationId={activeConversationId}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
