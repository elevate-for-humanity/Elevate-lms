'use client';

import { useState } from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import BuilderSection from './BuilderSection';
import type { ProgramBuilderState, ProgramOutcome } from './types';

interface Props {
  state: ProgramBuilderState;
  onChange: (patch: Partial<ProgramBuilderState>) => void;
}

export default function ProgramOutcomesSection({ state, onChange }: Props) {
  const [draft, setDraft] = useState('');

  const outcomes = state.outcomes;
  const belowMinimum = outcomes.length < 3;

  const addOutcome = () => {
    const text = draft.trim();
    if (!text) return;
    const next: ProgramOutcome = {
      id: crypto.randomUUID(),
      text,
      outcome_order: outcomes.length,
    };
    onChange({ outcomes: [...outcomes, next] });
    setDraft('');
  };

  const removeOutcome = (id: string) => {
    onChange({
      outcomes: outcomes
        .filter(o => o.id !== id)
        .map((o, i) => ({ ...o, outcome_order: i })),
    });
  };

  const updateOutcome = (id: string, text: string) => {
    onChange({ outcomes: outcomes.map(o => o.id === id ? { ...o, text } : o) });
  };

  return (
    <BuilderSection
      title="Learning Outcomes"
      description="What learners will be able to do after completing this program. Required for WIOA and DOL funding eligibility."
      required
      warning={
        belowMinimum
          ? `Programs without at least 3 defined outcomes will not qualify for workforce funding and will not convert on the public page. Add ${3 - outcomes.length} more.`
          : undefined
      }
    >
      <div className="space-y-3">
        {outcomes.length === 0 && (
          <p className="text-sm text-slate-400 italic">No outcomes yet. Add at least 3.</p>
        )}

        {outcomes.map((outcome, idx) => (
          <div key={outcome.id} className="flex items-start gap-2 group">
            <GripVertical className="mt-2.5 h-4 w-4 flex-shrink-0 text-slate-300 cursor-grab" />
            <span className="mt-2 flex-shrink-0 text-xs font-medium text-slate-400 w-5 text-right">{idx + 1}.</span>
            <input
              type="text"
              value={outcome.text}
              onChange={e => updateOutcome(outcome.id, e.target.value)}
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-brand-blue-500 focus:outline-none focus:ring-2 focus:ring-brand-blue-500/20"
              placeholder="e.g. Diagnose and repair HVAC refrigerant systems"
            />
            <button
              onClick={() => removeOutcome(outcome.id)}
              className="mt-2 p-1 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
              title="Remove outcome"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}

        {/* Add row */}
        <div className="flex items-center gap-2 pt-1">
          <div className="w-4 flex-shrink-0" />
          <span className="flex-shrink-0 text-xs font-medium text-slate-300 w-5 text-right">{outcomes.length + 1}.</span>
          <input
            type="text"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addOutcome(); } }}
            placeholder="Add an outcome and press Enter…"
            className="flex-1 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-blue-500 focus:outline-none focus:ring-2 focus:ring-brand-blue-500/20"
          />
          <button
            onClick={addOutcome}
            disabled={!draft.trim()}
            className="flex items-center gap-1 rounded-lg bg-brand-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-blue-700 disabled:opacity-40 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-2 pt-2">
          {(['dot-0', 'dot-1', 'dot-2'] as const).map((dotKey, i) => (
            <div
              key={dotKey}
              className={`h-1.5 flex-1 rounded-full transition-colors ${outcomes.length > i ? 'bg-emerald-500' : 'bg-slate-200'}`}
            />
          ))}
          <span className="text-xs text-slate-400 ml-1">
            {outcomes.length >= 3 ? '3+ outcomes — minimum met' : `${outcomes.length}/3 minimum`}
          </span>
        </div>
      </div>
    </BuilderSection>
  );
}
