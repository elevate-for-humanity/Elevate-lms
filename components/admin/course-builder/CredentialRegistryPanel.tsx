'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle, Download, ExternalLink } from 'lucide-react';
import {
  EMPTY_CREDENTIAL_REGISTRY_RECORD,
  validateCredentialRegistryRecord,
  type CredentialRegistryRecord,
  type RegistryCredentialType,
  type RegistryDeliveryType,
} from '@/lib/course-builder/credential-registry';

type CourseSeed = {
  title?: string;
  duration_hours?: number | null;
};

const CREDENTIAL_TYPES: RegistryCredentialType[] = [
  'Certificate', 'Certification', 'Diploma', 'Degree', 'Badge', 'License',
];
const DELIVERY_TYPES: RegistryDeliveryType[] = ['In Person', 'Online Only', 'Hybrid'];

export default function CredentialRegistryPanel({ course }: { course?: CourseSeed | null }) {
  const [record, setRecord] = useState<CredentialRegistryRecord>({
    ...EMPTY_CREDENTIAL_REGISTRY_RECORD,
    credentialName: course?.title ?? '',
    durationHours: course?.duration_hours ?? null,
  });
  const [error, setError] = useState('');
  const validation = useMemo(() => validateCredentialRegistryRecord(record), [record]);

  function patch(update: Partial<CredentialRegistryRecord>) {
    setRecord((current) => ({ ...current, ...update }));
    setError('');
  }

  function list(value: string) {
    return value.split(/\n|,/).map((item) => item.trim()).filter(Boolean);
  }

  async function download() {
    setError('');
    const response = await fetch('/api/admin/course-builder/registry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'export', record }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? 'Unable to export the Registry file');
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${record.credentialName || 'credential'}-credential-registry.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white">Credential Registry record</h2>
            <p className="mt-1 max-w-3xl text-sm text-slate-400">
              Complete the public facts Credential Engine needs. This does not claim accreditation or
              licensing; enter only approvals Elevate can document.
            </p>
          </div>
          <a href="https://apps.credentialengine.org/publisher/bulkupload/simple"
            target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-200 hover:border-cyan-500">
            Bulk Upload <ExternalLink className="h-4 w-4" />
          </a>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Select label="Registry environment" required value={record.registryEnvironment}
            options={['production', 'sandbox']}
            onChange={(value) => patch({ registryEnvironment: value as 'production' | 'sandbox' })} />
          <Field label="Elevate Organization CTID" value={record.organizationCtid}
            onChange={(value) => patch({ organizationCtid: value.trim() })}
          />
          <Field label="Credential CTID" value={record.ctid}
            onChange={(value) => patch({ ctid: value.trim() })}
          />
          <Field label="Last published or updated" type="date" value={record.lastPublishedAt}
            onChange={(value) => patch({ lastPublishedAt: value })} />
          <div className="md:col-span-2 rounded-lg border border-cyan-900 bg-cyan-950/40 px-4 py-3 text-xs leading-relaxed text-cyan-100">
            The Organization CTID belongs to Elevate’s separately published organization record.
            Keep each credential CTID unchanged when updating that credential. Use a new CTID only
            for a genuinely new credential that cannot replace the old one.
          </div>
          <Field label="Credential name" required value={record.credentialName}
            onChange={(value) => patch({ credentialName: value })} />
          <Select label="Credential type" required value={record.credentialType}
            options={CREDENTIAL_TYPES} onChange={(value) => patch({ credentialType: value as RegistryCredentialType })} />
          <div className="md:col-span-2">
            <TextArea label="Credential description" required value={record.description}
              onChange={(value) => patch({ description: value })} />
          </div>
          <Field label="Credential-specific public webpage" required type="url"
            value={record.subjectWebpage} onChange={(value) => patch({ subjectWebpage: value })} />
          <Select label="Delivery type" required value={record.deliveryType}
            options={DELIVERY_TYPES} onChange={(value) => patch({ deliveryType: value as RegistryDeliveryType })} />
          <Field label="Total hours" type="number" value={record.durationHours ?? ''}
            onChange={(value) => patch({ durationHours: value ? Number(value) : null })} />
          <Field label="Duration in weeks" type="number" value={record.durationWeeks ?? ''}
            onChange={(value) => patch({ durationWeeks: value ? Number(value) : null })} />
          <Field label="Estimated tuition and fees" type="number" value={record.estimatedCost ?? ''}
            onChange={(value) => patch({ estimatedCost: value ? Number(value) : null })} />
          <Field label="Financial assistance" value={record.financialAssistance}
            onChange={(value) => patch({ financialAssistance: value })} />
          <TextArea label="Entry requirements" required value={record.entryRequirements}
            onChange={(value) => patch({ entryRequirements: value })} />
          <TextArea label="Assessment requirements" required value={record.assessmentRequirements}
            onChange={(value) => patch({ assessmentRequirements: value })} />
          <div className="md:col-span-2">
            <TextArea label="Completion requirements" required value={record.completionRequirements}
              onChange={(value) => patch({ completionRequirements: value })} />
          </div>
          <TextArea label="Skills and competencies" required hint="One per line"
            value={record.competencies.join('\n')} onChange={(value) => patch({ competencies: list(value) })} />
          <TextArea label="Related occupations" required hint="One per line"
            value={record.occupations.join('\n')} onChange={(value) => patch({ occupations: list(value) })} />
          <Field label="Approval agency (if applicable)" value={record.approvalAgency}
            onChange={(value) => patch({ approvalAgency: value })} />
          <Field label="Approval or license number" value={record.approvalIdentifier}
            onChange={(value) => patch({ approvalIdentifier: value })} />
        </div>
      </section>

      <aside className="h-fit rounded-2xl border border-slate-800 bg-slate-900 p-5 xl:sticky xl:top-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-white">Registry readiness</h2>
          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${validation.ready ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
            {validation.completionPercent}%
          </span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
          <div className={`h-full ${validation.ready ? 'bg-emerald-500' : 'bg-cyan-500'}`}
            style={{ width: `${validation.completionPercent}%` }} />
        </div>
        {validation.ready ? (
          <p className="mt-4 flex gap-2 text-sm text-emerald-300">
            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" /> Ready for Credential Engine bulk upload.
          </p>
        ) : (
          <div className="mt-4">
            <p className="flex gap-2 text-sm font-semibold text-amber-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> Missing required information
            </p>
            <ul className="mt-2 space-y-1 text-xs text-slate-400">
              {validation.missing.map((item) => <li key={item}>• {item}</li>)}
            </ul>
          </div>
        )}
        {validation.warnings.length > 0 && (
          <div className="mt-4 border-t border-slate-800 pt-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-300">Review</p>
            <ul className="mt-2 space-y-1 text-xs text-slate-400">
              {validation.warnings.map((item) => <li key={item}>• {item}</li>)}
            </ul>
          </div>
        )}
        {error && <p className="mt-4 text-sm text-red-300">{error}</p>}
        <button type="button" disabled={!validation.ready} onClick={() => void download()}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-40">
          <Download className="h-4 w-4" /> Export Credential Engine CSV
        </button>
        <p className="mt-3 text-xs leading-relaxed text-slate-500">
          Credential Engine may require its latest generated template. Copy or map this validated
          record into that template before final approval.
        </p>
      </aside>
    </div>
  );
}

function Field({ label, value, onChange, required, type = 'text' }: {
  label: string; value: string | number; onChange: (value: string) => void; required?: boolean; type?: string;
}) {
  return <label className="block text-sm font-semibold text-slate-200">
    {label}{required && <span className="text-red-400"> *</span>}
    <input type={type} value={value} onChange={(event) => onChange(event.target.value)}
      className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-normal text-white" />
  </label>;
}

function TextArea({ label, value, onChange, required, hint }: {
  label: string; value: string; onChange: (value: string) => void; required?: boolean; hint?: string;
}) {
  return <label className="block text-sm font-semibold text-slate-200">
    {label}{required && <span className="text-red-400"> *</span>}
    {hint && <span className="ml-2 text-xs font-normal text-slate-500">{hint}</span>}
    <textarea rows={3} value={value} onChange={(event) => onChange(event.target.value)}
      className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-normal text-white" />
  </label>;
}

function Select({ label, value, options, onChange, required }: {
  label: string; value: string; options: string[]; onChange: (value: string) => void; required?: boolean;
}) {
  return <label className="block text-sm font-semibold text-slate-200">
    {label}{required && <span className="text-red-400"> *</span>}
    <select value={value} onChange={(event) => onChange(event.target.value)}
      className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-normal text-white">
      <option value="">Select…</option>
      {options.map((option) => <option key={option} value={option}>{option}</option>)}
    </select>
  </label>;
}
