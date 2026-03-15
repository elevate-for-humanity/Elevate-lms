'use client';

/**
 * TypeIRecoveryDiagram — EPA 608 Type I (Small Appliances)
 * Interactive decision tree: active compressor vs dead compressor recovery,
 * access valve use, and disposal rules.
 */

import { useState } from 'react';
import { CheckCircle, ChevronRight, RotateCcw } from 'lucide-react';

type Step = {
  id: string;
  question?: string;
  title: string;
  content: string;
  fact: string;
  choices?: { label: string; next: string }[];
  terminal?: boolean;
  terminalColor?: string;
};

const STEPS: Record<string, Step> = {
  start: {
    id: 'start',
    title: 'Type I — Small Appliances',
    content: 'Type I covers systems with 5 lbs or less of refrigerant. This includes window AC units, domestic refrigerators, freezers, and small dehumidifiers. Before you do anything, you need to determine the condition of the compressor.',
    fact: 'Type I systems use disposable cylinders from the factory. You cannot add a service port to a sealed system without using an approved access valve.',
    question: 'What is the condition of the compressor?',
    choices: [
      { label: 'Compressor is working (active)', next: 'active' },
      { label: 'Compressor is dead / not running', next: 'dead' },
    ],
  },
  active: {
    id: 'active',
    title: 'Active Compressor Recovery',
    content: 'When the compressor is working, you can use it to assist recovery. Connect your recovery equipment to the system. Run the system compressor to push refrigerant into the recovery cylinder. You must recover to the required vacuum level before opening the system.',
    fact: 'Required recovery level for active compressor systems: recover to 90% of the refrigerant by weight, OR pull down to 4 inches of mercury vacuum.',
    question: 'Does the system have a service port?',
    choices: [
      { label: 'Yes — has a Schrader valve or service port', next: 'active_port' },
      { label: 'No — sealed system, no port', next: 'active_no_port' },
    ],
  },
  active_port: {
    id: 'active_port',
    title: 'Active Compressor — With Service Port',
    content: 'Connect your manifold gauges and recovery machine to the service port. Run the system compressor while the recovery machine pulls refrigerant into the recovery cylinder. Monitor the scale — recover until you reach 90% by weight or 4 inches Hg vacuum. Then close the valves and open the system.',
    fact: 'Always weigh the recovery cylinder before and after. The difference is the amount of refrigerant recovered. Log this on your service ticket.',
    terminal: true,
    terminalColor: 'bg-brand-green-900',
  },
  active_no_port: {
    id: 'active_no_port',
    title: 'Active Compressor — Sealed System',
    content: 'You must install an access valve (also called a saddle valve or piercing valve) to access the refrigerant. Clamp the access valve onto the process tube or suction line. Pierce the tube to create a port. Connect your recovery equipment and proceed with recovery.',
    fact: 'Access valves are one-time use on that system. Once installed, they become a permanent part of the system. The exam may call these "piercing valves" or "saddle valves."',
    terminal: true,
    terminalColor: 'bg-brand-blue-900',
  },
  dead: {
    id: 'dead',
    title: 'Dead Compressor Recovery',
    content: 'When the compressor is not working, you cannot use it to assist recovery. Your recovery machine must do all the work. This takes longer and requires pulling the refrigerant out using only the recovery machine\'s compressor.',
    fact: 'Required recovery level for dead compressor systems: recover to 80% of the refrigerant by weight, OR pull down to 4 inches of mercury vacuum.',
    question: 'Does the system have a service port?',
    choices: [
      { label: 'Yes — has a service port', next: 'dead_port' },
      { label: 'No — sealed system', next: 'dead_no_port' },
    ],
  },
  dead_port: {
    id: 'dead_port',
    title: 'Dead Compressor — With Service Port',
    content: 'Connect your recovery machine directly to the service port. The recovery machine does all the work — it pulls refrigerant vapor out of the system and compresses it into the recovery cylinder. This is slower than active compressor recovery. Be patient and monitor the cylinder weight.',
    fact: 'With a dead compressor, recovery takes longer because you are relying entirely on the recovery machine. Make sure your recovery cylinder is not overfilled — never exceed 80% of capacity by weight.',
    terminal: true,
    terminalColor: 'bg-brand-green-900',
  },
  dead_no_port: {
    id: 'dead_no_port',
    title: 'Dead Compressor — Sealed System',
    content: 'Install an access valve on the process tube. Connect your recovery machine. Because the compressor is dead, the recovery machine must pull all refrigerant through the access valve. This is the slowest recovery scenario. Allow extra time and verify the cylinder weight throughout.',
    fact: 'If the system has been sitting with a dead compressor, the refrigerant may have migrated to the oil. Recovery may be incomplete. Log what you recovered and note the system condition.',
    terminal: true,
    terminalColor: 'bg-amber-800',
  },
};

