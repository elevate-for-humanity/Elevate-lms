'use client';

import { useState } from 'react';

interface FurnaceComponent {
  id: string;
  label: string;
  description: string;
  diagnosticTip: string;
  cx: number;
  cy: number;
  w: number;
  h: number;
  color: string;
}

const COMPONENTS: FurnaceComponent[] = [
  {
    id: 'burner',
    label: 'Burner Assembly',
    description: 'Mixes natural gas or propane with air and produces a controlled flame inside the combustion chamber. Multiple burner tubes fire simultaneously.',
    diagnosticTip: 'Inspect flame color — blue with small yellow tips is normal. Check gas pressure at the manifold with a manometer.',
    cx: 200, cy: 370, w: 160, h: 40, color: '#dc2626',
  },
  {
    id: 'heat-exchanger',
    label: 'Heat Exchanger',
    description: 'Metal chambers that transfer heat from combustion gases to room air without mixing them. A cracked heat exchanger can leak carbon monoxide — a life-threatening hazard.',
    diagnosticTip: 'Visual inspection for cracks or rust. CO test in supply air. Flame disturbance test with blower running. A cracked heat exchanger = red-tag the system.',
    cx: 200, cy: 280, w: 160, h: 60, color: '#ea580c',
  },
  {
    id: 'blower',
    label: 'Blower Motor',
    description: 'Pushes conditioned air through the duct system. PSC motors have fixed speeds selected by wire taps. ECM motors adjust speed automatically for efficiency.',
    diagnosticTip: 'Check amp draw against nameplate. Verify correct speed tap for heating vs cooling. Listen for bearing noise.',
    cx: 200, cy: 170, w: 140, h: 70, color: '#2563eb',
  },
  {
    id: 'igniter',
    label: 'Ignition System',
    description: 'Hot surface igniters (HSI) glow red-hot (1800°F+) to ignite gas. Silicon carbide or silicon nitride element. Fragile — do not touch with bare hands.',
    diagnosticTip: 'Measure resistance — typically 40–200 ohms when cold. Inspect for cracks. If the igniter glows but gas does not light, check gas valve and pressure.',
    cx: 340, cy: 370, w: 80, h: 30, color: '#f59e0b',
  },
  {
    id: 'flame-sensor',
    label: 'Flame Sensor',
    description: 'A thin metal rod that sits in the flame path. Proves flame is present by conducting a tiny current (microamps) through the flame to ground.',
    diagnosticTip: 'Measure flame signal — should be 1–6 µA minimum. Clean with fine abrasive pad if signal is low. Dirty flame sensor = most common no-heat call.',
    cx: 340, cy: 320, w: 80, h: 30, color: '#8b5cf6',
  },
  {
    id: 'gas-valve',
    label: 'Gas Valve',
    description: 'Controls gas flow to the burners. Opens when the control board signals demand and all safety switches are satisfied. Has inlet and outlet pressure taps.',
    diagnosticTip: 'Measure 24V at the gas valve terminals when calling for heat. Check inlet pressure (7" WC natural gas) and outlet/manifold pressure (3.5" WC).',
    cx: 80, cy: 370, w: 80, h: 40, color: '#059669',
  },
  {
    id: 'control-board',
    label: 'Control Board',
    description: 'The brain of the furnace. Sequences ignition, monitors safety switches, controls blower timing, and reports faults via LED codes.',
    diagnosticTip: 'Read LED fault codes — refer to the code chart on the furnace panel. Check for burned traces or damaged relays.',
    cx: 350, cy: 170, w: 100, h: 50, color: '#0891b2',
  },
  {
    id: 'filter',
    label: 'Air Filter',
    description: 'Removes dust and particles from return air before it enters the blower and passes over the heat exchanger or evaporator coil.',
    diagnosticTip: 'Inspect monthly. A dirty filter restricts airflow, causing the limit switch to trip and the furnace to short-cycle.',
    cx: 200, cy: 100, w: 160, h: 25, color: '#64748b',
  },
  {
    id: 'evap-coil',
    label: 'Evaporator Coil (A-Coil)',
    description: 'Mounted above the furnace in the supply plenum. Used for cooling — not part of the heating cycle but shares the same airflow path.',
    diagnosticTip: 'Check for ice buildup. Ensure the condensate drain is clear. A dirty evaporator coil reduces both heating and cooling airflow.',
    cx: 200, cy: 50, w: 160, h: 30, color: '#0891b2',
  },
];

interface Props {
  mode?: 'explore' | 'quiz' | 'review';
}

