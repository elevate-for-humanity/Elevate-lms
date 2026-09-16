'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Clock3, Loader2 } from 'lucide-react';

type QuizQuestion = {
  id?: string;
  question?: string;
  question_text?: string;
  options?: unknown[];
  correctAnswer?: number;
  correct_answer?: number | string;
  explanation?: string;
};

interface Props {
  courseId: string;
  lessonId: string;
  lessonType: string;
  moduleOrder: number;
  passingScore: number;
  questions: QuizQuestion[];
}

export default function LessonProgressClient({
  courseId,
  lessonId,
  lessonType,
  moduleOrder,
  passingScore,
  questions,
}: Props) {
  const startedAt = useRef(Date.now());
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [theoryStatus, setTheoryStatus] = useState<'starting' | 'active' | 'paused' | 'untracked'>('starting');
  const [theoryMessage, setTheoryMessage] = useState('Starting active theory tracking…');
  const [weeklyTheorySeconds, setWeeklyTheorySeconds] = useState(0);
  const theorySessionId = useRef<string | null>(null);
  const lastActivityAt = useRef(Date.now());
  const startingTheorySession = useRef(false);

  const startTheorySession = useCallback(async () => {
    if (startingTheorySession.current || theorySessionId.current || document.hidden) return;
    startingTheorySession.current = true;
    try {
      const response = await fetch('/api/theory/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', courseId, lessonId }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setTheoryStatus('paused');
        setTheoryMessage(data.error || 'Theory tracking is paused.');
        return;
      }
      if (!data.tracked) {
        setTheoryStatus('untracked');
        setTheoryMessage('Standard course progress tracking is active.');
        return;
      }
      theorySessionId.current = data.sessionId;
      setWeeklyTheorySeconds(Number(data.weeklyActiveSeconds || 0));
      setTheoryStatus('active');
      setTheoryMessage('Active lesson time is being recorded for RTI review.');
    } finally {
      startingTheorySession.current = false;
    }
  }, [courseId, lessonId]);

  const stopTheorySession = useCallback((creditFinal = false) => {
    const sessionId = theorySessionId.current;
    if (!sessionId) return;
    theorySessionId.current = null;
    void fetch('/api/theory/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'stop', sessionId, creditFinal }),
      keepalive: true,
    });
  }, []);

  useEffect(() => {
    void startTheorySession();
    const noteActivity = () => {
      lastActivityAt.current = Date.now();
      if (!theorySessionId.current && !document.hidden) void startTheorySession();
    };
    const handleVisibility = () => {
      if (document.hidden) {
        stopTheorySession(true);
        setTheoryStatus((status) => (status === 'untracked' ? status : 'paused'));
        setTheoryMessage('Theory tracking paused while this lesson is not visible.');
      } else {
        lastActivityAt.current = Date.now();
        void startTheorySession();
      }
    };
    const activityEvents: (keyof WindowEventMap)[] = ['pointerdown', 'keydown', 'scroll', 'touchstart'];
    activityEvents.forEach((event) => window.addEventListener(event, noteActivity, { passive: true }));
    document.addEventListener('visibilitychange', handleVisibility);

    const heartbeat = window.setInterval(async () => {
      const sessionId = theorySessionId.current;
      if (!sessionId || document.hidden) return;
      if (Date.now() - lastActivityAt.current > 90_000) {
        stopTheorySession(false);
        setTheoryStatus('paused');
        setTheoryMessage('Theory tracking paused after inactivity. Interact with the lesson to resume.');
        return;
      }
      const response = await fetch('/api/theory/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'heartbeat', sessionId }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.status !== 'active') {
        theorySessionId.current = null;
        setTheoryStatus('paused');
        setTheoryMessage(data.message || data.error || 'Theory tracking is paused.');
        return;
      }
      setWeeklyTheorySeconds(Number(data.weeklyActiveSeconds || 0));
    }, 60_000);

    return () => {
      window.clearInterval(heartbeat);
      activityEvents.forEach((event) => window.removeEventListener(event, noteActivity));
      document.removeEventListener('visibilitychange', handleVisibility);
      stopTheorySession(true);
    };
  }, [startTheorySession, stopTheorySession]);

  const isGated = lessonType === 'checkpoint' || lessonType === 'exam';
  const normalized = useMemo(
    () =>
      questions.map((q, index) => ({
        id: q.id || `q-${index + 1}`,
        text: q.question || q.question_text || `Question ${index + 1}`,
        options: Array.isArray(q.options) ? q.options.map(String) : [],
        correctIndex:
          typeof q.correctAnswer === 'number'
            ? q.correctAnswer
            : typeof q.correct_answer === 'number'
              ? q.correct_answer
              : Number(q.correct_answer),
        explanation: q.explanation || '',
      })),
    [questions],
  );

  async function markComplete() {
    stopTheorySession(true);
    const elapsed = Math.max(120, Math.floor((Date.now() - startedAt.current) / 1000));
    const response = await fetch(`/api/courses/${courseId}/lessons/${lessonId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timeSpentSeconds: elapsed }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || data.error || 'Unable to mark lesson complete.');
    }
    setCompleted(true);
    return data;
  }

  async function submitCheckpoint() {
    if (normalized.length === 0) {
      setResult('This assessment has no questions configured. Contact your instructor.');
      return;
    }
    if (Object.keys(answers).length !== normalized.length) {
      setResult('Answer every question before submitting.');
      return;
    }

    setSaving(true);
    setResult('');
    try {
      let correct = 0;
      for (const q of normalized) {
        if (answers[q.id] === q.correctIndex) correct += 1;
      }
      const score = Math.round((correct / normalized.length) * 100);

      const response = await fetch(`/api/lessons/${lessonId}/checkpoint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          moduleOrder,
          score,
          passingScore,
          answers,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Assessment could not be recorded.');

      if (!data.passed) {
        setResult(`Score: ${score}%. You need ${passingScore}% to pass. Review the lesson and try again.`);
        return;
      }

      await markComplete();
      setResult(`Passed with ${score}%. This checkpoint is complete.`);
    } catch (error) {
      setResult(error instanceof Error ? error.message : 'Unable to save assessment.');
    } finally {
      setSaving(false);
    }
  }

  async function completeStandardLesson() {
    setSaving(true);
    setResult('');
    try {
      await markComplete();
      setResult('Lesson completed and progress saved.');
    } catch (error) {
      setResult(error instanceof Error ? error.message : 'Unable to save progress.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className={`mb-5 rounded-xl border p-4 ${theoryStatus === 'active' ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
        <p className="flex items-center gap-2 text-sm font-extrabold text-slate-950">
          <Clock3 className="h-4 w-4" /> Theory activity
          <span className="ml-auto">{(weeklyTheorySeconds / 3600).toFixed(2)} / 10.00 hours this week</span>
        </p>
        <p className="mt-1 text-sm font-semibold text-slate-700">{theoryMessage}</p>
      </div>
      {isGated ? (
        <>
          <h2 className="text-xl font-extrabold text-slate-950">
            {lessonType === 'exam' ? 'Final exam' : 'Module checkpoint'}
          </h2>
          <p className="mt-2 text-sm font-medium leading-6 text-slate-700">
            Passing score: {passingScore}%. Your attempt is recorded by the LMS checkpoint engine and controls access to the next module.
          </p>
          <div className="mt-6 space-y-6">
            {normalized.map((q, questionIndex) => (
              <fieldset key={q.id} className="rounded-xl border border-slate-200 p-5">
                <legend className="px-1 font-bold text-slate-950">
                  {questionIndex + 1}. {q.text}
                </legend>
                <div className="mt-3 space-y-2">
                  {q.options.map((option, optionIndex) => (
                    <label key={optionIndex} className="flex cursor-pointer items-start gap-3 rounded-lg bg-slate-50 px-4 py-3 font-medium text-slate-800 hover:bg-slate-100">
                      <input
                        type="radio"
                        name={q.id}
                        value={optionIndex}
                        checked={answers[q.id] === optionIndex}
                        onChange={() => setAnswers((current) => ({ ...current, [q.id]: optionIndex }))}
                        className="mt-1"
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
          <button
            type="button"
            onClick={submitCheckpoint}
            disabled={saving || completed}
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-cyan-700 px-6 py-3 font-bold text-white hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {completed ? 'Completed' : 'Submit assessment'}
          </button>
        </>
      ) : (
        <>
          <h2 className="text-xl font-extrabold text-slate-950">Lesson progress</h2>
          <p className="mt-2 text-sm font-medium leading-6 text-slate-700">
            Finish the lesson content and video before saving completion. The LMS server enforces enrollment, sequencing, and minimum engagement requirements.
          </p>
          <button
            type="button"
            onClick={completeStandardLesson}
            disabled={saving || completed}
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-cyan-700 px-6 py-3 font-bold text-white hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : completed ? <CheckCircle2 className="mr-2 h-4 w-4" /> : null}
            {completed ? 'Completed' : 'Mark lesson complete'}
          </button>
        </>
      )}

      {result ? (
        <p className={`mt-4 rounded-lg px-4 py-3 text-sm font-bold ${completed ? 'bg-emerald-50 text-emerald-900' : 'bg-amber-50 text-amber-950'}`}>
          {result}
        </p>
      ) : null}
    </section>
  );
}
