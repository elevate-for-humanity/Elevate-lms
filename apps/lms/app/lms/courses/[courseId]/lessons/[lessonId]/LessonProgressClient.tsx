'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useTheoryTimeclock } from '@/lib/lms/useTheoryTimeclock';
import { TheoryTimeclockPanel } from '@/components/lms/TheoryTimeclock';

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
  theoryClockEnabled?: boolean;
  courseId: string;
  lessonId: string;
  lessonType: string;
  moduleOrder: number;
  passingScore: number;
  questions: QuizQuestion[];
}

export default function LessonProgressClient({
  theoryClockEnabled = true,
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
  const clock = useTheoryTimeclock(courseId, lessonId, theoryClockEnabled);
  const [clockTarget, setClockTarget] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setClockTarget(document.getElementById('theory-timeclock-slot'));
  }, []);

  const isGated = ['checkpoint', 'quiz', 'exam'].includes(lessonType);
  const normalized = useMemo(
    () =>
      questions.map((q, index) => ({
        id: q.id || `q-${index + 1}`,
        text: q.question || q.question_text || `Question ${index + 1}`,
        options: Array.isArray(q.options) ? q.options.map(String) : [],
        explanation: q.explanation || '',
      })),
    [questions],
  );

  async function markComplete() {
    await clock.finalize();
    const elapsed = Math.max(0, Math.floor((Date.now() - startedAt.current) / 1000));
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
      const response = await fetch(`/api/lessons/${lessonId}/checkpoint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          moduleOrder,
          answers,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Assessment could not be recorded.');

      const score = Number(data.score);
      if (!data.passed) {
        setResult(
          `Score: ${score}%. You need ${passingScore}% to pass. Review the lesson and try again.`,
        );
        return;
      }

      if (isGated) await markComplete();
      setResult(
        `Passed with ${score}%. ${isGated ? 'This assessment is complete.' : 'Quick-check result saved. Finish the lesson before marking it complete.'}`,
      );
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

  const clockPanel = <TheoryTimeclockPanel clock={clock} />;
  return (
    <>
      {theoryClockEnabled ? (clockTarget ? createPortal(clockPanel, clockTarget) : clockPanel) : null}
      <section
        id="lesson-completion"
        tabIndex={-1}
        className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        {(isGated || normalized.length > 0) && (
          <>
            <h2 className="text-xl font-extrabold text-slate-950">
              {lessonType === 'exam'
                ? 'Final exam'
                : isGated
                  ? 'Module checkpoint'
                  : 'Lesson quick check'}
            </h2>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-700">
              Passing score: {passingScore}%. Your answers are scored and saved by the LMS server.
              {isGated
                ? ' This assessment controls progression.'
                : ' This quick check supports your lesson review.'}
            </p>
            <div className="mt-6 space-y-6">
              {normalized.map((q, questionIndex) => (
                <fieldset key={q.id} className="rounded-xl border border-slate-200 p-5">
                  <legend className="px-1 font-bold text-slate-950">
                    {questionIndex + 1}. {q.text}
                  </legend>
                  <div className="mt-3 space-y-2">
                    {q.options.map((option, optionIndex) => (
                      <label
                        key={optionIndex}
                        className="flex cursor-pointer items-start gap-3 rounded-lg bg-slate-50 px-4 py-3 font-medium text-slate-800 hover:bg-slate-100"
                      >
                        <input
                          type="radio"
                          name={q.id}
                          value={optionIndex}
                          checked={answers[q.id] === optionIndex}
                          onChange={() =>
                            setAnswers((current) => ({ ...current, [q.id]: optionIndex }))
                          }
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
        )}
        {!isGated && (
          <>
            <h2 className="mt-6 text-xl font-extrabold text-slate-950">Lesson progress</h2>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-700">
              Finish the lesson content and video before saving completion. The LMS server enforces
              enrollment, sequencing, and minimum engagement requirements.
            </p>
            <button
              type="button"
              onClick={completeStandardLesson}
              disabled={saving || completed}
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-cyan-700 px-6 py-3 font-bold text-white hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : completed ? (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              ) : null}
              {completed ? 'Completed' : 'Mark lesson complete'}
            </button>
          </>
        )}

        {result ? (
          <p
            className={`mt-4 rounded-lg px-4 py-3 text-sm font-bold ${completed ? 'bg-emerald-50 text-emerald-900' : 'bg-amber-50 text-amber-950'}`}
          >
            {result}
          </p>
        ) : null}
      </section>
    </>
  );
}
