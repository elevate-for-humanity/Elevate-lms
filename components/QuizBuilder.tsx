"use client";

import React from 'react';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';

interface Question {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer' | 'essay';
  question: string;
  options?: string[];
  correctAnswer?: string | number;
  points: number;
}

export function QuizBuilder() {
  const [quizTitle, setQuizTitle] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Partial<Question>>({
    type: 'multiple-choice',
    question: '',
    options: ['', '', '', ''],
    points: 1,
  });

  const addQuestion = () => {
    if (!currentQuestion.question) return;

    const newQuestion: Question = {
      id: Date.now().toString(),
      type: currentQuestion.type as Question['type'],
      question: currentQuestion.question,
      options: currentQuestion.options,
      correctAnswer: currentQuestion.correctAnswer,
      points: currentQuestion.points || 1,
    };

    setQuestions([...questions, newQuestion]);
    setCurrentQuestion({
      type: 'multiple-choice',
      question: '',
      options: ['', '', '', ''],
      points: 1,
    });
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...(currentQuestion.options || [])];
    newOptions[index] = value;
    setCurrentQuestion({ ...currentQuestion, options: newOptions });
  };

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
  const [saving, setSaving] = useState(false);

  const saveQuiz = async () => {
    if (!quizTitle.trim() || questions.length === 0) return;
    
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      const { data: quiz, error } = await supabase
        .from('quizzes')
        .insert({
          title: quizTitle,
          created_by: user?.id,
          total_points: totalPoints,
          question_count: questions.length,
          status: 'draft',
        })
        .select('id')
        .single();

      if (error) throw error;

      // Save questions
      if (quiz) {
        const questionRecords = questions.map((q, index) => ({
          quiz_id: quiz.id,
          question_type: q.type,
          question_text: q.question,
          options: q.options,
          correct_answer: q.correctAnswer,
          points: q.points,
          order_index: index,
        }));

        await supabase.from('quiz_questions').insert(questionRecords);
      }

      alert('Quiz saved successfully!');
    } catch (err) {
      console.error('Error saving quiz:', err);
      alert('Failed to save quiz');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="   text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2 text-2xl md:text-3xl lg:text-4xl">Quiz Builder</h1>
          <p className="text-red-100">Create interactive assessments for your courses</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quiz Builder */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Quiz Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Quiz Title</label>
                  <input
                    type="text"
                    value={quizTitle}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setQuizTitle(e.target.value)}
                    placeholder="e.g., JavaScript Fundamentals Quiz"
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Add Question</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Question Type</label>
                  <select
                    value={currentQuestion.type}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setCurrentQuestion({ ...currentQuestion, type: e.target.value as Question['type'] })}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="multiple-choice">Multiple Choice</option>
                    <option value="true-false">True/False</option>
                    <option value="short-answer">Short Answer</option>
                    <option value="essay">Essay</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Question</label>
                  <textarea
                    value={currentQuestion.question}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setCurrentQuestion({ ...currentQuestion, question: e.target.value })}
                    placeholder="Enter your question..."
                    className="w-full px-4 py-2 border rounded-lg h-24"
                  />
                </div>

                {currentQuestion.type === 'multiple-choice' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Answer Options</label>
                    <div className="space-y-2">
                      {currentQuestion.options?.map((option, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="radio"
                            name="correct-answer"
                            checked={currentQuestion.correctAnswer === index}
                            onChange={() => setCurrentQuestion({ ...currentQuestion, correctAnswer: index })}
                          />
                          <input
                            type="text"
                            value={option}
                            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => updateOption(index, e.target.value)}
                            placeholder={`Option ${index + 1}`}
                            className="flex-1 px-4 py-2 border rounded-lg"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {currentQuestion.type === 'true-false' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Correct Answer</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="tf-answer"
                          checked={currentQuestion.correctAnswer === 'true'}
                          onChange={() => setCurrentQuestion({ ...currentQuestion, correctAnswer: 'true' })}
                        />
                        <span>True</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="tf-answer"
                          checked={currentQuestion.correctAnswer === 'false'}
                          onChange={() => setCurrentQuestion({ ...currentQuestion, correctAnswer: 'false' })}
                        />
                        <span>False</span>
                      </label>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">Points</label>
                  <input
                    type="number"
                    value={currentQuestion.points}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setCurrentQuestion({ ...currentQuestion, points: parseInt(e.target.value) || 1 })}
                    min="1"
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>

                <Button onClick={addQuestion} className="w-full">
                  Add Question
                </Button>
              </div>
            </Card>

            {/* Questions List */}
            {questions.length > 0 && (
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4">Questions ({questions.length})</h2>
                <div className="space-y-4">
                  {questions.map((q, index) => (
                    <div key={q.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-bold">Q{index + 1}.</span>
                            <span className="px-2 py-0.5 bg-brand-blue-100 text-brand-blue-700 text-xs rounded">
                              {q.type.replace('-', ' ')}
                            </span>
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                              {q.points} {q.points === 1 ? 'point' : 'points'}
                            </span>
                          </div>
                          <p className="text-black mb-2">{q.question}</p>
                          {q.options && (
                            <ul className="space-y-1 text-sm">
                              {q.options.map((opt, i) => (
                                <li key={i} className={`${q.correctAnswer === i ? 'text-green-600 font-semibold' : 'text-black'}`}>
                                  {q.correctAnswer === i && '• '}{opt}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <button
                          onClick={() => removeQuestion(q.id)}
                          className="text-brand-orange-600 hover:text-red-700"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="font-bold mb-4">Quiz Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-black">Total Questions:</span>
                  <span className="font-semibold">{questions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black">Total Points:</span>
                  <span className="font-semibold">{totalPoints}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black">Multiple Choice:</span>
                  <span className="font-semibold">
                    {questions.filter(q => q.type === 'multiple-choice').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black">True/False:</span>
                  <span className="font-semibold">
                    {questions.filter(q => q.type === 'true-false').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black">Short Answer:</span>
                  <span className="font-semibold">
                    {questions.filter(q => q.type === 'short-answer').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black">Essay:</span>
                  <span className="font-semibold">
                    {questions.filter(q => q.type === 'essay').length}
                  </span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-bold mb-4">Actions</h3>
              <div className="space-y-2">
                <Button className="w-full" disabled={questions.length === 0 || saving} onClick={saveQuiz}>
                  {saving ? 'Saving...' : 'Save Quiz'}
                </Button>
                <Button variant="secondary" className="w-full">
                  Preview
                </Button>
                <Button variant="secondary" className="w-full">
                  Import Questions
                </Button>
              </div>
            </Card>

            <Card className="p-6   ">
              <h3 className="font-bold mb-2">💡 Tips</h3>
              <ul className="text-sm text-black space-y-2">
                <li>• Use clear, concise language</li>
                <li>• Avoid trick questions</li>
                <li>• Mix question types</li>
                <li>• Test your quiz before publishing</li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
