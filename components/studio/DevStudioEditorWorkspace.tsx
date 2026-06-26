'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { FolderOpen, GitBranch, Loader2, Save, Upload } from 'lucide-react';

const CodeEditor = dynamic(() => import('@/components/studio/CodeEditor'), { ssr: false });
const GitPanel = dynamic(() => import('@/components/studio/GitPanel'), { ssr: false });

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
      setFiles(walkFiles(data.tree ?? []));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'File tree unavailable');
    }
  }, []);

  useEffect(() => {
    void refreshFiles();
  }, [refreshFiles]);

  useEffect(() => {
    onFileContextChange?.(selected || null, content);
  }, [selected, content, onFileContextChange]);

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
      const res = await fetch('/api/devstudio/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: selected, content, message, sha }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setSha(data.sha ?? sha);
      setStatus('Committed');
      await refreshFiles();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Save failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#1e1e1e] text-[#cccccc]">
      <div className="flex shrink-0 items-center gap-2 border-b border-[#3c3c3c] bg-[#252526] px-3 py-2">
        <button
          type="button"
          onClick={() => setSidebar('files')}
          className={`inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] ${sidebar === 'files' ? 'bg-[#094771] text-white' : ''}`}
        >
          <FolderOpen className="h-3.5 w-3.5" />
          Files
        </button>
        <button
          type="button"
          onClick={() => setSidebar('git')}
          className={`inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] ${sidebar === 'git' ? 'bg-[#094771] text-white' : ''}`}
        >
          <GitBranch className="h-3.5 w-3.5" />
          Git
        </button>
        <span className="ml-auto truncate text-[10px] text-[#858585]">{status}</span>
        <button
          type="button"
          onClick={() => void saveFile()}
          disabled={!selected || loading}
          className="inline-flex items-center gap-1 rounded bg-[#0078d4] px-2 py-1 text-[11px] text-white disabled:opacity-40"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
          Commit
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file || file.size > MAX_UPLOAD_BYTES) return;
            void file.text().then((text) => {
              const path = uploadPath || `devstudio-uploads/${file.name}`;
              setSelected(path);
              setContent(text);
              setSha('');
              setMessage(`chore: add ${path}`);
            });
          }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-1 rounded border border-[#555] px-2 py-1 text-[11px]"
        >
          <Upload className="h-3 w-3" />
          Upload
        </button>
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="w-56 shrink-0 overflow-y-auto border-r border-[#3c3c3c] bg-[#252526]">
          {sidebar === 'git' ? (
            <GitPanel />
          ) : (
            <ul className="py-1 text-[11px]">
              {files.map((path) => (
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
          )}
        </div>
        <div className="min-w-0 flex-1">
          {selected ? (
            <CodeEditor value={content} onChange={(v) => setContent(v ?? '')} filePath={selected} />
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
