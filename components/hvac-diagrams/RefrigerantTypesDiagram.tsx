'use client';

/**
 * RefrigerantTypesDiagram — CFC / HCFC / HFC / HFO comparison
 * Shows ODP, GWP, phase-out status, and common examples.
 * Students tap each refrigerant family to expand details.
 */

import { useState } from 'react';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

const FAMILIES = [
  {
    id: 'cfc',
    name: 'CFC',
    full: 'Chlorofluorocarbon',
    atoms: 'Carbon + Chlorine + Fluorine',
    odp: '0.6 – 1.0',
    odpColor: 'text-brand-red-600',
    gwp: '4,750 – 10,900',
    gwpColor: 'text-brand-red-600',
    status: 'BANNED',
    statusColor: 'bg-brand-red-600',
    phaseOut: 'Fully phased out in the U.S. in 1996 under the Montreal Protocol.',
    examples: ['R-11', 'R-12', 'R-113', 'R-114', 'R-115'],
    uses: 'Older car AC (R-12), older commercial refrigeration',
    keyFact: 'Highest ODP of all refrigerant families. R-11 is the ODP reference point (ODP = 1.0).',
    icon: XCircle,
    iconColor: 'text-brand-red-500',
    bg: 'bg-brand-red-50',
    border: 'border-brand-red-300',
    headerBg: 'bg-brand-red-600',
  },
  {
    id: 'hcfc',
    name: 'HCFC',
    full: 'Hydrochlorofluorocarbon',
    atoms: 'Hydrogen + Carbon + Chlorine + Fluorine',
    odp: '0.01 – 0.11',
    odpColor: 'text-amber-600',
    gwp: '1,500 – 2,000',
    gwpColor: 'text-amber-600',
    status: 'PHASED OUT',
    statusColor: 'bg-amber-500',
    phaseOut: 'R-22 production and import ended January 1, 2020. Recovered/reclaimed R-22 can still be used for service.',
    examples: ['R-22', 'R-123', 'R-124', 'R-141b'],
    uses: 'Older residential split systems (R-22), large centrifugal chillers (R-123)',
    keyFact: 'R-22 is still available as recovered/reclaimed refrigerant for servicing existing equipment — but supply is limited and prices are high.',
    icon: AlertTriangle,
    iconColor: 'text-amber-500',
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    headerBg: 'bg-amber-500',
  },
  {
    id: 'hfc',
    name: 'HFC',
    full: 'Hydrofluorocarbon',
    atoms: 'Hydrogen + Fluorine + Carbon (NO chlorine)',
    odp: '0.0',
    odpColor: 'text-brand-green-600',
    gwp: '140 – 3,900',
    gwpColor: 'text-amber-600',
    status: 'CURRENT',
    statusColor: 'bg-brand-blue-600',
    phaseOut: 'Being phased DOWN (not banned) under the AIM Act starting 2025. High-GWP HFCs like R-410A are being replaced by lower-GWP alternatives.',
    examples: ['R-410A', 'R-134a', 'R-404A', 'R-407C', 'R-32'],
    uses: 'Current residential and commercial HVAC, automotive AC (R-134a), commercial refrigeration (R-404A)',
    keyFact: 'Zero ODP because no chlorine. But high GWP — R-410A has GWP of 2,088. The AIM Act phases down production, not use of existing systems.',
    icon: CheckCircle,
    iconColor: 'text-brand-blue-500',
    bg: 'bg-brand-blue-50',
    border: 'border-brand-blue-300',
    headerBg: 'bg-brand-blue-600',
  },
  {
    id: 'hfo',
    name: 'HFO',
    full: 'Hydrofluoroolefin',
    atoms: 'Hydrogen + Fluorine + Carbon (double bond, NO chlorine)',
    odp: '0.0',
    odpColor: 'text-brand-green-600',
    gwp: '1 – 4',
    gwpColor: 'text-brand-green-600',
    status: 'NEXT GEN',
    statusColor: 'bg-brand-green-600',
    phaseOut: 'Not being phased out. These are the replacement refrigerants for high-GWP HFCs.',
    examples: ['R-1234yf', 'R-1234ze', 'R-454B', 'R-466A', 'R-32 blends'],
    uses: 'New residential HVAC (replacing R-410A), new automotive AC (replacing R-134a)',
    keyFact: 'Zero ODP and near-zero GWP. R-454B (Puron Advance) and R-466A are replacing R-410A in new equipment manufactured after 2025.',
    icon: CheckCircle,
    iconColor: 'text-brand-green-500',
    bg: 'bg-brand-green-50',
    border: 'border-brand-green-300',
    headerBg: 'bg-brand-green-600',
  },
];

