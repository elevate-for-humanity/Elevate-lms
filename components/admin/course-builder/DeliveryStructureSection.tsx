'use client';

import BuilderSection from './BuilderSection';
import type { ProgramBuilderState, DeliveryMode } from './types';

const DELIVERY_OPTIONS: { value: DeliveryMode; label: string; description: string }[] = [
  { value: 'in_person', label: 'In-Person',  description: 'Instructor-led, on-site training' },
  { value: 'hybrid',    label: 'Hybrid',     description: 'Mix of in-person and online sessions' },
  { value: 'online',    label: 'Online',     description: 'Fully remote, self-paced or live virtual' },
];

interface Props {
  state: ProgramBuilderState;
  onChange: (patch: Partial<ProgramBuilderState>) => void;
}

export default function DeliveryStructureSection({ state, onChange }: Props) {
  const totalLessons = state.phases.reduce(
    (n, p) => n + p.modules.reduce((m, mod) => m + mod.lessons.length, 0), 0
  );
  const estimatedMinutes = state.phases.reduce(
    (n, p) => n + p.modules.reduce(
      (m, mod) => m + mod.lessons.reduce((l, les) => l + (les.duration_minutes ?? 0), 0), 0
    ), 0
  );
  const derivedHours = estimatedMinutes > 0 ? Math.round(estimatedMinutes / 60) : null;

  return (
    <BuilderSection
      title="Delivery & Duration"
      description="How and how long this program runs. Shown on the public page and used in funding applications."
      required
    >
      <div className="space-y-5">
        {/* Delivery mode */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Delivery Mode <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {DELIVERY_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange({ delivery_method: opt.value })}
                className={`rounded-xl border-2 px-4 py-3 text-left transition-colors ${
                  state.delivery_method === opt.value
                    ? 'border-brand-blue-500 bg-brand-blue-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <p className={`text-sm font-semibold ${state.delivery_method === opt.value ? 'text-brand-blue-700' : 'text-slate-900'}`}>
                  {opt.label}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{opt.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Duration row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Duration (weeks) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              value={state.estimated_weeks ?? ''}
              onChange={e => onChange({ estimated_weeks: e.target.value ? Number(e.target.value) : null })}
              placeholder="e.g. 12"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-blue-500 focus:outline-none focus:ring-2 focus:ring-brand-blue-500/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Total Hours
              {derivedHours && (
                <span className="ml-2 text-xs font-normal text-slate-400">
                  (estimated {derivedHours}h from lesson durations)
                </span>
              )}
            </label>
            <input
              type="number"
              min={1}
              value={state.estimated_hours ?? ''}
              onChange={e => onChange({ estimated_hours: e.target.value ? Number(e.target.value) : null })}
              placeholder={derivedHours ? String(derivedHours) : 'e.g. 120'}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-blue-500 focus:outline-none focus:ring-2 focus:ring-brand-blue-500/20"
            />
          </div>
        </div>

        {/* Live summary */}
        {(state.estimated_weeks || state.estimated_hours || totalLessons > 0) && (
          <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-600">
            <span className="font-medium text-slate-900">Learner-facing summary: </span>
            {[
              state.estimated_weeks && `${state.estimated_weeks}-week program`,
              state.estimated_hours && `${state.estimated_hours} hours`,
              totalLessons > 0 && `${totalLessons} lessons`,
              state.delivery_method && DELIVERY_OPTIONS.find(o => o.value === state.delivery_method)?.label,
            ].filter(Boolean).join(' · ')}
          </div>
        )}
      </div>
    </BuilderSection>
  );
}
