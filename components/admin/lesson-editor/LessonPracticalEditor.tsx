'use client';

/**
 * LessonPracticalEditor
 * Edits: practical_requirements row fields — type, hours, attempts,
 *        evaluator approval, skill signoff, safety guidance, materials.
 * Persisted to practical_requirements table via parent save path.
 */

import type { PracticalConfig } from '@/lib/curriculum/lesson-content-schema';
import type { LessonType } from '@/lib/curriculum/lesson-types';
import { PRACTICAL_LESSON_TYPES } from '@/lib/curriculum/lesson-types';
import { Plus, Trash2 } from 'lucide-react';

interface Props {
  lessonType: LessonType;
  practical:  PracticalConfig;
  onChange:   (practical: PracticalConfig) => void;
  /** Full instructions text — stored in practical_requirements.instructions */
  instructions: string;
  onInstructionsChange: (instructions: string) => void;
}

export default function LessonPracticalEditor({
  lessonType, practical, onChange, instructions, onInstructionsChange,
}: Props) {
  const set = (patch: Partial<PracticalConfig>) => onChange({ ...practical, ...patch });

  const addMaterial = () => set({ materialsNeeded: [...practical.materialsNeeded, ''] });
  const updateMaterial = (i: number, val: string) => {
    const next = [...practical.materialsNeeded];
    next[i] = val;
    set({ materialsNeeded: next });
  };
  const removeMaterial = (i: number) =>
    set({ materialsNeeded: practical.materialsNeeded.filter((_, idx) => idx !== i) });

  const isHoursTracked = PRACTICAL_LESSON_TYPES.includes(lessonType);

  return (
    <div className="space-y-4">
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-700">
        <strong>Practical lesson:</strong> configure hours, attempts, approval requirements, and materials.
        Instructions are required for publish.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Required hours */}
        {isHoursTracked && (
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Required Hours
            </label>
            <input
              type="number"
              min={0}
              step={0.5}
              value={practical.requiredHours}
              onChange={e => set({ requiredHours: parseFloat(e.target.value) || 0 })}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-xs text-slate-400 mt-1">0 = no minimum hours required.</p>
          </div>
        )}

        {/* Required attempts */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Required Approved Attempts
          </label>
          <input
            type="number"
            min={0}
            value={practical.requiredAttempts}
            onChange={e => set({ requiredAttempts: parseInt(e.target.value) || 0 })}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <p className="text-xs text-slate-400 mt-1">0 = no minimum attempts required.</p>
        </div>
      </div>

      {/* Approval toggles */}
      <div className="space-y-2">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={practical.requiresEvaluatorApproval}
            onChange={e => set({ requiresEvaluatorApproval: e.target.checked })}
            className="accent-emerald-600 w-4 h-4"
          />
          <span className="text-sm text-slate-700">
            Requires evaluator/instructor approval before completion
          </span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={practical.requiresSkillSignoff}
            onChange={e => set({ requiresSkillSignoff: e.target.checked })}
            className="accent-emerald-600 w-4 h-4"
          />
          <span className="text-sm text-slate-700">
            Requires skill signoff (evaluator must sign off each skill)
          </span>
        </label>
      </div>

      {/* Instructions */}
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">
          Activity Instructions <span className="text-red-500">*</span>
        </label>
        <textarea
          value={instructions}
          onChange={e => onInstructionsChange(e.target.value)}
          rows={5}
          placeholder="Step-by-step instructions for the learner. What to do, how to do it, what to submit as evidence..."
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-y"
        />
      </div>

      {/* Safety guidance */}
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">Safety Guidance</label>
        <textarea
          value={practical.safetyGuidance}
          onChange={e => set({ safetyGuidance: e.target.value })}
          rows={3}
          placeholder="Any safety precautions, PPE requirements, or hazard warnings..."
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-y"
        />
      </div>

      {/* Materials needed */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-semibold text-slate-600">Materials / Equipment Needed</label>
          <button
            type="button"
            onClick={addMaterial}
            className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 px-2 py-1 rounded border border-emerald-200 hover:bg-emerald-50"
          >
            <Plus className="w-3 h-3" /> Add Item
          </button>
        </div>
        {practical.materialsNeeded.length === 0 && (
          <p className="text-xs text-slate-400 italic">No materials listed.</p>
        )}
        <div className="space-y-2">
          {practical.materialsNeeded.map((mat, i) => (
            <div key={i} className="flex items-center gap-2 group">
              <span className="text-xs text-slate-400 w-4">{i + 1}.</span>
              <input
                type="text"
                value={mat}
                onChange={e => updateMaterial(i, e.target.value)}
                placeholder="e.g. Stethoscope, gloves, patient chart..."
                className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={() => removeMaterial(i)}
                className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
