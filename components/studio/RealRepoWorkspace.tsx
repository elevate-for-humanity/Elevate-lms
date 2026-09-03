'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  File,
  FolderOpen,
  GitBranch,
  Loader2,
  Play,
  RefreshCw,
  Save,
  Square,
  Terminal,
  Upload,
} from 'lucide-react';
import type { WebContainer, WebContainerProcess } from '@webcontainer/api';

type TreeNode = {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: TreeNode[];
};

type RepoFile = {
  path: string;
  content: string;
  sha: string;
  repo?: string;
  branch?: string;
};

export interface RealRepoWorkspaceProps {
  onOutput?: (output: string) => void;
  onFileChange?: (files: TreeNode[]) => void;
  className?: string;
}

export default function RealRepoWorkspace({
  onOutput,
  onFileChange,
  className = '',
}: RealRepoWorkspaceProps) {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [repo, setRepo] = useState('Elevate-lms');
  const [branch, setBranch] = useState('main');
  const [activePath, setActivePath] = useState('');
  const [content, setContent] = useState('');
  const [savedContent, setSavedContent] = useState('');
  const [sha, setSha] = useState('');
  const [status, setStatus] = useState('Connecting repository…');
  const [saving, setSaving] = useState(false);
  const [runtimeReady, setRuntimeReady] = useState(false);
  const [running, setRunning] = useState(false);
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const terminalRef = useRef<HTMLDivElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const webcontainerRef = useRef<WebContainer | null>(null);
  const processRef = useRef<WebContainerProcess | null>(null);

  const dirty = content !== savedContent;

  const output = useCallback((line: string) => {
    setTerminalOutput((previous) => [...previous, line]);
    onOutput?.(line);
  }, [onOutput]);

  const refreshTree = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/dev-studio/files', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
      const nextTree = Array.isArray(data.tree) ? data.tree : [];
      setTree(nextTree);
      setRepo(data.repo || 'Elevate-lms');
      setBranch(data.branch || 'main');
      setStatus('Repository connected');
      onFileChange?.(nextTree);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Repository unavailable';
      setStatus(message);
      output(`Repository error: ${message}`);
    }
  }, [onFileChange, output]);

  useEffect(() => {
    void refreshTree();
  }, [refreshTree]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const { WebContainer } = await import('@webcontainer/api');
        const instance = await WebContainer.boot();
        if (cancelled) {
          instance.teardown();
          return;
        }
        webcontainerRef.current = instance;
        setRuntimeReady(true);
        output('Runtime ready — Node/npm/npx execute in the isolated browser workspace.');
      } catch (error) {
        output(`Runtime unavailable: ${error instanceof Error ? error.message : 'WebContainer failed to boot'}`);
      }
    })();

    return () => {
      cancelled = true;
      processRef.current?.kill();
      webcontainerRef.current?.teardown();
      webcontainerRef.current = null;
    };
  }, [output]);

  useEffect(() => {
    if (terminalRef.current) terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
  }, [terminalOutput]);

  async function openFile(path: string) {
    setStatus(`Opening ${path}…`);
    try {
      const response = await fetch(`/api/admin/dev-studio/files?path=${encodeURIComponent(path)}`, {
        cache: 'no-store',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
      const file = data as RepoFile;
      setActivePath(file.path);
      setContent(file.content || '');
      setSavedContent(file.content || '');
      setSha(file.sha || '');
      setStatus(`Editing ${file.path}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Open failed';
      setStatus(message);
      output(`Open failed: ${message}`);
    }
  }

  async function saveFile() {
    if (!activePath || !dirty) return;
    setSaving(true);
    setStatus(`Committing ${activePath}…`);
    try {
      const updating = Boolean(sha);
      const response = await fetch('/api/admin/dev-studio/files', {
        method: updating ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: activePath,
          content,
          ...(updating ? { sha } : {}),
          message: `${updating ? 'chore: update' : 'chore: create'} ${activePath} via Dev Studio`,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
      setSha(data.sha || sha);
      setSavedContent(content);
      setStatus(`Committed ${activePath}`);
      output(`✓ committed ${activePath}`);
      await refreshTree();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Save failed';
      setStatus(message);
      output(`Save failed: ${message}`);
    } finally {
      setSaving(false);
    }
  }

  function newFile() {
    const path = window.prompt('Repository path for the new file:');
    if (!path?.trim()) return;
    setActivePath(path.trim().replace(/^\/+/, ''));
    setContent('');
    setSavedContent('__new_file__');
    setSha('');
    setStatus('New file — edit and commit');
  }

  async function uploadFile(file: globalThis.File) {
    if (file.size > 512 * 1024) {
      setStatus('Upload exceeds the 512 KB repository editor limit.');
      return;
    }
    const path = window.prompt('Repository path:', `devstudio-uploads/${file.name}`);
    if (!path) return;
    const text = await file.text();
    setActivePath(path.replace(/^\/+/, ''));
    setContent(text);
    setSavedContent('__new_file__');
    setSha('');
    setStatus('Uploaded locally — commit to save');
  }

  async function stageActiveFileInRuntime() {
    const runtime = webcontainerRef.current;
    if (!runtime) throw new Error('Runtime is not ready');
    if (!activePath) throw new Error('Select a file first');
    const runtimePath = activePath.replace(/^\/+/, '');
    const slash = runtimePath.lastIndexOf('/');
    if (slash > 0) await runtime.fs.mkdir(runtimePath.slice(0, slash), { recursive: true });
    await runtime.fs.writeFile(runtimePath, content);
    return runtimePath;
  }

  async function streamProcess(process: WebContainerProcess) {
    const reader = process.output.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        String(value).split(/\r?\n/).filter(Boolean).forEach(output);
      }
    } finally {
      reader.releaseLock();
    }
  }

  async function runCommand(commandLine: string) {
    const runtime = webcontainerRef.current;
    const trimmed = commandLine.trim();
    if (!runtime || !trimmed || running) return;

    const [command, ...args] = trimmed.split(/\s+/);
    setRunning(true);
    output(`$ ${trimmed}`);
    try {
      const process = await runtime.spawn(command, args);
      processRef.current = process;
      const stream = streamProcess(process);
      const exitCode = await process.exit;
      await stream;
      output(`Process exited with code ${exitCode}`);
    } catch (error) {
      output(`Command failed: ${error instanceof Error ? error.message : 'unknown error'}`);
    } finally {
      processRef.current = null;
      setRunning(false);
    }
  }

  async function runActiveFile() {
    try {
      const runtimePath = await stageActiveFileInRuntime();
      const extension = runtimePath.split('.').pop()?.toLowerCase();
      if (['js', 'mjs', 'cjs'].includes(extension || '')) {
        await runCommand(`node ${runtimePath}`);
      } else if (['ts', 'tsx'].includes(extension || '')) {
        await runCommand(`npx tsx ${runtimePath}`);
      } else {
        output(`No automatic runner for .${extension || 'unknown'}; use the terminal.`);
      }
    } catch (error) {
      output(`Run failed: ${error instanceof Error ? error.message : 'unknown error'}`);
    }
  }

  function stopProcess() {
    processRef.current?.kill();
    processRef.current = null;
    setRunning(false);
    output('Process stopped.');
  }

  function renderTree(nodes: TreeNode[], depth = 0) {
    return nodes.map((node) => (
      <div key={node.path}>
        <button
          type="button"
          disabled={node.type === 'directory'}
          onClick={() => node.type === 'file' && void openFile(node.path)}
          className={`flex w-full items-center gap-1.5 truncate px-2 py-1 text-left text-[11px] hover:bg-[#2a2d2e] ${
            activePath === node.path ? 'bg-[#094771] text-white' : 'text-[#cccccc]'
          } ${node.type === 'directory' ? 'cursor-default text-[#9ca3af]' : ''}`}
          style={{ paddingLeft: 8 + depth * 12 }}
          title={node.path}
        >
          {node.type === 'directory' ? (
            <FolderOpen className="h-3.5 w-3.5 shrink-0" />
          ) : (
            <File className="h-3.5 w-3.5 shrink-0" />
          )}
          <span className="truncate">{node.name}</span>
        </button>
        {node.type === 'directory' && node.children?.length ? renderTree(node.children, depth + 1) : null}
      </div>
    ));
  }

  return (
    <div className={`flex h-full min-h-0 flex-col overflow-hidden bg-[#1e1e1e] text-[#cccccc] ${className}`}>
      <div className="flex shrink-0 items-center gap-2 border-b border-[#3c3c3c] bg-[#252526] px-2 py-1.5">
        <GitBranch className="h-3.5 w-3.5 text-[#4ec9b0]" />
        <span className="max-w-[42vw] truncate text-[10px] text-[#9ca3af]">{repo} · {branch}</span>
        <span className="ml-auto max-w-[30vw] truncate text-[10px] text-[#858585]">{status}</span>
        <button type="button" onClick={newFile} className="rounded p-1.5 hover:bg-[#3c3c3c]" title="New file">
          <File className="h-3.5 w-3.5" />
        </button>
        <input
          ref={uploadRef}
          type="file"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void uploadFile(file);
            event.currentTarget.value = '';
          }}
        />
        <button type="button" onClick={() => uploadRef.current?.click()} className="rounded p-1.5 hover:bg-[#3c3c3c]" title="Upload">
          <Upload className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={() => void refreshTree()} className="rounded p-1.5 hover:bg-[#3c3c3c]" title="Refresh">
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          disabled={!dirty || !activePath || saving}
          onClick={() => void saveFile()}
          className="inline-flex h-7 items-center gap-1 rounded bg-[#0078d4] px-2 text-[11px] text-white disabled:opacity-40"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Commit
        </button>
        <button
          type="button"
          disabled={!runtimeReady || !activePath || running}
          onClick={() => void runActiveFile()}
          className="inline-flex h-7 items-center gap-1 rounded bg-green-700 px-2 text-[11px] text-white disabled:opacity-40"
        >
          <Play className="h-3.5 w-3.5" /> Run
        </button>
        <button type="button" disabled={!running} onClick={stopProcess} className="rounded bg-red-700 p-1.5 disabled:opacity-40" title="Stop">
          <Square className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex min-h-0 flex-1">
        <aside className="w-64 shrink-0 overflow-y-auto border-r border-[#3c3c3c] bg-[#252526] py-1">
          {tree.length ? renderTree(tree) : <div className="px-3 py-4 text-[11px] text-[#858585]">Repository tree unavailable.</div>}
        </aside>
        <section className="min-w-0 flex-1 overflow-hidden">
          {activePath ? (
            <div className="flex h-full flex-col">
              <div className="shrink-0 border-b border-[#3c3c3c] px-3 py-1 text-[10px] text-[#9ca3af]">
                {activePath}{dirty ? ' • unsaved' : ''}
              </div>
              <textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                spellCheck={false}
                className="min-h-0 flex-1 resize-none bg-[#1e1e1e] p-3 font-mono text-[12px] leading-5 text-[#d4d4d4] outline-none"
                placeholder="// Edit the real Elevate-lms repository here"
              />
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-[#858585]">Select a repository file.</div>
          )}
        </section>
      </div>

      <div className="flex h-52 shrink-0 flex-col border-t border-[#3c3c3c] bg-black">
        <div className="flex items-center gap-2 border-b border-[#333] bg-[#171717] px-3 py-1 text-[10px] text-[#9ca3af]">
          <Terminal className="h-3.5 w-3.5" />
          Isolated Terminal
          <span className="text-[#666]">{runtimeReady ? 'runtime ready' : 'runtime starting'}</span>
          <button type="button" onClick={() => setTerminalOutput([])} className="ml-auto rounded p-1 hover:bg-[#333]" title="Clear">
            <RefreshCw className="h-3 w-3" />
          </button>
        </div>
        <div ref={terminalRef} className="min-h-0 flex-1 overflow-y-auto px-3 py-2 font-mono text-[11px] leading-5">
          {terminalOutput.map((line, index) => (
            <div key={`${index}-${line.slice(0, 30)}`} className="whitespace-pre-wrap text-green-400">{line}</div>
          ))}
        </div>
        <form
          className="flex shrink-0 items-center border-t border-[#333] bg-[#171717] px-2"
          onSubmit={(event) => {
            event.preventDefault();
            const command = terminalInput;
            setTerminalInput('');
            void runCommand(command);
          }}
        >
          <span className="px-1 font-mono text-xs text-green-400">$</span>
          <input
            value={terminalInput}
            onChange={(event) => setTerminalInput(event.target.value)}
            disabled={!runtimeReady || running}
            className="h-9 min-w-0 flex-1 bg-transparent px-2 font-mono text-[11px] text-white outline-none disabled:opacity-50"
            placeholder={runtimeReady ? 'npm install, node file.js, npx tsx file.ts …' : 'Starting runtime…'}
          />
        </form>
      </div>
    </div>
  );
}
