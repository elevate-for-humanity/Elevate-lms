'use client';

import BuilderSection from './BuilderSection';
import type { ProgramBuilderState } from './types';

const CATEGORIES = [
  'Skilled Trades',
  'Healthcare',
  'Technology',
  'Business & Finance',
  'Transportation & Logistics',
  'Construction',
  'Manufacturing',
  'Professional Development',
  'Other',
];

interface Props {
  state: ProgramBuilderState;
  onChange: (patch: Partial<ProgramBuilderState>) => void;
}

export default function ProgramIdentitySection({ state, onChange }: Props) {
  return (
    <BuilderSection
      title="Program Identity"
      description="The title, category, and description shown to learners and funding reviewers."
      required
    >
      <div className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Program Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={state.title}
            onChange={e => onChange({ title: e.target.value })}
            placeholder="e.g. HVAC Technician Certification"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-blue-500 focus:outline-none focus:ring-2 focus:ring-brand-blue-500/20"
          />
        </div>

        {/* Subtitle */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Subtitle</label>
          <input
            type="text"
            value={state.subtitle}
            onChange={e => onChange({ subtitle: e.target.value })}
            placeholder="e.g. EPA 608 Certification Prep — Workforce-Ready in 12 Weeks"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-blue-500 focus:outline-none focus:ring-2 focus:ring-brand-blue-500/20"
          />
        </div>

        {/* Slug + Category row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              URL Slug <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center rounded-lg border border-slate-300 overflow-hidden focus-within:border-brand-blue-500 focus-within:ring-2 focus-within:ring-brand-blue-500/20">
              <span className="bg-slate-50 px-3 py-2 text-xs text-slate-400 border-r border-slate-300 select-none">/programs/</span>
              <input
                type="text"
                value={state.slug}
                onChange={e => onChange({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                placeholder="hvac-technician"
                className="flex-1 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={state.category}
              onChange={e => onChange({ category: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-blue-500 focus:outline-none focus:ring-2 focus:ring-brand-blue-500/20 bg-white"
            >
              <option value="">Select category…</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Program Description <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={4}
            value={state.description}
            onChange={e => onChange({ description: e.target.value })}
            placeholder="Describe what this program prepares learners for, who it's designed for, and what makes it workforce-ready. This appears on the public program page and in funding applications."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-blue-500 focus:outline-none focus:ring-2 focus:ring-brand-blue-500/20 resize-none"
          />
          <p className="mt-1 text-xs text-slate-400">{state.description.length} characters — aim for 150–400</p>
        </div>

        {/* Hero image URL */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Hero Image URL <span className="text-red-500">*</span>
          </label>
          <input
            type="url"
            value={state.hero_image_url || ''}
            onChange={e => onChange({ hero_image_url: e.target.value || null })}
            placeholder="https://…"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-blue-500 focus:outline-none focus:ring-2 focus:ring-brand-blue-500/20"
          />
          {state.hero_image_url && (
            <div className="mt-2 h-24 w-full overflow-hidden rounded-lg border border-slate-200">
              <img src={state.hero_image_url} alt="Hero preview" className="h-full w-full object-cover" />
            </div>
          )}
        </div>
      </div>
    </BuilderSection>
  );
}
