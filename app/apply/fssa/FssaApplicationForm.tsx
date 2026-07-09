'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { submitFssaApplication, type FssaApplicationData } from './actions';
import { CheckCircle, AlertCircle, ChevronRight, ChevronLeft } from 'lucide-react';
import { getActivePrograms } from '@/lib/program-registry';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

const EDUCATION_LEVELS = [
  'Less than high school',
  'High school diploma or GED',
  'Some college',
  'Associate degree',
  'Bachelor\'s degree or higher',
];

const TRANSPORTATION_OPTIONS = [
  'I have reliable transportation',
  'I use public transit',
  'I need transportation assistance',
  'I have no transportation',
];

const STEPS = [
  'Personal Information',
  'Benefits & Case Manager',
  'Program & Background',
  'Consent & Signature',
];

const EMPTY: FssaApplicationData = {
  firstName: '', lastName: '', dateOfBirth: '', phone: '', email: '',
  streetAddress: '', city: '', state: 'IN', zipCode: '',
  receivesSnap: false, receivesTanf: false, snapCaseNumber: '', tanfCaseNumber: '',
  hasCaseManager: false, caseManagerName: '', caseManagerAgency: '',
  caseManagerPhone: '', caseManagerEmail: '',
  programInterest: '', educationLevel: '', employed: false, employerName: '',
  transportation: '', childcare: false, housingStable: true, additionalBarriers: '',
  consentTruth: false, consentContact: false, consentRelease: false, signature: '',
};

function Field({ label, required, children, hint }: { label: string; required?: boolean; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
    </div>
  );
}

const inputCls = "w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent";
const checkCls = "w-4 h-4 rounded border-slate-300 text-brand-blue-600 focus:ring-brand-blue-500";

