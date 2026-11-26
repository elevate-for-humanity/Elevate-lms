'use client';

import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  FlaskConical,
  Gauge,
  RotateCcw,
  Scale,
  Thermometer,
  Wind,
} from 'lucide-react';
import { PT_CHART } from '@/lib/courses/hvac-diagnostic-exercises';
import {
  MANIFOLD_CHARGE_METHODS,
  MANIFOLD_DECISIONS,
  MANIFOLD_RESPONSE,
  MANIFOLD_RESPONSE_COUNT,
  readingsAtCharge,
  subcoolingForReadings,
  superheatForReadings,
  saturationTempForPressure,
  type ManifoldGaugeSimulationConfig,
  type ManifoldReadings,
} from '@/lib/lms/manifold-gauge-simulation';

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
    vented?: boolean;
    checks?: Array<{ key: string; label: string; passed: boolean; points: number; maxPoints: number }>;
    actualFinalSuperheat?: number;
    actualFinalSubcooling?: number;
  };
};

const round1 = (value: number) => Math.round(value * 10) / 10;

function GaugeDial({
  label,
  value,
  max,
  color,
  unit,
}: {
  label: string;
  value: number | null;
  max: number;
  color: string;
  unit: string;
}) {
  const angle = value === null ? -120 : -120 + (Math.max(0, Math.min(max, value)) / max) * 240;
  const ticks = Array.from({ length: 9 }, (_, i) => (max / 8) * i);
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 120 120" className="h-36 w-36" role="img" aria-label={`${label}: ${value === null ? 'not connected' : `${Math.round(value)} ${unit}`}`}>
        <circle cx="60" cy="60" r="56" fill="#f8fafc" stroke={color} strokeWidth="4" />
        {ticks.map((tick) => {
          const a = ((-120 + (tick / max) * 240 - 90) * Math.PI) / 180;
          const x1 = 60 + 46 * Math.cos(a);
          const y1 = 60 + 46 * Math.sin(a);
          const x2 = 60 + 52 * Math.cos(a);
          const y2 = 60 + 52 * Math.sin(a);
          return <line key={tick} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#334155" strokeWidth="2" />;
        })}
        {value !== null && (
          <line
            x1="60"
            y1="60"
            x2={60 + 42 * Math.cos(((angle - 90) * Math.PI) / 180)}
            y2={60 + 42 * Math.sin(((angle - 90) * Math.PI) / 180)}
            stroke={color}
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        )}
        <circle cx="60" cy="60" r="5" fill="#334155" />
        <text x="60" y="98" textAnchor="middle" fontSize="11" fontWeight="700" fill="#334155">
          {value === null ? '—' : `${Math.round(value)} ${unit}`}
        </text>
      </svg>
      <p className="mt-1 text-sm font-bold" style={{ color }}>
        {label}
      </p>
    </div>
  );
}

