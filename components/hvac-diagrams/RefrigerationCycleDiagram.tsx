'use client';

import { useState } from 'react';

interface StageInfo {
  id: string;
  label: string;
  subtitle: string;
  description: string;
  pressure: string;
  temperature: string;
  state: string;
  color: string;
  bgColor: string;
}

const STAGES: StageInfo[] = [
  {
    id: 'compression',
    label: '1. Compression',
    subtitle: 'Compressor',
    description:
      'The compressor takes low-pressure, low-temperature vapor from the evaporator and compresses it into high-pressure, high-temperature gas. This is the "pump" that drives the entire cycle.',
    pressure: 'Low → High (e.g. 118 → 410 psig for R-410A)',
    temperature: 'Low → High (e.g. 45°F → 170°F)',
    state: 'Low-pressure vapor → High-pressure vapor',
    color: '#dc2626',
    bgColor: '#fef2f2',
  },
  {
    id: 'condensation',
    label: '2. Condensation',
    subtitle: 'Condenser Coil',
    description:
      'Hot, high-pressure gas flows through the condenser coil. The outdoor fan blows air across the coil, removing heat. The refrigerant cools and condenses into a warm, high-pressure liquid.',
    pressure: 'High (stays high, ~410 psig)',
    temperature: 'High → Warm (170°F → 100°F)',
    state: 'High-pressure vapor → High-pressure liquid',
    color: '#ea580c',
    bgColor: '#fff7ed',
  },
  {
    id: 'expansion',
    label: '3. Expansion',
    subtitle: 'Metering Device (TXV/Piston)',
    description:
      'The metering device creates a sudden pressure drop. High-pressure liquid becomes a cold, low-pressure mixture of liquid and vapor. This is where the refrigerant gets cold.',
    pressure: 'High → Low (410 → 118 psig)',
    temperature: 'Warm → Cold (100°F → 40°F)',
    state: 'High-pressure liquid → Low-pressure mix',
    color: '#2563eb',
    bgColor: '#eff6ff',
  },
  {
    id: 'evaporation',
    label: '4. Evaporation',
    subtitle: 'Evaporator Coil',
    description:
      'Cold refrigerant flows through the evaporator coil inside the building. Warm indoor air blows across the coil. The refrigerant absorbs heat and evaporates into a low-pressure vapor, cooling the air.',
    pressure: 'Low (stays low, ~118 psig)',
    temperature: 'Cold → Cool (40°F → 55°F)',
    state: 'Low-pressure mix → Low-pressure vapor',
    color: '#0891b2',
    bgColor: '#ecfeff',
  },
];

interface Props {
  /** 'explore' = click to learn, 'quiz' = label the stages, 'review' = all labels shown */
  mode?: 'explore' | 'quiz' | 'review';
  onStageSelect?: (stageId: string) => void;
}

