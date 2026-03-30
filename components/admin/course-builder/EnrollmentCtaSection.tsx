'use client';

import { useState } from 'react';
import { Plus, Trash2, ExternalLink } from 'lucide-react';
import BuilderSection from './BuilderSection';
import type { ProgramBuilderState, ProgramCta, CtaType, ProgramTrack, FundingType } from './types';

const CTA_TYPES: { value: CtaType; label: string }[] = [
  { value: 'apply',        label: 'Apply Now' },
  { value: 'request_info', label: 'Request Info' },
  { value: 'waitlist',     label: 'Join Waitlist' },
  { value: 'external',     label: 'External Link' },
];

const FUNDING_TYPES: { value: FundingType; label: string }[] = [
  { value: 'funded',             label: 'Workforce Funded (WIOA/DOL)' },
  { value: 'self_pay',           label: 'Self-Pay' },
  { value: 'employer_sponsored', label: 'Employer Sponsored' },
  { value: 'partner',            label: 'Partner Funded' },
  { value: 'other',              label: 'Other' },
];

interface Props {
  state: ProgramBuilderState;
  onChange: (patch: Partial<ProgramBuilderState>) => void;
}

export default function EnrollmentCtaSection({ state, onChange }: Props) {
  const [ctaDraft, setCtaDraft] = useState<Partial<ProgramCta>>({ cta_type: 'apply', label: '', href: '', style_variant: 'primary' });
  const [trackDraft, setTrackDraft] = useState<Partial<ProgramTrack>>({ funding_type: 'funded', title: '', track_code: '', available: true });

  const addCta = () => {
    if (!ctaDraft.label?.trim() || !ctaDraft.href?.trim()) return;
    const next: ProgramCta = {
      id: crypto.randomUUID(),
      cta_type: ctaDraft.cta_type as CtaType,
      label: ctaDraft.label.trim(),
      href: ctaDraft.href.trim(),
      style_variant: ctaDraft.style_variant as ProgramCta['style_variant'],
      sort_order: state.ctas.length,
    };
    onChange({ ctas: [...state.ctas, next] });
    setCtaDraft({ cta_type: 'apply', label: '', href: '', style_variant: 'primary' });
  };

  const removeCta = (id: string) => onChange({ ctas: state.ctas.filter(c => c.id !== id) });

  const addTrack = () => {
    if (!trackDraft.title?.trim() || !trackDraft.track_code?.trim()) return;
    const next: ProgramTrack = {
      id: crypto.randomUUID(),
      track_code: trackDraft.track_code!.trim(),
      title: trackDraft.title!.trim(),
      funding_type: trackDraft.funding_type as FundingType,
      cost_cents: trackDraft.cost_cents ?? null,
      available: trackDraft.available ?? true,
      sort_order: state.tracks.length,
    };
    onChange({ tracks: [...state.tracks, next] });
    setTrackDraft({ funding_type: 'funded', title: '', track_code: '', available: true });
  };

  const removeTrack = (id: string) => onChange({ tracks: state.tracks.filter(t => t.id !== id) });

  return (
    <BuilderSection
      title="Enrollment & CTA"
      description="How learners apply or enroll. At least one CTA is required before publishing."
      required
      warning={state.ctas.length === 0 ? 'No CTA set. Learners cannot enroll without a call-to-action.' : undefined}
    >
      <div className="space-y-6">

        {/* ── CTAs ── */}
        <div>
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Calls to Action</h3>

          {state.ctas.length > 0 && (
            <div className="space-y-2 mb-3">
              {state.ctas.map((cta, idx) => (
                <div key={cta.id} className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2.5">
                  {idx === 0 && (
                    <span className="flex-shrink-0 rounded bg-brand-blue-100 px-1.5 py-0.5 text-xs font-medium text-brand-blue-700">Primary</span>
                  )}
                  <span className="flex-1 text-sm font-medium text-slate-900">{cta.label}</span>
                  <span className="text-xs text-slate-400 truncate max-w-[160px]">{cta.href}</span>
                  <span className="text-xs text-slate-400">{CTA_TYPES.find(t => t.value === cta.cta_type)?.label}</span>
                  <button onClick={() => removeCta(cta.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add CTA form */}
          <div className="rounded-xl border border-dashed border-slate-200 p-4 space-y-3">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Add CTA</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-600 mb-1">Button Label</label>
                <input
                  type="text"
                  value={ctaDraft.label ?? ''}
                  onChange={e => setCtaDraft(d => ({ ...d, label: e.target.value }))}
                  placeholder="Apply Now"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue-500 focus:outline-none focus:ring-2 focus:ring-brand-blue-500/20"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Type</label>
                <select
                  value={ctaDraft.cta_type}
                  onChange={e => setCtaDraft(d => ({ ...d, cta_type: e.target.value as CtaType }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:border-brand-blue-500 focus:outline-none focus:ring-2 focus:ring-brand-blue-500/20"
                >
                  {CTA_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1">Destination URL or Path</label>
              <input
                type="text"
                value={ctaDraft.href ?? ''}
                onChange={e => setCtaDraft(d => ({ ...d, href: e.target.value }))}
                placeholder="/apply or https://…"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue-500 focus:outline-none focus:ring-2 focus:ring-brand-blue-500/20"
              />
            </div>
            <button
              onClick={addCta}
              disabled={!ctaDraft.label?.trim() || !ctaDraft.href?.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-brand-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-blue-700 disabled:opacity-40 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add CTA
            </button>
          </div>
        </div>

        {/* ── Enrollment Tracks ── */}
        <div>
          <h3 className="text-sm font-semibold text-slate-800 mb-1">Enrollment Tracks</h3>
          <p className="text-xs text-slate-500 mb-3">Define how learners pay or get funded. Each track appears as an enrollment option.</p>

          {state.tracks.length > 0 && (
            <div className="space-y-2 mb-3">
              {state.tracks.map(track => (
                <div key={track.id} className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2.5">
                  <span className="flex-1 text-sm font-medium text-slate-900">{track.title}</span>
                  <span className="text-xs text-slate-400">{FUNDING_TYPES.find(f => f.value === track.funding_type)?.label}</span>
                  {track.cost_cents != null && (
                    <span className="text-xs text-slate-500">${(track.cost_cents / 100).toFixed(0)}</span>
                  )}
                  <span className={`text-xs font-medium ${track.available ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {track.available ? 'Open' : 'Closed'}
                  </span>
                  <button onClick={() => removeTrack(track.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="rounded-xl border border-dashed border-slate-200 p-4 space-y-3">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Add Track</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-600 mb-1">Track Name</label>
                <input
                  type="text"
                  value={trackDraft.title ?? ''}
                  onChange={e => setTrackDraft(d => ({ ...d, title: e.target.value }))}
                  placeholder="WIOA Funded"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue-500 focus:outline-none focus:ring-2 focus:ring-brand-blue-500/20"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Track Code</label>
                <input
                  type="text"
                  value={trackDraft.track_code ?? ''}
                  onChange={e => setTrackDraft(d => ({ ...d, track_code: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                  placeholder="wioa-funded"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue-500 focus:outline-none focus:ring-2 focus:ring-brand-blue-500/20"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-600 mb-1">Funding Type</label>
                <select
                  value={trackDraft.funding_type}
                  onChange={e => setTrackDraft(d => ({ ...d, funding_type: e.target.value as FundingType }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:border-brand-blue-500 focus:outline-none focus:ring-2 focus:ring-brand-blue-500/20"
                >
                  {FUNDING_TYPES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Cost (leave blank if funded)</label>
                <input
                  type="number"
                  min={0}
                  value={trackDraft.cost_cents != null ? trackDraft.cost_cents / 100 : ''}
                  onChange={e => setTrackDraft(d => ({ ...d, cost_cents: e.target.value ? Math.round(Number(e.target.value) * 100) : undefined }))}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue-500 focus:outline-none focus:ring-2 focus:ring-brand-blue-500/20"
                />
              </div>
            </div>
            <button
              onClick={addTrack}
              disabled={!trackDraft.title?.trim() || !trackDraft.track_code?.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-brand-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-blue-700 disabled:opacity-40 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Track
            </button>
          </div>
        </div>
      </div>
    </BuilderSection>
  );
}
