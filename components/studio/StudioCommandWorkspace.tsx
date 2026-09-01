'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { Eye, Globe2, MessageSquare, X } from 'lucide-react';

import UnifiedEllieChat from './UnifiedEllieChat';
import RepositoryLivePreview from './RepositoryLivePreview';

const CloudBrowserWorkspace = dynamic(() => import('./CloudBrowserWorkspace'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-slate-950 text-sm text-slate-400">
      Connecting isolated browser…
    </div>
  ),
});

type InspectionMode = 'preview' | 'browser';

export default function StudioCommandWorkspace() {
  const [inspectionOpen, setInspectionOpen] = useState(true);
  const [mode, setMode] = useState<InspectionMode>('preview');

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col bg-white lg:flex-row">
      <section className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center gap-2 border-b border-gray-200 bg-gray-50 px-3 py-2 lg:hidden">
          <MessageSquare className="h-4 w-4 text-gray-500" aria-hidden="true" />
          <span className="text-xs font-semibold text-gray-700">Admin AI</span>
          <button
            type="button"
            onClick={() => setInspectionOpen((current) => !current)}
            className="ml-auto inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs font-semibold text-gray-700"
          >
            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
            {inspectionOpen ? 'Hide preview' : 'Show preview'}
          </button>
        </div>
        <UnifiedEllieChat embedded onOpenPreview={() => setInspectionOpen(true)} />
      </section>

      {inspectionOpen ? (
        <aside className="flex min-h-[560px] min-w-0 flex-col border-t border-gray-200 bg-slate-950 lg:min-h-0 lg:w-[46%] lg:border-l lg:border-t-0 xl:w-1/2">
          <header className="flex shrink-0 items-center gap-2 border-b border-slate-800 bg-slate-900 px-3 py-2 text-white">
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
              className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              aria-label="Close live inspection"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </header>
          <div className="min-h-0 flex-1 overflow-hidden p-2">
            {mode === 'preview' ? (
              <RepositoryLivePreview
                filePath={null}
                content=""
                initialUrl="https://www.elevateforhumanity.org"
              />
            ) : (
              <CloudBrowserWorkspace />
            )}
          </div>
        </aside>
      ) : (
        <button
          type="button"
          onClick={() => setInspectionOpen(true)}
          className="hidden w-10 shrink-0 items-center justify-center border-l border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-900 lg:flex"
          aria-label="Open live inspection"
          title="Open live inspection"
        >
          <Eye className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