export default function FssaApplicationForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FssaApplicationData>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const set = (field: keyof FssaApplicationData, value: string | boolean) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const next = () => { setError(''); setStep(s => Math.min(s + 1, STEPS.length - 1)); window.scrollTo(0, 0); };
  const back = () => { setError(''); setStep(s => Math.max(s - 1, 0)); window.scrollTo(0, 0); };

  const validateStep = (): string => {
    if (step === 0) {
      if (!form.firstName.trim()) return 'First name is required.';
      if (!form.lastName.trim()) return 'Last name is required.';
      if (!form.phone.trim()) return 'Phone number is required.';
      if (!form.email.trim() || !form.email.includes('@')) return 'Valid email is required.';
      if (!form.streetAddress.trim()) return 'Street address is required.';
      if (!form.city.trim()) return 'City is required.';
      if (!form.zipCode.trim()) return 'ZIP code is required.';
    }
    if (step === 1) {
      if (!form.receivesSnap && !form.receivesTanf) return 'Please indicate whether you receive SNAP or TANF benefits.';
    }
    if (step === 2) {
      if (!form.programInterest) return 'Please select a program of interest.';
      if (!form.educationLevel) return 'Please select your education level.';
      if (!form.transportation) return 'Please select your transportation situation.';
    }
    if (step === 3) {
      if (!form.consentTruth) return 'You must certify that the information provided is true.';
      if (!form.consentContact) return 'You must consent to be contacted.';
      if (!form.signature.trim()) return 'Please type your full name as your signature.';
    }
    return '';
  };

  const handleNext = () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    if (step === STEPS.length - 1) { handleSubmit(); return; }
    next();
  };

  const handleSubmit = async () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    setSubmitting(true);
    setError('');
    const result = await submitFssaApplication(form);
    setSubmitting(false);
    if (result.success) {
      router.push('/apply/fssa/success');
    } else {
      setError(result.error ?? 'Submission failed. Please try again.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                i < step ? 'bg-brand-green-600 text-white' :
                i === step ? 'bg-brand-blue-600 text-white' :
                'bg-slate-200 text-slate-500'
              }`}>
                {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 w-8 sm:w-16 ${i < step ? 'bg-brand-green-600' : 'bg-slate-200'}`} />
              )}
            </div>
          ))}
        </div>
        <p className="text-sm font-semibold text-slate-700">Step {step + 1} of {STEPS.length}: {STEPS[step]}</p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Step 0 — Personal Information */}
      {step === 0 && (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="First Name" required>
              <input className={inputCls} value={form.firstName} onChange={e => set('firstName', e.target.value)} placeholder="First name" />
            </Field>
            <Field label="Last Name" required>
              <input className={inputCls} value={form.lastName} onChange={e => set('lastName', e.target.value)} placeholder="Last name" />
            </Field>
          </div>
          <Field label="Date of Birth" hint="Used for eligibility verification only.">
            <input type="date" className={inputCls} value={form.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)} />
          </Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Phone Number" required>
              <input type="tel" className={inputCls} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="(317) 000-0000" />
            </Field>
            <Field label="Email Address" required>
              <input type="email" className={inputCls} value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@email.com" />
            </Field>
          </div>
          <Field label="Street Address" required>
            <input className={inputCls} value={form.streetAddress} onChange={e => set('streetAddress', e.target.value)} placeholder="123 Main St" />
          </Field>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Field label="City" required>
              <input className={inputCls} value={form.city} onChange={e => set('city', e.target.value)} placeholder="Indianapolis" />
            </Field>
            <Field label="State">
              <input className={inputCls} value={form.state} onChange={e => set('state', e.target.value)} placeholder="IN" maxLength={2} />
            </Field>
            <Field label="ZIP Code" required>
              <input className={inputCls} value={form.zipCode} onChange={e => set('zipCode', e.target.value)} placeholder="46201" maxLength={10} />
            </Field>
          </div>
        </div>
      )}

      {/* Step 1 — Benefits & Case Manager */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-blue-800 mb-1">FSSA IMPACT Eligibility</p>
            <p className="text-sm text-blue-700">This program is funded through Indiana&apos;s FSSA IMPACT program for SNAP and TANF recipients. You must currently receive at least one of these benefits to qualify.</p>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-700">Which benefits do you currently receive? <span className="text-red-500">*</span></p>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className={checkCls} checked={form.receivesSnap} onChange={e => set('receivesSnap', e.target.checked)} />
              <span className="text-sm text-slate-700">SNAP (Food Stamps / EBT)</span>
            </label>
            {form.receivesSnap && (
              <Field label="SNAP Case Number" hint="Optional — helps us verify eligibility faster.">
                <input className={inputCls} value={form.snapCaseNumber} onChange={e => set('snapCaseNumber', e.target.value)} placeholder="Case number (optional)" />
              </Field>
            )}
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className={checkCls} checked={form.receivesTanf} onChange={e => set('receivesTanf', e.target.checked)} />
              <span className="text-sm text-slate-700">TANF (Temporary Assistance for Needy Families)</span>
            </label>
            {form.receivesTanf && (
              <Field label="TANF Case Number" hint="Optional — helps us verify eligibility faster.">
                <input className={inputCls} value={form.tanfCaseNumber} onChange={e => set('tanfCaseNumber', e.target.value)} placeholder="Case number (optional)" />
              </Field>
            )}
          </div>

          <div className="space-y-3 border-t border-slate-100 pt-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className={checkCls} checked={form.hasCaseManager} onChange={e => set('hasCaseManager', e.target.checked)} />
              <span className="text-sm font-semibold text-slate-700">I have a case manager or DFR worker</span>
            </label>
            {form.hasCaseManager && (
              <div className="space-y-3 pl-7">
                <Field label="Case Manager Name">
                  <input className={inputCls} value={form.caseManagerName} onChange={e => set('caseManagerName', e.target.value)} placeholder="Full name" />
                </Field>
                <Field label="Agency">
                  <input className={inputCls} value={form.caseManagerAgency} onChange={e => set('caseManagerAgency', e.target.value)} placeholder="e.g. DFR, WorkOne, Catholic Charities" />
                </Field>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Field label="Case Manager Phone">
                    <input type="tel" className={inputCls} value={form.caseManagerPhone} onChange={e => set('caseManagerPhone', e.target.value)} placeholder="(317) 000-0000" />
                  </Field>
                  <Field label="Case Manager Email">
                    <input type="email" className={inputCls} value={form.caseManagerEmail} onChange={e => set('caseManagerEmail', e.target.value)} placeholder="email@agency.gov" />
                  </Field>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 2 — Program & Background */}
      {step === 2 && (
        <div className="space-y-4">
          <Field label="Program of Interest" required>
            <select className={inputCls} value={form.programInterest} onChange={e => set('programInterest', e.target.value)}>
              <option value="">Select a program...</option>
              {getActivePrograms().map(p => <option key={p.slug} value={p.name}>{p.name}</option>)}
              <option value="Other / Not Sure Yet">Other / Not Sure Yet</option>
            </select>
          </Field>
          <Field label="Highest Education Level" required>
            <select className={inputCls} value={form.educationLevel} onChange={e => set('educationLevel', e.target.value)}>
              <option value="">Select...</option>
              {EDUCATION_LEVELS.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </Field>
          <div className="space-y-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className={checkCls} checked={form.employed} onChange={e => set('employed', e.target.checked)} />
              <span className="text-sm text-slate-700">I am currently employed</span>
            </label>
            {form.employed && (
              <Field label="Employer Name">
                <input className={inputCls} value={form.employerName} onChange={e => set('employerName', e.target.value)} placeholder="Employer name" />
              </Field>
            )}
          </div>
          <Field label="Transportation" required>
            <select className={inputCls} value={form.transportation} onChange={e => set('transportation', e.target.value)}>
              <option value="">Select...</option>
              {TRANSPORTATION_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <div className="space-y-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className={checkCls} checked={form.childcare} onChange={e => set('childcare', e.target.checked)} />
              <span className="text-sm text-slate-700">I need childcare assistance to participate in training</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className={checkCls} checked={!form.housingStable} onChange={e => set('housingStable', !e.target.checked)} />
              <span className="text-sm text-slate-700">I am experiencing housing instability</span>
            </label>
          </div>
          <Field label="Additional Barriers or Notes" hint="Optional — anything else we should know to support you.">
            <textarea className={inputCls} rows={3} value={form.additionalBarriers} onChange={e => set('additionalBarriers', e.target.value)} placeholder="Optional..." />
          </Field>
        </div>
      )}

      {/* Step 3 — Consent & Signature */}
      {step === 3 && (
        <div className="space-y-5">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm text-slate-600 space-y-2">
            <p className="font-semibold text-slate-800">Review your application before signing</p>
            <p><span className="font-medium">Name:</span> {form.firstName} {form.lastName}</p>
            <p><span className="font-medium">Program:</span> {form.programInterest || 'Not selected'}</p>
            <p><span className="font-medium">Benefits:</span> {[form.receivesSnap && 'SNAP', form.receivesTanf && 'TANF'].filter(Boolean).join(', ') || 'None indicated'}</p>
            <p><span className="font-medium">Phone:</span> {form.phone}</p>
            <p><span className="font-medium">Email:</span> {form.email}</p>
          </div>

          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" className={`${checkCls} mt-0.5`} checked={form.consentTruth} onChange={e => set('consentTruth', e.target.checked)} />
              <span className="text-sm text-slate-700">
                <span className="font-semibold">I certify</span> that the information I have provided is true and accurate to the best of my knowledge. I understand that providing false information may result in disqualification from the program. <span className="text-red-500">*</span>
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" className={`${checkCls} mt-0.5`} checked={form.consentContact} onChange={e => set('consentContact', e.target.checked)} />
              <span className="text-sm text-slate-700">
                <span className="font-semibold">I consent</span> to be contacted by ${PLATFORM_DEFAULTS.orgName} staff by phone, email, or text regarding my application and program enrollment. <span className="text-red-500">*</span>
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" className={`${checkCls} mt-0.5`} checked={form.consentRelease} onChange={e => set('consentRelease', e.target.checked)} />
              <span className="text-sm text-slate-700">
                <span className="font-semibold">I authorize</span> {PLATFORM_DEFAULTS.orgName} to share my application information with FSSA, DFR, and relevant workforce agencies for the purpose of verifying eligibility and coordinating services.
              </span>
            </label>
          </div>

          <Field label="Electronic Signature" required hint="Type your full legal name to sign this application.">
            <input
              className={inputCls}
              value={form.signature}
              onChange={e => set('signature', e.target.value)}
              placeholder="Type your full name"
            />
          </Field>

          <p className="text-xs text-slate-500">
            By submitting this form you agree to {PLATFORM_DEFAULTS.orgName}&apos;s{' '}
            <Link href="/legal/privacy" className="underline">Privacy Policy</Link> and{' '}
            <Link href="/legal" className="underline">Terms of Service</Link>.
            This application does not guarantee enrollment.
          </p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
        {step > 0 ? (
          <button type="button" onClick={back} className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
        ) : <div />}
        <button
          type="button"
          onClick={handleNext}
          disabled={submitting}
          className="flex items-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 disabled:opacity-60 text-white font-bold px-6 py-3 rounded-lg transition-colors text-sm"
        >
          {submitting ? 'Submitting...' : step === STEPS.length - 1 ? 'Submit Application' : 'Continue'}
          {!submitting && <ChevronRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
