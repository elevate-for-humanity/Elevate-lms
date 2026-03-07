'use client';

import { useState } from 'react';

interface CircuitPart {
  id: string;
  label: string;
  description: string;
  voltage: string;
}

const PARTS: CircuitPart[] = [
  {
    id: 'transformer',
    label: 'Transformer',
    description: 'Steps down 240V line voltage to 24V control voltage. The primary side connects to the disconnect. The secondary side powers the thermostat circuit. If the transformer fails, nothing in the control circuit works.',
    voltage: '240V primary → 24V secondary',
  },
  {
    id: 'thermostat',
    label: 'Thermostat',
    description: 'Acts as a switch in the 24V circuit. When it calls for cooling, it connects R to Y (and R to G for the fan). This sends 24V to the contactor coil, which starts the outdoor unit.',
    voltage: '24V control signals',
  },
  {
    id: 'contactor-coil',
    label: 'Contactor Coil',
    description: 'A small electromagnetic coil inside the contactor. When 24V reaches the coil, it creates a magnetic field that pulls the contacts closed, connecting line voltage to the compressor and fan motor.',
    voltage: '24V to energize coil',
  },
  {
    id: 'contactor-contacts',
    label: 'Contactor Contacts',
    description: 'Heavy-duty electrical contacts that carry line voltage (240V) to the compressor and fan motor. When the coil is energized, the contacts close. When de-energized, they open and the system stops.',
    voltage: '240V line voltage passes through',
  },
  {
    id: 'compressor',
    label: 'Compressor Motor',
    description: 'Receives 240V through the contactor contacts. The run capacitor provides phase shift for efficient operation. Draws 10–25 amps depending on size.',
    voltage: '240V through contactor',
  },
  {
    id: 'fan-motor',
    label: 'Condenser Fan Motor',
    description: 'Also receives 240V through the contactor. Runs whenever the compressor runs. The run capacitor may be shared (dual capacitor) or separate.',
    voltage: '240V through contactor',
  },
  {
    id: 'safety-switches',
    label: 'Safety Switches',
    description: 'High-pressure switch, low-pressure switch, and other safeties are wired in series with the contactor coil. If any safety opens, 24V is interrupted and the contactor de-energizes, stopping the system.',
    voltage: '24V circuit — series with coil',
  },
];

interface Props {
  mode?: 'explore' | 'quiz' | 'review';
  onComplete?: () => void;
}

