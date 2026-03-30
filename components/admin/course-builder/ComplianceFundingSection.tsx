'use client';

import { Shield, CheckCircle } from 'lucide-react';
import BuilderSection from './BuilderSection';
import type { ProgramBuilderState } from './types';

interface Props {
  state: ProgramBuilderState;
  onChange: (patch: Partial<ProgramBuilderState>) => void;
}

const TOGGLE_FIELDS: {
  key: keyof Pick<ProgramBuilderState, 'wioa_approved' | 'dol_registered' | 'etpl_listed'>;
  label: string;
  description: string;
  badge: string;
}[] = [
  {
    key: 'wioa_approved',
    label: 'WIOA Eligible',
    description: 'Program qualifies for Workforce Innovation and Opportunity Act funding. Learners may use Individual Training Accounts (ITAs).',
    badge: 'WIOA',
  },
  {
    key: 'dol_registered',
    label: 'DOL Registered',
    description: 'Program is registered with the Department of Labor. Required for apprenticeship and certain grant-funded tracks.',
    badge: 'DOL',
  },
  {
    key: 'etpl_listed',
    label: 'ETPL Listed',
    description: 'Program appears on the Eligible Training Provider List. Required for WIOA-funded enrollment in most states.',
    badge: 'ETPL',
  },
];

export default function ComplianceFundingSection({ state, onChange }: Props) {
  const activeCount = TOGGLE_FIELDS.filter(f => state[f.key]).length;

  return (
    <BuilderSection
      title="Compliance & Funding Eligibility"
      description="Workforce funding designations. These determine which learners can enroll using public funding and which grants this program qualifies for."
    >
      <div className="space-y-4">
        {/* Status summary */}
        <div className={`flex items-center gap-3 rounded-xl px-4 py-3 ${activeCount > 0 ? 'bg-emerald-50 border border-emerald-200' : 'bg-slate-50 border border-slate-200'}`}>
          <Shield className={`h-5 w-5 flex-shrink-0 ${activeCount > 0 ? 'text-emerald-600' : 'text-slate-400'}`} />
          <div>
            <p className={`text-sm font-semibold ${activeCount > 0 ? 'text-emerald-800' : 'text-slate-600'}`}>
              {activeCount > 0
                ? `Eligible for ${activeCount} workforce funding program${activeCount > 1 ? 's' : ''}`
                : 'No funding designations set'}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {activeCount > 0
                ? 'Learners may be able to enroll using WIOA, DOL, or state workforce funds.'
                : 'Set eligibility below to unlock workforce funding for enrolled learners.'}
            </p>
          </div>
          {activeCount > 0 && (
            <div className="ml-auto flex gap-1.5">
              {TOGGLE_FIELDS.filter(f => state[f.key]).map(f => (
                <span key={f.key} className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                  {f.badge}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Toggle rows */}
        {TOGGLE_FIELDS.map(field => (
          <div
            key={field.key}
            className={`flex items-start gap-4 rounded-xl border px-4 py-4 cursor-pointer transition-colors ${
              state[field.key] ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-200 hover:border-slate-300'
            }`}
            onClick={() => onChange({ [field.key]: !state[field.key] })}
          >
            <div className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
              state[field.key] ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'
            }`}>
              {state[field.key] && <CheckCircle className="h-3.5 w-3.5 text-white fill-white" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-slate-900">{field.label}</p>
                <span className={`rounded px-1.5 py-0.5 text-xs font-bold ${
                  state[field.key] ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {field.badge}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{field.description}</p>
            </div>
          </div>
        ))}

        {/* Internal notes */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Internal Compliance Notes</label>
          <textarea
            rows={3}
            placeholder="State approval status, grant cycle notes, ETPL application date, DOL registration number…"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-blue-500 focus:outline-none focus:ring-2 focus:ring-brand-blue-500/20 resize-none"
          />
          <p className="mt-1 text-xs text-slate-400">Not shown publicly. Used for internal audit trail.</p>
        </div>
      </div>
    </BuilderSection>
  );
}
