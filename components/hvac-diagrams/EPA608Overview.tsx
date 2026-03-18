'use client';

/**
 * EPA608Overview — Interactive intro to the EPA 608 certification structure.
 * Students click each section card to learn what it covers, how many questions,
 * and what equipment it applies to.
 */

import { useState } from 'react';
import { CheckCircle, Shield, Wrench, Thermometer, Building2 } from 'lucide-react';

interface SectionInfo {
  id: string;
  label: string;
  subtitle: string;
  questions: number;
  passing: number;
  equipment: string;
  covers: string[];
  color: string;
  bg: string;
  border: string;
  icon: React.ElementType;
}

const SECTIONS: SectionInfo[] = [
  {
    id: 'core',
    label: 'Core',
    subtitle: 'Required for ALL certifications',
    questions: 25,
    passing: 70,
    equipment: 'All equipment types',
    covers: [
      'Ozone depletion and the Clean Air Act',
      'Montreal Protocol phase-out dates',
      'The Three R\'s: Recover, Recycle, Reclaim',
      'Refrigerant safety and cylinder handling',
      'Refrigeration cycle fundamentals',
      'Pressure-Temperature charts',
    ],
    color: 'text-brand-red-700',
    bg: 'bg-brand-red-50',
    border: 'border-brand-red-300',
    icon: Shield,
  },
  {
    id: 'type1',
    label: 'Type I',
    subtitle: 'Small Appliances',
    questions: 25,
    passing: 70,
    equipment: 'Systems with 5 lbs or less of refrigerant',
    covers: [
      'Window AC units and domestic refrigerators',
      'Recovery from systems with dead compressors',
      'Recovery from systems with active compressors',
      'Disposable cylinder rules',
      'Access valve use on sealed systems',
    ],
    color: 'text-brand-blue-700',
    bg: 'bg-brand-blue-50',
    border: 'border-brand-blue-300',
    icon: Wrench,
  },
  {
    id: 'type2',
    label: 'Type II',
    subtitle: 'High-Pressure Systems',
    questions: 25,
    passing: 70,
    equipment: 'Residential split systems, commercial refrigeration',
    covers: [
      'Leak repair trigger rates (10% comfort cooling, 20% commercial)',
      'Required evacuation vacuum levels',
      'Charging methods: weight, superheat, subcooling',
      'Recovery requirements before opening systems',
      'High-pressure refrigerants: R-22, R-410A, R-404A',
    ],
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    icon: Thermometer,
  },
  {
    id: 'type3',
    label: 'Type III',
    subtitle: 'Low-Pressure Systems',
    questions: 25,
    passing: 70,
    equipment: 'Centrifugal chillers (R-11, R-123)',
    covers: [
      'Systems that operate below atmospheric pressure',
      'Leak testing with pressurization (not vacuum)',
      'Purge unit operation and emissions',
      'ASHRAE Standard 15 requirements',
      'Low-pressure refrigerants: R-11, R-113, R-123',
    ],
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-300',
    icon: Building2,
  },
];

interface Props {
  mode?: 'explore' | 'review';
  onComplete?: () => void;
}

export default function EPA608Overview({ mode = 'explore', onComplete }: Props) {
  const [active, setActive] = useState<string | null>(null);
  const [seen, setSeen] = useState<Set<string>>(new Set());

  const activeSection = SECTIONS.find((s) => s.id === active);

  function handleClick(id: string) {
    setActive(id);
    setSeen((prev) => new Set([...prev, id]));
  }

  const allSeen = SECTIONS.every((s) => seen.has(s.id));

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="bg-brand-blue-700 rounded-2xl p-6 text-white">
        <p className="text-brand-red-400 text-xs font-bold uppercase tracking-widest mb-2">EPA Section 608</p>
        <h2 className="text-2xl font-extrabold mb-2">Certification Structure</h2>
        <p className="text-slate-600 text-sm leading-relaxed">
          Pass all four sections to earn <span className="text-white font-bold">Universal Certification</span> — the credential employers require.
          Each section has 25 questions. You need 70% in each section independently.
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <span className="bg-white/10 rounded-lg px-3 py-1.5 font-semibold">100 questions total</span>
          <span className="bg-white/10 rounded-lg px-3 py-1.5 font-semibold">70% per section to pass</span>
          <span className="bg-white/10 rounded-lg px-3 py-1.5 font-semibold">Proctored exam</span>
          <span className="bg-white/10 rounded-lg px-3 py-1.5 font-semibold">Never expires</span>
        </div>
      </div>

      {/* Instruction */}
      <p className="text-sm text-slate-500 font-medium">
        Tap each section to learn what it covers →
      </p>

      {/* Section cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          const isSeen = seen.has(s.id);
          const isActive = active === s.id;
          return (
            <button
              key={s.id}
              onClick={() => handleClick(s.id)}
              className={`relative rounded-2xl border-2 p-4 text-left transition-all ${
                isActive
                  ? `${s.bg} ${s.border} shadow-lg scale-[1.02]`
                  : isSeen
                  ? 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              {isSeen && !isActive && (
                <CheckCircle className="absolute top-2 right-2 w-4 h-4 text-brand-green-500" />
              )}
              <Icon className={`w-6 h-6 mb-2 ${isActive ? s.color : 'text-slate-400'}`} />
              <p className={`font-extrabold text-lg ${isActive ? s.color : 'text-slate-900'}`}>{s.label}</p>
              <p className="text-xs text-slate-500 mt-0.5 leading-snug">{s.subtitle}</p>
              <p className="text-xs font-semibold text-slate-500 mt-2">{s.questions} questions</p>
            </button>
          );
        })}
      </div>

      {/* Detail panel */}
      {activeSection && (
        <div className={`rounded-2xl border-2 ${activeSection.border} ${activeSection.bg} p-6 space-y-4`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className={`text-xl font-extrabold ${activeSection.color}`}>
                {activeSection.label} — {activeSection.subtitle}
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                <span className="font-semibold">Equipment:</span> {activeSection.equipment}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-2xl font-extrabold text-slate-900">{activeSection.questions}</p>
              <p className="text-xs text-slate-500">questions</p>
              <p className="text-sm font-bold text-brand-green-700 mt-1">{activeSection.passing}% to pass</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">This section covers:</p>
            <ul className="space-y-2">
              {activeSection.covers.map((item, i) => (
                <li key={i} className="flex gap-2 text-sm text-slate-700">
                  <CheckCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${activeSection.color}`} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Universal cert callout */}
      <div className="bg-brand-blue-700 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-3 mb-2">
          <CheckCircle className="w-6 h-6 text-brand-green-400 flex-shrink-0" />
          <p className="font-extrabold text-lg">Universal Certification</p>
        </div>
        <p className="text-brand-green-200 text-sm leading-relaxed">
          Pass Core + Type I + Type II + Type III = EPA 608 Universal.
          This is what every HVAC employer requires. It means you can legally purchase refrigerant
          and work on any equipment — residential, commercial, or industrial.
          The card never expires. Keep it with you on every job.
        </p>
      </div>

      {/* Complete button */}
      {allSeen && onComplete && (
        <button
          onClick={onComplete}
          className="w-full bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold py-3.5 rounded-xl transition-colors"
        >
          I understand the EPA 608 structure — Continue →
        </button>
      )}
    </div>
  );
}
