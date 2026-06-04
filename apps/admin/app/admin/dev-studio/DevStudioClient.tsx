'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  Sparkles, MessageSquare, Terminal, FolderOpen, Globe, Box,
  Send, Loader2, RefreshCw, ExternalLink, Save, Bot,
  ChevronRight, File, Folder, Play, X, Circle,
  PanelRightClose, PanelRightOpen, AlertTriangle, Key, ShieldCheck,
  Server, GitBranch, Lock,
} from 'lucide-react';

import type { default as CodeEditorType } from '@/components/dev-studio/CodeEditor';

const AiConsoleClient   = dynamic(() => import('../ai-console/AiConsoleClient'),             { ssr: false });
const DevContainerPanel = dynamic(() => import('@/components/dev-studio/DevContainerPanel'), { ssr: false });
const DocumentsPanel    = dynamic(() => import('@/components/dev-studio/DocumentsPanel'),    { ssr: false });
const AIChat            = dynamic(() => import('@/components/dev-studio/AIChat'),            { ssr: false });
const EcsStatusPanel    = dynamic(() => import('@/components/dev-studio/EcsStatusPanel'),    { ssr: false });
const FileTree          = dynamic(() => import('@/components/dev-studio/FileTree'),          { ssr: false });
// PreviewPanel removed — preview is now the unified right pane (IframePreview)
const SecretsPanel      = dynamic(() => import('@/components/dev-studio/SecretsPanel'),      { ssr: false });
const ServicesPanel     = dynamic(() => import('@/components/dev-studio/ServicesPanel'),     { ssr: false });
const GitPanel          = dynamic(() => import('@/components/dev-studio/GitPanel'),          { ssr: false });
const XTerminal         = dynamic(() => import('@/components/dev-studio/XTerminal'),         { ssr: false });
const CodeEditor        = dynamic<React.ComponentProps<typeof CodeEditorType>>(
  () => import('@/components/dev-studio/CodeEditor'),
  { ssr: false },
);

type Tab = 'command' | 'terminal' | 'files' | 'container' | 'chat' | 'ellie' | 'documents' | 'secrets' | 'services' | 'git';
interface FileNode { name: string; path: string; type: 'file' | 'directory' | 'dir'; children?: FileNode[]; }
type WorkflowKey = 'deploy-lms' | 'deploy-admin' | 'deploy-studio' | 'ci' | 'lint';
interface DevStudioConfig {
  quickCommands?: string[];
  workflowButtons?: { key: WorkflowKey; label: string; description: string }[];
  defaultPreviewUrl?: string;
  previewTargets?: { label: string; url: string }[];
  tabFiles?: Partial<Record<Tab, string>>;
}

interface DevStudioHealth {
  hasGroq: boolean;
  hasGemini: boolean;
  hasOpenAI: boolean;
  hasAnthropic: boolean;
  hasGitHub: boolean;
}

const TABS: { id: Tab; Icon: React.ElementType<{ className?: string }>; label: string }[] = [
  { id: 'command',   Icon: Sparkles,      label: 'Command'   },
  { id: 'ellie',     Icon: Bot,           label: 'Ellie'     },
  { id: 'chat',      Icon: MessageSquare, label: 'Code AI'   },
  { id: 'terminal',  Icon: Terminal,      label: 'Terminal'  },
  { id: 'git',       Icon: GitBranch,     label: 'Git'       },
  { id: 'services',  Icon: Server,        label: 'Services'  },
  { id: 'files',     Icon: FolderOpen,    label: 'Explorer'  },
  { id: 'container', Icon: Box,           label: 'Container' },
  { id: 'documents', Icon: FolderOpen,    label: 'Documents' },
  { id: 'secrets',   Icon: Key,           label: 'Secrets'   },
];

const DEFAULT_TAB_FILES: Record<Tab, string> = {
  command: 'command.sh', chat: 'ai-chat.md', terminal: 'terminal.sh',
  files: 'explorer', container: 'devcontainer.json',
  documents: 'documents', secrets: 'platform-secrets',
  git: 'git', services: 'services',
};

