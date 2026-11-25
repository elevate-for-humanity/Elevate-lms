'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  ClipboardCheck,
  KeyRound,
  RotateCcw,
  Scale,
  Truck,
} from 'lucide-react';
import {
  FORKLIFT_PEDESTRIAN_DECISIONS,
  FORKLIFT_POST_INSPECTION_DECISIONS,
  FORKLIFT_RESPONSE,
  FORKLIFT_RESPONSE_COUNT,
  FORKLIFT_TRAVEL_DECISIONS,
  capacityAtLoadCenter,
  type ForkliftSimulationConfig,
} from '@/lib/lms/forklift-simulation';

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
    expectedCapacityAtQuestion?: number;
    checks?: Array<{ key: string; label: string; passed: boolean; points: number; maxPoints: number }>;
  };
};

export default function ForkliftSimulator({
  interaction,
  courseId,
  lessonId,
}: {
  interaction: Interaction;
  courseId: string;
  lessonId: string;
}) {
  const config = interaction.data as ForkliftSimulationConfig;

  // ── Inspection state (true = judged a defect, false = serviceable) ──────
  const [inspection, setInspection] = useState<Array<boolean | null>>(
    () => new Array(config.inspectionItems.length).fill(null),
  );
  const [decision, setDecision] = useState<number | null>(null);

  // ── Capacity & load state ────────────────────────────────────────────────
  const [capacityInput, setCapacityInput] = useState('');
  const [loadDecisions, setLoadDecisions] = useState<Array<boolean | null>>(
    () => new Array(config.loadScenarios.length).fill(null),
  );

  // ── Travel state ─────────────────────────────────────────────────────────
  const [travel, setTravel] = useState<number | null>(null);
  const [pedestrian, setPedestrian] = useState<number | null>(null);

  // ── Shutdown state ───────────────────────────────────────────────────────
  const [shutdown, setShutdown] = useState({ forks: false, neutral: false, brake: false, key: false });

  // ── Submission state ─────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [saveError, setSaveError] = useState('');

  const inspectionDone = inspection.every((entry) => entry !== null);
  const loadsDone = loadDecisions.every((entry) => entry !== null);
  const shutdownDone = shutdown.forks && shutdown.neutral && shutdown.brake && shutdown.key;
  const canSubmit =
    inspectionDone &&
    decision !== null &&
    capacityInput.trim() !== '' &&
    loadsDone &&
    travel !== null &&
    pedestrian !== null &&
    shutdownDone;

  const operatesUnsafeTruck = decision !== null && decision !== 0;
  const travelsRaised = travel === 1;
  const liftsOverCapacity = config.loadScenarios.some((scenario, index) => {
    return loadDecisions[index] === true && scenario.weightLb > capacityAtLoadCenter(config, scenario.loadCenterIn);
  });
  const hardFailRisk = operatesUnsafeTruck || travelsRaised || liftsOverCapacity;

  function restart() {
    setInspection(new Array(config.inspectionItems.length).fill(null));
    setDecision(null);
    setCapacityInput('');
    setLoadDecisions(new Array(config.loadScenarios.length).fill(null));
    setTravel(null);
    setPedestrian(null);
    setShutdown({ forks: false, neutral: false, brake: false, key: false });
    setResult(null);
    setSaveError('');
  }

  async function submit() {
    if (!canSubmit) return;
    setSaving(true);
    setSaveError('');
    const responses = new Array(FORKLIFT_RESPONSE_COUNT).fill(0);
    config.inspectionItems.forEach((_, index) => {
      responses[FORKLIFT_RESPONSE.inspectionStart + index] = inspection[index] ? 1 : 0;
    });
    responses[FORKLIFT_RESPONSE.postInspectionDecision] = decision ?? 0;
    responses[FORKLIFT_RESPONSE.capacityAtQuestionLb] = Math.max(
      0,
      Math.round(parseFloat(capacityInput || '0') || 0),
    );
    config.loadScenarios.forEach((_, index) => {
      responses[FORKLIFT_RESPONSE.loadDecisionStart + index] = loadDecisions[index] ? 1 : 0;
    });
    responses[FORKLIFT_RESPONSE.travelDecision] = travel ?? 0;
    responses[FORKLIFT_RESPONSE.pedestrianDecision] = pedestrian ?? 0;
    responses[FORKLIFT_RESPONSE.shutdownForksLowered] = shutdown.forks ? 1 : 0;
    responses[FORKLIFT_RESPONSE.shutdownNeutral] = shutdown.neutral ? 1 : 0;
    responses[FORKLIFT_RESPONSE.shutdownBrakeSet] = shutdown.brake ? 1 : 0;
    responses[FORKLIFT_RESPONSE.shutdownKeyRemoved] = shutdown.key ? 1 : 0;
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
    <div className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm">
      <div className="mb-1 flex items-center gap-2">
        <Truck className="h-5 w-5 text-amber-700" />
        <p className="text-xs font-bold uppercase tracking-wider text-amber-700">
          Hands-on simulation · Forklift lab
        </p>
      </div>
      <h3 className="text-lg font-extrabold">{interaction.title}</h3>
      <p className="mt-2 text-sm font-medium leading-6 text-slate-700">{config.description}</p>

      <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-slate-700">
        <span className="rounded-full bg-slate-100 px-3 py-1">{config.truck}</span>
        <span className="rounded-full bg-slate-100 px-3 py-1">
          Data plate: {config.dataPlate.ratedCapacityLb.toLocaleString()} lb at {config.dataPlate.ratedLoadCenterIn} in
        </span>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-900">OSHA 29 CFR 1910.178</span>
      </div>

      {interaction.completed && !result ? (
        <p className="mt-4 rounded-lg bg-emerald-100 p-3 text-sm font-bold text-emerald-900">
          You have passed this simulation{interaction.score != null ? ` at ${interaction.score}%` : ''}. You can run
          it again for practice — your best recorded attempt stands.
        </p>
      ) : null}

      <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-900">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          OSHA rules for every step below: a truck with a safety defect comes out of service (1910.178(q)(7)),
          loads stay within the data-plate capacity (1910.178(o)(1)), and the load travels low and tilted back
          (1910.178(n)(7)). Any of those violations scores this lab 0.
        </p>
      </div>
      {hardFailRisk ? (
        <p role="alert" className="mt-3 rounded-lg bg-red-700 p-3 text-sm font-bold text-white">
          One of your current choices violates an OSHA rule above and will score this attempt 0. Change it
          before you submit.
        </p>
      ) : null}

      {/* ── Step 1: pre-operation inspection ─────────────────────────────── */}
      <h4 className="mt-6 flex items-center gap-2 font-extrabold text-slate-900">
        <ClipboardCheck className="h-4 w-4" /> 1 · Pre-operation inspection
      </h4>
      <p className="mt-1 text-sm font-medium text-slate-600">
        Judge every item from what you observe. Three of the ten are safety defects.
      </p>
      <div className="mt-3 space-y-2">
        {config.inspectionItems.map((item, index) => (
          <div key={item.id} className="rounded-lg border border-slate-200 p-3">
            <p className="text-sm font-bold text-slate-900">{item.area}</p>
            <p className="mt-0.5 text-sm font-medium text-slate-600">{item.observation}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setInspection((prev) => prev.map((v, i) => (i === index ? false : v)))}
                className={`min-h-12 rounded-lg border px-4 py-2 text-sm font-bold ${inspection[index] === false ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : 'border-slate-200 bg-white'}`}
              >
                Serviceable
              </button>
              <button
                type="button"
                onClick={() => setInspection((prev) => prev.map((v, i) => (i === index ? true : v)))}
                className={`min-h-12 rounded-lg border px-4 py-2 text-sm font-bold ${inspection[index] === true ? 'border-red-500 bg-red-50 text-red-900' : 'border-slate-200 bg-white'}`}
              >
                Defect — ground the truck
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Step 2: the tag-out decision ─────────────────────────────────── */}
      <h4 className="mt-6 flex items-center gap-2 font-extrabold text-slate-900">
        <Ban className="h-4 w-4" /> 2 · Your decision on this truck
      </h4>
      <div className="mt-3 space-y-2">
        {FORKLIFT_POST_INSPECTION_DECISIONS.map((label, index) => (
          <label
            key={label}
            className={`flex min-h-12 items-center gap-3 rounded-lg border p-3 text-sm font-semibold ${decision === index ? 'border-amber-500 bg-amber-50' : 'border-slate-200'}`}
          >
            <input
              type="radio"
              name="post-inspection-decision"
              checked={decision === index}
              onChange={() => setDecision(index)}
            />
            {label}
          </label>
        ))}
      </div>

      {/* ── Step 3: capacity & loads ─────────────────────────────────────── */}
      <h4 className="mt-6 flex items-center gap-2 font-extrabold text-slate-900">
        <Scale className="h-4 w-4" /> 3 · Read the data plate, judge the loads
      </h4>
      <p className="mt-1 text-sm font-medium text-slate-600">{config.dataPlate.note}</p>
      <label className="mt-3 block text-sm font-semibold text-slate-700">
        What is this truck&apos;s capacity for a load centred at {config.capacityQuestionLoadCenterIn} inches? (lb)
        <input
          type="number"
          value={capacityInput}
          onChange={(e) => setCapacityInput(e.target.value)}
          className="mt-1 min-h-12 w-full rounded-lg border p-3"
          placeholder="Your calculation, in pounds"
        />
      </label>
      <div className="mt-3 space-y-2">
        {config.loadScenarios.map((scenario, index) => (
          <div key={scenario.id} className="rounded-lg border border-slate-200 p-3">
            <p className="text-sm font-bold text-slate-900">
              Load {scenario.id.toUpperCase()} — {scenario.label}
            </p>
            <p className="mt-0.5 text-sm font-medium text-slate-600">
              {scenario.weightLb.toLocaleString()} lb, load center {scenario.loadCenterIn} inches
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setLoadDecisions((prev) => prev.map((v, i) => (i === index ? true : v)))}
                className={`min-h-12 rounded-lg border px-4 py-2 text-sm font-bold ${loadDecisions[index] === true ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : 'border-slate-200 bg-white'}`}
              >
                Lift it
              </button>
              <button
                type="button"
                onClick={() => setLoadDecisions((prev) => prev.map((v, i) => (i === index ? false : v)))}
                className={`min-h-12 rounded-lg border px-4 py-2 text-sm font-bold ${loadDecisions[index] === false ? 'border-red-500 bg-red-50 text-red-900' : 'border-slate-200 bg-white'}`}
              >
                Do not lift
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Step 4: travel & pedestrians ─────────────────────────────────── */}
      <h4 className="mt-6 font-extrabold text-slate-900">4 · Travel with the load</h4>
      <p className="mt-2 text-sm font-bold text-slate-800">How do you travel with a load on the forks?</p>
      <div className="mt-2 space-y-2">
        {FORKLIFT_TRAVEL_DECISIONS.map((label, index) => (
          <label
            key={label}
            className={`flex min-h-12 items-center gap-3 rounded-lg border p-3 text-sm font-semibold ${travel === index ? 'border-amber-500 bg-amber-50' : 'border-slate-200'}`}
          >
            <input type="radio" name="travel-decision" checked={travel === index} onChange={() => setTravel(index)} />
            {label}
          </label>
        ))}
      </div>
      <p className="mt-4 text-sm font-bold text-slate-800">
        Mid-route, a pedestrian steps into the aisle ahead of you. What do you do?
      </p>
      <div className="mt-2 space-y-2">
        {FORKLIFT_PEDESTRIAN_DECISIONS.map((label, index) => (
          <label
            key={label}
            className={`flex min-h-12 items-center gap-3 rounded-lg border p-3 text-sm font-semibold ${pedestrian === index ? 'border-amber-500 bg-amber-50' : 'border-slate-200'}`}
          >
            <input
              type="radio"
              name="pedestrian-decision"
              checked={pedestrian === index}
              onChange={() => setPedestrian(index)}
            />
            {label}
          </label>
        ))}
      </div>

      {/* ── Step 5: park & shut down ─────────────────────────────────────── */}
      <h4 className="mt-6 flex items-center gap-2 font-extrabold text-slate-900">
        <KeyRound className="h-4 w-4" /> 5 · Park and shut down
      </h4>
      <div className="mt-3 space-y-2">
        {(
          [
            ['forks', 'Lower the forks fully to the floor'],
            ['neutral', 'Place the controls in neutral'],
            ['brake', 'Set the parking brake'],
            ['key', 'Turn the truck off and remove the key'],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex min-h-12 items-center gap-3 rounded-lg border border-slate-200 p-3 text-sm font-semibold">
            <input
              type="checkbox"
              checked={shutdown[key]}
              onChange={(e) => setShutdown((d) => ({ ...d, [key]: e.target.checked }))}
            />
            {label}
          </label>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={saving || !canSubmit}
          onClick={submit}
          className="min-h-12 rounded-lg bg-emerald-700 px-5 py-2 text-sm font-bold text-white disabled:opacity-40"
        >
          {saving ? 'Saving…' : 'Submit the scored attempt'}
        </button>
        <button
          type="button"
          onClick={restart}
          className="flex min-h-12 items-center gap-2 rounded-lg border px-4 py-2 text-sm font-bold"
        >
          <RotateCcw className="h-4 w-4" /> Restart the lab
        </button>
        {!canSubmit ? (
          <span className="text-sm font-semibold text-slate-500">
            Judge every inspection item, answer every decision, and complete the shutdown to submit.
          </span>
        ) : null}
      </div>
      {saveError ? <p className="mt-3 text-sm font-semibold text-red-700">{saveError}</p> : null}

      {result ? (
        <div className={`mt-5 rounded-xl border-2 p-5 ${result.completed ? 'border-emerald-300 bg-emerald-50' : 'border-amber-300 bg-amber-50'}`}>
          <p className="text-lg font-black text-slate-900">
            {result.completed ? 'Simulation passed' : 'Simulation not yet passed'} — {result.score}%
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-700">
            Attempt {result.attempts} is saved.
            {result.feedback?.expectedCapacityAtQuestion != null
              ? ` Capacity at ${config.capacityQuestionLoadCenterIn} inches is ${result.feedback.expectedCapacityAtQuestion.toLocaleString()} lb.`
              : ''}
          </p>
          {result.feedback?.message ? (
            <p className="mt-2 text-sm font-medium text-slate-700">{result.feedback.message}</p>
          ) : null}
          {result.feedback?.checks?.length ? (
            <ul className="mt-3 space-y-1 text-sm font-semibold text-slate-800">
              {result.feedback.checks.map((check) => (
                <li key={check.key} className="flex items-center gap-2">
                  <CheckCircle2 className={`h-4 w-4 shrink-0 ${check.passed ? 'text-emerald-600' : 'text-slate-300'}`} />
                  {check.label} — {check.points}/{check.maxPoints}
                </li>
              ))}
            </ul>
          ) : null}
          {result.weak_objectives?.length ? (
            <p className="mt-3 text-sm font-semibold text-slate-700">
              Review before retrying: {result.weak_objectives.join(' ')}
            </p>
          ) : null}
          {!result.completed ? (
            <button
              type="button"
              onClick={restart}
              className="mt-4 flex min-h-12 items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white"
            >
              <RotateCcw className="h-4 w-4" /> Run the lab again
            </button>
          ) : null}
        </div>
      ) : null}

      <p className="mt-4 text-xs font-semibold text-slate-500">
        Educational simulation with a fictional truck and data plate. Passing it does not authorize you to
        operate a real forklift — under OSHA 29 CFR 1910.178(l), your employer must train you, evaluate you on
        the actual truck and workplace, and certify you first.
      </p>
    </div>
  );
}
