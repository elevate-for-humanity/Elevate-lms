'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, ChevronLeft, ChevronRight, Flag, AlertTriangle } from 'lucide-react';

interface Answer {
  id: string;
  answer_text: string;
  is_correct: boolean;
  order_index: number;
}

interface Question {
  id: string;
  question_text: string;
  question_type: string;
  points: number;
  order_index: number;
  quiz_answers: Answer[];
}

interface Quiz {
  id: string;
  title: string;
  time_limit_minutes: number | null;
  passing_score: number | null;
  shuffle_questions: boolean;
  show_correct_answers: boolean;
}

interface Props {
  quiz: Quiz;
  questions: Question[];
  attemptId: string;
  visitorId: string;
}

export default function QuizTakingInterface({ quiz, questions, attemptId, visitorId }: Props) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [timeRemaining, setTimeRemaining] = useState<number | null>(
    quiz.time_limit_minutes ? quiz.time_limit_minutes * 60 : null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);

  // Shuffle questions if enabled
  const [shuffledQuestions] = useState(() => {
    if (quiz.shuffle_questions) {
      return [...questions].sort(() => Math.random() - 0.5);
    }
    return questions;
  });

  const currentQuestion = shuffledQuestions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / shuffledQuestions.length) * 100;

  // Timer
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (questionId: string, answerId: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answerId }));
  };

  const toggleFlag = (questionId: string) => {
    setFlagged(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/lms/quizzes/${quiz.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId,
          answers,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        router.push(`/lms/quizzes/${quiz.id}/results/${attemptId}`);
      } else {
        throw new Error('Failed to submit quiz');
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
      setIsSubmitting(false);
      alert('Failed to submit quiz. Please try again.');
    }
  }, [quiz.id, attemptId, answers, isSubmitting, router]);

  const unansweredCount = shuffledQuestions.length - answeredCount;

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900">{quiz.title}</h1>
              <p className="text-sm text-slate-600">
                Question {currentIndex + 1} of {shuffledQuestions.length}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {timeRemaining !== null && (
                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg ${
                  timeRemaining < 60 ? 'bg-brand-red-100 text-brand-red-700' : 
                  timeRemaining < 300 ? 'bg-yellow-100 text-yellow-700' : 
                  'bg-slate-100 text-slate-700'
                }`}>
                  <Clock className="w-5 h-5" />
                  {formatTime(timeRemaining)}
                </div>
              )}
              <button
                onClick={() => setShowConfirmSubmit(true)}
                className="bg-brand-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-brand-blue-700 transition"
              >
                Submit Quiz
              </button>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-brand-blue-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-slate-600 mt-1">
              {answeredCount} of {shuffledQuestions.length} answered
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Question Panel */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-slate-200 p-8">
              {/* Question Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <span className="bg-brand-blue-100 text-brand-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                    {currentQuestion.points} {currentQuestion.points === 1 ? 'point' : 'points'}
                  </span>
                  <span className="text-slate-500 text-sm capitalize">
                    {currentQuestion.question_type.replace('_', ' ')}
                  </span>
                </div>
                <button
                  onClick={() => toggleFlag(currentQuestion.id)}
                  className={`p-2 rounded-lg transition ${
                    flagged.has(currentQuestion.id)
                      ? 'bg-yellow-100 text-yellow-600'
                      : 'bg-slate-100 text-slate-400 hover:text-slate-600'
                  }`}
                  title={flagged.has(currentQuestion.id) ? 'Unflag question' : 'Flag for review'}
                >
                  <Flag className="w-5 h-5" />
                </button>
              </div>

              {/* Question Text */}
              <h2 className="text-xl font-semibold text-slate-900 mb-8">
                {currentQuestion.question_text}
              </h2>

              {/* Answer Options */}
              <div className="space-y-3">
                {currentQuestion.quiz_answers
                  .sort((a, b) => a.order_index - b.order_index)
                  .map((answer, idx) => {
                    const isSelected = answers[currentQuestion.id] === answer.id;
                    const letter = String.fromCharCode(65 + idx);
                    
                    return (
                      <button
                        key={answer.id}
                        onClick={() => handleAnswerSelect(currentQuestion.id, answer.id)}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition ${
                          isSelected
                            ? 'border-brand-blue-600 bg-brand-blue-50'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <span className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                          isSelected
                            ? 'bg-brand-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {letter}
                        </span>
                        <span className={`flex-1 ${isSelected ? 'text-brand-blue-900' : 'text-slate-700'}`}>
                          {answer.answer_text}
                        </span>
                      </button>
                    );
                  })}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200">
                <button
                  onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                  className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Previous
                </button>
                <button
                  onClick={() => setCurrentIndex(prev => Math.min(shuffledQuestions.length - 1, prev + 1))}
                  disabled={currentIndex === shuffledQuestions.length - 1}
                  className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Question Navigator */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sticky top-32">
              <h3 className="font-semibold text-slate-900 mb-4">Questions</h3>
              <div className="grid grid-cols-5 gap-2">
                {shuffledQuestions.map((q, idx) => {
                  const isAnswered = answers[q.id] !== undefined;
                  const isFlagged = flagged.has(q.id);
                  const isCurrent = idx === currentIndex;
                  
                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentIndex(idx)}
                      className={`relative w-10 h-10 rounded-lg font-semibold text-sm transition ${
                        isCurrent
                          ? 'bg-brand-blue-600 text-white'
                          : isAnswered
                          ? 'bg-brand-green-100 text-brand-green-700'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {idx + 1}
                      {isFlagged && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>
              
              <div className="mt-4 pt-4 border-t border-slate-200 space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 bg-brand-green-100 rounded" />
                  <span className="text-slate-600">Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 bg-slate-100 rounded" />
                  <span className="text-slate-600">Unanswered</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 bg-yellow-400 rounded-full" />
                  <span className="text-slate-600">Flagged</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Submit Modal */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Submit Quiz?</h3>
            </div>
            
            {unansweredCount > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-yellow-800">
                  You have <strong>{unansweredCount}</strong> unanswered question{unansweredCount !== 1 ? 's' : ''}.
                </p>
              </div>
            )}
            
            <p className="text-slate-600 mb-6">
              Once submitted, you cannot change your answers. Are you sure you want to submit?
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmSubmit(false)}
                className="flex-1 px-4 py-3 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Review Answers
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 bg-brand-blue-600 text-white rounded-lg font-semibold hover:bg-brand-blue-700 transition disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
