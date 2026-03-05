'use client';

import { useState } from 'react';

interface ComponentInfo {
  id: string;
  label: string;
  description: string;
  diagnosticTip: string;
  /** SVG position for the label callout */
  cx: number;
  cy: number;
  /** Hotspot click area */
  rx: number;
  ry: number;
  color: string;
}

const COMPONENTS: ComponentInfo[] = [
  {
    id: 'compressor',
    label: 'Compressor',
    description:
      'The heart of the system. Compresses low-pressure refrigerant vapor into high-pressure, high-temperature gas. Mounted on rubber isolators to reduce vibration.',
    diagnosticTip: 'Measure amp draw with a clamp meter and compare to the RLA on the nameplate. Check winding resistance between C, S, and R terminals.',
    cx: 350, cy: 340, rx: 55, ry: 40,
    color: '#dc2626',
  },
  {
    id: 'condenser-coil',
    label: 'Condenser Coil',
    description:
      'Wraps around the inside of the cabinet. Hot refrigerant gas flows through the coil, releasing heat to the outdoor air. Refrigerant exits as a warm liquid.',
    diagnosticTip: 'Inspect for dirt, debris, or bent fins. High discharge pressure often means a dirty condenser coil.',
    cx: 150, cy: 220, rx: 40, ry: 120,
    color: '#ea580c',
  },
  {
    id: 'fan-motor',
    label: 'Fan Motor',
    description:
      'Mounted at the top of the unit. Drives the fan blade that pulls outdoor air through the condenser coil to remove heat from the refrigerant.',
    diagnosticTip: 'Check amp draw, verify the blade spins freely with power off, and test the run capacitor.',
    cx: 350, cy: 80, rx: 50, ry: 35,
    color: '#7c3aed',
  },
  {
    id: 'capacitor',
    label: 'Run Capacitor',
    description:
      'A silver or black cylinder that stores electrical energy. Provides the extra boost motors need to start and keeps them running efficiently. Rated in microfarads (µF).',
    diagnosticTip: 'Measure capacitance — must be within ±6% of the rated value. Inspect for bulging, oil leaks, or burn marks.',
    cx: 530, cy: 200, rx: 30, ry: 25,
    color: '#0891b2',
  },
  {
    id: 'contactor',
    label: 'Contactor',
    description:
      'An electrically controlled switch. When the thermostat calls for cooling, 24V energizes the contactor coil, pulling the contacts closed to send line voltage to the compressor and fan motor.',
    diagnosticTip: 'Check for pitted or burned contacts. Measure 24V across the coil when the thermostat calls. Stuck closed = compressor runs nonstop.',
    cx: 530, cy: 300, rx: 30, ry: 25,
    color: '#059669',
  },
  {
    id: 'service-valves',
    label: 'Service Valves',
    description:
      'Schrader-type ports on the suction (large) and liquid (small) lines. Technicians connect manifold gauges here to measure system pressures and charge refrigerant.',
    diagnosticTip: 'Always cap service valves after use. Leaking valve cores are a common source of slow refrigerant leaks.',
    cx: 200, cy: 380, rx: 35, ry: 20,
    color: '#2563eb',
  },
];

interface Props {
  mode?: 'explore' | 'quiz' | 'review';
  onComponentSelect?: (componentId: string) => void;
}