// ── Embed-check hook ─────────────────────────────────────────────────────────
// Calls the server-side /api/devstudio/embed-check endpoint which HEAD-fetches
// the target URL and inspects X-Frame-Options / CSP frame-ancestors headers.
// Returns { embeddable: boolean | null (pending), reason?: string }
function useEmbedCheck(url: string) {
  const [state, setState] = useState<{ embeddable: boolean | null; reason?: string }>({ embeddable: null });
  useEffect(() => {
    if (!url) return;
    setState({ embeddable: null });
    const controller = new AbortController();
    fetch(`/api/devstudio/embed-check?url=${encodeURIComponent(url)}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((d: { embeddable: boolean; reason?: string }) => setState(d))
      .catch(() => setState({ embeddable: true })); // on network error, let iframe try
    return () => controller.abort();
  }, [url]);
  return state;
}

// ── IframePreview ─────────────────────────────────────────────────────────────
// Renders an iframe when embeddable, or a blocked-state UI with an open-in-tab
// escape hatch when the target sends X-Frame-Options / CSP frame-ancestors.
// When url is empty, renders a placeholder instead of firing an embed-check.
function IframePreview({
  url,
  title = 'Preview',
  style,
  className,
}: {
  url: string;
  title?: string;
  style?: React.CSSProperties;
  className?: string;
}) {
  const { embeddable, reason } = useEmbedCheck(url);
  const [loading, setLoading] = useState(true);

  // Reset loading spinner whenever url changes
  useEffect(() => { setLoading(true); }, [url]);

  // No URL yet — show placeholder instead of a broken embed-check
  if (!url) {
    return (
      <div className={`flex flex-col items-center justify-center gap-3 w-full h-full ${className ?? ''}`}
        style={{ background: '#1e1e1e', ...style }}>
        <Globe className="w-8 h-8" style={{ color: '#3c3c3c' }} />
        <p className="text-[11px]" style={{ color: '#555' }}>Enter a URL above to preview</p>
      </div>
    );
  }

  if (embeddable === null) {
    return (
      <div className={`flex items-center justify-center w-full h-full ${className ?? ''}`} style={style}>
        <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#858585' }} />
      </div>
    );
  }

  if (embeddable === false) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-4 w-full h-full text-center px-6 ${className ?? ''}`}
        style={{ background: '#1e1e1e', ...style }}
      >
        <AlertTriangle className="w-8 h-8" style={{ color: '#f0a500' }} />
        <p className="text-sm font-medium" style={{ color: '#cccccc' }}>
          This page can&apos;t be embedded
        </p>
        <p className="text-[11px] leading-relaxed" style={{ color: '#858585' }}>
          The server returned <code className="px-1 rounded" style={{ background: '#2d2d2d', color: '#4ec9b0' }}>{reason}</code>
          {' '}which blocks iframe embedding.
        </p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-colors"
          style={{ background: '#0078d4', color: '#fff' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#005fa3')}
          onMouseLeave={e => (e.currentTarget.style.background = '#0078d4')}
        >
          <ExternalLink className="w-4 h-4" />
          Open in new tab
        </a>
        <p className="text-[10px]" style={{ color: '#555' }}>
          Or use a local dev server URL (e.g. http://localhost:3000) in the address bar above.
        </p>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full ${className ?? ''}`} style={style}>
      {loading && (
        <div className="absolute inset-x-0 top-0 flex items-center justify-center h-8 z-10 border-b"
          style={{ background: 'rgba(30,30,30,0.85)', borderColor: '#3c3c3c' }}>
          <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#858585' }} />
        </div>
      )}
      <iframe
        src={url}
        className="w-full h-full border-0"
        onLoad={() => setLoading(false)}
        title={title}
      />
    </div>
  );
}

export default function DevStudioClient({ isSuperAdmin = false }: { isSuperAdmin?: boolean }) {
  const searchParams = useSearchParams();
  const raw = searchParams.get('tab') as Tab | null;
  const initialCommand = searchParams.get('command') ?? '';
  const valid: Tab[] = ['command','terminal','files','container','chat','ellie','documents','secrets','git','services'];
  // Non-super_admin users cannot land on the secrets tab — redirect to command
  const init: Tab = raw && valid.includes(raw) && (raw !== 'secrets' || isSuperAdmin) ? raw : (initialCommand ? 'command' : 'command');
  const [tab, setTab] = useState<Tab>(init);
  const [openTabs, setOpenTabs] = useState<Tab[]>([init]);
  const [studioConfig, setStudioConfig] = useState<DevStudioConfig | null>(null);
  const [configLoadError, setConfigLoadError] = useState(false);
  const [studioHealth, setStudioHealth] = useState<DevStudioHealth | null>(null);
  const [viewportWidth, setViewportWidth] = useState(1280);

  // Breakpoints: phone < 640, tablet 640–1023, desktop >= 1024
  const isPhone   = viewportWidth < 640;
  const isCompactLayout = viewportWidth < 1024;

  // Preview: always visible on desktop, collapsible on mobile
  const [previewOpen, setPreviewOpen] = useState(false); // starts false; auto-opens on desktop via resize effect
  const [previewWidth, setPreviewWidth] = useState(420); // px
  // Preview URL — lifted here so the address bar in the preview pane can update it
  const [previewInputUrl, setPreviewInputUrl] = useState('');
  const [previewLiveUrl, setPreviewLiveUrl] = useState('');
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartW = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const onResizerMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    dragStartX.current = e.clientX;
    dragStartW.current = previewWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [previewWidth]);

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!isDragging.current) return;
      const delta = dragStartX.current - e.clientX; // dragging left = wider preview
      const containerW = containerRef.current?.offsetWidth ?? window.innerWidth;
      const minWidth = 280;
      const maxWidth = Math.max(minWidth, containerW - 400);
      const next = Math.min(Math.max(dragStartW.current + delta, minWidth), maxWidth);
      setPreviewWidth(next);
    }
    function onMouseUp() {
      if (!isDragging.current) return;
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth;
      setViewportWidth(w);
      // Auto-close preview when resizing down to phone; auto-open on desktop
      if (w >= 1024) setPreviewOpen(true);
      if (w < 640)   setPreviewOpen(false);
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    fetch('/api/admin/devstudio/config')
      .then((r) => r.json())
      .then((d) => {
        setStudioConfig(d ?? null);
        setConfigLoadError(false);
      })
      .catch(() => {
        setStudioConfig(null);
        setConfigLoadError(true);
      });
  }, []);

  useEffect(() => {
    fetch('/api/devstudio/health')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setStudioHealth(d))
      .catch(() => setStudioHealth(null));
  }, []);

  const tabFiles = { ...DEFAULT_TAB_FILES, ...(studioConfig?.tabFiles ?? {}) } as Record<Tab, string>;

  // Sync preview URL when config loads (only if user hasn't typed anything yet)
  useEffect(() => {
    const configUrl = studioConfig?.defaultPreviewUrl || (typeof window !== 'undefined' ? window.location.origin : '');
    if (!previewInputUrl) {
      setPreviewInputUrl(configUrl);
      setPreviewLiveUrl(configUrl);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studioConfig?.defaultPreviewUrl]);
  const hasAnyAI = !!(studioHealth?.hasGroq || studioHealth?.hasGemini || studioHealth?.hasOpenAI || studioHealth?.hasAnthropic);
  const activeAIProviders = studioHealth ? [
    studioHealth.hasGroq      && 'Groq',
    studioHealth.hasGemini    && 'Gemini',
    studioHealth.hasOpenAI    && 'OpenAI',
    studioHealth.hasAnthropic && 'Anthropic',
  ].filter(Boolean).join(' · ') : '';

  function openTab(t: Tab) {
    setTab(t);
    setOpenTabs((p) => p.includes(t) ? p : [...p, t]);
  }
  function closeTab(t: Tab, e: React.MouseEvent) {
    e.stopPropagation();
    const next = openTabs.filter((x) => x !== t);
    setOpenTabs(next.length ? next : [init]);
    if (tab === t) setTab(next[next.length - 1] ?? init);
  }

  return (
    <div
      ref={containerRef}
      className="flex flex-col overflow-hidden"
      style={{
        fontFamily: "'JetBrains Mono','Fira Code','Cascadia Code',monospace",
        background: '#1e1e1e',
        color: '#cccccc',
        // layout.tsx uses position:fixed with top:64 so this div fills
        // the fixed container — no paddingTop needed here.
        height: '100%',
        width: '100%',
      }}
    >
      {/* ── Title / menu bar ── */}
      <div className="flex-shrink-0 flex items-center gap-1 px-2 sm:px-3 border-b text-xs select-none"
        style={{ background: '#323233', borderColor: '#3c3c3c', color: '#cccccc', minHeight: isPhone ? 44 : 28 }}>
        <span className="font-bold text-white mr-2 text-[11px]">Dev Studio</span>
        {/* Menu items — mirrors TABS order exactly */}
        {([
          { label: 'Command',   id: 'command'   },
          { label: 'Chat',      id: 'chat'      },
          { label: 'Terminal',  id: 'terminal'  },
          { label: 'Git',       id: 'git'       },
          { label: 'Services',  id: 'services'  },
          { label: 'Files',     id: 'files'     },
          { label: 'Container', id: 'container' },
          { label: 'Docs',      id: 'documents' },
          ...(isSuperAdmin ? [{ label: 'Secrets', id: 'secrets' as Tab }] : []),
        ] as { label: string; id: Tab }[]).map(({ label, id }) => (
          <span
            key={id}
            className="cursor-pointer px-2 py-0.5 rounded text-[11px] transition-colors"
            style={{ color: tab === id ? '#ffffff' : '#cccccc', background: tab === id ? '#094771' : 'transparent' }}
            onClick={() => setTab(id)}
            onMouseEnter={e => { if (tab !== id) e.currentTarget.style.background = '#3c3c3c'; }}
            onMouseLeave={e => { if (tab !== id) e.currentTarget.style.background = 'transparent'; }}
          >{label}</span>
        ))}
        <div className="ml-auto flex items-center gap-2 sm:gap-3 text-[11px]" style={{ color: '#858585' }}>
          <span className="flex items-center gap-1" style={{ color: '#4ec9b0' }}>
            <Circle className="w-2 h-2 fill-current" /> main
          </span>
          {studioHealth && (
            <>
              <span
                className="px-1.5 py-0.5 rounded border text-[10px]"
                style={{
                  color: studioHealth.hasGitHub ? '#4ec9b0' : '#fca5a5',
                  borderColor: studioHealth.hasGitHub ? '#4ec9b0' : '#fca5a5',
                }}
              >
                {studioHealth.hasGitHub ? 'GitHub Connected' : 'GitHub Not Connected'}
              </span>
              <span
                className="px-1.5 py-0.5 rounded border text-[10px]"
                style={{
                  color: hasAnyAI ? '#4ec9b0' : '#f0a500',
                  borderColor: hasAnyAI ? '#4ec9b0' : '#f0a500',
                }}
              >
                {hasAnyAI ? `AI: ${activeAIProviders}` : 'No AI Key'}
              </span>
            </>
          )}
          <span className="text-[11px]" style={{ color: '#858585' }}>Elevate LMS</span>
          {/* Preview toggle — only shown on mobile/tablet where preview is collapsible */}
          {isCompactLayout && (
            <button
              title={previewOpen ? 'Hide preview' : 'Show preview'}
              onClick={() => setPreviewOpen((v) => !v)}
              className="flex items-center gap-1 px-2 rounded text-[11px] transition-colors"
              style={{
                color: previewOpen ? '#4ec9b0' : '#858585',
                minHeight: isPhone ? 44 : undefined,
                minWidth: isPhone ? 44 : undefined,
                justifyContent: 'center',
              }}
              onMouseEnter={e => (e.currentTarget.style.background='#3c3c3c')}
              onMouseLeave={e => (e.currentTarget.style.background='transparent')}
            >
              {previewOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
              <span className="ml-1">Preview</span>
            </button>
          )}
        </div>
      </div>

      {configLoadError && (
        <div className="flex-shrink-0 px-3 py-1 text-[11px] border-b" style={{ background: '#5a4a00', borderColor: '#6e5c00', color: '#ffd700' }}>
          Studio config could not be loaded — using defaults.
        </div>
      )}

      {/* ── Tab strip ── */}
      <div className="flex-shrink-0 flex items-end overflow-x-auto border-b" style={{ background: '#2d2d2d', borderColor: '#3c3c3c', scrollbarWidth: 'none' }}>
        {openTabs.map((t) => {
          const def = TABS.find((x) => x.id === t)!;
          const active = tab === t;
          return (
            <button key={t} onClick={() => openTab(t)}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 text-[11px] sm:text-xs whitespace-nowrap flex-shrink-0 group transition-colors border-r"
              style={{
                background:  active ? '#1e1e1e' : 'transparent',
                color:       active ? '#ffffff' : '#858585',
                borderColor: '#3c3c3c',
                borderTop:   active ? '1px solid #0078d4' : '1px solid transparent',
                // Minimum 44px touch target height on phone
                minHeight: isPhone ? 44 : undefined,
              }}>
              <def.Icon className="w-3.5 h-3.5" style={{ opacity: active ? 1 : 0.5 }} />
              <span>{tabFiles[t]}</span>
              {/* Close button: larger tap area on phone */}
              <span
                onClick={(e) => closeTab(t, e)}
                className={`rounded transition-opacity ${isPhone ? 'ml-1 p-1 opacity-60' : 'ml-1.5 p-0.5 opacity-0 group-hover:opacity-60 hover:!opacity-100'}`}
                style={{ color: '#cccccc' }}>
                <X className={isPhone ? 'w-4 h-4' : 'w-3 h-3'} />
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Body: activity bar | editor | resizer | live preview ── */}
      <div className={`flex flex-1 min-h-0 overflow-hidden ${isCompactLayout ? 'flex-col' : 'flex-row'}`}>

        {/* Activity bar */}
        <div
          className={`flex-shrink-0 flex ${isCompactLayout ? 'flex-row w-full px-1 py-1 gap-0.5 overflow-x-auto border-b' : 'flex-col items-center py-2 gap-0.5 w-12 border-r'}`}
          style={{ background: '#333333', borderColor: '#3c3c3c' }}
        >
          {TABS.filter(({ id }) => id !== 'secrets' || isSuperAdmin).map(({ id, Icon, label }) => {
            const active = tab === id;
            // Phone: 44×44 touch target (WCAG 2.5.5); tablet: 36×36; desktop: 40×40
            const btnSize = isPhone ? 'w-11 h-11 flex-shrink-0' : isCompactLayout ? 'w-9 h-9 flex-shrink-0' : 'w-10 h-10';
            return (
              <button key={id} title={label} onClick={() => openTab(id)}
                className={`relative flex items-center justify-center rounded transition-colors ${btnSize}`}
                style={{ color: active ? '#ffffff' : '#858585' }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.color = '#cccccc'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.color = '#858585'; }}>
                {active && (
                  <span
                    className={isCompactLayout ? 'absolute inset-x-2 bottom-0 h-0.5 rounded-t' : 'absolute left-0 top-2 bottom-2 w-0.5 rounded-r'}
                    style={{ background: '#0078d4' }}
                  />
                )}
                <Icon className={isPhone ? 'w-6 h-6' : 'w-5 h-5'} />
              </button>
            );
          })}
        </div>

        {/* Editor area */}
        <div className="flex-1 min-w-0 overflow-hidden" style={{ background: '#1e1e1e' }}>
          {tab === 'command'   && <CommandTab quickCommands={studioConfig?.quickCommands} initialCommand={initialCommand} />}
          {tab === 'ellie'     && <AiConsoleClient />}
          {tab === 'chat'      && <AIChat />}
          {tab === 'terminal'  && <XTerminal />}
          {tab === 'git'       && <GitPanel />}
          {tab === 'services'  && <ServicesPanel />}
          {tab === 'files'     && <FilesTab />}
          {tab === 'container' && <ContainerTab />}
          {tab === 'documents' && <DocumentsPanel />}
          {tab === 'secrets'   && (
            isSuperAdmin
              ? <SecretsPanel />
              : (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
                  <Lock className="w-10 h-10" style={{ color: '#555' }} />
                  <p className="text-sm font-medium" style={{ color: '#cccccc' }}>Super Admin only</p>
                  <p className="text-xs" style={{ color: '#858585' }}>
                    Platform secrets are restricted to super_admin accounts.
                  </p>
                </div>
              )
          )}
        </div>

        {/* Drag-to-resize handle — desktop only, preview is always visible there */}
        {!isCompactLayout && (
          <div
            onMouseDown={onResizerMouseDown}
            className="flex-shrink-0 w-1 cursor-col-resize transition-colors"
            style={{ background: '#3c3c3c' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#0078d4')}
            onMouseLeave={e => (e.currentTarget.style.background = '#3c3c3c')}
          />
        )}

        {/* Live preview panel — always visible on desktop, collapsible on mobile */}
        {(previewOpen || !isCompactLayout) && (
          <div
            className={`flex-shrink-0 flex flex-col overflow-hidden ${isCompactLayout ? 'border-t' : 'border-l'}`}
            style={{
              width: isCompactLayout ? '100%' : previewWidth,
              height: isPhone ? '40dvh' : isCompactLayout ? '45dvh' : undefined,
              minHeight: isPhone ? 200 : isCompactLayout ? 240 : undefined,
              background: '#1e1e1e',
              borderColor: '#3c3c3c',
            }}
          >
            {/* Browser chrome — address bar + controls */}
            <div
              className="flex-shrink-0 flex items-center gap-1.5 px-2 py-1.5 border-b select-none"
              style={{ background: '#2d2d2d', borderColor: '#3c3c3c' }}
            >
              {/* Reload */}
              <button
                title="Reload"
                onClick={() => {
                const busted = previewInputUrl + (previewInputUrl.includes('?') ? '&_r=' : '?_r=') + Date.now();
                setPreviewInputUrl(busted);
                setPreviewLiveUrl(busted);
              }}
                className="flex-shrink-0 p-1 rounded transition-colors"
                style={{ color: '#858585' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#cccccc')}
                onMouseLeave={e => (e.currentTarget.style.color = '#858585')}
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              {/* Address bar */}
              <form
                className="flex-1 flex items-center rounded px-2 py-0.5 border"
                style={{ background: '#3c3c3c', borderColor: '#555' }}
                onSubmit={e => { e.preventDefault(); setPreviewLiveUrl(previewInputUrl); }}
              >
                <Globe className="w-3 h-3 flex-shrink-0 mr-1.5" style={{ color: '#4ec9b0' }} />
                <input
                  value={previewInputUrl}
                  onChange={e => setPreviewInputUrl(e.target.value)}
                  className="flex-1 bg-transparent text-[11px] outline-none font-mono min-w-0"
                  style={{ color: '#cccccc' }}
                  placeholder="https://…"
                  spellCheck={false}
                />
              </form>
              {/* Open in new tab */}
              <a
                href={previewLiveUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Open in new tab"
                className="flex-shrink-0 p-1 rounded transition-colors"
                style={{ color: '#858585' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#cccccc')}
                onMouseLeave={e => (e.currentTarget.style.color = '#858585')}
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              {/* Close — only on mobile */}
              {isCompactLayout && (
                <button
                  title="Close preview"
                  onClick={() => setPreviewOpen(false)}
                  className="flex-shrink-0 p-1 rounded transition-colors"
                  style={{ color: '#858585' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#cccccc')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#858585')}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {/* iframe — embed-check aware */}
            <div className="flex-1 overflow-hidden" style={{ background: '#1e1e1e' }}>
              <IframePreview url={previewLiveUrl} title="Live Preview" />
            </div>
          </div>
        )}
      </div>

      {/* ── Status bar ── */}
      <div className="flex-shrink-0 flex items-center justify-between px-2 sm:px-3 py-0.5 text-white text-[11px] select-none" style={{ background: '#0078d4' }}>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">⎇ main</span>
          <span className="opacity-80">Elevate LMS · Dev Container</span>
        </div>
        <div className="flex items-center gap-4 opacity-80">
          <span>UTF-8</span>
          <span>TypeScript React</span>
          <span>port 3000</span>
        </div>
      </div>
    </div>
  );
}

// ── Command Tab ──────────────────────────────────────────────────────────────

// ── Types ────────────────────────────────────────────────────────────────────

interface LogLine { type: 'user' | 'system' | 'error' | 'stream'; text: string; }
interface Job { id: string; command: string; status: string; log_lines: LogLine[]; started_at: string; }

// ── ANSI → plain text (strip colour codes for display) ───────────────────────
/* eslint-disable no-control-regex */
function stripAnsi(s: string) { return s.replace(/\x1b\[[0-9;]*m/g, ''); }
/* eslint-enable no-control-regex */

// ── CommandTab constants (module-level — static, no need to recreate per render) ──

const QUICK_ACTIONS: { label: string; cmd: string }[] = [
  { label: 'Analytics',        cmd: 'Get platform analytics overview' },
  { label: 'Applications',     cmd: 'List pending applications' },
  { label: 'Students',         cmd: 'List recent students' },
  { label: 'Enrollments',      cmd: 'List recent enrollments' },
  { label: 'Programs',         cmd: 'List all published programs' },
  { label: 'WIOA cases',       cmd: 'List pending WIOA cases' },
  { label: 'Payout queue',     cmd: 'List payout queue' },
  { label: 'System health',    cmd: 'Check system health' },
  { label: 'Daily report',     cmd: 'Run overall report' },
  { label: 'Enrollment report',cmd: 'Run enrollment report' },
  { label: 'Financial report', cmd: 'Run financial report' },
  { label: 'WIOA report',      cmd: 'Run WIOA report' },
  { label: 'Run payroll',      cmd: 'Run payroll' },
  { label: 'Export payroll',   cmd: 'Export payroll' },
  { label: 'Recent commits',   cmd: 'Show recent commits' },
  { label: 'Signing commits',  cmd: 'Show commits for components/SignaturePad.tsx' },
  { label: 'Export students',  cmd: 'Export students CSV' },
];

const AUTOPILOT: { label: string; cmd: string }[] = [
  { label: '🏗 Build courses',  cmd: 'Build all courses and push to GitHub' },
  { label: '🚀 Deploy LMS',     cmd: 'Deploy the LMS service' },
  { label: '🚀 Deploy Admin',   cmd: 'Deploy the admin service' },
  { label: '🧪 Smoke test',     cmd: 'Run smoke test' },
  { label: '🎬 Generate video', cmd: 'Generate a lesson video' },
  { label: '📚 Generate course',cmd: 'Generate a new course' },
];

// ── CommandTab ───────────────────────────────────────────────────────────────

function CommandTab({ quickCommands, initialCommand }: { quickCommands?: string[]; initialCommand?: string }) {
  const [input, setInput]       = useState('');
  const [lines, setLines]       = useState<LogLine[]>([]);
  const [loading, setLoading]   = useState(false);
  const [stabilizing, setStabilizing] = useState(false);
  const [stabilizeResult, setStabilizeResult] = useState<{ ok: boolean; summary: { passed: number; failed: number; skipped: number }; nextActions: string[] } | null>(null);
  const [jobId, setJobId]       = useState<string | null>(null);
  const [jobs, setJobs]         = useState<Job[]>([]);
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState<string | null>(null); // command awaiting confirmation
  const [confirmPhrase, setConfirmPhrase]   = useState<string>('');          // required phrase to type
  const [confirmInput, setConfirmInput]     = useState('');                  // what user has typed
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef  = useRef<AbortController | null>(null);
  const runIdRef  = useRef<number>(0); // incremented on each run; stale stream writes are discarded

  // Auto-scroll on new lines
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [lines]);

  // Load job history on mount (reconnect support — survives page reload)
  useEffect(() => {
    fetch('/api/devstudio/jobs?limit=20')
      .then(r => r.ok ? r.json() : { jobs: [] })
      .then(d => setJobs(d.jobs ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!initialCommand) return;
    setInput(initialCommand);
  }, [initialCommand]);

  // quickCommands comes from /api/admin/devstudio/config (platform_settings DB row).
  // The config API owns the fallback list — no duplicate here.
  const QUICK = quickCommands ?? [];

  const runStabilize = useCallback(async () => {
    if (stabilizing) return;
    setStabilizing(true);
    setStabilizeResult(null);
    try {
      const res = await fetch('/api/devstudio/stabilize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quick: true, includeTests: true, includeSmoke: false, maxOutputKb: 256 }),
      });
      const data = await res.json();
      setStabilizeResult({
        ok: data.ok,
        summary: data.summary,
        nextActions: data.nextActions ?? [],
      });
    } catch {
      setStabilizeResult({ ok: false, summary: { passed: 0, failed: 1, skipped: 0 }, nextActions: ['Stabilize request failed — check network'] });
    } finally {
      setStabilizing(false);
    }
  }, [stabilizing]);

  async function run(cmd: string) {
    if (!cmd.trim() || loading) return;

    // Cancel any in-flight stream and stamp a new run ID so stale writes are ignored
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    const thisRunId = ++runIdRef.current;

    setInput('');
    setActiveJob(null);
    setShowHistory(false);
    setPendingConfirm(null);

    const startLine: LogLine = { type: 'user', text: cmd };
    setLines([startLine]);
    setLoading(true);

    // Create persistent job row
    let currentJobId = `temp-${Date.now()}`;
    try {
      const jr = await fetch('/api/devstudio/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd }),
      });
      if (jr.ok) { const jd = await jr.json(); currentJobId = jd.jobId; }
    } catch { /* non-fatal */ }
    setJobId(currentJobId);

    const streamLines: string[] = [];

    // Smoke test bypasses the AI round-trip — call the endpoint directly
    const isSmokeTest = /smoke.?test|health.?check|check.*platform|verify.*platform/i.test(cmd);

    try {
      const res = await fetch(
        isSmokeTest ? '/api/devstudio/smoke-test' : '/api/devstudio/execute',
        isSmokeTest
          ? { signal: abortRef.current.signal }
          : {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ command: cmd }),
              signal: abortRef.current.signal,
            },
      );

      if (!res.ok || !res.body) {
        let errText = 'Request failed';
        try { const d = await res.json(); errText = d.error ?? errText; } catch { /* ignore */ }
        const errLine: LogLine = { type: 'error', text: errText };
        setLines([startLine, errLine]);
        await patchJob(currentJobId, [errText], 'failed');
        return;
      }

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split('\n');
        buf = parts.pop() ?? '';
        for (const part of parts) {
          if (!part.startsWith('data: ')) continue;
          const payload = part.slice(6).trim();
          if (payload === '[DONE]') continue;
          let text = payload;
          try {
            const p = JSON.parse(payload);
            text = p.line ?? p.text ?? p.output ?? payload;
          } catch { /* raw line */ }
          const clean = stripAnsi(text);
          if (!clean.trim()) continue;
          streamLines.push(clean);
          // Discard writes from a previous run that wasn't fully cancelled yet
          if (runIdRef.current === thisRunId) {
            setLines(prev => [...prev, { type: 'stream', text: clean }]);
            if (clean.includes('CONFIRMATION_REQUIRED')) {
              setPendingConfirm(cmd);
              setConfirmInput('');
              // Parse required phrase from stream: CONFIRMATION_PHRASE:CONFIRM DEPLOY
              const phraseMatch = clean.match(/CONFIRMATION_PHRASE:(.+)/);
              setConfirmPhrase(phraseMatch ? phraseMatch[1].trim() : 'CONFIRM');
            }
          }
        }
      }

      // Persist final log to DB
      await patchJob(currentJobId, streamLines, 'completed');

      // Refresh job history
      fetch('/api/devstudio/jobs?limit=20')
        .then(r => r.ok ? r.json() : { jobs: [] })
        .then(d => setJobs(d.jobs ?? []))
        .catch(() => {});

    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      const errLine: LogLine = { type: 'error', text: 'Stream disconnected — output above is preserved. Re-run to retry.' };
      setLines(prev => [...prev, errLine]);
      await patchJob(currentJobId, [...streamLines, errLine.text], 'failed');
    } finally {
      setLoading(false);
    }
  }

  async function patchJob(id: string, newLines: string[], status: string) {
    try {
      await fetch('/api/devstudio/jobs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: id, lines: newLines, status, finished_at: new Date().toISOString() }),
      });
    } catch { /* non-fatal */ }
  }

  function loadJob(job: Job) {
    setActiveJob(job);
    setShowHistory(false);
    const restored: LogLine[] = [
      { type: 'user', text: job.command },
      ...(job.log_lines ?? []).map((l: LogLine) => ({ ...l, type: 'stream' as const })),
    ];
    setLines(restored);
  }

  const statusColor = (s: string) =>
    s === 'completed' ? 'text-green-600' : s === 'failed' ? 'text-red-500' : 'text-amber-500';

  return (
    <div className="flex h-full overflow-hidden" style={{ background: '#1e1e1e' }}>

      {/* ── History sidebar ── */}
      {showHistory && (
        <div className="w-56 flex-shrink-0 flex flex-col overflow-hidden border-r" style={{ background: '#252526', borderColor: '#3c3c3c' }}>
          <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: '#3c3c3c' }}>
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#858585' }}>History</span>
            <button onClick={() => setShowHistory(false)} style={{ color: '#858585' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#cccccc')}
              onMouseLeave={e => (e.currentTarget.style.color = '#858585')}>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {jobs.length === 0 && (
              <p className="text-xs p-3 italic" style={{ color: '#555' }}>No previous jobs</p>
            )}
            {jobs.map(j => (
              <button key={j.id} onClick={() => loadJob(j)}
                className="w-full text-left px-3 py-2.5 border-b transition-colors"
                style={{
                  borderColor: '#3c3c3c',
                  background: activeJob?.id === j.id ? '#094771' : 'transparent',
                  borderLeft: activeJob?.id === j.id ? '2px solid #f97316' : '2px solid transparent',
                }}
                onMouseEnter={e => { if (activeJob?.id !== j.id) e.currentTarget.style.background = '#2a2d2e'; }}
                onMouseLeave={e => { if (activeJob?.id !== j.id) e.currentTarget.style.background = 'transparent'; }}>
                <p className="text-[11px] font-medium truncate" style={{ color: '#cccccc' }}>{j.command}</p>
                <p className={`text-[10px] mt-0.5 ${statusColor(j.status)}`}>
                  {j.status} · {new Date(j.started_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Main panel ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* Quick action buttons */}
        <div className="flex-shrink-0 border-b" style={{ background: '#2d2d2d', borderColor: '#3c3c3c' }}>
          <div className="flex items-center gap-1.5 px-2.5 py-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {QUICK_ACTIONS.map(({ label, cmd }) => (
              <button key={label} onClick={() => run(cmd)} disabled={loading}
                className="flex-shrink-0 px-2.5 py-1 text-[11px] rounded border disabled:opacity-40 transition-colors whitespace-nowrap"
                style={{ background: '#3c3c3c', borderColor: '#555', color: '#cccccc' }}
                onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = '#4a4a4a'; e.currentTarget.style.borderColor = '#f97316'; e.currentTarget.style.color = '#fff'; } }}
                onMouseLeave={e => { e.currentTarget.style.background = '#3c3c3c'; e.currentTarget.style.borderColor = '#555'; e.currentTarget.style.color = '#cccccc'; }}>
                {label}
              </button>
            ))}
          </div>
          {/* Autopilot row */}
          <div className="flex items-center gap-1.5 px-2.5 pb-2 pt-1 overflow-x-auto border-t" style={{ borderColor: '#3c3c3c', scrollbarWidth: 'none' }}>
            <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-widest" style={{ color: '#555' }}>Autopilot</span>
            {AUTOPILOT.map(({ label, cmd }) => (
              <button key={label} onClick={() => run(cmd)} disabled={loading}
                className="flex-shrink-0 px-2.5 py-1 text-[11px] rounded border disabled:opacity-40 transition-colors whitespace-nowrap"
                style={{ background: '#1a2a3a', borderColor: '#0078d4', color: '#4ec9b0' }}
                onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = '#0e3a5c'; e.currentTarget.style.color = '#fff'; } }}
                onMouseLeave={e => { e.currentTarget.style.background = '#1a2a3a'; e.currentTarget.style.color = '#4ec9b0'; }}>
                {label}
              </button>
            ))}
            {/* Stabilize button */}
            <button
              onClick={runStabilize}
              disabled={stabilizing || loading}
              className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1 text-[11px] rounded border disabled:opacity-40 transition-colors whitespace-nowrap ml-2"
              style={{ background: stabilizeResult ? (stabilizeResult.ok ? '#14532d' : '#450a0a') : '#1a1a2e', borderColor: stabilizeResult ? (stabilizeResult.ok ? '#16a34a' : '#dc2626') : '#7c3aed', color: stabilizeResult ? (stabilizeResult.ok ? '#86efac' : '#fca5a5') : '#a78bfa' }}
              title="Run audits + tests and get a unified pass/fail result"
            >
              <ShieldCheck className="w-3 h-3" />
              {stabilizing ? 'Stabilizing…' : stabilizeResult ? (stabilizeResult.ok ? `✅ ${stabilizeResult.summary.passed}p` : `❌ ${stabilizeResult.summary.failed}f`) : 'Stabilize'}
            </button>
          </div>
          {/* Stabilize result banner */}
          {stabilizeResult && (
            <div className="px-3 py-2 text-[11px] border-t" style={{ background: stabilizeResult.ok ? 'rgba(20,83,45,0.4)' : 'rgba(69,10,10,0.4)', borderColor: '#3c3c3c', color: stabilizeResult.ok ? '#86efac' : '#fca5a5' }}>
              {stabilizeResult.ok
                ? `✅ All checks passed (${stabilizeResult.summary.passed} passed, ${stabilizeResult.summary.skipped} skipped)`
                : `❌ ${stabilizeResult.summary.failed} check(s) failed — ${stabilizeResult.nextActions[0]}`}
            </div>
          )}
        </div>

        {/* Log output — live streaming */}
        <div className="flex-1 overflow-y-auto p-3 font-mono text-xs space-y-0.5" style={{ background: '#1e1e1e' }}>
          {lines.length === 0 && !loading && (
            <p className="italic pt-2" style={{ color: '#555' }}>// No output yet — run a command or click a shortcut above</p>
          )}
          {lines.map((l, i) => (
            <div key={i} style={{
              color: l.type === 'user' ? '#f97316' :
                     l.type === 'error' ? '#f87171' : '#cccccc',
              background: l.type === 'error' ? 'rgba(239,68,68,0.1)' : 'transparent',
              borderRadius: l.type === 'error' ? 3 : 0,
              padding: l.type === 'error' ? '0 4px' : 0,
              fontWeight: l.type === 'user' ? 700 : 400,
            }}>
              {l.type === 'user' ? `$ ${l.text}` : l.text}
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-1.5 animate-pulse pt-1" style={{ color: '#f97316' }}>
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Running…</span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div className="flex-shrink-0 p-3 border-t" style={{ background: '#252526', borderColor: '#3c3c3c' }}>
          {/* Confirmation banner */}
          {pendingConfirm && !loading && (
            <div className="mb-3 px-3 py-3 rounded-lg border" style={{ background: 'rgba(251,191,36,0.08)', borderColor: '#f59e0b' }}>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: '#f59e0b' }} />
                <span className="text-xs font-semibold" style={{ color: '#fcd34d' }}>
                  Production action requires confirmation
                </span>
              </div>
              <p className="text-xs mb-2" style={{ color: '#9ca3af' }}>
                Type <span className="font-mono font-bold" style={{ color: '#fbbf24' }}>{confirmPhrase}</span> exactly to proceed:
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={confirmInput}
                  onChange={e => setConfirmInput(e.target.value)}
                  placeholder={confirmPhrase}
                  autoFocus
                  className="flex-1 px-2 py-1.5 rounded text-xs font-mono"
                  style={{ background: '#1e1e1e', border: '1px solid #f59e0b', color: '#fff', outline: 'none' }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && confirmInput === confirmPhrase) {
                      run(`${pendingConfirm} confirmationText="${confirmPhrase}"`);
                      setPendingConfirm(null);
                      setConfirmInput('');
                    }
                  }}
                />
                <button
                  disabled={confirmInput !== confirmPhrase}
                  onClick={() => {
                    run(`${pendingConfirm} confirmationText="${confirmPhrase}"`);
                    setPendingConfirm(null);
                    setConfirmInput('');
                  }}
                  className="text-xs font-bold px-3 py-1.5 rounded transition-opacity"
                  style={{
                    background: confirmInput === confirmPhrase ? '#f59e0b' : '#4b3a00',
                    color: confirmInput === confirmPhrase ? '#1c1c1c' : '#6b5a00',
                    cursor: confirmInput === confirmPhrase ? 'pointer' : 'not-allowed',
                  }}
                >
                  Execute
                </button>
                <button
                  onClick={() => { setPendingConfirm(null); setConfirmInput(''); }}
                  className="text-xs px-2 py-1.5 rounded"
                  style={{ color: '#858585' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          {/* Toolbar row */}
          <div className="flex items-center gap-2 mb-2">
            <button onClick={() => setShowHistory(h => !h)}
              className="text-[11px] rounded px-2 py-0.5 border transition-colors"
              style={{ color: '#858585', borderColor: '#3c3c3c', background: 'transparent' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#cccccc'; e.currentTarget.style.background = '#3c3c3c'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#858585'; e.currentTarget.style.background = 'transparent'; }}>
              {showHistory ? 'Hide history' : `History (${jobs.length})`}
            </button>
            {loading && (
              <button onClick={() => { abortRef.current?.abort(); setLoading(false); }}
                className="text-[11px] rounded px-2 py-0.5 border transition-colors"
                style={{ color: '#f87171', borderColor: '#7f1d1d', background: 'rgba(239,68,68,0.1)' }}>
                Cancel
              </button>
            )}
            {jobId && !loading && (
              <span className="text-[10px] ml-auto font-mono" style={{ color: '#555' }}>job {jobId.slice(0, 8)}</span>
            )}
          </div>
          {/* Input + send */}
          <div className="flex gap-2 items-center">
            <span className="font-mono text-sm font-bold" style={{ color: '#f97316' }}>$</span>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); run(input); } }}
              placeholder="Tell it what to do… e.g. 'Run enrollment report', 'List at-risk students'"
              disabled={loading}
              className="flex-1 rounded-lg px-3 py-2 text-sm outline-none font-mono h-10 disabled:opacity-60"
              style={{ background: '#3c3c3c', border: '1px solid #555', color: '#cccccc' }}
              onFocus={e => (e.currentTarget.style.borderColor = '#0078d4')}
              onBlur={e => (e.currentTarget.style.borderColor = '#555')}
            />
            <button onClick={() => run(input)} disabled={loading || !input.trim()}
              className="rounded-md disabled:opacity-40 transition-colors h-10 w-10 inline-flex items-center justify-center"
              style={{ background: '#f97316' }}
              onMouseEnter={e => { if (!loading && input.trim()) e.currentTarget.style.background = '#ea6c00'; }}
              onMouseLeave={e => (e.currentTarget.style.background = '#f97316')}>
              <Send className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
          <p className="text-[10px] mt-1.5" style={{ color: '#555' }}>Enter to run · Output persists across page reloads</p>
        </div>
      </div>
    </div>
  );
}
// ── Terminal Tab ─────────────────────────────────────────────────────────────

interface RunStatus {
  id: number;
  status: string;
  conclusion: string | null;
  url: string;
}

const WORKFLOW_BUTTONS: { key: WorkflowKey; label: string; description: string }[] = [
  { key: 'deploy-lms',    label: 'Deploy LMS',    description: 'Build + deploy LMS through Northflank' },
  { key: 'deploy-admin',  label: 'Deploy Admin',  description: 'Build + deploy Admin through Northflank' },
  { key: 'deploy-studio', label: 'Deploy Studio', description: 'Build + deploy Studio shell through Northflank' },
  { key: 'ci',           label: 'Run CI',        description: 'Full CI pipeline' },
  { key: 'lint',         label: 'Lint',          description: 'Run pnpm lint' },
];

function TerminalTab({
  workflowButtons,
}: {
  workflowButtons?: { key: WorkflowKey; label: string; description: string }[];
}) {
  const [lines, setLines] = useState<string[]>([
    'Dev Studio — GitHub Actions runner',
    'Click a workflow button to trigger a deployment or CI run.',
    'Changes committed via the Explorer tab will trigger auto-deploy on push to main.',
    '',
  ]);
  const [loading, setLoading] = useState<WorkflowKey | null>(null);
  const [activeRun, setActiveRun] = useState<RunStatus | null>(null);
  // Track the poll timeout so we can cancel it on unmount or new dispatch
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, []);

  function schedulePoll(runId: number, attempt = 0) {
    const MAX_ATTEMPTS = 60; // ~8 min at 8s intervals
    if (attempt >= MAX_ATTEMPTS) {
      if (mountedRef.current) {
        setLines((p) => [...p, `⚠ Polling timed out for run #${runId}`, '']);
      }
      return;
    }
    pollTimerRef.current = setTimeout(async () => {
      if (!mountedRef.current) return;
      try {
        const res = await fetch(`/api/devstudio/shell?run_id=${runId}`);
        if (!mountedRef.current) return;
        if (!res.ok) {
          // Retry on transient errors
          schedulePoll(runId, attempt + 1);
          return;
        }
        const d: RunStatus = await res.json();
        setActiveRun(d);
        if (d.status === 'completed') {
          setLines((p) => [...p,
            `Run #${runId} completed — ${d.conclusion ?? 'unknown'}`,
            `   ${d.url}`,
            '',
          ]);
        } else {
          schedulePoll(runId, attempt + 1);
        }
      } catch {
        // Retry on network errors
        if (mountedRef.current) schedulePoll(runId, attempt + 1);
      }
    }, 8000);
  }

  async function dispatch(workflow: WorkflowKey) {
    // Cancel any in-flight poll before starting a new dispatch
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    setLoading(workflow);
    setLines((p) => [...p, `▶ Dispatching ${workflow}…`]);
    try {
      const res = await fetch('/api/devstudio/shell', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow }),
      });
      const d = await res.json();
      if (!res.ok) {
        setLines((p) => [...p, `❌ ${d.error ?? 'Dispatch failed'}`]);
      } else {
        setLines((p) => [...p,
          `✅ Workflow queued — run #${d.runId ?? '?'}`,
          `   Status: ${d.status}`,
          `   URL: ${d.runUrl}`,
          '',
        ]);
        if (d.runId) {
          setActiveRun({ id: d.runId, status: d.status, conclusion: null, url: d.runUrl });
          schedulePoll(d.runId);
        }
      }
    } catch {
      setLines((p) => [...p, '❌ Request failed']);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-col h-full" style={{ background: '#1e1e1e' }}>
      {/* Workflow buttons */}
      <div className="flex-shrink-0 flex flex-wrap gap-2 px-4 py-3 border-b" style={{ background: '#2d2d2d', borderColor: '#3c3c3c' }}>
        {(workflowButtons && workflowButtons.length > 0 ? workflowButtons : WORKFLOW_BUTTONS).map(({ key, label, description }) => (
          <button key={key} onClick={() => dispatch(key)} disabled={!!loading}
            title={description}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] rounded-md border disabled:opacity-50 transition-colors"
            style={{ background: '#3c3c3c', borderColor: '#555', color: '#cccccc' }}
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = '#4a4a4a'; e.currentTarget.style.borderColor = '#0078d4'; e.currentTarget.style.color = '#ffffff'; } }}
            onMouseLeave={e => { e.currentTarget.style.background = '#3c3c3c'; e.currentTarget.style.borderColor = '#555'; e.currentTarget.style.color = '#cccccc'; }}>
            {loading === key ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
            {label}
          </button>
        ))}
        {activeRun && (
          <a href={activeRun.url} target="_blank" rel="noopener noreferrer"
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-[11px] rounded-md transition-colors"
            style={{ background: '#3c3c3c', color: '#858585' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#cccccc')}
            onMouseLeave={e => (e.currentTarget.style.color = '#858585')}>
            <ExternalLink className="w-3 h-3" />
            {activeRun.status === 'completed'
              ? `${activeRun.conclusion ?? 'done'}`
              : activeRun.status}
          </a>
        )}
      </div>
      {/* Shell info — WebSocket PTY requires a dedicated studio-shell runtime/container.
         Until that runtime is deployed, the workflow buttons above are the shell. */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4" style={{ background: '#1e1e1e' }}>
        <div className="font-mono text-[11px] space-y-1" style={{ color: '#858585' }}>
          <p style={{ color: '#4ec9b0' }}>// Dev Studio — GitHub Actions shell</p>
          <p>// Use the workflow buttons above to trigger deployments and CI.</p>
          <p>// A real PTY terminal requires the studio-shell runtime/container to be running.</p>
          <p></p>
          <p style={{ color: '#858585' }}>// To enable the PTY terminal:</p>
          <p>// 1. Deploy the studio-shell runtime/container in Northflank</p>
          <p>// 2. Set STUDIO_SHELL_WS_URL in Admin → Integrations → Env Manager</p>
          <p>// 3. Set STUDIO_SHELL_SECRET in the same place</p>
          <p>// 4. Redeploy the admin service to pick up the new secrets</p>
          <p></p>
          <p style={{ color: '#858585' }}>// Until then, use the Command tab for AI-driven operations</p>
          <p>// or the workflow buttons above to trigger GitHub Actions directly.</p>
        </div>
      </div>
    </div>
  );
}
// ── Files Tab ────────────────────────────────────────────────────────────────

// ── ContainerTab ─────────────────────────────────────────────────────────────
// Split vertically: runtime status (capped at 280px) on top, DevContainer fills rest.
// Both children must be overflow-hidden so h-full resolves correctly inside them.
function ContainerTab() {
  return (
    <div className="h-full flex flex-col overflow-hidden bg-white">
      {/* Runtime status — capped height, scrolls internally */}
      <div className="flex-shrink-0 overflow-hidden border-b border-slate-200" style={{ maxHeight: 280 }}>
        <div className="h-full overflow-y-auto">
          <EcsStatusPanel />
        </div>
      </div>
      {/* DevContainer editor — fills remaining space, manages its own scroll */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <DevContainerPanel />
      </div>
    </div>
  );
}

function FilesTab() {
  const [files, setFiles] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [fileSha, setFileSha] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [commitMsg, setCommitMsg] = useState('');
  const [treeError, setTreeError] = useState<string | null>(null);
  const [fileLoading, setFileLoading] = useState(false);

  useEffect(() => {
    fetch('/api/devstudio/files')
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) {
          setTreeError(d.error ?? `Error ${r.status} loading file tree`);
          return;
        }
        // Flatten tree to path list for FileTree component
        const flat: string[] = [];
        function walk(nodes: FileNode[]) {
          for (const n of nodes ?? []) {
            if (n.type === 'file') flat.push(n.path);
            else walk(n.children ?? []);
          }
        }
        walk(d.tree ?? []);
        setFiles(flat);
      })
      .catch((e) => setTreeError(e.message ?? 'Failed to load file tree'));
  }, []);

  async function loadFile(path: string) {
    setSelected(path);
    setSaveMsg('');
    setFileLoading(true);
    try {
      const r = await fetch(`/api/devstudio/files?path=${encodeURIComponent(path)}`);
      const d = await r.json();
      if (!r.ok) {
        setContent('');
        setFileSha('');
        setSaveMsg(`❌ ${d.error ?? `Error ${r.status}`}`);
      } else {
        setContent(d.content ?? '');
        setFileSha(d.sha ?? '');
        setCommitMsg(`chore: update ${path} via Dev Studio`);
      }
    } catch (e: unknown) {
      setSaveMsg(`❌ ${e instanceof Error ? e.message : 'Failed to load file'}`);
    } finally {
      setFileLoading(false);
    }
  }

  async function saveFile() {
    if (!selected || !fileSha) return;
    setSaving(true);
    setSaveMsg('');
    try {
      const r = await fetch('/api/devstudio/files', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: selected, content, sha: fileSha, message: commitMsg }),
      });
      const d = await r.json();
      if (!r.ok) {
        setSaveMsg(`❌ ${d.error ?? 'Save failed'}`);
      } else {
        if (d.sha) setFileSha(d.sha);
        setSaveMsg(d.commit ? '✅ Committed' : '✅ Saved');
        setTimeout(() => setSaveMsg(''), 4000);
      }
    } catch {
      setSaveMsg('❌ Request failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col md:flex-row h-full" style={{ background: '#1e1e1e' }}>
      {/* Sidebar — FileTree component */}
      <div className="w-full md:w-56 flex-shrink-0 border-b md:border-b-0 md:border-r overflow-y-auto"
        style={{ background: '#252526', borderColor: '#3c3c3c', minHeight: 0 }}>
        {treeError ? (
          <div className="p-3">
            <p className="text-[11px] font-bold mb-1" style={{ color: '#f87171' }}>File tree unavailable</p>
            <p className="text-[10px] leading-relaxed" style={{ color: '#858585' }}>{treeError}</p>
            {treeError.toLowerCase().includes('github_token') && (
              <p className="text-[10px] mt-2" style={{ color: '#4ec9b0' }}>
                Add GITHUB_TOKEN in Admin → Dev Studio → Secrets tab.
              </p>
            )}
          </div>
        ) : (
          <FileTree
            files={files}
            onFileSelect={loadFile}
            selectedFile={selected ?? undefined}
          />
        )}
      </div>
      {/* Editor */}
      <div className="flex-1 flex flex-col min-w-0" style={{ background: '#1e1e1e' }}>
        {fileLoading ? (
          <div className="flex items-center justify-center h-full gap-2" style={{ color: '#858585' }}>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-xs font-mono">Loading…</span>
          </div>
        ) : selected ? (
          <>
            <div className="flex-shrink-0 flex flex-col gap-1 px-4 py-1.5 border-b" style={{ background: '#2d2d2d', borderColor: '#3c3c3c' }}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono truncate max-w-xs" style={{ color: '#858585' }}>{selected}</span>
                {saveMsg && <span className="text-[11px]" style={{ color: saveMsg.startsWith('✅') ? '#4ec9b0' : '#f87171' }}>{saveMsg}</span>}
                <button onClick={saveFile} disabled={saving || !fileSha}
                  className="flex items-center gap-1 px-2 py-0.5 text-[10px] rounded disabled:opacity-50 transition-colors"
                  style={{ background: '#f97316', color: '#fff' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#ea6c00')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#f97316')}>
                  <Save className="w-2.5 h-2.5" />{saving ? 'Committing…' : 'Commit'}
                </button>
              </div>
              <input
                value={commitMsg}
                onChange={(e) => setCommitMsg(e.target.value)}
                placeholder="Commit message…"
                className="text-[11px] font-mono rounded px-2 py-0.5 outline-none"
                style={{ background: '#3c3c3c', border: '1px solid #555', color: '#cccccc' }}
                onFocus={e => (e.currentTarget.style.borderColor = '#0078d4')}
                onBlur={e => (e.currentTarget.style.borderColor = '#555')}
              />
            </div>
            <div className="flex-1 min-h-0">
              <CodeEditor value={content} onChange={(val) => setContent(val)} filePath={selected} />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <FolderOpen className="w-10 h-10" style={{ color: '#3c3c3c' }} />
            <p className="text-xs" style={{ color: '#555' }}>Select a file to edit</p>
          </div>
        )}{/* /fileLoading */}
      </div>
    </div>
  );
}
// WebsiteTab removed — preview is now the unified right pane with its own address bar.
