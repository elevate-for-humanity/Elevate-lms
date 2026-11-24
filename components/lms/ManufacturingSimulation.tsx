'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ClipboardCheck, RotateCcw, Save, ShieldCheck } from 'lucide-react';
import type {
  ManufacturingSimulationSpec,
  PublicManufacturingSimulation,
  PublicSimulationTask,
  SimulationAnswer,
  SimulationResponses,
  SimulationResult,
} from '@/lib/lms/manufacturing-simulation';
import { evaluateManufacturingSimulation } from '@/lib/lms/manufacturing-simulation';

export interface ManufacturingPracticeAttempt {
  score: number;
  completed: boolean;
  attempts: number;
  answers?: SimulationResponses;
  feedback: SimulationResult['feedback'];
}
interface Props {
  simulation: PublicManufacturingSimulation;
  courseId: string;
  lessonId: string;
  interactionId: string;
  initialAttempt?: ManufacturingPracticeAttempt | null;
  readOnlyPreviewSpec?: ManufacturingSimulationSpec;
}

const roomNames = {
  inspection: 'Equipment inspection bay',
  'load-plate': 'Load planning desk',
  sequence: 'Procedure planning board',
  measurement: 'Measurement bench',
  'defect-sort': 'Quality inspection station',
  traceability: 'Production records desk',
};

