'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Upload, X, CheckCircle, Loader2, Film } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase/client';

const MAX_FILE_SIZE = 500 * 1024 * 1024;
const ACCEPTED_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

type UploadResponse = {
  success?: boolean;
  url?: string;
  video?: { id?: string; title?: string };
  error?: string;
};

type CourseLessonOption = { id: string; title: string };

export default function VideoUploadClient({
  initialCourseId = '',
  embedded = false,
  initialLessonId = '',
  licensedMatchId = '',
  licensedLibrary = false,
  onUploaded,
}: {
  initialCourseId?: string;
  embedded?: boolean;
  initialLessonId?: string;
  licensedMatchId?: string;
  licensedLibrary?: boolean;
  onUploaded?: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Training');
  const [courseId, setCourseId] = useState(initialCourseId);
  const [lessonId, setLessonId] = useState(initialLessonId);
  const [lessonOptions, setLessonOptions] = useState<CourseLessonOption[]>([]);
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [assetRole, setAssetRole] = useState<
    'source_broll' | 'course_preroll' | 'lesson_preroll' | 'lesson_outro' | 'reference'
  >('source_broll');
  const [providerItemId, setProviderItemId] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [programTags, setProgramTags] = useState('');
  const [lessonTags, setLessonTags] = useState('');
  const [resolution, setResolution] = useState('3840x2160');
  const [durationSeconds, setDurationSeconds] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId.trim()) {
      setLessonOptions([]);
      return;
    }
    const controller = new AbortController();
    setLessonsLoading(true);
    fetch(`/api/admin/courses/lessons?courseId=${encodeURIComponent(courseId.trim())}`, {
      cache: 'no-store',
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || 'Unable to load course lessons');
        return (payload.data ?? []) as CourseLessonOption[];
      })
      .then((rows) => {
        setLessonOptions(rows.filter((row) => row.id && row.title));
        if (rows.length === 1) setLessonId((current) => current || rows[0].id);
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setError(error instanceof Error ? error.message : 'Unable to load course lessons');
      })
      .finally(() => setLessonsLoading(false));
    return () => controller.abort();
  }, [courseId]);

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
      setError('Video must be 500 MB or smaller.');
      return;
    }
    if (licensedLibrary && !providerItemId.trim()) {
      setError('Enter the Envato item ID so the license and source remain traceable.');
      return;
    }

    setUploading(true);
    try {
      if (licensedLibrary) {
        const common = {
          title: title.trim(),
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          provider: 'envato',
          providerItemId: providerItemId.trim(),
          sourceUrl: sourceUrl.trim(),
          resolution: resolution.trim(),
          durationSeconds: Number(durationSeconds) || undefined,
          programTags: programTags
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean),
          lessonTags: lessonTags
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean),
        };
        const prepareResponse = await fetch('/api/admin/videos/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'prepare-library', ...common }),
        });
        const prepared = (await prepareResponse.json().catch(() => ({}))) as UploadResponse & {
          bucket?: string;
          storagePath?: string;
          token?: string;
        };
        if (!prepareResponse.ok || !prepared.storagePath || !prepared.token || !prepared.bucket) {
          throw new Error(
            prepared.error || 'The secure media-library upload could not be prepared.',
          );
        }
        const supabase = createBrowserClient();
        const { error: uploadError } = await supabase.storage
          .from(prepared.bucket)
          .uploadToSignedUrl(prepared.storagePath, prepared.token, file, {
            contentType: file.type,
            cacheControl: '31536000',
          });
        if (uploadError) throw new Error(`Secure media upload failed: ${uploadError.message}`);
        const finalizeResponse = await fetch('/api/admin/videos/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'finalize-library',
            storagePath: prepared.storagePath,
            ...common,
          }),
        });
        const finalized = (await finalizeResponse.json().catch(() => ({}))) as UploadResponse;
        if (!finalizeResponse.ok || !finalized.success) {
          throw new Error(finalized.error || 'The licensed media could not be indexed.');
        }
        setFile(null);
        setTitle('');
        setDescription('');
        setProviderItemId('');
        setSourceUrl('');
        setProgramTags('');
        setLessonTags('');
        setDurationSeconds('');
        onUploaded?.();
        return;
      }
      if (courseId.trim() || lessonId.trim()) {
        if (!courseId.trim() || !lessonId.trim()) {
          throw new Error('Course videos require both a Course ID and Lesson ID.');
        }
        const prepareResponse = await fetch('/api/admin/videos/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'prepare',
            title: title.trim(),
            description: description.trim(),
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            courseId: courseId.trim(),
            lessonId: lessonId.trim(),
            licensedMatchId: licensedMatchId || undefined,
            assetRole,
          }),
        });
        const prepared = (await prepareResponse.json().catch(() => ({}))) as UploadResponse & {
          bucket?: string;
          storagePath?: string;
          token?: string;
        };
        if (!prepareResponse.ok || !prepared.storagePath || !prepared.token || !prepared.bucket) {
          throw new Error(prepared.error || 'The course video upload could not be prepared.');
        }
        const supabase = createBrowserClient();
        const { error: uploadError } = await supabase.storage
          .from(prepared.bucket)
          .uploadToSignedUrl(prepared.storagePath, prepared.token, file, {
            contentType: file.type,
          });
        if (uploadError) throw new Error(`Video storage upload failed: ${uploadError.message}`);

        const finalizeResponse = await fetch('/api/admin/videos/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'finalize',
            title: title.trim(),
            description: description.trim(),
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            courseId: courseId.trim(),
            lessonId: lessonId.trim(),
            storagePath: prepared.storagePath,
            licensedMatchId: licensedMatchId || undefined,
            assetRole,
          }),
        });
        const finalized = (await finalizeResponse.json().catch(() => ({}))) as UploadResponse;
        if (!finalizeResponse.ok || !finalized.success || !finalized.url) {
          throw new Error(finalized.error || 'The course video upload could not be finalized.');
        }
        setUploadedUrl(finalized.url);
        setFile(null);
        setTitle('');
        setDescription('');
        setCourseId(initialCourseId);
        setLessonId(initialLessonId);
        onUploaded?.();
        return;
      }

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
      setCourseId(initialCourseId);
      setLessonId(initialLessonId);
      onUploaded?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Video upload failed.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {embedded ? (
        <div className="rounded-2xl border border-cyan-800 bg-slate-950 p-5 text-white">
          <h2 className="font-black">
            {licensedLibrary
              ? 'Store purchased footage in the secure course library'
              : 'Upload a purchased scene to this course'}
          </h2>
          <p className="mt-1 text-sm text-slate-300">
            {licensedLibrary
              ? 'Upload once. Course Builder will match and attach this licensed master to future lessons without duplicating the file.'
              : 'Choose the downloaded MP4, add the lesson ID, and upload. The selected course is already attached.'}
          </p>
        </div>
      ) : null}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <Film className="h-5 w-5 text-brand-blue-700" />
          <h2 className="font-black text-slate-950">Production video details</h2>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-bold text-slate-700 sm:col-span-2">
            Title
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-950"
            />
          </label>
          <label className="text-sm font-bold text-slate-700 sm:col-span-2">
            Description
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-950"
            />
          </label>
          {licensedLibrary ? (
            <>
              <label className="text-sm font-bold text-slate-700">
                Envato item ID
                <input
                  value={providerItemId}
                  onChange={(e) => setProviderItemId(e.target.value)}
                  required
                  className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-950"
                />
              </label>
              <label className="text-sm font-bold text-slate-700">
                Resolution
                <input
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-950"
                />
              </label>
              <label className="text-sm font-bold text-slate-700 sm:col-span-2">
                Envato source URL
                <input
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-950"
                />
              </label>
              <label className="text-sm font-bold text-slate-700">
                Program tags
                <input
                  value={programTags}
                  onChange={(e) => setProgramTags(e.target.value)}
                  placeholder="cosmetology, nails"
                  className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-950"
                />
              </label>
              <label className="text-sm font-bold text-slate-700">
                Lesson tags
                <input
                  value={lessonTags}
                  onChange={(e) => setLessonTags(e.target.value)}
                  placeholder="manicure, shaping, safety"
                  className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-950"
                />
              </label>
              <label className="text-sm font-bold text-slate-700">
                Duration in seconds
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={durationSeconds}
                  onChange={(e) => setDurationSeconds(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-950"
                />
              </label>
            </>
          ) : null}
          {!licensedLibrary ? (
            <label className="text-sm font-bold text-slate-700">
              Category
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-950"
              />
            </label>
          ) : null}
          {!licensedLibrary ? (
            <div className="rounded-xl bg-slate-50 p-3 text-xs font-semibold text-slate-600">
              Leave Course ID and Lesson ID blank for a public production video. Add either UUID
              only when the video belongs to course content.
            </div>
          ) : null}
          {!licensedLibrary ? (
            <label className="text-sm font-bold text-slate-700">
              Course ID (optional UUID)
              <input
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-sm text-slate-950"
              />
            </label>
          ) : null}
          {!licensedLibrary ? (
            <label className="text-sm font-bold text-slate-700">
              Course lesson
              {courseId.trim() && lessonOptions.length ? (
                <select
                  value={lessonId}
                  onChange={(e) => setLessonId(e.target.value)}
                  disabled={lessonsLoading}
                  className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-950"
                >
                  <option value="">Select the lesson for this scene</option>
                  {lessonOptions.map((lesson) => (
                    <option key={lesson.id} value={lesson.id}>
                      {lesson.title}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  value={lessonId}
                  onChange={(e) => setLessonId(e.target.value)}
                  placeholder={lessonsLoading ? 'Loading lessons…' : 'Lesson UUID (optional)'}
                  disabled={lessonsLoading}
                  className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-sm text-slate-950"
                />
              )}
            </label>
          ) : null}
          {courseId.trim() && lessonId.trim() && !licensedMatchId ? (
            <label className="text-sm font-bold text-slate-700 sm:col-span-2">
              Placement in the course video
              <select
                value={assetRole}
                onChange={(event) => setAssetRole(event.target.value as typeof assetRole)}
                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-950"
              >
                <option value="source_broll">Lesson scene / B-roll</option>
                <option value="lesson_preroll">Lesson pre-roll</option>
                <option value="course_preroll">Course pre-roll</option>
                <option value="lesson_outro">Lesson outro</option>
                <option value="reference">Reference only</option>
              </select>
            </label>
          ) : null}
        </div>
      </div>

      <label className="block rounded-2xl border-2 border-dashed border-slate-300 bg-white p-8 text-center">
        <Upload className="mx-auto h-10 w-10 text-slate-500" />
        <span className="mt-3 block font-black text-slate-900">Select a real video file</span>
        <span className="mt-1 block text-sm text-slate-600">
          MP4, WebM, or QuickTime · maximum 500 MB
        </span>
        <input
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          className="mt-4 block w-full text-sm"
          onChange={(e) => setFile(e.currentTarget.files?.[0] ?? null)}
        />
        {file && <span className="mt-2 block text-sm font-bold text-emerald-700">{file.name}</span>}
      </label>

      {error && (
        <div className="flex gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">
          <X className="h-5 w-5 shrink-0" />
          {error}
        </div>
      )}
      {uploadedUrl && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center gap-2 font-black text-emerald-800">
            <CheckCircle className="h-5 w-5" />
            Video saved and playable
          </div>
          <a
            href={uploadedUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-2 block break-all text-sm font-semibold text-emerald-800 underline"
          >
            {uploadedUrl}
          </a>
        </div>
      )}

      <button
        type="submit"
        disabled={uploading || !file || !title.trim()}
        className="inline-flex items-center gap-2 rounded-xl bg-brand-blue-700 px-5 py-3 text-sm font-black text-white hover:bg-brand-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        {uploading
          ? 'Uploading…'
          : licensedLibrary
            ? 'Store in secure course library'
            : 'Upload production video'}
      </button>
    </form>
  );
}
