'use client';

import Link from 'next/link';
import { ChevronLeft, Loader2, Save } from 'lucide-react';
import type { Section188ChecklistData } from '@/lib/compliance/wioa-etpl-forms';
import { FORM_LABELS } from '@/lib/compliance/wioa-etpl-forms';
import { ADMIN_WIOA_COMPLIANCE } from '@/lib/compliance/wioa-etpl-routes';
import { useWioaEtplProgramForm } from './useWioaEtplProgramForm';
import { WioaEtplFormAlerts } from './WioaEtplFormAlerts';
import { WioaFormField, wioaFormInputClass } from './WioaEtplFormFields';

const CHECKLIST_ITEMS = [
  ['eo_officer_designated', 'State / local EO officer designated for this program'],
  ['notice_and_communication', 'Required EO notices and communications in place'],
  ['assurance_language', 'Assurance language executed (grant / partner agreements)'],
  ['affirmative_outreach', 'Affirmative outreach to protected populations'],
  ['ada_physical_access', 'Training facility meets ADA physical access standards'],
  ['ada_programmatic_access', 'Programmatic access provided (materials, instruction)'],
  ['reasonable_accommodation_procedure', 'Reasonable accommodation request procedure documented'],
  ['data_collection_equity', 'Equity-related data collection per Part 38'],
  ['monitoring_recipients', 'Monitoring schedule for recipient compliance'],
  ['complaint_processing_posted', 'Complaint procedures posted and accessible'],
  ['complaint_processing_29cfr38', 'Complaint processing meets 29 CFR Part 38 requirements'],
  ['corrective_actions_documented', 'Corrective action / sanction procedures documented'],
  ['part_38_acknowledgment', '29 CFR Part 38 Final Rule acknowledged'],
  ['facility_ada_compliant', 'Facility and program verified ADA compliant'],
  ['nondiscriminatory_delivery_attestation', 'Program delivered in a nondiscriminatory manner (WIOA §188)'],
] as const;

export function WioaSection188AdminForm({ programId }: { programId: string }) {
  const {
    loading,
    saving,
    error,
    success,
    program,
    section188,
    setSection188,
    section188Status,
    save,
  } = useWioaEtplProgramForm(programId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading…
      </div>
    );
  }

  if (!program) {
    return <p className="text-red-700">Program not found.</p>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link
        href={ADMIN_WIOA_COMPLIANCE.programHub(programId)}
        className="inline-flex items-center text-sm text-slate-600 hover:text-brand-blue-700 mb-6"
      >
        <ChevronLeft className="w-4 h-4" /> Back to program compliance
      </Link>

      <h1 className="text-2xl font-bold text-slate-900 mb-1">{FORM_LABELS.section_188_checklist}</h1>
      <p className="text-slate-600 mb-2">{program.title}</p>
      <p className="text-xs text-slate-500 mb-6">
        Status: <span className="font-semibold">{section188Status}</span>
      </p>

      <WioaEtplFormAlerts error={error} success={success} />

      <div className="space-y-6 bg-white border border-slate-200 rounded-xl p-6">
        <p className="text-sm text-slate-600">
          Required for every program per WIOA Section 188 and 29 CFR Part 38.
        </p>

        <div className="grid sm:grid-cols-2 gap-4">
          <WioaFormField label="Equal Opportunity Officer name *">
            <input
              className={wioaFormInputClass}
              value={section188.eo_officer_name}
              onChange={(e) => setSection188({ ...section188, eo_officer_name: e.target.value })}
            />
          </WioaFormField>
          <WioaFormField label="Review date *">
            <input
              type="date"
              className={wioaFormInputClass}
              value={section188.review_date}
              onChange={(e) => setSection188({ ...section188, review_date: e.target.value })}
            />
          </WioaFormField>
        </div>

        <div className="space-y-3">
          {CHECKLIST_ITEMS.map(([key, label]) => (
            <label
              key={key}
              className="flex items-start gap-2 text-sm border-b border-slate-100 pb-2"
            >
              <input
                type="checkbox"
                checked={section188[key]}
                onChange={(e) =>
                  setSection188({
                    ...section188,
                    [key]: e.target.checked,
                  } as Section188ChecklistData)
                }
                className="mt-1"
              />
              <span>{label}</span>
            </label>
          ))}
        </div>

        <label className="flex items-start gap-2 text-sm border-t pt-4">
          <input
            type="checkbox"
            checked={section188.attestation_signed}
            onChange={(e) =>
              setSection188({ ...section188, attestation_signed: e.target.checked })
            }
            className="mt-1"
          />
          <span>
            I certify this Section 188 Equal Opportunity compliance checklist is complete and
            accurate for this program.
          </span>
        </label>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            disabled={saving}
            onClick={() => save('section_188_checklist', false)}
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save draft
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => save('section_188_checklist', true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-blue-700 disabled:opacity-50"
          >
            Mark complete
          </button>
        </div>
      </div>
    </div>
  );
}
