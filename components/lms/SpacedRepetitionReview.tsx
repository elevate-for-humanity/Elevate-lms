'use client';

/**
 * Spaced Repetition Review
 *
 * Reads missed questions from localStorage (written by TimedPracticeExam and QuizPractice).
 * Shows a review prompt when questions are due (24h after they were missed).
 * After a correct answer the question is rescheduled 48h out; after two correct answers it is removed.
 *
 * The 24-hour spacing is based on the Ebbinghaus forgetting curve — reviewing at the point
 * of near-forgetting produces stronger long-term retention than immediate re-study.
 */

import React, { useState, useEffect } from 'react';
import { Brain, CheckCircle, XCircle, Clock, ChevronRight, X } from 'lucide-react';

const STORAGE_KEY = 'hvac-missed-questions';

interface StoredQuestion {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
  source?: string;
  missedAt: number;
  reviewAfter: number;
  correctStreak?: number;
}

type ReviewState = 'idle' | 'reviewing' | 'answered' | 'done';

export default function SpacedRepetitionReview() {
  const [due, setDue] = useState<StoredQuestion[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const [state, setState] = useState<ReviewState>('idle');
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [results, setResults] = useState<boolean[]>([]);

  useEffect(() => {
    try {
      const stored: StoredQuestion[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      const now = Date.now();
      const dueNow = stored.filter(q => q.reviewAfter <= now);
      setDue(dueNow);
    } catch { /* localStorage unavailable */ }
  }, []);

  const handleAnswer = (oi: number) => {
    if (state === 'answered') return;
    setSelected(oi);
    setState('answered');
    const isCorrect = oi === due[current].answer;
    setResults(r => [...r, isCorrect]);

    // Update storage
    try {
      const stored: StoredQuestion[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      const now = Date.now();
      const updated = stored.map(q => {
        if (q.question !== due[current].question) return q;
        const streak = (q.correctStreak || 0) + (isCorrect ? 1 : 0);
        if (streak >= 2) return null; // mastered — remove
        return {
          ...q,
          correctStreak: streak,
          reviewAfter: isCorrect ? now + 48 * 60 * 60 * 1000 : now + 12 * 60 * 60 * 1000,
        };
      }).filter(Boolean) as StoredQuestion[];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch { /* ignore */ }
  };

  const next = () => {
    if (current + 1 >= due.length) {
      setState('done');
    } else {
      setCurrent(c => c + 1);
      setSelected(null);
      setState('reviewing');
    }
  };

  if (!due.length || dismissed) return null;

  const q = due[current];
  const correctCount = results.filter(Boolean).length;

  // ── Prompt banner ──────────────────────────────────────────────────────
  if (state === 'idle') {
    return (
      <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-2xl p-4 flex items-start gap-3">
        <div className="w-9 h-9 bg-brand-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <Brain className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-brand-blue-900 text-sm">
            {due.length} question{due.length > 1 ? 's' : ''} ready for review
          </p>
          <p className="text-xs text-brand-blue-700 mt-0.5">
            These are questions you missed previously. Reviewing them now locks them into long-term memory.
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setState('reviewing')}
              className="px-4 py-2 bg-brand-blue-600 text-white text-xs font-bold rounded-lg hover:bg-brand-blue-700 transition flex items-center gap-1.5"
            >
              Review now <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="px-4 py-2 bg-white text-brand-blue-700 text-xs font-semibold rounded-lg border border-brand-blue-200 hover:bg-brand-blue-50 transition"
            >
              Later
            </button>
          </div>
        </div>
        <button onClick={() => setDismissed(true)} className="text-brand-blue-400 hover:text-brand-blue-600 flex-shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // ── Done ───────────────────────────────────────────────────────────────
  if (state === 'done') {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-5 text-center space-y-3">
        <div className="w-12 h-12 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-6 h-6 text-brand-green-600" />
        </div>
        <p className="font-bold text-slate-900">Review complete</p>
        <p className="text-sm text-slate-600">
          {correctCount}/{due.length} correct.{' '}
          {correctCount === due.length
            ? 'All mastered — these questions are removed from your review queue.'
            : 'Incorrect answers will come back in 12 hours.'}
        </p>
        <button
          onClick={() => setDismissed(true)}
          className="px-5 py-2 bg-slate-800 text-white text-sm font-semibold rounded-xl hover:bg-slate-900 transition"
        >
          Close
        </button>
      </div>
    );
  }

  // ── Question ───────────────────────────────────────────────────────────
  const isAnswered = state === 'answered';
  const isCorrect = selected === q.answer;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-brand-blue-600" />
          <span className="text-sm font-bold text-slate-900">Spaced Review</span>
          {q.source && <span className="text-xs text-slate-400">· {q.source}</span>}
        </div>
        <span className="text-xs text-slate-400">{current + 1} / {due.length}</span>
      </div>

      {/* Progress */}
      <div className="w-full bg-slate-100 rounded-full h-1.5">
        <div
          className="bg-brand-blue-500 h-1.5 rounded-full transition-all"
          style={{ width: `${((current) / due.length) * 100}%` }}
        />
      </div>

      {/* Question */}
      <p className="font-semibold text-slate-900 text-sm leading-relaxed">{q.question}</p>

      {/* Options */}
      <div className="space-y-2">
        {q.options.map((opt, oi) => {
          let cls = 'w-full text-left px-4 py-3 rounded-xl text-sm border transition ';
          if (!isAnswered) {
            cls += 'bg-white text-slate-700 border-slate-200 hover:border-brand-blue-300 hover:bg-brand-blue-50';
          } else if (oi === q.answer) {
            cls += 'bg-brand-green-50 text-brand-green-800 border-brand-green-300 font-semibold';
          } else if (oi === selected) {
            cls += 'bg-red-50 text-red-700 border-red-300';
          } else {
            cls += 'bg-white text-slate-400 border-slate-100';
          }
          return (
            <button key={oi} onClick={() => handleAnswer(oi)} disabled={isAnswered} className={cls}>
              <span className="font-bold mr-2">{String.fromCharCode(65 + oi)}.</span>{opt}
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {isAnswered && (
        <div className={`rounded-xl px-4 py-3 text-sm ${isCorrect ? 'bg-brand-green-50 border border-brand-green-200 text-brand-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
          <div className="flex items-center gap-2 font-bold mb-1">
            {isCorrect ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            {isCorrect ? 'Correct!' : 'Incorrect'}
          </div>
          <p>{q.explanation}</p>
          {!isCorrect && (
            <p className="mt-1 text-xs opacity-80 flex items-center gap-1">
              <Clock className="w-3 h-3" /> This question will return in 12 hours.
            </p>
          )}
          {isCorrect && (
            <p className="mt-1 text-xs opacity-80 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Next review in 48 hours. Two correct answers removes it permanently.
            </p>
          )}
        </div>
      )}

      {isAnswered && (
        <button
          onClick={next}
          className="w-full py-3 bg-brand-blue-600 text-white font-bold rounded-xl hover:bg-brand-blue-700 transition flex items-center justify-center gap-2"
        >
          {current + 1 < due.length ? <>Next <ChevronRight className="w-4 h-4" /></> : 'Finish Review'}
        </button>
      )}
    </div>
  );
}
