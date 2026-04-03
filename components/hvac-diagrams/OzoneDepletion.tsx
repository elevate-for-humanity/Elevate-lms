'use client';

/**
 * OzoneDepletion — Interactive diagram showing how chlorine from CFCs/HCFCs
 * destroys ozone molecules in the stratosphere.
 * Students step through the chain reaction one stage at a time.
 */

import { useState } from 'react';
import { ArrowRight, ChevronRight, RotateCcw } from 'lucide-react';

interface Stage {
  id: number;
  title: string;
  description: string;
  visual: React.ReactNode;
  fact: string;
}

function Molecule({ label, color, size = 'md' }: { label: string; color: string; size?: 'sm' | 'md' | 'lg' }) {
  const sz = size === 'lg' ? 'w-16 h-16 text-base' : size === 'sm' ? 'w-8 h-8 text-[10px]' : 'w-12 h-12 text-xs';
  return (
    <div className={`${sz} rounded-full ${color} flex items-center justify-center font-extrabold text-white shadow-md flex-shrink-0`}>
      {label}
    </div>
  );
}

function Bond() {
  return <div className="w-6 h-0.5 bg-slate-400 flex-shrink-0" />;
}

const STAGES: Stage[] = [
  {
    id: 1,
    title: 'CFC Released into Atmosphere',
    description: 'A CFC refrigerant like R-12 leaks from a system and drifts upward. CFCs are stable at ground level — they do not break down in rain or react with other chemicals. This stability is what makes them dangerous: they survive long enough to reach the stratosphere, 10–30 miles up.',
    visual: (
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-2">
          <Molecule label="Cl" color="bg-yellow-500" />
          <Bond />
          <Molecule label="F" color="bg-brand-blue-500" />
          <Bond />
          <Molecule label="C" color="bg-slate-600" />
          <Bond />
          <Molecule label="F" color="bg-brand-blue-500" />
        </div>
        <p className="text-xs text-slate-500 font-medium">R-12 (CFC) molecule — stable, drifting upward</p>
        <div className="flex items-center gap-2 text-slate-400">
          <span className="text-xs">Ground level</span>
          <ArrowRight className="w-4 h-4" />
          <span className="text-xs font-semibold text-slate-600">Stratosphere (10–30 miles up)</span>
        </div>
      </div>
    ),
    fact: 'CFCs can take 2–5 years to drift from ground level to the stratosphere.',
  },
  {
    id: 2,
    title: 'UV Radiation Breaks the CFC Apart',
    description: 'In the stratosphere, intense UV-B radiation hits the CFC molecule. The UV energy is strong enough to break the carbon-chlorine bond. This releases a free chlorine atom — highly reactive and ready to attack ozone.',
    visual: (
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Molecule label="Cl" color="bg-yellow-500" />
            <Bond />
            <Molecule label="C" color="bg-slate-600" />
            <Bond />
            <Molecule label="F" color="bg-brand-blue-500" />
          </div>
          <div className="flex flex-col items-center">
            <span className="text-yellow-500 font-extrabold text-lg">☀️</span>
            <span className="text-[10px] text-yellow-600 font-bold">UV-B</span>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-400" />
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center">
              <Molecule label="Cl•" color="bg-brand-red-500" size="lg" />
              <p className="text-[10px] text-brand-red-600 font-bold mt-1">Free chlorine</p>
            </div>
            <span className="text-slate-500">+</span>
            <div className="flex items-center gap-1">
              <Molecule label="C" color="bg-slate-600" size="sm" />
              <Molecule label="F" color="bg-brand-blue-500" size="sm" />
            </div>
          </div>
        </div>
      </div>
    ),
    fact: 'The • symbol means a free radical — an atom with an unpaired electron that is extremely reactive.',
  },
  {
    id: 3,
    title: 'Chlorine Attacks an Ozone Molecule',
    description: 'The free chlorine atom collides with an ozone molecule (O₃). Chlorine steals one oxygen atom, converting ozone into ordinary oxygen (O₂) and forming chlorine monoxide (ClO). The ozone molecule is destroyed — it can no longer absorb UV-B radiation.',
    visual: (
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-3 flex-wrap justify-center">
          <div className="flex flex-col items-center">
            <Molecule label="Cl•" color="bg-brand-red-500" />
            <p className="text-[10px] text-slate-500 mt-1">Free Cl</p>
          </div>
          <span className="text-slate-500 font-bold">+</span>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1">
              <Molecule label="O" color="bg-brand-blue-600" size="sm" />
              <Molecule label="O" color="bg-brand-blue-600" size="sm" />
              <Molecule label="O" color="bg-brand-blue-600" size="sm" />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Ozone (O₃)</p>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-400" />
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1">
                <Molecule label="Cl" color="bg-brand-red-500" size="sm" />
                <Molecule label="O" color="bg-brand-blue-600" size="sm" />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">ClO</p>
            </div>
            <span className="text-slate-500">+</span>
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1">
                <Molecule label="O" color="bg-slate-400" size="sm" />
                <Molecule label="O" color="bg-slate-400" size="sm" />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">O₂ (ordinary oxygen)</p>
            </div>
          </div>
        </div>
      </div>
    ),
    fact: 'O₂ cannot absorb UV-B radiation. Every ozone molecule destroyed means more UV-B reaches Earth\'s surface.',
  },
  {
    id: 4,
    title: 'Chlorine is Released — Cycle Repeats',
    description: 'The ClO molecule reacts with a free oxygen atom, releasing the chlorine atom again. The chlorine is now free to attack another ozone molecule. This is a catalytic cycle — the chlorine is not consumed. One chlorine atom can destroy up to 100,000 ozone molecules before it is finally neutralized.',
    visual: (
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-3 flex-wrap justify-center">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1">
              <Molecule label="Cl" color="bg-brand-red-500" size="sm" />
              <Molecule label="O" color="bg-brand-blue-600" size="sm" />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">ClO</p>
          </div>
          <span className="text-slate-500 font-bold">+</span>
          <div className="flex flex-col items-center">
            <Molecule label="O" color="bg-brand-blue-600" size="sm" />
            <p className="text-[10px] text-slate-500 mt-1">Free O</p>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-400" />
          <div className="flex flex-col items-center">
            <Molecule label="Cl•" color="bg-brand-red-500" />
            <p className="text-[10px] text-brand-red-600 font-bold mt-1">Cl released again!</p>
          </div>
          <span className="text-slate-500">+</span>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1">
              <Molecule label="O" color="bg-slate-400" size="sm" />
              <Molecule label="O" color="bg-slate-400" size="sm" />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">O₂</p>
          </div>
        </div>
        <div className="bg-brand-red-50 border border-brand-red-200 rounded-xl px-4 py-2 text-center">
          <p className="text-brand-red-700 font-extrabold text-sm">↺ Chlorine attacks again</p>
          <p className="text-brand-red-600 text-xs mt-0.5">Up to 100,000 ozone molecules destroyed per chlorine atom</p>
        </div>
      </div>
    ),
    fact: 'This is why even small amounts of CFC refrigerant cause massive ozone damage. The chlorine is a catalyst — it keeps working indefinitely.',
  },
  {
    id: 5,
    title: 'Why HFCs Have Zero ODP',
    description: 'HFC refrigerants like R-410A contain no chlorine — only hydrogen, fluorine, and carbon. Without chlorine, there is no free radical to attack ozone. This is why HFCs have an Ozone Depletion Potential of zero. HFOs like R-1234yf also have zero ODP for the same reason.',
    visual: (
      <div className="flex flex-col gap-4 w-full max-w-sm">
        {[
          { label: 'CFC (R-12)', contains: 'C + Cl + F', odp: '1.0', color: 'bg-brand-red-100 border-brand-red-300', badge: 'bg-brand-red-500', verdict: 'BANNED' },
          { label: 'HCFC (R-22)', contains: 'H + C + Cl + F', odp: '0.05', color: 'bg-amber-100 border-amber-300', badge: 'bg-amber-500', verdict: 'PHASED OUT' },
          { label: 'HFC (R-410A)', contains: 'H + F + C only', odp: '0.0', color: 'bg-brand-green-100 border-brand-green-300', badge: 'bg-brand-green-600', verdict: 'ZERO ODP' },
          { label: 'HFO (R-1234yf)', contains: 'H + F + C only', odp: '0.0', color: 'bg-brand-green-100 border-brand-green-300', badge: 'bg-brand-green-600', verdict: 'ZERO ODP' },
        ].map((r) => (
          <div key={r.label} className={`flex items-center justify-between rounded-xl border px-4 py-3 ${r.color}`}>
            <div>
              <p className="font-bold text-slate-900 text-sm">{r.label}</p>
              <p className="text-xs text-slate-500">{r.contains}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">ODP</p>
              <p className="font-extrabold text-slate-900">{r.odp}</p>
            </div>
            <span className={`text-white text-[10px] font-extrabold px-2 py-1 rounded-full ${r.badge}`}>{r.verdict}</span>
          </div>
        ))}
      </div>
    ),
    fact: 'No chlorine = no ozone destruction. The phase-out of CFCs and HCFCs is working — the ozone layer is slowly recovering.',
  },
];

