'use client';

import { useMemo, useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, Film, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useCourse } from '../CourseProvider';
import type { StudioLesson } from '@/lib/studio/course-session';
import { PanelHeader } from './BlueprintPanel';

type EditableLesson = {
  id: string;
  course_id: string;
  title: string;
  content: string | null;
  video_url: string | null;
  order_index: number;
  duration_minutes: number | null;
  created_at: string;
};

type FormState = {
  title: string;
  content: string;
  video_url: string;
  duration_minutes: string;
};

const EMPTY_FORM: FormState = { title: '', content: '', video_url: '', duration_minutes: '' };

function toEditable(value: StudioLesson): EditableLesson {
  const lesson = value as StudioLesson & { content?: string | null };
  return {
    id: lesson.id,
    course_id: lesson.course_id,
    title: lesson.title,
    content: lesson.content ?? null,
    video_url: lesson.video_url ?? null,
    order_index: lesson.order_index,
    duration_minutes: lesson.duration_minutes ?? null,
    created_at: lesson.created_at,
  };
}

function toStudio(saved: EditableLesson, existing: StudioLesson | undefined, courseId: string): StudioLesson {
  return {
    lesson_type: 'lesson',
    module_id: null,
    is_published: false,
    approved: false,
    slug: null,
    video_config: null,
    activities: null,
    quiz_questions: null,
    passing_score: null,
    ai_generated: false,
    updated_at: new Date().toISOString(),
    ...(existing ?? {}),
    ...saved,
    course_id: courseId,
  } as StudioLesson;
}

