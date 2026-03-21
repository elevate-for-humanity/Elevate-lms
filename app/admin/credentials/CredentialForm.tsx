'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Loader2, AlertCircle, Shield } from 'lucide-react';

interface CredentialFormProps {
  initial?: Partial<CredentialRow>;
  mode: 'create' | 'edit';
}

interface CredentialRow {
  id: string;
  name: string;
  abbreviation: string;
  description: string;
  issuer_type: string;
  issuing_authority: string;
  issuing_authority_url: string;
  proctor_authority: string;
  delivery: string;
  requires_exam: boolean;
  exam_type: string;
  exam_location: string;
  passing_score: number | null;
  verification_source: string;
  verification_url: string;
  renewal_period_months: number | null;
  national_registry_id: string;
  cip_code: string;
  soc_code: string;
  wioa_eligible: boolean;
  dol_registered: boolean;
  credential_stack: string;
  stack_level: string;
  is_active: boolean;
  is_published: boolean;
}

const BLANK: Omit<CredentialRow, 'id'> = {
  name: '',
  abbreviation: '',
  description: '',
  issuer_type: 'elevate_issued',
  issuing_authority: 'Elevate for Humanity',
  issuing_authority_url: '',
  proctor_authority: 'elevate',
  delivery: 'internal',
  requires_exam: false,
  exam_type: 'assessment',
  exam_location: 'on_site',
  passing_score: 70,
  verification_source: 'elevate',
  verification_url: '',
  renewal_period_months: null,
  national_registry_id: '',
  cip_code: '',
  soc_code: '',
  wioa_eligible: false,
  dol_registered: false,
  credential_stack: 'workforce_readiness',
  stack_level: 'foundational',
  is_active: true,
  is_published: false,
};

// When issuer_type changes, auto-set sensible defaults
function deriveDefaults(issuer_type: string): Partial<typeof BLANK> {
  if (issuer_type === 'elevate_issued') {
    return { issuing_authority: 'Elevate for Humanity', proctor_authority: 'elevate', delivery: 'internal', verification_source: 'elevate' };
  }
  if (issuer_type === 'elevate_proctored') {
    return { proctor_authority: 'elevate', delivery: 'internal', verification_source: 'issuer_api', requires_exam: true, exam_type: 'proctored' };
  }
  if (issuer_type === 'partner_delivered') {
    return { proctor_authority: 'external_vendor', delivery: 'external', verification_source: 'external_link' };
  }
  return {};
}

