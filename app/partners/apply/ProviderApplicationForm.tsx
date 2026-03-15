'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';

const PROGRAM_TYPES = [
  'HVAC / Refrigeration',
  'Electrical',
  'Plumbing',
  'Welding',
  'CDL / Commercial Driving',
  'Carpentry / Construction',
  'Healthcare / CNA',
  'Medical Assistant',
  'Phlebotomy',
  'Barbering / Cosmetology',
  'IT Support / Cybersecurity',
  'Business / Office Administration',
  'Tax Preparation',
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

type Step = 'org' | 'contact' | 'programs' | 'compliance' | 'narrative' | 'review';
const STEPS: Step[] = ['org', 'contact', 'programs', 'compliance', 'narrative', 'review'];
const STEP_LABELS: Record<Step, string> = {
  org: 'Organization',
  contact: 'Contact',
  programs: 'Programs',
  compliance: 'Compliance',
  narrative: 'About You',
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
  agreedToTerms: boolean;
};

const INITIAL: FormData = {
  orgName: '', orgType: '', ein: '', website: '',
  contactName: '', contactTitle: '', contactEmail: '', contactPhone: '',
  addressLine1: '', addressLine2: '', city: '', state: 'IN', zip: '',
  programTypes: [], serviceArea: '', annualEnrollment: '',
  credentialAuthorities: [], wioaEligible: false, etplListed: false,
  etplState: 'IN', accreditation: '',
  missionStatement: '', outcomesDescription: '', partnershipGoals: '',
  agreedToTerms: false,
};

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-sm text-red-600">{msg}</p>;
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-slate-700 mb-1">
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
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

function CheckboxGroup({
  options, selected, onChange,
}: { options: string[]; selected: string[]; onChange: (v: string[]) => void }) {
  const toggle = (opt: string) => {
    onChange(selected.includes(opt) ? selected.filter(x => x !== opt) : [...selected, opt]);
  };
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {options.map(opt => (
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

  const set = (field: keyof FormData, value: unknown) => {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => ({ ...e, [field]: undefined }));
  };

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
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) errs.contactEmail = 'Invalid email';
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
        <p className="text-slate-600 mb-6 max-w-md mx-auto">
          We received your application and will review it within 5–7 business days.
          You will receive an email at <strong>{form.contactEmail}</strong> when a decision is made.
        </p>
        <button
          onClick={() => router.push('/partners/training-provider')}
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
              <div className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full transition ${
                s === step
                  ? 'bg-brand-blue-600 text-white'
                  : i < stepIndex
                  ? 'bg-brand-green-100 text-brand-green-700'
                  : 'text-slate-400'
              }`}>
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
            <h2 className="text-lg font-bold text-slate-900">Organization Information</h2>
            <div>
              <Label required>Organization Name</Label>
              <Input value={form.orgName} onChange={e => set('orgName', e.target.value)} placeholder="Acme Training Institute" />
              <FieldError msg={errors.orgName} />
            </div>
            <div>
              <Label required>Organization Type</Label>
              <Select value={form.orgType} onChange={e => set('orgType', e.target.value)}>
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
                <Input value={form.ein} onChange={e => set('ein', e.target.value)} placeholder="12-3456789" />
              </div>
              <div>
                <Label>Website (optional)</Label>
                <Input value={form.website} onChange={e => set('website', e.target.value)} placeholder="https://example.org" type="url" />
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
                <Input value={form.contactName} onChange={e => set('contactName', e.target.value)} placeholder="Jane Smith" />
                <FieldError msg={errors.contactName} />
              </div>
              <div>
                <Label>Title</Label>
                <Input value={form.contactTitle} onChange={e => set('contactTitle', e.target.value)} placeholder="Executive Director" />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label required>Email</Label>
                <Input value={form.contactEmail} onChange={e => set('contactEmail', e.target.value)} type="email" placeholder="jane@example.org" />
                <FieldError msg={errors.contactEmail} />
              </div>
              <div>
                <Label required>Phone</Label>
                <Input value={form.contactPhone} onChange={e => set('contactPhone', e.target.value)} type="tel" placeholder="(317) 555-0100" />
                <FieldError msg={errors.contactPhone} />
              </div>
            </div>
            <div>
              <Label required>Street Address</Label>
              <Input value={form.addressLine1} onChange={e => set('addressLine1', e.target.value)} placeholder="123 Main St" />
              <FieldError msg={errors.addressLine1} />
            </div>
            <div>
              <Label>Suite / Unit (optional)</Label>
              <Input value={form.addressLine2} onChange={e => set('addressLine2', e.target.value)} placeholder="Suite 200" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <Label required>City</Label>
                <Input value={form.city} onChange={e => set('city', e.target.value)} placeholder="Indianapolis" />
                <FieldError msg={errors.city} />
              </div>
              <div>
                <Label required>State</Label>
                <Input value={form.state} onChange={e => set('state', e.target.value)} placeholder="IN" maxLength={2} />
              </div>
              <div>
                <Label required>ZIP</Label>
                <Input value={form.zip} onChange={e => set('zip', e.target.value)} placeholder="46201" maxLength={10} />
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
              <p className="text-xs text-slate-500 mb-3">Select all that apply.</p>
              <CheckboxGroup options={PROGRAM_TYPES} selected={form.programTypes} onChange={v => set('programTypes', v)} />
              <FieldError msg={errors.programTypes} />
            </div>
            <div>
              <Label>Credential Authorities</Label>
              <p className="text-xs text-slate-500 mb-3">Which bodies issue credentials for your programs?</p>
              <CheckboxGroup options={CREDENTIAL_AUTHORITIES} selected={form.credentialAuthorities} onChange={v => set('credentialAuthorities', v)} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Service Area</Label>
                <Input value={form.serviceArea} onChange={e => set('serviceArea', e.target.value)} placeholder="Marion County, Central Indiana" />
              </div>
              <div>
                <Label>Annual Enrollment (approx.)</Label>
                <Input value={form.annualEnrollment} onChange={e => set('annualEnrollment', e.target.value)} type="number" min="0" placeholder="50" />
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
                  onChange={e => set('wioaEligible', e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-brand-blue-600 focus:ring-brand-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-slate-700">WIOA Eligible</span>
                  <p className="text-xs text-slate-500">Your programs qualify for Workforce Innovation and Opportunity Act Individual Training Accounts.</p>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.etplListed}
                  onChange={e => set('etplListed', e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-brand-blue-600 focus:ring-brand-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-slate-700">ETPL Listed</span>
                  <p className="text-xs text-slate-500">Your organization is on a state Eligible Training Provider List.</p>
                </div>
              </label>
            </div>
            {form.etplListed && (
              <div>
                <Label>ETPL State</Label>
                <Input value={form.etplState} onChange={e => set('etplState', e.target.value)} placeholder="IN" maxLength={2} />
              </div>
            )}
            <div>
              <Label>Accreditation (optional)</Label>
              <Input value={form.accreditation} onChange={e => set('accreditation', e.target.value)} placeholder="ACCSC, COE, state licensure, etc." />
            </div>
          </div>
        )}

        {/* Step: Narrative */}
        {step === 'narrative' && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-slate-900">About Your Organization</h2>
            <div>
              <Label>Mission Statement</Label>
              <Textarea value={form.missionStatement} onChange={e => set('missionStatement', e.target.value)} placeholder="Describe your organization's mission and the populations you serve." />
            </div>
            <div>
              <Label>Outcomes & Track Record</Label>
              <Textarea value={form.outcomesDescription} onChange={e => set('outcomesDescription', e.target.value)} placeholder="Describe your employment outcomes, credential attainment rates, or other measurable results." />
            </div>
            <div>
              <Label>Partnership Goals</Label>
              <Textarea value={form.partnershipGoals} onChange={e => set('partnershipGoals', e.target.value)} placeholder="What are you hoping to achieve through this partnership?" />
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
                <ReviewRow label="Name" value={`${form.contactName}${form.contactTitle ? `, ${form.contactTitle}` : ''}`} />
                <ReviewRow label="Email" value={form.contactEmail} />
                <ReviewRow label="Phone" value={form.contactPhone} />
                <ReviewRow label="Address" value={`${form.addressLine1}${form.addressLine2 ? ` ${form.addressLine2}` : ''}, ${form.city}, ${form.state} ${form.zip}`} />
              </ReviewSection>

              <ReviewSection label="Programs">
                <ReviewRow label="Types" value={form.programTypes.join(', ')} />
                {form.credentialAuthorities.length > 0 && <ReviewRow label="Credentials" value={form.credentialAuthorities.join(', ')} />}
                {form.serviceArea && <ReviewRow label="Service Area" value={form.serviceArea} />}
              </ReviewSection>

              <ReviewSection label="Compliance">
                <ReviewRow label="WIOA Eligible" value={form.wioaEligible ? 'Yes' : 'No'} />
                <ReviewRow label="ETPL Listed" value={form.etplListed ? `Yes (${form.etplState})` : 'No'} />
                {form.accreditation && <ReviewRow label="Accreditation" value={form.accreditation} />}
              </ReviewSection>
            </div>

            <div className="border-t border-slate-100 pt-5">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.agreedToTerms}
                  onChange={e => set('agreedToTerms', e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-brand-blue-600 focus:ring-brand-blue-500"
                />
                <span className="text-sm text-slate-700">
                  I confirm that the information provided is accurate and that I am authorized to submit this application on behalf of my organization.
                  I understand that approval is subject to review and that Elevate for Humanity may request additional documentation.
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
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition"
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
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : 'Submit Application'}
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
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
      </div>
      <div className="px-4 py-3 space-y-1.5">{children}</div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex gap-3">
      <span className="text-slate-500 w-28 flex-shrink-0">{label}</span>
      <span className="text-slate-900 font-medium">{value}</span>
    </div>
  );
}
