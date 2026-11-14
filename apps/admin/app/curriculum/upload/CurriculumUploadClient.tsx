'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type UploadRecord = {
  id: string;
  title: string | null;
  file_name: string;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  public_url?: string | null;
  category: string | null;
  created_at: string;
};

const ACCEPTED_MIME = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'text/plain',
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'image/png',
  'image/jpeg',
];

const ACCEPTED_EXTENSIONS = '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt,.mp4,.mov,.webm,.png,.jpg,.jpeg';
const MAX_FILE_SIZE = 250 * 1024 * 1024; // 250 MB

function formatBytes(bytes?: number | null) {
  if (!bytes) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) { size /= 1024; unit++; }
  return `${size.toFixed(size >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`;
}

function safeName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

const CATEGORIES = [
  { value: 'curriculum',     label: 'Curriculum' },
  { value: 'lesson-plan',    label: 'Lesson Plan' },
  { value: 'student-packet', label: 'Student Packet' },
  { value: 'assessment',     label: 'Assessment' },
  { value: 'compliance',     label: 'Compliance' },
  { value: 'video',          label: 'Video' },
];

export default function CurriculumUploadClient() {
  const supabase = useMemo(() => createClient(), []);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [records, setRecords] = useState<UploadRecord[]>([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('curriculum');
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadRecords = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('curriculum_uploads')
      .select('id,title,file_name,file_path,file_type,file_size,public_url,category,created_at')
      .order('created_at', { ascending: false })
      .limit(50);

    if (err) {
      setLoadError(err.message);
      return;
    }
    setLoadError(null);
    setRecords(data ?? []);
  }, [supabase]);

  useEffect(() => { loadRecords(); }, [loadRecords]);

  const uploadFile = async (file: File) => {
    setError(null);
    setMessage(null);

    if (!ACCEPTED_MIME.includes(file.type)) {
      setError(`Unsupported file type: ${file.type || 'unknown'}. Check the accepted formats below.`);
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('File exceeds the 250 MB limit.');
      return;
    }

    setUploading(true);
    try {
      const timestamp = Date.now();
      const filePath = `${category}/${timestamp}-${safeName(file.name)}`;

      const { error: storageErr } = await supabase.storage
        .from('curriculum')
        .upload(filePath, file, { cacheControl: '3600', upsert: false, contentType: file.type });

      if (storageErr) throw storageErr;

      const { data: publicData } = supabase.storage.from('curriculum').getPublicUrl(filePath);

      const { error: dbErr } = await supabase.from('curriculum_uploads').insert({
        title: title.trim() || file.name,
        category,
        file_name: file.name,
        file_path: filePath,
        file_type: file.type,
        file_size: file.size,
        public_url: publicData.publicUrl,
        status: 'uploaded',
      });

      if (dbErr) throw dbErr;

      setTitle('');
      setMessage(`"${file.name}" uploaded successfully.`);
      await loadRecords();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleFiles = async (files: FileList | File[]) => {
    const file = Array.from(files)[0];
    if (file) await uploadFile(file);
  };

  const deleteRecord = async (record: UploadRecord) => {
    if (!window.confirm(`Delete "${record.file_name}"? This cannot be undone.`)) return;
    setError(null);
    setMessage(null);

    const { error: storageErr } = await supabase.storage.from('curriculum').remove([record.file_path]);
    if (storageErr) { setError(storageErr.message); return; }

    const { error: dbErr } = await supabase.from('curriculum_uploads').delete().eq('id', record.id);
    if (dbErr) { setError(dbErr.message); return; }

    setMessage('File deleted.');
    await loadRecords();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Upload card */}
      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Upload Curriculum</h1>
        <p className="mt-1 text-sm text-slate-500">
          Lesson plans, packets, videos, forms, spreadsheets, and training materials. Max 250 MB per file.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Title <span className="text-slate-400 font-normal">(optional)</span></span>
            <input
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. CNA Module 1 Skills Packet"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Category</span>
            <select
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </label>
        </div>

        {/* Drop zone */}
        <div
          className={`mt-5 rounded-2xl border-2 border-dashed p-10 text-center transition-colors cursor-pointer ${
            dragging ? 'border-slate-800 bg-slate-50' : 'border-slate-300 hover:border-slate-400'
          }`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
        >
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept={ACCEPTED_EXTENSIONS}
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
          <svg className="mx-auto mb-3 w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-sm font-medium text-slate-700">Drop a file here, or click to browse</p>
          <p className="mt-1 text-xs text-slate-400">PDF, Word, PowerPoint, Excel, CSV, text, image, MP4, MOV, WebM</p>

          <button
            type="button"
            disabled={uploading}
            onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
            className="mt-5 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
          >
            {uploading ? 'Uploading…' : 'Choose file'}
          </button>
        </div>

        {message && (
          <p className="mt-4 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">{message}</p>
        )}
        {error && (
          <p className="mt-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</p>
        )}
      </section>

      {/* Recent uploads */}
      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Recent Uploads</h2>

        {loadError && (
          <p className="mt-3 text-sm text-red-600">Could not load uploads: {loadError}</p>
        )}

        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">File</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3">Uploaded</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.length === 0 ? (
                <tr>
                  <td className="px-4 py-10 text-center text-slate-400 italic" colSpan={5}>
                    No curriculum files uploaded yet.
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{record.title || record.file_name}</div>
                      {record.title && (
                        <div className="text-xs text-slate-400 mt-0.5">{record.file_name}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                        {record.category || 'curriculum'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{formatBytes(record.file_size)}</td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {new Date(record.created_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        {record.public_url && (
                          <a
                            href={record.public_url}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            Open
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => deleteRecord(record)}
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