interface Props {
  onComplete?: () => void;
}

export default function OzoneDepletion({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [completed, setCompleted] = useState(false);

  const current = STAGES[step];
  const isLast = step === STAGES.length - 1;

  function next() {
    if (isLast) {
      setCompleted(true);
      onComplete?.();
    } else {
      setStep((s) => s + 1);
    }
  }

  function reset() {
    setStep(0);
    setCompleted(false);
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="bg-brand-blue-700 rounded-2xl p-5 text-white">
        <p className="text-brand-red-400 text-xs font-bold uppercase tracking-widest mb-1">EPA 608 Core — Ozone Depletion</p>
        <h2 className="text-xl font-extrabold">How Chlorine Destroys Ozone</h2>
        <p className="text-slate-500 text-sm mt-1">Step through the chain reaction that led to the Montreal Protocol and the CFC ban.</p>
      </div>

      {/* Progress */}
      <div className="flex gap-1.5">
        {STAGES.map((s, i) => (
          <div
            key={s.id}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i < step ? 'bg-brand-red-500' : i === step ? 'bg-brand-red-300' : 'bg-slate-200'
            }`}
          />
        ))}
      </div>

      {/* Stage card */}
      {!completed ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-white px-5 py-3">
            <p className="text-slate-900 text-xs font-bold uppercase tracking-wider">Step {current.id} of {STAGES.length}</p>
            <h3 className="text-slate-900 font-extrabold text-lg leading-snug">{current.title}</h3>
          </div>

          {/* Visual */}
          <div className="bg-slate-50 border-b border-slate-100 p-6 flex items-center justify-center min-h-[140px]">
            {current.visual}
          </div>

          {/* Description */}
          <div className="p-5 space-y-4">
            <p className="text-slate-700 text-sm leading-relaxed">{current.description}</p>

            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex gap-2">
              <span className="text-amber-500 flex-shrink-0">⚡</span>
              <p className="text-amber-800 text-xs font-semibold leading-relaxed">{current.fact}</p>
            </div>

            <button
              onClick={next}
              className="w-full flex items-center justify-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold py-3 rounded-xl transition-colors"
            >
              {isLast ? 'Complete Lesson' : 'Next Step'}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-brand-blue-700 rounded-2xl p-6 text-white space-y-4">
          <h3 className="text-xl font-extrabold">Chain Reaction Complete ✓</h3>
          <p className="text-white text-sm leading-relaxed">
            You now understand why CFCs were banned. One chlorine atom destroys up to 100,000 ozone molecules
            in a catalytic cycle. HFCs and HFOs have zero ODP because they contain no chlorine.
            This is the science behind the Montreal Protocol and the Clean Air Act.
          </p>
          <div className="bg-white/10 rounded-xl p-4 space-y-2">
            <p className="font-bold text-sm">Exam key points:</p>
            <ul className="text-white text-sm space-y-1">
              <li>• CFCs phased out 1996 — highest ODP</li>
              <li>• HCFCs (R-22) phased out 2020 — lower ODP</li>
              <li>• HFCs (R-410A) — zero ODP, no chlorine</li>
              <li>• 1 chlorine atom = up to 100,000 ozone molecules destroyed</li>
            </ul>
          </div>
          <button onClick={reset} className="flex items-center gap-2 text-brand-green-300 text-sm font-semibold hover:text-white transition-colors">
            <RotateCcw className="w-4 h-4" /> Review again
          </button>
        </div>
      )}
    </div>
  );
}