/** A task simulation, not a powered-truck driving simulator or practical qualification. */
export default function ManufacturingSimulation({
  simulation,
  courseId,
  lessonId,
  interactionId,
  initialAttempt,
  readOnlyPreviewSpec,
}: Props) {
  const [responses, setResponses] = useState<SimulationResponses>(initialAttempt?.answers ?? {});
  const [result, setResult] = useState<ManufacturingPracticeAttempt | null>(initialAttempt ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const requestRef = useRef<AbortController | null>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => requestRef.current?.abort(), []);
  const answeredCount = simulation.tasks.filter((task) =>
    answerReady(task, responses[task.id]),
  ).length;

  function update(id: string, answer: SimulationAnswer) {
    setResponses((previous) => ({ ...previous, [id]: answer }));
    setResult(null);
    setError('');
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (answeredCount !== simulation.tasks.length || saving) return;
    if (readOnlyPreviewSpec) {
      const previewResult = evaluateManufacturingSimulation(readOnlyPreviewSpec, responses);
      if (!previewResult) {
        setError('Answer every preview task using the choices and units shown.');
        return;
      }
      setResult({ ...previewResult, attempts: 0 });
      setError('');
      window.requestAnimationFrame(() => feedbackRef.current?.focus());
      return;
    }
    const controller = new AbortController();
    requestRef.current?.abort();
    requestRef.current = controller;
    setSaving(true);
    setError('');
    try {
      const response = await fetch('/api/learner/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          courseId,
          lessonId,
          interactionId,
          interactionType: 'manufacturing-simulation',
          responses,
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(
          body.error ?? 'Practice could not be saved. Your entries remain on this page.',
        );
      if (!body.attempt || typeof body.attempt.score !== 'number' || !body.attempt.feedback?.tasks)
        throw new Error('Practice response was incomplete. Please try saving again.');
      if (!controller.signal.aborted) {
        setResult(body.attempt);
        window.requestAnimationFrame(() => feedbackRef.current?.focus());
      }
    } catch (caught) {
      if (!controller.signal.aborted)
        setError(caught instanceof Error ? caught.message : 'Practice could not be saved.');
    } finally {
      if (!controller.signal.aborted) setSaving(false);
    }
  }

  return (
    <section
      aria-label={simulation.title}
      className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm"
    >
      <header className="bg-slate-950 p-5 text-white sm:p-6">
        <p className="text-sm font-bold uppercase tracking-wider text-cyan-300">
          Virtual workplace practice
        </p>
        <h2 className="mt-2 text-2xl font-extrabold">{simulation.title}</h2>
        <p className="mt-2 flex items-center gap-2 text-sm text-slate-200">
          <ClipboardCheck className="h-5 w-5" aria-hidden="true" /> {roomNames[simulation.kind]}
        </p>
      </header>
      <div className="space-y-6 p-4 sm:p-6">
        {readOnlyPreviewSpec ? (
          <p className="rounded-xl border border-amber-300 bg-amber-50 p-4 font-semibold leading-7 text-amber-950">
            Administrator preview. You can try every virtual task here. Preview answers are checked
            locally and are never saved as learner attempts, completion, or training hours.
          </p>
        ) : null}
        <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-4 text-base leading-7 text-slate-900">
          <h3 className="font-bold">Your assignment</h3>
          <p className="mt-2 whitespace-pre-wrap">{simulation.brief}</p>
          <p className="mt-3 text-sm font-semibold text-cyan-950">
            Training data is fictional. Use only the specifications shown for this exercise.
          </p>
        </div>

        <div className="grid gap-5">
          {simulation.exhibits.map((exhibit, exhibitIndex) => (
            <section
              key={`${exhibit.title}-${exhibitIndex}`}
              className="min-w-0 rounded-xl border border-slate-200"
            >
              <h3 className="border-b border-slate-200 bg-slate-100 px-4 py-3 text-lg font-bold">
                {exhibit.title}
              </h3>
              <div
                className="overflow-x-auto p-2"
                role="region"
                aria-label={exhibit.title}
                tabIndex={0}
              >
                <table className="w-full border-collapse text-left text-sm sm:text-base">
                  <caption className="sr-only">
                    {exhibit.title}: reference data for the task
                  </caption>
                  <thead>
                    <tr>
                      {exhibit.columns.map((column) => (
                        <th
                          key={column.key}
                          scope="col"
                          className="border-b border-slate-300 px-3 py-3 font-bold text-slate-900"
                        >
                          {column.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {exhibit.rows.map((row, rowIndex) => (
                      <tr key={rowIndex} className="even:bg-slate-50">
                        {exhibit.columns.map((column) => (
                          <td
                            key={column.key}
                            className="border-b border-slate-100 px-3 py-3 align-top text-slate-800"
                          >
                            {row[column.key] ?? '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>

        <form onSubmit={submit} aria-busy={saving} className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <h3 className="text-xl font-bold">Make the work decisions</h3>
            <p aria-live="polite" className="text-sm font-semibold text-slate-700">
              {answeredCount} of {simulation.tasks.length} tasks answered
            </p>
          </div>
          {simulation.tasks.map((task, index) => (
            <fieldset
              key={task.id}
              disabled={saving}
              className="rounded-xl border border-slate-300 p-4 sm:p-5"
            >
              <legend className="max-w-full px-2 text-base font-bold text-slate-950">
                {index + 1}. {task.prompt}
              </legend>
              {task.critical ? (
                <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-900">
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Critical decision: must be
                  correct to pass this practice.
                </p>
              ) : null}
              {task.type === 'choice' ? (
                <div className="grid gap-2">
                  {task.options?.map((option) => (
                    <label
                      key={option.value}
                      className={`flex min-h-12 cursor-pointer items-start gap-3 rounded-lg border p-3 text-base leading-6 ${responses[task.id] === option.value ? 'border-cyan-700 bg-cyan-50' : 'border-slate-200 bg-white'}`}
                    >
                      <input
                        className="mt-1 h-4 w-4 shrink-0 accent-cyan-800"
                        type="radio"
                        name={`${interactionId}-${task.id}`}
                        value={option.value}
                        checked={responses[task.id] === option.value}
                        onChange={() => update(task.id, option.value)}
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              ) : task.type === 'number' ? (
                <div className="max-w-sm">
                  <label
                    htmlFor={`${interactionId}-${task.id}`}
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Enter your result{task.unit ? ` (${task.unit})` : ''}
                  </label>
                  <input
                    id={`${interactionId}-${task.id}`}
                    type="number"
                    step="any"
                    inputMode="decimal"
                    value={
                      typeof responses[task.id] === 'number' ? (responses[task.id] as number) : ''
                    }
                    onChange={(event) => {
                      const value = event.target.value;
                      if (value === '') {
                        setResponses((previous) => {
                          const next = { ...previous };
                          delete next[task.id];
                          return next;
                        });
                        setResult(null);
                      } else if (Number.isFinite(Number(value))) update(task.id, Number(value));
                    }}
                    className="mt-2 min-h-12 w-full rounded-lg border border-slate-400 bg-white px-3 text-lg text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-700"
                  />
                </div>
              ) : (
                <SequenceTask
                  task={task}
                  answer={responses[task.id]}
                  onChange={(answer) => update(task.id, answer)}
                />
              )}
            </fieldset>
          ))}
          <div className="rounded-xl bg-slate-100 p-4">
            <p className="text-sm leading-6 text-slate-700">
              {readOnlyPreviewSpec
                ? 'Check your preview answers without creating a learner record.'
                : 'Submit to check and save your attempt. Entries stay on this page until submitted.'}{' '}
              Passing requires at least {simulation.masteryThreshold}% and every critical decision
              correct.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving || answeredCount !== simulation.tasks.length}
                className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-cyan-800 px-5 py-3 text-base font-bold text-white hover:bg-cyan-950 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save className="h-5 w-5" aria-hidden="true" />{' '}
                {saving
                  ? 'Checking and saving…'
                  : readOnlyPreviewSpec
                    ? 'Check preview answers'
                    : 'Check and save practice'}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  setResponses({});
                  setResult(null);
                  setError('');
                }}
                className="inline-flex min-h-12 items-center gap-2 rounded-lg border border-slate-400 bg-white px-4 py-3 font-bold text-slate-900 disabled:opacity-50"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" /> Clear entries for a new attempt
              </button>
            </div>
            {!readOnlyPreviewSpec ? (
              <p className="mt-3 text-sm text-slate-600">
                Clearing entries does not delete a saved attempt.
              </p>
            ) : null}
          </div>
          {error ? (
            <p
              role="alert"
              className="rounded-xl border border-red-300 bg-red-50 p-4 font-semibold text-red-900"
            >
              {error}
            </p>
          ) : null}
        </form>

        {result ? (
          <div
            ref={feedbackRef}
            tabIndex={-1}
            role="status"
            className={`rounded-xl border p-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-700 ${result.completed ? 'border-emerald-300 bg-emerald-50' : 'border-amber-300 bg-amber-50'}`}
          >
            <h3 className="text-xl font-extrabold">
              {result.completed ? 'Practice passed' : 'Review and retry'} · {result.score}%
            </h3>
            <p className="mt-2 text-sm font-semibold">
              {readOnlyPreviewSpec
                ? 'Preview result only · no learner record saved'
                : `Saved attempt ${result.attempts}`}
            </p>
            <p className="mt-3 leading-7">{result.feedback.reviewMessage}</p>
            <div className="mt-4 space-y-3">
              {result.feedback.tasks.map((feedback) => {
                const task = simulation.tasks.find((item) => item.id === feedback.taskId);
                if (!task) return null;
                return (
                  <article
                    key={feedback.taskId}
                    className="rounded-lg border border-slate-200 bg-white p-4"
                  >
                    <h4 className="font-bold">
                      {feedback.correct ? 'Correct' : 'Needs correction'}: {task.prompt}
                    </h4>
                    <p className="mt-2 leading-7 text-slate-800">{feedback.rationale}</p>
                    {!feedback.correct ? (
                      <p className="mt-2 text-sm font-semibold text-slate-700">
                        Expected response: {answerLabel(task, feedback.expected)}
                      </p>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </div>
        ) : null}

        <p className="border-t border-slate-200 pt-4 text-sm font-semibold leading-6 text-slate-700">
          This virtual activity records online practice only. It does not award hands-on hours,
          employer approval, a forklift operator qualification, or an external credential. Employer
          instruction, supervised practice, and workplace evaluation on actual equipment are
          separate requirements.
        </p>
      </div>
    </section>
  );
}

function answerReady(task: PublicSimulationTask, answer: SimulationAnswer | undefined) {
  if (task.type === 'number') return typeof answer === 'number' && Number.isFinite(answer);
  if (task.type === 'choice')
    return typeof answer === 'string' && task.options?.some((option) => option.value === answer);
  return (
    Array.isArray(answer) &&
    answer.length === task.options?.length &&
    new Set(answer).size === answer.length
  );
}
function answerLabel(task: PublicSimulationTask, answer: SimulationAnswer) {
  const label = (value: string) =>
    task.options?.find((option) => option.value === value)?.label ?? value;
  return Array.isArray(answer)
    ? answer.map((item, index) => `${index + 1}. ${label(item)}`).join('; ')
    : typeof answer === 'number'
      ? `${answer}${task.unit ? ` ${task.unit}` : ''}`
      : label(answer);
}
function SequenceTask({
  task,
  answer,
  onChange,
}: {
  task: PublicSimulationTask;
  answer: SimulationAnswer | undefined;
  onChange: (answer: string[]) => void;
}) {
  const order = Array.isArray(answer) ? answer : (task.options ?? []).map((option) => option.value);
  const stepRefs = useRef<Record<string, HTMLLIElement | null>>({});
  const [announcement, setAnnouncement] = useState('');
  function move(index: number, change: -1 | 1) {
    const next = [...order];
    const target = index + change;
    if (target < 0 || target >= next.length) return;
    const moved = next[index];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
    const label = task.options?.find((option) => option.value === moved)?.label ?? moved;
    setAnnouncement(`${label} moved to step ${target + 1} of ${next.length}.`);
    // A move can disable its arrow at the edge. Keep keyboard focus on the
    // moved step so the learner can continue without losing their place.
    window.requestAnimationFrame(() => stepRefs.current[moved]?.focus());
  }
  return (
    <div>
      <p className="mb-3 text-sm leading-6 text-slate-600">
        Move each step into the correct order. Confirm the order when ready; no dragging is
        required.
      </p>
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
      <ol className="space-y-2">
        {order.map((value, index) => (
          <li
            key={value}
            ref={(element) => {
              stepRefs.current[value] = element;
            }}
            tabIndex={-1}
            className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-700"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-800 font-bold text-white">
              {index + 1}
            </span>
            <span className="flex-1 text-base leading-6">
              {task.options?.find((option) => option.value === value)?.label}
            </span>
            <div className="flex shrink-0 flex-col gap-1">
              <button
                type="button"
                disabled={index === 0}
                onClick={() => move(index, -1)}
                aria-label={`Move step ${index + 1} up`}
                className="flex h-11 w-11 items-center justify-center rounded border border-slate-300 bg-white disabled:opacity-30"
              >
                <ArrowUp className="h-5 w-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                disabled={index === order.length - 1}
                onClick={() => move(index, 1)}
                aria-label={`Move step ${index + 1} down`}
                className="flex h-11 w-11 items-center justify-center rounded border border-slate-300 bg-white disabled:opacity-30"
              >
                <ArrowDown className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </li>
        ))}
      </ol>
      <button
        type="button"
        onClick={() => onChange([...order])}
        className="mt-3 min-h-11 rounded-lg border border-cyan-700 bg-white px-4 py-2 font-bold text-cyan-900"
      >
        Confirm this sequence
      </button>
    </div>
  );
}
