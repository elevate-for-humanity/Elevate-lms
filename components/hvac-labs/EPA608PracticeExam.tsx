'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { CheckCircle, XCircle, Clock, RotateCcw, ChevronRight, AlertTriangle } from 'lucide-react';
import {
  EPA608_QUESTIONS,
  EPA608_SECTIONS,
  getQuestionsBySection,
  type EPA608Question,
} from '@/lib/courses/hvac-epa608-prep';

type ExamSection = typeof EPA608_SECTIONS[number]['id'];
type ExamPhase = 'select' | 'exam' | 'review';

export default function EPA608PracticeExam() {
  const [phase, setPhase] = useState<ExamPhase>('select');
  const [section, setSection] = useState<ExamSection>('core');
  const [questions, setQuestions] = useState<EPA608Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startExam = useCallback((sec: ExamSection) => {
    const qs = getQuestionsBySection(sec);
    // Shuffle
    const shuffled = [...qs].sort(() => Math.random() - 0.5);
    setSection(sec);
    setQuestions(shuffled);
    setCurrentIdx(0);
    setAnswers({});
    // 2 minutes per question
    setTimeLeft(shuffled.length * 120);
    setPhase('exam');
  }, []);

  // Timer
  useEffect(() => {
    if (phase !== 'exam') return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setPhase('review');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  const selectAnswer = (qId: string, optIdx: number) => {
    setAnswers((prev) => ({ ...prev, [qId]: optIdx }));
  };

  const finishExam = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase('review');
  };

  const q = questions[currentIdx];
  const answered = q ? answers[q.id] !== undefined : false;
  const totalAnswered = Object.keys(answers).length;
  const correctCount = questions.filter((q) => answers[q.id] === q.answer).length;
  const percentage = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
  const passing = percentage >= 70;

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  // ── Section Select ──
  if (phase === 'select') {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900">EPA 608 Practice Exam</h3>
          <p className="text-sm text-slate-500">Select a section to begin. Pass all four for Universal certification.</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {EPA608_SECTIONS.map((sec) => {
            const qs = getQuestionsBySection(sec.id);
            return (
              <button
                key={sec.id}
                onClick={() => startExam(sec.id)}
                className="text-left bg-white border-2 border-slate-200 rounded-xl p-5 hover:border-brand-blue-400 hover:shadow-md transition"
              >
                <h4 className="font-bold text-slate-800">{sec.title}</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{sec.description}</p>
                <div className="flex items-center gap-3 mt-3">
                  <span className="text-xs bg-brand-blue-50 text-brand-blue-700 px-2 py-0.5 rounded-full font-medium">{qs.length} questions</span>
                  <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-medium">{sec.passingScore}% to pass</span>
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">{qs.length * 2} min</span>
                </div>
              </button>
            );
          })}
        </div>
        <button
          onClick={() => {
            const all = [...EPA608_QUESTIONS].sort(() => Math.random() - 0.5);
            setQuestions(all);
            setCurrentIdx(0);
            setAnswers({});
            setTimeLeft(all.length * 120);
            setSection('core');
            setPhase('exam');
          }}
          className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition"
        >
          Full Universal Exam — All {EPA608_QUESTIONS.length} Questions
        </button>
      </div>
    );
  }

  // ── Review ──
  if (phase === 'review') {
    return (
      <div className="space-y-6">
        {/* Score Card */}
        <div className={`rounded-xl p-6 text-center ${passing ? 'bg-green-50 border-2 border-green-300' : 'bg-red-50 border-2 border-red-300'}`}>
          <div className="text-5xl font-black mb-2">{percentage}%</div>
          <p className={`text-lg font-bold ${passing ? 'text-green-700' : 'text-red-700'}`}>
            {passing ? 'PASS' : 'FAIL'} — {correctCount} of {questions.length} correct
          </p>
          <p className="text-sm text-slate-500 mt-1">70% required to pass</p>
        </div>

        {/* Question Review */}
        <div className="space-y-3">
          {questions.map((q, i) => {
            const studentAnswer = answers[q.id];
            const isCorrect = studentAnswer === q.answer;
            return (
              <div key={q.id} className={`border rounded-xl p-4 ${isCorrect ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50'}`}>
                <div className="flex items-start gap-2">
                  {isCorrect ? <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" /> : <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800">{i + 1}. {q.question}</p>
                    {!isCorrect && (
                      <div className="mt-2 space-y-1">
                        {studentAnswer !== undefined && (
                          <p className="text-xs text-red-600">Your answer: {q.options[studentAnswer]}</p>
                        )}
                        <p className="text-xs text-green-700 font-medium">Correct: {q.options[q.answer]}</p>
                      </div>
                    )}
                    <p className="text-xs text-slate-500 mt-2">{q.explanation}</p>
                    {q.examTip && (
                      <p className="text-xs text-amber-700 mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> {q.examTip}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-3">
          <button onClick={() => setPhase('select')} className="flex-1 bg-slate-800 text-white font-bold py-3 rounded-lg hover:bg-slate-900 transition flex items-center justify-center gap-2">
            <RotateCcw className="w-5 h-5" /> Try Another Section
          </button>
          <button onClick={() => startExam(section)} className="flex-1 bg-brand-blue-600 text-white font-bold py-3 rounded-lg hover:bg-brand-blue-700 transition">
            Retake This Section
          </button>
        </div>
      </div>
    );
  }

  // ── Exam ──
  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-slate-700">Question {currentIdx + 1} of {questions.length}</span>
          <div className="w-32 bg-slate-200 rounded-full h-2">
            <div className="bg-white h-2 rounded-full transition-all" style={{ width: `${(totalAnswered / questions.length) * 100}%` }} />
          </div>
        </div>
        <div className={`flex items-center gap-1.5 text-sm font-bold ${timeLeft < 120 ? 'text-red-600' : 'text-slate-600'}`}>
          <Clock className="w-4 h-4" />
          {mins}:{secs.toString().padStart(2, '0')}
        </div>
      </div>

      {/* Question */}
      {q && (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <p className="text-base font-medium text-slate-900 mb-5">{q.question}</p>
          <div className="space-y-3">
            {q.options.map((opt, optIdx) => {
              const selected = answers[q.id] === optIdx;
              return (
                <button
                  key={optIdx}
                  onClick={() => selectAnswer(q.id, optIdx)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition ${
                    selected
                      ? 'border-brand-blue-500 bg-brand-blue-50 text-brand-blue-800'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      selected ? 'border-brand-blue-500 bg-brand-blue-500 text-white' : 'border-slate-300 text-slate-400'
                    }`}>
                      {String.fromCharCode(65 + optIdx)}
                    </span>
                    <span className="text-sm">{opt}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5 flex-wrap">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIdx(i)}
              className={`w-8 h-8 rounded-full text-xs font-bold transition ${
                i === currentIdx
                  ? 'bg-brand-blue-600 text-white'
                  : answers[questions[i].id] !== undefined
                    ? 'bg-brand-blue-100 text-brand-blue-700'
                    : 'bg-slate-100 text-slate-400'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {currentIdx < questions.length - 1 ? (
            <button
              onClick={() => setCurrentIdx((prev) => prev + 1)}
              className="bg-brand-blue-600 text-white font-bold px-5 py-2.5 rounded-lg hover:bg-brand-blue-700 transition flex items-center gap-1"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={finishExam}
              disabled={totalAnswered < questions.length}
              className="bg-green-600 text-white font-bold px-5 py-2.5 rounded-lg hover:bg-green-700 disabled:bg-slate-300 transition"
            >
              Submit Exam ({totalAnswered}/{questions.length})
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
