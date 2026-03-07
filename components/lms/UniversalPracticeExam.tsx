'use client';

/**
 * EPA 608 Universal Practice Exam
 *
 * Mirrors the real ESCO Universal exam: 100 questions across all 4 sections
 * (Core, Type I, Type II, Type III), 25 questions each, 70% required per section.
 * A student must pass ALL 4 sections to earn Universal certification.
 *
 * This is the most important exam component — Universal is what employers require.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Clock, CheckCircle, XCircle, AlertTriangle, RotateCcw, ChevronRight, Flag, Trophy, BookOpen } from 'lucide-react';
import { HVAC_QUIZ_BANKS } from '@/lib/courses/hvac-quiz-banks';

const STORAGE_KEY = 'hvac-missed-questions';

const SECTIONS = [
  { id: 'hvac-06', label: 'Core',   color: 'brand-blue',  description: 'Refrigerant regulations, ozone, GWP, certification rules' },
  { id: 'hvac-07', label: 'Type I',  color: 'purple',      description: 'Small appliances — 5 lbs or less, household refrigerators, window ACs' },
  { id: 'hvac-08', label: 'Type II', color: 'brand-orange', description: 'High-pressure systems — R-410A, R-22, split systems, package units' },
  { id: 'hvac-09', label: 'Type III', color: 'teal',       description: 'Low-pressure chillers — R-123, centrifugal chillers, purge units' },
] as const;

type SectionId = typeof SECTIONS[number]['id'];

interface ExamQuestion {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
  sectionId: SectionId;
  sectionLabel: string;
  globalIndex: number;
}

type ExamState = 'intro' | 'active' | 'results';

function formatTime(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  return `${m}:${(s % 60).toString().padStart(2, '0')}`;
}

function buildExam(): ExamQuestion[] {
  const questions: ExamQuestion[] = [];
  let globalIndex = 0;
  for (const section of SECTIONS) {
    const bank = HVAC_QUIZ_BANKS[section.id] ?? [];
    const slice = bank.slice(0, 25);
    for (const q of slice) {
      questions.push({
        question: q.question,
        options: q.options,
        answer: q.answer,
        explanation: q.explanation,
        sectionId: section.id,
        sectionLabel: section.label,
        globalIndex: globalIndex++,
      });
    }
  }
  return questions;
}

const EXAM_QUESTIONS = buildExam(); // built once at module load

export default function UniversalPracticeExam() {
  const [state, setState] = useState<ExamState>('intro');
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState(120 * 60); // 2 hours
  const [timeTaken, setTimeTaken] = useState(0);
  const [activeSection, setActiveSection] = useState<SectionId | 'all'>('all');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const finish = useCallback((forced = false) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeTaken(forced ? 120 * 60 : 120 * 60 - timeLeft);
    setState('results');
  }, [timeLeft]);

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

  // Save missed questions on results
  useEffect(() => {
    if (state !== 'results') return;
    const missed = EXAM_QUESTIONS.filter(q => answers[q.globalIndex] !== q.answer);
    if (!missed.length) return;
    try {
      const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      const now = Date.now();
      const newEntries = missed.map(q => ({
        ...q,
        missedAt: now,
        reviewAfter: now + 24 * 60 * 60 * 1000,
        source: `EPA 608 Universal — ${q.sectionLabel}`,
      }));
      const merged = [
        ...existing.filter((e: any) => !newEntries.some((n: any) => n.question === e.question)),
        ...newEntries,
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    } catch { /* ignore */ }
  }, [state, answers]);

  // Per-section scores
  const sectionScores = SECTIONS.map(sec => {
    const qs = EXAM_QUESTIONS.filter(q => q.sectionId === sec.id);
    const correct = qs.filter(q => answers[q.globalIndex] === q.answer).length;
    const pct = Math.round((correct / qs.length) * 100);
    return { ...sec, correct, total: qs.length, pct, passed: pct >= 70 };
  });

  const totalCorrect = EXAM_QUESTIONS.filter(q => answers[q.globalIndex] === q.answer).length;
  const totalPct = Math.round((totalCorrect / EXAM_QUESTIONS.length) * 100);
  const allPassed = sectionScores.every(s => s.passed);
  const answered = Object.keys(answers).length;
  const timeWarning = timeLeft < 600; // under 10 min

  // Filtered view
  const visibleQuestions = activeSection === 'all'
    ? EXAM_QUESTIONS
    : EXAM_QUESTIONS.filter(q => q.sectionId === activeSection);

  // ── Intro ──────────────────────────────────────────────────────────────
  if (state === 'intro') {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-brand-blue-100 rounded-xl flex items-center justify-center">
            <Trophy className="w-6 h-6 text-brand-blue-600" />
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-lg">EPA 608 Universal Practice Exam</h3>
            <p className="text-sm text-slate-500">Full mock exam — all 4 sections</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-center">
          {[
            { label: 'Questions', value: '100' },
            { label: 'Time Limit', value: '2 hours' },
            { label: 'Sections', value: '4' },
            { label: 'To Pass Each', value: '70%' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <p className="text-2xl font-black text-slate-900">{value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          {SECTIONS.map(sec => (
            <div key={sec.id} className="flex items-start gap-3 bg-slate-50 rounded-xl p-3 border border-slate-100">
              <div className="w-16 flex-shrink-0">
                <span className="text-xs font-black text-slate-700 bg-slate-200 px-2 py-0.5 rounded-full">{sec.label}</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{sec.description}</p>
            </div>
          ))}
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 space-y-1">
          <p className="font-bold flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Real exam rules</p>
          <p>• You must score 70%+ on EACH section — not just overall.</p>
          <p>• The real ESCO exam is also 100 questions across 4 sections.</p>
          <p>• You can navigate between sections using the section tabs.</p>
          <p>• Missed questions are saved for spaced repetition review.</p>
        </div>

        <button
          onClick={() => setState('active')}
          className="w-full py-4 bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-black text-lg rounded-xl transition flex items-center justify-center gap-2"
        >
          Begin Universal Exam <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    );
  }

  // ── Results ────────────────────────────────────────────────────────────
  if (state === 'results') {
    return (
      <div className="space-y-5">
        {/* Overall result */}
        <div className={`rounded-2xl p-6 text-center border ${allPassed ? 'bg-brand-green-50 border-brand-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center justify-center gap-2 mb-2">
            {allPassed ? <Trophy className="w-8 h-8 text-brand-green-600" /> : <XCircle className="w-8 h-8 text-red-600" />}
          </div>
          <p className={`text-5xl font-black mb-1 ${allPassed ? 'text-brand-green-700' : 'text-red-700'}`}>{totalPct}%</p>
          <p className={`text-xl font-bold ${allPassed ? 'text-brand-green-800' : 'text-red-800'}`}>
            {allPassed ? 'UNIVERSAL PASS' : 'NOT PASSING'}
          </p>
          <p className="text-sm text-slate-600 mt-1">{totalCorrect}/100 correct · {formatTime(timeTaken)}</p>
          {!allPassed && (
            <p className="text-sm text-slate-600 mt-2">
              You must pass all 4 sections. See which sections need work below.
            </p>
          )}
        </div>

        {/* Section breakdown */}
        <div className="grid grid-cols-2 gap-3">
          {sectionScores.map(sec => (
            <div key={sec.id} className={`rounded-xl p-4 border text-center ${sec.passed ? 'bg-brand-green-50 border-brand-green-200' : 'bg-red-50 border-red-200'}`}>
              <p className="text-xs font-bold text-slate-500 uppercase mb-1">{sec.label}</p>
              <p className={`text-3xl font-black ${sec.passed ? 'text-brand-green-700' : 'text-red-700'}`}>{sec.pct}%</p>
              <p className="text-xs text-slate-600 mt-0.5">{sec.correct}/{sec.total}</p>
              <p className={`text-xs font-bold mt-1 ${sec.passed ? 'text-brand-green-700' : 'text-red-700'}`}>
                {sec.passed ? 'PASS' : 'FAIL'}
              </p>
            </div>
          ))}
        </div>

        {/* Missed questions by section */}
        {SECTIONS.map(sec => {
          const missed = EXAM_QUESTIONS.filter(q => q.sectionId === sec.id && answers[q.globalIndex] !== q.answer);
          if (!missed.length) return (
            <div key={sec.id} className="bg-brand-green-50 border border-brand-green-200 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-brand-green-600 flex-shrink-0" />
              <p className="text-sm font-semibold text-brand-green-800">{sec.label} — Perfect score, all 25 correct.</p>
            </div>
          );
          return (
            <div key={sec.id} className="space-y-3">
              <p className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-slate-500" />
                {sec.label} — {missed.length} missed
              </p>
              {missed.map((q, i) => (
                <div key={i} className="bg-white border border-red-200 rounded-xl p-4 space-y-3">
                  <p className="font-semibold text-slate-900 text-sm">{q.question}</p>
                  <div className="space-y-1.5">
                    {q.options.map((opt, oi) => (
                      <div key={oi} className={`text-sm px-3 py-2 rounded-lg ${
                        oi === q.answer ? 'bg-brand-green-50 text-brand-green-800 font-semibold border border-brand-green-200' :
                        oi === answers[q.globalIndex] ? 'bg-red-50 text-red-700 border border-red-200' :
                        'text-slate-400'
                      }`}>
                        <span className="font-bold mr-2">{String.fromCharCode(65 + oi)}.</span>{opt}
                      </div>
                    ))}
                  </div>
                  <div className="bg-slate-50 rounded-lg px-3 py-2 text-xs text-slate-600">
                    <span className="font-bold">Why: </span>{q.explanation}
                  </div>
                </div>
              ))}
            </div>
          );
        })}

        <button
          onClick={() => { setState('intro'); setCurrent(0); setAnswers({}); setFlagged(new Set()); setTimeLeft(120 * 60); setActiveSection('all'); }}
          className="w-full flex items-center justify-center gap-2 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition"
        >
          <RotateCcw className="w-4 h-4" /> Retake Exam
        </button>
      </div>
    );
  }

  // ── Active exam ────────────────────────────────────────────────────────
  const q = EXAM_QUESTIONS[current];
  const userAnswer = answers[current];

  return (
    <div className="space-y-4">
      {/* Timer */}
      <div className={`flex items-center justify-between px-4 py-3 rounded-xl border ${timeWarning ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
        <div className="flex items-center gap-2">
          <Clock className={`w-4 h-4 ${timeWarning ? 'text-red-600 animate-pulse' : 'text-slate-500'}`} />
          <span className={`font-black text-lg tabular-nums ${timeWarning ? 'text-red-700' : 'text-slate-900'}`}>{formatTime(timeLeft)}</span>
          {timeWarning && <span className="text-xs text-red-600 font-semibold">Under 10 minutes!</span>}
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">{answered}/100 answered</p>
          <p className="text-xs text-slate-400">Q{current + 1} — {q.sectionLabel}</p>
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {(['all', ...SECTIONS.map(s => s.id)] as const).map(sid => {
          const label = sid === 'all' ? 'All' : SECTIONS.find(s => s.id === sid)!.label;
          const isActive = activeSection === sid;
          const sectionQs = sid === 'all' ? EXAM_QUESTIONS : EXAM_QUESTIONS.filter(q => q.sectionId === sid);
          const sectionAnswered = sectionQs.filter(q => answers[q.globalIndex] !== undefined).length;
          return (
            <button
              key={sid}
              onClick={() => {
                setActiveSection(sid);
                const firstUnanswered = sectionQs.find(q => answers[q.globalIndex] === undefined);
                if (firstUnanswered) setCurrent(firstUnanswered.globalIndex);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                isActive ? 'bg-brand-blue-600 text-white border-brand-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-brand-blue-300'
              }`}
            >
              {label} ({sectionAnswered}/{sectionQs.length})
            </button>
          );
        })}
      </div>

      {/* Progress dots for current section */}
      <div className="flex flex-wrap gap-1">
        {visibleQuestions.map((vq) => (
          <button
            key={vq.globalIndex}
            onClick={() => setCurrent(vq.globalIndex)}
            className={`w-6 h-6 rounded text-xs font-bold transition ${
              vq.globalIndex === current ? 'bg-brand-blue-600 text-white' :
              flagged.has(vq.globalIndex) ? 'bg-amber-200 text-amber-800' :
              answers[vq.globalIndex] !== undefined ? 'bg-brand-green-100 text-brand-green-700' :
              'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            {vq.globalIndex + 1}
          </button>
        ))}
      </div>

      {/* Question */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">{q.sectionLabel} · Q{current + 1}</span>
            <p className="font-bold text-slate-900 text-sm leading-relaxed mt-1">{q.question}</p>
          </div>
          <button
            onClick={() => setFlagged(f => { const n = new Set(f); n.has(current) ? n.delete(current) : n.add(current); return n; })}
            className={`flex-shrink-0 p-1.5 rounded-lg transition ${flagged.has(current) ? 'bg-amber-100 text-amber-700' : 'text-slate-300 hover:text-amber-500'}`}
          >
            <Flag className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-2">
          {q.options.map((opt, oi) => (
            <button
              key={oi}
              onClick={() => setAnswers(a => ({ ...a, [current]: oi }))}
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
          ← Prev
        </button>
        {current < EXAM_QUESTIONS.length - 1 ? (
          <button
            onClick={() => setCurrent(c => c + 1)}
            className="flex-1 py-2.5 bg-brand-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-brand-blue-700 transition"
          >
            Next →
          </button>
        ) : (
          <button
            onClick={() => finish()}
            className="flex-1 py-2.5 bg-brand-green-600 text-white rounded-xl font-bold text-sm hover:bg-brand-green-700 transition"
          >
            Submit All 100
          </button>
        )}
      </div>

      {answered < EXAM_QUESTIONS.length && current === EXAM_QUESTIONS.length - 1 && (
        <p className="text-xs text-amber-700 text-center">
          {EXAM_QUESTIONS.length - answered} question{EXAM_QUESTIONS.length - answered > 1 ? 's' : ''} unanswered — use the section tabs to find them.
        </p>
      )}
    </div>
  );
}
