'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { File, FolderOpen, Play, RefreshCw, Save, Square, Terminal, Trash2, Upload } from 'lucide-react';
import type { WebContainer, WebContainerProcess } from '@webcontainer/api';

interface FileNode {
  name: string;
  path?: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  content?: string;
  sha?: string;
}

interface WebContainerSandboxProps {
  initialFiles?: FileNode[];
  onFileChange?: (files: FileNode[]) => void;
  onOutput?: (output: string) => void;
  className?: string;
}

function normalizeTree(nodes: Array<{ name?: string; path?: string; type?: string; children?: unknown[] }>): FileNode[] {
  return (nodes ?? []).map((node) => ({
    name: node.name ?? node.path?.split('/').pop() ?? 'unknown',
    path: node.path ?? node.name,
    type: node.type === 'directory' ? 'directory' : 'file',
    children: Array.isArray(node.children)
      ? normalizeTree(node.children as Array<{ name?: string; path?: string; type?: string; children?: unknown[] }>)
      : undefined,
  }));
}

function updateFileInTree(nodes: FileNode[], path: string, updates: Partial<FileNode>): FileNode[] {
  return nodes.map((node) => {
    if (node.type === 'directory' && node.children) {
      return { ...node, children: updateFileInTree(node.children, path, updates) };
    }
    if ((node.path ?? node.name) === path) return { ...node, ...updates };
    return node;
  });
}

function removeFileFromTree(nodes: FileNode[], path: string): FileNode[] {
  return nodes
    .filter((node) => (node.path ?? node.name) !== path)
    .map((node) =>
      node.type === 'directory' && node.children
        ? { ...node, children: removeFileFromTree(node.children, path) }
        : node,
    );
}

