'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useState } from 'react';
import { Bot, Eye, Globe2, MessageSquare, Plus } from 'lucide-react';
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

type InspectionMode = 'preview' | 'browser';
type EmbeddedCapability = 'workflows' | 'intelligence';

function isEmbeddedCapability(id: string): id is EmbeddedCapability {
  return id === 'workflows' || id === 'intelligence';
}

export default function StudioCommandWorkspace({
  workspaces,
  initialWorkspace,
}: {
  workspaces: Array<{ id: string; label: string; route: string }>;
  initialWorkspace?: 'workflows' | 'intelligence';
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

  const openPreview = (url?: string) => {
    if (url) setPreviewUrl(url);
    setMode('preview');
    setMobileSurface('tool');
    setActiveCapability(null);
  };

  const askAdminAI = (prompt: string) => {
    setSuggestedPrompt(prompt);
    setMobileSurface('chat');
  };

  const openCapability = (id: string) => {
    if (!isEmbeddedCapability(id)) return;
    setActiveCapability(id);
    setMobileSurface('tool');
  };

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-white">
      <header className="shrink-0 border-b border-slate-200 bg-slate-950 text-white">
        <div className="flex min-h-12 min-w-0 items-center gap-2 px-3">
          <Bot className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span className="shrink-0 text-sm font-black">Admin AI Studio</span>
          <button
            type="button"
            onClick={() => {
              setConversationKey((value) => value + 1);
              setMobileSurface('chat');
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
            onClick={() => setMobileSurface('chat')}
            className="inline-flex min-h-9 shrink-0 items-center gap-2 rounded-lg bg-white/10 px-3 text-xs font-bold hover:bg-white/15"
          >
            <MessageSquare className="h-4 w-4" aria-hidden="true" /> Chat
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
              <Link
                key={workspace.id}
                href={workspace.route}
                className="inline-flex min-h-9 shrink-0 items-center rounded-lg px-3 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                {workspace.label}
              </Link>
            ),
          )}
        </nav>
      </header>

      <div className="flex min-h-0 min-w-0 flex-1">
        <section
          className={`${mobileSurface === 'chat' ? 'flex' : 'hidden'} min-h-0 min-w-0 flex-1 flex-col border-r border-slate-200 lg:flex lg:basis-[42%]`}
        >
          <div className="flex shrink-0 items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2 sm:hidden">
            <span className="text-xs font-bold text-slate-700">
              Agent: {selectedAgent[0] + selectedAgent.slice(1).toLowerCase()}
            </span>
            <button
              type="button"
              onClick={() => setMobileSurface('tool')}
              className="ml-auto rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white"
            >
              Open workspace
            </button>
          </div>
          <UnifiedEllieChat
            key={conversationKey}
            preferredAgent={selectedAgent}
            embedded
            onOpenPreview={() => openPreview()}
            onPreviewTarget={openPreview}
            onTaskCheckpoint={setActiveTask}
            suggestedPrompt={suggestedPrompt}
          />
        </section>

        <section
          className={`${mobileSurface === 'tool' ? 'flex' : 'hidden'} min-h-0 min-w-0 flex-1 flex-col bg-slate-950 lg:flex lg:basis-[58%]`}
          aria-label="Studio workspace"
        >
          <header className="flex min-h-12 shrink-0 items-center gap-2 border-b border-slate-800 bg-slate-900 px-3 text-white">
            <span className="mr-auto text-xs font-black">
              {activeCapability === 'workflows'
                ? 'Workflow Designer'
                : activeCapability === 'intelligence'
                  ? 'Intelligence'
                  : 'Active workspace'}
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
              onClick={() => setMobileSurface('chat')}
              className="rounded-md px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-800 lg:hidden"
            >
              Admin AI
            </button>
          </header>
          <div className="min-h-0 flex-1 overflow-hidden lg:p-2">
            {activeCapability === 'workflows' ? (
              <WorkflowsWorkspace embedded />
            ) : activeCapability === 'intelligence' ? (
              <IntelligenceWorkspace onAskAI={askAdminAI} />
            ) : mode === 'preview' ? (
              <RepositoryLivePreview filePath={null} content="" initialUrl={previewUrl} />
            ) : (
              <CloudBrowserWorkspace unifiedTask={activeTask} />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
