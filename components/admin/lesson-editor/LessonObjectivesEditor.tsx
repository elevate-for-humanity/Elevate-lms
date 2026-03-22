'use client';

/**
 * LessonObjectivesEditor
 * Edits: learning objectives (ordered list, add/remove/reorder).
 * Persists to lesson_objectives table via parent save path.
 */

import { useState } from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';

interface Props {
  objectives: string[];
  onChange: (objectives: string[]) => void;
}

export default function LessonObjectivesEditor({ objectives, onChange }: Props) {
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const add = () => onChange([...objectives, '']);

  const update = (i: number, val: string) => {
    const next = [...objectives];
    next[i] = val;
    onChange(next);
  };

  const remove = (i: number) => onChange(objectives.filter((_, idx) => idx !== i));

  const moveUp = (i: number) => {
    if (i === 0) return;
    const next = [...objectives];
    [next[i - 1], next[i]] = [next[i], next[i - 1]];
    onChange(next);
  };

  const moveDown = (i: number) => {
    if (i === objectives.length - 1) return;
    const next = [...objectives];
    [next[i], next[i + 1]] = [next[i + 1], next[i]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">
          At least one objective is required for publish. Use action verbs (e.g. "Identify", "Demonstrate", "Apply").
        </p>
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-1 text-xs font-semibold text-brand-blue-600 hover:text-brand-blue-700 px-2 py-1 rounded border border-brand-blue-200 hover:bg-brand-blue-50"
        >
          <Plus className="w-3 h-3" /> Add Objective
        </button>
      </div>

      {objectives.length === 0 && (
        <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-lg">
          <p className="text-sm text-slate-400">No objectives yet. Add at least one.</p>
        </div>
      )}

      <div className="space-y-2">
        {objectives.map((obj, i) => (
          <div key={i} className="flex items-center gap-2 group">
            <div className="flex flex-col gap-0.5">
              <button
                type="button"
                onClick={() => moveUp(i)}
                disabled={i === 0}
                className="text-slate-300 hover:text-slate-500 disabled:opacity-20 text-xs leading-none"
                title="Move up"
              >▲</button>
              <button
                type="button"
                onClick={() => moveDown(i)}
                disabled={i === objectives.length - 1}
                className="text-slate-300 hover:text-slate-500 disabled:opacity-20 text-xs leading-none"
                title="Move down"
              >▼</button>
            </div>
            <span className="text-xs font-mono text-slate-400 w-5 text-right flex-shrink-0">{i + 1}.</span>
            <input
              type="text"
              value={obj}
              onChange={e => update(i, e.target.value)}
              placeholder={`Objective ${i + 1} — e.g. "Identify the three phases of..."`}
              className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Remove objective"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
