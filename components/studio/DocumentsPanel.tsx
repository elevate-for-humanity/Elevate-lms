'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Upload, FileText, Image, File, Download, Trash2,
  Loader2, AlertCircle, CheckCircle, X, Plus,
} from 'lucide-react';

interface DocRecord {
  id: string;
  name: string;
  original_name: string;
  s3_key: string;
  size_bytes: number;
  content_type: string;
  ext: string;
  url?: string;
  signed_url?: string;
  created_at: string;
}

// No client-side type restrictions — server accepts any file type.

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function FileIcon({ ext }: { ext: string }) {
  if (['png', 'jpg', 'jpeg'].includes(ext)) return <Image className="w-4 h-4 text-blue-400" />;
  if (ext === 'pdf') return <FileText className="w-4 h-4 text-red-400" />;
  return <File className="w-4 h-4 text-slate-400" />;
}

export default function DocumentsPanel() {
  const [docs, setDocs]           = useState<DocRecord[]>([]);
  const [loading, setLoading]     = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [dragOver, setDragOver]   = useState(false);
  const [label, setLabel]         = useState('');
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const [uploadOk, setUploadOk]   = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadDocs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/dev-studio/upload');
      // 404 means this panel is running outside the admin app — fail silently
      if (res.status === 404) { setLoading(false); return; }
      if (res.status === 401 || res.status === 403) { setLoading(false); return; }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const d = await res.json();
      setDocs(d.documents ?? []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDocs(); }, [loadDocs]);

  async function uploadFile(file: File) {
    setUploadErr(null);
    setUploadOk(null);

    if (file.size > 50 * 1024 * 1024) {
      setUploadErr('File exceeds 50 MB limit');
      return;
    }

    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      if (label.trim()) form.append('label', label.trim());

      const res = await fetch('/api/admin/dev-studio/upload', { method: 'POST', body: form });
      const data = await res.json().catch(() => ({}));
      if (res.status === 404) {
        setUploadErr('Upload unavailable outside the admin app');
        return;
      }
      if (res.status === 401 || res.status === 403) {
        setUploadErr('Not authorized — log in as admin to upload documents');
        return;
      }
      if (!res.ok) {
        setUploadErr((data as { error?: string }).error ?? `Upload failed (${res.status})`);
        return;
      }
      setUploadOk(`${file.name} uploaded`);
      setLabel('');
      await loadDocs();
    } catch (e) {
      setUploadErr((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = '';
  }

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-slate-500" />
          <span className="font-semibold text-sm text-slate-700">Documents</span>
          <span className="text-xs text-slate-400">({docs.length})</span>
        </div>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 text-xs bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg disabled:opacity-40 transition-colors"
        >
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          Upload
        </button>
        <input ref={inputRef} type="file" className="hidden" onChange={onFileChange} />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
            dragOver
              ? 'border-orange-400 bg-orange-50'
              : 'border-slate-200 hover:border-orange-300 hover:bg-slate-50'
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2 text-orange-500">
              <Loader2 className="w-6 h-6 animate-spin" />
              <p className="text-sm">Uploading…</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-slate-400">
              <Upload className="w-6 h-6" />
              <p className="text-sm font-medium text-slate-600">Drop a file or click to upload</p>
              <p className="text-xs">Any file type (PDF, DOCX, ZIP, CSV, images…) · max 50 MB</p>
            </div>
          )}
        </div>

        {/* Optional label */}
        <div className="flex gap-2">
          <input
            value={label}
            onChange={e => setLabel(e.target.value)}
            placeholder="Label (optional) — e.g. W-9, MOU, Student Agreement"
            className="flex-1 text-xs border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-orange-400 text-slate-700 placeholder-slate-400"
          />
        </div>

        {/* Status messages */}
        {uploadErr && (
          <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {uploadErr}
            <button onClick={() => setUploadErr(null)} className="ml-auto"><X className="w-3 h-3" /></button>
          </div>
        )}
        {uploadOk && (
          <div className="flex items-center gap-2 text-xs text-brand-green-700 bg-brand-green-50 border border-brand-green-200 rounded-lg px-3 py-2">
            <CheckCircle className="w-3.5 h-3.5 shrink-0" />
            {uploadOk}
            <button onClick={() => setUploadOk(null)} className="ml-auto"><X className="w-3 h-3" /></button>
          </div>
        )}

        {/* Document list */}
        {loading && (
          <div className="flex items-center justify-center py-8 text-slate-400 gap-2 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <AlertCircle className="w-3.5 h-3.5" /> {error}
          </div>
        )}
        {!loading && !error && docs.length === 0 && (
          <p className="text-center text-sm text-slate-400 py-6">No documents uploaded yet</p>
        )}
        {docs.map(doc => (
          <div key={doc.id} className="flex items-center gap-3 p-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors group">
            <FileIcon ext={doc.ext ?? doc.content_type?.split('/').pop() ?? ''} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-700 truncate">{doc.name}</p>
              <p className="text-xs text-slate-400">
                {fmtBytes(doc.size_bytes ?? 0)} · {new Date(doc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            {(doc.url ?? doc.signed_url) && (
              <a
                href={doc.url ?? doc.signed_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors opacity-0 group-hover:opacity-100"
                title="Download"
              >
                <Download className="w-4 h-4" />
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
