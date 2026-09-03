'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { FileText, Loader2, Save, Upload } from 'lucide-react';

const MAX_UPLOAD_BYTES = 500 * 1024 * 1024;
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


export function LizzyFilesPanel() {
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

  async function handleUpload(file: File | undefined) {
    if (!file) return;
    setStatus('');

    if (file.size > MAX_UPLOAD_BYTES) {
      setStatus(`Upload exceeds ${Math.round(MAX_UPLOAD_BYTES / (1024 * 1024))} MB limit`);
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
      const res = await fetch(`/api/admin/dev-studio/files?path=${encodeURIComponent(path)}`);
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
      const res = await fetch('/api/admin/dev-studio/files', {
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

// Default export for next/dynamic
export default LizzyFilesPanel;