export default function TypeIRecoveryDiagram({ onComplete }: { onComplete?: () => void }) {
  const [path, setPath] = useState<string[]>(['start']);
  const [done, setDone] = useState(false);

  const currentId = path[path.length - 1];
  const current = STEPS[currentId];

  function choose(next: string) {
    setPath((p) => [...p, next]);
    if (STEPS[next]?.terminal) setDone(true);
  }

  function reset() {
    setPath(['start']);
    setDone(false);
  }

  return (
    <div className="space-y-5">

      <div className="bg-white rounded-2xl p-5 text-white">
        <p className="text-brand-red-400 text-xs font-bold uppercase tracking-widest mb-1">EPA 608 Type I — Small Appliances</p>
        <h2 className="text-xl font-extrabold">Recovery Decision Tree</h2>
        <p className="text-slate-500 text-sm mt-1">Work through the decision tree to learn the correct recovery procedure for any Type I scenario.</p>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {path.map((id, i) => (
          <span key={id} className="flex items-center gap-1.5">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${i === path.length - 1 ? 'bg-brand-red-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
              {STEPS[id].title}
            </span>
            {i < path.length - 1 && <ChevronRight className="w-3 h-3 text-slate-400" />}
          </span>
        ))}
      </div>

      {/* Current step */}
      <div className={`rounded-2xl overflow-hidden border-2 ${current.terminal ? 'border-slate-300' : 'border-slate-200'}`}>
        <div className={`px-5 py-3 ${current.terminal ? (current.terminalColor || 'bg-slate-800') : 'bg-slate-800'}`}>
          <h3 className="text-slate-900 font-extrabold text-lg">{current.title}</h3>
        </div>
        <div className="p-5 space-y-4 bg-white">
          <p className="text-slate-700 text-sm leading-relaxed">{current.content}</p>

          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex gap-2">
            <span className="text-amber-500 flex-shrink-0">⚡</span>
            <p className="text-amber-800 text-xs font-semibold leading-relaxed">{current.fact}</p>
          </div>

          {current.question && (
            <div className="space-y-2">
              <p className="font-bold text-slate-900 text-sm">{current.question}</p>
              {current.choices?.map((c) => (
                <button
                  key={c.next}
                  onClick={() => choose(c.next)}
                  className="w-full text-left bg-slate-50 hover:bg-brand-blue-50 border border-slate-200 hover:border-brand-blue-300 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 hover:text-brand-blue-700 transition-all flex items-center justify-between"
                >
                  {c.label}
                  <ChevronRight className="w-4 h-4 flex-shrink-0" />
                </button>
              ))}
            </div>
          )}

          {current.terminal && (
            <div className="flex items-center gap-2 text-brand-green-600 font-semibold text-sm">
              <CheckCircle className="w-5 h-5" />
              Procedure complete — refrigerant recovered
            </div>
          )}
        </div>
      </div>

      {/* Key numbers summary */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Type I Recovery Requirements — Memorize These</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl border border-slate-200 p-3">
            <p className="text-xs text-slate-500 font-medium">Active Compressor</p>
            <p className="text-lg font-extrabold text-brand-green-700">90%</p>
            <p className="text-xs text-slate-500">by weight OR 4 in. Hg vacuum</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-3">
            <p className="text-xs text-slate-500 font-medium">Dead Compressor</p>
            <p className="text-lg font-extrabold text-amber-600">80%</p>
            <p className="text-xs text-slate-500">by weight OR 4 in. Hg vacuum</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-3">
            <p className="text-xs text-slate-500 font-medium">System Size</p>
            <p className="text-lg font-extrabold text-brand-blue-700">≤ 5 lbs</p>
            <p className="text-xs text-slate-500">refrigerant charge</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-3">
            <p className="text-xs text-slate-500 font-medium">Cylinder Fill Limit</p>
            <p className="text-lg font-extrabold text-brand-red-600">80%</p>
            <p className="text-xs text-slate-500">of capacity by weight</p>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={reset}
          className="flex items-center gap-2 text-slate-500 text-sm font-semibold hover:text-slate-700 transition-colors"
        >
          <RotateCcw className="w-4 h-4" /> Try another path
        </button>
        {done && onComplete && (
          <button
            onClick={onComplete}
            className="flex-1 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold py-3 rounded-xl transition-colors"
          >
            Type I mastered — Continue →
          </button>
        )}
      </div>
    </div>
  );
}
