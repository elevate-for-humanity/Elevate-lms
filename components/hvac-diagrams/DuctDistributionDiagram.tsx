'use client';

import { useState } from 'react';

interface DuctPart {
  id: string;
  label: string;
  description: string;
  commonProblem: string;
}

const PARTS: DuctPart[] = [
  {
    id: 'air-handler',
    label: 'Air Handler / Furnace',
    description: 'The central unit that conditions air and pushes it through the duct system. Contains the blower motor, evaporator coil (cooling), and heat exchanger or heat strips (heating).',
    commonProblem: 'Blower motor failure or incorrect speed setting causes low airflow to all rooms.',
  },
  {
    id: 'supply-plenum',
    label: 'Supply Plenum',
    description: 'The large sheet metal box connected to the air handler output. All supply ducts branch off from here. Conditioned air enters the plenum under positive pressure.',
    commonProblem: 'Leaks at the plenum-to-duct connections waste conditioned air into unconditioned spaces.',
  },
  {
    id: 'supply-ducts',
    label: 'Supply Ducts',
    description: 'Carry conditioned air from the supply plenum to each room. Can be rigid metal, flex duct, or duct board. Properly sized ducts maintain adequate airflow velocity.',
    commonProblem: 'Crushed or disconnected flex duct in the attic is the most common cause of a room not getting air.',
  },
  {
    id: 'supply-registers',
    label: 'Supply Registers',
    description: 'Adjustable grilles in each room where conditioned air enters. Can be wall, floor, or ceiling mounted. Louvers direct airflow and can be partially closed for balancing.',
    commonProblem: 'Closed or blocked registers cause comfort complaints and increase static pressure.',
  },
  {
    id: 'return-grille',
    label: 'Return Air Grille',
    description: 'Fixed grilles (often larger than supply registers) where room air enters the return duct system. May have a filter behind the grille.',
    commonProblem: 'Blocked return grilles (furniture, curtains) starve the system of air, causing low airflow and frozen coils.',
  },
  {
    id: 'return-duct',
    label: 'Return Duct',
    description: 'Carries room air back to the air handler for reconditioning. Undersized return ducts are a common installation defect that causes high static pressure.',
    commonProblem: 'Leaky return ducts in the attic pull in hot, humid air, increasing the cooling load and causing humidity problems.',
  },
  {
    id: 'filter',
    label: 'Air Filter',
    description: 'Removes dust, pollen, and particles from return air before it reaches the blower and coil. MERV rating indicates filtration level. Higher MERV = more filtration but more airflow restriction.',
    commonProblem: 'A dirty filter is the #1 cause of HVAC performance problems. Causes low airflow, frozen coils, and high energy bills.',
  },
  {
    id: 'damper',
    label: 'Zone Damper',
    description: 'Adjustable plates inside duct branches that control airflow to different zones. Manual dampers are set during installation. Automatic dampers are controlled by a zone panel.',
    commonProblem: 'A closed damper to an occupied room causes comfort complaints. A stuck-open damper to an unoccupied room wastes energy.',
  },
];

interface Props {
  mode?: 'explore' | 'quiz' | 'review';
  onComplete?: () => void;
}

