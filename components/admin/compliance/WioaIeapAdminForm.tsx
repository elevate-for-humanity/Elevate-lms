'use client';

import Link from 'next/link';
import { ChevronLeft, Loader2, Save } from 'lucide-react';
import { FORM_LABELS } from '@/lib/compliance/wioa-etpl-forms';
import { ADMIN_WIOA_COMPLIANCE } from '@/lib/compliance/wioa-etpl-routes';
import { useWioaEtplProgramForm } from './useWioaEtplProgramForm';
import { WioaEtplFormAlerts } from './WioaEtplFormAlerts';
import { WioaFormField, wioaFormInputClass } from './WioaEtplFormFields';

export function WioaIeapAdminForm({ programId }: { programId: string }) {
  const {
    loading,
    saving,
    error,
    success,
    program,
    ieap,
    setIeap,
    ieapStatus,
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

  if (!program.etpl_requires_initial_eligibility) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link
          href={ADMIN_WIOA_COMPLIANCE.programHub(programId)}
          className="inline-flex items-center text-sm text-slate-600 hover:text-brand-blue-700 mb-6"
        >
          <ChevronLeft className="w-4 h-4" /> Back to program compliance
        </Link>
        <p className="text-slate-700">
          Initial Eligibility Aggregate Performance is not required for this program (established
          ETPL / INTraining listing). Complete the{' '}
          <Link
            href={ADMIN_WIOA_COMPLIANCE.programSection188(programId)}
            className="text-brand-blue-600 font-semibold hover:underline"
          >
            Section 188 checklist
          </Link>{' '}
          instead.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link
        href={ADMIN_WIOA_COMPLIANCE.programHub(programId)}
        className="inline-flex items-center text-sm text-slate-600 hover:text-brand-blue-700 mb-6"
      >
        <ChevronLeft className="w-4 h-4" /> Back to program compliance
      </Link>

      <h1 className="text-2xl font-bold text-slate-900 mb-1">
        {FORM_LABELS.initial_eligibility_aggregate_performance}
      </h1>
      <p className="text-slate-600 mb-2">{program.title}</p>
      <p className="text-xs text-slate-500 mb-6">
        Status: <span className="font-semibold">{ieapStatus}</span>
      </p>

      <WioaEtplFormAlerts error={error} success={success} />

      <div className="space-y-6 bg-white border border-slate-200 rounded-xl p-6">
        <p className="text-sm text-slate-600">
          Required for <strong>new programs only</strong> before initial INTraining / ETPL listing
          (WIOA §122, 20 CFR 680.450).
        </p>

        <div className="grid sm:grid-cols-2 gap-4">
          <WioaFormField label="INTraining program ID">
            <input
              className={wioaFormInputClass}
              value={ieap.intraining_program_id}
              onChange={(e) => setIeap({ ...ieap, intraining_program_id: e.target.value })}
            />
          </WioaFormField>
          <WioaFormField label="Program title (must match ETPL listing) *">
            <input
              className={wioaFormInputClass}
              value={ieap.program_title_etpl}
              onChange={(e) => setIeap({ ...ieap, program_title_etpl: e.target.value })}
            />
          </WioaFormField>
          <WioaFormField label="CIP code">
            <input
              className={wioaFormInputClass}
              value={ieap.cip_code}
              onChange={(e) => setIeap({ ...ieap, cip_code: e.target.value })}
            />
          </WioaFormField>
          <WioaFormField label="SOC code">
            <input
              className={wioaFormInputClass}
              value={ieap.soc_code}
              onChange={(e) => setIeap({ ...ieap, soc_code: e.target.value })}
            />
          </WioaFormField>
        </div>

        <WioaFormField label="Program description *">
          <textarea
            className={`${wioaFormInputClass} min-h-[120px]`}
            value={ieap.program_description}
            onChange={(e) => setIeap({ ...ieap, program_description: e.target.value })}
          />
        </WioaFormField>

        <WioaFormField label="Recognized post-secondary credential *">
          <textarea
            className={`${wioaFormInputClass} min-h-[80px]`}
            value={ieap.recognized_credential_description}
            onChange={(e) =>
              setIeap({ ...ieap, recognized_credential_description: e.target.value })
            }
          />
        </WioaFormField>

        <WioaFormField label="Credential issuing authority">
          <input
            className={wioaFormInputClass}
            value={ieap.credential_issuing_authority}
            onChange={(e) => setIeap({ ...ieap, credential_issuing_authority: e.target.value })}
          />
        </WioaFormField>

        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={ieap.aligns_in_demand_industry}
            onChange={(e) => setIeap({ ...ieap, aligns_in_demand_industry: e.target.checked })}
            className="mt-1"
          />
          <span>Program aligns with an in-demand industry or occupation (Indiana DWD) *</span>
        </label>

        <WioaFormField label="In-demand alignment narrative *">
          <textarea
            className={`${wioaFormInputClass} min-h-[80px]`}
            value={ieap.in_demand_narrative}
            onChange={(e) => setIeap({ ...ieap, in_demand_narrative: e.target.value })}
          />
        </WioaFormField>

        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={ieap.performance_data_not_applicable}
            onChange={(e) =>
              setIeap({ ...ieap, performance_data_not_applicable: e.target.checked })
            }
            className="mt-1"
          />
          <span>
            New program — insufficient completer data (aggregate performance N/A for initial year)
          </span>
        </label>

        <div className="grid sm:grid-cols-2 gap-4">
          <WioaFormField label="Prepared by *">
            <input
              className={wioaFormInputClass}
              value={ieap.prepared_by_name}
              onChange={(e) => setIeap({ ...ieap, prepared_by_name: e.target.value })}
            />
          </WioaFormField>
          <WioaFormField label="Date *">
            <input
              type="date"
              className={wioaFormInputClass}
              value={ieap.prepared_date}
              onChange={(e) => setIeap({ ...ieap, prepared_date: e.target.value })}
            />
          </WioaFormField>
        </div>

        <label className="flex items-start gap-2 text-sm border-t pt-4">
          <input
            type="checkbox"
            checked={ieap.attestation_signed}
            onChange={(e) => setIeap({ ...ieap, attestation_signed: e.target.checked })}
            className="mt-1"
          />
          <span>
            I attest that the information is accurate and verifiable for Indiana DWD INTraining /
            ETPL initial eligibility review.
          </span>
        </label>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            disabled={saving}
            onClick={() => save('initial_eligibility_aggregate_performance', false)}
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save draft
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => save('initial_eligibility_aggregate_performance', true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-blue-700 disabled:opacity-50"
          >
            Mark complete
          </button>
        </div>
      </div>
    </div>
  );
}
