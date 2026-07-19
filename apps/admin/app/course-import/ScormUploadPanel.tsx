'use client';

import { useState, useRef } from 'react';
import { Upload, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export default function ScormUploadPanel() {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    if (!file.name.endsWith('.zip')) {
      setResult({ ok: false, message: 'Only .zip SCORM packages are supported.' });
      return;
    }
    setUploading(true);
    setResult(null);

    const form = new FormData();
    form.append('file', file);
    form.append('title', file.name.replace('.zip', ''));

    try {
      const res = await fetch('/api/admin/scorm', { method: 'POST', body: form });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        setResult({ ok: true, message: d.message ?? 'Package uploaded successfully.' });
      } else {
        setResult({ ok: false, message: d.error ?? 'Upload failed.' });
      }
    } catch {
      setResult({ ok: false, message: 'Network error — upload failed.' });
    } finally {
      setUploading(false);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) upload(file);
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) upload(file);
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      className={`cursor-pointer border-2 border-dashed rounded-xl p-10 text-center transition-colors ${
        dragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
      }`}
    >
      <input ref={inputRef} type="file" accept=".zip" className="hidden" onChange={onFileChange} />

      {uploading ? (
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-sm font-medium">Uploading SCORM package…</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Upload className="w-8 h-8 text-slate-400" />
          <div>
            <p className="text-sm font-medium text-slate-700">Drop a SCORM .zip here or click to browse</p>
            <p className="text-xs text-slate-400 mt-1">SCORM 1.2 and SCORM 2004 supported</p>
          </div>
        </div>
      )}

      {result && (
        <div className={`mt-4 flex items-center justify-center gap-2 text-sm ${result.ok ? 'text-green-600' : 'text-red-600'}`}
          onClick={(e) => e.stopPropagation()}>
          {result.ok
            ? <CheckCircle className="w-4 h-4" />
            : <AlertCircle className="w-4 h-4" />}
          {result.message}
        </div>
      )}
    </div>
  );
}
