'use client';

import { useState } from 'react';
import { apiPost, apiPatch } from '@/lib/api';
import Link from 'next/link';

interface Course {
  id: string;
  title: string;
  description: string | null;
  program_id: string | null;
  duration_hours: number | null;
  is_published: boolean;
  order_index: number;
  created_at: string;
  programs?: { id: string; title: string } | null;
}

interface Program {
  id: string;
  title: string;
}

interface Props {
  initialCourses: Course[];
  programs: Program[];
}

export default function CourseBuilderClient({ initialCourses, programs }: Props) {
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    program_id: '',
    duration_hours: '',
    is_published: false,
  });

  const resetForm = () => {
    setFormData({ title: '', description: '', program_id: '', duration_hours: '', is_published: false });
    setEditingCourse(null);
    setError(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (course: Course) => {
    setFormData({
      title: course.title,
      description: course.description || '',
      program_id: course.program_id || '',
      duration_hours: course.duration_hours?.toString() || '',
      is_published: course.is_published,
    });
    setEditingCourse(course);
    setShowCreateModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const courseData = {
      title: formData.title,
      description: formData.description || null,
      program_id: formData.program_id || null,
      duration_hours: formData.duration_hours ? parseInt(formData.duration_hours) : null,
      is_published: formData.is_published,
    };

    try {
      if (editingCourse) {
        // Update existing course via API
        const res = await apiPatch<any>(`/api/admin/courses/${editingCourse.id}`, courseData);
        if (res.error) throw new Error(res.error);
        setCourses(courses.map(c => c.id === editingCourse.id ? res.data : c));
      } else {
        // Create new course via API
        const res = await apiPost<any>('/api/admin/courses', courseData);
        if (res.error) throw new Error(res.error);
        setCourses([res.data, ...courses]);
      }

      setShowCreateModal(false);
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Failed to save course');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course? This will also delete all lessons and quizzes.')) return;

    setLoading(true);
    try {
      const { error: deleteError } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);

      if (deleteError) throw deleteError;
      setCourses(courses.filter(c => c.id !== courseId));
    } catch (err: any) {
      setError(err.message || 'Failed to delete course');
    } finally {
      setLoading(false);
    }
  };

  const togglePublish = async (course: Course) => {
    try {
      const { error: updateError } = await supabase
        .from('courses')
        .update({ is_published: !course.is_published })
        .eq('id', course.id);

      if (updateError) throw updateError;
      setCourses(courses.map(c => c.id === course.id ? { ...c, is_published: !c.is_published } : c));
    } catch (err: any) {
      setError(err.message || 'Failed to update course');
    }
  };

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const publishedCount = courses.filter(c => c.is_published).length;
  const draftCount = courses.filter(c => !c.is_published).length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Course Builder</h1>
          <p className="text-gray-600 mt-2">Create and manage courses for your programs</p>
        </div>
        <button onClick={openCreateModal} className="px-6 py-3 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 font-medium flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          New Course
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
          <button onClick={() => setError(null)} className="ml-4 text-red-500 hover:text-red-700">Dismiss</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Courses</h3>
          <p className="text-3xl font-bold text-brand-blue-600">{courses.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Published</h3>
          <p className="text-3xl font-bold text-green-600">{publishedCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Drafts</h3>
          <p className="text-3xl font-bold text-orange-600">{draftCount}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <button onClick={openCreateModal} className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md text-center">
          <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <svg className="w-5 h-5 text-brand-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          </div>
          <p className="font-medium text-gray-900">Create Course</p>
        </button>
        <Link href="/admin/course-builder/templates" className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md text-center">
          <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <svg className="w-5 h-5 text-brand-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>
          </div>
          <p className="font-medium text-gray-900">Templates</p>
        </Link>
        <Link href="/admin/course-builder/media" className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md text-center">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
          </div>
          <p className="font-medium text-gray-900">Media Library</p>
        </Link>
        <Link href="/admin/course-builder/assessments" className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md text-center">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
          </div>
          <p className="font-medium text-gray-900">Assessments</p>
        </Link>
      </div>

      {/* Courses List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">All Courses</h2>
          <input
            type="text"
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border rounded-lg w-64"
          />
        </div>
        {filteredCourses.length > 0 ? (
          <div className="divide-y">
            {filteredCourses.map((course) => (
              <div key={course.id} className="px-6 py-4 hover:bg-gray-50 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-gray-900">{course.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${course.is_published ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                      {course.is_published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{course.description?.substring(0, 100) || 'No description'}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                    {course.programs?.title && <span>Program: {course.programs.title}</span>}
                    {course.duration_hours && <span>{course.duration_hours} hours</span>}
                    <span>Created: {new Date(course.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => togglePublish(course)} className={`px-3 py-1.5 text-sm rounded-lg ${course.is_published ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
                    {course.is_published ? 'Unpublish' : 'Publish'}
                  </button>
                  <button onClick={() => openEditModal(course)} className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50">Edit</button>
                  <Link href={`/admin/courses/${course.id}/content`} className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50">Lessons</Link>
                  <Link href={`/admin/courses/${course.id}/quizzes`} className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50">Quizzes</Link>
                  <button onClick={() => handleDelete(course.id)} className="px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50">Delete</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-500 mb-4">{searchTerm ? 'No courses match your search' : 'No courses found'}</p>
            <button onClick={openCreateModal} className="text-brand-blue-600 hover:underline">Create your first course</button>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold">{editingCourse ? 'Edit Course' : 'Create New Course'}</h2>
              <button onClick={() => { setShowCreateModal(false); resetForm(); }} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                  placeholder="e.g., Introduction to Barbering"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                  placeholder="Course description..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
                <select
                  value={formData.program_id}
                  onChange={(e) => setFormData({ ...formData, program_id: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                >
                  <option value="">Select a program (optional)</option>
                  {programs.map((program) => (
                    <option key={program.id} value={program.id}>{program.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (hours)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.duration_hours}
                  onChange={(e) => setFormData({ ...formData, duration_hours: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                  placeholder="e.g., 40"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_published"
                  checked={formData.is_published}
                  onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                <label htmlFor="is_published" className="text-sm text-gray-700">Publish immediately</label>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); resetForm(); }}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : (editingCourse ? 'Update Course' : 'Create Course')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
