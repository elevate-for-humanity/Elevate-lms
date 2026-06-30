'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, ChevronRight, ChevronLeft, Loader2, Upload, X, ExternalLink } from 'lucide-react';
import { getActiveProgramsByCategory } from '@/lib/program-registry';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

const PROGRAM_TYPES = [
  ...getActiveProgramsByCategory().map((g) => g.category),
  'Other',
];

const CREDENTIAL_AUTHORITIES = [
  'EPA Section 608',
  'OSHA',
  'NCCER',
  'CompTIA',
  'PTCB',
  'Indiana SDOH',
  'ACT WorkKeys / NCRC',
  'NRF / RISE Up',
  'Other',
];

type Step = 'org' | 'contact' | 'programs' | 'compliance' | 'narrative' | 'documents' | 'review';
const STEPS: Step[] = ['org', 'contact', 'programs', 'compliance', 'narrative', 'documents', 'review'];
const STEP_LABELS: Record<Step, string> = {
  org: 'Organization',
  contact: 'Contact',
  programs: 'Programs',
  compliance: 'Compliance',
  narrative: 'About You',
  documents: 'Docs & Banking',
  review: 'Review & Submit',
};

type FormData = {
  orgName: string;
  orgType: string;
  ein: string;
  website: string;
  contactName: string;
  contactTitle: string;
  contactEmail: string;
  contactPhone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zip: string;
  programTypes: string[];
  serviceArea: string;
  annualEnrollment: string;
  credentialAuthorities: string[];
  wioaEligible: boolean;
  etplListed: boolean;
  etplState: string;
  accreditation: string;
  missionStatement: string;
  outcomesDescription: string;
  partnershipGoals: string;
  // Documents & Banking
  w9FileUrl: string;
  einDocFileUrl: string;
  certificationFileUrl: string;
  resumeFileUrl: string;
  bankName: string;
  bankRoutingNumber: string;
  bankAccountNumber: string;
  bankAccountType: 'checking' | 'savings' | '';
  payrollProvider: string;
  quickbooksConnected: boolean;
  quickbooksCompanyId: string;
  agreedToTerms: boolean;
};

