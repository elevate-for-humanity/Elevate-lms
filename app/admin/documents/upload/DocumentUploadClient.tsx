'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Upload, FileText, FileImage, File, X,
  CheckCircle, Loader2, AlertCircle, FolderOpen
} from 'lucide-react';

type UploadStatus = 'idle' | 'uploading' | 'done' | 'error';

interface FileItem {
  id: string;
  file: File;
  status: UploadStatus;
  progress: number;
  url?: string;
  error?: string;
}

const ACCEPTED = ['application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg', 'image/png'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

function fileIcon(type: string) {
  if (type === 'application/pdf') return <FileText className="w-5 h-5 text-red-500" />;
  if (type.startsWith('image/')) return <FileImage className="w-5 h-5 text-blue-500" />;
  return <File className="w-5 h-5 text-gray-500" />;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentUploadClient() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((incoming: File[]) => {
    const valid = incoming.filter(f => {
      if (!ACCEPTED.includes(f.type)) return false;
      if (f.size > MAX_SIZE) return false;
      return true;
    });
    const items: FileItem[] = valid.map(f => ({
      id: `${f.name}-${Date.now()}-${Math.random()}`,
      file: f,
      status: 'idle',
      progress: 0,
    }));
    setFiles(prev => [...prev, ...items]);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  }, [addFiles]);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(Array.from(e.target.files));
    e.target.value = '';
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const uploadFile = async (item: FileItem) => {
    setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'uploading', progress: 10 } : f));

    try {
      const formData = new FormData();
      formData.append('file', item.file);
      formData.append('category', 'admin-documents');

      // Simulate progress
      const progressInterval = setInterval(() => {
        setFiles(prev => prev.map(f =>
          f.id === item.id && f.progress < 80
            ? { ...f, progress: f.progress + 15 }
            : f
        ));
      }, 300);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Upload failed (${res.status})`);
      }

      const data = await res.json();
      setFiles(prev => prev.map(f =>
        f.id === item.id
          ? { ...f, status: 'done', progress: 100, url: data.url || data.path }
          : f
      ));
    } catch (err) {
      setFiles(prev => prev.map(f =>
        f.id === item.id
          ? { ...f, status: 'error', progress: 0, error: err instanceof Error ? err.message : 'Upload failed' }
          : f
      ));
    }
  };

  const uploadAll = () => {
    files.filter(f => f.status === 'idle').forEach(uploadFile);
  };

  const pendingCount = files.filter(f => f.status === 'idle').length;
  const doneCount = files.filter(f => f.status === 'done').length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm mb-6">
        <ol className="flex items-center gap-2 text-gray-500">
          <li><Link href="/admin" className="hover:text-gray-900">Admin</Link></li>
          <li>/</li>
          <li><Link href="/admin/documents" className="hover:text-gray-900">Documents</Link></li>
          <li>/</li>
          <li className="text-gray-900 font-medium">Upload</li>
        </ol>
      </nav>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Upload Documents</h1>
        <p className="text-gray-500 mt-1 text-sm">PDF, DOC, DOCX, JPG, PNG — max 10MB per file</p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
          dragging
            ? 'border-red-400 bg-red-50'
            : 'border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100'
        }`}
      >
        <Upload className={`w-10 h-10 mx-auto mb-3 ${dragging ? 'text-red-500' : 'text-gray-400'}`} />
        <p className="font-medium text-gray-700">
          {dragging ? 'Drop files here' : 'Drag & drop files here'}
        </p>
        <p className="text-sm text-gray-400 mt-1">or click to browse</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          className="hidden"
          onChange={onInputChange}
        />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">
              {files.length} file{files.length !== 1 ? 's' : ''} selected
              {doneCount > 0 && <span className="text-green-600 ml-2">· {doneCount} uploaded</span>}
            </h2>
            {pendingCount > 0 && (
              <button
                onClick={uploadAll}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                <Upload className="w-4 h-4" />
                Upload {pendingCount} file{pendingCount !== 1 ? 's' : ''}
              </button>
            )}
          </div>

          {files.map(item => (
            <div
              key={item.id}
              className={`flex items-center gap-4 p-4 rounded-lg border ${
                item.status === 'done' ? 'border-green-200 bg-green-50' :
                item.status === 'error' ? 'border-red-200 bg-red-50' :
                'border-gray-200 bg-white'
              }`}
            >
              {/* Icon */}
              <div className="flex-shrink-0">{fileIcon(item.file.type)}</div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{item.file.name}</p>
                <p className="text-xs text-gray-400">{formatSize(item.file.size)}</p>

                {/* Progress bar */}
                {item.status === 'uploading' && (
                  <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500 rounded-full transition-all duration-300"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                )}

                {item.status === 'error' && (
                  <p className="text-xs text-red-600 mt-1">{item.error}</p>
                )}

                {item.status === 'done' && item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                  >
                    View uploaded file
                  </a>
                )}
              </div>

              {/* Status / actions */}
              <div className="flex-shrink-0 flex items-center gap-2">
                {item.status === 'idle' && (
                  <>
                    <button
                      onClick={() => uploadFile(item)}
                      className="text-xs text-red-600 hover:text-red-700 font-medium"
                    >
                      Upload
                    </button>
                    <button onClick={() => removeFile(item.id)} className="text-gray-400 hover:text-gray-600">
                      <X className="w-4 h-4" />
                    </button>
                  </>
                )}
                {item.status === 'uploading' && (
                  <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                )}
                {item.status === 'done' && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
                {item.status === 'error' && (
                  <div className="flex items-center gap-1">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <button
                      onClick={() => uploadFile(item)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Retry
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Link to document center */}
      <div className="mt-8 pt-6 border-t border-gray-100">
        <Link
          href="/admin/document-center"
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
        >
          <FolderOpen className="w-4 h-4" />
          View all documents in Document Center
        </Link>
      </div>
    </div>
  );
}