export default function ElectricalCircuitDiagram({ mode = 'explore', onComplete }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  const handleClick = (id: string) => {
    setActiveId(id);
    const next = new Set(revealed).add(id);
    if (mode === 'quiz' || mode === 'explore') setRevealed(next);
    if (next.size >= PARTS.length) onComplete?.();
  };

  const show = (id: string) => mode !== 'quiz' || revealed.has(id);
  const active = PARTS.find((p) => p.id === activeId);

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
        <h3 className="font-bold text-slate-900">Electrical Control Circuit</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          How the thermostat controls the outdoor unit through the 24V control circuit
        </p>
      </div>

      <div className="p-4 md:p-6">
        <svg viewBox="0 0 700 400" className="w-full max-w-2xl mx-auto" role="img" aria-label="HVAC electrical control circuit showing transformer, thermostat, contactor, and motors">
          {/* 240V power lines (top) */}
          <line x1="50" y1="30" x2="650" y2="30" stroke="#dc2626" strokeWidth="2" />
          <line x1="50" y1="50" x2="650" y2="50" stroke="#1e40af" strokeWidth="2" />
          <text x="350" y="22" textAnchor="middle" fill="#dc2626" fontSize="11" fontWeight="700">L1 — 240V LINE VOLTAGE — L2</text>
          <text x="50" y="45" fill="#dc2626" fontSize="9" fontWeight="600">L1 (HOT)</text>
          <text x="610" y="45" fill="#1e40af" fontSize="9" fontWeight="600">L2 (HOT)</text>

          {/* ── TRANSFORMER ── */}
          <g onClick={() => handleClick('transformer')} className="cursor-pointer" role="button" aria-label="Transformer">
            <rect x="60" y="70" width="100" height="70" rx="8" fill={activeId === 'transformer' ? '#fef3c7' : '#fefce8'} stroke="#ca8a04" strokeWidth="2" />
            {/* Primary coil */}
            <path d="M80,80 C80,90 95,90 95,80 C95,90 110,90 110,80 C110,90 125,90 125,80" fill="none" stroke="#dc2626" strokeWidth="1.5" />
            {/* Secondary coil */}
            <path d="M80,120 C80,110 95,110 95,120 C95,110 110,110 110,120 C110,110 125,110 125,120" fill="none" stroke="#ca8a04" strokeWidth="1.5" />
            <text x="110" y="108" textAnchor="middle" fill="#854d0e" fontSize="9" fontWeight="600">
              {show('transformer') ? 'TRANSFORMER' : '?'}
            </text>
            <text x="145" y="88" fill="#dc2626" fontSize="8">240V</text>
            <text x="145" y="125" fill="#ca8a04" fontSize="8">24V</text>
            {/* Lines from 240V */}
            <line x1="80" y1="50" x2="80" y2="80" stroke="#dc2626" strokeWidth="1.5" />
            <line x1="140" y1="50" x2="140" y2="80" stroke="#1e40af" strokeWidth="1.5" />
          </g>

          {/* 24V control circuit line */}
          <line x1="110" y1="140" x2="110" y2="170" stroke="#ca8a04" strokeWidth="2" />
          <text x="130" y="165" fill="#ca8a04" fontSize="9" fontWeight="600">24V (R wire)</text>

          {/* ── THERMOSTAT ── */}
          <g onClick={() => handleClick('thermostat')} className="cursor-pointer" role="button" aria-label="Thermostat">
            <rect x="60" y="170" width="100" height="50" rx="8" fill={activeId === 'thermostat' ? '#dbeafe' : '#eff6ff'} stroke="#2563eb" strokeWidth="2" />
            <text x="110" y="192" textAnchor="middle" fill="#2563eb" fontSize="10" fontWeight="700">
              {show('thermostat') ? 'THERMOSTAT' : '?'}
            </text>
            <text x="110" y="208" textAnchor="middle" fill="#1e40af" fontSize="8">R → Y (cooling call)</text>
          </g>

          {/* Wire from thermostat to safety switches */}
          <line x1="160" y1="195" x2="240" y2="195" stroke="#ca8a04" strokeWidth="2" />
          <text x="200" y="188" fill="#ca8a04" fontSize="8">Y wire →</text>

          {/* ── SAFETY SWITCHES ── */}
          <g onClick={() => handleClick('safety-switches')} className="cursor-pointer" role="button" aria-label="Safety switches">
            <rect x="240" y="170" width="100" height="50" rx="8" fill={activeId === 'safety-switches' ? '#fef2f2' : '#fff1f2'} stroke="#e11d48" strokeWidth="2" />
            <text x="290" y="192" textAnchor="middle" fill="#e11d48" fontSize="9" fontWeight="600">
              {show('safety-switches') ? 'SAFETY' : '?'}
            </text>
            <text x="290" y="208" textAnchor="middle" fill="#be123c" fontSize="8">
              {show('safety-switches') ? 'SWITCHES' : ''}
            </text>
            {/* Switch symbol */}
            <line x1="260" y1="180" x2="275" y2="175" stroke="#e11d48" strokeWidth="1.5" />
            <circle cx="260" cy="180" r="2" fill="#e11d48" />
          </g>

          {/* Wire from safety to contactor coil */}
          <line x1="340" y1="195" x2="420" y2="195" stroke="#ca8a04" strokeWidth="2" />

          {/* ── CONTACTOR COIL ── */}
          <g onClick={() => handleClick('contactor-coil')} className="cursor-pointer" role="button" aria-label="Contactor coil">
            <rect x="420" y="170" width="100" height="50" rx="8" fill={activeId === 'contactor-coil' ? '#dcfce7' : '#f0fdf4'} stroke="#059669" strokeWidth="2" />
            <text x="470" y="192" textAnchor="middle" fill="#059669" fontSize="9" fontWeight="600">
              {show('contactor-coil') ? 'CONTACTOR' : '?'}
            </text>
            <text x="470" y="208" textAnchor="middle" fill="#047857" fontSize="8">
              {show('contactor-coil') ? 'COIL (24V)' : ''}
            </text>
            {/* Coil symbol */}
            <path d="M445,175 C445,168 455,168 455,175 C455,168 465,168 465,175 C465,168 475,168 475,175" fill="none" stroke="#059669" strokeWidth="1.5" />
          </g>

          {/* Return to transformer common */}
          <line x1="520" y1="195" x2="580" y2="195" stroke="#1e40af" strokeWidth="2" />
          <line x1="580" y1="195" x2="580" y2="140" stroke="#1e40af" strokeWidth="2" />
          <line x1="580" y1="140" x2="140" y2="140" stroke="#1e40af" strokeWidth="2" />
          <text x="560" y="188" fill="#1e40af" fontSize="8">C wire (common)</text>

          {/* Dashed line showing magnetic connection */}
          <line x1="470" y1="220" x2="470" y2="260" stroke="#059669" strokeWidth="1.5" strokeDasharray="4 3" />
          <text x="490" y="245" fill="#059669" fontSize="8">magnetic</text>

          {/* ── CONTACTOR CONTACTS (240V side) ── */}
          <g onClick={() => handleClick('contactor-contacts')} className="cursor-pointer" role="button" aria-label="Contactor contacts">
            <rect x="420" y="260" width="100" height="50" rx="8" fill={activeId === 'contactor-contacts' ? '#fef3c7' : '#fefce8'} stroke="#ca8a04" strokeWidth="2" />
            <text x="470" y="282" textAnchor="middle" fill="#ca8a04" fontSize="9" fontWeight="600">
              {show('contactor-contacts') ? 'CONTACTS' : '?'}
            </text>
            <text x="470" y="298" textAnchor="middle" fill="#854d0e" fontSize="8">
              {show('contactor-contacts') ? '240V PASSES' : ''}
            </text>
            {/* Lines from 240V */}
            <line x1="440" y1="50" x2="440" y2="260" stroke="#dc2626" strokeWidth="1.5" strokeDasharray="6 3" />
            <line x1="500" y1="50" x2="500" y2="260" stroke="#1e40af" strokeWidth="1.5" strokeDasharray="6 3" />
          </g>

          {/* Lines to motors */}
          <line x1="440" y1="310" x2="440" y2="340" stroke="#dc2626" strokeWidth="1.5" />
          <line x1="500" y1="310" x2="500" y2="340" stroke="#1e40af" strokeWidth="1.5" />

          {/* Split to compressor and fan */}
          <line x1="440" y1="340" x2="340" y2="340" stroke="#dc2626" strokeWidth="1.5" />
          <line x1="500" y1="340" x2="600" y2="340" stroke="#1e40af" strokeWidth="1.5" />

          {/* ── COMPRESSOR ── */}
          <g onClick={() => handleClick('compressor')} className="cursor-pointer" role="button" aria-label="Compressor motor">
            <circle cx="300" cy="370" r="30" fill={activeId === 'compressor' ? '#fecaca' : '#fee2e2'} stroke="#dc2626" strokeWidth="2" />
            <text x="300" y="367" textAnchor="middle" fill="#dc2626" fontSize="9" fontWeight="700">
              {show('compressor') ? 'COMP' : '?'}
            </text>
            <text x="300" y="380" textAnchor="middle" fill="#991b1b" fontSize="7">MOTOR</text>
            <line x1="340" y1="340" x2="330" y2="355" stroke="#dc2626" strokeWidth="1.5" />
            <line x1="340" y1="340" x2="330" y2="370" stroke="#1e40af" strokeWidth="1.5" />
          </g>

          {/* ── FAN MOTOR ── */}
          <g onClick={() => handleClick('fan-motor')} className="cursor-pointer" role="button" aria-label="Condenser fan motor">
            <circle cx="600" cy="370" r="30" fill={activeId === 'fan-motor' ? '#e0e7ff' : '#eef2ff'} stroke="#6366f1" strokeWidth="2" />
            <text x="600" y="367" textAnchor="middle" fill="#6366f1" fontSize="9" fontWeight="700">
              {show('fan-motor') ? 'FAN' : '?'}
            </text>
            <text x="600" y="380" textAnchor="middle" fill="#4338ca" fontSize="7">MOTOR</text>
            <line x1="600" y1="340" x2="585" y2="355" stroke="#dc2626" strokeWidth="1.5" />
            <line x1="600" y1="340" x2="615" y2="355" stroke="#1e40af" strokeWidth="1.5" />
          </g>

          {/* Legend */}
          <g transform="translate(50, 380)">
            <line x1="0" y1="0" x2="20" y2="0" stroke="#ca8a04" strokeWidth="2" />
            <text x="25" y="4" fill="#64748b" fontSize="8">24V Control</text>
            <line x1="100" y1="0" x2="120" y2="0" stroke="#dc2626" strokeWidth="2" />
            <text x="125" y="4" fill="#64748b" fontSize="8">240V Line</text>
          </g>
        </svg>

        {/* Detail panel */}
        {active && (
          <div className="mt-4 rounded-lg p-5 bg-slate-50 border-l-4 border-brand-blue-500">
            <h4 className="font-bold text-slate-900 text-lg">{active.label}</h4>
            <p className="text-xs font-semibold text-brand-blue-600 mt-0.5">{active.voltage}</p>
            <p className="text-sm text-slate-700 mt-2">{active.description}</p>
          </div>
        )}

        {!active && (
          <p className="text-center text-sm text-slate-400 mt-4">
            Click any component to trace how electricity flows from the thermostat to the compressor.
          </p>
        )}
      </div>
    </div>
  );
}