export default function CondenserBreakdownDiagram({ mode = 'explore', onComponentSelect }: Props) {
  const [activeComponent, setActiveComponent] = useState<string | null>(null);
  const [revealedComponents, setRevealedComponents] = useState<Set<string>>(new Set());

  const handleClick = (id: string) => {
    setActiveComponent(id);
    if (mode === 'quiz') {
      setRevealedComponents((prev) => new Set(prev).add(id));
    }
    onComponentSelect?.(id);
  };

  const isRevealed = (id: string) =>
    mode === 'review' || mode === 'explore' || revealedComponents.has(id);

  const active = COMPONENTS.find((c) => c.id === activeComponent);

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
        <h3 className="font-bold text-slate-900">Condenser Unit Breakdown</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          {mode === 'quiz'
            ? 'Click each hotspot to identify the component'
            : 'Click any component to learn what it does and how to diagnose it'}
        </p>
      </div>

      <div className="p-4 md:p-6">
        <svg viewBox="0 0 700 440" className="w-full max-w-2xl mx-auto" role="img" aria-label="Condenser unit showing compressor, coil, fan motor, capacitor, contactor, and service valves">
          {/* Unit cabinet outline */}
          <rect x="100" y="40" width="500" height="380" rx="16" fill="#f8fafc" stroke="#94a3b8" strokeWidth="2" />
          <rect x="100" y="40" width="500" height="380" rx="16" fill="none" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="4 4" />

          {/* Cabinet label */}
          <text x="350" y="30" textAnchor="middle" fill="#64748b" fontSize="12" fontWeight="600">OUTDOOR CONDENSER UNIT</text>

          {/* Fan grille (top) */}
          <circle cx="350" cy="80" r="50" fill="none" stroke="#94a3b8" strokeWidth="1.5" />
          <circle cx="350" cy="80" r="35" fill="none" stroke="#94a3b8" strokeWidth="1" />
          <circle cx="350" cy="80" r="20" fill="none" stroke="#94a3b8" strokeWidth="1" />
          <line x1="300" y1="80" x2="400" y2="80" stroke="#94a3b8" strokeWidth="1" />
          <line x1="350" y1="30" x2="350" y2="130" stroke="#94a3b8" strokeWidth="1" />

          {/* Condenser coil (left side, vertical) */}
          <rect x="115" y="100" width="30" height="280" rx="4" fill="#ffedd5" stroke="#ea580c" strokeWidth="2" />
          {/* Coil fins */}
          {Array.from({ length: 14 }).map((_, i) => (
            <line key={i} x1="118" y1={110 + i * 20} x2="142" y2={110 + i * 20} stroke="#ea580c" strokeWidth="1" opacity="0.5" />
          ))}

          {/* Condenser coil (right side) */}
          <rect x="555" y="100" width="30" height="280" rx="4" fill="#ffedd5" stroke="#ea580c" strokeWidth="2" />
          {Array.from({ length: 14 }).map((_, i) => (
            <line key={i} x1="558" y1={110 + i * 20} x2="582" y2={110 + i * 20} stroke="#ea580c" strokeWidth="1" opacity="0.5" />
          ))}

          {/* Compressor (center bottom) */}
          <ellipse cx="350" cy="340" rx="55" ry="40" fill="#fee2e2" stroke="#dc2626" strokeWidth="2.5" />
          <ellipse cx="350" cy="330" rx="40" ry="25" fill="#fecaca" stroke="#dc2626" strokeWidth="1" />
          <text x="350" y="350" textAnchor="middle" fill="#dc2626" fontSize="10" fontWeight="600">
            {isRevealed('compressor') ? 'COMPRESSOR' : mode === 'quiz' ? '?' : 'COMPRESSOR'}
          </text>

          {/* Capacitor (right side) */}
          <rect x="500" y="175" width="40" height="50" rx="6" fill="#ecfeff" stroke="#0891b2" strokeWidth="2" />
          <line x1="510" y1="185" x2="530" y2="185" stroke="#0891b2" strokeWidth="1.5" />
          <line x1="510" y1="195" x2="530" y2="195" stroke="#0891b2" strokeWidth="1.5" />
          <text x="520" y="215" textAnchor="middle" fill="#0891b2" fontSize="8" fontWeight="600">
            {isRevealed('capacitor') ? 'CAP' : '?'}
          </text>

          {/* Contactor (right side, lower) */}
          <rect x="500" y="275" width="40" height="50" rx="4" fill="#ecfdf5" stroke="#059669" strokeWidth="2" />
          <rect x="508" y="283" width="24" height="8" rx="2" fill="#059669" opacity="0.3" />
          <rect x="508" y="295" width="24" height="8" rx="2" fill="#059669" opacity="0.3" />
          <text x="520" y="318" textAnchor="middle" fill="#059669" fontSize="7" fontWeight="600">
            {isRevealed('contactor') ? 'CONTACTOR' : '?'}
          </text>

          {/* Service valves (bottom left) */}
          <circle cx="200" cy="380" r="8" fill="#dbeafe" stroke="#2563eb" strokeWidth="2" />
          <circle cx="230" cy="380" r="6" fill="#dbeafe" stroke="#2563eb" strokeWidth="2" />
          <text x="215" y="400" textAnchor="middle" fill="#2563eb" fontSize="8" fontWeight="600">
            {isRevealed('service-valves') ? 'SERVICE VALVES' : '?'}
          </text>

          {/* Refrigerant lines */}
          <line x1="200" y1="372" x2="200" y2="340" stroke="#2563eb" strokeWidth="2" strokeDasharray="4 2" />
          <line x1="295" y1="340" x2="200" y2="340" stroke="#2563eb" strokeWidth="2" strokeDasharray="4 2" />

          {/* Fan motor label */}
          <text x="350" y="85" textAnchor="middle" fill="#7c3aed" fontSize="10" fontWeight="600">
            {isRevealed('fan-motor') ? 'FAN MOTOR' : mode === 'quiz' ? '?' : 'FAN MOTOR'}
          </text>

          {/* Clickable hotspots (invisible, on top) */}
          {COMPONENTS.map((comp) => (
            <ellipse
              key={comp.id}
              cx={comp.cx}
              cy={comp.cy}
              rx={comp.rx}
              ry={comp.ry}
              fill="transparent"
              className="cursor-pointer"
              onClick={() => handleClick(comp.id)}
              role="button"
              aria-label={`Component: ${comp.label}`}
            >
              <title>{isRevealed(comp.id) ? comp.label : 'Click to identify'}</title>
            </ellipse>
          ))}

          {/* Active indicator ring */}
          {activeComponent && (() => {
            const c = COMPONENTS.find((x) => x.id === activeComponent);
            if (!c) return null;
            return (
              <ellipse cx={c.cx} cy={c.cy} rx={c.rx + 5} ry={c.ry + 5} fill="none" stroke={c.color} strokeWidth="2" opacity="0.5">
                <animate attributeName="opacity" from="0.5" to="0" dur="1.2s" repeatCount="indefinite" />
              </ellipse>
            );
          })()}
        </svg>

        {/* Detail panel */}
        {active && (
          <div className="mt-4 rounded-lg p-5 border-l-4 bg-slate-50" style={{ borderColor: active.color }}>
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
            Click any component in the condenser unit to learn what it does.
          </p>
        )}

        {/* Quiz progress */}
        {mode === 'quiz' && (
          <div className="mt-4 flex items-center gap-2 justify-center flex-wrap">
            {COMPONENTS.map((c) => (
              <span
                key={c.id}
                className={`text-xs px-2 py-1 rounded-full transition ${
                  revealedComponents.has(c.id)
                    ? 'bg-green-100 text-green-700'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {revealedComponents.has(c.id) ? c.label : '???'}
              </span>
            ))}
            <span className="text-xs text-slate-500 ml-2">
              {revealedComponents.size}/{COMPONENTS.length} identified
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
