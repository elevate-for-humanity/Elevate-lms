'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { CheckCircle, XCircle, ChevronRight, RotateCcw, Trophy } from 'lucide-react';
import { CheckpointAssist } from '@/components/lms/ai/CheckpointAssist';

// ── Types ──────────────────────────────────────────────────────────────

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // 0-based index
  explanation?: string;
}

/**
 * Normalizes a raw quiz question from any known shape into the canonical Question type.
 *
 * Handles three shapes that exist in the codebase:
 *   Canonical:  { id, question, options, correctAnswer, explanation }
 *   HVAC banks: { question, options, answer, explanation }  (answer = 0-based index)
 *   AI-ingest:  { question_text, options, correct_answer, points, question_type }
 *
 * Any unrecognized shape is skipped (returns null) to prevent "object as React child" errors.
 */

/**
 * Coerces a value to a valid 0-based option index.
 * Accepts numbers and numeric strings (e.g. "2"). Returns null when the value
 * cannot be resolved so the caller can fall through to the next candidate
 * rather than silently defaulting to index 0.
 */
function toOptionIndex(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value) && value >= 0) return value;
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed) && parsed >= 0) return parsed;
  }
  return null;
}

function normalizeQuestion(raw: unknown, index: number): Question | null {
  if (!raw || typeof raw !== 'object') return null;
  const q = raw as Record<string, unknown>;

  // Canonical shape — also handles {answer} variant used in HVAC quiz banks.
  // Both correctAnswer and answer may arrive as a number or a numeric string.
  if (typeof q.question === 'string' && Array.isArray(q.options)) {
    const correctAnswer =
      toOptionIndex(q.correctAnswer) ??
      toOptionIndex(q.answer) ??
      null;

    // Reject questions with no resolvable correct answer rather than silently
    // marking option 0 as correct — a wrong default corrupts checkpoint scores.
    if (correctAnswer === null) return null;

    return {
      id: typeof q.id === 'string' ? q.id : `q-${index}`,
      question: q.question,
      options: q.options.filter((o): o is string => typeof o === 'string'),
      correctAnswer,
      explanation: typeof q.explanation === 'string' ? q.explanation : undefined,
    };
  }

  // AI-ingest shape: { question_text, options, correct_answer }
  // correct_answer may be a letter ("A"–"D") or a numeric string ("0"–"3").
  if (typeof q.question_text === 'string' && Array.isArray(q.options)) {
    const opts = q.options.filter((o): o is string => typeof o === 'string');
    let correctIndex: number | null;

    if (typeof q.correct_answer === 'string') {
      const upper = q.correct_answer.trim().toUpperCase();
      const letterIndex = ['A', 'B', 'C', 'D'].indexOf(upper);
      if (letterIndex >= 0) {
        correctIndex = letterIndex;
      } else {
        // Fall back to numeric string ("0", "1", "2", "3")
        correctIndex = toOptionIndex(q.correct_answer);
      }
    } else {
      correctIndex = toOptionIndex(q.correct_answer);
    }

    if (correctIndex === null) return null;

    return {
      id: `q-${index}`,
      question: q.question_text,
      options: opts,
      correctAnswer: correctIndex,
      explanation: undefined,
    };
  }

  return null;
}

interface QuizPlayerProps {
  questions: any[];
  onComplete: (score: number, answers?: Record<string, number>) => void;
  passingScore?: number;
  /** Title shown above the quiz (e.g. "Module 6 Quiz — EPA 608 Core") */
  title?: string;
  /** When true, fail messaging explicitly states the next module is locked. */
  isCheckpoint?: boolean;
}

// ── Sound helpers (Web Audio API — no external files) ──────────────────

function playCorrectSound() {
  try {
    const ctx = new AudioContext();
    // Two-tone ascending "ding"
    [523.25, 659.25].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.4);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.12);
      osc.stop(ctx.currentTime + i * 0.12 + 0.4);
    });
  } catch {
    // Audio not available — silent fallback
  }
}

function playWrongSound() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = 220;
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    // Silent fallback
  }
}

// ── Component ──────────────────────────────────────────────────────────

