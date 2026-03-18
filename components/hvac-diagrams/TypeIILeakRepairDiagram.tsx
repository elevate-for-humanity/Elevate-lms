'use client';

/**
 * TypeIILeakRepairDiagram — EPA 608 Type II (High-Pressure Systems)
 * Covers leak repair trigger rates, evacuation vacuum levels,
 * and charging methods. Interactive tabs with scenario quizzes.
 */

import { useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

const TABS = [
  { id: 'leak', label: 'Leak Repair' },
  { id: 'evacuation', label: 'Evacuation' },
  { id: 'charging', label: 'Charging' },
  { id: 'quiz', label: 'Quiz' },
];

const LEAK_RATES = [
  {
    type: 'Comfort Cooling',
    examples: 'Residential split systems, commercial rooftop units',
    trigger: '10%',
    triggerNum: 10,
    color: 'bg-brand-blue-600',
    light: 'bg-brand-blue-50',
    border: 'border-brand-blue-200',
    rule: 'If a comfort cooling system with 50+ lbs of refrigerant leaks more than 10% of its charge per year, you must repair the leak within 30 days.',
  },
  {
    type: 'Commercial Refrigeration',
    examples: 'Supermarket cases, walk-in coolers, food service equipment',
    trigger: '20%',
    triggerNum: 20,
    color: 'bg-amber-500',
    light: 'bg-amber-50',
    border: 'border-amber-200',
    rule: 'Commercial refrigeration systems with 50+ lbs of refrigerant must have leaks repaired within 30 days if the leak rate exceeds 20% per year.',
  },
  {
    type: 'Industrial Process',
    examples: 'Manufacturing, chemical processing, industrial refrigeration',
    trigger: '30%',
    triggerNum: 30,
    color: 'bg-brand-green-600',
    light: 'bg-brand-green-50',
    border: 'border-brand-green-200',
    rule: 'Industrial process refrigeration has a 30% annual leak rate trigger. Repair must be completed within 30 days, with a possible 120-day extension.',
  },
];

const EVACUATION_LEVELS = [
  { system: 'Systems manufactured before Nov 15, 1993', charge: 'Any', level: '25 in. Hg', note: 'Older equipment standard' },
  { system: 'High-pressure systems (R-22, R-410A, R-404A)', charge: '< 200 lbs', level: '0 in. Hg (0 PSIG)', note: 'Atmospheric pressure — no vacuum required' },
  { system: 'High-pressure systems (R-22, R-410A, R-404A)', charge: '≥ 200 lbs', level: '15 in. Hg', note: 'Partial vacuum required' },
  { system: 'Very high-pressure systems (R-410A, R-502)', charge: '< 200 lbs', level: '0 in. Hg', note: 'No vacuum required' },
  { system: 'Very high-pressure systems (R-410A, R-502)', charge: '≥ 200 lbs', level: '15 in. Hg', note: 'Partial vacuum required' },
];

const CHARGING_METHODS = [
  {
    method: 'Charge by Weight',
    when: 'New installations, after major repairs, when nameplate charge is known',
    how: 'Use a refrigerant scale. Weigh the cylinder before and after. Add exactly the nameplate charge weight. Most accurate method.',
    tools: 'Refrigerant scale, manifold gauges',
    tip: 'Always zero the scale with the hose attached. Tare the cylinder weight before charging.',
  },
  {
    method: 'Charge by Superheat',
    when: 'Fixed orifice systems (piston, capillary tube) — no TXV',
    how: 'Measure suction pressure → look up saturation temp on P/T chart → measure suction line temp → calculate superheat. Adjust charge until superheat matches manufacturer spec (typically 10–15°F for fixed orifice).',
    tools: 'Manifold gauges, thermometer, P/T chart',
    tip: 'Superheat method does NOT work on TXV systems. The TXV controls superheat regardless of charge level.',
  },
  {
    method: 'Charge by Subcooling',
    when: 'TXV systems — residential and commercial split systems',
    how: 'Measure liquid line pressure → look up saturation temp on P/T chart → measure liquid line temp → calculate subcooling. Adjust charge until subcooling matches manufacturer spec (typically 10–15°F).',
    tools: 'Manifold gauges, thermometer, P/T chart',
    tip: 'Subcooling method is the standard for TXV systems. Target subcooling is on the equipment nameplate or in the service manual.',
  },
];

const QUIZ_QUESTIONS = [
  {
    q: 'A comfort cooling system has 100 lbs of R-410A and leaked 12 lbs over the past year. What must happen?',
    options: [
      'Nothing — 12 lbs is under the 20% trigger',
      'Repair the leak within 30 days — 12% exceeds the 10% comfort cooling trigger',
      'Repair the leak within 120 days',
      'Replace the entire system',
    ],
    correct: 1,
    explanation: '12 lbs out of 100 lbs = 12% leak rate. Comfort cooling trigger is 10%. Since 12% > 10%, the leak must be repaired within 30 days.',
  },
  {
    q: 'You are evacuating a 150 lb R-22 system manufactured in 2005. What vacuum level is required?',
    options: [
      '25 in. Hg',
      '15 in. Hg',
      '0 in. Hg (atmospheric)',
      '500 microns',
    ],
    correct: 2,
    explanation: 'High-pressure systems with less than 200 lbs of refrigerant manufactured after Nov 15, 1993 only require evacuation to 0 in. Hg (atmospheric pressure). No vacuum is required.',
  },
  {
    q: 'A residential split system uses a TXV. Which charging method should you use?',
    options: [
      'Charge by weight only',
      'Charge by superheat',
      'Charge by subcooling',
      'Either superheat or subcooling',
    ],
    correct: 2,
    explanation: 'TXV systems are charged by subcooling. The TXV controls superheat regardless of charge level, so superheat cannot be used to verify charge on a TXV system.',
  },
];

export default function TypeIILeakRepairDiagram({ onComplete }: { onComplete?: () => void }) {
  const [activeTab, setActiveTab] = useState('leak');
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [completedTabs, setCompletedTabs] = useState<Set<string>>(new Set());

  function markTab(id: string) {
    setCompletedTabs((prev) => new Set([...prev, id]));
  }

  function answerQuestion(qi: number, ai: number) {
    setAnswers((prev) => ({ ...prev, [qi]: ai }));
    setRevealed((prev) => new Set([...prev, qi]));
    if (Object.keys({ ...answers, [qi]: ai }).length === QUIZ_QUESTIONS.length) {
      markTab('quiz');
    }
  }

  const allTabsDone = ['leak', 'evacuation', 'charging', 'quiz'].every((t) => completedTabs.has(t));

  return (
    <div className="space-y-5">

      <div className="bg-brand-blue-700 rounded-2xl p-5 text-white">
        <p className="text-brand-red-400 text-xs font-bold uppercase tracking-widest mb-1">EPA 608 Type II — High-Pressure Systems</p>
        <h2 className="text-xl font-extrabold">Leak Repair · Evacuation · Charging</h2>
        <p className="text-slate-500 text-sm mt-1">The three most tested topics for Type II. Work through each tab.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => { setActiveTab(t.id); markTab(t.id); }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all relative ${
              activeTab === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {completedTabs.has(t.id) && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-brand-green-500 rounded-full" />
            )}
            {t.label}
          </button>
        ))}
      </div>

      {/* Leak Repair tab */}
      {activeTab === 'leak' && (
        <div className="space-y-3">
          <p className="text-xs text-slate-500 font-medium">Leak repair is required when annual leak rate exceeds the trigger for that equipment type. Applies to systems with <span className="font-bold text-slate-700">50 lbs or more</span> of refrigerant.</p>
          {LEAK_RATES.map((lr) => (
            <div key={lr.type} className={`rounded-2xl border ${lr.border} ${lr.light} overflow-hidden`}>
              <div className={`${lr.color} px-4 py-2.5 flex items-center justify-between`}>
                <p className="text-slate-900 font-extrabold text-sm">{lr.type}</p>
                <span className="bg-white/20 text-white font-extrabold text-lg px-3 py-0.5 rounded-full">{lr.trigger}</span>
              </div>
              <div className="p-4 space-y-2">
                <p className="text-xs text-slate-500">{lr.examples}</p>
                <p className="text-sm text-slate-700 leading-relaxed">{lr.rule}</p>
              </div>
            </div>
          ))}
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex gap-2">
            <span className="text-amber-500">⚡</span>
            <p className="text-amber-800 text-xs font-semibold">Repair deadline is always 30 days. Industrial process gets a possible 120-day extension if repair is not feasible within 30 days.</p>
          </div>
        </div>
      )}

      {/* Evacuation tab */}
      {activeTab === 'evacuation' && (
        <div className="space-y-3">
          <p className="text-xs text-slate-500 font-medium">Required vacuum levels before opening a system depend on the refrigerant type, system size, and manufacture date.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-100">
                  <th className="text-left px-3 py-2 font-bold text-slate-600 rounded-tl-xl">System Type</th>
                  <th className="text-left px-3 py-2 font-bold text-slate-600">Charge</th>
                  <th className="text-left px-3 py-2 font-bold text-slate-600 rounded-tr-xl">Required Level</th>
                </tr>
              </thead>
              <tbody>
                {EVACUATION_LEVELS.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="px-3 py-2.5 text-slate-700">{row.system}</td>
                    <td className="px-3 py-2.5 text-slate-700 font-medium">{row.charge}</td>
                    <td className="px-3 py-2.5 font-extrabold text-brand-blue-700">{row.level}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex gap-2">
            <span className="text-amber-500">⚡</span>
            <p className="text-amber-800 text-xs font-semibold">The exam loves to test the pre-1993 vs post-1993 distinction. Pre-1993 systems always require 25 in. Hg regardless of size.</p>
          </div>
        </div>
      )}

      {/* Charging tab */}
      {activeTab === 'charging' && (
        <div className="space-y-3">
          {CHARGING_METHODS.map((m) => (
            <div key={m.method} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="bg-white px-4 py-2.5">
                <p className="text-slate-900 font-extrabold text-sm">{m.method}</p>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">When to use</p>
                  <p className="text-sm text-slate-700">{m.when}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">How it works</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{m.how}</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 flex gap-2">
                  <span className="text-amber-500 text-xs">⚡</span>
                  <p className="text-amber-800 text-xs font-semibold">{m.tip}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quiz tab */}
      {activeTab === 'quiz' && (
        <div className="space-y-4">
          {QUIZ_QUESTIONS.map((q, qi) => (
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
                      onClick={() => !isAnswered && answerQuestion(qi, ai)}
                      disabled={isAnswered}
                      className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all flex items-center gap-2 ${
                        !isAnswered
                          ? 'bg-slate-50 border-slate-200 hover:border-brand-blue-300 hover:bg-brand-blue-50'
                          : isCorrect
                          ? 'bg-brand-green-50 border-brand-green-300'
                          : isSelected
                          ? 'bg-brand-red-50 border-brand-red-300'
                          : 'bg-slate-50 border-slate-200 opacity-60'
                      }`}
                    >
                      {isAnswered && isCorrect && <CheckCircle className="w-4 h-4 text-brand-green-500 flex-shrink-0" />}
                      {isAnswered && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-brand-red-500 flex-shrink-0" />}
                      <span className={isAnswered && isCorrect ? 'font-bold text-brand-green-700' : ''}>{opt}</span>
                    </button>
                  );
                })}
              </div>
              {revealed.has(qi) && (
                <div className="bg-slate-50 rounded-xl border border-slate-200 px-4 py-3">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Explanation</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{q.explanation}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {allTabsDone && onComplete && (
        <button
          onClick={onComplete}
          className="w-full bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold py-3.5 rounded-xl transition-colors"
        >
          Type II mastered — Continue →
        </button>
      )}
    </div>
  );
}
