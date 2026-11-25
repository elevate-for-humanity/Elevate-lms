'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type {
  HvacSimulationControl,
  HvacSimulationPanel,
  HvacSimulationReading,
  HvacSimulationRequest,
  HvacSimulationResponse,
  HvacSimulationView,
} from '@/lib/lms/hvac-simulation-types';

type Props = { courseId: string; lessonId: string };
type SaveError = { message: string; conflict: boolean; retryable: boolean };
type Action = HvacSimulationRequest['action'];

const endpoint = '/api/learner/hvac-simulations';
const buttonClass =
  'min-h-11 rounded-lg px-4 py-3 text-base font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
const panelTitles: Record<HvacSimulationPanel, string> = {
  workflow: 'Virtual work order',
  system: 'Virtual HVAC system',
  electrical: 'Virtual electrical bench',
  furnace: 'Virtual heating system',
  manifold: 'Virtual manifold bench',
  recovery: 'Virtual recovery station',
  vacuum: 'Virtual evacuation station',
  airflow: 'Virtual airflow bench',
  safety: 'Virtual safety inspection',
};
const panelDescriptions: Record<HvacSimulationPanel, string> = {
  workflow: 'Review the assignment, collect evidence, and make a documented decision.',
  system:
    'Explore the compressor, coils, and metering device using the model controls and readings.',
  electrical:
    'Explore a modeled source, switch, load, and meter. The displayed values are synthetic.',
  furnace: 'Compare the modeled heating sequence, heat transfer, and airflow observations.',
  manifold: 'Compare paired virtual instrument readings before interpreting the system.',
  recovery: 'Inspect the modeled appliance, recovery machine, and collection cylinder.',
  vacuum: 'Compare modeled chamber and instrument observations for the selected test conditions.',
  airflow: 'Explore the modeled return path, blower, and supply path using the controls below.',
  safety: 'Inspect the scenario, identify hazards, and choose an appropriate response.',
};
const readingStyles: Record<HvacSimulationReading['status'], string> = {
  neutral: 'border-slate-500 bg-slate-800',
  normal: 'border-emerald-400 bg-emerald-950',
  warning: 'border-amber-400 bg-amber-950',
  danger: 'border-red-400 bg-red-950',
};
const readingStatus: Record<HvacSimulationReading['status'], string> = {
  neutral: 'Model observation',
  normal: 'Within this scenario’s expected condition',
  warning: 'Review this observation',
  danger: 'Stop condition in this scenario',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isSimulationResponse(value: unknown, lessonId: string): value is HvacSimulationResponse {
  if (
    !isRecord(value) ||
    value.success !== true ||
    !isRecord(value.simulation) ||
    !isRecord(value.progress)
  )
    return false;
  const { simulation, progress } = value;
  const string = (item: unknown): item is string => typeof item === 'string';
  const numeric = (item: unknown): item is number =>
    typeof item === 'number' && Number.isFinite(item);
  const options = (items: unknown): boolean =>
    Array.isArray(items) &&
    items.every((item) => isRecord(item) && string(item.id) && string(item.label));
  return (
    simulation.lessonId === lessonId &&
    string(simulation.id) &&
    string(simulation.version) &&
    string(simulation.title) &&
    string(simulation.objective) &&
    string(simulation.scenario) &&
    numeric(simulation.chapter) &&
    numeric(simulation.stageNumber) &&
    numeric(simulation.stageCount) &&
    typeof simulation.observed === 'boolean' &&
    typeof simulation.finished === 'boolean' &&
    typeof simulation.passed === 'boolean' &&
    (simulation.score === null || numeric(simulation.score)) &&
    Array.isArray(simulation.controls) &&
    simulation.controls.every(
      (control) =>
        isRecord(control) &&
        string(control.id) &&
        string(control.label) &&
        ['select', 'range', 'number'].includes(String(control.type)) &&
        (string(control.value) || numeric(control.value)) &&
        (control.type !== 'select' ||
          (Array.isArray(control.options) &&
            control.options.every(
              (option) => isRecord(option) && string(option.value) && string(option.label),
            ))),
    ) &&
    Array.isArray(simulation.readings) &&
    simulation.readings.every(
      (reading) =>
        isRecord(reading) &&
        string(reading.id) &&
        string(reading.label) &&
        (string(reading.value) || numeric(reading.value)) &&
        string(reading.status) &&
        Object.hasOwn(readingStyles, reading.status),
    ) &&
    string(simulation.panel) &&
    Object.hasOwn(panelTitles, simulation.panel) &&
    (simulation.stage === null ||
      (isRecord(simulation.stage) &&
        string(simulation.stage.id) &&
        string(simulation.stage.title) &&
        string(simulation.stage.prompt) &&
        typeof simulation.stage.observationRequired === 'boolean' &&
        options(simulation.stage.options))) &&
    (simulation.feedback === null ||
      (isRecord(simulation.feedback) &&
        string(simulation.feedback.message) &&
        ['info', 'success', 'retry', 'safety'].includes(String(simulation.feedback.kind)))) &&
    Array.isArray(simulation.sources) &&
    simulation.sources.every(
      (source) => isRecord(source) && string(source.label) && string(source.url),
    ) &&
    Number.isInteger(progress.revision) &&
    Number(progress.revision) >= 0 &&
    Number.isInteger(progress.attemptCount) &&
    typeof progress.mastered === 'boolean' &&
    (progress.bestScore === null || numeric(progress.bestScore)) &&
    (progress.lastSavedAt === null || string(progress.lastSavedAt))
  );
}

function requestId(): string {
  if (typeof globalThis.crypto.randomUUID === 'function') return globalThis.crypto.randomUUID();
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function DiagramReading({
  reading,
  x,
  y,
  color = '#e0f2fe',
}: {
  reading: HvacSimulationReading | undefined;
  x: number;
  y: number;
  color?: string;
}) {
  if (!reading) return null;
  const text = `${reading.value}${reading.unit ? ` ${reading.unit}` : ''}`;
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      fontSize={text.length > 12 ? 15 : 22}
      fontWeight="700"
      fill={color}
      data-meter-id={reading.id}
      data-reading-value={String(reading.value)}
    >
      <title>
        {reading.label}: {text}
      </title>
      {text.length > 26 ? `${text.slice(0, 23)}…` : text}
    </text>
  );
}

/** Symbolic equipment diagrams; all readings and decisions come from the server model. */
function EquipmentDiagram({ simulation }: { simulation: HvacSimulationView }) {
  const { panel, observed } = simulation;
  const reading = (id: string) => simulation.readings.find((item) => item.id === id);
  const control = (id: string) => simulation.controls.find((item) => item.id === id)?.value;
  const statusColor = (status?: HvacSimulationReading['status']) =>
    status === 'danger'
      ? '#f87171'
      : status === 'warning'
        ? '#fbbf24'
        : status === 'normal'
          ? '#34d399'
          : '#94a3b8';
  const stroke = observed ? '#38bdf8' : '#94a3b8';
  const firstReading = simulation.readings[0];
  const secondReading = simulation.readings[1];
  const meter = reading('meter') ?? firstReading;
  const switchPosition =
    control('switch') === 'closed'
      ? 'closed'
      : control('switch') === 'open'
        ? 'open'
        : 'not-modeled';
  const current = reading('actual-current');
  const wireColor = typeof current?.value === 'number' && current.value > 0 ? '#38bdf8' : '#94a3b8';
  const material = reading('material-mass')?.value;
  const headroom = reading('headroom')?.value;
  const capacity =
    typeof material === 'number' && typeof headroom === 'number' ? material + headroom : null;
  const fillFraction =
    typeof material === 'number' && capacity !== null && capacity > 0
      ? Math.max(0, Math.min(1, material / capacity))
      : null;
  const flow = reading('airflow');
  const flowReading = typeof flow?.value === 'number' ? flow : reading('capacity');
  const flowPercent =
    typeof flowReading?.value === 'number' ? Math.max(0, Math.min(100, flowReading.value)) : null;
  const restriction = reading('restriction')?.value;
  const restrictedAirPath =
    typeof restriction === 'number' ? restriction > 0 : control('filter') === 'blocked';
  const vacuumReading = reading('current') ?? reading('inside') ?? firstReading;
  const danger = simulation.readings.some((item) => item.status === 'danger');
  const warning = simulation.readings.some((item) => item.status === 'warning');
  const common = {
    fill: 'none',
    stroke,
    strokeWidth: 5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  const box = { fill: '#1e293b', stroke: '#94a3b8', strokeWidth: 3, rx: 14 };
  return (
    <svg
      viewBox="0 0 520 230"
      className="mx-auto w-full max-w-xl"
      aria-hidden="true"
      focusable="false"
      data-equipment-panel={panel}
    >
      {panel === 'workflow' && (
        <>
          {[30, 210, 390].map((x, index) => (
            <g key={x}>
              <rect x={x} y="45" width="100" height="120" {...box} />
              <path d={`M${x + 22} 72h56m-56 25h56m-56 25h35`} {...common} />
              <circle
                cx={x + 80}
                cy="151"
                r="14"
                fill={statusColor(simulation.readings[index]?.status)}
                data-work-card={simulation.readings[index]?.id}
                data-condition={simulation.readings[index]?.status}
              />
            </g>
          ))}
          <path d="M140 105h55m125 0h55" {...common} />
          <DiagramReading reading={firstReading} x={260} y={211} />
        </>
      )}
      {panel === 'system' && (
        <>
          <path d="M115 58h290v100H115z" {...common} />
          {[
            { x: 55, y: 25, id: 'compressor' },
            { x: 345, y: 25, id: 'condenser' },
            { x: 55, y: 125, id: 'evaporator' },
            { x: 345, y: 125, id: 'metering' },
          ].map(({ x, y, id }) => (
            <rect
              key={id}
              x={x}
              y={y}
              width="120"
              height="60"
              {...box}
              stroke={control('component') === id ? '#fb923c' : '#94a3b8'}
              strokeWidth={control('component') === id ? 6 : 3}
              data-system-component={id}
              data-selected={control('component') === id}
            />
          ))}
          <circle cx="115" cy="55" r="18" {...common} />
          <path
            d="M365 43l12 25 12-25 12 25 12-25 12 25"
            {...common}
            stroke={control('mode') === 'heating' ? '#38bdf8' : '#fb923c'}
          />
          <path
            d="M77 142l12 25 12-25 12 25 12-25 12 25"
            {...common}
            stroke={control('mode') === 'heating' ? '#fb923c' : '#38bdf8'}
          />
          <path d="M380 141l35 28v-28l-35 28z" {...common} />
          <DiagramReading reading={reading('mode')} x={260} y={211} />
        </>
      )}
      {panel === 'electrical' && (
        <>
          <path d="M75 65h110m65 0h195v105H75V65" {...common} stroke={wireColor} />
          <g data-switch-position={switchPosition}>
            <circle cx="185" cy="65" r="5" fill={wireColor} />
            <circle cx="250" cy="65" r="5" fill={wireColor} />
            {switchPosition !== 'not-modeled' && (
              <path
                d={switchPosition === 'closed' ? 'M185 65h65' : 'M185 65l52-29'}
                {...common}
                stroke={wireColor}
              />
            )}
          </g>
          <rect x="50" y="102" width="50" height="45" {...box} />
          <path d="M60 115h30m-15-10v20M65 137h20" {...common} />
          <rect x="345" y="42" width="80" height="46" {...box} />
          <path d="m355 65 10-12 10 24 10-24 10 24 10-12" {...common} />
          <rect x="180" y="105" width="140" height="85" {...box} />
          <rect
            x="192"
            y="117"
            width="116"
            height="33"
            fill={meter?.status === 'danger' ? '#fecaca' : '#bae6fd'}
            rx="4"
          />
          <DiagramReading reading={meter} x={250} y={141} color="#0f172a" />
          <circle cx="250" cy="170" r="10" {...common} />
          {control('clamp') && (
            <ellipse
              cx="333"
              cy={control('clamp') === 'both' ? 117 : 65}
              rx="13"
              ry={control('clamp') === 'both' ? 65 : 18}
              fill="none"
              stroke="#fbbf24"
              strokeWidth="4"
              data-clamp-position={String(control('clamp'))}
            />
          )}
          <DiagramReading reading={reading('supply')} x={75} y={211} />
          <DiagramReading reading={current} x={425} y={211} />
        </>
      )}
      {panel === 'furnace' && (
        <>
          <rect x="160" y="20" width="200" height="175" {...box} />
          <path
            d="M205 85V55h110v25H205v25h110"
            {...common}
            stroke={
              reading('sequence')?.value === 'Heating permitted by modeled inputs'
                ? '#fb923c'
                : '#94a3b8'
            }
            data-controller-state={String(reading('sequence')?.value ?? 'No model reading')}
          />
          <circle cx="260" cy="150" r="32" {...common} />
          <path
            d="m260 150-20-20m20 20 25-14m-25 14 0 27M50 150h95m230 0h95M260 20V5"
            {...common}
          />
          {['airflow-proof', 'flame-proof', 'sequence'].map((id, index) => (
            <circle
              key={id}
              cx={188 + index * 42}
              cy="38"
              r="7"
              fill={statusColor(reading(id)?.status)}
              data-proof-signal={id}
              data-equipment-status={reading(id)?.status ?? 'neutral'}
            />
          ))}
          <DiagramReading reading={reading('sequence')} x={260} y={215} />
        </>
      )}
      {panel === 'manifold' &&
        control('tool') !== 'detector' &&
        control('tool') !== 'temperature' && (
          <g data-instrument-mode="manifold">
            <circle cx="165" cy="78" r="54" fill="#172554" stroke="#38bdf8" strokeWidth="5" />
            <circle cx="355" cy="78" r="54" fill="#431407" stroke="#fb923c" strokeWidth="5" />
            <DiagramReading reading={reading('superheat') ?? firstReading} x={165} y={85} />
            <DiagramReading
              reading={reading('subcooling') ?? secondReading}
              x={355}
              y={85}
              color="#ffedd5"
            />
            <path d="M165 133v20h190v-20M165 153v40m190-40v40m-95-40v40" {...common} />
            <circle cx="165" cy="153" r="10" fill="#38bdf8" />
            <circle cx="355" cy="153" r="10" fill="#fb923c" />
          </g>
        )}
      {panel === 'manifold' && control('tool') === 'temperature' && (
        <g data-instrument-mode="temperature">
          <rect
            x="54"
            y="38"
            width="34"
            height="110"
            rx="17"
            fill="#1e293b"
            stroke="#94a3b8"
            strokeWidth="4"
          />
          <circle cx="71" cy="157" r="30" fill="#1e293b" stroke="#94a3b8" strokeWidth="4" />
          <path d="M71 64v93" stroke="#fb923c" strokeWidth="10" strokeLinecap="round" />
          <circle cx="71" cy="157" r="16" fill="#fb923c" />
          <rect x="114" y="62" width="140" height="50" {...box} />
          <DiagramReading reading={reading('line-temperature')} x={184} y={94} />
          <rect x="300" y="45" width="185" height="140" {...box} />
          <text x="392" y="72" textAnchor="middle" fontSize="14" fill="#cbd5e1">
            Air-path observation
          </text>
          <DiagramReading reading={reading('air-path')} x={392} y={110} />
          <circle
            cx="392"
            cy="148"
            r="10"
            fill={statusColor(reading('air-path')?.status)}
            data-inspection-reading="air-path"
            data-condition={reading('air-path')?.status ?? 'neutral'}
          />
          <text x="145" y="215" textAnchor="middle" fontSize="16" fill="#cbd5e1">
            Temperature sample
          </text>
          <text x="392" y="215" textAnchor="middle" fontSize="16" fill="#cbd5e1">
            Work card
          </text>
        </g>
      )}
      {panel === 'manifold' && control('tool') === 'detector' && (
        <g data-instrument-mode="detector">
          <rect x="55" y="65" width="150" height="115" {...box} />
          <path
            d={
              control('detectorLocation') === 'fitting'
                ? 'M205 100h65q35 0 35 35h65'
                : 'M205 100h65q35 0 35-35V35'
            }
            {...common}
          />
          <path d="M345 135h135m-65-30v60" stroke="#94a3b8" strokeWidth="9" />
          <circle
            cx={control('detectorLocation') === 'fitting' ? 377 : 305}
            cy={control('detectorLocation') === 'fitting' ? 135 : 35}
            r="10"
            fill={statusColor(reading('indicator')?.status)}
            data-detector-location={String(control('detectorLocation'))}
          />
          <DiagramReading reading={reading('indicator')} x={260} y={211} />
        </g>
      )}
      {panel === 'recovery' && (
        <>
          <rect x="25" y="52" width="125" height="124" {...box} />
          <path d="M43 75h90m-90 22h90m-90 22h90m-90 22h90M150 140h45m130 0h40" {...common} />
          <rect x="195" y="80" width="130" height="96" {...box} />
          <circle
            cx="260"
            cy="126"
            r="27"
            {...common}
            stroke={statusColor(reading('equipment')?.status ?? reading('contents')?.status)}
            data-recovery-equipment={String(
              control('equipment') ?? control('contents') ?? 'not-modeled',
            )}
          />
          <rect
            x="380"
            y="52"
            width="92"
            height="130"
            rx="24"
            fill="#164e63"
            stroke="#67e8f9"
            strokeWidth="4"
          />
          {fillFraction !== null && (
            <rect
              x="388"
              y={176 - fillFraction * 116}
              width="76"
              height={fillFraction * 116}
              rx="13"
              fill={statusColor(reading('headroom')?.status)}
              opacity="0.7"
              data-cylinder-fill={fillFraction}
            />
          )}
          <path d="M411 52V31h30v21m-76 88h15" {...common} />
          <DiagramReading
            reading={reading('charge') ?? reading('gross-mass') ?? firstReading}
            x={87}
            y={211}
          />
          <DiagramReading
            reading={reading('headroom') ?? reading('compressor') ?? secondReading}
            x={426}
            y={211}
          />
        </>
      )}
      {panel === 'vacuum' && control('measurement') === 'pressure' && (
        <g data-instrument-mode="pressure">
          <rect x="35" y="45" width="180" height="130" {...box} />
          <text x="125" y="112" textAnchor="middle" fontSize="18" fill="#cbd5e1">
            Test chamber
          </text>
          <path d="M215 110h82" {...common} />
          <circle cx="365" cy="110" r="68" fill="#172554" stroke="#38bdf8" strokeWidth="5" />
          <rect x="309" y="87" width="112" height="36" rx="4" fill="#bae6fd" />
          <DiagramReading reading={reading('current')} x={365} y={113} color="#0f172a" />
          <text x="365" y="154" textAnchor="middle" fontSize="16" fill="#cbd5e1">
            Pressure
          </text>
          <DiagramReading reading={reading('elapsed')} x={125} y={211} />
          <DiagramReading reading={reading('change')} x={365} y={211} />
        </g>
      )}
      {panel === 'vacuum' && control('measurement') !== 'pressure' && (
        <g data-instrument-mode="vacuum">
          <rect x="35" y="45" width="180" height="130" {...box} />
          <circle cx="125" cy="109" r="42" {...common} />
          <path
            d="M215 120h75m90 0h70v42"
            {...common}
            strokeDasharray={control('pump') === 'isolated' ? '9 8' : undefined}
            data-pump-condition={String(control('pump') ?? 'not-modeled')}
          />
          <rect x="290" y="73" width="90" height="90" {...box} />
          <rect x="296" y="91" width="78" height="32" rx="4" fill="#bae6fd" />
          <DiagramReading reading={vacuumReading} x={335} y={114} color="#0f172a" />
          <rect x="415" y="153" width="80" height="35" {...box} />
          {reading('flow') ? (
            <g data-flow-direction={String(reading('flow')?.value)}>
              {control('seal') === 'leak' && (
                <path
                  d={
                    reading('flow')?.value === 'Air moves inward'
                      ? 'M145 33v45m-10-13 10 13 10-13'
                      : 'M145 78V33m-10 13 10-13 10 13'
                  }
                  {...common}
                  stroke="#fbbf24"
                />
              )}
              {control('seal') === 'sealed' && (
                <path d="m112 99 10 10 23-25" {...common} stroke="#34d399" />
              )}
            </g>
          ) : (
            <path d="M110 109h30m-15-15v30" {...common} />
          )}
          <DiagramReading
            reading={reading('flow') ?? reading('pump') ?? reading('elapsed')}
            x={260}
            y={215}
          />
        </g>
      )}
      {panel === 'airflow' && (
        <>
          <path d="M25 55h165v100H25m305-100h165m-165 100h165" {...common} />
          <rect x="190" y="30" width="140" height="150" {...box} />
          <circle cx="260" cy="105" r="45" {...common} />
          <path d="m260 105-27-27m27 27 35-17m-35 17v38" {...common} />
          <path
            d="M45 83h110m-110 44h110m200-44h110m-110 44h110"
            {...common}
            strokeWidth={flowPercent !== null ? 1 + flowPercent / 12 : 5}
            opacity={flowPercent === 0 ? 0.2 : 1}
            data-normalized-flow={flowPercent ?? 'not-modeled'}
          />
          <path
            d="M85 55v100m12-100v100m12-100v100"
            stroke={restrictedAirPath ? '#fb923c' : '#94a3b8'}
            strokeWidth={restrictedAirPath ? 7 : 2}
            data-restricted-air-path={restrictedAirPath}
          />
          <DiagramReading reading={flowReading ?? firstReading} x={260} y={211} />
        </>
      )}
      {panel === 'safety' && (
        <>
          <path d="M20 185h480" {...common} />
          <rect x="190" y="70" width="135" height="115" {...box} />
          <path d="M210 95h95m-95 25h95m-95 25h95M70 185v-45h80v45m175-15h35v15h55" {...common} />
          <path
            d="m410 28 52 90H358z"
            fill={danger ? '#7f1d1d' : warning ? '#78350f' : '#064e3b'}
            stroke={danger ? '#f87171' : warning ? '#fbbf24' : '#34d399'}
            strokeWidth="4"
            data-safety-state={danger ? 'danger' : warning ? 'warning' : 'normal'}
          />
          <path d="M410 58v27m0 13v2" stroke="#fef3c7" strokeWidth="7" strokeLinecap="round" />
          <path d="M55 40h65v60H55z" {...common} />
          {simulation.readings.slice(0, 3).map((item, index) => (
            <circle
              key={item.id}
              cx={70 + index * 16}
              cy="70"
              r="5"
              fill={statusColor(item.status)}
              data-safety-reading={item.id}
              data-condition={item.status}
            />
          ))}
          <DiagramReading
            reading={reading('readiness') ?? reading('scene') ?? reading('energy') ?? firstReading}
            x={260}
            y={215}
          />
        </>
      )}
    </svg>
  );
}

function VirtualBench({ simulation }: { simulation: HvacSimulationView }) {
  const control = (id: string) => simulation.controls.find((item) => item.id === id)?.value;
  const temperatureMode = simulation.panel === 'manifold' && control('tool') === 'temperature';
  const pressureMode = simulation.panel === 'vacuum' && control('measurement') === 'pressure';
  const title = temperatureMode
    ? 'Virtual temperature and airflow inspection'
    : pressureMode
      ? 'Virtual pressure-test bench'
      : panelTitles[simulation.panel];
  const description = temperatureMode
    ? 'Compare the supplied temperature sample and airflow observation before choosing the next diagnostic check.'
    : pressureMode
      ? 'Compare the supplied pressure sample, elapsed time, and test conditions for the modeled chamber.'
      : panelDescriptions[simulation.panel];
  const planningIds =
    simulation.chapter === 9
      ? ['handling-method', 'pump-down-eligibility', 'containment']
      : simulation.chapter === 13
        ? [
            'joint-preparation',
            'brazing-process',
            'joint-inspection',
            'leak-verification',
            'handoff',
          ]
        : [];
  const planningReadings = simulation.readings.filter((reading) =>
    planningIds.includes(reading.id),
  );
  return (
    <figure className="min-w-0 rounded-xl bg-slate-950 p-4 text-white sm:p-5" aria-label={title}>
      <figcaption className="mb-3 text-lg font-bold">{title}</figcaption>
      <EquipmentDiagram simulation={simulation} />
      {simulation.panel === 'manifold' &&
        simulation.readings.some((item) => item.id === 'superheat') &&
        simulation.readings.some((item) => item.id === 'subcooling') && (
          <p className="mb-3 text-sm text-slate-200">
            Blue display: superheat. Orange display: subcooling.
          </p>
        )}
      {simulation.panel === 'recovery' &&
        simulation.readings.some((item) => item.id === 'material-mass') && (
          <p className="mb-3 text-sm text-slate-200">
            Cylinder indicator: mass relative to this case’s supplied limit, not a measured liquid
            level.
          </p>
        )}
      <p className="mb-5 text-base leading-relaxed text-slate-200">{description}</p>
      {planningReadings.length > 0 && (
        <section
          className="mb-5 rounded-lg border border-slate-500 bg-slate-900 p-4"
          aria-label={
            simulation.chapter === 9
              ? 'Refrigerant-handling job card'
              : 'Brazing preparation and verification job card'
          }
        >
          <h4 className="mb-2 text-base font-semibold">
            {simulation.chapter === 9
              ? 'Refrigerant-handling job card'
              : 'Brazing preparation and verification job card'}
          </h4>
          <p className="mb-3 text-base text-slate-200">
            Review the modeled evidence for each planning step. Physical work requires the approved
            equipment procedure and qualified supervision.
          </p>
          <ul className="flex flex-wrap gap-2" aria-label="Modeled job-card conditions">
            {planningReadings.map((reading) => (
              <li
                key={reading.id}
                className={`rounded-lg border px-3 py-2 text-base ${readingStyles[reading.status]}`}
                data-job-card-reading={reading.id}
                data-condition={reading.status}
              >
                <span className="font-semibold">{reading.label}</span>
                <span className="ml-2">{readingStatus[reading.status]}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      <dl
        className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2"
        aria-label="Virtual instrument readings"
        aria-live="polite"
        aria-atomic="true"
      >
        {simulation.readings.map((reading) => (
          <div
            key={reading.id}
            className={`min-w-0 rounded-lg border p-4 ${readingStyles[reading.status]}`}
          >
            <dt className="text-base text-slate-100">{reading.label}</dt>
            <dd className="my-2 break-words text-2xl font-semibold tabular-nums">
              {reading.value}
              {reading.unit && <span className="ml-2 text-base">{reading.unit}</span>}
            </dd>
            <dd className="text-sm leading-relaxed text-slate-200">
              {readingStatus[reading.status]}
            </dd>
          </div>
        ))}
      </dl>
    </figure>
  );
}

function Control({
  control,
  disabled,
  onApply,
}: {
  control: HvacSimulationControl;
  disabled: boolean;
  onApply: (action: Action) => void;
}) {
  const id = useId();
  const [value, setValue] = useState<string | number>(control.value);
  useEffect(() => {
    setValue(control.value);
  }, [control.value]);
  const changed = String(value) !== String(control.value);
  return (
    <form
      className="rounded-lg border border-slate-200 bg-white p-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (!changed || disabled || value === '') return;
        onApply({
          type: 'set-control',
          controlId: control.id,
          value: control.type === 'select' ? value : Number(value),
        });
      }}
    >
      <label htmlFor={id} className="block text-base font-semibold text-slate-900">
        {control.label}
        {control.unit ? ` (${control.unit})` : ''}
      </label>
      {control.type === 'select' ? (
        <select
          id={id}
          value={value}
          disabled={disabled}
          onChange={(event) => setValue(event.target.value)}
          className="mt-2 min-h-11 w-full rounded-lg border border-slate-400 bg-white px-3 py-2 text-base focus-visible:ring-2 focus-visible:ring-orange-500"
        >
          {control.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <>
          <input
            id={id}
            type={control.type}
            min={control.min}
            max={control.max}
            step={control.step}
            value={value}
            required
            disabled={disabled}
            onChange={(event) => setValue(event.target.value)}
            className="mt-2 min-h-11 w-full rounded-lg border border-slate-400 bg-white px-3 py-2 text-base accent-orange-600 focus-visible:ring-2 focus-visible:ring-orange-500"
          />
          {control.type === 'range' && (
            <output htmlFor={id} className="mt-1 block text-base tabular-nums">
              {value} {control.unit}
            </output>
          )}
        </>
      )}
      <button
        type="submit"
        disabled={disabled || !changed || value === ''}
        className={`${buttonClass} mt-3 w-full border border-slate-300 bg-slate-100 text-slate-900`}
      >
        Apply {control.label}
      </button>
      {changed && (
        <p className="mt-2 text-sm text-slate-700">
          Apply this setting to update the model readings.
        </p>
      )}
    </form>
  );
}

export function HvacCourseSimulation({ courseId, lessonId }: Props) {
  const [data, setData] = useState<HvacSimulationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<SaveError | null>(null);
  const [saveMessage, setSaveMessage] = useState('');
  const pending = useRef<HvacSimulationRequest | null>(null);
  const controller = useRef<AbortController | null>(null);
  const generation = useRef(0);
  const currentStage = useRef<string | null>(null);
  const stageHeading = useRef<HTMLHeadingElement | null>(null);

  const load = useCallback(async () => {
    controller.current?.abort();
    const active = new AbortController();
    controller.current = active;
    const token = ++generation.current;
    pending.current = null;
    currentStage.current = null;
    setLoading(true);
    setSaving(false);
    setError(null);
    setSaveMessage('');
    setData(null);
    try {
      const response = await fetch(`${endpoint}?${new URLSearchParams({ courseId, lessonId })}`, {
        credentials: 'same-origin',
        cache: 'no-store',
        signal: active.signal,
      });
      const payload: unknown = await response.json();
      if (token !== generation.current || active.signal.aborted) return;
      if (!response.ok || !isSimulationResponse(payload, lessonId)) {
        throw new Error(
          isRecord(payload) && typeof payload.error === 'string'
            ? payload.error
            : 'The simulation could not load. Try again.',
        );
      }
      setData(payload);
      setSaveMessage(
        payload.progress.lastSavedAt
          ? 'Saved progress restored.'
          : 'Your progress saves after each confirmed action.',
      );
    } catch (caught) {
      if (token !== generation.current || active.signal.aborted) return;
      setError({
        message:
          caught instanceof Error ? caught.message : 'The simulation could not load. Try again.',
        conflict: false,
        retryable: true,
      });
    } finally {
      if (token === generation.current && !active.signal.aborted) setLoading(false);
    }
  }, [courseId, lessonId]);

  useEffect(() => {
    void load();
    return () => {
      generation.current += 1;
      controller.current?.abort();
      pending.current = null;
    };
  }, [load]);

  useEffect(() => {
    const next = data?.simulation.stage?.id ?? null;
    if (currentStage.current && next && next !== currentStage.current)
      stageHeading.current?.focus();
    currentStage.current = next;
  }, [data?.simulation.stage?.id]);

  const send = async (request: HvacSimulationRequest) => {
    const token = generation.current;
    const active = new AbortController();
    controller.current = active;
    setSaving(true);
    setError(null);
    setSaveMessage('Saving this action…');
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
        signal: active.signal,
      });
      const payload: unknown = await response.json();
      if (token !== generation.current || active.signal.aborted) return;
      if (!response.ok) {
        setSaveMessage('This action has not been confirmed as saved.');
        setError({
          message:
            response.status === 409
              ? 'Your saved practice changed or the lesson was updated. Reload saved progress before continuing.'
              : isRecord(payload) && typeof payload.error === 'string'
                ? payload.error
                : 'We could not confirm this action. Retry the save or reload saved progress.',
          conflict: response.status === 409,
          retryable: response.status >= 500,
        });
        return;
      }
      if (!isSimulationResponse(payload, lessonId))
        throw new Error(
          'The server returned an incomplete result. Reload saved progress or retry this save.',
        );
      pending.current = null;
      setData(payload);
      setSaveMessage('Progress saved to your course.');
    } catch (caught) {
      if (token !== generation.current || active.signal.aborted) return;
      setSaveMessage('This action has not been confirmed as saved.');
      setError({
        message:
          caught instanceof Error && caught.message.includes('incomplete result')
            ? caught.message
            : 'The connection was interrupted. Retry this same action or reload saved progress to check its result.',
        conflict: false,
        retryable: true,
      });
    } finally {
      if (token === generation.current && !active.signal.aborted) setSaving(false);
    }
  };

  const apply = (action: Action) => {
    if (!data || saving || pending.current) return;
    const request: HvacSimulationRequest = {
      courseId,
      lessonId,
      simulationId: data.simulation.id,
      expectedRevision: data.progress.revision,
      requestId: requestId(),
      action,
    };
    pending.current = request;
    void send(request);
  };

  if (loading)
    return (
      <section
        id="hvac-simulation"
        className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-base"
        aria-label="HVAC interactive simulation"
        aria-busy="true"
      >
        <p role="status">Loading your virtual HVAC practice…</p>
      </section>
    );
  if (!data)
    return (
      <section
        id="hvac-simulation"
        className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-base"
        aria-label="HVAC interactive simulation"
      >
        <p role="alert">{error?.message ?? 'The simulation is unavailable.'}</p>
        <button
          type="button"
          className={`${buttonClass} mt-4 bg-slate-900 text-white`}
          onClick={() => void load()}
        >
          Retry loading simulation
        </button>
      </section>
    );

  const { simulation, progress } = data;
  const disabled = saving || pending.current !== null;
  const stageCompleted = simulation.finished
    ? simulation.stageCount
    : Math.max(0, simulation.stageNumber - 1);

  return (
    <section
      id="hvac-simulation"
      className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 text-base text-slate-900"
      aria-label="HVAC interactive simulation"
      aria-busy={saving}
    >
      <header className="border-b border-slate-200 bg-white p-5 sm:p-6">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-semibold text-orange-950">
            Simulated training
          </span>
          <span className="text-sm text-slate-600">Chapter {simulation.chapter} practice</span>
        </div>
        <h2 className="text-2xl font-bold">{simulation.title}</h2>
        <p className="mt-2 text-base leading-relaxed text-slate-700">{simulation.objective}</p>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Synthetic equipment and readings. Simulation mastery records learning practice; it does
          not award physical training hours or an official certification.
        </p>
      </header>

      <div className="p-4 sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4">
          <p
            role="status"
            aria-live="polite"
            className={`text-base ${error ? 'text-red-800' : 'text-slate-700'}`}
          >
            {saveMessage}
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-base">
            <span>Attempts: {progress.attemptCount}</span>
            {progress.bestScore !== null && (
              <span>
                Best saved score: <strong>{progress.bestScore}%</strong>
              </span>
            )}
            {progress.mastered && <strong className="text-emerald-800">Mastery saved</strong>}
          </div>
        </div>

        {error && (
          <div role="alert" className="mb-5 rounded-lg border border-amber-400 bg-amber-50 p-4">
            <p className="text-base font-medium text-amber-950">{error.message}</p>
            <div className="mt-3 flex flex-wrap gap-3">
              {error.retryable && !error.conflict && pending.current && (
                <button
                  type="button"
                  className={`${buttonClass} bg-slate-900 text-white`}
                  disabled={saving}
                  onClick={() => {
                    if (pending.current && !saving) void send(pending.current);
                  }}
                >
                  Retry save
                </button>
              )}
              <button
                type="button"
                className={`${buttonClass} border border-slate-400 bg-white text-slate-900`}
                disabled={saving}
                onClick={() => void load()}
              >
                Reload saved progress
              </button>
            </div>
          </div>
        )}

        <div className="grid min-w-0 gap-6 lg:grid-cols-2">
          <div className="min-w-0">
            <VirtualBench simulation={simulation} />
            {simulation.controls.length > 0 && (
              <fieldset disabled={disabled || simulation.finished} className="mt-5 min-w-0">
                <legend className="mb-3 text-lg font-bold">Model controls</legend>
                <div className="grid min-w-0 gap-3">
                  {simulation.controls.map((control) => (
                    <Control
                      key={`${simulation.id}-${control.id}`}
                      control={control}
                      disabled={disabled || simulation.finished}
                      onApply={apply}
                    />
                  ))}
                </div>
              </fieldset>
            )}
          </div>

          <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
            <h3 className="text-lg font-bold">Your service scenario</h3>
            <p className="mt-3 whitespace-pre-line text-base leading-relaxed text-slate-700">
              {simulation.scenario}
            </p>
            <label
              className="mt-6 block text-base font-semibold"
              htmlFor={`hvac-stage-progress-${lessonId}`}
            >
              {simulation.finished
                ? 'Practice stages complete'
                : `Stage ${simulation.stageNumber} of ${simulation.stageCount}`}
            </label>
            <progress
              id={`hvac-stage-progress-${lessonId}`}
              className="mt-2 h-3 w-full accent-orange-600"
              max={Math.max(1, simulation.stageCount)}
              value={stageCompleted}
            >
              {stageCompleted} of {simulation.stageCount}
            </progress>

            {simulation.feedback && (
              <div
                role="status"
                aria-live="polite"
                className={`mt-5 rounded-lg border p-4 text-base leading-relaxed ${simulation.feedback.kind === 'success' ? 'border-emerald-300 bg-emerald-50 text-emerald-950' : simulation.feedback.kind === 'safety' ? 'border-red-300 bg-red-50 text-red-950' : 'border-sky-300 bg-sky-50 text-sky-950'}`}
              >
                <strong className="mb-1 block">
                  {simulation.feedback.kind === 'safety'
                    ? 'Safety stop'
                    : simulation.feedback.kind === 'retry'
                      ? 'Review and try again'
                      : simulation.feedback.kind === 'success'
                        ? 'Practice feedback'
                        : 'Model feedback'}
                </strong>
                {simulation.feedback.message}
              </div>
            )}

            {simulation.stage && !simulation.finished && (
              <div className="mt-6">
                <h4
                  ref={stageHeading}
                  tabIndex={-1}
                  className="text-lg font-bold focus:outline-none"
                >
                  {simulation.stage.title}
                </h4>
                <p className="mt-3 text-base leading-relaxed">{simulation.stage.prompt}</p>
                <button
                  type="button"
                  className={`${buttonClass} mt-4 w-full bg-orange-700 text-white hover:bg-orange-800`}
                  disabled={disabled}
                  onClick={() => apply({ type: 'observe' })}
                >
                  Run virtual check
                </button>
                <p className="mt-2 text-sm text-slate-600">
                  {simulation.observed
                    ? 'Model observations recorded for this stage.'
                    : simulation.stage.observationRequired
                      ? 'Run the virtual check before choosing your response.'
                      : 'Use the virtual check to inspect the modeled conditions.'}
                </p>
                <div role="group" aria-label="Choose your next action" className="mt-5 space-y-3">
                  {simulation.stage.options.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      disabled={
                        disabled || (simulation.stage?.observationRequired && !simulation.observed)
                      }
                      className={`${buttonClass} w-full border border-slate-300 bg-slate-50 text-left leading-relaxed text-slate-900 hover:border-orange-500 hover:bg-orange-50`}
                      onClick={() => {
                        if (simulation.stage)
                          apply({
                            type: 'choose',
                            stageId: simulation.stage.id,
                            optionId: option.id,
                          });
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {simulation.finished && (
              <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
                <h4 className="text-xl font-bold">
                  {simulation.passed ? 'Simulation mastered' : 'Attempt complete'}
                </h4>
                {simulation.score !== null && (
                  <p className="mt-2 text-base">
                    This attempt: <strong>{simulation.score}%</strong>
                  </p>
                )}
                <p className="mt-3 text-base leading-relaxed">
                  {simulation.passed
                    ? 'Your practice result is saved. You can repeat the scenario to strengthen your reasoning.'
                    : 'Review the feedback, then practice the scenario again. Your best saved result is retained.'}
                </p>
              </div>
            )}

            <button
              type="button"
              disabled={disabled || simulation.feedback === null}
              onClick={() => apply({ type: 'reset' })}
              className={`${buttonClass} mt-6 w-full border border-slate-300 bg-white text-slate-800`}
            >
              {simulation.finished ? 'Practice again' : 'Restart this practice'}
            </button>
            <p className="mt-2 text-sm text-slate-600">
              Restarting preserves your best saved score and mastery.
            </p>
          </div>
        </div>
        {simulation.sources.length > 0 && (
          <details className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
            <summary className="cursor-pointer text-base font-semibold focus-visible:ring-2 focus-visible:ring-orange-500">
              Reference material
            </summary>
            <ul className="mt-3 space-y-2">
              {simulation.sources.map((source) => (
                <li key={source.url}>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-words text-base text-blue-800 underline underline-offset-2"
                  >
                    {source.label}
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </section>
  );
}

export default HvacCourseSimulation;