export default function RefrigerantTypesDiagram({ onComplete }: { onComplete?: () => void }) {
  const [active, setActive] = useState<string | null>(null);
  const [seen, setSeen] = useState<Set<string>>(new Set());

  const activeFamily = FAMILIES.find((f) => f.id === active);
  const allSeen = FAMILIES.every((f) => seen.has(f.id));

  function handleClick(id: string) {
    setActive(id);
    setSeen((prev) => new Set([...prev, id]));
  }

  return (
    <div className="space-y-5">

      <div className="bg-brand-blue-700 rounded-2xl p-5 text-white">
        <p className="text-brand-red-400 text-xs font-bold uppercase tracking-widest mb-1">EPA 608 Core — Refrigerant Families</p>
        <h2 className="text-xl font-extrabold">CFC · HCFC · HFC · HFO</h2>
        <p className="text-slate-500 text-sm mt-1">Tap each family to see ODP, GWP, phase-out status, and common refrigerants.</p>
      </div>

      {/* ODP / GWP quick reference */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-3">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">ODP Reference</p>
          <p className="text-xs text-slate-600 leading-relaxed">Ozone Depletion Potential measured relative to <span className="font-bold text-slate-900">R-11 = 1.0</span>. Higher = more ozone damage.</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">GWP Reference</p>
          <p className="text-xs text-slate-600 leading-relaxed">Global Warming Potential measured relative to <span className="font-bold text-slate-900">CO₂ = 1</span>. Higher = more warming.</p>
        </div>
      </div>

      {/* Family cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {FAMILIES.map((f) => {
          const Icon = f.icon;
          const isSeen = seen.has(f.id);
          const isActive = active === f.id;
          return (
            <button
              key={f.id}
              onClick={() => handleClick(f.id)}
              className={`relative rounded-2xl border-2 p-4 text-left transition-all ${
                isActive ? `${f.bg} ${f.border} shadow-lg scale-[1.02]` : 'bg-white border-slate-200 hover:shadow-sm'
              }`}
            >
              {isSeen && !isActive && (
                <CheckCircle className="absolute top-2 right-2 w-4 h-4 text-brand-green-500" />
              )}
              <p className="font-extrabold text-2xl text-slate-900">{f.name}</p>
              <p className="text-[10px] text-slate-500 leading-tight mt-0.5">{f.full}</p>
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">ODP</span>
                  <span className={`font-bold ${f.odpColor}`}>{f.odp}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">GWP</span>
                  <span className={`font-bold ${f.gwpColor}`}>{f.gwp}</span>
                </div>
              </div>
              <span className={`mt-2 inline-block text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full ${f.statusColor}`}>
                {f.status}
              </span>
            </button>
          );
        })}
      </div>

      {/* Detail panel */}
      {activeFamily && (
        <div className={`rounded-2xl border-2 ${activeFamily.border} overflow-hidden`}>
          <div className={`${activeFamily.headerBg} px-5 py-3`}>
            <h3 className="text-slate-900 font-extrabold text-lg">{activeFamily.name} — {activeFamily.full}</h3>
            <p className="text-slate-600 text-xs mt-0.5">{activeFamily.atoms}</p>
          </div>
          <div className={`${activeFamily.bg} p-5 space-y-4`}>

            {/* ODP / GWP */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-xl border border-slate-200 p-3 text-center">
                <p className="text-xs text-slate-500 font-medium">Ozone Depletion Potential</p>
                <p className={`text-2xl font-extrabold mt-1 ${activeFamily.odpColor}`}>{activeFamily.odp}</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-3 text-center">
                <p className="text-xs text-slate-500 font-medium">Global Warming Potential</p>
                <p className={`text-2xl font-extrabold mt-1 ${activeFamily.gwpColor}`}>{activeFamily.gwp}</p>
              </div>
            </div>

            {/* Phase-out */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Phase-Out Status</p>
              <p className="text-sm text-slate-700">{activeFamily.phaseOut}</p>
            </div>

            {/* Examples */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Common Refrigerants</p>
              <div className="flex flex-wrap gap-2">
                {activeFamily.examples.map((ex) => (
                  <span key={ex} className="bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-1 rounded-lg">{ex}</span>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-2">{activeFamily.uses}</p>
            </div>

            {/* Key fact */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex gap-2">
              <span className="text-amber-500 flex-shrink-0">⚡</span>
              <p className="text-amber-800 text-xs font-semibold leading-relaxed">{activeFamily.keyFact}</p>
            </div>
          </div>
        </div>
      )}

      {allSeen && onComplete && (
        <button
          onClick={onComplete}
          className="w-full bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold py-3.5 rounded-xl transition-colors"
        >
          I know the refrigerant families — Continue →
        </button>
      )}
    </div>
  );
}
