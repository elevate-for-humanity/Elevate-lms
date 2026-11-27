'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  ClipboardCheck,
  FlaskConical,
  RotateCcw,
} from 'lucide-react';
import {
  scenarioResponseCount,
  type ScenarioSimulationConfig,
  type ScenarioStep,
} from '@/lib/lms/scenario-simulation';

type Interaction = {
  id: string;
  type: string;
  title: string;
  position: string;
  completed: boolean;
  score?: number;
  attempts: number;
  data: any;
};

type AttemptResult = {
  score: number;
  completed: boolean;
  attempts: number;
  weak_objectives?: string[];
  feedback?: {
    message?: string;
    hardFail?: string | null;
    checks?: Array<{ key: string; label: string; passed: boolean; points: number; maxPoints: number }>;
  };
};

/**
 * Generic scenario lab player. Renders the authored steps of a
 * `scenario-sim` configuration (lib/lms/scenario-simulation.ts) — walk-around
 * inspections, workplace decisions, and worked calculations — and submits
 * the int-encoded attempt to the learner interactions API, which scores it
 * server-side and records it in interaction_progress. Mirrors the manifold
 * gauge and forklift lab players' contract.
 */
export default function ScenarioSimulator({
  interaction,
  courseId,
  lessonId,
}: {
  interaction: Interaction;
  courseId: string;
  lessonId: string;
}) {
  const config = interaction.data as ScenarioSimulationConfig;

  // Per-step learner state, keyed by step index.
  const [inspectState, setInspectState] = useState<Record<number, Array<boolean | null>>>(() => {
    const initial: Record<number, Array<boolean | null>> = {};
    config.steps.forEach((step, index) => {
      if (step.kind === 'inspect') initial[index] = new Array(step.items.length).fill(null);
    });
    return initial;
  });
  const [decideState, setDecideState] = useState<Record<number, number | null>>({});
  const [calcState, setCalcState] = useState<Record<number, string>>({});

  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [saveError, setSaveError] = useState('');

  const stepComplete = (step: ScenarioStep, index: number): boolean => {
    if (step.kind === 'inspect')
      return (inspectState[index] ?? []).every((entry) => entry !== null);
    if (step.kind === 'decide') return decideState[index] != null;
    return (calcState[index] ?? '').trim() !== '';
  };
  const canSubmit = config.steps.every((step, index) => stepComplete(step, index));

  function restart() {
    const initial: Record<number, Array<boolean | null>> = {};
    config.steps.forEach((step, index) => {
      if (step.kind === 'inspect') initial[index] = new Array(step.items.length).fill(null);
    });
    setInspectState(initial);
    setDecideState({});
    setCalcState({});
    setResult(null);
    setSaveError('');
  }

  async function submit() {
    if (!canSubmit) return;
    setSaving(true);
    setSaveError('');
    const responses = new Array(scenarioResponseCount(config)).fill(0);
    let cursor = 0;
    config.steps.forEach((step, index) => {
      if (step.kind === 'inspect') {
        step.items.forEach((_, itemIndex) => {
          responses[cursor + itemIndex] = inspectState[index]?.[itemIndex] ? 1 : 0;
        });
        cursor += step.items.length;
        return;
      }
      if (step.kind === 'decide') {
        responses[cursor] = decideState[index] ?? 0;
        cursor += 1;
        return;
      }
      const scale = step.responseScale ?? 1;
      const parsed = parseFloat(calcState[index] ?? '0');
      responses[cursor] = Math.max(0, Math.round((Number.isFinite(parsed) ? parsed : 0) * scale));
      cursor += 1;
    });
    try {
      const response = await fetch('/api/learner/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          lessonId,
          interactionId: interaction.id,
          interactionType: 'simulation',
          responses,
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error ?? 'Progress could not be saved');
      setResult(body.attempt as AttemptResult);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Progress could not be saved');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-indigo-200 bg-white p-5 shadow-sm">
      <div className="mb-1 flex items-center gap-2">
        <FlaskConical className="h-5 w-5 text-indigo-700" />
        <p className="text-xs font-bold uppercase tracking-wider text-indigo-700">
          Hands-on simulation · Scenario lab
        </p>
      </div>
      <h3 className="text-lg font-extrabold">{interaction.title}</h3>
      <p className="mt-2 text-sm font-medium leading-6 text-slate-700">{config.description}</p>
      <p className="mt-2 rounded-lg bg-slate-50 p-3 text-sm font-semibold text-slate-800">
        {config.setting}
      </p>

      {config.badges.length ? (
        <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-slate-700">
          {config.badges.map((badge) => (
            <span key={badge} className="rounded-full bg-slate-100 px-3 py-1">
              {badge}
            </span>
          ))}
        </div>
      ) : null}

      {interaction.completed && !result ? (
        <p className="mt-4 rounded-lg bg-emerald-100 p-3 text-sm font-bold text-emerald-900">
          You have passed this simulation{interaction.score != null ? ` at ${interaction.score}%` : ''}. You can run
          it again for practice — your best recorded attempt stands.
        </p>
      ) : null}

      {config.instructions.length ? (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            {config.instructions.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-5 space-y-6">
        {config.steps.map((step, index) => (
          <fieldset key={step.id} className="rounded-xl border border-slate-200 p-4">
            <legend className="px-1 text-sm font-extrabold text-slate-900">
              Step {index + 1} — {step.title}
            </legend>
            <p className="mt-1 text-sm font-medium leading-6 text-slate-700">{step.prompt}</p>

            {step.kind === 'inspect' ? (
              <div className="mt-3 space-y-3">
                {step.items.map((item, itemIndex) => (
                  <div key={item.id} className="rounded-lg bg-slate-50 p-3">
                    <p className="text-sm font-bold text-slate-900">{item.label}</p>
                    <p className="mt-0.5 text-sm text-slate-700">{item.observation}</p>
                    <div className="mt-2 flex gap-2">
                      {[
                        { label: 'Defect — act on it', value: true },
                        { label: 'Serviceable', value: false },
                      ].map((choice) => {
                        const selected = inspectState[index]?.[itemIndex] === choice.value;
                        return (
                          <button
                            key={choice.label}
                            type="button"
                            onClick={() =>
                              setInspectState((prev) => {
                                const next = { ...prev };
                                const items = [...(next[index] ?? [])];
                                items[itemIndex] = choice.value;
                                next[index] = items;
                                return next;
                              })
                            }
                            className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                              selected
                                ? 'bg-indigo-700 text-white'
                                : 'bg-white text-slate-700 ring-1 ring-slate-300'
                            }`}
                          >
                            {choice.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {step.kind === 'decide' ? (
              <div className="mt-3 space-y-2">
                {step.options.map((option, optionIndex) => {
                  const selected = decideState[index] === optionIndex;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setDecideState((prev) => ({ ...prev, [index]: optionIndex }))}
                      className={`block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold ${
                        selected
                          ? 'bg-indigo-700 text-white'
                          : 'bg-slate-50 text-slate-800 ring-1 ring-slate-200'
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            ) : null}

            {step.kind === 'calculate' ? (
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="number"
                  inputMode="decimal"
                  value={calcState[index] ?? ''}
                  onChange={(event) =>
                    setCalcState((prev) => ({ ...prev, [index]: event.target.value }))
                  }
                  className="w-40 rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold"
                  placeholder="Your answer"
                  aria-label={step.title}
                />
                <span className="text-sm font-bold text-slate-700">{step.unit}</span>
              </div>
            ) : null}
          </fieldset>
        ))}
      </div>

      {saveError ? (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-bold text-red-900">{saveError}</p>
      ) : null}

      {result ? (
        <div
          className={`mt-5 rounded-xl p-4 ${
            result.feedback?.hardFail
              ? 'bg-red-50 ring-1 ring-red-200'
              : result.completed
                ? 'bg-emerald-50 ring-1 ring-emerald-200'
                : 'bg-amber-50 ring-1 ring-amber-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {result.feedback?.hardFail ? (
              <Ban className="h-5 w-5 text-red-700" />
            ) : result.completed ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-700" />
            ) : (
              <ClipboardCheck className="h-5 w-5 text-amber-700" />
            )}
            <p className="font-extrabold">
              {result.feedback?.hardFail
                ? 'Attempt failed — safety rule broken'
                : result.completed
                  ? `Passed at ${result.score}%`
                  : `Scored ${result.score}% — not yet at the passing mark`}
            </p>
          </div>
          {result.feedback?.message ? (
            <p className="mt-2 text-sm font-medium leading-6">{result.feedback.message}</p>
          ) : null}
          {result.feedback?.checks?.length ? (
            <ul className="mt-3 space-y-1 text-sm font-semibold">
              {result.feedback.checks.map((check) => (
                <li key={check.key} className="flex items-start justify-between gap-3">
                  <span>
                    {check.passed ? '✓' : '✗'} {check.label}
                  </span>
                  <span>
                    {check.points}/{check.maxPoints}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
          {result.weak_objectives?.length ? (
            <p className="mt-3 text-sm font-semibold">
              Review before retrying: {result.weak_objectives.join(' · ')}
            </p>
          ) : null}
          <button
            type="button"
            onClick={restart}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white"
          >
            <RotateCcw className="h-4 w-4" /> Run the lab again
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={!canSubmit || saving}
          onClick={submit}
          className="mt-5 rounded-lg bg-indigo-700 px-5 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {saving ? 'Scoring…' : canSubmit ? 'Score my attempt' : 'Complete every step to score'}
        </button>
      )}
    </div>
  );
}
