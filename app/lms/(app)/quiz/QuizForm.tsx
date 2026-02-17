'use client';

import { useState } from 'react';
import { submitQuiz } from './actions';
import { Loader2 } from 'lucide-react';

interface Question {
  id: string;
  text: string;
  options: { id: string; text: string }[];
}

interface QuizFormProps {
  quizId: string;
  quizTitle: string;
  questions: Question[];
}

export function QuizForm({ quizId, quizTitle, questions }: QuizFormProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; score?: number } | null>(null);

  function handleAnswerChange(questionId: string, optionId: string) {
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);

    const formData = new FormData();
    formData.append('quiz_id', quizId);
    formData.append('answers', JSON.stringify(answers));

    const response = await submitQuiz(formData);

    if (response.error) {
      setResult({ success: false, message: response.error });
    } else {
      setResult({ 
        success: true, 
        message: response.message || 'Submitted!',
        score: response.score ?? undefined,
      });
    }

    setSubmitting(false);
  }

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = questions.length;

  return (
    <div className="bg-white rounded-xl border">
      <div className="p-6 border-b">
        <h2 className="text-xl font-bold text-gray-900">{quizTitle}</h2>
        <p className="text-gray-600 mt-1">
          {answeredCount} of {totalQuestions} questions answered
        </p>
      </div>

      {result ? (
        <div className={`p-8 text-center ${result.success ? 'bg-brand-green-50' : 'bg-brand-red-50'}`}>
          <span className="text-slate-400 flex-shrink-0">•</span>
          <h3 className="text-xl font-bold mb-2">{result.message}</h3>
          {result.score !== undefined && (
            <p className="text-2xl font-bold text-brand-green-600">Score: {result.score}%</p>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="divide-y">
            {questions.map((question, index) => (
              <div key={question.id} className="p-6">
                <p className="font-medium text-gray-900 mb-4">
                  {index + 1}. {question.text}
                </p>
                <div className="space-y-2">
                  {question.options.map(option => (
                    <label
                      key={option.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                        answers[question.id] === option.id
                          ? 'border-brand-blue-500 bg-brand-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        value={option.id}
                        checked={answers[question.id] === option.id}
                        onChange={() => handleAnswerChange(question.id, option.id)}
                        className="w-4 h-4 text-brand-blue-600"
                      />
                      <span className="text-gray-700">{option.text}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="p-6 border-t bg-gray-50">
            <button
              type="submit"
              disabled={submitting || answeredCount < totalQuestions}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand-blue-600 text-white font-medium rounded-lg hover:bg-brand-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Quiz'
              )}
            </button>
            {answeredCount < totalQuestions && (
              <p className="text-center text-sm text-gray-500 mt-2">
                Please answer all questions before submitting
              </p>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
