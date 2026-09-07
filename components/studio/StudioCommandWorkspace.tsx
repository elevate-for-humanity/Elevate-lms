'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useState } from 'react';
import { Bot, Eye, Globe2, Menu, MessageSquare, Plus, X } from 'lucide-react';

import UnifiedEllieChat from './UnifiedEllieChat';
import RepositoryLivePreview from './RepositoryLivePreview';
import type { StudioSpecialist } from '@/lib/devstudio/ellie-unified-handlers';

const CloudBrowserWorkspace = dynamic(() => import('./CloudBrowserWorkspace'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-slate-950 text-sm text-slate-400">
      Connecting isolated browser…
    </div>
  ),
});

type InspectionMode = 'preview' | 'browser';

export default function StudioCommandWorkspace({
  workspaces,
}: {
  workspaces: Array<{ id: string; label: string; route: string }>;
}) {
  const [inspectionOpen, setInspectionOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [conversationKey, setConversationKey] = useState(0);
  const [selectedAgent, setSelectedAgent] = useState<StudioSpecialist>('LIZZY');
  const [mode, setMode] = useState<InspectionMode>('preview');
  const [previewUrl, setPreviewUrl] = useState('https://admin.elevateforhumanity.org/dashboard');

  const openPreview = (url?: string) => {
    if (url) setPreviewUrl(url);
    setMode('preview');
    setInspectionOpen(true);
  };

  return (
    <div className="relative flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-white lg:flex-row">
      {sidebarOpen ? (
        <button
          type="button"
          aria-label="Close Studio sidebar"
          onClick={() => setSidebarOpen(false)}
          className="absolute inset-0 z-40 bg-black/40 lg:hidden"
        />
      ) : null}
      <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} absolute inset-y-0 left-0 z-50 flex w-[286px] shrink-0 flex-col border-r border-gray-200 bg-gray-950 text-white transition-transform lg:static lg:z-auto lg:w-64 lg:translate-x-0`}>
        <div className="flex items-center gap-2 border-b border-white/10 p-3">
          <Bot className="h-5 w-5" aria-hidden="true" />
          <span className="font-black">Admin AI Studio</span>
          <button type="button" onClick={() => setSidebarOpen(false)} className="ml-auto rounded-lg p-2 hover:bg-white/10 lg:hidden" aria-label="Close Studio sidebar"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-3">
          <button
            type="button"
            onClick={() => { setConversationKey((value) => value + 1); setInspectionOpen(false); setSidebarOpen(false); }}
            className="flex min-h-11 w-full items-center gap-2 rounded-xl border border-white/20 px-3 text-sm font-bold hover:bg-white/10"
          >
            <Plus className="h-4 w-4" aria-hidden="true" /> New task
          </button>
        </div>
        <div className="px-3 pb-3">
          <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wider text-gray-500">AI agent</p>
          <div className="grid grid-cols-1 gap-1 sm:grid-cols-3" role="group" aria-label="Choose AI agent">
            {(['ELLIE', 'LIZZY', 'PARIS'] as const).map((agent) => (
              <button
                key={agent}
                type="button"
                aria-pressed={selectedAgent === agent}
                onClick={() => { setSelectedAgent(agent); setConversationKey((value) => value + 1); setSidebarOpen(false); }}
                className={`rounded-lg px-2 py-2 text-[11px] font-black ${selectedAgent === agent ? 'bg-white text-gray-950' : 'text-gray-300 hover:bg-white/10'}`}
              >
                {agent[0] + agent.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
        <nav aria-label="Studio tools" className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pb-4">
          <Link href="/studio" className="flex min-h-10 items-center gap-2 rounded-lg bg-white/10 px-3 text-sm font-bold"><MessageSquare className="h-4 w-4" /> Chat</Link>
          {workspaces.map((workspace) => (
            <Link key={workspace.id} href={workspace.route} onClick={() => setSidebarOpen(false)} className="block min-h-10 rounded-lg px-3 py-2.5 text-sm font-semibold text-gray-300 hover:bg-white/10 hover:text-white">
              {workspace.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-white/10 p-3 text-xs text-gray-400">One orchestrator / audited tools</div>
      </aside>
      <section className={`${inspectionOpen ? 'hidden lg:flex' : 'flex'} min-h-0 min-w-0 flex-1 flex-col`}>
        <div className="flex shrink-0 items-center gap-2 border-b border-gray-200 bg-gray-50 px-3 py-2">
          <button type="button" onClick={() => setSidebarOpen(true)} className="inline-flex min-h-10 items-center rounded-lg border border-gray-300 bg-white px-3 lg:hidden" aria-label="Open Studio sidebar"><Menu className="h-4 w-4" /></button>
          <MessageSquare className="h-4 w-4 text-gray-500" aria-hidden="true" />
          <span className="text-xs font-semibold text-gray-700">Admin AI</span>
          <button
            type="button"
            onClick={() => {
              if (!inspectionOpen) setMode('browser');
              setInspectionOpen((current) => !current);
            }}
            className="ml-auto inline-flex min-h-10 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-bold text-gray-800 shadow-sm hover:bg-gray-100"
          >
            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
            {inspectionOpen ? 'Close Studio container' : 'Open Studio container'}
          </button>
        </div>
        <UnifiedEllieChat key={conversationKey} preferredAgent={selectedAgent} embedded onOpenPreview={() => openPreview()} onPreviewTarget={openPreview} />
      </section>

      {inspectionOpen ? (
        <aside className="relative flex h-full min-h-0 min-w-0 flex-1 flex-col bg-slate-950 lg:h-auto lg:w-[46%] lg:flex-none lg:border-l lg:border-gray-200 xl:w-1/2">
          <header className="flex min-w-0 shrink-0 items-center gap-1 border-b border-slate-800 bg-slate-900 px-2 py-2 text-white sm:gap-2 sm:px-3">
            <span className="mr-auto text-xs font-black">Live inspection</span>
            <button
              type="button"
              onClick={() => setMode('preview')}
              className={`inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-[11px] font-bold ${mode === 'preview' ? 'bg-cyan-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <Eye className="h-3.5 w-3.5" aria-hidden="true" /> Preview
            </button>
            <button
              type="button"
              onClick={() => setMode('browser')}
              className={`inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-[11px] font-bold ${mode === 'browser' ? 'bg-violet-500 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <Globe2 className="h-3.5 w-3.5" aria-hidden="true" /> Browser
            </button>
            <button
              type="button"
              onClick={() => setInspectionOpen(false)}
              className="ml-1 inline-flex min-h-11 items-center gap-1 rounded-md px-2 text-slate-200 hover:bg-slate-800 hover:text-white"
              aria-label="Return to Admin AI"
            >
              <X className="h-4 w-4" aria-hidden="true" />
              <span className="text-[11px] font-bold lg:hidden">Admin AI</span>
            </button>
          </header>
          <div className="min-h-0 flex-1 overflow-hidden p-2">
            {mode === 'preview' ? (
              <RepositoryLivePreview
                filePath={null}
                content=""
                initialUrl={previewUrl}
              />
            ) : (
              <CloudBrowserWorkspace />
            )}
          </div>
        </aside>
      ) : null}
    </div>
  );
}
