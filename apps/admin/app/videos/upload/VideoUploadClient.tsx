'use client';

import { FormEvent, useState } from 'react';
import { Upload, X, CheckCircle, Loader2, Film } from 'lucide-react';

const MAX_FILE_SIZE = 200 * 1024 * 1024;
const ACCEPTED_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

type UploadResponse = {
  success?: boolean;
  url?: string;
  video?: { id?: string; title?: string };
  error?: string;
};

export default function VideoUploadClient() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Training');
  const [courseId, setCourseId] = useState('');
  const [lessonId, setLessonId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setUploadedUrl(null);

    if (!file) {
      setError('Select a video file.');
      return;
    }
    if (!title.trim()) {
      setError('Enter a real title for this video.');
      return;
    }
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Only MP4, WebM, and QuickTime video files are accepted.');
      return;
    }
    if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
      setError('Video must be 200 MB or smaller.');
      return;
    }

    setUploading(true);
    try {
      const body = new FormData();
      body.append('file', file);
      body.append('title', title.trim());
      if (description.trim()) body.append('description', description.trim());
      if (category.trim()) body.append('category', category.trim());
      if (courseId.trim()) body.append('courseId', courseId.trim());
      if (lessonId.trim()) body.append('lessonId', lessonId.trim());

      const response = await fetch('/api/admin/videos/upload', { method: 'POST', body });
      const payload = (await response.json().catch(() => ({}))) as UploadResponse;
      if (!response.ok || !payload.success || !payload.url) {
        throw new Error(payload.error || 'Video upload failed.');
      }

      setUploadedUrl(payload.url);
      setFile(null);
      setTitle('');
      setDescription('');
      setCourseId('');
      setLessonId('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Video upload failed.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <Film className="h-5 w-5 text-brand-blue-700" />
          <h2 className="font-black text-slate-950">Production video details</h2>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-bold text-slate-700 sm:col-span-2">
            Title
            <input value={title} onChange={(e) => setTitle(e.target.value)} required className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-950" />
          </label>
          <label className="text-sm font-bold text-slate-700 sm:col-span-2">
            Description
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-950" />
          </label>
          <label className="text-sm font-bold text-slate-700">
            Category
            <input value={category} onChange={(e) => setCategory(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-950" />
          </label>
          <div className="rounded-xl bg-slate-50 p-3 text-xs font-semibold text-slate-600">
            Leave Course ID and Lesson ID blank for a public production video. Add either UUID only when the video belongs to course content.
          </div>
          <label className="text-sm font-bold text-slate-700">
            Course ID (optional UUID)
            <input value={courseId} onChange={(e) => setCourseId(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-sm text-slate-950" />
          </label>
          <label className="text-sm font-bold text-slate-700">
            Lesson ID (optional UUID)
            <input value={lessonId} onChange={(e) => setLessonId(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-sm text-slate-950" />
          </label>
        </div>
      </div>

      <label className="block rounded-2xl border-2 border-dashed border-slate-300 bg-white p-8 text-center">
        <Upload className="mx-auto h-10 w-10 text-slate-500" />
        <span className="mt-3 block font-black text-slate-900">Select a real video file</span>
        <span className="mt-1 block text-sm text-slate-600">MP4, WebM, or QuickTime · maximum 200 MB</span>
        <input type="file" accept="video/mp4,video/webm,video/quicktime" className="mt-4 block w-full text-sm" onChange={(e) => setFile(e.currentTarget.files?.[0] ?? null)} />
        {file && <span className="mt-2 block text-sm font-bold text-emerald-700">{file.name}</span>}
      </label>

      {error && <div className="flex gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800"><X className="h-5 w-5 shrink-0" />{error}</div>}
      {uploadedUrl && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"><div className="flex items-center gap-2 font-black text-emerald-800"><CheckCircle className="h-5 w-5" />Video saved and playable</div><a href={uploadedUrl} target="_blank" rel="noreferrer" className="mt-2 block break-all text-sm font-semibold text-emerald-800 underline">{uploadedUrl}</a></div>}

      <button type="submit" disabled={uploading || !file || !title.trim()} className="inline-flex items-center gap-2 rounded-xl bg-brand-blue-700 px-5 py-3 text-sm font-black text-white hover:bg-brand-blue-800 disabled:cursor-not-allowed disabled:opacity-50">
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        {uploading ? 'Uploading…' : 'Upload production video'}
      </button>
    </form>
  );
}
