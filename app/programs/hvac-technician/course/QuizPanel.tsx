'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, RotateCcw, Trophy } from 'lucide-react';
import type { QuizQuestion } from '@/lib/courses/hvac-quizzes';

export function QuizPanel({
  questions,
  lessonTitle,
  onPass,
}: {
  questions: QuizQuestion[];
  lessonTitle: string;
  onPass: () => void;
}) {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [answers, setAnswers] = useState<(number | null)[]>(new Array(questions.length).fill(null));

  const q = questions[current];
  const isCorrect = selected === q?.correctAnswer;
  const passingScore = Math.ceil(questions.length * 0.7);

  const handleSelect = (idx: number) => {
    if (showResult) return;
    setSelected(idx);
  };

  const handleSubmit = () => {
    if (selected === null) return;
    setShowResult(true);
    const newAnswers = [...answers];
    newAnswers[current] = selected;
    setAnswers(newAnswers);
    if (selected === q.correctAnswer) {
      setScore((s) => s + 1);
    }
  };

  const handleNext = () => {
    if (current < questions.length - 1) {
      setCurrent((c) => c + 1);
      setSelected(null);
      setShowResult(false);
    } else {
      setFinished(true);
      const finalScore = score + (isCorrect ? 0 : 0); // score already updated
      if (finalScore >= passingScore) onPass();
    }
  };

  const handleRetry = () => {
    setCurrent(0);
    setSelected(null);
    setShowResult(false);
    setScore(0);
    setFinished(false);
    setAnswers(new Array(questions.length).fill(null));
  };

  if (finished) {
    const passed = score >= passingScore;
    return (
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className={`px-8 py-10 text-center ${passed ? 'bg-brand-green-50' : 'bg-brand-red-50'}`}>
          {passed ? (
            <Trophy className="w-16 h-16 text-brand-green-500 mx-auto mb-4" />
          ) : (
            <XCircle className="w-16 h-16 text-brand-red-400 mx-auto mb-4" />
          )}
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            {passed ? 'Quiz Passed!' : 'Not Quite — Try Again'}
          </h3>
          <p className="text-lg text-gray-600 mb-1">
            Score: <span className="font-bold">{score}/{questions.length}</span> ({Math.round((score / questions.length) * 100)}%)
          </p>
          <p className="text-sm text-gray-500 mb-6">
            {passed
              ? 'You demonstrated mastery of this material. Great work!'
              : `You need ${passingScore}/${questions.length} (70%) to pass. Review the material and try again.`}
          </p>
          {!passed && (
            <button
              onClick={handleRetry}
              className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-full font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" /> Retry Quiz
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      {/* Progress bar */}
      <div className="h-1.5 bg-slate-100">
        <div
          className="h-full bg-brand-blue-500 transition-all duration-300"
          style={{ width: `${((current + 1) / questions.length) * 100}%` }}
        />
      </div>

      <div className="px-6 py-5">
        {/* Question header */}
        <div className="flex items-center justify-between mb-6">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Question {current + 1} of {questions.length}
          </span>
          <span className="text-xs text-slate-400">
            {passingScore}/{questions.length} to pass
          </span>
        </div>

        {/* Question */}
        <h4 className="text-lg font-semibold text-gray-900 mb-5 leading-relaxed">
          {q.question}
        </h4>

        {/* Options */}
        <div className="space-y-3 mb-6">
          {q.options.map((opt, idx) => {
            let style = 'border-slate-200 hover:border-slate-300 hover:bg-slate-50';
            if (selected === idx && !showResult) style = 'border-brand-blue-400 bg-brand-blue-50 ring-2 ring-brand-blue-200';
            if (showResult && idx === q.correctAnswer) style = 'border-brand-green-400 bg-brand-green-50';
            if (showResult && selected === idx && idx !== q.correctAnswer) style = 'border-brand-red-400 bg-brand-red-50';

            return (
              <button
                key={idx}
                onClick={() => handleSelect(idx)}
                disabled={showResult}
                className={`w-full text-left flex items-start gap-3 px-4 py-3.5 rounded-xl border-2 transition-all cursor-pointer ${style}`}
              >
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                  selected === idx && !showResult ? 'bg-brand-blue-600 text-white' :
                  showResult && idx === q.correctAnswer ? 'bg-brand-green-500 text-white' :
                  showResult && selected === idx ? 'bg-brand-red-500 text-white' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="text-sm text-gray-800 leading-relaxed">{opt}</span>
                {showResult && idx === q.correctAnswer && (
                  <CheckCircle className="w-5 h-5 text-brand-green-500 shrink-0 ml-auto mt-0.5" />
                )}
                {showResult && selected === idx && idx !== q.correctAnswer && (
                  <XCircle className="w-5 h-5 text-brand-red-500 shrink-0 ml-auto mt-0.5" />
                )}
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {showResult && q.explanation && (
          <div className={`rounded-xl p-4 mb-5 ${isCorrect ? 'bg-brand-green-50 border border-brand-green-200' : 'bg-amber-50 border border-amber-200'}`}>
            <p className="text-sm font-semibold text-gray-800 mb-1">
              {isCorrect ? 'Correct!' : 'Explanation:'}
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">{q.explanation}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end">
          {!showResult ? (
            <button
              onClick={handleSubmit}
              disabled={selected === null}
              className={`px-6 py-2.5 rounded-full font-semibold text-sm transition-colors cursor-pointer ${
                selected !== null
                  ? 'bg-brand-blue-600 text-white hover:bg-brand-blue-700'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              Submit Answer
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="px-6 py-2.5 bg-brand-blue-600 text-white rounded-full font-semibold text-sm hover:bg-brand-blue-700 transition-colors cursor-pointer"
            >
              {current < questions.length - 1 ? 'Next Question' : 'See Results'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
