'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Code2, Globe2, TerminalSquare } from 'lucide-react';
import RepositoryLivePreview from './RepositoryLivePreview';

const DevStudioEditorWorkspace = dynamic(() => import('./DevStudioEditorWorkspace'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-white text-base text-slate-600">
      Loading repository editor…
    </div>
  ),
});

const RealRepoWorkspace = dynamic(() => import('./RealRepoWorkspace'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-white text-base text-slate-600">
      Starting isolated runtime…
    </div>
  ),
});

const GeneratedFiles = dynamic(() => import('./StudioGeneratedFiles'), { ssr: false });

const ServicesPanel = dynamic(() => import('./ServicesPanel'), { ssr: false });

const CloudBrowserWorkspace = dynamic(() => import('./CloudBrowserWorkspace'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-white text-slate-600">
      Connecting cloud browser…
    </div>
  ),
});

type Mode = 'preview' | 'runtime' | 'browser' | 'release' | 'files';

export default function RepositoryStudioWorkspace() {
  const [mode, setMode] = useState<Mode>('preview');
  const [visitedModes, setVisitedModes] = useState<Set<Mode>>(() => new Set(['preview']));
  const selectMode = (next: Mode) => {
    setVisitedModes((visited) => new Set([...visited, next]));
    setMode(next);
  };
  const [activePath, setActivePath] = useState<string | null>(null);
  const [activeContent, setActiveContent] = useState('');

  return (
    <div className="flex h-full min-h-0 flex-col bg-white text-slate-950">
      <header className="flex shrink-0 flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2">
        <div className="mr-auto">
          <p className="text-base font-extrabold text-slate-950">Repository Workspace</p>
          <p className="text-base text-slate-600">
            Edit and preview source, or run code in the existing Studio container terminal.
          </p>
        </div>
        <button
          type="button"
          onClick={() => selectMode('preview')}
          className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-base font-bold ${
            mode === 'preview'
              ? 'bg-cyan-500 text-slate-950'
              : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Code2 className="h-4 w-4" /> Editor + Preview
        </button>
        <button
          type="button"
          onClick={() => selectMode('browser')}
          className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-base font-bold ${mode === 'browser' ? 'bg-violet-100 text-slate-950' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'}`}
        >
          <Globe2 className="h-4 w-4" /> Cloud Browser
        </button>
        <button
          type="button"
          onClick={() => selectMode('runtime')}
          className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-base font-bold ${
            mode === 'runtime'
              ? 'bg-emerald-100 text-slate-950'
              : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
          }`}
        >
          <TerminalSquare className="h-4 w-4" /> Runtime + Terminal
        </button>
        <button
          type="button"
          onClick={() => selectMode('files')}
          className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-3 py-2 text-base font-bold"
        >
          Generated files
        </button>
        <button
          type="button"
          onClick={() => selectMode('release')}
          className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-3 py-2 text-base font-bold"
        >
          Build & deploy
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-auto p-2 sm:p-3">
        <div hidden={mode !== 'preview'} className="h-full min-h-0">
          {visitedModes.has('preview') ? (
            <div className="grid h-full min-h-0 gap-3 xl:grid-cols-[minmax(0,1.2fr)_minmax(420px,0.8fr)]">
              <div className="min-h-[640px] min-w-0 overflow-hidden rounded-xl border border-slate-200 xl:min-h-0">
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
          ) : null}
        </div>
        <div hidden={mode !== 'runtime'} className="h-full min-h-0">
          {visitedModes.has('runtime') ? (
            <div className="h-full min-h-0 overflow-hidden rounded-xl border border-slate-200">
              <RealRepoWorkspace className="h-full" />
            </div>
          ) : null}
        </div>
        <div hidden={mode !== 'files'} className="h-full min-h-0">
          {visitedModes.has('files') ? <GeneratedFiles /> : null}
        </div>
        <div hidden={mode !== 'release'} className="h-full min-h-0">
          {visitedModes.has('release') ? <ServicesPanel /> : null}
        </div>
        <div hidden={mode !== 'browser'} className="h-full min-h-0">
          {visitedModes.has('browser') ? <CloudBrowserWorkspace /> : null}
        </div>
      </div>
    </div>
  );
}
