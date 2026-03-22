'use client';

/**
 * LessonRubricEditor
 * Edits: rubric criteria — add/remove/edit key, label, description, points, required.
 * Required for practical lessons that have requires_evaluator_approval = true.
 */

import { Plus, Trash2 } from 'lucide-react';
import type { RubricCriterion } from '@/lib/curriculum/lesson-content-schema';

interface Props {
  rubric:   RubricCriterion[];
  onChange: (rubric: RubricCriterion[]) => void;
}

function emptyCriterion(): RubricCriterion {
  return {
    key:         `criterion-${Date.now()}`,
    label:       '',
    description: '',
    points:      10,
    required:    true,
  };
}

export default function LessonRubricEditor({ rubric, onChange }: Props) {
  const add = () => onChange([...rubric, emptyCriterion()]);
  const remove = (key: string) => onChange(rubric.filter(c => c.key !== key));
  const update = (key: string, patch: Partial<RubricCriterion>) =>
    onChange(rubric.map(c => c.key === key ? { ...c, ...patch } : c));

  const totalPoints = rubric.reduce((sum, c) => sum + c.points, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500">
            Define grading criteria. Required when evaluator approval is enabled.
          </p>
          {rubric.length > 0 && (
            <p className="text-xs font-semibold text-slate-600 mt-0.5">
              Total: {totalPoints} points across {rubric.length} criteria
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-700 px-2 py-1 rounded border border-purple-200 hover:bg-purple-50"
        >
          <Plus className="w-3 h-3" /> Add Criterion
        </button>
      </div>

      {rubric.length === 0 && (
        <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-lg">
          <p className="text-sm text-slate-400">No rubric criteria. Add at least one if evaluator approval is required.</p>
        </div>
      )}

      <div className="space-y-3">
        {rubric.map((criterion, i) => (
          <div key={criterion.key} className="border border-slate-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Criterion {i + 1}</span>
              <button
                type="button"
                onClick={() => remove(criterion.key)}
                className="text-slate-300 hover:text-red-500"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Label */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Label *</label>
                <input
                  type="text"
                  value={criterion.label}
                  onChange={e => update(criterion.key, { label: e.target.value })}
                  placeholder="e.g. Safety Protocol"
                  className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Points */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Points *</label>
                <input
                  type="number"
                  min={0}
                  value={criterion.points}
                  onChange={e => update(criterion.key, { points: Math.max(0, parseInt(e.target.value) || 0) })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Required */}
              <div className="flex items-end pb-1.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={criterion.required}
                    onChange={e => update(criterion.key, { required: e.target.checked })}
                    className="accent-purple-600 w-4 h-4"
                  />
                  <span className="text-sm text-slate-700">Required to pass</span>
                </label>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Description *</label>
              <textarea
                value={criterion.description}
                onChange={e => update(criterion.key, { description: e.target.value })}
                rows={2}
                placeholder="Describe what the evaluator should look for to award full points..."
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
