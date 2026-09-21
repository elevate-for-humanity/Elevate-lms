'use client';

import { useCallback, useEffect, useState } from 'react';
import { Film, Loader2, PlayCircle, RefreshCw, Search, Upload, X } from 'lucide-react';
import VideoUploadClient from '@/apps/admin/app/videos/upload/VideoUploadClient';

type CourseVideo = {
  id: string;
  title: string;
  lesson_id?: string | null;
  storage_path: string;
  status?: string | null;
  asset_role?: string | null;
  created_at?: string | null;
  playbackUrl?: string | null;
};

export default function LicensedMediaLibrary({ courseId }: { courseId: string }) {
  const [videos, setVideos] = useState<CourseVideo[]>([]);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    if (!courseId) return;
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch(
        `/api/admin/course-builder?action=media-library&courseId=${encodeURIComponent(courseId)}`,
        { cache: 'no-store' },
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Unable to load course media');
      setVideos(Array.isArray(data.videos) ? data.videos : []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to load course media');
    } finally {
      setBusy(false);
    }
  }, [courseId]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = videos.filter((video) =>
    video.title.toLowerCase().includes(query.trim().toLowerCase()),
  );

  if (!courseId) {
    return (
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950">
        Select a course before managing course media.
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-700 bg-slate-900 p-5 text-white shadow-xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
            Course Media Library
          </p>
          <h2 className="mt-1 text-2xl font-black">Browse and upload real course videos</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
            This is the single media workspace for the selected course. Upload a real MP4, WebM,
            or QuickTime file, assign it to a lesson, and immediately see the stored asset here.
            No marketplace connection is required for normal course media.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void load()}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-600 px-4 py-3 font-black text-slate-100 hover:bg-slate-800 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh library
          </button>
          <button
            type="button"
            onClick={() => setUploadOpen((value) => !value)}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 font-black text-slate-950 hover:bg-cyan-300"
          >
            {uploadOpen ? <X className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
            {uploadOpen ? 'Close upload' : 'Upload video'}
          </button>
        </div>
      </div>

      {message ? (
        <div className="mt-4 rounded-xl border border-amber-700 bg-amber-950/50 p-3 text-sm text-amber-100">
          {message}
        </div>
      ) : null}

      {uploadOpen ? (
        <div className="mt-5 rounded-2xl bg-white p-4 text-slate-950 sm:p-6">
          <div className="mb-4">
            <h3 className="font-black">Upload to this course</h3>
            <p className="mt-1 text-sm text-slate-600">
              The selected course is already attached. Choose the lesson, enter a title, and select
              the real video file.
            </p>
          </div>
          <VideoUploadClient
            key={courseId}
            initialCourseId={courseId}
            embedded
            onUploaded={() => {
              setMessage('Video uploaded and added to the course media library.');
              setUploadOpen(false);
              void load();
            }}
          />
        </div>
      ) : null}

      <div className="mt-5 rounded-2xl bg-white p-4 text-slate-950">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-black">Stored course videos</h3>
            <p className="text-sm text-slate-500">
              {videos.length} stored asset{videos.length === 1 ? '' : 's'} for this course.
            </p>
          </div>
          <label className="flex min-w-64 items-center gap-2 rounded-xl border border-slate-300 px-3">
            <Search className="h-4 w-4 text-slate-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search videos"
              className="min-h-10 w-full outline-none"
            />
          </label>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((video) => (
            <article key={video.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
              {video.playbackUrl ? (
                <video
                  controls
                  preload="metadata"
                  className="aspect-video w-full bg-slate-950 object-contain"
                  src={video.playbackUrl}
                />
              ) : (
                <div className="flex aspect-video items-center justify-center bg-slate-900 text-slate-400">
                  <Film className="h-10 w-10" />
                </div>
              )}
              <div className="p-4">
                <h4 className="font-black">{video.title}</h4>
                <p className="mt-1 text-xs text-slate-500">
                  {video.status ?? 'stored'} · {video.asset_role ?? 'lesson media'}
                </p>
                <p className="mt-1 break-all text-[11px] text-slate-400">
                  {video.lesson_id ? `Lesson: ${video.lesson_id}` : 'No lesson assigned'}
                </p>
                {video.playbackUrl ? (
                  <a
                    href={video.playbackUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-1 text-xs font-black text-cyan-700 hover:text-cyan-900"
                  >
                    <PlayCircle className="h-3.5 w-3.5" />
                    Open video
                  </a>
                ) : null}
              </div>
            </article>
          ))}
          {!busy && !filtered.length ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 md:col-span-2 xl:col-span-3">
              {videos.length
                ? 'No stored videos match this search.'
                : 'No course videos have been uploaded yet. Use Upload video above.'}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
