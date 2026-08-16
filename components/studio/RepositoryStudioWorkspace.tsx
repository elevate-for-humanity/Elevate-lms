'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Code2, Globe2, TerminalSquare } from 'lucide-react';
import RepositoryLivePreview from './RepositoryLivePreview';

const DevStudioEditorWorkspace = dynamic(() => import('./DevStudioEditorWorkspace'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-[#1e1e1e] text-sm text-slate-400">
      Loading repository editor…
    </div>
  ),
});

const RealRepoWorkspace = dynamic(() => import('./RealRepoWorkspace'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-[#1e1e1e] text-sm text-slate-400">
      Starting isolated runtime…
    </div>
  ),
});

const CloudBrowserWorkspace = dynamic(() => import('./CloudBrowserWorkspace'), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center bg-slate-950 text-slate-400">Connecting cloud browser…</div>,
});

type Mode = 'preview' | 'runtime' | 'browser';

export default function RepositoryStudioWorkspace() {
  const [mode, setMode] = useState<Mode>('preview');
  const [activePath, setActivePath] = useState<string | null>(null);
  const [activeContent, setActiveContent] = useState('');

  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-950 text-white">
      <header className="flex shrink-0 flex-wrap items-center gap-2 border-b border-slate-800 bg-slate-900 px-3 py-2">
        <div className="mr-auto">
          <p className="text-xs font-extrabold text-white">Repository Workspace</p>
          <p className="text-[10px] text-slate-400">
            Edit and preview source, or run code in the isolated WebContainer terminal.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setMode('preview')}
          className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold ${
            mode === 'preview'
              ? 'bg-cyan-500 text-slate-950'
              : 'border border-slate-700 bg-slate-950 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Code2 className="h-4 w-4" /> Editor + Preview
        </button>
        <button
          type="button"
          onClick={() => setMode('browser')}
          className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold ${mode === 'browser' ? 'bg-violet-500 text-white' : 'border border-slate-700 bg-slate-950 text-slate-300 hover:bg-slate-800'}`}
        >
          <Globe2 className="h-4 w-4" /> Cloud Browser
        </button>
        <button
          type="button"
          onClick={() => setMode('runtime')}
          className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold ${
            mode === 'runtime'
              ? 'bg-emerald-500 text-slate-950'
              : 'border border-slate-700 bg-slate-950 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <TerminalSquare className="h-4 w-4" /> Runtime + Terminal
        </button>
      </header>

      <div className="min-h-0 flex-1 p-2 sm:p-3">
        {mode === 'preview' ? (
          <div className="grid h-full min-h-0 gap-3 xl:grid-cols-[minmax(0,1.2fr)_minmax(420px,0.8fr)]">
            <div className="min-h-[640px] min-w-0 overflow-hidden rounded-xl border border-slate-800 xl:min-h-0">
              <DevStudioEditorWorkspace
                onFileContextChange={(path, content) => {
                  setActivePath(path);
                  setActiveContent(content);
                }}
              />
            </div>
            <div className="min-h-[640px] min-w-0 xl:min-h-0">
              <RepositoryLivePreview filePath={activePath} content={activeContent} />
            </div>
          </div>
        ) : mode === 'runtime' ? (
          <div className="h-full min-h-[680px] overflow-hidden rounded-xl border border-slate-800 xl:min-h-0">
            <RealRepoWorkspace className="h-full" />
          </div>
        ) : <div className="h-full min-h-[680px] overflow-hidden rounded-xl border border-slate-800 xl:min-h-0"><CloudBrowserWorkspace /></div>}
      </div>
    </div>
  );
}
