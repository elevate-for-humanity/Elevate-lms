'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { Bot, Eye, Globe2, Menu, MessageSquare, PanelRightOpen, Plus, X } from 'lucide-react';
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
  const [activeCapability, setActiveCapability] = useState<string | null>(initialWorkspace ?? null);
  const [suggestedPrompt, setSuggestedPrompt] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    setActiveCapability(id);
    setMobileSurface('tool');
  };

  const activeWorkspace = activeCapability
    ? workspaces.find((workspace) => workspace.id === activeCapability) ?? null
    : null;

  return (
    <div className="flex h-[100dvh] min-h-0 min-w-0 flex-col overflow-hidden bg-white lg:h-full">
      <header className="relative z-30 shrink-0 border-b border-slate-200 bg-white text-slate-950">
        <div className="flex h-14 min-w-0 items-center gap-2 px-3 sm:px-4">
          <Bot className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span className="min-w-0 truncate text-sm font-bold">Admin AI</span>
          <span className="hidden rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600 sm:inline">
            {selectedAgent[0] + selectedAgent.slice(1).toLowerCase()}
          </span>
          <button
            type="button"
            onClick={() => {
              setConversationKey((value) => value + 1);
              setMobileSurface('chat');
              setMobileMenuOpen(false);
            }}
            className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold hover:bg-slate-100"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span className="hidden min-[380px]:inline">New task</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileSurface((surface) => (surface === 'chat' ? 'tool' : 'chat'))}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold hover:bg-slate-100 lg:hidden"
            aria-label={mobileSurface === 'chat' ? 'Open workspace' : 'Open chat'}
          >
            {mobileSurface === 'chat' ? <PanelRightOpen className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
            <span className="hidden min-[430px]:inline">{mobileSurface === 'chat' ? 'Workspace' : 'Chat'}</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-slate-100 lg:hidden"
            aria-expanded={mobileMenuOpen}
            aria-label="Studio tools"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="hidden items-center gap-1 lg:flex" role="group" aria-label="Choose AI agent">
            {(['ELLIE', 'LIZZY', 'PARIS'] as const).map((agent) => (
              <button
                key={agent}
                type="button"
                aria-pressed={selectedAgent === agent}
                onClick={() => {
                  setSelectedAgent(agent);
                  setConversationKey((value) => value + 1);
                }}
                className={`rounded-lg px-3 py-2 text-xs font-bold ${selectedAgent === agent ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                {agent[0] + agent.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
        <nav aria-label="Studio tools" className="hidden min-w-0 items-center gap-1 overflow-x-auto border-t border-slate-100 px-3 py-1.5 lg:flex">
          <button type="button" onClick={() => setMobileSurface('chat')} className="inline-flex min-h-9 shrink-0 items-center gap-2 rounded-lg bg-slate-100 px-3 text-xs font-bold">
            <MessageSquare className="h-4 w-4" aria-hidden="true" /> Chat
          </button>
          {workspaces.map((workspace) => (
            <button
              key={workspace.id}
              type="button"
              onClick={() => openCapability(workspace.id)}
              aria-pressed={activeCapability === workspace.id}
              className={`inline-flex min-h-9 shrink-0 items-center rounded-lg px-3 text-xs font-semibold ${activeCapability === workspace.id ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              {workspace.label}
            </button>
          ))}
        </nav>
        {mobileMenuOpen ? (
          <div className="absolute inset-x-3 top-14 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl lg:hidden">
            <p className="px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">Agents</p>
            <div className="grid grid-cols-3 gap-1">
              {(['ELLIE', 'LIZZY', 'PARIS'] as const).map((agent) => (
                <button key={agent} type="button" onClick={() => { setSelectedAgent(agent); setConversationKey((value) => value + 1); setMobileMenuOpen(false); }} className={`rounded-lg px-3 py-2 text-xs font-bold ${selectedAgent === agent ? 'bg-slate-950 text-white' : 'hover:bg-slate-100'}`}>
                  {agent[0] + agent.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
            <p className="mt-2 px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">Tools</p>
            <div className="grid gap-1">
              {workspaces.map((workspace) => (
                <button
                  key={workspace.id}
                  type="button"
                  onClick={() => { openCapability(workspace.id); setMobileMenuOpen(false); }}
                  className="rounded-lg px-3 py-2 text-left text-sm font-semibold hover:bg-slate-100"
                >
                  {workspace.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </header>

      <div className="flex min-h-0 min-w-0 flex-1">
        <section
          className={`${mobileSurface === 'chat' ? 'flex' : 'hidden'} min-h-0 min-w-0 flex-1 flex-col border-r border-slate-200 lg:flex lg:basis-[42%]`}
        >
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
                  : activeWorkspace?.label || 'Active workspace'}
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
            ) : activeWorkspace ? (
              <iframe
                key={activeWorkspace.id}
                title={activeWorkspace.label}
                src={`${activeWorkspace.route}${activeWorkspace.route.includes('?') ? '&' : '?'}embedded=1`}
                className="h-full w-full border-0 bg-white"
              />
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
