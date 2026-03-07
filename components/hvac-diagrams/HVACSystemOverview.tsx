'use client';

import { useState } from 'react';

interface SystemPart {
  id: string;
  label: string;
  description: string;
  role: string;
}

const PARTS: SystemPart[] = [
  {
    id: 'condenser',
    label: 'Outdoor Condenser Unit',
    description: 'Contains the compressor, condenser coil, and fan motor. Rejects heat from the refrigerant to the outdoor air.',
    role: 'Removes heat from the building by releasing it outside.',
  },
  {
    id: 'evaporator',
    label: 'Evaporator Coil',
    description: 'Mounted above the furnace or inside the air handler. Cold refrigerant absorbs heat from indoor air as the blower pushes air across the coil.',
    role: 'Absorbs heat from indoor air, cooling the building.',
  },
  {
    id: 'furnace',
    label: 'Furnace / Air Handler',
    description: 'Houses the blower motor, air filter, and (in a furnace) the burner assembly and heat exchanger. Moves air through the duct system.',
    role: 'Distributes conditioned air and provides heating.',
  },
  {
    id: 'ductwork',
    label: 'Ductwork',
    description: 'Supply ducts carry conditioned air to rooms. Return ducts bring room air back to the air handler for reconditioning.',
    role: 'Delivers conditioned air throughout the building.',
  },
  {
    id: 'thermostat',
    label: 'Thermostat',
    description: 'The control center. Senses room temperature and sends 24V signals to start heating, cooling, or fan operation.',
    role: 'Controls when the system turns on and off.',
  },
  {
    id: 'refrigerant-lines',
    label: 'Refrigerant Lines',
    description: 'Two copper lines connect the outdoor and indoor units. The large insulated line is the suction line (cold vapor). The small uninsulated line is the liquid line (warm liquid).',
    role: 'Carries refrigerant between indoor and outdoor units.',
  },
];

interface Props {
  mode?: 'explore' | 'quiz' | 'review';
  onComplete?: () => void;
}

