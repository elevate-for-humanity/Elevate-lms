'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Lesson {
  id: string;
  course_id: string;
  title: string;
  content: string | null;
  video_url: string | null;
  order_index: number;
  duration_minutes: number | null;
  created_at: string;
}

interface Course {
  id: string;
  title: string;
  description: string | null;
  duration_hours: number | null;
  video_config?: any;
  video_profile?: any;
}

interface Props {
  course: Course | null;
  initialLessons: Lesson[];
  courseId: string;
  /** Optional: called after a lesson is created or updated */
  onLessonSaved?: (lesson: Lesson) => void;
  /** Optional: called after a lesson is deleted */
  onLessonDeleted?: (lessonId: string) => void;
}

type VideoGenStatus = 'idle' | 'running' | 'done' | 'error';

export default function LessonManagerClient({ course, initialLessons, courseId, onLessonSaved, onLessonDeleted }: Props) {
  const [lessons, setLessons] = useState<Lesson[]>(initialLessons);
  const [showModal, setShowModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    video_url: '',
    duration_minutes: '',
  });

  const [videoGenStatus, setVideoGenStatus] = useState<VideoGenStatus>('idle');
  const [videoGenMessage, setVideoGenMessage] = useState<string | null>(null);
  const [generatingLessonId, setGeneratingLessonId] = useState<string | null>(null);

  const hasVideoProfile = !!(course?.video_config || course?.video_profile);
  const missingVideos = lessons.filter(
    (l) => !l.video_url || l.video_url.startsWith('/videos/'),
  ).length;
  const supabaseVideos = lessons.filter(
    (l) => l.video_url && l.video_url.includes('supabase.co'),
  ).length;
  const totalDuration = lessons.reduce((sum, l) => sum + (l.duration_minutes || 0), 0);
  const videoGenRunning = videoGenStatus === 'running';

  const resetForm = () => {
    setFormData({ title: '', content: '', video_url: '', duration_minutes: '' });
    setEditingLesson(null);
    setError(null);
  };
  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };
  const openEditModal = (lesson: Lesson) => {
    setFormData({
      title: lesson.title,
      content: lesson.content || '',
      video_url: lesson.video_url || '',
      duration_minutes: lesson.duration_minutes?.toString() || '',
    });
    setEditingLesson(lesson);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const lessonData = {
      course_id: courseId,
      title: formData.title,
      content: formData.content || null,
      video_url: formData.video_url || null,
      duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
      order_index: editingLesson ? editingLesson.order_index : lessons.length,
      ...(editingLesson ? {} : { lesson_number: lessons.length + 1 }),
    };
    try {
      if (editingLesson) {
        const res = await fetch('/api/admin/courses/lessons', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingLesson.id, ...lessonData }),
        });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload.error || 'Failed to update lesson');
        setLessons(lessons.map((l) => (l.id === editingLesson.id ? payload.data : l)));
        onLessonSaved?.(payload.data);
      } else {
        const res = await fetch('/api/admin/courses/lessons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(lessonData),
        });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload.error || 'Failed to create lesson');
        setLessons([...lessons, payload.data]);
        onLessonSaved?.(payload.data);
      }
      setShowModal(false);
      resetForm();
    } catch {
      setError('An error occurred saving the lesson.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (lessonId: string) => {
    if (!confirm('Delete this lesson?')) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/courses/lessons', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: lessonId }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Failed to delete lesson');
      setLessons(lessons.filter((l) => l.id !== lessonId));
      onLessonDeleted?.(lessonId);
    } catch {
      setError('Failed to delete lesson.');
    } finally {
      setLoading(false);
    }
  };

  const moveLesson = async (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === lessons.length - 1)
    )
      return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const newLessons = [...lessons];
    [newLessons[index], newLessons[newIndex]] = [newLessons[newIndex], newLessons[index]];
    try {
      const res = await fetch('/api/admin/courses/lessons', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonA: { id: newLessons[newIndex].id, order_index: newIndex },
          lessonB: { id: newLessons[index].id, order_index: index },
        }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Failed to reorder lessons');
      setLessons(newLessons.map((l, i) => ({ ...l, order_index: i })));
    } catch {
      setError('Failed to reorder lessons.');
    }
  };

  const refreshLessons = async () => {
    const res = await fetch(`/api/admin/courses/lessons?courseId=${encodeURIComponent(courseId)}`);
    if (!res.ok) return;
    const payload = await res.json();
    const nextLessons = (payload?.data ?? []) as Lesson[];
    setLessons(nextLessons);
  };

  const handleGenerateVideos = async (opts: { lessonId?: string; force?: boolean } = {}) => {
    const { lessonId, force = false } = opts;
    const label = lessonId
      ? 'Regenerate video for this lesson?'
      : force
        ? `Regenerate ALL ${lessons.length} lesson videos? This will take several minutes.`
        : `Generate videos for ${missingVideos} lessons missing video? This may take several minutes.`;
    if (!confirm(label)) return;

    setVideoGenStatus('running');
    setVideoGenMessage(
      lessonId
        ? 'Generating video…'
        : `Generating ${force ? lessons.length : missingVideos} videos…`,
    );
    if (lessonId) setGeneratingLessonId(lessonId);

    try {
      const res = await fetch(`/api/admin/courses/${courseId}/generate-videos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId, force }),
      });
      const data = await res.json();
      if (!res.ok) {
        setVideoGenStatus('error');
        setVideoGenMessage(data.error || 'Video generation failed.');
      } else {
        setVideoGenStatus('done');
        setVideoGenMessage(
          `Generated ${data.generated} video${data.generated !== 1 ? 's' : ''}` +
            (data.failed ? ` · ${data.failed} failed` : '') +
            (data.profile ? ` · profile: ${data.profile}` : ''),
        );
        await refreshLessons();
      }
    } catch (err: any) {
      setVideoGenStatus('error');
      setVideoGenMessage(err.message);
    } finally {
      setGeneratingLessonId(null);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{course?.title || 'Course Content'}</h1>
          <p className="text-slate-500 mt-1 text-sm">Manage lessons, videos, and materials</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Link
            href="/admin/studio"
            className="px-4 py-2 border rounded-lg hover:bg-slate-50 text-sm"
          >
            ← Courses
          </Link>

          {hasVideoProfile && missingVideos > 0 && (
            <button
              onClick={() => handleGenerateVideos()}
              disabled={videoGenRunning}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2 disabled:opacity-50 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              {videoGenRunning ? 'Generating…' : `Generate ${missingVideos} Videos`}
            </button>
          )}

          {hasVideoProfile && missingVideos === 0 && lessons.length > 0 && (
            <button
              onClick={() => handleGenerateVideos({ force: true })}
              disabled={videoGenRunning}
              className="border border-purple-300 text-purple-700 px-4 py-2 rounded-lg hover:bg-purple-50 flex items-center gap-2 disabled:opacity-50 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Regenerate All
            </button>
          )}

          {!hasVideoProfile && (
            <span className="text-xs text-slate-400 self-center italic">
              Set video_profile on course to enable generation
            </span>
          )}

          <button
            onClick={openCreateModal}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Lesson
          </button>
        </div>
      </div>

      {/* Video gen status banner */}
      {videoGenStatus !== 'idle' && videoGenMessage && (
        <div
          className={`mb-4 p-3 rounded-lg text-sm flex items-center justify-between ${
            videoGenStatus === 'running'
              ? 'bg-purple-50 text-purple-800 border border-purple-200'
              : videoGenStatus === 'done'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <span className="flex items-center gap-2">
            {videoGenStatus === 'running' && (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            )}
            {videoGenStatus === 'done' && '✅ '}
            {videoGenStatus === 'error' && '❌ '}
            {videoGenMessage}
          </span>
          {videoGenStatus !== 'running' && (
            <button
              onClick={() => {
                setVideoGenStatus('idle');
                setVideoGenMessage(null);
              }}
              className="opacity-60 hover:opacity-100 ml-4"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex justify-between text-sm">
          {error}
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 ml-4">
            ✕
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Lessons', value: lessons.length, sub: null },
          {
            label: 'Videos',
            value: supabaseVideos,
            sub: missingVideos > 0 ? `${missingVideos} missing` : null,
            subColor: 'text-amber-600',
          },
          {
            label: 'Duration',
            value: `${Math.floor(totalDuration / 60)}h ${totalDuration % 60}m`,
            sub: null,
          },
          {
            label: 'Video Profile',
            value: hasVideoProfile ? '✅ Set' : 'Not set',
            sub: null,
            valueColor: hasVideoProfile ? 'text-green-600' : 'text-slate-400',
          },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg shadow-sm border p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide">{stat.label}</p>
            <p className={`text-2xl font-bold mt-1 ${(stat as any).valueColor || ''}`}>
              {stat.value}
            </p>
            {stat.sub && (
              <p className={`text-xs mt-0.5 ${(stat as any).subColor || 'text-slate-400'}`}>
                {stat.sub}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Lessons list */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Lessons</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Hover a row to see per-lesson actions · arrows to reorder
          </p>
        </div>
        <div className="divide-y">
          {lessons.length > 0 ? (
            lessons.map((lesson, index) => {
              const hasVideo = !!(lesson.video_url && lesson.video_url.includes('supabase.co'));
              const isGenerating = generatingLessonId === lesson.id;
              return (
                <div key={lesson.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 group">
                  {/* Reorder */}
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button
                      onClick={() => moveLesson(index, 'up')}
                      disabled={index === 0}
                      className="text-slate-300 hover:text-slate-600 disabled:opacity-20"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 15l7-7 7 7"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => moveLesson(index, 'down')}
                      disabled={index === lessons.length - 1}
                      className="text-slate-300 hover:text-slate-600 disabled:opacity-20"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* Index badge */}
                  <span className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center text-xs font-medium shrink-0">
                    {index + 1}
                  </span>

                  {/* Video status icon */}
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isGenerating ? 'bg-purple-100' : hasVideo ? 'bg-blue-50' : 'bg-amber-50'}`}
                  >
                    {isGenerating ? (
                      <svg
                        className="w-4 h-4 text-purple-600 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8H4z"
                        />
                      </svg>
                    ) : hasVideo ? (
                      <svg
                        className="w-4 h-4 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-4 h-4 text-amber-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    )}
                  </div>

                  {/* Title + meta */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">{lesson.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {hasVideo ? 'Video' : 'No video'} · {lesson.duration_minutes || 0} min
                      {hasVideo && <span className="ml-1 text-blue-400">· Supabase</span>}
                    </p>
                  </div>

                  {/* Per-row actions — visible on hover */}
                  <div className="flex gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    {hasVideoProfile && (
                      <button
                        onClick={() => handleGenerateVideos({ lessonId: lesson.id, force: true })}
                        disabled={videoGenRunning}
                        title="Regenerate video for this lesson"
                        className="px-2 py-1.5 text-xs border border-purple-200 text-purple-700 rounded-lg hover:bg-purple-50 disabled:opacity-40 whitespace-nowrap"
                      >
                        {isGenerating ? '…' : '▶ Video'}
                      </button>
                    )}
                    <button
                      onClick={() => openEditModal(lesson)}
                      className="px-3 py-1.5 text-sm border rounded-lg hover:bg-slate-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(lesson.id)}
                      className="px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-slate-500">
              <p>No lessons yet.</p>
              <button
                onClick={openCreateModal}
                className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
              >
                Add your first lesson
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {editingLesson ? 'Edit Lesson' : 'Add Lesson'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-slate-400 hover:text-slate-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Introduction to Hair Cutting Techniques"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Video URL</label>
                <input
                  type="url"
                  value={formData.video_url}
                  onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://… or leave empty to generate via pipeline"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Leave empty — the Generate Videos button will create it automatically.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Content</label>
                <textarea
                  rows={6}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Lesson content (markdown). Used for narration script and b-roll selection."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 15"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Saving…' : editingLesson ? 'Update' : 'Add Lesson'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
