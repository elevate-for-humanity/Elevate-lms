'use client';

import toast from 'react-hot-toast';
import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Upload, FileText, FileImage, File, X, CheckCircle,
  Loader2, AlertCircle, Download, Trash2, Search, FolderOpen,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

interface DocumentRecord {
  id: string;
  file_name: string;
  file_path: string;
  file_url: string | null;
  mime_type: string;
  file_size_bytes: number | null;
  document_type: string | null;
  status: string;
  created_at: string;
  uploaded_by: string | null;
}

type UploadStatus = 'idle' | 'uploading' | 'done' | 'error';

interface FileItem {
  id: string;
  file: File;
  status: UploadStatus;
  progress: number;
  url?: string;
  error?: string;
}

const ACCEPTED = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
];
const MAX_SIZE = 10 * 1024 * 1024;

function fileIcon(type: string) {
  if (type === 'application/pdf') return <FileText className="w-4 h-4 text-red-500" />;
  if (type.startsWith('image/')) return <FileImage className="w-4 h-4 text-blue-500" />;
  return <File className="w-4 h-4 text-slate-500" />;
}

function formatSize(bytes: number | null) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function DocumentCenterClient({
  initialDocuments,
  fetchError,
}: {
  initialDocuments: DocumentRecord[];
  fetchError: string | null;
}) {
  const [documents, setDocuments] = useState<DocumentRecord[]>(initialDocuments);
  const [queue, setQueue] = useState<FileItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Upload queue ──────────────────────────────────────────────
  const addFiles = useCallback((incoming: File[]) => {
    const valid = incoming.filter((f) => ACCEPTED.includes(f.type) && f.size <= MAX_SIZE);
    const rejected = incoming.filter((f) => !ACCEPTED.includes(f.type) || f.size > MAX_SIZE);
    if (rejected.length) toast.error(`${rejected.length} file(s) rejected — must be PDF/DOC/DOCX/JPG/PNG under 10MB.`);
    setQueue((prev) => [
      ...prev,
      ...valid.map((f) => ({ id: `${f.name}-${Date.now()}-${Math.random()}`, file: f, status: 'idle' as UploadStatus, progress: 0 })),
    ]);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  }, [addFiles]);

  const uploadFile = async (item: FileItem) => {
    setQueue((prev) => prev.map((f) => f.id === item.id ? { ...f, status: 'uploading', progress: 10 } : f));

    const interval = setInterval(() => {
      setQueue((prev) => prev.map((f) =>
        f.id === item.id && f.progress < 80 ? { ...f, progress: f.progress + 15 } : f
      ));
    }, 300);

    try {
      const form = new FormData();
      form.append('file', item.file);
      form.append('category', 'admin-documents');

      const res = await fetch('/api/upload', { method: 'POST', body: form });
      clearInterval(interval);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Upload failed (${res.status})`);
      }

      const data = await res.json();
      setQueue((prev) => prev.map((f) =>
        f.id === item.id ? { ...f, status: 'done', progress: 100, url: data.url } : f
      ));

      // Optimistically add to document list
      setDocuments((prev) => [{
        id: crypto.randomUUID(),
        file_name: item.file.name,
        file_path: data.path,
        file_url: data.url,
        mime_type: item.file.type,
        file_size_bytes: item.file.size,
        document_type: 'admin-documents',
        status: 'active',
        created_at: new Date().toISOString(),
        uploaded_by: null,
      }, ...prev]);
    } catch (err) {
      clearInterval(interval);
      setQueue((prev) => prev.map((f) =>
        f.id === item.id ? { ...f, status: 'error', progress: 0, error: err instanceof Error ? err.message : 'Upload failed' } : f
      ));
    }
  };

  const uploadAll = () => queue.filter((f) => f.status === 'idle').forEach(uploadFile);

  // ── Delete ────────────────────────────────────────────────────
  const deleteDocument = async (doc: DocumentRecord) => {
    if (!confirm(`Delete "${doc.file_name}"?`)) return;
    setDeleting(doc.id);
    try {
      const res = await fetch(`/api/upload?path=${encodeURIComponent(doc.file_path)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
    } catch {
      toast.error('Failed to delete document.');
    } finally {
      setDeleting(null);
    }
  };

  // ── Filter ────────────────────────────────────────────────────
  const filtered = documents.filter((d) =>
    !search || d.file_name.toLowerCase().includes(search.toLowerCase()) ||
    (d.document_type ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const pendingCount = queue.filter((f) => f.status === 'idle').length;
  const doneCount = queue.filter((f) => f.status === 'done').length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Document Center' }]} />

      <div className="flex items-center justify-between mt-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Document Center</h1>
          <p className="text-sm text-slate-500 mt-1">{documents.length} document{documents.length !== 1 ? 's' : ''} stored</p>
        </div>
        <button
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <Upload className="w-4 h-4" />
          Upload Document
        </button>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors mb-6 ${
          dragging ? 'border-red-400 bg-red-50' : 'border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100'
        }`}
      >
        <Upload className={`w-8 h-8 mx-auto mb-2 ${dragging ? 'text-red-500' : 'text-slate-400'}`} />
        <p className="font-medium text-slate-700">{dragging ? 'Drop files here' : 'Drag & drop files, or click to browse'}</p>
        <p className="text-xs text-slate-400 mt-1">PDF, DOC, DOCX, JPG, PNG — max 10MB</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          className="hidden"
          onChange={(e) => { if (e.target.files) addFiles(Array.from(e.target.files)); e.target.value = ''; }}
        />
      </div>

      {/* Upload queue */}
      {queue.length > 0 && (
        <div className="mb-8 space-y-2">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-slate-700">
              {queue.length} file{queue.length !== 1 ? 's' : ''} queued
              {doneCount > 0 && <span className="text-green-600 ml-2">· {doneCount} uploaded</span>}
            </p>
            <div className="flex gap-2">
              {pendingCount > 0 && (
                <button
                  onClick={uploadAll}
                  className="text-xs bg-red-600 hover:bg-red-700 text-white font-semibold px-3 py-1.5 rounded-lg"
                >
                  Upload all ({pendingCount})
                </button>
              )}
              <button
                onClick={() => setQueue([])}
                className="text-xs text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg border"
              >
                Clear
              </button>
            </div>
          </div>
          {queue.map((item) => (
            <div key={item.id} className={`flex items-center gap-3 p-3 rounded-lg border text-sm ${
              item.status === 'done' ? 'border-green-200 bg-green-50' :
              item.status === 'error' ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-white'
            }`}>
              {fileIcon(item.file.type)}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 truncate">{item.file.name}</p>
                <p className="text-xs text-slate-400">{formatSize(item.file.size)}</p>
                {item.status === 'uploading' && (
                  <div className="mt-1.5 h-1 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500 rounded-full transition-all" style={{ width: `${item.progress}%` }} />
                  </div>
                )}
                {item.status === 'error' && <p className="text-xs text-red-600 mt-0.5">{item.error}</p>}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {item.status === 'idle' && (
                  <>
                    <button onClick={() => uploadFile(item)} className="text-xs text-red-600 font-medium hover:underline">Upload</button>
                    <button onClick={() => setQueue((p) => p.filter((f) => f.id !== item.id))}><X className="w-3.5 h-3.5 text-slate-400" /></button>
                  </>
                )}
                {item.status === 'uploading' && <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />}
                {item.status === 'done' && <CheckCircle className="w-4 h-4 text-green-500" />}
                {item.status === 'error' && (
                  <button onClick={() => uploadFile(item)} className="text-xs text-red-600 hover:underline flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Retry
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search documents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>

      {/* Error */}
      {fetchError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          Failed to load documents: {fetchError}
        </div>
      )}

      {/* Document list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <FolderOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">{search ? 'No documents match your search' : 'No documents uploaded yet'}</p>
          <p className="text-sm mt-1">Upload a file above to get started</p>
        </div>
      ) : (
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Name</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden md:table-cell">Type</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden md:table-cell">Size</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Uploaded</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {fileIcon(doc.mime_type)}
                      <span className="font-medium text-slate-900 truncate max-w-xs">{doc.file_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500 hidden md:table-cell capitalize">
                    {doc.document_type?.replace(/-/g, ' ') ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-500 hidden md:table-cell">
                    {formatSize(doc.file_size_bytes)}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(doc.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      {doc.file_url && (
                        <a
                          href={doc.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-slate-400 hover:text-blue-600 rounded transition-colors"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        onClick={() => deleteDocument(doc)}
                        disabled={deleting === doc.id}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded transition-colors disabled:opacity-40"
                        title="Delete"
                      >
                        {deleting === doc.id
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <Trash2 className="w-4 h-4" />
                        }
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-slate-100 flex gap-4 text-sm text-slate-500">
        <Link href="/admin/documents/upload" className="hover:text-slate-700">→ Advanced upload</Link>
        <Link href="/admin/studio" className="hover:text-slate-700">→ Media Studio</Link>
        <Link href="/admin/signatures" className="hover:text-slate-700">→ Signatures</Link>
      </div>
    </div>
  );
}
