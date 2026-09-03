'use client';

import { useCallback, useRef, useState } from 'react';
import { Loader2, Upload } from 'lucide-react';

/**
 * Dev Studio document upload — same API as legacy containers, no artificial size cap in UI.
 */
export function LizzyUploadPanel() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState('');
  const [recent, setRecent] = useState<Array<{ name: string; url?: string; size: number }>>([]);

  const upload = useCallback(async (file: File) => {
    setUploading(true);
    setStatus('');
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('label', file.name);
      const res = await fetch('/api/admin/dev-studio/upload', { method: 'POST', body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setStatus(`Uploaded ${file.name}`);
      setRecent((prev) => [{ name: data.name ?? file.name, url: data.url, size: file.size }, ...prev].slice(0, 20));
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, []);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#1e1e1e] p-4">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#cccccc]">
        <Upload className="h-4 w-4 text-[#4ec9b0]" />
        Upload documents &amp; assets
      </div>
      <p className="mb-4 text-[11px] text-[#858585]">
        Stored in Supabase <code className="text-[#cccccc]">documents</code> (or R2 when configured). Server limit follows{' '}
        <code className="text-[#cccccc]">DEVSTUDIO_MAX_UPLOAD_BYTES</code> — not quarantined by file type in Lizzy.
      </p>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        multiple
        onChange={(e) => {
          const files = e.target.files;
          if (!files?.length) return;
          void Array.from(files).reduce(async (chain, file) => {
            await chain;
            await upload(file);
          }, Promise.resolve());
          e.target.value = '';
        }}
      />
      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0078d4] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
      >
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        Choose files to upload
      </button>
      {status && <p className="mt-3 text-[11px] text-[#4ec9b0]">{status}</p>}
      {recent.length > 0 && (
        <ul className="mt-4 space-y-2 overflow-y-auto text-[11px]">
          {recent.map((item, i) => (
            <li key={`${item.name}-${i}`} className="rounded border border-[#3c3c3c] bg-[#252526] px-3 py-2">
              <span className="text-[#cccccc]">{item.name}</span>
              <span className="ml-2 text-[#858585]">{(item.size / 1024).toFixed(1)} KB</span>
              {item.url && (
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="ml-2 text-[#4fc1ff] hover:underline">
                  Open
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
