'use client';

/**
 * ThreeRsDiagram — Recover, Recycle, Reclaim
 * Students tap each R to see the exact legal definition, what equipment is used,
 * and what you can/cannot do with the refrigerant afterward.
 */

import { useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

const THREE_RS = [
  {
    id: 'recover',
    letter: 'R',
    word: 'Recover',
    color: 'bg-brand-blue-600',
    light: 'bg-brand-blue-50',
    border: 'border-brand-blue-300',
    text: 'text-brand-blue-700',
    definition: 'Remove refrigerant from a system in any condition and store it in an approved external container.',
    when: 'Required before opening ANY part of the refrigerant circuit — every single time.',
    equipment: 'Recovery machine + approved recovery cylinder',
    canDo: [
      'Store in a recovery cylinder',
      'Send to a reclaimer',
      'Return to the same system after repair',
    ],
    cannotDo: [
      'Put into a different owner\'s system',
      'Sell as usable refrigerant',
      'Assume it is clean — it may contain oil, moisture, or non-condensables',
    ],
    examTip: 'Recovery is the ONLY option before opening a system. No exceptions.',
  },
  {
    id: 'recycle',
    letter: 'R',
    word: 'Recycle',
    color: 'bg-amber-500',
    light: 'bg-amber-50',
    border: 'border-amber-300',
    text: 'text-amber-700',
    definition: 'Clean refrigerant for reuse using oil separation and single or multiple passes through filter-driers. Done on-site.',
    when: 'When you want to reuse refrigerant in the same system or the same owner\'s other systems.',
    equipment: 'Recycling machine with oil separator and filter-driers',
    canDo: [
      'Return to the same system',
      'Use in another system owned by the same customer',
      'Store for future use by the same owner',
    ],
    cannotDo: [
      'Use in a different owner\'s system',
      'Sell to another party',
      'Claim it meets virgin refrigerant purity (AHRI 700)',
    ],
    examTip: 'Recycled refrigerant stays with the same owner. It does NOT meet virgin specs.',
  },
  {
    id: 'reclaim',
    letter: 'R',
    word: 'Reclaim',
    color: 'bg-brand-green-600',
    light: 'bg-brand-green-50',
    border: 'border-brand-green-300',
    text: 'text-brand-green-700',
    definition: 'Reprocess refrigerant to AHRI Standard 700 purity — equivalent to new virgin refrigerant. Requires EPA-certified reclaimer.',
    when: 'When refrigerant needs to be sold, transferred to a different owner, or verified to virgin specs.',
    equipment: 'EPA-certified reclaim facility only — laboratory-grade equipment and chemical analysis',
    canDo: [
      'Sell as new refrigerant',
      'Use in any system, any owner',
      'Transfer between owners',
      'Meet AHRI 700 purity standard',
    ],
    cannotDo: [
      'Be done on-site by a technician',
      'Be done without EPA certification',
      'Skip chemical analysis',
    ],
    examTip: 'Only EPA-certified reclaimers can reclaim. AHRI 700 = virgin purity standard.',
  },
];

export default function ThreeRsDiagram({ onComplete }: { onComplete?: () => void }) {
  const [active, setActive] = useState<string | null>(null);
  const [seen, setSeen] = useState<Set<string>>(new Set());

  const activeR = THREE_RS.find((r) => r.id === active);
  const allSeen = THREE_RS.every((r) => seen.has(r.id));

  function handleClick(id: string) {
    setActive(id);
    setSeen((prev) => new Set([...prev, id]));
  }

  return (
    <div className="space-y-5">

      <div className="bg-slate-900 rounded-2xl p-5 text-white">
        <p className="text-brand-red-400 text-xs font-bold uppercase tracking-widest mb-1">EPA 608 Core — The Three R's</p>
        <h2 className="text-xl font-extrabold">Recover · Recycle · Reclaim</h2>
        <p className="text-slate-400 text-sm mt-1">
          The exam tests the exact legal difference between these three. Tap each one.
        </p>
      </div>

      {/* Three R buttons */}
      <div className="grid grid-cols-3 gap-3">
        {THREE_RS.map((r) => {
          const isSeen = seen.has(r.id);
          const isActive = active === r.id;
          return (
            <button
              key={r.id}
              onClick={() => handleClick(r.id)}
              className={`relative rounded-2xl p-4 text-center transition-all border-2 ${
                isActive
                  ? `${r.light} ${r.border} shadow-lg scale-[1.03]`
                  : isSeen
                  ? 'bg-slate-50 border-slate-200'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              {isSeen && !isActive && (
                <CheckCircle className="absolute top-2 right-2 w-4 h-4 text-brand-green-500" />
              )}
              <div className={`w-12 h-12 rounded-full ${r.color} flex items-center justify-center text-white font-extrabold text-2xl mx-auto mb-2`}>
                {r.letter}
              </div>
              <p className={`font-extrabold text-sm ${isActive ? r.text : 'text-slate-700'}`}>{r.word}</p>
            </button>
          );
        })}
      </div>

      {/* Detail panel */}
      {activeR && (
        <div className={`rounded-2xl border-2 ${activeR.border} ${activeR.light} overflow-hidden`}>
          <div className={`${activeR.color} px-5 py-3`}>
            <h3 className="text-white font-extrabold text-lg">{activeR.word}</h3>
          </div>
          <div className="p-5 space-y-4">
            <p className="text-slate-700 text-sm leading-relaxed">{activeR.definition}</p>

            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-1">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">When to use it</p>
              <p className="text-sm text-slate-700">{activeR.when}</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-1">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Equipment needed</p>
              <p className="text-sm text-slate-700">{activeR.equipment}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-brand-green-50 rounded-xl border border-brand-green-200 p-3">
                <p className="text-xs font-bold text-brand-green-700 uppercase tracking-wider mb-2">✓ You CAN</p>
                <ul className="space-y-1.5">
                  {activeR.canDo.map((item, i) => (
                    <li key={i} className="flex gap-1.5 text-xs text-slate-700">
                      <CheckCircle className="w-3.5 h-3.5 text-brand-green-500 flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-brand-red-50 rounded-xl border border-brand-red-200 p-3">
                <p className="text-xs font-bold text-brand-red-700 uppercase tracking-wider mb-2">✗ You CANNOT</p>
                <ul className="space-y-1.5">
                  {activeR.cannotDo.map((item, i) => (
                    <li key={i} className="flex gap-1.5 text-xs text-slate-700">
                      <XCircle className="w-3.5 h-3.5 text-brand-red-500 flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex gap-2">
              <span className="text-amber-500 flex-shrink-0">⚡</span>
              <p className="text-amber-800 text-xs font-semibold">{activeR.examTip}</p>
            </div>
          </div>
        </div>
      )}

      {allSeen && onComplete && (
        <button
          onClick={onComplete}
          className="w-full bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold py-3.5 rounded-xl transition-colors"
        >
          I know the Three R's — Continue →
        </button>
      )}
    </div>
  );
}