export function WebContainerSandbox({
  initialFiles = [],
  onFileChange,
  onOutput,
  className = '',
}: WebContainerSandboxProps) {
  const [files, setFiles] = useState<FileNode[]>(initialFiles);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [activeSha, setActiveSha] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [terminalCommand, setTerminalCommand] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [repoReady, setRepoReady] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);
  const webcontainerRef = useRef<WebContainer | null>(null);
  const processRef = useRef<WebContainerProcess | null>(null);

  const addOutput = useCallback(
    (text: string) => {
      setTerminalOutput((prev) => [...prev, text]);
      onOutput?.(text);
    },
    [onOutput],
  );

  const refreshRepoTree = useCallback(async () => {
    try {
      const res = await fetch('/api/devstudio/files', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      const tree = normalizeTree(data.tree ?? []);
      setFiles(tree);
      setRepoReady(true);
      onFileChange?.(tree);
    } catch (error) {
      setRepoReady(false);
      addOutput(`Repository unavailable: ${error instanceof Error ? error.message : 'unknown error'}`);
    }
  }, [addOutput, onFileChange]);

  useEffect(() => {
    if (initialFiles.length === 0) void refreshRepoTree();
  }, [initialFiles.length, refreshRepoTree]);

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        const { WebContainer } = await import('@webcontainer/api');
        if (cancelled) return;
        webcontainerRef.current = await WebContainer.boot();
        if (cancelled) {
          webcontainerRef.current?.teardown();
          return;
        }
        setIsReady(true);
        addOutput('Runtime ready — commands execute in an isolated WebContainer.');
      } catch (error) {
        addOutput(
          `Runtime unavailable: ${error instanceof Error ? error.message : 'WebContainer failed to start'}. ` +
            'The editor still reads and commits real repository files.',
        );
      }
    };
    void init();
    return () => {
      cancelled = true;
      processRef.current?.kill();
      webcontainerRef.current?.teardown();
      webcontainerRef.current = null;
    };
  }, [addOutput]);

  useEffect(() => {
    if (terminalRef.current) terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
  }, [terminalOutput]);

  const handleFileSelect = async (file: FileNode) => {
    if (file.type !== 'file') return;
    const path = file.path ?? file.name;
    setActiveFile(path);
    if (file.content !== undefined) {
      setFileContent(file.content);
      setActiveSha(file.sha ?? '');
      return;
    }

    try {
      const res = await fetch(`/api/devstudio/files?path=${encodeURIComponent(path)}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setFileContent(data.content ?? '');
      setActiveSha(data.sha ?? '');
      setFiles((prev) => updateFileInTree(prev, path, { content: data.content ?? '', sha: data.sha ?? '' }));
    } catch (error) {
      addOutput(`Open failed: ${error instanceof Error ? error.message : 'unknown error'}`);
    }
  };

  const handleFileContentChange = (content: string) => {
    if (!activeFile) return;
    setFileContent(content);
    setFiles((prev) => {
      const next = updateFileInTree(prev, activeFile, { content });
      onFileChange?.(next);
      return next;
    });
  };

  const saveActiveFile = async () => {
    if (!activeFile) return;
    try {
      const res = await fetch('/api/devstudio/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: activeFile,
          content: fileContent,
          sha: activeSha,
          message: `${activeSha ? 'chore: update' : 'chore: add'} ${activeFile} via Dev Studio`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      const nextSha = data.sha ?? activeSha;
      setActiveSha(nextSha);
      setFiles((prev) => updateFileInTree(prev, activeFile, { content: fileContent, sha: nextSha }));
      addOutput(`Committed ${activeFile}`);
    } catch (error) {
      addOutput(`Save failed: ${error instanceof Error ? error.message : 'unknown error'}`);
    }
  };

  const handleCreateFile = () => {
    const fileName = prompt('Repository path for the new file:');
    if (!fileName?.trim()) return;
    const path = fileName.trim().replace(/^\/+/, '');
    const newFile: FileNode = { name: path.split('/').pop() ?? path, path, type: 'file', content: '', sha: '' };
    setFiles((prev) => [...prev, newFile]);
    setActiveFile(path);
    setActiveSha('');
    setFileContent('');
  };

  const handleDeleteFile = (path: string) => {
    // The current files API has no delete contract. Remove from the local workspace only;
    // destructive repository deletion remains an explicit Git operation.
    setFiles((prev) => removeFileFromTree(prev, path));
    if (activeFile === path) {
      setActiveFile(null);
      setActiveSha('');
      setFileContent('');
    }
    addOutput(`Removed ${path} from this workspace view. Use Git controls for repository deletion.`);
  };

  const handleUploadFiles = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.onchange = async (e) => {
      const selected = (e.target as HTMLInputElement).files;
      if (!selected) return;
      for (const file of Array.from(selected)) {
        const content = await file.text();
        const path = `devstudio-uploads/${file.name}`;
        const newFile: FileNode = { name: file.name, path, type: 'file', content, sha: '' };
        setFiles((prev) => [...prev, newFile]);
        addOutput(`Loaded ${path}. Save to commit it.`);
      }
    };
    input.click();
  };

  const ensureRuntimeFile = async () => {
    const webcontainer = webcontainerRef.current;
    if (!webcontainer || !activeFile) throw new Error('Runtime or active file is unavailable');
    const runtimePath = activeFile.replace(/^\/+/, '');
    const slash = runtimePath.lastIndexOf('/');
    if (slash > 0) await webcontainer.fs.mkdir(runtimePath.slice(0, slash), { recursive: true });
    await webcontainer.fs.writeFile(runtimePath, fileContent);
    return runtimePath;
  };

  const streamProcess = async (process: WebContainerProcess) => {
    const reader = process.output.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        String(value)
          .split(/\r?\n/)
          .filter(Boolean)
          .forEach(addOutput);
      }
    } finally {
      reader.releaseLock();
    }
  };

  const runCommand = async (commandLine: string) => {
    const webcontainer = webcontainerRef.current;
    if (!webcontainer) {
      addOutput('Runtime is not ready.');
      return;
    }
    const trimmed = commandLine.trim();
    if (!trimmed) return;

    const [command, ...args] = trimmed.split(/\s+/);
    setIsRunning(true);
    addOutput(`$ ${trimmed}`);
    try {
      const process = await webcontainer.spawn(command, args);
      processRef.current = process;
      const outputPromise = streamProcess(process);
      const exitCode = await process.exit;
      await outputPromise;
      addOutput(`Process exited with code ${exitCode}`);
    } catch (error) {
      addOutput(`Command failed: ${error instanceof Error ? error.message : 'unknown error'}`);
    } finally {
      processRef.current = null;
      setIsRunning(false);
    }
  };

  const handleRun = async () => {
    if (!activeFile || !fileContent) {
      addOutput('Select a non-empty file first.');
      return;
    }
    if (!isReady) {
      addOutput('Runtime is still starting.');
      return;
    }

    try {
      const runtimePath = await ensureRuntimeFile();
      const ext = runtimePath.split('.').pop()?.toLowerCase();
      if (ext === 'js' || ext === 'mjs' || ext === 'cjs') {
        await runCommand(`node ${runtimePath}`);
      } else if (ext === 'ts' || ext === 'tsx') {
        await runCommand(`npx tsx ${runtimePath}`);
      } else {
        addOutput(`No default runner for .${ext ?? 'unknown'}. Use the terminal command box.`);
      }
    } catch (error) {
      addOutput(`Run failed: ${error instanceof Error ? error.message : 'unknown error'}`);
    }
  };

  const handleStop = () => {
    processRef.current?.kill();
    processRef.current = null;
    setIsRunning(false);
    addOutput('Process stopped.');
  };

  const renderFileTree = (nodes: FileNode[], depth = 0) =>
    nodes.map((node) => {
      const path = node.path ?? node.name;
      return (
        <div key={path} style={{ paddingLeft: depth * 12 }}>
          <button
            type="button"
            onClick={() => void handleFileSelect(node)}
            className={`flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs ${
              activeFile === path ? 'bg-blue-900 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            {node.type === 'directory' ? <FolderOpen className="h-3.5 w-3.5" /> : <File className="h-3.5 w-3.5" />}
            <span className="truncate">{node.name}</span>
          </button>
          {node.type === 'directory' && node.children ? <div>{renderFileTree(node.children, depth + 1)}</div> : null}
        </div>
      );
    });

  return (
    <div className={`flex h-full flex-col overflow-hidden bg-slate-950 text-white ${className}`}>
      <div className="flex items-center gap-2 border-b border-slate-700 bg-slate-900 p-2">
        <button type="button" onClick={handleCreateFile} className="rounded p-1.5 text-slate-300 hover:bg-slate-800" title="New repository file">
          <File className="h-4 w-4" />
        </button>
        <button type="button" onClick={handleUploadFiles} className="rounded p-1.5 text-slate-300 hover:bg-slate-800" title="Upload file">
          <Upload className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => void refreshRepoTree()} className="rounded p-1.5 text-slate-300 hover:bg-slate-800" title="Refresh repository">
          <RefreshCw className="h-4 w-4" />
        </button>
        <span className="text-[10px] text-slate-500">{repoReady ? 'Elevate-lms repository' : 'repository loading'} · {isReady ? 'runtime ready' : 'runtime starting'}</span>
        <div className="flex-1" />
        <button type="button" onClick={() => void saveActiveFile()} disabled={!activeFile} className="rounded bg-blue-600 p-1.5 hover:bg-blue-500 disabled:opacity-40" title="Commit file">
          <Save className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => void handleRun()} disabled={!activeFile || isRunning || !isReady} className="rounded bg-green-600 p-1.5 hover:bg-green-500 disabled:opacity-40" title="Run active file">
          <Play className="h-4 w-4" />
        </button>
        <button type="button" onClick={handleStop} disabled={!isRunning} className="rounded bg-red-600 p-1.5 hover:bg-red-500 disabled:opacity-40" title="Stop process">
          <Square className="h-4 w-4" />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="w-64 shrink-0 overflow-y-auto border-r border-slate-700 bg-slate-900 p-2">
          {files.length === 0 ? <p className="p-2 text-xs text-slate-500">No files loaded</p> : renderFileTree(files)}
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          {activeFile ? (
            <>
              <div className="flex items-center border-b border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-400">
                <span className="truncate">{activeFile}</span>
                <button type="button" onClick={() => handleDeleteFile(activeFile)} className="ml-auto text-red-400 hover:text-red-300" title="Remove from workspace view">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <textarea
                value={fileContent}
                onChange={(e) => handleFileContentChange(e.target.value)}
                className="min-h-0 flex-1 resize-none bg-slate-950 p-3 font-mono text-sm outline-none"
                placeholder="// Edit repository code here..."
                spellCheck={false}
              />
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-slate-500">Select a repository file to edit</div>
          )}
        </div>
      </div>

      <div className="flex h-52 shrink-0 flex-col border-t border-slate-700">
        <div className="flex items-center gap-2 bg-slate-900 px-3 py-1 text-xs text-slate-400">
          <Terminal className="h-3.5 w-3.5" />
          Isolated Terminal
          <span className="text-[10px] text-slate-600">npm / npx / node commands run here</span>
          <button type="button" onClick={() => setTerminalOutput([])} className="ml-auto hover:text-white" title="Clear terminal">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
        <div ref={terminalRef} className="min-h-0 flex-1 overflow-y-auto bg-black p-2 font-mono text-xs">
          {terminalOutput.map((line, i) => <div key={`${i}-${line}`} className="whitespace-pre-wrap text-green-400">{line}</div>)}
        </div>
        <form
          className="flex border-t border-slate-700 bg-slate-900"
          onSubmit={(e) => {
            e.preventDefault();
            const command = terminalCommand;
            setTerminalCommand('');
            void runCommand(command);
          }}
        >
          <span className="px-2 py-2 font-mono text-xs text-green-400">$</span>
          <input
            value={terminalCommand}
            onChange={(e) => setTerminalCommand(e.target.value)}
            disabled={!isReady || isRunning}
            className="min-w-0 flex-1 bg-transparent px-1 py-2 font-mono text-xs text-white outline-none disabled:opacity-50"
            placeholder={isReady ? 'npm install, node file.js, npx tsx file.ts …' : 'Starting runtime…'}
          />
        </form>
      </div>
    </div>
  );
}

export default WebContainerSandbox;