'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { FolderOpen, GitBranch, Loader2, RefreshCw, Save, Upload } from 'lucide-react';

const CodeEditor = dynamic(
  () => import('@/components/studio/CodeEditor').then((m) => m.default || m),
  { ssr: false },
);
const GitPanel = dynamic(() => import('@/components/studio/GitPanel').then((m) => m.default || m), {
  ssr: false,
});

type TreeNode = { type: string; path: string; name: string; children?: TreeNode[] };
type SidebarMode = 'files' | 'git';

const MAX_UPLOAD_BYTES = 512 * 1024;

function walkFiles(nodes: TreeNode[], out: string[] = []): string[] {
  for (const node of nodes ?? []) {
    if (node.type === 'file') out.push(node.path);
    else walkFiles(node.children ?? [], out);
  }
  return out;
}

export default function DevStudioEditorWorkspace({
  onFileContextChange,
}: {
  onFileContextChange?: (path: string | null, content: string) => void;
}) {
  const [sidebar, setSidebar] = useState<SidebarMode>('files');
  const [files, setFiles] = useState<string[]>([]);
  const [fileSearch, setFileSearch] = useState('');
  const matchingFiles = files.filter((path) =>
    path.toLowerCase().includes(fileSearch.trim().toLowerCase()),
  );
  const [selected, setSelected] = useState('');
  const [content, setContent] = useState('');
  const [sha, setSha] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [branch, setBranch] = useState('');
  const [commitSha, setCommitSha] = useState('');
  const [remoteCommitSha, setRemoteCommitSha] = useState<string | null>(null);
  const [savedContent, setSavedContent] = useState('');
  const [confirmMainCommit, setConfirmMainCommit] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshFiles = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/dev-studio/files?source=container', {
        cache: 'no-store',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setFiles(walkFiles(data.tree ?? []));
      setBranch(String(data.branch ?? ''));
      setCommitSha(String(data.commitSha ?? ''));
      setRemoteCommitSha(typeof data.remoteCommitSha === 'string' ? data.remoteCommitSha : null);
      return true;
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'File tree unavailable');
      return false;
    }
  }, []);

  useEffect(() => {
    void refreshFiles();
  }, [refreshFiles]);

  useEffect(() => {
    onFileContextChange?.(selected || null, content);
  }, [selected, content, onFileContextChange]);

  async function syncRepository() {
    setLoading(true);
    setStatus('Synchronizing the container with repository main…');
    try {
      const response = await fetch('/api/admin/dev-studio/runtime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'repository-sync',
          repoUrl: 'https://github.com/elevate-for-humanity/Elevate-lms.git',
          branch: 'main',
        }),
        signal: AbortSignal.timeout(120000),
      });
      const result = await response.json();
      if (!response.ok || !result.ok)
        throw new Error(result.error || 'Repository synchronization failed');
      if (!(await refreshFiles())) return;
      setStatus('Container synchronized. Reopen a file to read its latest content.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Repository synchronization failed');
    } finally {
      setLoading(false);
    }
  }

  async function saveContainerFile() {
    if (!selected) return;
    setLoading(true);
    try {
      const response = await fetch('/api/admin/dev-studio/runtime', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ operation: 'file-write', path: selected, content }),
        signal: AbortSignal.timeout(30000),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw Error(result.error ?? 'Container save failed');
      setSavedContent(content);
      setStatus('Saved in your Studio container. Commit separately to publish.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Container save failed');
    } finally {
      setLoading(false);
    }
  }

  async function loadFile(path: string) {
    setSelected(path);
    setConfirmMainCommit(false);
    setLoading(true);
    setStatus('');
    try {
      const res = await fetch(
        `/api/admin/dev-studio/files?source=container&path=${encodeURIComponent(path)}`,
        {
          cache: 'no-store',
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setContent(data.content ?? '');
      setSavedContent(data.content ?? '');
      setSha(data.sha ?? '');
      setMessage(`chore: update ${path} via Dev Studio`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not load file');
    } finally {
      setLoading(false);
    }
  }

  async function saveFile() {
    if (!selected) return;
    if (branch === 'main' && !confirmMainCommit) {
      setConfirmMainCommit(true);
      setStatus('Direct main commit: press Confirm Main Commit to continue.');
      return;
    }
    const updating = Boolean(sha);
    setLoading(true);
    setStatus(updating ? 'Committing update…' : 'Creating file…');
    try {
      const res = await fetch('/api/admin/dev-studio/files', {
        method: updating ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: selected,
          content,
          message,
          ...(branch === 'main' ? { confirmation: 'CONFIRM PUSH' } : {}),
          ...(updating ? { sha } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setSha(data.sha ?? sha);
      setSavedContent(content);
      setStatus(data.commit ? 'Committed to GitHub' : 'Committed');
      setConfirmMainCommit(false);
      await refreshFiles();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Save failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#1e1e1e] text-[#cccccc]">
      <div
        className="shrink-0 border-b border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
        role="status"
        aria-label="Repository connection"
      >
        <p>
          Container checkout · {branch || 'branch unknown'} ·{' '}
          {commitSha ? commitSha.slice(0, 12) : 'revision unverified'}
        </p>
        <p>
          {remoteCommitSha
            ? `Repository main · ${remoteCommitSha.slice(0, 12)} · ${commitSha === remoteCommitSha ? 'matches container' : 'differs from container'}`
            : 'Repository main revision could not be verified.'}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void refreshFiles()}
            disabled={loading}
            className="rounded border border-slate-500 px-3 py-2 disabled:opacity-50"
          >
            <RefreshCw className="mr-1 inline h-4 w-4" />
            Refresh repository status
          </button>
          <button
            type="button"
            onClick={() => void syncRepository()}
            disabled={loading || content !== savedContent}
            className="rounded border border-slate-500 px-3 py-2 disabled:opacity-50"
          >
            Sync container with main
          </button>
        </div>
        <p className="mt-1 text-xs text-slate-300">
          Save pending editor changes before syncing. Synchronization uses a fast-forward merge and
          refuses conflicting or divergent work.
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2 border-b border-[#3c3c3c] bg-[#252526] px-3 py-2">
        <button
          type="button"
          onClick={() => setSidebar('files')}
          className={`inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] ${sidebar === 'files' ? 'bg-[#094771] text-white' : ''}`}
        >
          <FolderOpen className="h-3.5 w-3.5" /> Files
        </button>
        <button
          type="button"
          onClick={() => setSidebar('git')}
          className={`inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] ${sidebar === 'git' ? 'bg-[#094771] text-white' : ''}`}
        >
          <GitBranch className="h-3.5 w-3.5" /> Git
        </button>
        <span className="ml-auto truncate text-[10px] text-[#858585]">{status}</span>
        <button
          type="button"
          onClick={() => void saveFile()}
          disabled={!selected || loading}
          className="inline-flex items-center gap-1 rounded bg-[#0078d4] px-2 py-1 text-[11px] text-white disabled:opacity-40"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
          {branch === 'main' && confirmMainCommit ? 'Confirm Main Commit' : 'Commit'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            if (file.size > MAX_UPLOAD_BYTES) {
              setStatus('Upload exceeds the 512 KB repository editor limit.');
              event.currentTarget.value = '';
              return;
            }
            void file.text().then((text) => {
              setSelected(`devstudio-uploads/${file.name}`);
              setContent(text);
              setSha('');
              setMessage(`chore: add devstudio-uploads/${file.name}`);
              setStatus('Uploaded locally — commit to create the repository file');
            });
            event.currentTarget.value = '';
          }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-1 rounded border border-[#555] px-2 py-1 text-[11px]"
        >
          <Upload className="h-3 w-3" /> Upload
        </button>
      </div>

      <button
        type="button"
        disabled={!selected || loading}
        onClick={() => void saveContainerFile()}
        className="self-start rounded border border-slate-500 px-3 py-2 text-xs text-white disabled:opacity-40"
      >
        Save in container
      </button>
      <div className="flex min-h-0 flex-1">
        <div className="w-56 shrink-0 overflow-y-auto border-r border-[#3c3c3c] bg-[#252526]">
          {sidebar === 'git' ? (
            <GitPanel />
          ) : (
            <>
              <div className="sticky top-0 bg-[#252526] p-2">
                <input
                  aria-label="Search repository files"
                  placeholder="Search file path…"
                  value={fileSearch}
                  onChange={(event) => setFileSearch(event.target.value)}
                  className="w-full rounded border border-slate-500 bg-slate-950 px-2 py-2 text-xs text-white"
                />
                <p className="mt-1 text-[10px] text-slate-300">
                  {matchingFiles.length} matches · showing up to 200. Search to narrow files.
                </p>
              </div>
              <ul className="py-1 text-[11px]">
                {matchingFiles.slice(0, 200).map((path) => (
                  <li key={path}>
                    <button
                      type="button"
                      onClick={() => void loadFile(path)}
                      className={`block w-full truncate px-3 py-1 text-left hover:bg-[#2a2d2e] ${selected === path ? 'bg-[#094771] text-white' : ''}`}
                    >
                      {path}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
        <div className="min-w-0 flex-1">
          {selected ? (
            <CodeEditor
              value={content}
              onChange={(value) => {
                setContent(value ?? '');
                setConfirmMainCommit(false);
              }}
              filePath={selected}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-[#858585]">
              Select a file or switch to Git
            </div>
          )}
        </div>
      </div>
      {message && (
        <div className="shrink-0 border-t border-[#3c3c3c] px-3 py-1 text-[10px] text-[#858585]">
          Commit message: {message}
        </div>
      )}
    </div>
  );
}
