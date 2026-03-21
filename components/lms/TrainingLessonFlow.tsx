'use client';

/**
 * components/lms/TrainingLessonFlow.tsx
 *
 * Renders a lesson as a training unit, not a content page.
 *
 * Flow (top to bottom):
 *   1. Video demo (if video_url present)
 *   2. Core HTML content
 *   3. Key terms glossary (if key_terms present)
 *   4. Scenario (if scenario_prompt present)
 *   5. Quick-check quiz (if quiz_questions present)
 *   6. Pass → unlock next / Fail → retry
 *
 * The "Next Lesson" action is controlled by the parent via onQuizPass.
 * This component owns quiz state, attempt tracking, and retry logic.
 * It does NOT own navigation — the parent decides what "pass" means.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Play, BookOpen, AlertTriangle, CheckCircle, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { sanitizeRichHtml } from '@/lib/security/sanitize-html';

// ── Types ─────────────────────────────────────────────────────────────────────

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

interface KeyTerm {
  term: string;
  definition: string;
}

interface TrainingLessonFlowProps {
  lessonId: string;
  courseId: string;
  title: string;
  content: string | null;
  videoUrl?: string | null;
  scenarioPrompt?: string | null;
  keyTerms?: KeyTerm[] | null;
  quizQuestions?: QuizQuestion[] | null;
  passingScore?: number;
  /** Called when the learner passes the quiz. Parent handles navigation + completion. */
  onQuizPass: (score: number, answers: Record<string, number>) => void;
  /** Whether this lesson was already completed in a prior session */
  alreadyPassed?: boolean;
}

// ── Quiz state machine ────────────────────────────────────────────────────────

type QuizPhase = 'idle' | 'answering' | 'submitted' | 'passed' | 'failed';

// ── Component ─────────────────────────────────────────────────────────────────