export default function CredentialForm({ initial, mode }: CredentialFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<Omit<CredentialRow, 'id'>>({ ...BLANK, ...initial });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof typeof form, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const handleIssuerTypeChange = (val: string) => {
    setForm(f => ({ ...f, issuer_type: val, ...deriveDefaults(val) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Name is required'); return; }
    if (!form.issuing_authority.trim()) { setError('Issuing authority is required'); return; }
    setSaving(true);
    setError('');

    const url = mode === 'create'
      ? '/api/admin/credentials'
      : `/api/admin/credentials/${(initial as any).id}`;
    const method = mode === 'create' ? 'POST' : 'PATCH';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Save failed');
      router.push('/admin/credentials');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const field = (label: string, key: keyof typeof form, opts?: {
    placeholder?: string; multiline?: boolean; required?: boolean; type?: string;
  }) => (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">
        {label}{opts?.required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {opts?.multiline ? (
        <textarea
          value={(form[key] as string) ?? ''}
          onChange={e => set(key, e.target.value)}
          rows={3}
          placeholder={opts.placeholder}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue-400 focus:border-transparent resize-none"
        />
      ) : (
        <input
          type={opts?.type ?? 'text'}
          value={(form[key] as string | number) ?? ''}
          onChange={e => set(key, opts?.type === 'number' ? (e.target.value ? Number(e.target.value) : null) : e.target.value)}
          placeholder={opts?.placeholder}
          required={opts?.required}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue-400 focus:border-transparent"
        />
      )}
    </div>
  );

  const select = (label: string, key: keyof typeof form, options: { value: string; label: string }[]) => (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      <select
        value={(form[key] as string) ?? ''}
        onChange={e => set(key, e.target.value)}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue-400 focus:border-transparent bg-white"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );

  const checkbox = (label: string, key: keyof typeof form, description?: string) => (
    <label className="flex items-start gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={form[key] as boolean}
        onChange={e => set(key, e.target.checked)}
        className="w-4 h-4 mt-0.5 rounded border-slate-300 text-brand-blue-600"
      />
      <div>
        <span className="text-sm text-slate-700 font-medium">{label}</span>
        {description && <p className="text-xs text-slate-400">{description}</p>}
      </div>
    </label>
  );

  const isElevateAuthority = form.proctor_authority === 'elevate';

  return (
    <form onSubmit={handleSubmit} className="space-y-8">

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Authority lane — most important decision */}
      <section className="rounded-xl border border-slate-200 p-6 space-y-4">
        <h2 className="font-semibold text-slate-900 flex items-center gap-2">
          <Shield className="w-4 h-4 text-brand-blue-600" />
          Authority Lane
          <span className="text-xs font-normal text-slate-400 ml-1">— determines who issues and who proctors</span>
        </h2>

        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { value: 'elevate_issued',    label: 'Elevate Issued',    desc: 'Elevate owns curriculum, assessment, and certificate' },
            { value: 'elevate_proctored', label: 'Elevate Proctored', desc: 'National body issues; Elevate administers the exam' },
            { value: 'partner_delivered', label: 'Partner Delivered', desc: 'Vendor system; Elevate prepares learners only' },
          ].map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleIssuerTypeChange(opt.value)}
              className={`text-left p-4 rounded-xl border-2 transition-all ${
                form.issuer_type === opt.value
                  ? 'border-brand-blue-500 bg-brand-blue-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <p className="font-semibold text-sm text-slate-900">{opt.label}</p>
              <p className="text-xs text-slate-500 mt-1">{opt.desc}</p>
            </button>
          ))}
        </div>

        {isElevateAuthority && (
          <div className="flex items-center gap-2 bg-brand-blue-50 border border-brand-blue-200 rounded-lg px-3 py-2 text-xs text-brand-blue-800">
            <Shield className="w-3.5 h-3.5 shrink-0" />
            Elevate Proctored Certification — external courses cannot substitute for this credential in programs.
          </div>
        )}
      </section>

      {/* Identity */}
      <section className="rounded-xl border border-slate-200 p-6 space-y-4">
        <h2 className="font-semibold text-slate-900">Credential Identity</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {field('Credential Name', 'name', { required: true, placeholder: 'e.g. EPA Section 608 Certification' })}
          {field('Abbreviation', 'abbreviation', { placeholder: 'e.g. EPA-608' })}
        </div>
        {field('Description', 'description', { multiline: true, placeholder: 'What this credential certifies and who it is for' })}
        <div className="grid sm:grid-cols-2 gap-4">
          {field('Issuing Authority', 'issuing_authority', { required: true, placeholder: 'e.g. Elevate for Humanity, ACT Inc., EPA' })}
          {field('Issuing Authority URL', 'issuing_authority_url', { placeholder: 'https://...' })}
        </div>
      </section>

      {/* Classification */}
      <section className="rounded-xl border border-slate-200 p-6 space-y-4">
        <h2 className="font-semibold text-slate-900">Classification</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {select('Credential Stack', 'credential_stack', [
            { value: 'workforce_readiness', label: 'Workforce Readiness' },
            { value: 'customer_service',    label: 'Customer Service & Retail' },
            { value: 'hvac_trades',         label: 'Technical & Skilled Trades' },
            { value: 'workkeys',            label: 'WorkKeys Assessment' },
            { value: 'digital_workforce',   label: 'Digital Workforce Skills' },
            { value: 'other',               label: 'Other' },
          ])}
          {select('Stack Level', 'stack_level', [
            { value: 'foundational',  label: 'Foundational' },
            { value: 'intermediate',  label: 'Intermediate' },
            { value: 'advanced',      label: 'Advanced' },
          ])}
          {select('Delivery', 'delivery', [
            { value: 'internal', label: 'Internal (LMS)' },
            { value: 'external', label: 'External (Partner)' },
            { value: 'hybrid',   label: 'Hybrid' },
          ])}
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {field('National Registry ID', 'national_registry_id', { placeholder: 'e.g. ACT-NCRC, EPA-608-UNIVERSAL' })}
          {field('CIP Code', 'cip_code', { placeholder: 'e.g. 47.0201' })}
          {field('SOC Code', 'soc_code', { placeholder: 'e.g. 49-9021' })}
        </div>
        <div className="flex flex-wrap gap-6">
          {checkbox('WIOA Eligible', 'wioa_eligible', 'Eligible for Workforce Innovation and Opportunity Act funding')}
          {checkbox('DOL Registered', 'dol_registered', 'Registered with the Department of Labor')}
        </div>
      </section>

      {/* Exam */}
      <section className="rounded-xl border border-slate-200 p-6 space-y-4">
        <h2 className="font-semibold text-slate-900">Exam / Assessment</h2>
        <div className="flex flex-wrap gap-6">
          {checkbox('Requires Exam', 'requires_exam')}
        </div>
        {form.requires_exam && (
          <div className="grid sm:grid-cols-3 gap-4">
            {select('Exam Type', 'exam_type', [
              { value: 'proctored',   label: 'Proctored Exam' },
              { value: 'vendor',      label: 'Vendor Platform' },
              { value: 'assessment',  label: 'Assessment' },
              { value: 'portfolio',   label: 'Portfolio' },
              { value: 'none',        label: 'None' },
            ])}
            {select('Exam Location', 'exam_location', [
              { value: 'on_site',       label: 'On-Site (Elevate)' },
              { value: 'online',        label: 'Online' },
              { value: 'testing_center',label: 'Testing Center' },
              { value: 'partner_site',  label: 'Partner Site' },
            ])}
            {field('Passing Score (%)', 'passing_score', { type: 'number', placeholder: '70' })}
          </div>
        )}
        {field('Renewal Period (months)', 'renewal_period_months', { type: 'number', placeholder: 'Leave blank if no expiry' })}
      </section>

      {/* Verification */}
      <section className="rounded-xl border border-slate-200 p-6 space-y-4">
        <h2 className="font-semibold text-slate-900">Verification</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {select('Verification Source', 'verification_source', [
            { value: 'elevate',       label: 'Elevate (internal)' },
            { value: 'issuer_api',    label: 'Issuer API' },
            { value: 'external_link', label: 'External Link' },
            { value: 'open_badges',   label: 'Open Badges' },
            { value: 'credly',        label: 'Credly' },
          ])}
          {field('Verification URL', 'verification_url', { placeholder: 'https://verify.example.com' })}
        </div>
      </section>

      {/* Status */}
      <section className="rounded-xl border border-slate-200 p-6 space-y-4">
        <h2 className="font-semibold text-slate-900">Status</h2>
        <div className="flex flex-wrap gap-6">
          {checkbox('Active', 'is_active', 'Credential is available for use in programs')}
          {checkbox('Published', 'is_published', 'Visible on public credential verification page')}
        </div>
      </section>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-brand-blue-600 text-white rounded-lg font-semibold hover:bg-brand-blue-700 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {mode === 'create' ? 'Create Credential' : 'Save Changes'}
        </button>
        <a href="/admin/credentials" className="text-sm text-slate-500 hover:text-slate-700">
          Cancel
        </a>
      </div>
    </form>
  );
}