export default function HVACSystemOverview({ mode = 'explore', onComplete }: Props) {
  const [activePart, setActivePart] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  const handleClick = (id: string) => {
    setActivePart(id);
    const next = new Set(revealed).add(id);
    if (mode === 'quiz' || mode === 'explore') setRevealed(next);
    if (next.size >= PARTS.length) onComplete?.();
  };

  const show = (id: string) => mode !== 'quiz' || revealed.has(id);
  const active = PARTS.find((p) => p.id === activePart);

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
        <h3 className="font-bold text-slate-900">HVAC System Overview</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          {mode === 'quiz' ? 'Click each part to identify it' : 'Click any part to learn its role in the system'}
        </p>
      </div>

      <div className="p-4 md:p-6">
        <svg viewBox="0 0 800 420" className="w-full max-w-3xl mx-auto" role="img" aria-label="Complete HVAC system showing outdoor unit, indoor unit, ductwork, and thermostat">
          {/* Ground line */}
          <line x1="0" y1="350" x2="800" y2="350" stroke="#94a3b8" strokeWidth="1" strokeDasharray="6 3" />
          <text x="400" y="368" textAnchor="middle" fill="#94a3b8" fontSize="10">GROUND LEVEL</text>

          {/* House outline */}
          <path d="M250,100 L500,30 L750,100 L750,350 L250,350 Z" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.5" />
          <text x="500" y="55" textAnchor="middle" fill="#64748b" fontSize="11" fontWeight="600">BUILDING INTERIOR</text>

          {/* ── OUTDOOR CONDENSER ── */}
          <g onClick={() => handleClick('condenser')} className="cursor-pointer" role="button" aria-label="Outdoor condenser unit">
            <rect x="30" y="240" width="140" height="110" rx="10" fill={activePart === 'condenser' ? '#fee2e2' : '#fef2f2'} stroke="#dc2626" strokeWidth="2" />
            <circle cx="100" cy="270" r="25" fill="none" stroke="#dc2626" strokeWidth="1.5" />
            <circle cx="100" cy="270" r="15" fill="none" stroke="#dc2626" strokeWidth="1" />
            <rect x="60" y="310" width="80" height="25" rx="4" fill="#fecaca" stroke="#dc2626" strokeWidth="1" />
            <text x="100" y="327" textAnchor="middle" fill="#991b1b" fontSize="8" fontWeight="600">COMPRESSOR</text>
            <text x="100" y="230" textAnchor="middle" fill="#dc2626" fontSize="10" fontWeight="700">
              {show('condenser') ? 'CONDENSER UNIT' : '?'}
            </text>
            {/* Heat arrows out */}
            <text x="50" y="220" fill="#dc2626" fontSize="14" opacity="0.6">↑ ↑ ↑</text>
            <text x="55" y="210" fill="#991b1b" fontSize="8">HEAT OUT</text>
          </g>

          {/* ── REFRIGERANT LINES ── */}
          <g onClick={() => handleClick('refrigerant-lines')} className="cursor-pointer" role="button" aria-label="Refrigerant lines">
            {/* Suction line (large, insulated) */}
            <line x1="170" y1="280" x2="350" y2="280" stroke="#0891b2" strokeWidth="6" />
            <line x1="170" y1="280" x2="350" y2="280" stroke="#67e8f9" strokeWidth="3" />
            {/* Liquid line (small) */}
            <line x1="170" y1="300" x2="350" y2="300" stroke="#ea580c" strokeWidth="3" />
            <text x="260" y="270" textAnchor="middle" fill="#0891b2" fontSize="8" fontWeight="600">
              {show('refrigerant-lines') ? 'SUCTION LINE (cold vapor)' : ''}
            </text>
            <text x="260" y="316" textAnchor="middle" fill="#ea580c" fontSize="8" fontWeight="600">
              {show('refrigerant-lines') ? 'LIQUID LINE (warm liquid)' : ''}
            </text>
          </g>

          {/* ── FURNACE / AIR HANDLER ── */}
          <g onClick={() => handleClick('furnace')} className="cursor-pointer" role="button" aria-label="Furnace and air handler">
            <rect x="340" y="200" width="120" height="150" rx="8" fill={activePart === 'furnace' ? '#dbeafe' : '#eff6ff'} stroke="#2563eb" strokeWidth="2" />
            <text x="400" y="225" textAnchor="middle" fill="#2563eb" fontSize="10" fontWeight="700">
              {show('furnace') ? 'FURNACE' : '?'}
            </text>
            {/* Blower */}
            <circle cx="400" cy="310" r="20" fill="#bfdbfe" stroke="#2563eb" strokeWidth="1.5" />
            <text x="400" y="314" textAnchor="middle" fill="#1e40af" fontSize="7" fontWeight="600">BLOWER</text>
            {/* Filter */}
            <rect x="355" y="335" width="90" height="12" rx="2" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
            <text x="400" y="344" textAnchor="middle" fill="#64748b" fontSize="7">FILTER</text>
          </g>

          {/* ── EVAPORATOR COIL ── */}
          <g onClick={() => handleClick('evaporator')} className="cursor-pointer" role="button" aria-label="Evaporator coil">
            <rect x="355" y="170" width="90" height="30" rx="4" fill={activePart === 'evaporator' ? '#a5f3fc' : '#cffafe'} stroke="#0891b2" strokeWidth="2" />
            {/* Coil fins */}
            {Array.from({ length: 8 }).map((_, i) => (
              <line key={i} x1={360 + i * 10} y1="174" x2={360 + i * 10} y2="196" stroke="#0891b2" strokeWidth="1" opacity="0.4" />
            ))}
            <text x="400" y="165" textAnchor="middle" fill="#0891b2" fontSize="9" fontWeight="700">
              {show('evaporator') ? 'EVAPORATOR COIL' : '?'}
            </text>
          </g>

          {/* ── DUCTWORK ── */}
          <g onClick={() => handleClick('ductwork')} className="cursor-pointer" role="button" aria-label="Ductwork">
            {/* Supply duct going right */}
            <rect x="460" y="140" width="200" height="30" rx="4" fill={activePart === 'ductwork' ? '#bbf7d0' : '#dcfce7'} stroke="#16a34a" strokeWidth="1.5" />
            <text x="560" y="160" textAnchor="middle" fill="#166534" fontSize="9" fontWeight="600">
              {show('ductwork') ? 'SUPPLY DUCT →' : '?'}
            </text>
            {/* Supply registers */}
            <rect x="660" y="170" width="20" height="40" rx="2" fill="#bbf7d0" stroke="#16a34a" strokeWidth="1" />
            <rect x="580" y="170" width="20" height="40" rx="2" fill="#bbf7d0" stroke="#16a34a" strokeWidth="1" />

            {/* Return duct going right */}
            <rect x="460" y="320" width="200" height="30" rx="4" fill={activePart === 'ductwork' ? '#e0e7ff' : '#eef2ff'} stroke="#6366f1" strokeWidth="1.5" />
            <text x="560" y="340" textAnchor="middle" fill="#4338ca" fontSize="9" fontWeight="600">
              {show('ductwork') ? '← RETURN DUCT' : '?'}
            </text>
            {/* Return grille */}
            <rect x="660" y="280" width="20" height="40" rx="2" fill="#e0e7ff" stroke="#6366f1" strokeWidth="1" />

            {/* Airflow arrows */}
            <text x="500" y="135" fill="#16a34a" fontSize="12">→ → →</text>
            <text x="620" y="318" fill="#6366f1" fontSize="12">← ← ←</text>
          </g>

          {/* ── THERMOSTAT ── */}
          <g onClick={() => handleClick('thermostat')} className="cursor-pointer" role="button" aria-label="Thermostat">
            <rect x="620" y="100" width="70" height="50" rx="8" fill={activePart === 'thermostat' ? '#fef3c7' : '#fefce8'} stroke="#ca8a04" strokeWidth="2" />
            <text x="655" y="122" textAnchor="middle" fill="#854d0e" fontSize="14" fontWeight="700">72°</text>
            <text x="655" y="140" textAnchor="middle" fill="#ca8a04" fontSize="8" fontWeight="600">
              {show('thermostat') ? 'THERMOSTAT' : '?'}
            </text>
            {/* Control wire */}
            <line x1="620" y1="125" x2="460" y2="125" stroke="#ca8a04" strokeWidth="1.5" strokeDasharray="4 2" />
            <line x1="460" y1="125" x2="460" y2="200" stroke="#ca8a04" strokeWidth="1.5" strokeDasharray="4 2" />
            <text x="540" y="120" fill="#ca8a04" fontSize="7">24V CONTROL WIRE</text>
          </g>

          {/* Outdoor label */}
          <text x="100" y="390" textAnchor="middle" fill="#64748b" fontSize="10" fontWeight="600">OUTDOOR</text>

          {/* Active highlight */}
          {activePart && (
            <rect x="0" y="0" width="800" height="420" fill="none" stroke="none" pointerEvents="none" />
          )}
        </svg>

        {/* Detail panel */}
        {active && (
          <div className="mt-4 rounded-lg p-5 bg-slate-50 border-l-4 border-brand-blue-500">
            <h4 className="font-bold text-slate-900 text-lg">{active.label}</h4>
            <p className="text-sm text-slate-700 mt-2">{active.description}</p>
            <div className="mt-3 bg-white rounded-lg p-3 border border-slate-200">
              <p className="text-xs font-bold text-slate-500 uppercase mb-1">Role in the System</p>
              <p className="text-sm text-slate-700">{active.role}</p>
            </div>
          </div>
        )}

        {!active && (
          <p className="text-center text-sm text-slate-400 mt-4">
            Click any part of the system to learn what it does and how it connects to the rest.
          </p>
        )}
      </div>
    </div>
  );
}
