'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { FileText, Loader2, Save, Upload } from 'lucide-react';

const MAX_UPLOAD_BYTES = 512 * 1024;

function sanitizeUploadPath(path: string): string {
  return path.replace(/\\/g, '/').replace(/^\/+/, '').replace(/\/{2,}/g, '/').trim();
}

export default function DevStudioFilesWorkspace() {
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
      const res = await fetch('/api/admin/dev-studio/files');
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

  async function loadFile(path: string) {
    setSelected(path);
    setLoading(true);
    setStatus('');
    try {
      const res = await fetch(`/api/admin/dev-studio/files?path=${encodeURIComponent(path)}`);
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
      const method = sha ? 'PUT' : 'POST';
      const res = await fetch('/api/admin/dev-studio/files', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: selected, content, sha: sha || undefined, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setSha(data.sha ?? sha);
      setStatus(data.commit ? 'Committed to GitHub' : 'Saved');
      if (method === 'POST') {
        setFiles((c) => (c.includes(selected) ? c : [...c, selected].sort()));
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not save');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full overflow-hidden bg-white">
      <div className="w-64 shrink-0 overflow-y-auto border-r border-slate-200">
        <div className="sticky top-0 border-b border-slate-200 bg-slate-50 p-2">
          <p className="mb-2 text-[10px] font-bold uppercase text-slate-500">Repo files (GitHub)</p>
          <div className="flex gap-1">
            <input
              value={uploadPath}
              onChange={(e) => setUploadPath(sanitizeUploadPath(e.target.value))}
              className="h-8 min-w-0 flex-1 rounded border border-slate-200 px-2 font-mono text-[10px]"
              placeholder="path/in/repo.ts"
            />
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (!file || file.size > MAX_UPLOAD_BYTES) return;
                const path = sanitizeUploadPath(uploadPath || `devstudio-uploads/${file.name}`);
                setSelected(path);
                setContent(await file.text());
                setSha('');
                setMessage(`chore: add ${path}`);
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded bg-brand-blue-600 p-2 text-white"
            >
              <Upload className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        {files.map((file) => (
          <button
            key={file}
            type="button"
            onClick={() => void loadFile(file)}
            className={`flex w-full items-center gap-2 border-b border-slate-100 px-3 py-2 text-left text-[11px] ${
              selected === file ? 'bg-brand-blue-50 text-brand-blue-900' : 'text-slate-700'
            }`}
          >
            <FileText className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{file}</span>
          </button>
        ))}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2 border-b border-slate-200 px-3 py-2">
          <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-slate-500">
            {selected || 'Select a file'}
          </span>
          {status && <span className="text-[11px] text-brand-green-700">{status}</span>}
          <button
            type="button"
            onClick={() => void saveFile()}
            disabled={!selected || loading}
            className="inline-flex items-center gap-1 rounded-lg bg-brand-blue-600 px-2 py-1 text-xs text-white disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Commit
          </button>
        </div>
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="h-8 border-b border-slate-200 px-3 font-mono text-[11px] outline-none"
          placeholder="Commit message"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-0 flex-1 resize-none p-3 font-mono text-xs outline-none"
          spellCheck={false}
        />
      </div>
    </div>
  );
}
