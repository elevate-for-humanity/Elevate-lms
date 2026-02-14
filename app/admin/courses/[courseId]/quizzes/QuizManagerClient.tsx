'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface Quiz {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  time_limit_minutes: number | null;
  passing_score: number;
  max_attempts: number;
  created_at: string;
}

interface Course {
  id: string;
  title: string;
}

interface Props {
  course: Course | null;
  initialQuizzes: Quiz[];
  courseId: string;
}

export default function QuizManagerClient({ course, initialQuizzes, courseId }: Props) {
  const [quizzes, setQuizzes] = useState<Quiz[]>(initialQuizzes);
  const [showModal, setShowModal] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    time_limit_minutes: '',
    passing_score: '70',
    max_attempts: '3',
  });

  const supabase = createClient();

  const resetForm = () => {
    setFormData({ title: '', description: '', time_limit_minutes: '', passing_score: '70', max_attempts: '3' });
    setEditingQuiz(null);
    setError(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (quiz: Quiz) => {
    setFormData({
      title: quiz.title,
      description: quiz.description || '',
      time_limit_minutes: quiz.time_limit_minutes?.toString() || '',
      passing_score: quiz.passing_score.toString(),
      max_attempts: quiz.max_attempts.toString(),
    });
    setEditingQuiz(quiz);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const quizData = {
      course_id: courseId,
      title: formData.title,
      description: formData.description || null,
      time_limit_minutes: formData.time_limit_minutes ? parseInt(formData.time_limit_minutes) : null,
      passing_score: parseInt(formData.passing_score) || 70,
      max_attempts: parseInt(formData.max_attempts) || 3,
    };

    try {
      if (editingQuiz) {
        const { data, error: updateError } = await supabase
          .from('quizzes')
          .update(quizData)
          .eq('id', editingQuiz.id)
          .select()
          .single();

        if (updateError) throw updateError;
        setQuizzes(quizzes.map(q => q.id === editingQuiz.id ? data : q));
      } else {
        const { data, error: insertError } = await supabase
          .from('quizzes')
          .insert(quizData)
          .select()
          .single();

        if (insertError) throw insertError;
        setQuizzes([data, ...quizzes]);
      }

      setShowModal(false);
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Failed to save quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (quizId: string) => {
    if (!confirm('Are you sure you want to delete this quiz? All questions will be deleted.')) return;

    setLoading(true);
    try {
      const { error: deleteError } = await supabase.from('quizzes').delete().eq('id', quizId);
      if (deleteError) throw deleteError;
      setQuizzes(quizzes.filter(q => q.id !== quizId));
    } catch (err: any) {
      setError(err.message || 'Failed to delete quiz');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Course Quizzes</h1>
          <p className="text-gray-600 mt-2">Manage assessments for {course?.title || 'this course'}</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/course-builder" className="px-4 py-2 border rounded-lg hover:bg-gray-50">Back to Courses</Link>
          <button onClick={openCreateModal} className="bg-brand-blue-600 text-white px-4 py-2 rounded-lg hover:bg-brand-blue-700 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Create Quiz
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
          <button onClick={() => setError(null)} className="ml-4 text-red-500 hover:text-red-700">Dismiss</button>
        </div>
      )}

      {/* Quizzes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizzes.length > 0 ? (
          quizzes.map((quiz) => (
            <div key={quiz.id} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-brand-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <button onClick={() => handleDelete(quiz.id)} className="text-red-500 hover:text-red-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{quiz.title}</h3>
              <p className="text-sm text-gray-500 mb-4 line-clamp-2">{quiz.description || 'No description'}</p>
              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <span>{quiz.passing_score}% to pass</span>
                <span>{quiz.max_attempts} attempts</span>
              </div>
              {quiz.time_limit_minutes && (
                <p className="text-sm text-gray-500 mb-4">{quiz.time_limit_minutes} min time limit</p>
              )}
              <div className="flex gap-2">
                <Link 
                  href={`/admin/courses/${courseId}/quizzes/${quiz.id}/questions`}
                  className="flex-1 text-center bg-brand-blue-50 text-brand-blue-600 px-3 py-2 rounded-lg text-sm hover:bg-brand-blue-100"
                >
                  Edit Questions
                </Link>
                <button onClick={() => openEditModal(quiz)} className="px-3 py-2 border rounded-lg text-sm hover:bg-gray-50">
                  Settings
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full bg-white rounded-lg shadow-sm border p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-gray-500 mb-4">No quizzes created yet</p>
            <button onClick={openCreateModal} className="bg-brand-blue-600 text-white px-4 py-2 rounded-lg hover:bg-brand-blue-700">
              Create First Quiz
            </button>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold">{editingQuiz ? 'Edit Quiz' : 'Create New Quiz'}</h2>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quiz Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                  placeholder="e.g., Module 1 Assessment"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                  placeholder="Quiz description..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time Limit (minutes)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.time_limit_minutes}
                    onChange={(e) => setFormData({ ...formData, time_limit_minutes: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                    placeholder="No limit"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Passing Score (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.passing_score}
                    onChange={(e) => setFormData({ ...formData, passing_score: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Attempts</label>
                <input
                  type="number"
                  min="1"
                  value={formData.max_attempts}
                  onChange={(e) => setFormData({ ...formData, max_attempts: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 disabled:opacity-50">
                  {loading ? 'Saving...' : (editingQuiz ? 'Update Quiz' : 'Create Quiz')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
