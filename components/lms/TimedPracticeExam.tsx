'use client';

/**
 * Timed Practice Exam — mirrors the ESCO EPA 608 exam format.
 *
 * 25 questions, 30-minute countdown, 70% to pass.
 * Saves missed questions to localStorage for spaced repetition review.
 * Students who practice under time pressure perform significantly better
 * on the real exam than those who only do untimed quizzes.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Clock, CheckCircle, XCircle, AlertTriangle, RotateCcw, ChevronRight, Flag } from 'lucide-react';

export interface ExamQuestion {
  id?: string;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}

interface Props {
  questions: ExamQuestion[];
  sectionName: string;           // e.g. "Core", "Type II"
  timeMinutes?: number;          // default 30
  passingScore?: number;         // default 70
  onComplete?: (score: number, passed: boolean, missed: ExamQuestion[]) => void;
}

const STORAGE_KEY = 'hvac-missed-questions';

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

type ExamState = 'intro' | 'active' | 'results';

export default function TimedPracticeExam({
  questions,
  sectionName,
  timeMinutes = 30,
  passingScore = 70,
  onComplete,
}: Props) {
  const [state, setState] = useState<ExamState>('intro');
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState(timeMinutes * 60);
  const [timeTaken, setTimeTaken] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const exam = questions.slice(0, 25);

  const finish = useCallback((forced = false) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const taken = timeMinutes * 60 - timeLeft;
    setTimeTaken(forced ? timeMinutes * 60 : taken);
    setState('results');
  }, [timeLeft, timeMinutes]);

  // Countdown timer
  useEffect(() => {
    if (state !== 'active') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { finish(true); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [state, finish]);

  // Save missed questions to localStorage for spaced repetition
  useEffect(() => {
    if (state !== 'results') return;
    const missed = exam.filter((_, i) => answers[i] !== exam[i].answer);
    if (!missed.length) return;
    try {
      const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      const now = Date.now();
      const newEntries = missed.map(q => ({
        ...q,
        missedAt: now,
        reviewAfter: now + 24 * 60 * 60 * 1000, // 24 hours
        source: `EPA 608 ${sectionName}`,
      }));
      // Deduplicate by question text
      const merged = [
        ...existing.filter((e: any) => !newEntries.some(n => n.question === e.question)),
        ...newEntries,
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    } catch { /* localStorage unavailable */ }

    const score = Math.round((exam.filter((_, i) => answers[i] === exam[i].answer).length / exam.length) * 100);
    onComplete?.(score, score >= passingScore, missed);
  }, [state]);

  const selectAnswer = (qi: number, oi: number) => {
    if (state !== 'active') return;
    setAnswers(a => ({ ...a, [qi]: oi }));
  };

  const toggleFlag = (qi: number) => {
    setFlagged(f => {
      const next = new Set(f);
      next.has(qi) ? next.delete(qi) : next.add(qi);
      return next;
    });
  };

  const score = exam.filter((_, i) => answers[i] === exam[i].answer).length;
  const pct = Math.round((score / exam.length) * 100);
  const passed = pct >= passingScore;
  const answered = Object.keys(answers).length;
  const timeWarning = timeLeft < 300; // under 5 minutes

  // ── Intro ──────────────────────────────────────────────────────────────
  if (state === 'intro') {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-blue-100 rounded-xl flex items-center justify-center">
            <Clock className="w-5 h-5 text-brand-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">EPA 608 Practice Exam — {sectionName}</h3>
            <p className="text-sm text-slate-500">ESCO exam format</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { label: 'Questions', value: '25' },
            { label: 'Time Limit', value: `${timeMinutes} min` },
            { label: 'To Pass', value: `${passingScore}%` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <p className="text-2xl font-black text-slate-900">{value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 space-y-1">
          <p className="font-bold flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Before you start</p>
          <p>• The timer starts immediately when you click Begin.</p>
          <p>• You can flag questions to review before submitting.</p>
          <p>• Missed questions are saved for review tomorrow.</p>
          <p>• The real ESCO exam is also 25 questions, 70% to pass.</p>
        </div>

        <button
          onClick={() => { setTimeLeft(timeMinutes * 60); setState('active'); }}
          className="w-full py-3.5 bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-2"
        >
          Begin Exam <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // ── Results ────────────────────────────────────────────────────────────
  if (state === 'results') {
    const missed = exam.filter((_, i) => answers[i] !== exam[i].answer);
    return (
      <div className="space-y-5">
        {/* Score card */}
        <div className={`rounded-2xl p-6 text-center border ${passed ? 'bg-brand-green-50 border-brand-green-200' : 'bg-red-50 border-red-200'}`}>
          <p className={`text-5xl font-black mb-1 ${passed ? 'text-brand-green-700' : 'text-red-700'}`}>{pct}%</p>
          <p className={`text-lg font-bold ${passed ? 'text-brand-green-800' : 'text-red-800'}`}>
            {passed ? '✅ PASS' : '❌ NOT PASSING'}
          </p>
          <p className="text-sm text-slate-600 mt-1">{score}/{exam.length} correct · Time: {formatTime(timeTaken)}</p>
          <p className="text-sm text-slate-600 mt-2">
            {passed && pct >= 90 ? 'Excellent. You are ready for the real exam.' :
             passed ? 'Passing. Review your missed questions before the real exam.' :
             `You need ${passingScore - pct} more percentage points. Focus on the missed questions below.`}
          </p>
        </div>

        {/* Question review */}
        <div className="space-y-3">
          <p className="font-bold text-slate-900 text-sm">
            {missed.length === 0 ? 'Perfect score — all correct!' : `${missed.length} missed question${missed.length > 1 ? 's' : ''} — review these:`}
          </p>
          {exam.map((q, i) => {
            const userAnswer = answers[i];
            const isCorrect = userAnswer === q.answer;
            if (isCorrect) return null;
            return (
              <div key={i} className="bg-white border border-red-200 rounded-xl p-4 space-y-3">
                <p className="font-semibold text-slate-900 text-sm">{i + 1}. {q.question}</p>
                <div className="space-y-1.5">
                  {q.options.map((opt, oi) => (
                    <div key={oi} className={`text-sm px-3 py-2 rounded-lg ${
                      oi === q.answer ? 'bg-brand-green-50 text-brand-green-800 font-semibold border border-brand-green-200' :
                      oi === userAnswer ? 'bg-red-50 text-red-700 border border-red-200' :
                      'text-slate-500'
                    }`}>
                      <span className="font-bold mr-2">{String.fromCharCode(65 + oi)}.</span>{opt}
                    </div>
                  ))}
                </div>
                <div className="bg-slate-50 rounded-lg px-3 py-2 text-xs text-slate-600">
                  <span className="font-bold">Why: </span>{q.explanation}
                </div>
              </div>
            );
          })}
        </div>

        {missed.length > 0 && (
          <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-xl p-4 text-sm text-brand-blue-800">
            <p className="font-bold mb-1">📅 Spaced repetition active</p>
            <p>{missed.length} missed question{missed.length > 1 ? 's have' : ' has'} been saved. You will be prompted to review them tomorrow — that 24-hour gap improves retention by 40%.</p>
          </div>
        )}

        <button
          onClick={() => { setState('intro'); setCurrent(0); setAnswers({}); setFlagged(new Set()); }}
          className="w-full flex items-center justify-center gap-2 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition"
        >
          <RotateCcw className="w-4 h-4" /> Retake Exam
        </button>
      </div>
    );
  }

  // ── Active exam ────────────────────────────────────────────────────────
  const q = exam[current];
  const userAnswer = answers[current];

  return (
    <div className="space-y-4">
      {/* Timer + progress bar */}
      <div className={`flex items-center justify-between px-4 py-3 rounded-xl border ${timeWarning ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
        <div className="flex items-center gap-2">
          <Clock className={`w-4 h-4 ${timeWarning ? 'text-red-600 animate-pulse' : 'text-slate-500'}`} />
          <span className={`font-black text-lg tabular-nums ${timeWarning ? 'text-red-700' : 'text-slate-900'}`}>
            {formatTime(timeLeft)}
          </span>
          {timeWarning && <span className="text-xs text-red-600 font-semibold">Less than 5 minutes!</span>}
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">{answered}/{exam.length} answered</p>
          <p className="text-xs text-slate-400">{exam.length - answered} remaining</p>
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex flex-wrap gap-1.5">
        {exam.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-7 h-7 rounded-lg text-xs font-bold transition ${
              i === current ? 'bg-brand-blue-600 text-white' :
              flagged.has(i) ? 'bg-amber-200 text-amber-800' :
              answers[i] !== undefined ? 'bg-brand-green-100 text-brand-green-700' :
              'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Question */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <p className="font-bold text-slate-900 text-sm leading-relaxed flex-1">
            <span className="text-brand-blue-600 mr-2">{current + 1}.</span>{q.question}
          </p>
          <button
            onClick={() => toggleFlag(current)}
            title="Flag for review"
            className={`flex-shrink-0 p-1.5 rounded-lg transition ${flagged.has(current) ? 'bg-amber-100 text-amber-700' : 'text-slate-300 hover:text-amber-500 hover:bg-amber-50'}`}
          >
            <Flag className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2">
          {q.options.map((opt, oi) => (
            <button
              key={oi}
              onClick={() => selectAnswer(current, oi)}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm transition border ${
                userAnswer === oi
                  ? 'bg-brand-blue-600 text-white border-brand-blue-600 font-semibold'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-brand-blue-300 hover:bg-brand-blue-50'
              }`}
            >
              <span className="font-bold mr-2">{String.fromCharCode(65 + oi)}.</span>{opt}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-2">
        <button
          onClick={() => setCurrent(c => Math.max(0, c - 1))}
          disabled={current === 0}
          className="flex-1 py-2.5 border border-slate-200 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-50 disabled:opacity-40 transition"
        >
          ← Previous
        </button>
        {current < exam.length - 1 ? (
          <button
            onClick={() => setCurrent(c => c + 1)}
            className="flex-1 py-2.5 bg-brand-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-brand-blue-700 transition"
          >
            Next →
          </button>
        ) : (
          <button
            onClick={() => finish()}
            className="flex-1 py-2.5 bg-brand-green-600 text-white rounded-xl font-semibold text-sm hover:bg-brand-green-700 transition"
          >
            Submit Exam
          </button>
        )}
      </div>

      {/* Flagged reminder */}
      {flagged.size > 0 && (
        <p className="text-xs text-amber-700 text-center">
          {flagged.size} question{flagged.size > 1 ? 's' : ''} flagged for review — click the number to go back.
        </p>
      )}
    </div>
  );
}
