'use client';
import { useCallback, useEffect, useState } from 'react';
import ExamMonitor from '@/components/exam/ExamMonitor';
export default function NativeExam({ attemptId }: { attemptId: string }) {
  const [exam, setExam] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const load = useCallback(async () => {
    const r = await fetch(`/api/exams/native?attemptId=${encodeURIComponent(attemptId)}`, {
      cache: 'no-store',
    });
    const result = await r.json();
    if (!r.ok)
      throw new Error(
        result.error || 'Exam unavailable. Sign in using your assigned candidate account.',
      );
    setExam(result.data);
    setRemaining(Math.max(0, Math.floor((Date.parse(result.data.expiresAt) - Date.now()) / 1000)));
  }, [attemptId]);
  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [load]);
  useEffect(() => {
    if (!exam || exam.submittedAt) return;
    const timer = setInterval(
      () => setRemaining(Math.max(0, Math.floor((Date.parse(exam.expiresAt) - Date.now()) / 1000))),
      1000,
    );
    return () => clearInterval(timer);
  }, [exam]);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/exams/native', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit',
          attemptId,
          answers: Object.entries(answers).map(([position, answer]) => ({
            position: Number(position),
            answer,
          })),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Submission failed');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submission failed');
    } finally {
      setBusy(false);
    }
  }
  if (!exam)
    return (
      <p role="status" className="mt-6">
        {error || 'Loading your exam…'}
      </p>
    );
  if (exam.submittedAt)
    return (
      <section className="mt-6 rounded-xl border p-6">
        <h2 className="text-xl font-bold">{exam.passed ? 'Exam passed' : 'Exam not passed'}</h2>
        <p className="mt-3">
          Your result has been recorded. Passing results require certification review before a card
          is issued.
        </p>
        <ul className="mt-4">
          {Object.entries(exam.sections || {}).map(([section, value]: [string, any]) => (
            <li key={section}>
              {section}: {value.correct}/{value.total} — {value.passed ? 'Passed' : 'Not passed'}
            </li>
          ))}
        </ul>
        <a
          className="mt-4 inline-block font-bold text-blue-700 underline"
          href={`/api/exams/native/card?attemptId=${attemptId}`}
        >
          Check for issued certification card
        </a>
      </section>
    );
  return (
    <form onSubmit={submit} className="mt-6 space-y-6">
      <ExamMonitor examSessionId={exam.sessionId} />
      <div className="sticky top-0 rounded-xl border bg-white p-4">
        <strong>
          Time remaining: {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}
        </strong>
        <p className="mt-2 text-sm">
          Closed-book examination. Your assigned proctor must supervise the session. Unanswered
          questions receive no credit.
        </p>
      </div>
      {error && (
        <p role="alert" className="rounded border border-red-300 p-4">
          {error}
        </p>
      )}
      {exam.questions.map((q: any) => (
        <fieldset key={q.position} className="rounded-xl border p-5">
          <legend className="px-2 font-bold">
            {q.position}. {q.prompt}
          </legend>
          {q.choices.map((choice: string, index: number) => (
            <label key={index} className="my-2 flex gap-3 rounded border p-3">
              <input
                type="radio"
                name={`q-${q.position}`}
                value={index}
                checked={answers[q.position] === index}
                disabled={remaining === 0}
                onChange={() => setAnswers((previous) => ({ ...previous, [q.position]: index }))}
              />
              {choice}
            </label>
          ))}
        </fieldset>
      ))}
      <button disabled={busy} className="rounded-xl bg-blue-700 px-6 py-3 font-bold text-white">
        {busy ? 'Submitting…' : 'Submit exam'}
      </button>
    </form>
  );
}
