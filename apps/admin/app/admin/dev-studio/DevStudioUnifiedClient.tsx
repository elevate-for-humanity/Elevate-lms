'use client';

import { type ElementType, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import {
  Activity,
  Bot,
  BookOpen,
  Box,
  Circle,
  ExternalLink,
  FileText,
  FolderOpen,
  Globe,
  Key,
  Loader2,
  MessageSquare,
  RefreshCw,
  Rocket,
  Save,
  Send,
  Server,
  Sparkles,
  Upload,
} from 'lucide-react';

interface WorkflowButton {
  key: string;
  label: string;
  description: string;
}

interface StudioConfig {
  workflowButtons?: WorkflowButton[];
  defaultPreviewUrl?: string;
  previewTargets?: { label: string; url: string }[];
}

interface CourseProgram {
  id: string;
  title: string;
  slug: string;
}

interface CourseBuilderProps {
  programs: CourseProgram[];
  embedded?: boolean;
  initialProgramId?: string;
}

type Workspace = 'studio' | 'deploy' | 'files' | 'environments' | 'health' | 'secrets';
type StudioMode = 'ask' | 'run' | 'courses';

const UnifiedEllieChat = dynamic(() => import('@/components/dev-studio/UnifiedEllieChat'), {
  ssr: false,
});
const DevStudioEditorWorkspace = dynamic(
  () => import('@/components/dev-studio/DevStudioEditorWorkspace'),
  { ssr: false },
);
const DeployPanel = dynamic(() => import('@/components/dev-studio/DeployPanel'), { ssr: false });
const DevContainerPanel = dynamic(() => import('@/components/dev-studio/DevContainerPanel'), { ssr: false });
const ServicesPanel = dynamic(() => import('@/components/dev-studio/ServicesPanel'), { ssr: false });
const SecretsPanel = dynamic(() => import('@/components/dev-studio/SecretsPanel'), { ssr: false });
const AICourseBuilderChat = dynamic<CourseBuilderProps>(
  () => import('../courses/ai-builder/AICourseBuilderChat'),
  { ssr: false },
);

const WORKSPACES: { id: Workspace; label: string; Icon: ElementType<{ className?: string }> }[] = [
  { id: 'studio', label: 'Studio', Icon: Bot },
  { id: 'deploy', label: 'Deploy', Icon: Rocket },
  { id: 'files', label: 'Files', Icon: FolderOpen },
  { id: 'environments', label: 'Container', Icon: Box },
  { id: 'health', label: 'Health', Icon: Activity },
  { id: 'secrets', label: 'Secrets', Icon: Key },
];

const QUICK_ACTIONS = [
  { label: 'Website deploy', command: 'Deploy the LMS service' },
  { label: 'Admin deploy', command: 'Deploy the admin service' },
  { label: 'Studio deploy', command: 'Deploy the studio service' },
  { label: 'Smoke test', command: 'Run smoke test' },
  { label: 'Build course', command: 'Generate a new course' },
  { label: 'System health', command: 'Check system health' },
];

function normalizeWorkspace(tab: string | null): { workspace: Workspace; mode: StudioMode } {
  if (tab === 'deploy') return { workspace: 'deploy', mode: 'ask' };
  if (tab === 'files' || tab === 'git' || tab === 'docs' || tab === 'documents') return { workspace: 'files', mode: 'ask' };
  if (tab === 'container' || tab === 'environments' || tab === 'services') return { workspace: 'environments', mode: 'ask' };
  if (tab === 'health') return { workspace: 'health', mode: 'ask' };
  if (tab === 'secrets') return { workspace: 'secrets', mode: 'ask' };
  if (tab === 'command' || tab === 'terminal') return { workspace: 'studio', mode: 'run' };
  if (tab === 'courses' || tab === 'course') return { workspace: 'studio', mode: 'courses' };
  return { workspace: 'studio', mode: 'ask' };
}

export default function DevStudioUnifiedClient({ isSuperAdmin = false }: { isSuperAdmin?: boolean }) {
  const searchParams = useSearchParams();
  const initial = normalizeWorkspace(searchParams.get('tab'));
  const [workspace, setWorkspace] = useState<Workspace>(initial.workspace === 'secrets' && !isSuperAdmin ? 'studio' : initial.workspace);
  const [studioMode, setStudioMode] = useState<StudioMode>(initial.mode);
  const [config, setConfig] = useState<StudioConfig | null>(null);
  const [health, setHealth] = useState<Record<string, unknown> | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [livePreviewUrl, setLivePreviewUrl] = useState('');
  const [programs, setPrograms] = useState<CourseProgram[]>([]);
  const [programsLoading, setProgramsLoading] = useState(false);

  useEffect(() => {
    fetch('/api/admin/devstudio/config')
      .then((r) => r.json())
      .then((data: StudioConfig) => {
        setConfig(data);
        const nextPreview = data.defaultPreviewUrl || window.location.origin;
        setPreviewUrl((current) => current || nextPreview);
        setLivePreviewUrl((current) => current || nextPreview);
      })
      .catch(() => {
        setConfig(null);
        setPreviewUrl((current) => current || window.location.origin);
        setLivePreviewUrl((current) => current || window.location.origin);
      });
  }, []);

  useEffect(() => {
    fetch('/api/devstudio/health')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setHealth(data))
      .catch(() => setHealth(null));
  }, []);

  useEffect(() => {
    setProgramsLoading(true);
    fetch('/api/admin/programs?status=active')
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((payload) => {
        const rows = Array.isArray(payload?.data) ? payload.data : [];
        setPrograms(rows.map((program: { id: string; title?: string; name?: string; slug?: string; code?: string }) => ({
          id: program.id,
          title: program.title ?? program.name ?? program.code ?? 'Untitled program',
          slug: program.slug ?? program.code ?? program.id,
        })));
      })
      .catch(() => setPrograms([]))
      .finally(() => setProgramsLoading(false));
  }, []);

  const activeProviders = useMemo(() => {
    if (!health) return 'checking';
    return [
      health.hasGroq && 'Groq',
      health.hasGemini && 'Gemini',
      health.hasOpenAI && 'OpenAI',
      health.hasAnthropic && 'Anthropic',
    ].filter(Boolean).join(' / ') || 'no AI keys';
  }, [health]);

  function openWorkspace(next: Workspace) {
    if (next === 'secrets' && !isSuperAdmin) {
      setWorkspace('health');
      return;
    }
    setWorkspace(next);
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[#1e1e1e] text-[#cccccc]">
      <header className="flex min-h-11 shrink-0 flex-wrap items-center gap-2 border-b border-[#3c3c3c] bg-[#2d2d2d] px-3">
        <div className="flex min-w-0 items-center gap-2">
          <Bot className="h-4 w-4 text-[#4ec9b0]" />
          <span className="text-sm font-semibold text-white">Dev Studio</span>
          <span className="hidden text-[11px] text-[#858585] sm:inline">Codex workspace</span>
        </div>
        <div className="ml-auto flex min-w-0 flex-wrap items-center justify-end gap-2 text-[11px]">
          <span className="inline-flex items-center gap-1 text-[#4ec9b0]">
            <Circle className="h-2 w-2 fill-current" />
            Unified
          </span>
          <span className="rounded border border-[#3c3c3c] px-1.5 py-0.5 text-[#9ca3af]">
            AI: {activeProviders}
          </span>
          <button
            type="button"
            onClick={() => setWorkspace('deploy')}
            className="inline-flex h-7 items-center gap-1 rounded bg-[#0078d4] px-2 text-white"
          >
            <Rocket className="h-3.5 w-3.5" />
            Deploy
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-48 shrink-0 flex-col border-r border-[#3c3c3c] bg-[#252526] p-2 md:flex">
          <div className="mb-2 px-2 text-[10px] font-bold uppercase tracking-widest text-[#858585]">Environments</div>
          <div className="space-y-1">
            {WORKSPACES.filter((item) => item.id !== 'secrets' || isSuperAdmin).map(({ id, label, Icon }) => {
              const active = workspace === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => openWorkspace(id)}
                  className="flex h-9 w-full items-center gap-2 rounded px-2 text-left text-[12px] transition"
                  style={{ background: active ? '#094771' : 'transparent', color: active ? '#ffffff' : '#cccccc' }}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{label}</span>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col md:flex-row">
          <main className="min-h-0 min-w-0 flex-1 overflow-hidden">
            <MobileTabs workspace={workspace} isSuperAdmin={isSuperAdmin} onChange={openWorkspace} />
            {workspace === 'studio' && (
              <StudioPanel
                mode={studioMode}
                onModeChange={setStudioMode}
                programs={programs}
                programsLoading={programsLoading}
              />
            )}
            {workspace === 'deploy' && <DeployPanel workflowButtons={config?.workflowButtons} />}
            {workspace === 'files' && <DevStudioEditorWorkspace />}
            {workspace === 'environments' && <EnvironmentPanel />}
            {workspace === 'health' && <HealthPanel health={health} onRefresh={() => window.location.reload()} />}
            {workspace === 'secrets' && (isSuperAdmin ? <SecretsPanel /> : <HealthPanel health={health} onRefresh={() => window.location.reload()} />)}
          </main>

          <section className="hidden w-[38vw] min-w-[340px] max-w-[560px] shrink-0 flex-col border-l border-[#3c3c3c] bg-[#1e1e1e] lg:flex">
            <div className="flex h-10 shrink-0 items-center gap-1.5 border-b border-[#3c3c3c] bg-[#2d2d2d] px-2">
              <button
                type="button"
                onClick={() => setLivePreviewUrl(previewUrl)}
                className="inline-flex h-7 w-7 items-center justify-center rounded text-[#858585] hover:text-white"
                title="Refresh preview"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
              <form
                className="flex min-w-0 flex-1 items-center rounded border border-[#555] bg-[#3c3c3c] px-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  setLivePreviewUrl(previewUrl);
                }}
              >
                <Globe className="mr-1.5 h-3.5 w-3.5 shrink-0 text-[#4ec9b0]" />
                <input
                  value={previewUrl}
                  onChange={(event) => setPreviewUrl(event.target.value)}
                  className="h-7 min-w-0 flex-1 bg-transparent text-[11px] text-[#cccccc] outline-none"
                  spellCheck={false}
                />
              </form>
              <a
                href={livePreviewUrl || previewUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-7 w-7 items-center justify-center rounded text-[#858585] hover:text-white"
                title="Open preview"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
            <iframe title="Live Preview" src={livePreviewUrl || previewUrl} className="min-h-0 flex-1 border-0 bg-white" />
          </section>
        </div>
      </div>

      <footer className="flex h-6 shrink-0 items-center justify-between bg-[#0078d4] px-3 text-[11px] text-white">
        <span>main</span>
        <span className="hidden sm:inline">Northflank / Supabase / GitHub Actions</span>
        <span>TypeScript</span>
      </footer>
    </div>
  );
}

function MobileTabs({
  workspace,
  isSuperAdmin,
  onChange,
}: {
  workspace: Workspace;
  isSuperAdmin: boolean;
  onChange: (workspace: Workspace) => void;
}) {
  return (
    <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-[#3c3c3c] bg-[#252526] p-1 md:hidden">
      {WORKSPACES.filter((item) => item.id !== 'secrets' || isSuperAdmin).map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded"
          style={{ background: workspace === id ? '#094771' : 'transparent', color: workspace === id ? '#ffffff' : '#cccccc' }}
          title={label}
        >
          <Icon className="h-5 w-5" />
        </button>
      ))}
    </div>
  );
}

function StudioPanel({
  mode,
  onModeChange,
  programs,
  programsLoading,
}: {
  mode: StudioMode;
  onModeChange: (mode: StudioMode) => void;
  programs: CourseProgram[];
  programsLoading: boolean;
}) {
  const modes: { id: StudioMode; label: string; Icon: ElementType<{ className?: string }> }[] = [
    { id: 'ask', label: 'Ask', Icon: MessageSquare },
    { id: 'run', label: 'Run', Icon: Sparkles },
    { id: 'courses', label: 'Courses', Icon: BookOpen },
  ];

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex h-11 shrink-0 items-center gap-1 border-b border-[#3c3c3c] bg-[#252526] px-2">
        {modes.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onModeChange(id)}
            className="inline-flex h-8 items-center gap-1.5 rounded border px-2.5 text-[11px]"
            style={{ borderColor: mode === id ? '#0078d4' : '#3c3c3c', background: mode === id ? '#094771' : 'transparent', color: '#ffffff' }}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        {mode === 'ask' && <UnifiedEllieChat embedded />}
        {mode === 'run' && <RunPanel />}
        {mode === 'courses' && (
          programsLoading ? (
            <div className="flex h-full items-center justify-center gap-2 text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-xs font-medium">Loading active programs...</span>
            </div>
          ) : (
            <AICourseBuilderChat programs={programs} embedded />
          )
        )}
      </div>
    </div>
  );
}

function RunPanel() {
  const [input, setInput] = useState('');
  const [lines, setLines] = useState<{ type: 'user' | 'output' | 'error'; text: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  async function run(command: string) {
    const trimmed = command.trim();
    if (!trimmed || loading) return;
    setInput('');
    setLoading(true);
    setLines([{ type: 'user', text: trimmed }]);

    try {
      const isSmoke = /smoke.?test|health.?check|check.*platform|verify.*platform/i.test(trimmed);
      const res = await fetch(
        isSmoke ? '/api/devstudio/smoke-test' : '/api/devstudio/execute',
        isSmoke ? undefined : {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: trimmed }),
        },
      );

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed with HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split('\n');
        buffer = chunks.pop() ?? '';
        for (const chunk of chunks) {
          if (!chunk.startsWith('data: ')) continue;
          const raw = chunk.slice(6).trim();
          if (!raw || raw === '[DONE]') continue;
          let text = raw;
          try {
            const parsed = JSON.parse(raw);
            text = parsed.line ?? parsed.text ?? parsed.output ?? raw;
          } catch {
            text = raw;
          }
          setLines((current) => [...current, { type: 'output', text }]);
        }
      }
    } catch (error) {
      setLines((current) => [...current, { type: 'error', text: error instanceof Error ? error.message : 'Command failed' }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#1e1e1e]">
      <div className="flex shrink-0 gap-1.5 overflow-x-auto border-b border-[#3c3c3c] bg-[#2d2d2d] px-2 py-2">
        {QUICK_ACTIONS.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => run(item.command)}
            disabled={loading}
            className="shrink-0 rounded border border-[#555] bg-[#3c3c3c] px-2.5 py-1 text-[11px] text-[#cccccc] disabled:opacity-50"
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3 font-mono text-xs">
        {lines.length === 0 && <p className="text-[#555]">Ready.</p>}
        {lines.map((line, index) => (
          <div
            key={`${line.type}-${index}`}
            className="whitespace-pre-wrap break-words"
            style={{ color: line.type === 'user' ? '#f97316' : line.type === 'error' ? '#f87171' : '#cccccc' }}
          >
            {line.type === 'user' ? `$ ${line.text}` : line.text}
          </div>
        ))}
        {loading && (
          <div className="mt-2 flex items-center gap-2 text-[#f97316]">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Running
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <form
        className="flex shrink-0 items-center gap-2 border-t border-[#3c3c3c] bg-[#252526] p-3"
        onSubmit={(event) => {
          event.preventDefault();
          run(input);
        }}
      >
        <span className="font-mono text-sm font-bold text-[#f97316]">$</span>
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          className="h-10 min-w-0 flex-1 rounded border border-[#555] bg-[#3c3c3c] px-3 font-mono text-sm text-[#cccccc] outline-none"
          placeholder="Tell Studio what to run"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="inline-flex h-10 w-10 items-center justify-center rounded bg-[#f97316] text-white disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}

const MAX_UPLOAD_BYTES = 512 * 1024;
const TEXT_UPLOAD_EXTENSIONS = new Set([
  'css',
  'csv',
  'html',
  'js',
  'jsx',
  'json',
  'md',
  'mdx',
  'mjs',
  'sql',
  'svg',
  'ts',
  'tsx',
  'txt',
  'xml',
  'yml',
  'yaml',
]);

function sanitizeUploadPath(path: string): string {
  return path
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
    .replace(/\/{2,}/g, '/')
    .trim();
}

function isEditableUpload(file: File): boolean {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (TEXT_UPLOAD_EXTENSIONS.has(ext)) return true;
  if (file.type.startsWith('text/')) return true;
  return ['application/json', 'application/xml', 'image/svg+xml'].includes(file.type);
}

function FilesPanel() {
  const [files, setFiles] = useState<string[]>([]);
  const [selected, setSelected] = useState('');
  const [content, setContent] = useState('');
  const [sha, setSha] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadPath, setUploadPath] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshFiles = useCallback(async () => {
    try {
      const res = await fetch('/api/devstudio/files');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      const flat: string[] = [];
      function walk(nodes: { type: string; path: string; children?: unknown[] }[]) {
        for (const node of nodes ?? []) {
          if (node.type === 'file') flat.push(node.path);
          else walk((node.children ?? []) as { type: string; path: string; children?: unknown[] }[]);
        }
      }
      walk(data.tree ?? []);
      setFiles(flat);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'File tree unavailable');
    }
  }, []);

  useEffect(() => {
    void refreshFiles();
  }, [refreshFiles]);

  async function handleUpload(file: File | undefined) {
    if (!file) return;
    setStatus('');

    if (file.size > MAX_UPLOAD_BYTES) {
      setStatus(`Upload exceeds ${MAX_UPLOAD_BYTES / 1024} KB edit limit`);
      return;
    }

    if (!isEditableUpload(file)) {
      setStatus('Upload is not a text/code file');
      return;
    }

    try {
      const nextPath = sanitizeUploadPath(uploadPath || `devstudio-uploads/${file.name}`);
      if (!nextPath) throw new Error('Upload path is required');
      const text = await file.text();
      setSelected(nextPath);
      setUploadPath(nextPath);
      setContent(text);
      setSha('');
      setMessage(`chore: add ${nextPath} via Dev Studio`);
      setStatus('Ready to commit upload');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not read upload');
    }
  }

  async function loadFile(path: string) {
    setSelected(path);
    setLoading(true);
    setStatus('');
    try {
      const res = await fetch(`/api/devstudio/files?path=${encodeURIComponent(path)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setContent(data.content ?? '');
      setSha(data.sha ?? '');
      setUploadPath('');
      setMessage(`chore: update ${path} via Dev Studio`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not load file');
    } finally {
      setLoading(false);
    }
  }

  async function saveFile() {
    if (!selected) return;
    setLoading(true);
    setStatus('');
    try {
      const method = sha ? 'PUT' : 'POST';
      const res = await fetch('/api/devstudio/files', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: selected, content, sha: sha || undefined, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setSha(data.sha ?? sha);
      setStatus(data.commit ? 'Committed' : method === 'POST' ? 'Uploaded' : 'Saved');
      if (method === 'POST') {
        setFiles((current) => (current.includes(selected) ? current : [...current, selected].sort()));
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not save file');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full overflow-hidden bg-[#1e1e1e]">
      <div className="w-64 shrink-0 overflow-y-auto border-r border-[#3c3c3c] bg-[#252526]">
        <div className="sticky top-0 border-b border-[#3c3c3c] bg-[#252526] p-2">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#858585]">Files</div>
          <div className="flex gap-1">
            <input
              value={uploadPath}
              onChange={(event) => {
                const nextPath = sanitizeUploadPath(event.target.value);
                setUploadPath(nextPath);
                if (!sha && selected) {
                  setSelected(nextPath);
                  setMessage(`chore: add ${nextPath} via Dev Studio`);
                }
              }}
              className="h-8 min-w-0 flex-1 rounded border border-[#3c3c3c] bg-[#1e1e1e] px-2 font-mono text-[11px] text-[#cccccc] outline-none"
              placeholder="devstudio-uploads/file.ts"
              spellCheck={false}
            />
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".css,.csv,.html,.js,.jsx,.json,.md,.mdx,.mjs,.sql,.svg,.ts,.tsx,.txt,.xml,.yml,.yaml,text/*,application/json,application/xml,image/svg+xml"
              onChange={(event) => {
                void handleUpload(event.currentTarget.files?.[0]);
                event.currentTarget.value = '';
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded bg-[#0078d4] text-white"
              title="Upload file"
            >
              <Upload className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        {files.map((file) => (
          <button
            key={file}
            type="button"
            onClick={() => loadFile(file)}
            className="flex w-full items-center gap-2 border-b border-[#2d2d2d] px-3 py-2 text-left text-[11px]"
            style={{ background: selected === file ? '#094771' : 'transparent', color: selected === file ? '#ffffff' : '#cccccc' }}
          >
            <FileText className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{file}</span>
          </button>
        ))}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center gap-2 border-b border-[#3c3c3c] bg-[#2d2d2d] px-3 py-2">
          <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-[#858585]">{selected || 'Select a file'}</span>
          {status && <span className="text-[11px] text-[#4ec9b0]">{status}</span>}
          <button
            type="button"
            onClick={saveFile}
            disabled={!selected || loading}
            className="inline-flex h-8 items-center gap-1 rounded bg-[#f97316] px-2 text-[11px] font-semibold text-white disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Commit
          </button>
        </div>
        <input
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className="h-9 shrink-0 border-b border-[#3c3c3c] bg-[#252526] px-3 font-mono text-[11px] text-[#cccccc] outline-none"
          placeholder="Commit message"
        />
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          className="min-h-0 flex-1 resize-none bg-[#1e1e1e] p-3 font-mono text-xs text-[#cccccc] outline-none"
          spellCheck={false}
        />
      </div>
    </div>
  );
}

function EnvironmentPanel() {
  return (
    <div className="flex h-full flex-col overflow-hidden bg-slate-50">
      <div className="min-h-0 flex-1 overflow-auto border-b border-slate-200">
        <DevContainerPanel />
      </div>
      <div className="shrink-0 border-t border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-4 py-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <Server className="h-3.5 w-3.5" />
            Northflank services
          </div>
        </div>
        <div className="max-h-[42vh] overflow-auto">
          <ServicesPanel />
        </div>
      </div>
    </div>
  );
}

function HealthPanel({ health, onRefresh }: { health: Record<string, unknown> | null; onRefresh: () => void }) {
  const rows = [
    ['GitHub', health?.hasGitHub ? 'connected' : 'not connected'],
    ['Groq', health?.hasGroq ? 'configured' : 'missing'],
    ['Gemini', health?.hasGemini ? 'configured' : 'missing'],
    ['OpenAI', health?.hasOpenAI ? 'configured' : 'missing'],
    ['Supabase URL', health?.supabaseUrlPresent ? 'present' : 'missing'],
    ['Supabase service key', health?.supabaseServiceKeyPresent ? 'present' : 'missing'],
    ['Node', String(health?.nodeVersion ?? 'unknown')],
    ['Next', String(health?.nextVersion ?? 'unknown')],
  ];

  return (
    <div className="h-full overflow-y-auto bg-[#1e1e1e] p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-[#4ec9b0]" />
          <h2 className="text-sm font-semibold text-white">Health</h2>
        </div>
        <button type="button" onClick={onRefresh} className="inline-flex h-8 items-center gap-1 rounded border border-[#3c3c3c] px-2 text-[11px] text-[#cccccc]">
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>
      <div className="rounded border border-[#3c3c3c] bg-[#252526]">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between border-b border-[#2d2d2d] px-3 py-2 text-xs last:border-0">
            <span className="text-[#858585]">{label}</span>
            <span className="font-mono text-[#cccccc]">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
