"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { CheckCircle, XCircle, ChevronRight, RotateCcw, Trophy } from "lucide-react";
import { CheckpointAssist } from "@/components/lms/ai/CheckpointAssist";

// ── Types ──────────────────────────────────────────────────────────────

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // 0-based index
  explanation?: string;
}

interface QuizPlayerProps {
  questions: Question[];
  onComplete: (score: number, answers?: Record<string, number>) => void;
  passingScore?: number;
  /** Title shown above the quiz (e.g. "Module 6 Quiz — EPA 608 Core") */
  title?: string;
}

// ── Sound helpers (Web Audio API — no external files) ──────────────────

function playCorrectSound() {
  try {
    const ctx = new AudioContext();
    // Two-tone ascending "ding"
    [523.25, 659.25].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
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
    osc.type = "triangle";
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
  questions,
  onComplete,
  passingScore = 70,
  title,
}: QuizPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState<
    { questionId: string; selected: number; correct: boolean }[]
  >([]);

  const feedbackRef = useRef<HTMLDivElement>(null);

  const question = questions[currentIndex];
  const isCorrect = selectedAnswer === question?.correctAnswer;
  const isLastQuestion = currentIndex === questions.length - 1;
  const score = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
  const passed = score >= passingScore;

  // Scroll feedback into view when revealed
  useEffect(() => {
    if (isRevealed && feedbackRef.current) {
      feedbackRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
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

      setAnsweredQuestions((prev) => [
        ...prev,
        { questionId: question.id, selected: optionIndex, correct },
      ]);
    },
    [isRevealed, question]
  );

  const handleNext = useCallback(() => {
    if (isLastQuestion) {
      // Derive score from answeredQuestions rather than correctCount to avoid
      // reading a stale closure value when the last answer was correct (setState
      // is async so correctCount hasn't incremented yet at this point).
      const finalCorrect = answeredQuestions.filter((q) => q.correct).length;
      const finalScore = Math.round((finalCorrect / questions.length) * 100);
      setFinished(true);
      // Build answers map: { questionId: selectedOptionIndex }
      const answersMap: Record<string, number> = {};
      answeredQuestions.forEach((q) => { answersMap[q.questionId] = q.selected; });
      onComplete(finalScore, answersMap);
    } else {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
      setIsRevealed(false);
    }
  }, [isLastQuestion, answeredQuestions, questions.length, onComplete]);

  const handleRetake = useCallback(() => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setIsRevealed(false);
    setCorrectCount(0);
    setFinished(false);
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
              ? "bg-gradient-to-br from-brand-green-50 to-emerald-50"
              : "bg-gradient-to-br from-amber-50 to-orange-50"
          }`}
        >
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
              passed ? "bg-brand-green-100" : "bg-amber-100"
            }`}
          >
            {passed ? (
              <Trophy className="w-10 h-10 text-brand-green-600" />
            ) : (
              <RotateCcw className="w-10 h-10 text-amber-600" />
            )}
          </div>
          <h2 className="text-3xl font-bold mb-2">
            {passed ? "Congratulations!" : "Keep Studying!"}
          </h2>
          <p className="text-lg text-slate-700">
            You scored <span className="font-bold">{score}%</span> — {correctCount} of{" "}
            {questions.length} correct
          </p>
          <p className="text-sm text-slate-500 mt-1">
            {passed
              ? `You passed! (${passingScore}% required)`
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
                    ? "border-brand-green-200 bg-brand-green-50/50"
                    : "border-brand-red-200 bg-brand-red-50/50"
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
                      Your answer:{" "}
                      <span
                        className={
                          record.correct
                            ? "text-brand-green-700 font-semibold"
                            : "text-brand-red-700 font-semibold line-through"
                        }
                      >
                        {q.options[record.selected]}
                      </span>
                    </p>
                    {!record.correct && (
                      <p className="text-sm text-slate-600 mt-0.5">
                        Correct answer:{" "}
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
                window.scrollTo({ top: 0, behavior: "smooth" });
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

            let optionStyle = "border-slate-200 hover:border-slate-300 hover:bg-slate-50 cursor-pointer";
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
                optionStyle = "border-brand-green-400 bg-brand-green-50 ring-2 ring-brand-green-200";
                indicator = (
                  <div className="w-8 h-8 rounded-full bg-brand-green-500 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                );
              } else if (isSelected && !isCorrectOption) {
                // Wrong selection — red
                optionStyle = "border-brand-red-400 bg-brand-red-50 ring-2 ring-brand-red-200";
                indicator = (
                  <div className="w-8 h-8 rounded-full bg-brand-red-500 flex items-center justify-center flex-shrink-0">
                    <XCircle className="w-5 h-5 text-white" />
                  </div>
                );
              } else {
                // Unselected, not correct — dim
                optionStyle = "border-slate-200 bg-slate-50 opacity-50 cursor-default";
              }
            } else if (isSelected) {
              optionStyle = "border-brand-blue-500 bg-brand-blue-50 ring-2 ring-brand-blue-200";
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
                <span className="font-medium text-slate-800">{option}</span>
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
                ? "bg-brand-green-50 border-brand-green-300"
                : "bg-amber-50 border-amber-300"
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
                    The correct answer is:{" "}
                    <span className="font-semibold">{question.options[question.correctAnswer]}</span>
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
                  ? "bg-brand-green-600 hover:bg-brand-green-700"
                  : "bg-brand-blue-600 hover:bg-brand-blue-700"
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
