'use client';

/**
 * TypeIIIChillerDiagram — EPA 608 Type III (Low-Pressure Systems)
 * Covers centrifugal chillers, below-atmospheric operation,
 * purge units, pressurization leak testing, and ASHRAE 15.
 */

import { useState } from 'react';
import { CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';

const CONCEPTS = [
  {
    id: 'what',
    title: 'What is a Low-Pressure System?',
    content: `Low-pressure systems operate below atmospheric pressure (below 0 PSIG) during normal operation. This is the opposite of high-pressure systems like R-410A which operate well above atmospheric pressure.

The most common low-pressure refrigerants are R-11, R-113, and R-123. These are used in large centrifugal chillers — the massive refrigeration machines that cool large commercial buildings, hospitals, and universities.

Because the system operates in a vacuum, air and moisture can leak IN rather than refrigerant leaking out. This is the key difference from Type I and Type II systems.`,
    fact: 'R-123 (HCFC) is the current low-pressure refrigerant used in centrifugal chillers. It replaced R-11 (CFC) which was phased out in 1996.',
  },
  {
    id: 'purge',
    title: 'Purge Units — What They Do',
    content: `Because low-pressure systems operate in a vacuum, air and moisture continuously leak into the system. A purge unit (also called a purge recovery unit) removes this non-condensable air and moisture from the chiller.

The purge unit works by drawing off the air/refrigerant mixture from the top of the condenser (where non-condensables collect), separating the refrigerant from the air, and venting the air while returning the refrigerant to the system.

Under EPA regulations, purge units must be high-efficiency units that limit refrigerant emissions. The EPA requires that purge units emit no more than 0.5 lbs of refrigerant per pound of air purged. Older purge units that do not meet this standard must be replaced.

Purge unit emissions must be logged. If a chiller loses more than 10% of its charge in a 12-month period, the leak must be repaired.`,
    fact: 'Purge unit logs are required by EPA. If your chiller is losing refrigerant faster than the purge unit can account for, you have a leak that must be found and repaired.',
  },
  {
    id: 'leak_test',
    title: 'Leak Testing — Pressurization (Not Vacuum)',
    content: `This is the most counterintuitive part of Type III: you test for leaks by pressurizing the system, not by pulling a vacuum.

Why? Because the system normally operates in a vacuum. If you pull a vacuum to test for leaks, you are just recreating normal operating conditions — you cannot tell if there is a leak. Instead, you pressurize the system with dry nitrogen or the system's own refrigerant vapor to bring it above atmospheric pressure. Then you use an electronic leak detector or soap bubbles to find leaks.

Pressurization procedure:
1. Isolate the section to be tested
2. Pressurize with dry nitrogen to a pressure above atmospheric (typically 3–5 PSIG)
3. Check all joints, valves, and fittings with a leak detector
4. Never pressurize above the system's maximum allowable working pressure

Important: Never use oxygen or compressed air to pressurize a refrigerant system. Oxygen + refrigerant oil = explosion risk.`,
    fact: 'ASHRAE Standard 15 governs the safe use of refrigerants in mechanical rooms. It requires leak detectors, ventilation, and emergency shutoffs for systems using low-pressure refrigerants.',
  },
  {
    id: 'recovery',
    title: 'Recovery Requirements for Type III',
    content: `Recovery from low-pressure systems has different requirements than high-pressure systems because of the below-atmospheric operating pressure.

Required recovery level for low-pressure systems:
- Systems manufactured after November 15, 1993: recover to 25 mm Hg absolute (approximately 29 in. Hg vacuum)
- Systems manufactured before November 15, 1993: recover to 25 mm Hg absolute

The recovery equipment must be rated for low-pressure refrigerants. Standard high-pressure recovery machines are not designed for the deep vacuum levels required for low-pressure systems.

After recovery, the system will be at a deep vacuum. Before opening the system, you must break the vacuum with dry nitrogen to bring the system to atmospheric pressure. This prevents air and moisture from rushing in when you open the system.`,
    fact: '25 mm Hg absolute is a very deep vacuum — approximately 29 in. Hg on a standard vacuum gauge. This is much deeper than the 15 in. Hg required for large high-pressure systems.',
  },
  {
    id: 'ashrae',
    title: 'ASHRAE Standard 15',
    content: `ASHRAE Standard 15 — Safety Standard for Refrigeration Systems — sets requirements for mechanical rooms that contain refrigeration equipment. The exam tests several specific requirements.

Key ASHRAE 15 requirements for low-pressure systems:
- Refrigerant detectors must be installed in the mechanical room, set to alarm at the TLV (Threshold Limit Value) of the refrigerant
- Emergency ventilation must be capable of exhausting the mechanical room air
- Self-contained breathing apparatus (SCBA) must be available outside the mechanical room
- Pressure relief valves must discharge to the outdoors or to a purge recovery system
- The mechanical room must have a means to shut off refrigerant flow in an emergency

R-123 has a TLV of 10 ppm. This is relatively low — the detector must alarm before concentrations reach dangerous levels.`,
    fact: 'R-123 is mildly toxic at high concentrations. ASHRAE 15 requirements exist specifically because a large chiller leak in an enclosed mechanical room can create dangerous conditions quickly.',
  },
];

const QUIZ = [
  {
    q: 'Why do low-pressure systems use pressurization (not vacuum) for leak testing?',
    options: [
      'Vacuum testing is too expensive',
      'The system normally operates in a vacuum, so vacuum testing cannot detect leaks',
      'Pressurization is required by ASHRAE 15',
      'Vacuum testing damages the compressor',
    ],
    correct: 1,
    explanation: 'Low-pressure systems operate below atmospheric pressure. Pulling a vacuum just recreates normal operating conditions. You must pressurize above atmospheric to create a pressure differential that reveals leaks.',
  },
  {
    q: 'What is the required recovery level for a low-pressure system manufactured in 2010?',
    options: [
      '0 in. Hg (atmospheric)',
      '15 in. Hg vacuum',
      '25 mm Hg absolute (~29 in. Hg vacuum)',
      '500 microns',
    ],
    correct: 2,
    explanation: 'Low-pressure systems require recovery to 25 mm Hg absolute — a very deep vacuum of approximately 29 in. Hg. This applies to systems manufactured after November 15, 1993.',
  },
  {
    q: 'What must you do before opening a low-pressure system after recovery?',
    options: [
      'Nothing — open it immediately',
      'Pull an additional vacuum',
      'Break the vacuum with dry nitrogen to reach atmospheric pressure',
      'Charge with R-123 to 5 PSIG',
    ],
    correct: 2,
    explanation: 'After recovery, the system is at deep vacuum. You must break the vacuum with dry nitrogen before opening. This prevents air and moisture from rushing in and contaminating the system.',
  },
];

export default function TypeIIIChillerDiagram({ onComplete }: { onComplete?: () => void }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['what']));
  const [seenConcepts, setSeenConcepts] = useState<Set<string>>(new Set(['what']));
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [showQuiz, setShowQuiz] = useState(false);

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
    setSeenConcepts((prev) => new Set([...prev, id]));
  }

  function answer(qi: number, ai: number) {
    if (revealed.has(qi)) return;
    setAnswers((prev) => ({ ...prev, [qi]: ai }));
    setRevealed((prev) => new Set([...prev, qi]));
  }

  const allConceptsSeen = CONCEPTS.every((c) => seenConcepts.has(c.id));
  const allAnswered = Object.keys(answers).length === QUIZ.length;
  const score = QUIZ.filter((q, i) => answers[i] === q.correct).length;

  return (
    <div className="space-y-5">

      <div className="bg-slate-900 rounded-2xl p-5 text-white">
        <p className="text-brand-red-400 text-xs font-bold uppercase tracking-widest mb-1">EPA 608 Type III — Low-Pressure Systems</p>
        <h2 className="text-xl font-extrabold">Centrifugal Chillers</h2>
        <p className="text-slate-400 text-sm mt-1">The most specialized section. Expand each concept, then take the quiz.</p>
      </div>

      {/* Key difference callout */}
      <div className="bg-brand-blue-900 rounded-2xl p-4 text-white">
        <p className="font-extrabold text-sm mb-1">The Key Difference from Type I and II</p>
        <p className="text-brand-blue-200 text-sm leading-relaxed">
          Type III systems operate <span className="text-white font-bold">below atmospheric pressure</span> (in a vacuum).
          Air leaks IN. You test for leaks by pressurizing, not pulling vacuum.
          Recovery requires a very deep vacuum (25 mm Hg absolute).
        </p>
      </div>

      {/* Accordion concepts */}
      <div className="space-y-2">
        {CONCEPTS.map((c) => {
          const isOpen = expanded.has(c.id);
          const isSeen = seenConcepts.has(c.id);
          return (
            <div key={c.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <button
                onClick={() => toggle(c.id)}
                className="w-full flex items-center justify-between px-5 py-4 text-left"
              >
                <div className="flex items-center gap-3">
                  {isSeen && <CheckCircle className="w-4 h-4 text-brand-green-500 flex-shrink-0" />}
                  <span className="font-bold text-slate-900 text-sm">{c.title}</span>
                </div>
                {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>
              {isOpen && (
                <div className="px-5 pb-5 space-y-3 border-t border-slate-100">
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line pt-3">{c.content}</p>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex gap-2">
                    <span className="text-amber-500 flex-shrink-0">⚡</span>
                    <p className="text-amber-800 text-xs font-semibold leading-relaxed">{c.fact}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick reference numbers */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Type III Numbers — Memorize These</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Recovery Level', value: '25 mm Hg', sub: 'absolute (~29 in. Hg)' },
            { label: 'Purge Emission Limit', value: '0.5 lbs', sub: 'per lb of air purged' },
            { label: 'Leak Trigger', value: '10%', sub: 'annual charge loss' },
            { label: 'R-123 TLV', value: '10 ppm', sub: 'ASHRAE 15 alarm level' },
          ].map((item) => (
            <div key={item.label} className="bg-white rounded-xl border border-slate-200 p-3 text-center">
              <p className="text-xs text-slate-500 font-medium">{item.label}</p>
              <p className="text-xl font-extrabold text-brand-blue-700 mt-1">{item.value}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{item.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quiz */}
      {allConceptsSeen && !showQuiz && (
        <button
          onClick={() => setShowQuiz(true)}
          className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3.5 rounded-xl transition-colors"
        >
          Take the Type III Quiz →
        </button>
      )}

      {showQuiz && (
        <div className="space-y-4">
          <p className="font-bold text-slate-900">Type III Quiz</p>
          {QUIZ.map((q, qi) => (
            <div key={qi} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
              <p className="font-bold text-slate-900 text-sm leading-relaxed">{q.q}</p>
              <div className="space-y-2">
                {q.options.map((opt, ai) => {
                  const isAnswered = revealed.has(qi);
                  const isSelected = answers[qi] === ai;
                  const isCorrect = ai === q.correct;
                  return (
                    <button
                      key={ai}
                      onClick={() => answer(qi, ai)}
                      disabled={isAnswered}
                      className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all flex items-center gap-2 ${
                        !isAnswered ? 'bg-slate-50 border-slate-200 hover:border-brand-blue-300 hover:bg-brand-blue-50'
                        : isCorrect ? 'bg-brand-green-50 border-brand-green-300'
                        : isSelected ? 'bg-brand-red-50 border-brand-red-300'
                        : 'bg-slate-50 border-slate-200 opacity-50'
                      }`}
                    >
                      {isAnswered && isCorrect && <CheckCircle className="w-4 h-4 text-brand-green-500 flex-shrink-0" />}
                      {isAnswered && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-brand-red-500 flex-shrink-0" />}
                      {opt}
                    </button>
                  );
                })}
              </div>
              {revealed.has(qi) && (
                <div className="bg-slate-50 rounded-xl border border-slate-200 px-4 py-3">
                  <p className="text-sm text-slate-700 leading-relaxed">{q.explanation}</p>
                </div>
              )}
            </div>
          ))}

          {allAnswered && (
            <div className={`rounded-2xl p-5 text-white ${score === QUIZ.length ? 'bg-brand-green-900' : score >= 2 ? 'bg-brand-blue-900' : 'bg-slate-800'}`}>
              <p className="font-extrabold text-xl">{score}/{QUIZ.length} correct</p>
              <p className="text-sm mt-1 opacity-80">
                {score === QUIZ.length ? 'Perfect — Type III mastered.' : score >= 2 ? 'Good. Review the concepts you missed.' : 'Review all Type III concepts and try again.'}
              </p>
            </div>
          )}
        </div>
      )}

      {allAnswered && onComplete && (
        <button
          onClick={onComplete}
          className="w-full bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold py-3.5 rounded-xl transition-colors"
        >
          Type III complete — Continue →
        </button>
      )}
    </div>
  );
}
