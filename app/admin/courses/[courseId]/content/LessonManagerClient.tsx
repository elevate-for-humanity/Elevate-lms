'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
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
}

interface Props {
  course: Course | null;
  initialLessons: Lesson[];
  courseId: string;
}

export default function LessonManagerClient({ course, initialLessons, courseId }: Props) {
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

  const supabase = createClient();

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
    };

    try {
      if (editingLesson) {
        const { data, error: updateError } = await supabase
          .from('lessons')
          .update(lessonData)
          .eq('id', editingLesson.id)
          .select()
          .single();

        if (updateError) throw updateError;
        setLessons(lessons.map(l => l.id === editingLesson.id ? data : l));
      } else {
        const { data, error: insertError } = await supabase
          .from('lessons')
          .insert(lessonData)
          .select()
          .single();

        if (insertError) throw insertError;
        setLessons([...lessons, data]);
      }

      setShowModal(false);
      resetForm();
    } catch (err: any) {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (lessonId: string) => {
    if (!confirm('Are you sure you want to delete this lesson?')) return;

    setLoading(true);
    try {
      const { error: deleteError } = await supabase.from('lessons').delete().eq('id', lessonId);
      if (deleteError) throw deleteError;
      setLessons(lessons.filter(l => l.id !== lessonId));
    } catch (err: any) {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const moveLesson = async (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === lessons.length - 1)) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const newLessons = [...lessons];
    [newLessons[index], newLessons[newIndex]] = [newLessons[newIndex], newLessons[index]];

    // Update order_index for both lessons
    try {
      await Promise.all([
        supabase.from('lessons').update({ order_index: newIndex }).eq('id', newLessons[newIndex].id),
        supabase.from('lessons').update({ order_index: index }).eq('id', newLessons[index].id),
      ]);
      setLessons(newLessons.map((l, i) => ({ ...l, order_index: i })));
    } catch (err: any) {
      setError('Failed to reorder lessons');
    }
  };

  const totalDuration = lessons.reduce((sum, l) => sum + (l.duration_minutes || 0), 0);
  const videoCount = lessons.filter(l => l.video_url).length;

  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{course?.title || 'Course Content'}</h1>
          <p className="text-gray-600 mt-2">Manage lessons, videos, and materials</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/course-builder" className="px-4 py-2 border rounded-lg hover:bg-gray-50">Back to Courses</Link>
          <button onClick={openCreateModal} className="bg-brand-blue-600 text-white px-4 py-2 rounded-lg hover:bg-brand-blue-700 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add Lesson
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-brand-red-50 border border-brand-red-200 rounded-lg text-brand-red-700">
          {error}
          <button onClick={() => setError(null)} className="ml-4 text-brand-red-500 hover:text-brand-red-700">Dismiss</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-sm text-gray-500">Total Lessons</p>
          <p className="text-2xl font-bold">{lessons.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-sm text-gray-500">Videos</p>
          <p className="text-2xl font-bold">{videoCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-sm text-gray-500">Text Lessons</p>
          <p className="text-2xl font-bold">{lessons.length - videoCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-sm text-gray-500">Total Duration</p>
          <p className="text-2xl font-bold">{Math.floor(totalDuration / 60)}h {totalDuration % 60}m</p>
        </div>
      </div>

      {/* Lessons List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Course Lessons</h2>
          <p className="text-sm text-gray-500">Use arrows to reorder lessons</p>
        </div>
        <div className="divide-y">
          {lessons.length > 0 ? (
            lessons.map((lesson, index) => (
              <div key={lesson.id} className="p-4 flex items-center gap-4 hover:bg-gray-50">
                <div className="flex flex-col gap-1">
                  <button onClick={() => moveLesson(index, 'up')} disabled={index === 0} className="text-gray-400 hover:text-gray-600 disabled:opacity-30">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                  </button>
                  <button onClick={() => moveLesson(index, 'down')} disabled={index === lessons.length - 1} className="text-gray-400 hover:text-gray-600 disabled:opacity-30">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                </div>
                <span className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </span>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-100">
                  {lesson.video_url ? (
                    <svg className="w-5 h-5 text-brand-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  ) : (
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{lesson.title}</p>
                  <p className="text-sm text-gray-500">
                    {lesson.video_url ? 'Video' : 'Text'} • {lesson.duration_minutes || 0} min
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEditModal(lesson)} className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50">Edit</button>
                  <button onClick={() => handleDelete(lesson.id)} className="px-3 py-1.5 text-sm text-brand-red-600 border border-brand-red-200 rounded-lg hover:bg-brand-red-50">Delete</button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500">
              <p>No lessons yet</p>
              <button onClick={openCreateModal} className="mt-2 text-brand-blue-600 hover:text-brand-blue-800">Add your first lesson</button>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold">{editingLesson ? 'Edit Lesson' : 'Add New Lesson'}</h2>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lesson Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                  placeholder="e.g., Introduction to Hair Cutting Techniques"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Video URL (optional)</label>
                <input
                  type="url"
                  value={formData.video_url}
                  onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                  placeholder="https://youtube.com/watch?v=... or Vimeo URL"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty for text-only lesson</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                <textarea
                  rows={6}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                  placeholder="Lesson content, instructions, or notes..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                  placeholder="e.g., 15"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 disabled:opacity-50">
                  {loading ? 'Saving...' : (editingLesson ? 'Update Lesson' : 'Add Lesson')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
