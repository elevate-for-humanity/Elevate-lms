"use client";

import React from 'react';

import { useState } from 'react';
import {
  Plus,
  Trash2,
  GripVertical,
  Save,
  Eye,
  Copy,
  Circle,
  Square,
  Type,
  Image as ImageIcon,
  Code,
CheckCircle, } from 'lucide-react';

type QuestionType =
  | 'multiple_choice'
  | 'true_false'
  | 'short_answer'
  | 'essay'
  | 'matching'
  | 'fill_blank'
  | 'code';

interface Question {
  id: string;
  type: QuestionType;
  question: string;
  points: number;
  options?: string[];
  correctAnswer?: any;
  explanation?: string;
  imageUrl?: string;
  codeLanguage?: string;
  matchingPairs?: { left: string; right: string }[];
}

interface Quiz {
  id?: string;
  title: string;
  description: string;
  timeLimit?: number; // minutes
  passingScore: number; // percentage
  shuffleQuestions: boolean;
  shuffleAnswers: boolean;
  showCorrectAnswers: boolean;
  allowRetakes: boolean;
  maxAttempts?: number;
  questions: Question[];
}

export default function AdvancedQuizBuilder() {
  const [quiz, setQuiz] = useState<Quiz>({
    title: 'New Quiz',
    description: '',
    passingScore: 70,
    shuffleQuestions: false,
    shuffleAnswers: false,
    showCorrectAnswers: true,
    allowRetakes: true,
    questions: [],
  });

  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  const questionTypes: {
    type: QuestionType;
    label: string;
    icon: React.ComponentType<any> | React.ReactElement;
  }[] = [
    { type: 'multiple_choice', label: 'Multiple Choice', icon: CheckCircle },
    { type: 'true_false', label: 'True/False', icon: Circle },
    { type: 'short_answer', label: 'Short Answer', icon: Type },
    { type: 'essay', label: 'Essay', icon: Type },
    { type: 'matching', label: 'Matching', icon: Square },
    { type: 'fill_blank', label: 'Fill in the Blank', icon: Type },
    { type: 'code', label: 'Code Question', icon: Code },
  ];

  const addQuestion = (type: QuestionType) => {
    const newQuestion: Question = {
      id: `q-${Date.now()}`,
      type,
      question: '',
      points: 1,
      ...(type === 'multiple_choice' && {
        options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
        correctAnswer: 0,
      }),
      ...(type === 'true_false' && { correctAnswer: true }),
      ...(type === 'matching' && { matchingPairs: [{ left: '', right: '' }] }),
      ...(type === 'code' && { codeLanguage: 'javascript' }),
    };

    setQuiz({ ...quiz, questions: [...quiz.questions, newQuestion] });
    setSelectedQuestion(newQuestion.id);
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuiz({
      ...quiz,
      questions: quiz.questions.map((q) =>
        q.id === id ? { ...q, ...updates } : q
      ),
    });
  };

  const deleteQuestion = (id: string) => {
    if (confirm('Delete this question?')) {
      setQuiz({
        ...quiz,
        questions: quiz.questions.filter((q) => q.id !== id),
      });
      if (selectedQuestion === id) setSelectedQuestion(null);
    }
  };

  const duplicateQuestion = (id: string) => {
    const question = quiz.questions.find((q) => q.id === id);
    if (question) {
      const newQuestion = { ...question, id: `q-${Date.now()}` };
      setQuiz({ ...quiz, questions: [...quiz.questions, newQuestion] });
    }
  };

  const saveQuiz = async () => {
    try {
      const response = await fetch('/api/quizzes/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quiz),
      });

      if (response.ok) {
        alert('Quiz saved successfully!');
      }
    } catch (error) { /* Error handled silently */ 
      // Error: $1
      alert('Failed to save quiz');
    }
  };

  const totalPoints = quiz.questions.reduce((sum, q) => sum + q.points, 0);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <input
              type="text"
              value={quiz.title}
              onChange={(
                e: React.ChangeEvent<
                  HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
                >
              ) => setQuiz({ ...quiz, title: e.target.value })}
              className="text-2xl font-bold border-none focus:outline-none w-full"
              placeholder="Quiz Title"
            />
            <input
              type="text"
              value={quiz.description}
              onChange={(e) =>
                setQuiz({ ...quiz, description: e.target.value })
              }
              className="text-sm text-black border-none focus:outline-none w-full mt-1"
              placeholder="Quiz description..."
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              <Eye className="w-4 h-4" />
              {previewMode ? 'Edit' : 'Preview'}
            </button>
            <button
              onClick={saveQuiz}
              className="flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700"
            >
              <Save className="w-4 h-4" />
              Save Quiz
            </button>
          </div>
        </div>

        {/* Quiz Settings */}
        <div className="mt-4 flex gap-6 text-sm">
          <div className="flex items-center gap-2">
            <label className="text-black">Time Limit:</label>
            <input
              type="number"
              value={quiz.timeLimit || ''}
              onChange={(e) =>
                setQuiz({
                  ...quiz,
                  timeLimit: parseInt(e.target.value) || undefined,
                })
              }
              className="w-20 px-2 py-2 border rounded"
              placeholder="None"
            />
            <span className="text-black">minutes</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-black">Passing Score:</label>
            <input
              type="number"
              value={quiz.passingScore}
              onChange={(e) =>
                setQuiz({ ...quiz, passingScore: parseInt(e.target.value) })
              }
              className="w-20 px-2 py-2 border rounded"
              min="0"
              max="100"
            />
            <span className="text-black">%</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-black">Total Points:</label>
            <span className="font-semibold">{totalPoints}</span>
          </div>
        </div>

        <div className="mt-3 flex gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={quiz.shuffleQuestions}
              onChange={(e) =>
                setQuiz({ ...quiz, shuffleQuestions: e.target.checked })
              }
              className="rounded"
            />
            Shuffle Questions
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={quiz.shuffleAnswers}
              onChange={(e) =>
                setQuiz({ ...quiz, shuffleAnswers: e.target.checked })
              }
              className="rounded"
            />
            Shuffle Answers
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={quiz.showCorrectAnswers}
              onChange={(e) =>
                setQuiz({ ...quiz, showCorrectAnswers: e.target.checked })
              }
              className="rounded"
            />
            Show Correct Answers
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={quiz.allowRetakes}
              onChange={(e) =>
                setQuiz({ ...quiz, allowRetakes: e.target.checked })
              }
              className="rounded"
            />
            Allow Retakes
          </label>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Question List Sidebar */}
        <div className="w-80 bg-white border-r overflow-y-auto">
          <div className="p-4">
            <h3 className="font-semibold mb-3">Add Question Type</h3>
            <div className="grid grid-cols-2 gap-2">
              {questionTypes.map(({ type, label, icon: Icon }) => (
                <button
                  key={type}
                  onClick={() => addQuestion(type)}
                  className="flex flex-col items-center gap-2 p-3 border rounded-lg hover:bg-gray-50 hover:border-brand-blue-500 text-sm"
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-center">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t p-4">
            <h3 className="font-semibold mb-3">
              Questions ({quiz.questions.length})
            </h3>
            <div className="space-y-2">
              {quiz.questions.map((question, index) => (
                <div
                  key={question.id}
                  className={`p-3 border rounded-lg cursor-pointer ${
                    selectedQuestion === question.id
                      ? 'border-brand-blue-500 bg-brand-blue-50'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedQuestion(question.id)}
                >
                  <div className="flex items-start gap-2">
                    <GripVertical className="w-4 h-4 text-gray-400 mt-1" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-gray-500">
                          Q{index + 1}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-gray-100 rounded">
                          {question.type.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-gray-500">
                          {question.points}pts
                        </span>
                      </div>
                      <p className="text-sm truncate">
                        {question.question || 'Untitled question'}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={(e: React.MouseEvent<HTMLElement>) => {
                          e.stopPropagation();
                          duplicateQuestion(question.id);
                        }}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e: React.MouseEvent<HTMLElement>) => {
                          e.stopPropagation();
                          deleteQuestion(question.id);
                        }}
                        className="p-1 hover:bg-brand-red-100 rounded text-brand-orange-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Question Editor */}
        <div className="flex-1 overflow-y-auto p-8">
          {selectedQuestion ? (
            <QuestionEditor
              question={quiz.questions.find((q) => q.id === selectedQuestion)!}
              onUpdate={(updates) => updateQuestion(selectedQuestion, updates)}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <span className="text-slate-400 flex-shrink-0">•</span>
                <p className="text-lg">Select a question to edit</p>
                <p className="text-sm">or add a new question to get started</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Question Editor Component
function QuestionEditor({
  question,
  onUpdate,
}: {
  question: Question;
  onUpdate: (updates: Partial<Question>) => void;
}) {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg border p-6 space-y-6">
        {/* Question Text */}
        <div>
          <label className="block text-sm font-medium mb-2">Question</label>
          <textarea
            value={question.question}
            onChange={(
              e: React.ChangeEvent<
                HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
              >
            ) => onUpdate({ question: e.target.value })}
            className="w-full p-3 border rounded-lg resize-none"
            rows={3}
            placeholder="Enter your question here..."
          />
        </div>

        {/* Points */}
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">Points</label>
            <input
              type="number"
              value={question.points}
              onChange={(e) =>
                onUpdate({ points: parseInt(e.target.value) || 1 })
              }
              className="w-full p-2 border rounded"
              min="1"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">
              Image URL (optional)
            </label>
            <input
              type="text"
              value={question.imageUrl || ''}
              onChange={(
                e: React.ChangeEvent<
                  HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
                >
              ) => onUpdate({ imageUrl: e.target.value })}
              className="w-full p-2 border rounded"
              placeholder="https://..."
            />
          </div>
        </div>

        {/* Question Type Specific Fields */}
        {question.type === 'multiple_choice' && (
          <div>
            <label className="block text-sm font-medium mb-2">
              Answer Options
            </label>
            <div className="space-y-2">
              {question.options?.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="radio"
                    checked={question.correctAnswer === index}
                    onChange={() => onUpdate({ correctAnswer: index })}
                    className="mt-3"
                  />
                  <input
                    type="text"
                    value={option}
                    onChange={(
                      e: React.ChangeEvent<
                        | HTMLInputElement
                        | HTMLSelectElement
                        | HTMLTextAreaElement
                      >
                    ) => {
                      const newOptions = [...(question.options || [])];
                      newOptions[index] = e.target.value;
                      onUpdate({ options: newOptions });
                    }}
                    className="flex-1 p-2 border rounded"
                    placeholder={`Option ${index + 1}`}
                  />
                  <button
                    onClick={() => {
                      const newOptions = question.options?.filter(
                        (_, i) => i !== index
                      );
                      onUpdate({ options: newOptions });
                    }}
                    className="p-2 text-brand-orange-600 hover:bg-brand-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() =>
                onUpdate({
                  options: [
                    ...(question.options || []),
                    `Option ${(question.options?.length || 0) + 1}`,
                  ],
                })
              }
              className="mt-2 flex items-center gap-2 px-3 py-2 text-sm border rounded hover:bg-gray-50"
            >
              <Plus className="w-4 h-4" />
              Add Option
            </button>
          </div>
        )}

        {question.type === 'true_false' && (
          <div>
            <label className="block text-sm font-medium mb-2">
              Correct Answer
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={question.correctAnswer === true}
                  onChange={() => onUpdate({ correctAnswer: true })}
                />
                True
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={question.correctAnswer === false}
                  onChange={() => onUpdate({ correctAnswer: false })}
                />
                False
              </label>
            </div>
          </div>
        )}

        {question.type === 'short_answer' && (
          <div>
            <label className="block text-sm font-medium mb-2">
              Correct Answer(s)
            </label>
            <input
              type="text"
              value={question.correctAnswer || ''}
              onChange={(
                e: React.ChangeEvent<
                  HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
                >
              ) => onUpdate({ correctAnswer: e.target.value })}
              className="w-full p-2 border rounded"
              placeholder="Enter correct answer (case-insensitive)"
            />
            <p className="text-xs text-gray-500 mt-1">
              Separate multiple acceptable answers with commas
            </p>
          </div>
        )}

        {question.type === 'matching' && (
          <div>
            <label className="block text-sm font-medium mb-2">
              Matching Pairs
            </label>
            <div className="space-y-2">
              {question.matchingPairs?.map((pair, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={pair.left}
                    onChange={(
                      e: React.ChangeEvent<
                        | HTMLInputElement
                        | HTMLSelectElement
                        | HTMLTextAreaElement
                      >
                    ) => {
                      const newPairs = [...(question.matchingPairs || [])];
                      newPairs[index].left = e.target.value;
                      onUpdate({ matchingPairs: newPairs });
                    }}
                    className="flex-1 p-2 border rounded"
                    placeholder="Left side"
                  />
                  <span className="flex items-center">↔</span>
                  <input
                    type="text"
                    value={pair.right}
                    onChange={(
                      e: React.ChangeEvent<
                        | HTMLInputElement
                        | HTMLSelectElement
                        | HTMLTextAreaElement
                      >
                    ) => {
                      const newPairs = [...(question.matchingPairs || [])];
                      newPairs[index].right = e.target.value;
                      onUpdate({ matchingPairs: newPairs });
                    }}
                    className="flex-1 p-2 border rounded"
                    placeholder="Right side"
                  />
                  <button
                    onClick={() => {
                      const newPairs = question.matchingPairs?.filter(
                        (_, i) => i !== index
                      );
                      onUpdate({ matchingPairs: newPairs });
                    }}
                    className="p-2 text-brand-orange-600 hover:bg-brand-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() =>
                onUpdate({
                  matchingPairs: [
                    ...(question.matchingPairs || []),
                    { left: '', right: '' },
                  ],
                })
              }
              className="mt-2 flex items-center gap-2 px-3 py-2 text-sm border rounded hover:bg-gray-50"
            >
              <Plus className="w-4 h-4" />
              Add Pair
            </button>
          </div>
        )}

        {question.type === 'code' && (
          <div>
            <label className="block text-sm font-medium mb-2">
              Programming Language
            </label>
            <select
              value={question.codeLanguage}
              onChange={(
                e: React.ChangeEvent<
                  HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
                >
              ) => onUpdate({ codeLanguage: e.target.value })}
              className="w-full p-2 border rounded mb-3"
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
              <option value="csharp">C#</option>
            </select>
            <label className="block text-sm font-medium mb-2">
              Expected Output/Solution
            </label>
            <textarea
              value={question.correctAnswer || ''}
              onChange={(
                e: React.ChangeEvent<
                  HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
                >
              ) => onUpdate({ correctAnswer: e.target.value })}
              className="w-full p-3 border rounded font-mono text-sm resize-none"
              rows={6}
              placeholder="Enter expected code output or solution..."
            />
          </div>
        )}

        {/* Explanation */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Explanation (shown after answer)
          </label>
          <textarea
            value={question.explanation || ''}
            onChange={(
              e: React.ChangeEvent<
                HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
              >
            ) => onUpdate({ explanation: e.target.value })}
            className="w-full p-3 border rounded resize-none"
            rows={3}
            placeholder="Explain why this is the correct answer..."
          />
        </div>
      </div>
    </div>
  );
}
