'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface Question {
  id: string;
  quiz_id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'short_answer';
  options: string | null;
  correct_answer: string;
  order_index: number;
  points: number;
}

interface Quiz {
  id: string;
  title: string;
  passing_score: number;
  time_limit_minutes: number | null;
}

interface Props {
  quiz: Quiz | null;
  initialQuestions: Question[];
  quizId: string;
  courseId: string;
}

export default function QuestionManagerClient({ quiz, initialQuestions, quizId, courseId }: Props) {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    question_text: '',
    question_type: 'multiple_choice' as 'multiple_choice' | 'true_false' | 'short_answer',
    options: ['', '', '', ''],
    correct_answer: '',
    points: '1',
  });

  const supabase = createClient();

  const resetForm = () => {
    setFormData({
      question_text: '',
      question_type: 'multiple_choice',
      options: ['', '', '', ''],
      correct_answer: '',
      points: '1',
    });
    setEditingQuestion(null);
    setError(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (question: Question) => {
    let options = ['', '', '', ''];
    try {
      if (question.options) {
        const parsed = typeof question.options === 'string' ? JSON.parse(question.options) : question.options;
        options = Array.isArray(parsed) ? parsed : ['', '', '', ''];
      }
    } catch { /* ignore */ }

    setFormData({
      question_text: question.question_text,
      question_type: question.question_type,
      options: question.question_type === 'true_false' ? ['True', 'False'] : options,
      correct_answer: question.correct_answer,
      points: question.points?.toString() || '1',
    });
    setEditingQuestion(question);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const filteredOptions = formData.question_type === 'true_false' 
      ? ['True', 'False']
      : formData.question_type === 'multiple_choice'
        ? formData.options.filter(o => o.trim())
        : null;

    const questionData = {
      quiz_id: quizId,
      question_text: formData.question_text,
      question_type: formData.question_type,
      options: filteredOptions ? JSON.stringify(filteredOptions) : null,
      correct_answer: formData.correct_answer,
      points: parseInt(formData.points) || 1,
      order_index: editingQuestion ? editingQuestion.order_index : questions.length,
    };

    try {
      if (editingQuestion) {
        const { data, error: updateError } = await supabase
          .from('quiz_questions')
          .update(questionData)
          .eq('id', editingQuestion.id)
          .select()
          .single();

        if (updateError) throw updateError;
        setQuestions(questions.map(q => q.id === editingQuestion.id ? data : q));
      } else {
        const { data, error: insertError } = await supabase
          .from('quiz_questions')
          .insert(questionData)
          .select()
          .single();

        if (insertError) throw insertError;
        setQuestions([...questions, data]);
      }

      setShowModal(false);
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Failed to save question');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    setLoading(true);
    try {
      const { error: deleteError } = await supabase.from('quiz_questions').delete().eq('id', questionId);
      if (deleteError) throw deleteError;
      setQuestions(questions.filter(q => q.id !== questionId));
    } catch (err: any) {
      setError(err.message || 'Failed to delete question');
    } finally {
      setLoading(false);
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  const parseOptions = (options: string | null): string[] => {
    if (!options) return [];
    try {
      const parsed = typeof options === 'string' ? JSON.parse(options) : options;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{quiz?.title || 'Quiz Questions'}</h1>
          <p className="text-gray-600 mt-2">Manage questions and answers for this quiz</p>
        </div>
        <div className="flex gap-3">
          <Link href={`/admin/courses/${courseId}/quizzes`} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Back to Quizzes</Link>
          <button onClick={openCreateModal} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add Question
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

      {/* Quiz Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{questions.length}</p>
          <p className="text-sm text-gray-500">Questions</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{quiz?.passing_score || 70}%</p>
          <p className="text-sm text-gray-500">Passing Score</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{quiz?.time_limit_minutes || 'No'}</p>
          <p className="text-sm text-gray-500">Time Limit (min)</p>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {questions.length > 0 ? (
          questions.map((question, index) => (
            <div key={question.id} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-sm">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">{question.question_text}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {question.question_type === 'multiple_choice' ? 'Multiple Choice' : 
                       question.question_type === 'true_false' ? 'True/False' : 'Short Answer'}
                      {question.points && ` • ${question.points} point${question.points > 1 ? 's' : ''}`}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEditModal(question)} className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
                  <button onClick={() => handleDelete(question.id)} className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                </div>
              </div>
              
              {question.options && (
                <div className="ml-11 space-y-2">
                  {parseOptions(question.options).map((option: string, optIndex: number) => (
                    <div 
                      key={optIndex} 
                      className={`p-2 rounded border text-sm ${
                        option === question.correct_answer 
                          ? 'bg-green-50 border-green-200 text-green-800' 
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      {option}
                      {option === question.correct_answer && (
                        <span className="ml-2 text-green-600">✓ Correct</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {question.question_type === 'short_answer' && (
                <div className="ml-11 p-2 rounded border text-sm bg-green-50 border-green-200 text-green-800">
                  Answer: {question.correct_answer}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-500 mb-4">No questions added yet</p>
            <button onClick={openCreateModal} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              Add First Question
            </button>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold">{editingQuestion ? 'Edit Question' : 'Add New Question'}</h2>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Question Type</label>
                <select
                  value={formData.question_type}
                  onChange={(e) => {
                    const type = e.target.value as 'multiple_choice' | 'true_false' | 'short_answer';
                    setFormData({ 
                      ...formData, 
                      question_type: type,
                      options: type === 'true_false' ? ['True', 'False'] : ['', '', '', ''],
                      correct_answer: ''
                    });
                  }}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="multiple_choice">Multiple Choice</option>
                  <option value="true_false">True/False</option>
                  <option value="short_answer">Short Answer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Question *</label>
                <textarea
                  required
                  rows={3}
                  value={formData.question_text}
                  onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your question..."
                />
              </div>

              {formData.question_type === 'multiple_choice' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Answer Options</label>
                  <div className="space-y-2">
                    {formData.options.map((option, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="correct_answer"
                          checked={formData.correct_answer === option && option !== ''}
                          onChange={() => setFormData({ ...formData, correct_answer: option })}
                          className="w-4 h-4"
                        />
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => updateOption(index, e.target.value)}
                          className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={`Option ${index + 1}`}
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Select the radio button next to the correct answer</p>
                </div>
              )}

              {formData.question_type === 'true_false' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Correct Answer</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="tf_answer"
                        checked={formData.correct_answer === 'True'}
                        onChange={() => setFormData({ ...formData, correct_answer: 'True' })}
                        className="w-4 h-4"
                      />
                      True
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="tf_answer"
                        checked={formData.correct_answer === 'False'}
                        onChange={() => setFormData({ ...formData, correct_answer: 'False' })}
                        className="w-4 h-4"
                      />
                      False
                    </label>
                  </div>
                </div>
              )}

              {formData.question_type === 'short_answer' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Correct Answer *</label>
                  <input
                    type="text"
                    required
                    value={formData.correct_answer}
                    onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter the correct answer"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Points</label>
                <input
                  type="number"
                  min="1"
                  value={formData.points}
                  onChange={(e) => setFormData({ ...formData, points: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {loading ? 'Saving...' : (editingQuestion ? 'Update Question' : 'Add Question')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