export default function DuctDistributionDiagram({ mode = 'explore', onComplete }: Props) {
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
        <h3 className="font-bold text-slate-900">Duct Distribution & Airflow</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          How conditioned air moves through a building
        </p>
      </div>

      <div className="p-4 md:p-6">
        <svg viewBox="0 0 750 400" className="w-full max-w-3xl mx-auto" role="img" aria-label="Duct distribution diagram showing supply and return airflow through a building">
          {/* House outline */}
          <path d="M50,120 L375,30 L700,120 L700,380 L50,380 Z" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.5" />

          {/* Room dividers */}
          <line x1="275" y1="120" x2="275" y2="380" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="6 3" />
          <line x1="500" y1="120" x2="500" y2="380" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="6 3" />

          {/* Room labels */}
          <text x="162" y="370" textAnchor="middle" fill="#94a3b8" fontSize="10">BEDROOM</text>
          <text x="387" y="370" textAnchor="middle" fill="#94a3b8" fontSize="10">LIVING ROOM</text>
          <text x="600" y="370" textAnchor="middle" fill="#94a3b8" fontSize="10">KITCHEN</text>

          {/* ── AIR HANDLER (center, in closet) ── */}
          <g onClick={() => handleClick('air-handler')} className="cursor-pointer" role="button" aria-label="Air handler">
            <rect x="340" y="220" width="70" height="100" rx="6" fill={activeId === 'air-handler' ? '#bfdbfe' : '#dbeafe'} stroke="#2563eb" strokeWidth="2" />
            <text x="375" y="260" textAnchor="middle" fill="#2563eb" fontSize="9" fontWeight="700">
              {show('air-handler') ? 'AIR' : '?'}
            </text>
            <text x="375" y="275" textAnchor="middle" fill="#2563eb" fontSize="9" fontWeight="700">
              {show('air-handler') ? 'HANDLER' : ''}
            </text>
            {/* Blower icon */}
            <circle cx="375" cy="295" r="10" fill="none" stroke="#2563eb" strokeWidth="1" />
          </g>

          {/* ── SUPPLY PLENUM ── */}
          <g onClick={() => handleClick('supply-plenum')} className="cursor-pointer" role="button" aria-label="Supply plenum">
            <rect x="320" y="180" width="110" height="30" rx="4" fill={activeId === 'supply-plenum' ? '#bbf7d0' : '#dcfce7'} stroke="#16a34a" strokeWidth="2" />
            <text x="375" y="200" textAnchor="middle" fill="#16a34a" fontSize="9" fontWeight="600">
              {show('supply-plenum') ? 'SUPPLY PLENUM' : '?'}
            </text>
          </g>

          {/* ── SUPPLY DUCTS ── */}
          <g onClick={() => handleClick('supply-ducts')} className="cursor-pointer" role="button" aria-label="Supply ducts">
            {/* Left duct */}
            <rect x="100" y="155" width="220" height="20" rx="3" fill={activeId === 'supply-ducts' ? '#bbf7d0' : '#dcfce7'} stroke="#16a34a" strokeWidth="1.5" />
            {/* Right duct */}
            <rect x="430" y="155" width="220" height="20" rx="3" fill={activeId === 'supply-ducts' ? '#bbf7d0' : '#dcfce7'} stroke="#16a34a" strokeWidth="1.5" />
            {/* Airflow arrows */}
            <text x="180" y="170" fill="#16a34a" fontSize="10">← ← ←</text>
            <text x="520" y="170" fill="#16a34a" fontSize="10">→ → →</text>
            <text x="375" y="150" textAnchor="middle" fill="#16a34a" fontSize="8" fontWeight="600">
              {show('supply-ducts') ? 'SUPPLY DUCTS' : '?'}
            </text>
          </g>

          {/* ── DAMPERS ── */}
          <g onClick={() => handleClick('damper')} className="cursor-pointer" role="button" aria-label="Zone dampers">
            {/* Left damper */}
            <rect x="280" y="155" width="8" height="20" rx="1" fill={activeId === 'damper' ? '#fef3c7' : '#fefce8'} stroke="#ca8a04" strokeWidth="1.5" />
            {/* Right damper */}
            <rect x="462" y="155" width="8" height="20" rx="1" fill={activeId === 'damper' ? '#fef3c7' : '#fefce8'} stroke="#ca8a04" strokeWidth="1.5" />
            <text x="284" y="148" textAnchor="middle" fill="#ca8a04" fontSize="7" fontWeight="600">
              {show('damper') ? 'DAMPER' : '?'}
            </text>
          </g>

          {/* ── SUPPLY REGISTERS ── */}
          <g onClick={() => handleClick('supply-registers')} className="cursor-pointer" role="button" aria-label="Supply registers">
            {/* Bedroom register */}
            <rect x="140" y="175" width="40" height="8" rx="2" fill={activeId === 'supply-registers' ? '#bbf7d0' : '#86efac'} stroke="#16a34a" strokeWidth="1.5" />
            <text x="160" y="198" textAnchor="middle" fill="#16a34a" fontSize="7" fontWeight="600">
              {show('supply-registers') ? 'REGISTER' : '?'}
            </text>
            {/* Air coming down */}
            <line x1="155" y1="183" x2="155" y2="210" stroke="#16a34a" strokeWidth="1" strokeDasharray="3 2" />
            <line x1="165" y1="183" x2="165" y2="210" stroke="#16a34a" strokeWidth="1" strokeDasharray="3 2" />

            {/* Living room register */}
            <rect x="370" y="175" width="40" height="8" rx="2" fill={activeId === 'supply-registers' ? '#bbf7d0' : '#86efac'} stroke="#16a34a" strokeWidth="1.5" />
            <line x1="385" y1="183" x2="385" y2="210" stroke="#16a34a" strokeWidth="1" strokeDasharray="3 2" />
            <line x1="395" y1="183" x2="395" y2="210" stroke="#16a34a" strokeWidth="1" strokeDasharray="3 2" />

            {/* Kitchen register */}
            <rect x="570" y="175" width="40" height="8" rx="2" fill={activeId === 'supply-registers' ? '#bbf7d0' : '#86efac'} stroke="#16a34a" strokeWidth="1.5" />
            <line x1="585" y1="183" x2="585" y2="210" stroke="#16a34a" strokeWidth="1" strokeDasharray="3 2" />
            <line x1="595" y1="183" x2="595" y2="210" stroke="#16a34a" strokeWidth="1" strokeDasharray="3 2" />
          </g>

          {/* ── RETURN DUCT ── */}
          <g onClick={() => handleClick('return-duct')} className="cursor-pointer" role="button" aria-label="Return duct">
            <rect x="200" y="330" width="140" height="20" rx="3" fill={activeId === 'return-duct' ? '#c7d2fe' : '#e0e7ff'} stroke="#6366f1" strokeWidth="1.5" />
            <text x="270" y="345" textAnchor="middle" fill="#6366f1" fontSize="9" fontWeight="600">
              {show('return-duct') ? 'RETURN DUCT →' : '?'}
            </text>
            <text x="270" y="325" fill="#6366f1" fontSize="10">→ → →</text>
          </g>

          {/* ── RETURN GRILLE ── */}
          <g onClick={() => handleClick('return-grille')} className="cursor-pointer" role="button" aria-label="Return air grille">
            <rect x="130" y="300" width="50" height="50" rx="4" fill={activeId === 'return-grille' ? '#c7d2fe' : '#e0e7ff'} stroke="#6366f1" strokeWidth="2" />
            {/* Grille lines */}
            {Array.from({ length: 4 }).map((_, i) => (
              <line key={i} x1="138" y1={310 + i * 10} x2="172" y2={310 + i * 10} stroke="#6366f1" strokeWidth="1" opacity="0.4" />
            ))}
            <text x="155" y="365" textAnchor="middle" fill="#6366f1" fontSize="7" fontWeight="600">
              {show('return-grille') ? 'RETURN GRILLE' : '?'}
            </text>
          </g>

          {/* ── FILTER ── */}
          <g onClick={() => handleClick('filter')} className="cursor-pointer" role="button" aria-label="Air filter">
            <rect x="345" y="320" width="60" height="10" rx="2" fill={activeId === 'filter' ? '#e2e8f0' : '#f1f5f9'} stroke="#64748b" strokeWidth="1.5" />
            {Array.from({ length: 6 }).map((_, i) => (
              <line key={i} x1={350 + i * 9} y1="321" x2={350 + i * 9} y2="329" stroke="#94a3b8" strokeWidth="0.5" />
            ))}
            <text x="375" y="345" textAnchor="middle" fill="#64748b" fontSize="7" fontWeight="600">
              {show('filter') ? 'FILTER' : '?'}
            </text>
          </g>

          {/* Legend */}
          <g transform="translate(50, 395)">
            <rect x="0" y="-8" width="12" height="8" rx="1" fill="#dcfce7" stroke="#16a34a" strokeWidth="1" />
            <text x="16" y="0" fill="#64748b" fontSize="8">Supply (conditioned air out)</text>
            <rect x="180" y="-8" width="12" height="8" rx="1" fill="#e0e7ff" stroke="#6366f1" strokeWidth="1" />
            <text x="196" y="0" fill="#64748b" fontSize="8">Return (room air back)</text>
          </g>
        </svg>

        {/* Detail panel */}
        {active && (
          <div className="mt-4 rounded-lg p-5 bg-slate-50 border-l-4 border-brand-blue-500">
            <h4 className="font-bold text-slate-900 text-lg">{active.label}</h4>
            <p className="text-sm text-slate-700 mt-2">{active.description}</p>
            <div className="mt-3 bg-white rounded-lg p-3 border border-slate-200">
              <p className="text-xs font-bold text-slate-500 uppercase mb-1">Common Problem</p>
              <p className="text-sm text-slate-700">{active.commonProblem}</p>
            </div>
          </div>
        )}

        {!active && (
          <p className="text-center text-sm text-slate-400 mt-4">
            Click any part of the duct system to learn how air moves through the building.
          </p>
        )}
      </div>
    </div>
  );
}