const INITIAL: FormData = {
  orgName: '',
  orgType: '',
  ein: '',
  website: '',
  contactName: '',
  contactTitle: '',
  contactEmail: '',
  contactPhone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: 'IN',
  zip: '',
  programTypes: [],
  serviceArea: '',
  annualEnrollment: '',
  credentialAuthorities: [],
  wioaEligible: false,
  etplListed: false,
  etplState: 'IN',
  accreditation: '',
  missionStatement: '',
  outcomesDescription: '',
  partnershipGoals: '',
  w9FileUrl: '',
  einDocFileUrl: '',
  certificationFileUrl: '',
  resumeFileUrl: '',
  bankName: '',
  bankRoutingNumber: '',
  bankAccountNumber: '',
  bankAccountType: '',
  payrollProvider: '',
  quickbooksConnected: false,
  quickbooksCompanyId: '',
  agreedToTerms: false,
};

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-sm text-red-600">{msg}</p>;
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-slate-700 mb-1">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent ${props.className ?? ''}`}
    />
  );
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      rows={props.rows ?? 4}
      className={`w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent resize-none ${props.className ?? ''}`}
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent bg-white ${props.className ?? ''}`}
    />
  );
}

function FileUploadField({
  label,
  hint,
  accept,
  value,
  onChange,
  required,
}: {
  label: string;
  hint?: string;
  accept?: string;
  value: string;
  onChange: (url: string) => void;
  required?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  async function handleFile(file: File) {
    setUploading(true);
    setUploadError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('bucket', 'provider-documents');
      const res = await fetch('/api/upload/document', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Upload failed');
      onChange(data.url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <Label required={required}>{label}</Label>
      {hint && <p className="text-xs text-slate-500 mb-2">{hint}</p>}
      {value ? (
        <div className="flex items-center gap-2 p-3 bg-brand-green-50 border border-brand-green-200 rounded-lg text-sm">
          <span className="w-4 h-4 rounded-full bg-brand-green-600 inline-block flex-shrink-0 shrink-0" aria-hidden="true" />
          <span className="text-brand-green-800 flex-1 truncate">Uploaded</span>
          <a href={value} target="_blank" rel="noopener noreferrer" className="text-brand-green-700 hover:text-brand-green-900">
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button type="button" onClick={() => onChange('')} className="text-brand-green-600 hover:text-red-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-brand-blue-400 hover:bg-slate-50 transition-colors"
        >
          {uploading ? (
            <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
          ) : (
            <Upload className="w-5 h-5 text-slate-400" />
          )}
          <span className="text-sm text-slate-500">
            {uploading ? 'Uploading…' : 'Click to upload'}
          </span>
          <input
            ref={inputRef}
            type="file"
            accept={accept ?? '.pdf,.jpg,.jpeg,.png'}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </div>
      )}
      {uploadError && <p className="mt-1 text-sm text-red-600">{uploadError}</p>}
    </div>
  );
}

function CheckboxGroup({
  options,
  selected,
  onChange,
}: {
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (opt: string) => {
    onChange(selected.includes(opt) ? selected.filter((x) => x !== opt) : [...selected, opt]);
  };
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {options.map((opt) => (
        <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
          <input
            type="checkbox"
            checked={selected.includes(opt)}
            onChange={() => toggle(opt)}
            className="rounded border-slate-300 text-brand-blue-600 focus:ring-brand-blue-500"
          />
          {opt}
        </label>
      ))}
    </div>
  );
}

export default function ProviderApplicationForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('org');
  const [form, setForm] = useState<FormData>(INITIAL);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [suggesting, setSuggesting] = useState(false);
  const [qbChecking, setQbChecking] = useState(false);
  const [qbStatus, setQbStatus] = useState<{ connected: boolean; company?: string } | null>(null);

  const handleAiSuggest = async () => {
    setSuggesting(true);
    try {
      const res = await fetch('/api/applications/suggest-answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: [
            { fieldName: 'missionStatement', fieldLabel: 'Mission Statement' },
            { fieldName: 'serviceArea', fieldLabel: 'Service Area' },
            { fieldName: 'programDescription', fieldLabel: 'Program Description' },
          ],
        }),
      });
      if (!res.ok) return;
      const data = await res.json();
      const suggestions: Record<string, string> = data.suggestions ?? {};
      Object.entries(suggestions).forEach(([field, value]) => {
        if (value && field in INITIAL) set(field as keyof FormData, value);
      });
    } catch {
      // fail silently — suggestions are non-critical
    } finally {
      setSuggesting(false);
    }
  };

  const set = (field: keyof FormData, value: unknown) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  async function checkQbStatus() {
    setQbChecking(true);
    try {
      const res = await fetch('/api/admin/integrations/quickbooks?action=status');
      if (res.ok) {
        const d = await res.json();
        setQbStatus({ connected: d.connected, company: d.company_name });
        if (d.connected) {
          set('quickbooksConnected', true);
          set('quickbooksCompanyId', d.realm_id ?? '');
        }
      }
    } catch {
      setQbStatus({ connected: false });
    } finally {
      setQbChecking(false);
    }
  }

  const stepIndex = STEPS.indexOf(step);

  function validateStep(s: Step): boolean {
    const errs: Partial<Record<keyof FormData, string>> = {};
    if (s === 'org') {
      if (!form.orgName.trim()) errs.orgName = 'Required';
      if (!form.orgType) errs.orgType = 'Required';
    }
    if (s === 'contact') {
      if (!form.contactName.trim()) errs.contactName = 'Required';
      if (!form.contactEmail.trim()) errs.contactEmail = 'Required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail))
        errs.contactEmail = 'Invalid email';
      if (!form.contactPhone.trim()) errs.contactPhone = 'Required';
      if (!form.addressLine1.trim()) errs.addressLine1 = 'Required';
      if (!form.city.trim()) errs.city = 'Required';
      if (!form.zip.trim()) errs.zip = 'Required';
    }
    if (s === 'programs') {
      if (form.programTypes.length === 0) errs.programTypes = 'Select at least one program type';
    }
    if (s === 'review') {
      if (!form.agreedToTerms) errs.agreedToTerms = 'You must agree to the terms';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function next() {
    if (!validateStep(step)) return;
    setStep(STEPS[stepIndex + 1]);
  }

  function back() {
    setStep(STEPS[stepIndex - 1]);
  }

  async function submit() {
    if (!validateStep('review')) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      const res = await fetch('/api/provider/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || 'Submission failed. Please try again.');
        return;
      }
      setSubmitted(true);
    } catch {
      setSubmitError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
        <CheckCircle className="w-14 h-14 text-brand-green-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Application Submitted</h2>
        <p className="text-black mb-6 max-w-md mx-auto">
          We received your application and will review it within 5–7 business days. You will receive
          an email at <strong>{form.contactEmail}</strong> when a decision is made.
        </p>
        <button
          onClick={() => router.push('/for-providers')}
          className="inline-flex items-center gap-2 bg-brand-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-blue-700 transition text-sm"
        >
          Back to Training Provider Info
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {/* Step indicator */}
      <div className="border-b border-slate-100 px-6 py-4">
        <div className="flex items-center gap-1 overflow-x-auto">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-1 flex-shrink-0">
              <div
                className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full transition ${
                  s === step
                    ? 'bg-brand-blue-600 text-white'
                    : i < stepIndex
                      ? 'bg-brand-green-100 text-brand-green-700'
                      : 'text-black'
                }`}
              >
                {i < stepIndex ? <CheckCircle className="w-3 h-3" /> : <span>{i + 1}</span>}
                <span className="hidden sm:inline">{STEP_LABELS[s]}</span>
              </div>
              {i < STEPS.length - 1 && <div className="w-4 h-px bg-slate-200 flex-shrink-0" />}
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 sm:p-8">
        {/* Step: Organization */}
        {step === 'org' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Organization Information</h2>
              <button
                type="button"
                onClick={handleAiSuggest}
                disabled={suggesting}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-blue-600 border border-brand-blue-200 rounded-lg hover:bg-brand-blue-50 transition-colors disabled:opacity-50"
              >
                {suggesting ? '✨ Suggesting…' : '✨ AI Suggest'}
              </button>
            </div>
            <div>
              <Label required>Organization Name</Label>
              <Input
                value={form.orgName}
                onChange={(e) => set('orgName', e.target.value)}
                placeholder="Acme Training Institute"
              />
              <FieldError msg={errors.orgName} />
            </div>
            <div>
              <Label required>Organization Type</Label>
              <Select value={form.orgType} onChange={(e) => set('orgType', e.target.value)}>
                <option value="">Select type…</option>
                <option value="training_provider">Training Provider</option>
                <option value="workforce_agency">Workforce Agency</option>
                <option value="employer">Employer</option>
                <option value="community_org">Community Organization</option>
              </Select>
              <FieldError msg={errors.orgType} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>EIN (optional)</Label>
                <Input
                  value={form.ein}
                  onChange={(e) => set('ein', e.target.value)}
                  placeholder="12-3456789"
                />
              </div>
              <div>
                <Label>Website (optional)</Label>
                <Input
                  value={form.website}
                  onChange={(e) => set('website', e.target.value)}
                  placeholder="https://example.org"
                  type="url"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step: Contact */}
        {step === 'contact' && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-slate-900">Primary Contact</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label required>Full Name</Label>
                <Input
                  value={form.contactName}
                  onChange={(e) => set('contactName', e.target.value)}
                  placeholder="Jane Smith"
                />
                <FieldError msg={errors.contactName} />
              </div>
              <div>
                <Label>Title</Label>
                <Input
                  value={form.contactTitle}
                  onChange={(e) => set('contactTitle', e.target.value)}
                  placeholder="Executive Director"
                />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label required>Email</Label>
                <Input
                  value={form.contactEmail}
                  onChange={(e) => set('contactEmail', e.target.value)}
                  type="email"
                  placeholder="jane@example.org"
                />
                <FieldError msg={errors.contactEmail} />
              </div>
              <div>
                <Label required>Phone</Label>
                <Input
                  value={form.contactPhone}
                  onChange={(e) => set('contactPhone', e.target.value)}
                  type="tel"
                  placeholder="(317) 555-0100"
                />
                <FieldError msg={errors.contactPhone} />
              </div>
            </div>
            <div>
              <Label required>Street Address</Label>
              <Input
                value={form.addressLine1}
                onChange={(e) => set('addressLine1', e.target.value)}
                placeholder="123 Main St"
              />
              <FieldError msg={errors.addressLine1} />
            </div>
            <div>
              <Label>Suite / Unit (optional)</Label>
              <Input
                value={form.addressLine2}
                onChange={(e) => set('addressLine2', e.target.value)}
                placeholder="Suite 200"
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <Label required>City</Label>
                <Input
                  value={form.city}
                  onChange={(e) => set('city', e.target.value)}
                  placeholder="Indianapolis"
                />
                <FieldError msg={errors.city} />
              </div>
              <div>
                <Label required>State</Label>
                <Input
                  value={form.state}
                  onChange={(e) => set('state', e.target.value)}
                  placeholder="IN"
                  maxLength={2}
                />
              </div>
              <div>
                <Label required>ZIP</Label>
                <Input
                  value={form.zip}
                  onChange={(e) => set('zip', e.target.value)}
                  placeholder="46201"
                  maxLength={10}
                />
                <FieldError msg={errors.zip} />
              </div>
            </div>
          </div>
        )}

        {/* Step: Programs */}
        {step === 'programs' && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-slate-900">Programs & Credentials</h2>
            <div>
              <Label required>Program Types Offered</Label>
              <p className="text-xs text-black mb-3">Select all that apply.</p>
              <CheckboxGroup
                options={PROGRAM_TYPES}
                selected={form.programTypes}
                onChange={(v) => set('programTypes', v)}
              />
              <FieldError msg={errors.programTypes} />
            </div>
            <div>
              <Label>Credential Authorities</Label>
              <p className="text-xs text-black mb-3">
                Which bodies issue credentials for your programs?
              </p>
              <CheckboxGroup
                options={CREDENTIAL_AUTHORITIES}
                selected={form.credentialAuthorities}
                onChange={(v) => set('credentialAuthorities', v)}
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Service Area</Label>
                <Input
                  value={form.serviceArea}
                  onChange={(e) => set('serviceArea', e.target.value)}
                  placeholder="Marion County, Central Indiana"
                />
              </div>
              <div>
                <Label>Annual Enrollment (approx.)</Label>
                <Input
                  value={form.annualEnrollment}
                  onChange={(e) => set('annualEnrollment', e.target.value)}
                  type="number"
                  min="0"
                  placeholder="50"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step: Compliance */}
        {step === 'compliance' && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-slate-900">Compliance & Eligibility</h2>
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.wioaEligible}
                  onChange={(e) => set('wioaEligible', e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-brand-blue-600 focus:ring-brand-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-slate-700">WIOA Eligible</span>
                  <p className="text-xs text-black">
                    Your programs qualify for Workforce Innovation and Opportunity Act Individual
                    Training Accounts.
                  </p>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.etplListed}
                  onChange={(e) => set('etplListed', e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-brand-blue-600 focus:ring-brand-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-slate-700">ETPL Listed</span>
                  <p className="text-xs text-black">
                    Your organization is on a state Eligible Training Provider List.
                  </p>
                </div>
              </label>
            </div>
            {form.etplListed && (
              <div>
                <Label>ETPL State</Label>
                <Input
                  value={form.etplState}
                  onChange={(e) => set('etplState', e.target.value)}
                  placeholder="IN"
                  maxLength={2}
                />
              </div>
            )}
            <div>
              <Label>Accreditation (optional)</Label>
              <Input
                value={form.accreditation}
                onChange={(e) => set('accreditation', e.target.value)}
                placeholder="ACCSC, COE, state licensure, etc."
              />
            </div>
          </div>
        )}

        {/* Step: Narrative */}
        {step === 'narrative' && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-slate-900">About Your Organization</h2>
            <div>
              <Label>Mission Statement</Label>
              <Textarea
                value={form.missionStatement}
                onChange={(e) => set('missionStatement', e.target.value)}
                placeholder="Describe your organization's mission and the populations you serve."
              />
            </div>
            <div>
              <Label>Outcomes & Track Record</Label>
              <Textarea
                value={form.outcomesDescription}
                onChange={(e) => set('outcomesDescription', e.target.value)}
                placeholder="Describe your employment outcomes, credential attainment rates, or other measurable results."
              />
            </div>
            <div>
              <Label>Partnership Goals</Label>
              <Textarea
                value={form.partnershipGoals}
                onChange={(e) => set('partnershipGoals', e.target.value)}
                placeholder="What are you hoping to achieve through this partnership?"
              />
            </div>
          </div>
        )}

        {/* Step: Documents & Banking */}
        {step === 'documents' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-900">Documents &amp; Banking</h2>
            <p className="text-sm text-slate-500">
              Upload required documents and provide banking details for direct deposit. All files are stored securely and reviewed only by Elevate staff.
            </p>

            {/* Document uploads */}
            <div className="space-y-5">
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Required Documents</h3>
              <FileUploadField
                label="W-9 Form"
                hint="IRS W-9 signed within the last 12 months. PDF or image."
                value={form.w9FileUrl}
                onChange={(url) => set('w9FileUrl', url)}
                required
              />
              <FileUploadField
                label="EIN Documentation"
                hint="IRS EIN assignment letter or SS-4 confirmation."
                value={form.einDocFileUrl}
                onChange={(url) => set('einDocFileUrl', url)}
              />
              <FileUploadField
                label="Certifications / Licenses"
                hint="State license, accreditation letter, or credential authority approval."
                value={form.certificationFileUrl}
                onChange={(url) => set('certificationFileUrl', url)}
              />
              <FileUploadField
                label="Resume / Organizational Profile"
                hint="Lead instructor or executive director resume, or org capability statement."
                value={form.resumeFileUrl}
                onChange={(url) => set('resumeFileUrl', url)}
              />
            </div>

            {/* Banking / Direct Deposit */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Banking &amp; Direct Deposit</h3>
              <p className="text-xs text-slate-500">Used for program revenue sharing and reimbursements. Leave blank if not applicable.</p>
              <div>
                <Label>Bank Name</Label>
                <Input
                  value={form.bankName}
                  onChange={(e) => set('bankName', e.target.value)}
                  placeholder="First National Bank"
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Routing Number</Label>
                  <Input
                    value={form.bankRoutingNumber}
                    onChange={(e) => set('bankRoutingNumber', e.target.value)}
                    placeholder="021000021"
                    maxLength={9}
                    inputMode="numeric"
                  />
                </div>
                <div>
                  <Label>Account Number</Label>
                  <Input
                    value={form.bankAccountNumber}
                    onChange={(e) => set('bankAccountNumber', e.target.value)}
                    placeholder="••••••••••"
                    type="password"
                    autoComplete="off"
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Account Type</Label>
                  <Select
                    value={form.bankAccountType}
                    onChange={(e) => set('bankAccountType', e.target.value)}
                  >
                    <option value="">Select…</option>
                    <option value="checking">Checking</option>
                    <option value="savings">Savings</option>
                  </Select>
                </div>
                <div>
                  <Label>Payroll Provider</Label>
                  <Input
                    value={form.payrollProvider}
                    onChange={(e) => set('payrollProvider', e.target.value)}
                    placeholder="ADP, Gusto, QuickBooks Payroll…"
                  />
                </div>
              </div>
            </div>

            {/* QuickBooks */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">QuickBooks Online</h3>
              <p className="text-xs text-slate-500">
                Connecting QuickBooks allows Elevate to sync payments, invoices, and expense records automatically.
              </p>
              {form.quickbooksConnected ? (
                <div className="flex items-center gap-3 p-4 bg-brand-green-50 border border-brand-green-200 rounded-xl">
                  <span className="w-5 h-5 rounded-full bg-brand-green-600 inline-block flex-shrink-0 shrink-0" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-semibold text-brand-green-800">QuickBooks Connected</p>
                    {form.quickbooksCompanyId && (
                      <p className="text-xs text-brand-green-600 font-mono">Company ID: {form.quickbooksCompanyId}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => { set('quickbooksConnected', false); set('quickbooksCompanyId', ''); setQbStatus(null); }}
                    className="ml-auto text-xs text-brand-green-600 hover:text-red-600"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {qbStatus?.connected === false && (
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      QuickBooks is not connected to the admin account. An admin can connect it at{' '}
                      <a href="/admin/integrations/quickbooks" target="_blank" className="underline">Admin → Integrations → QuickBooks</a>.
                    </p>
                  )}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={checkQbStatus}
                      disabled={qbChecking}
                      className="flex items-center gap-2 px-4 py-2 bg-[#2CA01C] hover:bg-[#248016] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
                    >
                      {qbChecking ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      {qbChecking ? 'Checking…' : 'Check QuickBooks Status'}
                    </button>
                    <a
                      href="/admin/integrations/quickbooks"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      Connect in Admin <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                  <p className="text-xs text-slate-400">
                    QuickBooks connection is optional — you can complete your application without it.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step: Review */}
        {step === 'review' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-900">Review & Submit</h2>

            <div className="space-y-4 text-sm">
              <ReviewSection label="Organization">
                <ReviewRow label="Name" value={form.orgName} />
                <ReviewRow label="Type" value={form.orgType.replace('_', ' ')} />
                {form.ein && <ReviewRow label="EIN" value={form.ein} />}
                {form.website && <ReviewRow label="Website" value={form.website} />}
              </ReviewSection>

              <ReviewSection label="Contact">
                <ReviewRow
                  label="Name"
                  value={`${form.contactName}${form.contactTitle ? `, ${form.contactTitle}` : ''}`}
                />
                <ReviewRow label="Email" value={form.contactEmail} />
                <ReviewRow label="Phone" value={form.contactPhone} />
                <ReviewRow
                  label="Address"
                  value={`${form.addressLine1}${form.addressLine2 ? ` ${form.addressLine2}` : ''}, ${form.city}, ${form.state} ${form.zip}`}
                />
              </ReviewSection>

              <ReviewSection label="Programs">
                <ReviewRow label="Types" value={form.programTypes.join(', ')} />
                {form.credentialAuthorities.length > 0 && (
                  <ReviewRow label="Credentials" value={form.credentialAuthorities.join(', ')} />
                )}
                {form.serviceArea && <ReviewRow label="Service Area" value={form.serviceArea} />}
              </ReviewSection>

              <ReviewSection label="Compliance">
                <ReviewRow label="WIOA Eligible" value={form.wioaEligible ? 'Yes' : 'No'} />
                <ReviewRow
                  label="ETPL Listed"
                  value={form.etplListed ? `Yes (${form.etplState})` : 'No'}
                />
                {form.accreditation && (
                  <ReviewRow label="Accreditation" value={form.accreditation} />
                )}
              </ReviewSection>

              <ReviewSection label="Documents & Banking">
                <ReviewRow label="W-9" value={form.w9FileUrl ? '✓ Uploaded' : 'Not uploaded'} />
                <ReviewRow label="EIN Doc" value={form.einDocFileUrl ? '✓ Uploaded' : 'Not uploaded'} />
                <ReviewRow label="Certifications" value={form.certificationFileUrl ? '✓ Uploaded' : 'Not uploaded'} />
                <ReviewRow label="Resume" value={form.resumeFileUrl ? '✓ Uploaded' : 'Not uploaded'} />
                {form.bankName && <ReviewRow label="Bank" value={form.bankName} />}
                {form.bankAccountType && <ReviewRow label="Account Type" value={form.bankAccountType} />}
                {form.payrollProvider && <ReviewRow label="Payroll" value={form.payrollProvider} />}
                <ReviewRow label="QuickBooks" value={form.quickbooksConnected ? '✓ Connected' : 'Not connected'} />
              </ReviewSection>
            </div>

            <div className="border-t border-slate-100 pt-5">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.agreedToTerms}
                  onChange={(e) => set('agreedToTerms', e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-brand-blue-600 focus:ring-brand-blue-500"
                />
                <span className="text-sm text-slate-700">
                  I confirm that the information provided is accurate and that I am authorized to
                  submit this application on behalf of my organization. I understand that approval
                  is subject to review and that {PLATFORM_DEFAULTS.orgName} may request additional
                  documentation.
                </span>
              </label>
              <FieldError msg={errors.agreedToTerms} />
            </div>

            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                {submitError}
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
          <button
            type="button"
            onClick={back}
            disabled={stepIndex === 0}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-black hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>

          {step !== 'review' ? (
            <button
              type="button"
              onClick={next}
              className="inline-flex items-center gap-1.5 bg-brand-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-brand-blue-700 transition"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="inline-flex items-center gap-2 bg-brand-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-brand-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Submitting…
                </>
              ) : (
                'Submit Application'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ReviewSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <div className="bg-white px-4 py-2 border-b border-slate-200">
        <span className="text-xs font-semibold text-black uppercase tracking-wide">{label}</span>
      </div>
      <div className="px-4 py-3 space-y-1.5">{children}</div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex gap-3">
      <span className="text-black w-28 flex-shrink-0">{label}</span>
      <span className="text-slate-900 font-medium">{value}</span>
    </div>
  );
}
