'use client';

import { AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import BuilderSection from './BuilderSection';
import type { ProgramBuilderState } from './types';

export interface StandardOverrideState {
  acknowledged: boolean;
  note: string;
}

interface Props {
  state: ProgramBuilderState;
  override: StandardOverrideState;
  onOverrideChange: (next: StandardOverrideState) => void;
}

interface StandardItem {
  label: string;
  satisfied: boolean;
  detail: string;
  /** Heading text of the section where this item is fixed. */
  fixSection: string;
}

function scrollToSection(title: string) {
  const headings = Array.from(document.querySelectorAll('h2, h3'));
  const target = headings.find((h) => h.textContent?.trim().startsWith(title));
  target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

const ALIGNMENT_SECTION = 'Compliance & Funding Eligibility';

function standardItems(state: ProgramBuilderState): StandardItem[] {
  const tuitionOk =
    state.tuition_is_free === true ||
    (typeof state.tuition_cost_dollars === 'number' && state.tuition_cost_dollars > 0);
  return [
    {
      label: 'Governing body',
      satisfied: Boolean(state.governing_body?.trim()),
      detail: state.governing_body?.trim() || 'Not set',
      fixSection: ALIGNMENT_SECTION,
    },
    {
      label: 'Governing standard / version',
      satisfied: Boolean(state.governing_standard_version?.trim()),
      detail: state.governing_standard_version?.trim() || 'Not set',
      fixSection: ALIGNMENT_SECTION,
    },
    {
      label: 'Compliance profile',
      satisfied: Boolean(state.compliance_profile_key),
      detail: state.compliance_profile_key || 'Not selected',
      fixSection: ALIGNMENT_SECTION,
    },
    {
      label: 'Credential',
      satisfied: state.credentials.length > 0,
      detail:
        state.credentials.length > 0
          ? state.credentials.map((c) => c.credential_name || 'Credential').join(', ')
          : 'No credential added',
      fixSection: 'Certifications',
    },
    {
      label: 'Tuition / fee',
      satisfied: tuitionOk,
      detail: state.tuition_is_free
        ? 'Explicitly free'
        : state.tuition_cost_dollars
          ? `$${state.tuition_cost_dollars}`
          : 'Not set',
      fixSection: ALIGNMENT_SECTION,
    },
    {
      label: 'SOC code (O*NET)',
      satisfied: Boolean(state.soc_code?.trim()),
      detail: state.soc_code?.trim() || 'Not set',
      fixSection: ALIGNMENT_SECTION,
    },
    {
      label: 'CIP code',
      satisfied: Boolean(state.cip_code?.trim()),
      detail: state.cip_code?.trim() || 'Not set',
      fixSection: ALIGNMENT_SECTION,
    },
    {
      label: 'Workbook attached',
      satisfied: Boolean(state.workbook_id),
      detail: state.workbook_id ? `Workbook ${state.workbook_id}` : 'No workbook attached',
      fixSection: ALIGNMENT_SECTION,
    },
  ];
}

/**
 * The build standard, shown where the author works: every item is either
 * checked or one click from its fix. The checklist guides — it never
 * dead-ends: the owner can acknowledge the gaps and publish anyway, and
 * the acknowledged gaps are recorded and routed to PARIS as repair items
 * at publish instead of being buried.
 */
export default function PublishStandardSection({ state, override, onOverrideChange }: Props) {
  const items = standardItems(state);
  const missing = items.filter((item) => !item.satisfied);

  return (
    <BuilderSection
      title="Publish Checklist — Build Standard"
      description="Industry alignment, workbook, and required-work standard for every course. Drafts save freely; these items are required at publish."
    >
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.label}
            className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${
              item.satisfied ? 'border-emerald-200 bg-emerald-50/50' : 'border-amber-200 bg-amber-50/60'
            }`}
          >
            {item.satisfied ? (
              <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-500" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800">{item.label}</p>
              <p className="text-xs text-slate-500 truncate">{item.detail}</p>
            </div>
            {!item.satisfied && (
              <button
                type="button"
                onClick={() => scrollToSection(item.fixSection)}
                className="flex items-center gap-1 rounded-md border border-amber-300 bg-white px-2 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-50"
              >
                Fix <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}

        {state.hands_on_trade && (
          <p className="text-xs text-slate-500 px-1 pt-1">
            Machine/equipment trade: at publish, at least one lesson must carry a simulation
            activity (attached in the course template&apos;s lesson activities). Lesson-level
            required work — a required activity or assignment on every lesson — is validated from
            the course template at publish as well.
          </p>
        )}

        {missing.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 space-y-2 mt-3">
            <p className="text-sm font-semibold text-slate-800">Owner override</p>
            <p className="text-xs text-slate-500">
              You can always publish anyway. The gaps above are recorded in an audit note and
              handed to PARIS as repair items to resolve — publishing is never a dead end.
            </p>
            <label className="flex items-start gap-2 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={override.acknowledged}
                onChange={(e) => onOverrideChange({ ...override, acknowledged: e.target.checked })}
                className="mt-0.5 h-4 w-4 rounded border-slate-300"
              />
              I acknowledge {missing.length} item{missing.length > 1 ? 's are' : ' is'} missing and
              want to publish anyway.
            </label>
            <textarea
              rows={2}
              value={override.note}
              onChange={(e) => onOverrideChange({ ...override, note: e.target.value })}
              placeholder="Override note (recorded with the audit note)…"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-blue-500 focus:outline-none focus:ring-2 focus:ring-brand-blue-500/20 resize-none"
            />
          </div>
        )}
      </div>
    </BuilderSection>
  );
}