export default function FurnaceBreakdownDiagram({ mode = 'explore' }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  const handleClick = (id: string) => {
    setActiveId(id);
    if (mode === 'quiz') setRevealed((p) => new Set(p).add(id));
  };

  const show = (id: string) => mode !== 'quiz' || revealed.has(id);
  const active = COMPONENTS.find((c) => c.id === activeId);

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
        <h3 className="font-bold text-slate-900">Furnace / Air Handler Breakdown</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          {mode === 'quiz' ? 'Click each area to identify the component' : 'Click any component to learn its function and diagnostic tips'}
        </p>
      </div>

      <div className="p-4 md:p-6">
        <svg viewBox="0 0 480 430" className="w-full max-w-lg mx-auto" role="img" aria-label="Furnace breakdown showing burner, heat exchanger, blower, igniter, flame sensor, gas valve, control board, filter, and evaporator coil">
          {/* Cabinet outline */}
          <rect x="60" y="20" width="320" height="400" rx="12" fill="#f8fafc" stroke="#94a3b8" strokeWidth="2" />

          {/* Airflow arrows */}
          <text x="20" y="110" fill="#2563eb" fontSize="10" fontWeight="600">RETURN</text>
          <text x="20" y="125" fill="#2563eb" fontSize="10">AIR →</text>
          <text x="400" y="45" fill="#16a34a" fontSize="10" fontWeight="600">SUPPLY</text>
          <text x="400" y="60" fill="#16a34a" fontSize="10">AIR ↑</text>

          {/* Evaporator coil (top) */}
          <rect x={COMPONENTS[8].cx - COMPONENTS[8].w / 2} y={COMPONENTS[8].cy - COMPONENTS[8].h / 2} width={COMPONENTS[8].w} height={COMPONENTS[8].h} rx="4"
            fill={activeId === 'evap-coil' ? '#a5f3fc' : '#cffafe'} stroke="#0891b2" strokeWidth="2"
            onClick={() => handleClick('evap-coil')} className="cursor-pointer" />
          {Array.from({ length: 12 }).map((_, i) => (
            <line key={`ec${i}`} x1={130 + i * 12} y1={38} x2={130 + i * 12} y2={62} stroke="#0891b2" strokeWidth="1" opacity="0.3" />
          ))}
          <text x="200" y="55" textAnchor="middle" fill="#0891b2" fontSize="9" fontWeight="600">
            {show('evap-coil') ? 'EVAPORATOR COIL' : '?'}
          </text>

          {/* Filter */}
          <rect x={COMPONENTS[7].cx - COMPONENTS[7].w / 2} y={COMPONENTS[7].cy - COMPONENTS[7].h / 2} width={COMPONENTS[7].w} height={COMPONENTS[7].h} rx="3"
            fill={activeId === 'filter' ? '#e2e8f0' : '#f1f5f9'} stroke="#64748b" strokeWidth="1.5"
            onClick={() => handleClick('filter')} className="cursor-pointer" />
          {Array.from({ length: 16 }).map((_, i) => (
            <line key={`f${i}`} x1={125 + i * 10} y1={90} x2={125 + i * 10} y2={110} stroke="#94a3b8" strokeWidth="0.5" />
          ))}
          <text x="200" y="104" textAnchor="middle" fill="#64748b" fontSize="8" fontWeight="600">
            {show('filter') ? 'AIR FILTER' : '?'}
          </text>

          {/* Blower motor */}
          <ellipse cx={COMPONENTS[2].cx} cy={COMPONENTS[2].cy} rx={COMPONENTS[2].w / 2} ry={COMPONENTS[2].h / 2}
            fill={activeId === 'blower' ? '#bfdbfe' : '#dbeafe'} stroke="#2563eb" strokeWidth="2"
            onClick={() => handleClick('blower')} className="cursor-pointer" />
          <circle cx="200" cy="170" r="25" fill="none" stroke="#2563eb" strokeWidth="1" />
          <text x="200" y="175" textAnchor="middle" fill="#2563eb" fontSize="10" fontWeight="600">
            {show('blower') ? 'BLOWER' : '?'}
          </text>

          {/* Heat exchanger */}
          <rect x={COMPONENTS[1].cx - COMPONENTS[1].w / 2} y={COMPONENTS[1].cy - COMPONENTS[1].h / 2} width={COMPONENTS[1].w} height={COMPONENTS[1].h} rx="6"
            fill={activeId === 'heat-exchanger' ? '#fed7aa' : '#ffedd5'} stroke="#ea580c" strokeWidth="2"
            onClick={() => handleClick('heat-exchanger')} className="cursor-pointer" />
          {/* Heat exchanger tubes */}
          {Array.from({ length: 4 }).map((_, i) => (
            <rect key={`hx${i}`} x={135} y={258 + i * 14} width={130} height={8} rx="4" fill="#fdba74" stroke="#ea580c" strokeWidth="0.5" />
          ))}
          <text x="200" y="275" textAnchor="middle" fill="#ea580c" fontSize="10" fontWeight="700">
            {show('heat-exchanger') ? 'HEAT EXCHANGER' : '?'}
          </text>

          {/* Burner assembly */}
          <rect x={COMPONENTS[0].cx - COMPONENTS[0].w / 2} y={COMPONENTS[0].cy - COMPONENTS[0].h / 2} width={COMPONENTS[0].w} height={COMPONENTS[0].h} rx="4"
            fill={activeId === 'burner' ? '#fecaca' : '#fee2e2'} stroke="#dc2626" strokeWidth="2"
            onClick={() => handleClick('burner')} className="cursor-pointer" />
          {/* Flame icons */}
          {Array.from({ length: 4 }).map((_, i) => (
            <text key={`fl${i}`} x={145 + i * 35} y={375} fill="#dc2626" fontSize="14">🔥</text>
          ))}
          <text x="200" y="395" textAnchor="middle" fill="#dc2626" fontSize="9" fontWeight="600">
            {show('burner') ? 'BURNER ASSEMBLY' : '?'}
          </text>

          {/* Gas valve (left of burner) */}
          <rect x={COMPONENTS[5].cx - COMPONENTS[5].w / 2} y={COMPONENTS[5].cy - COMPONENTS[5].h / 2} width={COMPONENTS[5].w} height={COMPONENTS[5].h} rx="4"
            fill={activeId === 'gas-valve' ? '#bbf7d0' : '#dcfce7'} stroke="#059669" strokeWidth="2"
            onClick={() => handleClick('gas-valve')} className="cursor-pointer" />
          <text x="80" y="375" textAnchor="middle" fill="#059669" fontSize="8" fontWeight="600">
            {show('gas-valve') ? 'GAS VALVE' : '?'}
          </text>
          {/* Gas line */}
          <line x1="80" y1="350" x2="80" y2="330" stroke="#059669" strokeWidth="2" />
          <text x="80" y="325" textAnchor="middle" fill="#059669" fontSize="7">GAS IN</text>

          {/* Igniter */}
          <rect x={COMPONENTS[3].cx - COMPONENTS[3].w / 2} y={COMPONENTS[3].cy - COMPONENTS[3].h / 2} width={COMPONENTS[3].w} height={COMPONENTS[3].h} rx="4"
            fill={activeId === 'igniter' ? '#fef3c7' : '#fefce8'} stroke="#f59e0b" strokeWidth="2"
            onClick={() => handleClick('igniter')} className="cursor-pointer" />
          <text x="340" y="375" textAnchor="middle" fill="#f59e0b" fontSize="8" fontWeight="600">
            {show('igniter') ? 'IGNITER (HSI)' : '?'}
          </text>

          {/* Flame sensor */}
          <rect x={COMPONENTS[4].cx - COMPONENTS[4].w / 2} y={COMPONENTS[4].cy - COMPONENTS[4].h / 2} width={COMPONENTS[4].w} height={COMPONENTS[4].h} rx="4"
            fill={activeId === 'flame-sensor' ? '#ede9fe' : '#f5f3ff'} stroke="#8b5cf6" strokeWidth="2"
            onClick={() => handleClick('flame-sensor')} className="cursor-pointer" />
          <text x="340" y="325" textAnchor="middle" fill="#8b5cf6" fontSize="8" fontWeight="600">
            {show('flame-sensor') ? 'FLAME SENSOR' : '?'}
          </text>

          {/* Control board */}
          <rect x={COMPONENTS[6].cx - COMPONENTS[6].w / 2} y={COMPONENTS[6].cy - COMPONENTS[6].h / 2} width={COMPONENTS[6].w} height={COMPONENTS[6].h} rx="6"
            fill={activeId === 'control-board' ? '#a5f3fc' : '#ecfeff'} stroke="#0891b2" strokeWidth="2"
            onClick={() => handleClick('control-board')} className="cursor-pointer" />
          {/* LED indicator */}
          <circle cx="340" cy="160" r="3" fill="#22c55e" />
          <circle cx="350" cy="160" r="3" fill="#ef4444" />
          <text x="350" y="180" textAnchor="middle" fill="#0891b2" fontSize="8" fontWeight="600">
            {show('control-board') ? 'CONTROL BOARD' : '?'}
          </text>

          {/* Flue pipe (top) */}
          <rect x="180" y="0" width="40" height="25" rx="2" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
          <text x="200" y="15" textAnchor="middle" fill="#64748b" fontSize="7">FLUE</text>
        </svg>

        {/* Detail panel */}
        {active && (
          <div className="mt-4 rounded-lg p-5 bg-slate-50 border-l-4" style={{ borderColor: active.color }}>
            <h4 className="font-bold text-slate-900 text-lg">{active.label}</h4>
            <p className="text-sm text-slate-700 mt-2">{active.description}</p>
            <div className="mt-3 bg-white rounded-lg p-3 border border-slate-200">
              <p className="text-xs font-bold text-slate-500 uppercase mb-1">Diagnostic Tip</p>
              <p className="text-sm text-slate-700">{active.diagnosticTip}</p>
            </div>
          </div>
        )}

        {!active && (
          <p className="text-center text-sm text-slate-400 mt-4">
            Click any component in the furnace to learn its function and how to diagnose it.
          </p>
        )}
      </div>
    </div>
  );
}
