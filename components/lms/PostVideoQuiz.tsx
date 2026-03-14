'use client';

import React, { useState, useCallback } from 'react';
import { CheckCircle, XCircle, ChevronRight, RotateCcw, Lock, Unlock } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface QuizQuestion {
  question: string;
  options: string[];
  /** 0-based index of correct answer */
  answer: number;
  explanation?: string;
  /** Competency tag for targeted retry matching */
  competency?: string;
}

export interface QuizAttempt {
  attemptNumber: number;
  totalQuestions: number;
  correctCount: number;
  scorePercent: number;
  perQuestion: {
    questionIndex: number;
    selectedOption: number | null;
    isCorrect: boolean;
    correctOption: number;
    explanationShown: boolean;
  }[];
}

export interface PostVideoQuizProps {
  questions: QuizQuestion[];
  /** Default 80 */
  passingScore?: number;
  /** Called after each attempt with score and pass status */
  onComplete?: (score: number, passed: boolean) => void;
  /** Called when student passes — triggers unlock of next lesson */
  onUnlock?: () => void;
  /** Whether video watch gate is met (60%+ watched). Quiz disabled if false. */
  videoWatchGateMet?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function PostVideoQuiz({
  questions,
  passingScore = 80,
  onComplete,
  onUnlock,
  videoWatchGateMet = true,
}: PostVideoQuizProps) {
  // Current answers (index per question, null = unanswered)
  const [selected, setSelected] = useState<(number | null)[]>(new Array(questions.length).fill(null));
  const [submitted, setSubmitted] = useState(false);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [bestScore, setBestScore] = useState(0);
  const [passed, setPassed] = useState(false);
  // For targeted retry: indices of questions to retry
  const [retryIndices, setRetryIndices] = useState<number[] | null>(null);
  // Retry answers (sparse: only for retried questions)
  const [retrySelected, setRetrySelected] = useState<(number | null)[]>(new Array(questions.length).fill(null));
  const [retrySubmitted, setRetrySubmitted] = useState(false);

  if (!questions || questions.length === 0) return null;

  // Which questions are we currently showing?
  const isRetryMode = retryIndices !== null;
  const activeQuestions = isRetryMode ? retryIndices.map(i => ({ ...questions[i], _origIdx: i })) : questions.map((q, i) => ({ ...q, _origIdx: i }));

  // Compute score from full answers (merging retry answers into original)
  const getMergedAnswers = (): (number | null)[] => {
    const merged = [...selected];
    if (retryIndices && retrySubmitted) {
      retryIndices.forEach((origIdx) => {
        if (retrySelected[origIdx] !== null) {
          merged[origIdx] = retrySelected[origIdx];
        }
      });
    }
    return merged;
  };

  const computeScore = (answers: (number | null)[]) => {
    const correct = answers.filter((s, i) => s === questions[i].answer).length;
    return { correct, total: questions.length, percent: Math.round((correct / questions.length) * 100) };
  };

  // Initial submit
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const handleSubmit = useCallback(() => {
    if (selected.some(s => s === null)) return;
    setSubmitted(true);

    const { correct, total, percent } = computeScore(selected);
    const isPassed = percent >= passingScore;
    const newBest = Math.max(bestScore, percent);
    setBestScore(newBest);

    const attempt: QuizAttempt = {
      attemptNumber: attempts.length + 1,
      totalQuestions: total,
      correctCount: correct,
      scorePercent: percent,
      perQuestion: questions.map((q, i) => ({
        questionIndex: i,
        selectedOption: selected[i],
        isCorrect: selected[i] === q.answer,
        correctOption: q.answer,
        explanationShown: true,
      })),
    };
    setAttempts(prev => [...prev, attempt]);

    if (isPassed || newBest >= passingScore) {
      setPassed(true);
      onUnlock?.();
    }
    onComplete?.(percent, isPassed);
  }, [selected, questions, passingScore, bestScore, attempts, onComplete, onUnlock]);

  // Start targeted retry of missed questions
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const handleStartRetry = useCallback(() => {
    const missed = selected
      .map((s, i) => (s !== questions[i].answer ? i : -1))
      .filter(i => i >= 0);

    // If we already did a retry, check merged answers for missed
    if (retryIndices && retrySubmitted) {
      const merged = getMergedAnswers();
      const stillMissed = merged
        .map((s, i) => (s !== questions[i].answer ? i : -1))
        .filter(i => i >= 0);
      setRetryIndices(stillMissed);
      setRetrySelected(new Array(questions.length).fill(null));
      setRetrySubmitted(false);
      return;
    }

    setRetryIndices(missed);
    setRetrySelected(new Array(questions.length).fill(null));
    setRetrySubmitted(false);
  }, [selected, questions, retryIndices, retrySubmitted]);

  // Submit retry
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const handleRetrySubmit = useCallback(() => {
    if (!retryIndices) return;
    const unanswered = retryIndices.some(i => retrySelected[i] === null);
    if (unanswered) return;

    setRetrySubmitted(true);

    const merged = [...selected];
    retryIndices.forEach(origIdx => {
      if (retrySelected[origIdx] !== null) {
        merged[origIdx] = retrySelected[origIdx];
      }
    });

    const { correct, total, percent } = computeScore(merged);
    const newBest = Math.max(bestScore, percent);
    setBestScore(newBest);

    const attempt: QuizAttempt = {
      attemptNumber: attempts.length + 1,
      totalQuestions: total,
      correctCount: correct,
      scorePercent: percent,
      perQuestion: questions.map((q, i) => ({
        questionIndex: i,
        selectedOption: merged[i],
        isCorrect: merged[i] === q.answer,
        correctOption: q.answer,
        explanationShown: true,
      })),
    };
    setAttempts(prev => [...prev, attempt]);

    const isPassed = newBest >= passingScore;
    if (isPassed && !passed) {
      setPassed(true);
      onUnlock?.();
    }
    onComplete?.(percent, isPassed);
  }, [retryIndices, retrySelected, selected, questions, passingScore, bestScore, attempts, passed, onComplete, onUnlock]);

  // ── WATCH GATE: quiz locked until 60% video watched ──
  if (!videoWatchGateMet) {
    return (
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <Lock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-slate-800 mb-2">Quiz Locked</h3>
        <p className="text-slate-500">Watch at least 60% of the lesson video to unlock the quiz.</p>
      </div>
    );
  }

  // ── RETRY REVIEW (after retry submitted) ──
  if (retrySubmitted && retryIndices) {
    const merged = getMergedAnswers();
    const { correct, total, percent } = computeScore(merged);
    const isPassed = Math.max(bestScore, percent) >= passingScore;
    const stillMissed = merged.filter((s, i) => s !== questions[i].answer).length;

    return (
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8">
        {/* Score header */}
        <div className={`p-5 rounded-xl mb-6 ${isPassed ? 'bg-brand-green-50 border border-brand-green-200' : 'bg-brand-red-50 border border-brand-red-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-2xl font-bold ${isPassed ? 'text-brand-green-800' : 'text-brand-red-800'}`}>
                {isPassed ? 'Passed!' : 'Keep going — review below'}
              </p>
              <p className={`text-base mt-1 ${isPassed ? 'text-brand-green-600' : 'text-brand-red-600'}`}>
                Score: {percent}% ({correct}/{total}). Passing score: {passingScore}%.
              </p>
              {!isPassed && stillMissed > 0 && (
                <p className="text-sm text-brand-red-500 mt-1">
                  You missed {stillMissed} question{stillMissed !== 1 ? 's' : ''}. Review the explanations below, then retry only the missed items.
                </p>
              )}
            </div>
            <div className={`text-4xl font-black ${isPassed ? 'text-brand-green-500' : 'text-brand-red-400'}`}>
              {percent}%
            </div>
          </div>
          {isPassed && (
            <div className="flex items-center gap-2 mt-3 text-brand-green-700">
              <Unlock className="w-5 h-5" />
              <span className="text-sm font-semibold">Next lesson unlocked</span>
            </div>
          )}
        </div>

        {/* Review retried questions */}
        <h3 className="text-lg font-bold text-slate-900 mb-4">Retry Review</h3>
        <div className="space-y-6">
          {retryIndices.map((origIdx) => {
            const q = questions[origIdx];
            const studentAnswer = retrySelected[origIdx];
            const isCorrect = studentAnswer === q.answer;
            return renderQuestionReview(q, origIdx, studentAnswer, isCorrect);
          })}
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-3">
          {!isPassed && stillMissed > 0 && (
            <button onClick={handleStartRetry}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition">
              <RotateCcw className="w-4 h-4" /> Retry missed questions ({stillMissed})
            </button>
          )}
        </div>

        {/* Attempt history */}
        {renderAttemptHistory()}
      </div>
    );
  }

  // ── RETRY MODE (answering missed questions) ──
  if (isRetryMode && !retrySubmitted) {
    return (
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <RotateCcw className="w-5 h-5 text-amber-600" />
            <h3 className="text-2xl font-bold text-slate-900">Retry Missed Questions</h3>
          </div>
          <p className="text-slate-500">
            {retryIndices.length} question{retryIndices.length !== 1 ? 's' : ''} to retry. Answer carefully — your best score across all attempts counts.
          </p>
        </div>

        <div className="space-y-8">
          {retryIndices.map((origIdx, displayIdx) => {
            const q = questions[origIdx];
            return (
              <div key={origIdx} className="border-b border-slate-100 pb-6 last:border-0">
                <div className="flex gap-3 mb-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center text-sm font-bold">
                    {displayIdx + 1}
                  </span>
                  <p className="text-lg font-semibold text-slate-900 pt-0.5">{q.question}</p>
                </div>
                <div className="grid gap-3 ml-11">
                  {q.options.map((opt, optIdx) => {
                    const letter = String.fromCharCode(65 + optIdx);
                    const isSelected = retrySelected[origIdx] === optIdx;
                    return (
                      <button key={optIdx} onClick={() => {
                        setRetrySelected(prev => {
                          const next = [...prev];
                          next[origIdx] = optIdx;
                          return next;
                        });
                      }}
                        className={`flex items-center gap-3 px-5 py-3.5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-brand-blue-500 ring-2 ring-brand-blue-200 bg-brand-blue-50'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}>
                        <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                          isSelected ? 'bg-brand-blue-500 text-white' : 'bg-slate-100 text-slate-500'
                        }`}>{letter}</span>
                        <span className="text-base font-medium text-slate-700">{opt}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex justify-end">
          <button onClick={handleRetrySubmit}
            disabled={retryIndices.some(i => retrySelected[i] === null)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-blue-600 text-white font-semibold text-base hover:bg-brand-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition">
            Submit Retry <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // ── INITIAL REVIEW (after first submit) ──
  if (submitted) {
    const { correct, total, percent } = computeScore(selected);
    const isPassed = bestScore >= passingScore;
    const missedCount = questions.length - correct;

    return (
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8">
        {/* Score header */}
        <div className={`p-5 rounded-xl mb-6 ${isPassed ? 'bg-brand-green-50 border border-brand-green-200' : 'bg-brand-red-50 border border-brand-red-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-2xl font-bold ${isPassed ? 'text-brand-green-800' : 'text-brand-red-800'}`}>
                {isPassed ? 'Passed!' : 'Not quite — review below'}
              </p>
              <p className={`text-base mt-1 ${isPassed ? 'text-brand-green-600' : 'text-brand-red-600'}`}>
                Score: {percent}% ({correct}/{total}). Passing score: {passingScore}%.
              </p>
              {!isPassed && missedCount > 0 && (
                <p className="text-sm text-brand-red-500 mt-1">
                  You missed {missedCount} question{missedCount !== 1 ? 's' : ''}. Review the explanations below, then retry only the missed items.
                </p>
              )}
            </div>
            <div className={`text-4xl font-black ${isPassed ? 'text-brand-green-500' : 'text-brand-red-400'}`}>
              {percent}%
            </div>
          </div>
          {isPassed && (
            <div className="flex items-center gap-2 mt-3 text-brand-green-700">
              <Unlock className="w-5 h-5" />
              <span className="text-sm font-semibold">Next lesson unlocked</span>
            </div>
          )}
        </div>

        {/* Full answer review */}
        <h3 className="text-lg font-bold text-slate-900 mb-4">Answer Review</h3>
        <div className="space-y-6">
          {questions.map((q, qIdx) => {
            const studentAnswer = selected[qIdx];
            const isCorrect = studentAnswer === q.answer;
            return renderQuestionReview(q, qIdx, studentAnswer, isCorrect);
          })}
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-3">
          {!isPassed && missedCount > 0 && (
            <button onClick={handleStartRetry}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition">
              <RotateCcw className="w-4 h-4" /> Retry missed questions ({missedCount})
            </button>
          )}
        </div>

        {/* Attempt history */}
        {renderAttemptHistory()}
      </div>
    );
  }

  // ── QUIZ MODE (first attempt, answering) ──
  return (
    <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-slate-900">Knowledge Check</h3>
        <p className="text-slate-500 mt-1">
          {questions.length} questions &middot; {passingScore}% to pass &middot; Answer all questions, then submit.
        </p>
      </div>

      <div className="space-y-8">
        {questions.map((q, qIdx) => (
          <div key={qIdx} className="border-b border-slate-100 pb-6 last:border-0">
            <div className="flex gap-3 mb-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-blue-600 text-white flex items-center justify-center text-sm font-bold">
                {qIdx + 1}
              </span>
              <p className="text-lg font-semibold text-slate-900 pt-0.5">{q.question}</p>
            </div>

            <div className="grid gap-3 ml-11">
              {q.options.map((opt, optIdx) => {
                const letter = String.fromCharCode(65 + optIdx);
                const isSelected = selected[qIdx] === optIdx;
                return (
                  <button key={optIdx} onClick={() => {
                    if (submitted) return;
                    setSelected(prev => {
                      const next = [...prev];
                      next[qIdx] = optIdx;
                      return next;
                    });
                  }}
                    className={`flex items-center gap-3 px-5 py-3.5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-brand-blue-500 ring-2 ring-brand-blue-200 bg-brand-blue-50'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}>
                    <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                      isSelected ? 'bg-brand-blue-500 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>{letter}</span>
                    <span className="text-base font-medium text-slate-700">{opt}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <button onClick={handleSubmit} disabled={selected.some(s => s === null)}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-blue-600 text-white font-semibold text-base hover:bg-brand-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition">
          Submit Answers <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  // ── Shared: render a single question in review mode ──
  function renderQuestionReview(q: QuizQuestion, qIdx: number, studentAnswer: number | null, isCorrect: boolean) {
    const correctLetter = String.fromCharCode(65 + q.answer);
    return (
      <div key={qIdx} className={`p-5 rounded-xl border-2 ${isCorrect ? 'border-brand-green-200 bg-brand-green-50/50' : 'border-brand-red-200 bg-brand-red-50/50'}`}>
        <div className="flex items-start gap-3 mb-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isCorrect ? 'bg-brand-green-500' : 'bg-brand-red-400'}`}>
            {isCorrect ? <CheckCircle className="w-5 h-5 text-white" /> : <XCircle className="w-5 h-5 text-white" />}
          </div>
          <p className="text-base font-bold text-slate-900 pt-0.5">{q.question}</p>
        </div>

        <div className="ml-11 space-y-2 mb-3">
          {q.options.map((opt, optIdx) => {
            const letter = String.fromCharCode(65 + optIdx);
            const isThisCorrect = optIdx === q.answer;
            const isThisSelected = optIdx === studentAnswer;
            const isThisWrong = isThisSelected && !isThisCorrect;
            return (
              <div key={optIdx} className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg border ${
                isThisCorrect ? 'bg-brand-green-100 border-brand-green-400' :
                isThisWrong ? 'bg-brand-red-100 border-brand-red-300' :
                'bg-white border-slate-200'
              }`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  isThisCorrect ? 'bg-brand-green-500 text-white' :
                  isThisWrong ? 'bg-brand-red-400 text-white' :
                  'bg-slate-100 text-slate-400'
                }`}>
                  {isThisCorrect ? <CheckCircle className="w-3.5 h-3.5" /> :
                   isThisWrong ? <XCircle className="w-3.5 h-3.5" /> :
                   letter}
                </span>
                <span className={`text-sm font-medium ${
                  isThisCorrect ? 'text-brand-green-800' :
                  isThisWrong ? 'text-brand-red-700 line-through' :
                  'text-slate-600'
                }`}>{opt}</span>
                {isThisCorrect && <span className="text-xs font-bold text-brand-green-600 ml-auto">Correct Answer</span>}
                {isThisWrong && <span className="text-xs font-bold text-brand-red-500 ml-auto">Your Answer</span>}
              </div>
            );
          })}
        </div>

        {q.explanation && (
          <div className="ml-11 p-3.5 rounded-lg bg-white border border-slate-200">
            <p className="text-xs font-bold uppercase tracking-wider text-brand-blue-600 mb-1">Why {correctLetter} is correct</p>
            <p className="text-sm text-slate-700 leading-relaxed">{q.explanation}</p>
          </div>
        )}
      </div>
    );
  }

  // ── Shared: attempt history ──
  function renderAttemptHistory() {
    if (attempts.length <= 1) return null;
    return (
      <div className="mt-6 pt-4 border-t border-slate-100">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Attempt History</p>
        <div className="flex gap-2">
          {attempts.map((a, i) => (
            <div key={i} className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
              a.scorePercent >= passingScore
                ? 'bg-brand-green-50 text-brand-green-700 border-brand-green-200'
                : 'bg-slate-50 text-slate-600 border-slate-200'
            }`}>
              Attempt {a.attemptNumber}: {a.scorePercent}% ({a.correctCount}/{a.totalQuestions})
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-2">Best score: {bestScore}%</p>
      </div>
    );
  }
}