export function CurriculumPanel() {
  const { state, upsertLesson, deleteLesson, appendAIMemory } = useCourse();
  const { course, modules, lessons } = state;
  const [editing, setEditing] = useState<EditableLesson | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoStatus, setVideoStatus] = useState<string | null>(null);

  const editableLessons = useMemo(
    () => lessons.map(toEditable).sort((a, b) => a.order_index - b.order_index),
    [lessons],
  );
  const missingVideos = editableLessons.filter((lesson) => !lesson.video_url || lesson.video_url.startsWith('/videos/')).length;
  const hasVideoProfile = Boolean((course as any).video_config || (course as any).video_profile);

  const beginCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError(null);
    setOpen(true);
  };

  const beginEdit = (lesson: EditableLesson) => {
    setEditing(lesson);
    setForm({
      title: lesson.title,
      content: lesson.content ?? '',
      video_url: lesson.video_url ?? '',
      duration_minutes: lesson.duration_minutes?.toString() ?? '',
    });
    setError(null);
    setOpen(true);
  };

  const saveLesson = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const payload = {
        course_id: course.id,
        title: form.title.trim(),
        content: form.content || null,
        video_url: form.video_url || null,
        duration_minutes: form.duration_minutes ? Number.parseInt(form.duration_minutes, 10) : null,
        order_index: editing?.order_index ?? editableLessons.length,
        ...(editing ? { id: editing.id } : { lesson_number: editableLessons.length + 1 }),
      };
      const response = await fetch('/api/admin/courses/lessons', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error || 'Failed to save lesson');
      const saved = body.data as EditableLesson;
      upsertLesson(toStudio(saved, lessons.find((lesson) => lesson.id === saved.id), course.id));
      appendAIMemory({ role: 'action', content: `Lesson saved: "${saved.title}"`, source: 'curriculum' });
      setOpen(false);
      setEditing(null);
      setForm(EMPTY_FORM);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Failed to save lesson');
    } finally {
      setBusy(false);
    }
  };

  const removeLesson = async (lesson: EditableLesson) => {
    if (!window.confirm(`Delete "${lesson.title}"?`)) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/courses/lessons', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: lesson.id }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error || 'Failed to delete lesson');
      deleteLesson(lesson.id);
      appendAIMemory({ role: 'action', content: `Lesson deleted: ${lesson.id}`, source: 'curriculum' });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Failed to delete lesson');
    } finally {
      setBusy(false);
    }
  };

  const moveLesson = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= editableLessons.length) return;
    const current = editableLessons[index];
    const target = editableLessons[targetIndex];
    setBusy(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/courses/lessons', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonA: { id: current.id, order_index: targetIndex },
          lessonB: { id: target.id, order_index: index },
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error || 'Failed to reorder lessons');
      upsertLesson(toStudio({ ...current, order_index: targetIndex }, lessons.find((lesson) => lesson.id === current.id), course.id));
      upsertLesson(toStudio({ ...target, order_index: index }, lessons.find((lesson) => lesson.id === target.id), course.id));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Failed to reorder lessons');
    } finally {
      setBusy(false);
    }
  };

  const generateVideos = async (lessonId?: string, force = false) => {
    const prompt = lessonId
      ? 'Queue regeneration for the video on this lesson?'
      : force
        ? `Queue regeneration for all ${editableLessons.length} lesson videos?`
        : `Queue videos for ${missingVideos} lessons missing video?`;
    if (!window.confirm(prompt)) return;
    setBusy(true);
    setError(null);
    setVideoStatus('Queueing media through Course Builder…');
    try {
      const response = await fetch(`/api/admin/courses/${course.id}/generate-videos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId, force }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error || 'Video queue request failed');
      setVideoStatus(
        body?.message ||
          `Queued ${body.queued ?? 0} lesson video${body.queued === 1 ? '' : 's'} and ${body.microclipsQueued ?? 0} microclip${body.microclipsQueued === 1 ? '' : 's'}. Generation is complete only after persisted jobs finish with playable URLs.`,
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Video queue request failed');
      setVideoStatus(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-6">
      <PanelHeader
        icon={<BookOpen className="h-5 w-5" />}
        title="Curriculum"
        subtitle={`${lessons.length} lesson${lessons.length === 1 ? '' : 's'} across ${modules.length} module${modules.length === 1 ? '' : 's'}`}
      />

      <div className="mb-5 flex flex-wrap gap-2">
        <button type="button" onClick={beginCreate} className="inline-flex items-center gap-2 rounded-lg bg-brand-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-blue-700">
          <Plus className="h-4 w-4" /> Add Lesson
        </button>
        {hasVideoProfile && missingVideos > 0 ? (
          <button type="button" onClick={() => generateVideos()} disabled={busy} className="inline-flex items-center gap-2 rounded-lg border border-purple-300 px-4 py-2 text-sm font-bold text-purple-700 hover:bg-purple-50 disabled:opacity-50">
            <Film className="h-4 w-4" /> Queue {missingVideos} Missing Video{missingVideos === 1 ? '' : 's'}
          </button>
        ) : null}
        {hasVideoProfile && editableLessons.length > 0 ? (
          <button type="button" onClick={() => generateVideos(undefined, true)} disabled={busy} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            Queue Regeneration for All Videos
          </button>
        ) : null}
      </div>

      {videoStatus ? <div className="mb-4 rounded-lg border border-purple-200 bg-purple-50 px-4 py-3 text-sm text-purple-800">{videoStatus}</div> : null}
      {error ? <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {editableLessons.length ? (
          <div className="divide-y divide-slate-100">
            {editableLessons.map((lesson, index) => (
              <div key={lesson.id} className="flex flex-wrap items-center gap-3 p-4">
                <div className="flex flex-col">
                  <button type="button" onClick={() => moveLesson(index, -1)} disabled={busy || index === 0} className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-20" aria-label="Move lesson up"><ChevronUp className="h-4 w-4" /></button>
                  <button type="button" onClick={() => moveLesson(index, 1)} disabled={busy || index === editableLessons.length - 1} className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-20" aria-label="Move lesson down"><ChevronDown className="h-4 w-4" /></button>
                </div>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">{index + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900">{lesson.title}</p>
                  <p className="text-xs text-slate-500">{lesson.duration_minutes ?? 0} min · {lesson.video_url ? 'video attached' : 'no video'}</p>
                </div>
                {hasVideoProfile ? <button type="button" onClick={() => generateVideos(lesson.id, true)} disabled={busy} className="rounded-lg border border-purple-200 px-3 py-2 text-xs font-bold text-purple-700 hover:bg-purple-50 disabled:opacity-50"><Film className="mr-1 inline h-3.5 w-3.5" />Queue Video</button> : null}
                <button type="button" onClick={() => beginEdit(lesson)} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50" aria-label={`Edit ${lesson.title}`}><Pencil className="h-4 w-4" /></button>
                <button type="button" onClick={() => removeLesson(lesson)} disabled={busy} className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50 disabled:opacity-50" aria-label={`Delete ${lesson.title}`}><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-10 text-center text-sm text-slate-500">No lessons yet. Use Add Lesson to create the first lesson.</div>
        )}
      </div>

      {open ? (
        <div className="fixed inset-0 z-[12000] flex items-center justify-center bg-slate-950/55 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="text-lg font-bold text-slate-900">{editing ? 'Edit Lesson' : 'Add Lesson'}</h3>
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Close lesson editor"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={saveLesson} className="space-y-4 p-6">
              <label className="block text-sm font-semibold text-slate-700">Title<input required value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
              <label className="block text-sm font-semibold text-slate-700">Video URL<input type="url" value={form.video_url} onChange={(event) => setForm((current) => ({ ...current, video_url: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
              <label className="block text-sm font-semibold text-slate-700">Content<textarea rows={7} value={form.content} onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
              <label className="block text-sm font-semibold text-slate-700">Duration (minutes)<input type="number" min="0" value={form.duration_minutes} onChange={(event) => setForm((current) => ({ ...current, duration_minutes: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
              <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold">Cancel</button><button type="submit" disabled={busy} className="rounded-lg bg-brand-blue-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{busy ? 'Saving…' : editing ? 'Update Lesson' : 'Add Lesson'}</button></div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
