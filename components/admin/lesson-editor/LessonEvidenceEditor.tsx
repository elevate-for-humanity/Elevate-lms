'use client';

/**
 * LessonEvidenceEditor
 * Edits: evidence requirement config — enabled, submission modes,
 *        min items, reviewer required, instructions.
 */

import type { EvidenceRequirement } from '@/lib/curriculum/lesson-content-schema';

const SUBMISSION_MODES = ['text', 'file', 'image', 'video', 'audio', 'url'] as const;
type SubmissionMode = typeof SUBMISSION_MODES[number];

const MODE_LABELS: Record<SubmissionMode, string> = {
  text:  'Text response',
  file:  'File upload (PDF, doc)',
  image: 'Image upload',
  video: 'Video upload/link',
  audio: 'Audio recording',
  url:   'External URL',
};

interface Props {
  evidence:  EvidenceRequirement;
  onChange:  (evidence: EvidenceRequirement) => void;
}

export default function LessonEvidenceEditor({ evidence, onChange }: Props) {
  const set = (patch: Partial<EvidenceRequirement>) => onChange({ ...evidence, ...patch });

  const toggleMode = (mode: SubmissionMode) => {
    const current = evidence.submissionModes as SubmissionMode[];
    const next = current.includes(mode)
      ? current.filter(m => m !== mode)
      : [...current, mode];
    set({ submissionModes: next });
  };

  return (
    <div className="space-y-4">
      {/* Enable toggle */}
      <div className="flex items-center gap-3 p-3 bg-teal-50 border border-teal-200 rounded-lg">
        <input
          type="checkbox"
          id="evidence-enabled"
          checked={evidence.enabled}
          onChange={e => set({ enabled: e.target.checked })}
          className="accent-teal-600 w-4 h-4"
        />
        <label htmlFor="evidence-enabled" className="text-sm font-semibold text-teal-800 cursor-pointer">
          Require evidence submission from learner
        </label>
      </div>

      {evidence.enabled && (
        <div className="space-y-4 pl-2 border-l-2 border-teal-200">
          {/* Submission modes */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">
              Allowed Submission Modes <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {SUBMISSION_MODES.map(mode => (
                <label
                  key={mode}
                  className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer text-sm transition ${
                    (evidence.submissionModes as string[]).includes(mode)
                      ? 'border-teal-400 bg-teal-50 text-teal-800'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={(evidence.submissionModes as string[]).includes(mode)}
                    onChange={() => toggleMode(mode)}
                    className="accent-teal-600"
                  />
                  {MODE_LABELS[mode]}
                </label>
              ))}
            </div>
          </div>

          {/* Min items */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Minimum Submissions Required
            </label>
            <input
              type="number"
              min={0}
              value={evidence.minItems}
              onChange={e => set({ minItems: Math.max(0, parseInt(e.target.value) || 0) })}
              className="w-24 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <p className="text-xs text-slate-400 mt-1">0 = at least one submission required (no specific count).</p>
          </div>

          {/* Reviewer required */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="reviewer-required"
              checked={evidence.reviewerRequired}
              onChange={e => set({ reviewerRequired: e.target.checked })}
              className="accent-teal-600 w-4 h-4"
            />
            <label htmlFor="reviewer-required" className="text-sm text-slate-700 cursor-pointer">
              Require evaluator/instructor review before completion
            </label>
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Submission Instructions <span className="text-red-500">*</span>
            </label>
            <textarea
              value={evidence.instructions}
              onChange={e => set({ instructions: e.target.value })}
              rows={4}
              placeholder="Describe exactly what the learner must submit, what format, and what quality standard is expected..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-y"
            />
          </div>
        </div>
      )}
    </div>
  );
}