export default function TrainingLessonFlow({
  lessonId,
  courseId,
  title,
  content,
  videoUrl,
  scenarioPrompt,
  keyTerms,
  quizQuestions,
  passingScore = 70,
  onQuizPass,
  alreadyPassed = false,
}: TrainingLessonFlowProps) {
  const [quizPhase, setQuizPhase] = useState<QuizPhase>(alreadyPassed ? 'passed' : 'idle');
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [score, setScore] = useState<number | null>(null);
  const [attemptNumber, setAttemptNumber] = useState(1);
  const [termsExpanded, setTermsExpanded] = useState(false);
  const [videoWatched, setVideoWatched] = useState(false);
  const quizRef = useRef<HTMLDivElement>(null);

  const hasQuiz = quizQuestions && quizQuestions.length > 0;
  const hasVideo = !!videoUrl;
  const hasScenario = !!scenarioPrompt;
  const hasKeyTerms = keyTerms && keyTerms.length > 0;

  // Record attempt in DB
  const recordAttempt = async (attemptScore: number, answers: Record<string, number>) => {
    try {
      await fetch('/api/lms/lesson-attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId,
          courseId,
          score: attemptScore,
          attemptNumber,
          answers,
        }),
      });
    } catch {
      // Non-fatal — attempt still recorded client-side
    }
  };

  const handleAnswerSelect = (questionId: string, answerIndex: number) => {
    if (quizPhase === 'submitted' || quizPhase === 'passed') return;
    setSelectedAnswers(prev => ({ ...prev, [questionId]: answerIndex }));
    if (quizPhase === 'idle') setQuizPhase('answering');
  };

  const handleSubmit = async () => {
    if (!hasQuiz) return;
    const answered = Object.keys(selectedAnswers).length;
    if (answered < quizQuestions.length) return; // all questions required

    const correct = quizQuestions.filter(
      q => selectedAnswers[q.id] === q.correctAnswer
    ).length;
    const pct = Math.round((correct / quizQuestions.length) * 100);

    setScore(pct);
    await recordAttempt(pct, selectedAnswers);

    if (pct >= passingScore) {
      setQuizPhase('passed');
      onQuizPass(pct, selectedAnswers);
    } else {
      setQuizPhase('failed');
    }
  };

  const handleRetry = () => {
    setSelectedAnswers({});
    setScore(null);
    setAttemptNumber(prev => prev + 1);
    setQuizPhase('idle');
    // Scroll back to scenario so learner re-reads before retrying
    quizRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const allAnswered = hasQuiz
    ? Object.keys(selectedAnswers).length === quizQuestions.length
    : false;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-10">

      {/* ── 1. VIDEO DEMO ─────────────────────────────────────────────────── */}
      {hasVideo && (
        <section aria-label="Lesson video">
          <div className="flex items-center gap-2 mb-3">
            <Play className="w-4 h-4 text-brand-blue-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-brand-blue-600">
              Watch First
            </span>
          </div>
          <div className="rounded-xl overflow-hidden bg-slate-900 aspect-video">
            {videoUrl!.includes('youtube.com') || videoUrl!.includes('youtu.be') ? (
              <iframe
                src={videoUrl!.replace('watch?v=', 'embed/').replace('youtu.be/', 'www.youtube.com/embed/')}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={`${title} — demo video`}
                onLoad={() => setVideoWatched(true)}
              />
            ) : (
              <video
                src={videoUrl!}
                controls
                className="w-full h-full"
                onEnded={() => setVideoWatched(true)}
              >
                <track kind="captions" />
              </video>
            )}
          </div>
          {!videoWatched && (
            <p className="text-xs text-slate-500 mt-2">
              Watch the demo before continuing.
            </p>
          )}
        </section>
      )}

      {/* ── 2. CORE CONTENT ───────────────────────────────────────────────── */}
      {content && (
        <section aria-label="Lesson content">
          <div
            className="prose prose-slate max-w-none"
            dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(content) }}
          />
        </section>
      )}

      {!content && !hasVideo && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
          <div className="flex items-center gap-2 text-amber-700 mb-2">
            <BookOpen className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium">Lesson content not yet published</span>
          </div>
          <p className="text-amber-600 text-sm">
            This lesson is part of the course structure but its content has not been
            published yet. Check back soon or contact your instructor.
          </p>
        </div>
      )}

      {/* ── 3. KEY TERMS ──────────────────────────────────────────────────── */}
      {hasKeyTerms && (
        <section aria-label="Key terms">
          <button
            onClick={() => setTermsExpanded(e => !e)}
            className="w-full flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-slate-500" />
              <span className="font-semibold text-slate-700 text-sm">
                Key Terms ({keyTerms.length})
              </span>
            </div>
            {termsExpanded
              ? <ChevronUp className="w-4 h-4 text-slate-400" />
              : <ChevronDown className="w-4 h-4 text-slate-400" />
            }
          </button>
          {termsExpanded && (
            <div className="mt-2 border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
              {keyTerms.map((kt, i) => (
                <div key={i} className="px-4 py-3 bg-white">
                  <span className="font-semibold text-slate-900 text-sm">{kt.term}</span>
                  <p className="text-slate-600 text-sm mt-0.5">{kt.definition}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── 4. SCENARIO ───────────────────────────────────────────────────── */}
      {hasScenario && (
        <section aria-label="Applied scenario" ref={quizRef}>
          <div className="rounded-xl border-l-4 border-brand-orange-500 bg-orange-50 p-6">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-brand-orange-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-brand-orange-600">
                Applied Scenario
              </span>
            </div>
            <p className="text-slate-800 text-sm leading-relaxed">{scenarioPrompt}</p>
            {hasQuiz && quizPhase === 'idle' && (
              <p className="text-slate-500 text-xs mt-3">
                Read this carefully — the quiz below tests your reasoning on this scenario.
              </p>
            )}
          </div>
        </section>
      )}

      {/* ── 5. QUIZ ───────────────────────────────────────────────────────── */}
      {hasQuiz && quizPhase !== 'passed' && (
        <section aria-label="Quick check quiz">
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center justify-between">
              <span className="font-bold text-slate-800 text-sm">
                Quick Check — {quizQuestions.length} Questions
              </span>
              <span className="text-xs text-slate-500">
                Pass {passingScore}% to continue
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {quizQuestions.map((q, qi) => {
                const selected = selectedAnswers[q.id];
                const isSubmitted = quizPhase === 'submitted' || quizPhase === 'failed';
                const isCorrect = isSubmitted && selected === q.correctAnswer;
                const isWrong = isSubmitted && selected !== undefined && selected !== q.correctAnswer;

                return (
                  <div key={q.id} className="p-5">
                    <p className="font-semibold text-slate-900 text-sm mb-3">
                      {qi + 1}. {q.question}
                    </p>
                    <div className="space-y-2">
                      {q.options.map((opt, oi) => {
                        const isSelected = selected === oi;
                        const showCorrect = isSubmitted && oi === q.correctAnswer;
                        const showWrong = isSubmitted && isSelected && oi !== q.correctAnswer;

                        return (
                          <button
                            key={oi}
                            onClick={() => handleAnswerSelect(q.id, oi)}
                            disabled={isSubmitted}
                            className={`w-full text-left px-4 py-2.5 rounded-lg border text-sm transition ${
                              showCorrect
                                ? 'bg-green-50 border-green-400 text-green-800 font-medium'
                                : showWrong
                                ? 'bg-red-50 border-red-400 text-red-800'
                                : isSelected
                                ? 'bg-brand-blue-50 border-brand-blue-400 text-brand-blue-900'
                                : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                    {/* Explanation shown after submit */}
                    {isSubmitted && q.explanation && (
                      <p className={`mt-3 text-xs px-3 py-2 rounded-lg ${
                        isCorrect
                          ? 'bg-green-50 text-green-700'
                          : 'bg-red-50 text-red-700'
                      }`}>
                        {isCorrect ? '✓ ' : '✗ '}{q.explanation}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Submit / result bar */}
            <div className="bg-slate-50 border-t border-slate-200 px-5 py-4">
              {quizPhase === 'failed' ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-red-700 text-sm">
                      Score: {score}% — Need {passingScore}% to pass
                    </p>
                    <p className="text-red-600 text-xs mt-0.5">
                      Review the scenario and explanations above, then try again.
                    </p>
                  </div>
                  <button
                    onClick={handleRetry}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-semibold hover:bg-slate-700 transition"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Retry (Attempt {attemptNumber + 1})
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!allAnswered}
                  className={`w-full py-3 rounded-lg font-semibold text-sm transition ${
                    allAnswered
                      ? 'bg-brand-blue-600 hover:bg-brand-blue-700 text-white'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {allAnswered
                    ? `Submit Answers`
                    : `Answer all ${quizQuestions.length} questions to submit`}
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── 6. PASSED STATE ───────────────────────────────────────────────── */}
      {(quizPhase === 'passed' || alreadyPassed) && hasQuiz && (
        <section aria-label="Lesson complete">
          <div className="rounded-xl bg-green-50 border border-green-200 p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-bold text-green-900 text-sm">
                {score !== null ? `Passed — ${score}%` : 'Lesson Complete'}
              </p>
              <p className="text-green-700 text-xs mt-0.5">
                Next lesson is unlocked. Use the navigation below to continue.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* No quiz — lesson completes on content read (existing behavior) */}
      {!hasQuiz && (
        <div className="text-xs text-slate-400 text-center pt-2">
          No quiz for this lesson — mark complete using the button above.
        </div>
      )}

    </div>
  );
}