export default function QuizPlayer({
  questions: rawQuestions,
  onComplete,
  passingScore = 70,
  title,
  isCheckpoint = false,
}: QuizPlayerProps) {
  // Normalize all questions to the canonical shape, dropping any unrecognized items.
  const questions: Question[] = (rawQuestions ?? [])
    .map((q, i) => normalizeQuestion(q, i))
    .filter((q): q is Question => q !== null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState<
    { questionId: string; selected: number; correct: boolean }[]
  >([]);

  // Ref mirror of answeredQuestions — updated synchronously in handleSelect so
  // handleNext always reads the complete list, including the last answer.
  // React's setState is async: when the user answers the final question and
  // immediately clicks "Next/Finish", the answeredQuestions state value captured
  // in the handleNext closure is still the pre-answer snapshot, causing the last
  // answer to be excluded from the score and answersMap sent to the server.
  const answeredQuestionsRef = useRef<{ questionId: string; selected: number; correct: boolean }[]>(
    [],
  );

  const feedbackRef = useRef<HTMLDivElement>(null);

  const question = questions[currentIndex];
  const isCorrect = selectedAnswer === question?.correctAnswer;
  const isLastQuestion = currentIndex === questions.length - 1;
  const score = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
  const passed = score >= passingScore;

  // Scroll feedback into view when revealed
  useEffect(() => {
    if (isRevealed && feedbackRef.current) {
      feedbackRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [isRevealed]);

  const handleSelect = useCallback(
    (optionIndex: number) => {
      if (isRevealed) return; // Already answered — ignore clicks
      setSelectedAnswer(optionIndex);
      setIsRevealed(true);

      const correct = optionIndex === question.correctAnswer;
      if (correct) {
        setCorrectCount((c) => c + 1);
        playCorrectSound();
      } else {
        playWrongSound();
      }

      const entry = { questionId: question.id, selected: optionIndex, correct };
      // Update the ref synchronously before any state flush so handleNext
      // always sees the complete list when it fires on the last question.
      answeredQuestionsRef.current = [...answeredQuestionsRef.current, entry];
      setAnsweredQuestions(answeredQuestionsRef.current);
    },
    [isRevealed, question],
  );

  const handleNext = useCallback(() => {
    if (isLastQuestion) {
      // Read from the ref, not the state, to guarantee the last answer is included.
      // answeredQuestions (state) may still be the pre-last-answer snapshot here
      // because React batches setState calls and the flush hasn't happened yet.
      const allAnswers = answeredQuestionsRef.current;
      const finalCorrect = allAnswers.filter((q) => q.correct).length;
      const finalScore = Math.round((finalCorrect / questions.length) * 100);
      setFinished(true);
      // Build answers map: { questionId: selectedOptionIndex }
      const answersMap: Record<string, number> = {};
      allAnswers.forEach((q) => {
        answersMap[q.questionId] = q.selected;
      });
      onComplete(finalScore, answersMap);
    } else {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
      setIsRevealed(false);
    }
  }, [isLastQuestion, questions.length, onComplete]);

  const handleRetake = useCallback(() => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setIsRevealed(false);
    setCorrectCount(0);
    setFinished(false);
    answeredQuestionsRef.current = [];
    setAnsweredQuestions([]);
  }, []);

  // ── Results screen ──

  if (finished) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Header */}
        <div
          className={`px-8 py-10 text-center ${
            passed
              ? 'bg-gradient-to-br from-brand-green-50 to-emerald-50'
              : 'bg-gradient-to-br from-amber-50 to-orange-50'
          }`}
        >
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
              passed ? 'bg-brand-green-100' : 'bg-amber-100'
            }`}
          >
            {passed ? (
              <Trophy className="w-10 h-10 text-brand-green-600" />
            ) : (
              <RotateCcw className="w-10 h-10 text-amber-600" />
            )}
          </div>
          <h2 className="text-3xl font-bold mb-2">
            {passed ? 'Congratulations!' : isCheckpoint ? 'Not Yet' : 'Keep Studying!'}
          </h2>
          <p className="text-lg text-slate-700">
            You scored <span className="font-bold">{score}%</span> — {correctCount} of{' '}
            {questions.length} correct
          </p>
          <p className="text-sm text-slate-500 mt-1">
            {passed
              ? `You passed! (${passingScore}% required)`
              : isCheckpoint
                ? `You need ${passingScore}% to unlock the next module. Review the explanations below and retake when ready.`
                : `You need ${passingScore}% to pass. Review the explanations below and try again.`}
          </p>
        </div>

        {/* Answer review */}
        <div className="p-6 md:p-8 space-y-4">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Review Your Answers</h3>
          {questions.map((q, idx) => {
            const record = answeredQuestions[idx];
            if (!record) return null;
            return (
              <div
                key={q.id}
                className={`p-4 rounded-xl border-2 ${
                  record.correct
                    ? 'border-brand-green-200 bg-brand-green-50/50'
                    : 'border-brand-red-200 bg-brand-red-50/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  {record.correct ? (
                    <CheckCircle className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-brand-red-500 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 mb-1 text-base">
                      {idx + 1}. {q.question}
                    </p>
                    <p className="text-sm sm:text-base text-slate-600">
                      Your answer:{' '}
                      <span
                        className={
                          record.correct
                            ? 'text-brand-green-700 font-semibold'
                            : 'text-brand-red-700 font-semibold line-through'
                        }
                      >
                        {q.options[record.selected]}
                      </span>
                    </p>
                    {!record.correct && (
                      <p className="text-sm text-slate-600 mt-0.5">
                        Correct answer:{' '}
                        <span className="text-brand-green-700 font-semibold">
                          {q.options[q.correctAnswer]}
                        </span>
                      </p>
                    )}
                    {q.explanation && (
                      <p className="text-sm text-slate-500 mt-2 bg-white/60 rounded-lg p-2">
                        {q.explanation}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="px-6 md:px-8 pb-8 flex gap-3">
          <button
            onClick={handleRetake}
            className="flex-1 bg-brand-blue-600 hover:bg-brand-blue-700 text-white py-3 rounded-xl font-semibold transition"
          >
            Retake Quiz
          </button>
          {passed && (
            <button
              onClick={() => {
                // Scroll to top or let parent handle navigation
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex-1 bg-brand-green-600 hover:bg-brand-green-700 text-white py-3 rounded-xl font-semibold transition"
            >
              Continue
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Question screen ──

  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Progress bar */}
      <div className="px-6 md:px-8 pt-6">
        {title && <h2 className="text-lg font-bold text-slate-900 mb-3">{title}</h2>}
        <div className="flex justify-between text-sm text-slate-500 mb-2">
          <span>
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span>{correctCount} correct so far</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2.5">
          <div
            className="bg-brand-blue-600 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="px-6 md:px-8 py-6">
        <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-6">{question.question}</h3>

        {/* Options */}
        <div className="space-y-3">
          {question.options.map((option, idx) => {
            const isSelected = selectedAnswer === idx;
            const isCorrectOption = idx === question.correctAnswer;

            let optionStyle =
              'border-slate-200 hover:border-slate-300 hover:bg-slate-50 cursor-pointer';
            let indicator = (
              <div className="w-8 h-8 rounded-full border-2 border-slate-300 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-slate-400">
                  {String.fromCharCode(65 + idx)}
                </span>
              </div>
            );

            if (isRevealed) {
              if (isCorrectOption) {
                // Always highlight the correct answer in green
                optionStyle =
                  'border-brand-green-400 bg-brand-green-50 ring-2 ring-brand-green-200';
                indicator = (
                  <div className="w-8 h-8 rounded-full bg-brand-green-500 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                );
              } else if (isSelected && !isCorrectOption) {
                // Wrong selection — red
                optionStyle = 'border-brand-red-400 bg-brand-red-50 ring-2 ring-brand-red-200';
                indicator = (
                  <div className="w-8 h-8 rounded-full bg-brand-red-500 flex items-center justify-center flex-shrink-0">
                    <XCircle className="w-5 h-5 text-white" />
                  </div>
                );
              } else {
                // Unselected, not correct — dim
                optionStyle = 'border-slate-200 bg-slate-50 opacity-50 cursor-default';
              }
            } else if (isSelected) {
              optionStyle = 'border-brand-blue-500 bg-brand-blue-50 ring-2 ring-brand-blue-200';
              indicator = (
                <div className="w-8 h-8 rounded-full bg-brand-blue-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-white">
                    {String.fromCharCode(65 + idx)}
                  </span>
                </div>
              );
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelect(idx)}
                disabled={isRevealed}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-4 ${optionStyle}`}
              >
                {indicator}
                <span className="font-medium text-slate-800 min-w-0 break-words">{option}</span>
              </button>
            );
          })}
        </div>

        {/* Feedback panel — appears after selecting an answer */}
        {isRevealed && (
          <div
            ref={feedbackRef}
            className={`mt-6 rounded-xl p-5 border-2 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 ${
              isCorrect
                ? 'bg-brand-green-50 border-brand-green-300'
                : 'bg-amber-50 border-amber-300'
            }`}
          >
            {isCorrect ? (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-green-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-brand-green-600" />
                </div>
                <div>
                  <p className="font-bold text-brand-green-800 text-lg">Correct!</p>
                  {question.explanation && (
                    <p className="text-brand-green-700 mt-1">{question.explanation}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <XCircle className="w-6 h-6 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-amber-800 text-lg">Not quite.</p>
                  <p className="text-amber-700 mt-1">
                    The correct answer is:{' '}
                    <span className="font-semibold">
                      {question.options[question.correctAnswer]}
                    </span>
                  </p>
                  {question.explanation && (
                    <p className="text-amber-700 mt-2">{question.explanation}</p>
                  )}
                  <CheckpointAssist
                    question={question.question}
                    userAnswer={selectedAnswer !== null ? question.options[selectedAnswer] : ''}
                    correctAnswer={question.options[question.correctAnswer]}
                    explanation={question.explanation}
                  />
                </div>
              </div>
            )}

            {/* Next / Finish button inside feedback panel */}
            <button
              onClick={handleNext}
              className={`mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white transition ${
                isLastQuestion
                  ? 'bg-brand-green-600 hover:bg-brand-green-700'
                  : 'bg-brand-blue-600 hover:bg-brand-blue-700'
              }`}
            >
              {isLastQuestion ? (
                <>
                  See Results <Trophy className="w-5 h-5" />
                </>
              ) : (
                <>
                  Next Question <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