export default function RefrigerationCycleDiagram({ mode = 'explore', onStageSelect }: Props) {
  const [activeStage, setActiveStage] = useState<string | null>(null);
  const [revealedStages, setRevealedStages] = useState<Set<string>>(new Set());

  const handleStageClick = (stageId: string) => {
    setActiveStage(stageId);
    if (mode === 'quiz') {
      setRevealedStages((prev) => new Set(prev).add(stageId));
    }
    onStageSelect?.(stageId);
  };

  const isRevealed = (stageId: string) =>
    mode === 'review' || mode === 'explore' || revealedStages.has(stageId);

  const active = STAGES.find((s) => s.id === activeStage);

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
        <h3 className="font-bold text-slate-900">Refrigeration Cycle Diagram</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          {mode === 'quiz'
            ? 'Click each stage to reveal its name and details'
            : 'Click any stage to learn what happens at that point in the cycle'}
        </p>
      </div>

      <div className="p-4 md:p-6">
        {/* SVG Diagram */}
        <svg viewBox="0 0 700 460" className="w-full max-w-2xl mx-auto" role="img" aria-label="Refrigeration cycle showing compression, condensation, expansion, and evaporation stages">
          {/* Background zones */}
          <rect x="350" y="10" width="340" height="200" rx="12" fill="#fef2f2" stroke="#fecaca" strokeWidth="1" />
          <text x="520" y="35" textAnchor="middle" className="text-[11px]" fill="#991b1b" fontWeight="600">OUTDOOR UNIT (Hot Side)</text>

          <rect x="10" y="250" width="340" height="200" rx="12" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="1" />
          <text x="180" y="275" textAnchor="middle" className="text-[11px]" fill="#1e3a8a" fontWeight="600">INDOOR UNIT (Cold Side)</text>

          {/* ── COMPRESSOR (bottom-right) ── */}
          <g
            onClick={() => handleStageClick('compression')}
            className="cursor-pointer"
            role="button"
            aria-label="Stage 1: Compression"
          >
            <circle cx="520" cy="170" r="42" fill={activeStage === 'compression' ? '#fecaca' : '#fee2e2'} stroke="#dc2626" strokeWidth="2.5" />
            <text x="520" y="162" textAnchor="middle" fill="#dc2626" fontWeight="700" fontSize="13">
              {isRevealed('compression') ? 'COMPRESSOR' : mode === 'quiz' ? '?' : 'COMPRESSOR'}
            </text>
            <text x="520" y="180" textAnchor="middle" fill="#991b1b" fontSize="10">
              {isRevealed('compression') ? 'Stage 1' : ''}
            </text>
            {/* Pulsing indicator */}
            {activeStage === 'compression' && (
              <circle cx="520" cy="170" r="46" fill="none" stroke="#dc2626" strokeWidth="1.5" opacity="0.4">
                <animate attributeName="r" from="46" to="54" dur="1s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.4" to="0" dur="1s" repeatCount="indefinite" />
              </circle>
            )}
          </g>

          {/* ── CONDENSER COIL (top-right) ── */}
          <g
            onClick={() => handleStageClick('condensation')}
            className="cursor-pointer"
            role="button"
            aria-label="Stage 2: Condensation"
          >
            <rect x="430" y="50" width="180" height="60" rx="10" fill={activeStage === 'condensation' ? '#fed7aa' : '#ffedd5'} stroke="#ea580c" strokeWidth="2.5" />
            <text x="520" y="77" textAnchor="middle" fill="#ea580c" fontWeight="700" fontSize="13">
              {isRevealed('condensation') ? 'CONDENSER COIL' : mode === 'quiz' ? '?' : 'CONDENSER COIL'}
            </text>
            <text x="520" y="97" textAnchor="middle" fill="#9a3412" fontSize="10">
              {isRevealed('condensation') ? 'Stage 2 — Heat Rejected' : ''}
            </text>
          </g>

          {/* ── METERING DEVICE (bottom-left) ── */}
          <g
            onClick={() => handleStageClick('expansion')}
            className="cursor-pointer"
            role="button"
            aria-label="Stage 3: Expansion"
          >
            <rect x="130" y="300" width="100" height="50" rx="8" fill={activeStage === 'expansion' ? '#bfdbfe' : '#dbeafe'} stroke="#2563eb" strokeWidth="2.5" />
            <text x="180" y="322" textAnchor="middle" fill="#2563eb" fontWeight="700" fontSize="11">
              {isRevealed('expansion') ? 'METERING' : mode === 'quiz' ? '?' : 'METERING'}
            </text>
            <text x="180" y="338" textAnchor="middle" fill="#1e40af" fontSize="10">
              {isRevealed('expansion') ? 'Stage 3' : ''}
            </text>
          </g>

          {/* ── EVAPORATOR COIL (top-left) ── */}
          <g
            onClick={() => handleStageClick('evaporation')}
            className="cursor-pointer"
            role="button"
            aria-label="Stage 4: Evaporation"
          >
            <rect x="50" y="370" width="180" height="60" rx="10" fill={activeStage === 'evaporation' ? '#a5f3fc' : '#cffafe'} stroke="#0891b2" strokeWidth="2.5" />
            <text x="140" y="397" textAnchor="middle" fill="#0891b2" fontWeight="700" fontSize="13">
              {isRevealed('evaporation') ? 'EVAPORATOR COIL' : mode === 'quiz' ? '?' : 'EVAPORATOR COIL'}
            </text>
            <text x="140" y="417" textAnchor="middle" fill="#155e75" fontSize="10">
              {isRevealed('evaporation') ? 'Stage 4 — Heat Absorbed' : ''}
            </text>
          </g>

          {/* ── FLOW ARROWS ── */}
          <defs>
            <marker id="arrowRed" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <path d="M0,0 L8,3 L0,6" fill="#dc2626" />
            </marker>
            <marker id="arrowOrange" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <path d="M0,0 L8,3 L0,6" fill="#ea580c" />
            </marker>
            <marker id="arrowBlue" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <path d="M0,0 L8,3 L0,6" fill="#2563eb" />
            </marker>
            <marker id="arrowCyan" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <path d="M0,0 L8,3 L0,6" fill="#0891b2" />
            </marker>
          </defs>

          {/* Compressor → Condenser (hot gas, going up) */}
          <path d="M520,128 L520,115" fill="none" stroke="#dc2626" strokeWidth="3" markerEnd="url(#arrowRed)" />
          <text x="540" y="122" fill="#dc2626" fontSize="9" fontWeight="600">HOT GAS ↑</text>

          {/* Condenser → Metering Device (liquid line, going left and down) */}
          <path d="M430,80 L370,80 L370,240 L240,240 L240,300" fill="none" stroke="#ea580c" strokeWidth="3" markerEnd="url(#arrowOrange)" strokeDasharray="none" />
          <text x="310" y="72" fill="#ea580c" fontSize="9" fontWeight="600">LIQUID LINE →</text>
          <text x="250" y="260" fill="#ea580c" fontSize="9" fontWeight="600">HIGH PRESS LIQUID ↓</text>

          {/* Metering Device → Evaporator (cold mix, going down) */}
          <path d="M180,350 L140,370" fill="none" stroke="#2563eb" strokeWidth="3" markerEnd="url(#arrowBlue)" />
          <text x="100" y="362" fill="#2563eb" fontSize="9" fontWeight="600">COLD MIX ↓</text>

          {/* Evaporator → Compressor (suction line, going right and up) */}
          <path d="M230,400 L330,400 L330,240 L480,240 L480,210" fill="none" stroke="#0891b2" strokeWidth="3" markerEnd="url(#arrowCyan)" />
          <text x="390" y="248" fill="#0891b2" fontSize="9" fontWeight="600">SUCTION LINE →</text>
          <text x="490" y="232" fill="#0891b2" fontSize="9" fontWeight="600">LOW PRESS VAPOR ↑</text>

          {/* Heat arrows */}
          <g opacity="0.6">
            {/* Heat out at condenser */}
            <text x="640" y="70" fill="#dc2626" fontSize="20">☀</text>
            <text x="630" y="90" fill="#991b1b" fontSize="9">HEAT OUT</text>

            {/* Heat in at evaporator */}
            <text x="30" y="420" fill="#2563eb" fontSize="16">🏠</text>
            <text x="20" y="440" fill="#1e40af" fontSize="9">HEAT IN</text>
          </g>
        </svg>

        {/* Stage detail panel */}
        {active && (
          <div
            className="mt-4 rounded-lg p-5 border-l-4 transition-all"
            style={{ backgroundColor: active.bgColor, borderColor: active.color }}
          >
            <h4 className="font-bold text-slate-900 text-lg">{active.label}</h4>
            <p className="text-xs font-semibold mt-0.5" style={{ color: active.color }}>
              {active.subtitle}
            </p>
            <p className="text-sm text-slate-700 mt-2">{active.description}</p>
            <div className="grid sm:grid-cols-3 gap-3 mt-3">
              <div className="bg-white/70 rounded-lg p-3">
                <p className="text-xs font-bold text-slate-500 uppercase">Pressure</p>
                <p className="text-sm text-slate-800 mt-0.5">{active.pressure}</p>
              </div>
              <div className="bg-white/70 rounded-lg p-3">
                <p className="text-xs font-bold text-slate-500 uppercase">Temperature</p>
                <p className="text-sm text-slate-800 mt-0.5">{active.temperature}</p>
              </div>
              <div className="bg-white/70 rounded-lg p-3">
                <p className="text-xs font-bold text-slate-500 uppercase">Refrigerant State</p>
                <p className="text-sm text-slate-800 mt-0.5">{active.state}</p>
              </div>
            </div>
          </div>
        )}

        {!active && (
          <p className="text-center text-sm text-slate-400 mt-4">
            Click any component in the diagram to see details about that stage of the refrigeration cycle.
          </p>
        )}

        {/* Quiz progress */}
        {mode === 'quiz' && (
          <div className="mt-4 flex items-center gap-2 justify-center">
            {STAGES.map((s) => (
              <div
                key={s.id}
                className={`w-3 h-3 rounded-full transition ${
                  revealedStages.has(s.id) ? 'bg-green-500' : 'bg-slate-200'
                }`}
                title={revealedStages.has(s.id) ? s.label : 'Not yet revealed'}
              />
            ))}
            <span className="text-xs text-slate-500 ml-2">
              {revealedStages.size}/{STAGES.length} stages identified
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