export default function ManifoldGaugeSimulator({
  interaction,
  courseId,
  lessonId,
}: {
  interaction: Interaction;
  courseId: string;
  lessonId: string;
}) {
  const config = interaction.data as ManifoldGaugeSimulationConfig;

  // ── Procedure state ──────────────────────────────────────────────────────
  const [airflowVerified, setAirflowVerified] = useState(false);
  const [gaugesConnected, setGaugesConnected] = useState(false);
  const [hosesPurged, setHosesPurged] = useState(false);
  const [hasStabilized, setHasStabilized] = useState(false);
  const [stabilizedBeforeReadings, setStabilizedBeforeReadings] = useState(false);

  // ── System state ─────────────────────────────────────────────────────────
  const [chargeOz, setChargeOz] = useState(0);
  const [settledOz, setSettledOz] = useState(0);
  const [needsStabilize, setNeedsStabilize] = useState(false);
  const [adjustedWhileUnstable, setAdjustedWhileUnstable] = useState(false);
  const [vented, setVented] = useState(false);

  // ── Measurement state ────────────────────────────────────────────────────
  const [initialReadings, setInitialReadings] = useState<ManifoldReadings | null>(null);
  const [suctionTempSeen, setSuctionTempSeen] = useState(false);
  const [liquidTempSeen, setLiquidTempSeen] = useState(false);
  const [calc, setCalc] = useState({ suctionSat: '', superheat: '', dischargeSat: '', subcooling: '' });
  const [calcFeedback, setCalcFeedback] = useState('');

  // ── Decision & charging state ────────────────────────────────────────────
  const [decision, setDecision] = useState<number | null>(null);
  const [method, setMethod] = useState<number | null>(null);

  // ── Finish state ─────────────────────────────────────────────────────────
  const [finalReadings, setFinalReadings] = useState<ManifoldReadings | null>(null);
  const [finalCalc, setFinalCalc] = useState({ superheat: '', subcooling: '' });
  const [disconnect, setDisconnect] = useState({ valves: false, hoses: false, caps: false });

  // ── Submission state ─────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [saveError, setSaveError] = useState('');

  const liveReadings = useMemo(() => readingsAtCharge(settledOz), [settledOz]);
  const liveSuperheat = superheatForReadings(config.refrigerant, liveReadings);
  const liveSubcooling = subcoolingForReadings(config.refrigerant, liveReadings);
  const chart = PT_CHART[config.refrigerant] ?? [];

  function stabilize() {
    setHasStabilized(true);
    setNeedsStabilize(false);
    setSettledOz(chargeOz);
  }

  function captureInitialReadings() {
    if (!gaugesConnected) return;
    if (!hasStabilized) setStabilizedBeforeReadings(false);
    else setStabilizedBeforeReadings(true);
    setInitialReadings({ ...liveReadings });
  }

  function checkCalculations() {
    if (!initialReadings) return;
    const sh = parseFloat(calc.superheat);
    const sc = parseFloat(calc.subcooling);
    if (!Number.isFinite(sh) || !Number.isFinite(sc)) {
      setCalcFeedback('Enter both your superheat and subcooling before checking.');
      return;
    }
    const actualSh = superheatForReadings(config.refrigerant, initialReadings);
    const actualSc = subcoolingForReadings(config.refrigerant, initialReadings);
    const shOk = Math.abs(sh - actualSh) <= 2;
    const scOk = Math.abs(sc - actualSc) <= 2;
    setCalcFeedback(
      shOk && scOk
        ? `Correct. Superheat is about ${round1(actualSh)}°F and subcooling is about ${round1(actualSc)}°F. This system is undercharged: high superheat, almost no subcooling.`
        : `Not yet. From the PT chart: suction saturation is about ${round1(saturationTempForPressure(config.refrigerant, initialReadings.suctionPressure))}°F and condensing saturation is about ${round1(saturationTempForPressure(config.refrigerant, initialReadings.dischargePressure))}°F. Superheat = suction line temp − suction saturation. Subcooling = condensing saturation − liquid line temp.`,
    );
  }

  function adjust(deltaOz: number) {
    if (needsStabilize) setAdjustedWhileUnstable(true);
    setChargeOz((oz) => Math.max(0, Math.min(24, oz + deltaOz)));
    setNeedsStabilize(true);
    setFinalReadings(null);
  }

  function vent() {
    setVented(true);
    setChargeOz((oz) => Math.max(0, oz - 8));
    setNeedsStabilize(true);
    setFinalReadings(null);
  }

  function restart() {
    setAirflowVerified(false);
    setGaugesConnected(false);
    setHosesPurged(false);
    setHasStabilized(false);
    setStabilizedBeforeReadings(false);
    setChargeOz(0);
    setSettledOz(0);
    setNeedsStabilize(false);
    setAdjustedWhileUnstable(false);
    setVented(false);
    setInitialReadings(null);
    setSuctionTempSeen(false);
    setLiquidTempSeen(false);
    setCalc({ suctionSat: '', superheat: '', dischargeSat: '', subcooling: '' });
    setCalcFeedback('');
    setDecision(null);
    setMethod(null);
    setFinalReadings(null);
    setFinalCalc({ superheat: '', subcooling: '' });
    setDisconnect({ valves: false, hoses: false, caps: false });
    setResult(null);
    setSaveError('');
  }

  async function submit() {
    if (!finalReadings) return;
    setSaving(true);
    setSaveError('');
    const responses = new Array(MANIFOLD_RESPONSE_COUNT).fill(0);
    responses[MANIFOLD_RESPONSE.airflowVerified] = airflowVerified ? 1 : 0;
    responses[MANIFOLD_RESPONSE.gaugesConnectedAndPurged] = gaugesConnected && hosesPurged ? 1 : 0;
    responses[MANIFOLD_RESPONSE.stabilizedBeforeReadings] = stabilizedBeforeReadings ? 1 : 0;
    responses[MANIFOLD_RESPONSE.initialSuperheatTenths] = Math.max(0, Math.round(parseFloat(calc.superheat || '0') * 10) || 0);
    responses[MANIFOLD_RESPONSE.initialSubcoolingTenths] = Math.max(0, Math.round(parseFloat(calc.subcooling || '0') * 10) || 0);
    responses[MANIFOLD_RESPONSE.decision] = decision ?? 2;
    responses[MANIFOLD_RESPONSE.chargeMethod] = method ?? 0;
    responses[MANIFOLD_RESPONSE.incrementsRespected] = adjustedWhileUnstable ? 0 : 1;
    responses[MANIFOLD_RESPONSE.finalSuctionPressure] = Math.round(finalReadings.suctionPressure);
    responses[MANIFOLD_RESPONSE.finalDischargePressure] = Math.round(finalReadings.dischargePressure);
    responses[MANIFOLD_RESPONSE.finalSuctionLineTempTenths] = Math.round(finalReadings.suctionLineTemp * 10);
    responses[MANIFOLD_RESPONSE.finalLiquidLineTempTenths] = Math.round(finalReadings.liquidLineTemp * 10);
    responses[MANIFOLD_RESPONSE.finalSuperheatTenths] = Math.max(0, Math.round(parseFloat(finalCalc.superheat || '0') * 10) || 0);
    responses[MANIFOLD_RESPONSE.finalSubcoolingTenths] = Math.max(0, Math.round(parseFloat(finalCalc.subcooling || '0') * 10) || 0);
    responses[MANIFOLD_RESPONSE.vented] = vented ? 1 : 0;
    responses[MANIFOLD_RESPONSE.disconnectCompleted] =
      disconnect.valves && disconnect.hoses && disconnect.caps ? 1 : 0;
    // Net ounces added never goes below zero in this scenario family: the
    // system starts undercharged and recovery only removes what was added.
    responses[MANIFOLD_RESPONSE.totalAddedOzTenths] = Math.round(chargeOz * 10);
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

  const setupDone = airflowVerified && gaugesConnected && hosesPurged;
  const canMeasure = gaugesConnected;
  const canDecide = initialReadings !== null && suctionTempSeen && liquidTempSeen;
  const canCharge = decision !== null;
  const canFinish = finalReadings !== null && !needsStabilize;
  const disconnectDone = disconnect.valves && disconnect.hoses && disconnect.caps;

  return (
    <div className="rounded-2xl border border-sky-200 bg-white p-5 shadow-sm">
      <div className="mb-1 flex items-center gap-2">
        <FlaskConical className="h-5 w-5 text-sky-700" />
        <p className="text-xs font-bold uppercase tracking-wider text-sky-700">
          Hands-on simulation · Manifold gauge lab
        </p>
      </div>
      <h3 className="text-lg font-extrabold">{interaction.title}</h3>
      <p className="mt-2 text-sm font-medium leading-6 text-slate-700">{config.description}</p>

      <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-slate-700">
        <span className="rounded-full bg-slate-100 px-3 py-1">{config.systemType}</span>
        <span className="rounded-full bg-slate-100 px-3 py-1">{config.refrigerant}</span>
        <span className="rounded-full bg-slate-100 px-3 py-1">Metering device: {config.meteringDevice}</span>
        <span className="rounded-full bg-slate-100 px-3 py-1">Outdoor {config.outdoorTemp}°F · Indoor {config.indoorTemp}°F</span>
        <span className="rounded-full bg-slate-100 px-3 py-1">Nameplate: {config.nameplateCharge}</span>
        <span className="rounded-full bg-sky-100 px-3 py-1 text-sky-900">
          Target subcooling: {config.targetSubcooling}°F ({config.subcoolingWindow[0]}–{config.subcoolingWindow[1]}°F)
        </span>
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
          EPA rule for every step below: never vent refrigerant. Releasing refrigerant to the air violates
          Section 608 of the Clean Air Act and automatically fails this lab. Recover into an approved
          cylinder instead.
        </p>
      </div>
      {vented ? (
        <p role="alert" className="mt-3 rounded-lg bg-red-700 p-3 text-sm font-bold text-white">
          You vented refrigerant to the atmosphere. That is a federal violation — this attempt will score 0.
          Restart the lab and recover the refrigerant properly.
        </p>
      ) : null}

      {/* ── Step 1: setup ─────────────────────────────────────────────────── */}
      <h4 className="mt-6 font-extrabold text-slate-900">1 · Set up safely</h4>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <button type="button" onClick={() => setAirflowVerified(true)} disabled={airflowVerified}
          className={`flex min-h-12 items-center gap-2 rounded-lg border p-3 text-left text-sm font-semibold ${airflowVerified ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
          <Wind className="h-4 w-4 shrink-0" /> Verify airflow: filter clean, blower running, registers open
          {airflowVerified ? <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-600" /> : null}
        </button>
        <button type="button" onClick={() => setGaugesConnected(true)} disabled={gaugesConnected}
          className={`flex min-h-12 items-center gap-2 rounded-lg border p-3 text-left text-sm font-semibold ${gaugesConnected ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
          <Gauge className="h-4 w-4 shrink-0" /> Connect the manifold gauges to the service valves
          {gaugesConnected ? <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-600" /> : null}
        </button>
        <button type="button" onClick={() => setHosesPurged(true)} disabled={hosesPurged || !gaugesConnected}
          className={`flex min-h-12 items-center gap-2 rounded-lg border p-3 text-left text-sm font-semibold disabled:opacity-40 ${hosesPurged ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
          <CheckCircle2 className="h-4 w-4 shrink-0" /> Purge the air from the hoses
          {hosesPurged ? <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-600" /> : null}
        </button>
        <button type="button" onClick={stabilize} disabled={!gaugesConnected}
          className="flex min-h-12 items-center gap-2 rounded-lg border border-slate-200 bg-white p-3 text-left text-sm font-semibold disabled:opacity-40">
          <RotateCcw className="h-4 w-4 shrink-0" />
          {hasStabilized ? 'Re-stabilize the system (15 min run)' : 'Start the system and let it stabilize (15 min run)'}
          {hasStabilized && !needsStabilize ? <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-600" /> : null}
        </button>
      </div>
      {needsStabilize ? (
        <p role="status" className="mt-2 text-sm font-semibold text-amber-800">
          Readings are stabilizing after the last change — re-stabilize before trusting them.
        </p>
      ) : null}

      {/* ── Step 2: measure & calculate ───────────────────────────────────── */}
      <h4 className="mt-6 font-extrabold text-slate-900">2 · Measure and calculate</h4>
      <div className="mt-3 flex flex-wrap items-start justify-center gap-6 rounded-xl bg-slate-50 p-4">
        <GaugeDial label="Suction (low side)" value={gaugesConnected ? liveReadings.suctionPressure : null} max={200} color="#2563eb" unit="psig" />
        <GaugeDial label="Discharge (high side)" value={gaugesConnected ? liveReadings.dischargePressure : null} max={800} color="#dc2626" unit="psig" />
        <div className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
          <p className="flex items-center gap-2">
            <Thermometer className="h-4 w-4" /> Suction line:{' '}
            {suctionTempSeen ? `${round1(liveReadings.suctionLineTemp)}°F` : 'clamp the thermometer to read it'}
          </p>
          <p className="flex items-center gap-2">
            <Thermometer className="h-4 w-4" /> Liquid line:{' '}
            {liquidTempSeen ? `${round1(liveReadings.liquidLineTemp)}°F` : 'clamp the thermometer to read it'}
          </p>
          <p className="flex items-center gap-2">
            <Scale className="h-4 w-4" /> Charge added so far: {round1(chargeOz)} oz
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" disabled={!canMeasure} onClick={captureInitialReadings}
          className="min-h-12 rounded-lg bg-sky-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-40">
          {initialReadings ? 'Re-record the as-found readings' : 'Record the as-found readings'}
        </button>
        <button type="button" disabled={!canMeasure} onClick={() => setSuctionTempSeen(true)}
          className="min-h-12 rounded-lg border px-4 py-2 text-sm font-bold disabled:opacity-40">
          Clamp thermometer — suction line
        </button>
        <button type="button" disabled={!canMeasure} onClick={() => setLiquidTempSeen(true)}
          className="min-h-12 rounded-lg border px-4 py-2 text-sm font-bold disabled:opacity-40">
          Clamp thermometer — liquid line
        </button>
      </div>
      {initialReadings && !hasStabilized ? (
        <p role="status" className="mt-2 text-sm font-semibold text-amber-800">
          You recorded readings before the system stabilized — on a real job those numbers would not be
          trusted. Stabilize and record them again.
        </p>
      ) : null}

      {initialReadings ? (
        <div className="mt-4 rounded-xl border border-slate-200 p-4">
          <p className="text-sm font-bold text-slate-900">
            As-found: suction {Math.round(initialReadings.suctionPressure)} psig · discharge{' '}
            {Math.round(initialReadings.dischargePressure)} psig · suction line{' '}
            {round1(initialReadings.suctionLineTemp)}°F · liquid line {round1(initialReadings.liquidLineTemp)}°F
          </p>
          <details className="mt-3">
            <summary className="cursor-pointer text-sm font-bold text-sky-800">
              {config.refrigerant} pressure–temperature chart
            </summary>
            <div className="mt-2 grid grid-cols-3 gap-1 text-center text-xs font-semibold text-slate-700 sm:grid-cols-6">
              {chart.map((row) => (
                <span key={row.pressure} className="rounded bg-slate-100 px-1 py-1">
                  {row.pressure} psig → {row.satTemp}°F
                </span>
              ))}
            </div>
          </details>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700">
              Suction saturation temp (°F)
              <input type="number" value={calc.suctionSat} onChange={(e) => setCalc((c) => ({ ...c, suctionSat: e.target.value }))}
                className="mt-1 min-h-12 w-full rounded-lg border p-3" placeholder="From the PT chart" />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Superheat = suction line − saturation (°F)
              <input type="number" value={calc.superheat} onChange={(e) => setCalc((c) => ({ ...c, superheat: e.target.value }))}
                className="mt-1 min-h-12 w-full rounded-lg border p-3" placeholder="Your calculation" />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Condensing saturation temp (°F)
              <input type="number" value={calc.dischargeSat} onChange={(e) => setCalc((c) => ({ ...c, dischargeSat: e.target.value }))}
                className="mt-1 min-h-12 w-full rounded-lg border p-3" placeholder="From the PT chart" />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Subcooling = saturation − liquid line (°F)
              <input type="number" value={calc.subcooling} onChange={(e) => setCalc((c) => ({ ...c, subcooling: e.target.value }))}
                className="mt-1 min-h-12 w-full rounded-lg border p-3" placeholder="Your calculation" />
            </label>
          </div>
          <button type="button" onClick={checkCalculations}
            className="mt-3 min-h-12 rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white">
            Check my calculations
          </button>
          {calcFeedback ? (
            <p role="status" className="mt-3 rounded-lg bg-sky-50 p-3 text-sm font-semibold text-sky-950">
              {calcFeedback}
            </p>
          ) : null}
        </div>
      ) : null}

      {/* ── Step 3: decide ────────────────────────────────────────────────── */}
      <h4 className="mt-6 font-extrabold text-slate-900">3 · Decide the service action</h4>
      <fieldset className="mt-3 space-y-2" disabled={!canDecide}>
        <legend className="sr-only">What does this system need?</legend>
        {MANIFOLD_DECISIONS.map((label, index) => (
          <label key={label} className={`flex min-h-12 items-center gap-3 rounded-lg border p-3 text-sm font-semibold ${decision === index ? 'border-sky-500 bg-sky-50' : 'border-slate-200'} ${!canDecide ? 'opacity-40' : ''}`}>
            <input type="radio" name={`${interaction.id}-decision`} checked={decision === index}
              onChange={() => {
                setDecision(index);
                if (index === 3) vent();
              }} />
            {label}
            {index === 3 ? <span className="text-red-700">(federal violation — never do this)</span> : null}
          </label>
        ))}
      </fieldset>
      {!canDecide ? (
        <p className="mt-2 text-sm font-semibold text-slate-500">
          Record the as-found readings and clamp both thermometers before deciding.
        </p>
      ) : null}

      {/* ── Step 4: charge ────────────────────────────────────────────────── */}
      <h4 className="mt-6 font-extrabold text-slate-900">4 · Adjust the charge</h4>
      <fieldset className="mt-3 space-y-2" disabled={!canCharge}>
        <legend className="text-sm font-bold text-slate-700">Charging method for {config.refrigerant}</legend>
        {MANIFOLD_CHARGE_METHODS.map((label, index) => (
          <label key={label} className={`flex min-h-12 items-center gap-3 rounded-lg border p-3 text-sm font-semibold ${method === index ? 'border-sky-500 bg-sky-50' : 'border-slate-200'} ${!canCharge ? 'opacity-40' : ''}`}>
            <input type="radio" name={`${interaction.id}-method`} checked={method === index} onChange={() => setMethod(index)} />
            {label}
          </label>
        ))}
      </fieldset>
      {method === 2 ? (
        <p role="status" className="mt-2 rounded-lg bg-amber-50 p-3 text-sm font-semibold text-amber-950">
          Hazard: liquid refrigerant into the suction line of a running compressor can slug and destroy it.
          {config.refrigerant} is a blend and leaves the cylinder as liquid — charge it into the high side
          with the system off, or as vapor into the low side.
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" disabled={!canCharge || method === null} onClick={() => adjust(2)}
          className="min-h-12 rounded-lg bg-sky-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-40">
          Add 2 oz
        </button>
        <button type="button" disabled={!canCharge || method === null} onClick={() => adjust(4)}
          className="min-h-12 rounded-lg bg-sky-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-40">
          Add 4 oz
        </button>
        <button type="button" disabled={!canCharge || method === null || chargeOz <= 0} onClick={() => adjust(-2)}
          className="min-h-12 rounded-lg border px-4 py-2 text-sm font-bold disabled:opacity-40">
          Recover 2 oz into the recovery cylinder
        </button>
        <button type="button" disabled={!canCharge} onClick={stabilize}
          className="min-h-12 rounded-lg border px-4 py-2 text-sm font-bold disabled:opacity-40">
          Wait and stabilize (15 min)
        </button>
      </div>
      <p className="mt-2 text-sm font-semibold text-slate-600">
        Live estimate once stabilized: superheat ≈ {round1(liveSuperheat)}°F · subcooling ≈{' '}
        {round1(liveSubcooling)}°F. Add in small increments and re-stabilize between them — flooding past
        the target means recovering back down.
      </p>
      {setupDone ? null : (
        <p className="mt-2 text-sm font-semibold text-amber-800">
          Skipping setup steps (airflow, gauges, purge) costs procedure points on the scored attempt.
        </p>
      )}

      {/* ── Step 5: verify & disconnect ───────────────────────────────────── */}
      <h4 className="mt-6 font-extrabold text-slate-900">5 · Verify and disconnect</h4>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" disabled={!canCharge || needsStabilize}
          onClick={() => setFinalReadings({ ...liveReadings })}
          className="min-h-12 rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-40">
          Take the final readings
        </button>
      </div>
      {needsStabilize ? (
        <p className="mt-2 text-sm font-semibold text-amber-800">Stabilize the system before taking final readings.</p>
      ) : null}
      {finalReadings ? (
        <div className="mt-3 rounded-xl border border-slate-200 p-4">
          <p className="text-sm font-bold text-slate-900">
            Final: suction {Math.round(finalReadings.suctionPressure)} psig · discharge{' '}
            {Math.round(finalReadings.dischargePressure)} psig · suction line{' '}
            {round1(finalReadings.suctionLineTemp)}°F · liquid line {round1(finalReadings.liquidLineTemp)}°F ·
            total added {round1(chargeOz)} oz
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700">
              Final superheat (°F)
              <input type="number" value={finalCalc.superheat} onChange={(e) => setFinalCalc((c) => ({ ...c, superheat: e.target.value }))}
                className="mt-1 min-h-12 w-full rounded-lg border p-3" placeholder="Your calculation" />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Final subcooling (°F)
              <input type="number" value={finalCalc.subcooling} onChange={(e) => setFinalCalc((c) => ({ ...c, subcooling: e.target.value }))}
                className="mt-1 min-h-12 w-full rounded-lg border p-3" placeholder="Your calculation" />
            </label>
          </div>
          <div className="mt-4 space-y-2">
            {(
              [
                ['valves', 'Close both service valves'],
                ['hoses', 'Clear the hoses into the system / recovery cylinder — do not release them to the air'],
                ['caps', 'Replace the valve caps and check for leaks'],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex min-h-12 items-center gap-3 rounded-lg border border-slate-200 p-3 text-sm font-semibold">
                <input type="checkbox" checked={disconnect[key]}
                  onChange={(e) => setDisconnect((d) => ({ ...d, [key]: e.target.checked }))} />
                {label}
              </label>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button type="button" disabled={saving || !disconnectDone} onClick={submit}
              className="min-h-12 rounded-lg bg-emerald-700 px-5 py-2 text-sm font-bold text-white disabled:opacity-40">
              {saving ? 'Saving…' : 'Submit the scored attempt'}
            </button>
            <button type="button" onClick={restart}
              className="flex min-h-12 items-center gap-2 rounded-lg border px-4 py-2 text-sm font-bold">
              <RotateCcw className="h-4 w-4" /> Restart the lab
            </button>
            {!disconnectDone ? (
              <span className="text-sm font-semibold text-slate-500">Complete the disconnect steps to submit.</span>
            ) : null}
          </div>
          {saveError ? <p className="mt-3 text-sm font-semibold text-red-700">{saveError}</p> : null}
        </div>
      ) : null}

      {result ? (
        <div className={`mt-5 rounded-xl border-2 p-5 ${result.completed ? 'border-emerald-300 bg-emerald-50' : 'border-amber-300 bg-amber-50'}`}>
          <p className="text-lg font-black text-slate-900">
            {result.completed ? 'Simulation passed' : 'Simulation not yet passed'} — {result.score}%
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-700">
            Attempt {result.attempts} is saved.
            {result.feedback?.actualFinalSubcooling != null
              ? ` Final subcooling ${result.feedback.actualFinalSubcooling}°F, final superheat ${result.feedback.actualFinalSuperheat}°F.`
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
            <button type="button" onClick={restart}
              className="mt-4 flex min-h-12 items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white">
              <RotateCcw className="h-4 w-4" /> Run the lab again
            </button>
          ) : null}
        </div>
      ) : null}

      <p className="mt-4 text-xs font-semibold text-slate-500">
        Educational simulation with an idealized steady-state model. On real equipment, follow the
        manufacturer&apos;s charging chart and your employer&apos;s procedures.
      </p>
    </div>
  );
}
