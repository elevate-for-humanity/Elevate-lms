'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApplicationDraft } from '@/hooks/useApplicationDraft';
import {
  TRANSFER_HOURS_EVIDENCE_ACCEPT,
  uploadTransferHoursEvidence,
} from '@/lib/applications/upload-transfer-hours-evidence';
import ApprenticeshipFundingNotice from '@/components/apply/ApprenticeshipFundingNotice';
import { WORKONE_INDY_BOOKING_URL } from '@/lib/workone/booking';

const WORKONE_INTAKE_URL = WORKONE_INDY_BOOKING_URL;

interface StudentApplicationFormProps {
  initialProgram?: string;
  applicationIntent?: 'inquiry' | 'enrollment';
  paymentSessionId?: string;
}

type SubmissionResult = {
  success: boolean;
  message?: string;
  error?: string;
  warning?: string;
};

type ApiResult = Record<string, any>;

type StudentForm = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  preferredContact: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  countyOfResidence: string;
  program: string;
  modalityPreference: string;
  hasHostShop: string;
  hostShopName: string;
  transferHours: string;
  fundingSource: string;
  fundingEligibilityStatus: string;
  hasWorkOneReferral: string;
  workoneCenter: string;
  householdIncome: string;
  familySize: string;
  employmentStatus: string;
  currentEmployer: string;
  highestEducation: string;
  militaryConnected: string;
  felonRecord: string;
  felonDetails: string;
  hasCaseManager: string;
  caseManagerAgency: string;
  transportationNeeds: string;
  childcareNeeds: string;
  supportNeeds: string;
  goals: string;
  howDidYouHear: string;
};

type DraftData = {
  form: StudentForm;
  workOneAcknowledged: boolean;
  apprenticeshipFundingConfirmed?: boolean;
};

const PROGRAMS = [
  { value: 'cna', label: 'Certified Nursing Assistant (CNA)' },
  { value: 'medical-assistant', label: 'Medical Assistant' },
  { value: 'hvac-technician', label: 'HVAC Technician' },
  { value: 'cdl-training', label: 'CDL Training (Class A/B)' },
  { value: 'barber-apprenticeship', label: 'Barber Apprenticeship' },
  { value: 'cosmetology-apprenticeship', label: 'Cosmetology Apprenticeship' },
  { value: 'esthetician-apprenticeship', label: 'Esthetician Apprenticeship' },
  { value: 'financial-literacy', label: 'Financial Literacy' },
  { value: 'nail-technician-apprenticeship', label: 'Nail Technician Apprenticeship' },
  { value: 'phlebotomy', label: 'Phlebotomy Technician' },
  { value: 'qma', label: 'Qualified Medication Aide (QMA)' },
  { value: 'it-help-desk', label: 'IT Help Desk' },
  { value: 'bookkeeping', label: 'Bookkeeping & QuickBooks' },
  { value: 'welding', label: 'Welding' },
  { value: 'other', label: 'Other / Not sure yet' },
];

const STEP_LABELS = ['Contact', 'Program', 'Funding', 'Background', 'Review'];

function createSubmissionKey(): string {
  try {
    return globalThis.crypto.randomUUID();
  } catch {
    return `student-apply-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

async function postApplication(payload: Record<string, unknown>, idempotencyKey: string) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 20000);

  try {
    const res = await fetch('/api/applications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Idempotency-Key': idempotencyKey,
      },
      credentials: 'same-origin',
      cache: 'no-store',
      signal: controller.signal,
      body: JSON.stringify(payload),
    });
    const data = (await res.json().catch(() => ({}))) as ApiResult;
    return { res, data };
  } finally {
    window.clearTimeout(timeout);
  }
}

function createEmptyForm(initialProgram: string): StudentForm {
  return {
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    email: '',
    phone: '',
    preferredContact: 'phone',
    address: '',
    city: '',
    state: 'Indiana',
    zipCode: '',
    countyOfResidence: '',
    program: initialProgram,
    modalityPreference: '',
    hasHostShop: '',
    hostShopName: '',
    transferHours: '',
    fundingSource: initialProgram.includes('apprenticeship') ? 'self_pay' : '',
    fundingEligibilityStatus: '',
    hasWorkOneReferral: '',
    workoneCenter: '',
    householdIncome: '',
    familySize: '',
    employmentStatus: '',
    currentEmployer: '',
    highestEducation: '',
    militaryConnected: '',
    felonRecord: '',
    felonDetails: '',
    hasCaseManager: '',
    caseManagerAgency: '',
    transportationNeeds: '',
    childcareNeeds: '',
    supportNeeds: '',
    goals: '',
    howDidYouHear: '',
  };
}

export default function StudentApplicationForm({
  initialProgram = '',
  applicationIntent = 'inquiry',
  paymentSessionId = '',
}: StudentApplicationFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<StudentForm>(() => createEmptyForm(initialProgram));
  const [submissionKey] = useState(createSubmissionKey);
  const [step, setStep] = useState(1);
  const [showResume, setShowResume] = useState(false);
  const [workOneAcknowledged, setWorkOneAcknowledged] = useState(false);
  const [apprenticeshipFundingConfirmed, setApprenticeshipFundingConfirmed] = useState(false);
  const [consentAcknowledged, setConsentAcknowledged] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [transferHoursDocument, setTransferHoursDocument] = useState<File | null>(null);

  const { hasDraft, savedData, savedStep, savedAt, saveDraft, clearDraft } =
    useApplicationDraft<DraftData>('student-apply');

  useEffect(() => {
    if (hasDraft) setShowResume(true);
  }, [hasDraft]);

  const requiresWorkOne = form.fundingSource === 'wioa' || form.fundingSource === 'wrg';
  const isApprenticeship = form.program.includes('apprenticeship');
  const apprenticeshipFundingSelected =
    isApprenticeship && Boolean(form.fundingSource) && form.fundingSource !== 'self_pay';
  const transferHoursClaimed = Math.max(0, Number.parseInt(form.transferHours || '0', 10) || 0);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = e.target;
    setResult(null);
    if (name === 'program' && value.includes('apprenticeship')) {
      setForm((prev) => ({ ...prev, program: value, fundingSource: 'self_pay' }));
      setWorkOneAcknowledged(false);
      setApprenticeshipFundingConfirmed(false);
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === 'fundingSource' && value !== 'wioa' && value !== 'wrg') {
      setWorkOneAcknowledged(false);
    }
    if (name === 'fundingSource') setApprenticeshipFundingConfirmed(false);
    if (name === 'program' && !value.includes('apprenticeship')) {
      setTransferHoursDocument(null);
    }
    if (name === 'transferHours' && (Number.parseInt(value || '0', 10) || 0) <= 0) {
      setTransferHoursDocument(null);
    }
  }

  function persist(nextStep = step) {
    saveDraft({ form, workOneAcknowledged, apprenticeshipFundingConfirmed }, nextStep);
  }

  function resumeDraft() {
    if (!savedData) return;
    setForm(savedData.form);
    setWorkOneAcknowledged(savedData.workOneAcknowledged);
    setApprenticeshipFundingConfirmed(Boolean(savedData.apprenticeshipFundingConfirmed));
    setTransferHoursDocument(null);
    setStep(Math.min(Math.max(savedStep || 1, 1), 5));
    setShowResume(false);
  }

  function validateStep(current: number): string | null {
    if (current === 1) {
      if (!form.firstName || !form.lastName || !form.dateOfBirth || !form.email || !form.phone) {
        return 'Complete your name, date of birth, email, and phone number.';
      }
      if (!form.address || !form.city || !form.state || !form.zipCode) {
        return 'Complete your current address, city, state, and ZIP code.';
      }
    }
    if (current === 2) {
      if (!form.program) return 'Select a program of interest.';
      if (isApprenticeship && form.hasHostShop === 'yes' && !form.hostShopName) {
        return 'Enter the name of your current or proposed Host Shop.';
      }
      if (isApprenticeship && transferHoursClaimed > 0 && !transferHoursDocument) {
        return 'Upload documentation showing the apprenticeship hours you want transferred.';
      }
    }
    if (current === 3) {
      if (!form.fundingSource) return 'Select a funding/payment option or choose Not sure yet.';
      if (apprenticeshipFundingSelected && !apprenticeshipFundingConfirmed) {
        return 'Apprenticeship funding may only be selected when you already have written approval or Elevate specifically told you it is available.';
      }
      if (requiresWorkOne && !workOneAcknowledged) {
        return 'For WIOA or Workforce Ready Grant, confirm that you scheduled or started the WorkOne intake process.';
      }
    }
    return null;
  }

  function nextStep() {
    const error = validateStep(step);
    if (error) {
      setResult({ success: false, error });
      return;
    }
    const next = Math.min(step + 1, 5);
    persist(next);
    setStep(next);
    setResult(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function previousStep() {
    const previous = Math.max(step - 1, 1);
    persist(previous);
    setStep(previous);
    setResult(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);

    if (applicationIntent === 'enrollment' && !paymentSessionId) {
      setResult({
        success: false,
        error: 'Complete the verified payment or BNPL checkout before submitting this enrollment application.',
      });
      return;
    }

    const priorErrors = [1, 2, 3].map(validateStep).find(Boolean);
    if (priorErrors) {
      setResult({ success: false, error: priorErrors });
      return;
    }
    if (!consentAcknowledged) {
      setResult({
        success: false,
        error: 'Confirm the application certification and information-verification consent before submitting.',
      });
      return;
    }

    setSubmitting(true);

    const supportSummary = [
      form.employmentStatus ? `Employment status: ${form.employmentStatus}` : '',
      form.currentEmployer ? `Current employer: ${form.currentEmployer}` : '',
      form.highestEducation ? `Highest education: ${form.highestEducation}` : '',
      form.militaryConnected ? `Military connected: ${form.militaryConnected}` : '',
      form.felonRecord ? `Criminal record response: ${form.felonRecord}` : '',
      form.felonDetails ? `Record details: ${form.felonDetails}` : '',
      form.transportationNeeds ? `Transportation needs: ${form.transportationNeeds}` : '',
      form.childcareNeeds ? `Childcare needs: ${form.childcareNeeds}` : '',
      form.goals ? `Career goals: ${form.goals}` : '',
      form.supportNeeds ? `Other support needs: ${form.supportNeeds}` : '',
    ]
      .filter(Boolean)
      .join(' | ');

    const payload = {
      firstName: form.firstName,
      lastName: form.lastName,
      dateOfBirth: form.dateOfBirth,
      email: form.email,
      phone: form.phone,
      preferredContact: form.preferredContact,
      address: form.address,
      city: form.city,
      state: form.state,
      zip: form.zipCode,
      zipCode: form.zipCode,
      countyOfResidence: form.countyOfResidence || undefined,
      program: form.program,
      programSlug: form.program,
      modalityPreference: form.modalityPreference || undefined,
      hasHostShop: isApprenticeship ? form.hasHostShop || undefined : undefined,
      hostShopName: isApprenticeship ? form.hostShopName || undefined : undefined,
      transferHours: isApprenticeship ? form.transferHours || '0' : '0',
      fundingType: form.fundingSource,
      funding: form.fundingSource,
      fundingEligibilityStatus: form.fundingEligibilityStatus || undefined,
      householdIncome: form.householdIncome || undefined,
      familySize: form.familySize || undefined,
      hasCaseManager: form.hasCaseManager || undefined,
      caseManagerAgency: form.caseManagerAgency || undefined,
      supportNeeds: supportSummary || undefined,
      howDidYouHear: form.howDidYouHear || undefined,
      workoneIntakeCompleted: requiresWorkOne ? 'scheduled_or_in_process' : undefined,
      workOneAppointmentConfirmed: requiresWorkOne ? workOneAcknowledged : false,
      workoneCenter: requiresWorkOne ? form.workoneCenter || undefined : undefined,
      workoneChecklist: requiresWorkOne
        ? ['WorkOne intake appointment scheduled or intake process started']
        : undefined,
      workOneAppointmentUrl: requiresWorkOne ? WORKONE_INTAKE_URL : undefined,
      source: 'student-application',
      applicationCertification: true,
      applicationIntent,
      paymentSessionId: paymentSessionId || undefined,
      apprenticeshipFundingApprovalAcknowledged: apprenticeshipFundingSelected
        ? apprenticeshipFundingConfirmed
        : undefined,
    };

    try {
      if (isApprenticeship && transferHoursClaimed > 0) {
        if (!transferHoursDocument) {
          setResult({
            success: false,
            error: 'Upload documentation showing the apprenticeship hours you want transferred.',
          });
          return;
        }
        await uploadTransferHoursEvidence({
          file: transferHoursDocument,
          email: form.email,
          program: form.program,
          hoursClaimed: transferHoursClaimed,
        });
      }

      const { res, data } = await postApplication(payload, submissionKey);
      if (res.ok && (data.ok ?? data.success ?? true)) {
        clearDraft();
        const duplicateWarning = data.duplicateWarning || undefined;
        setResult({
          success: true,
          message: 'Application submitted successfully. Your application is now in the review workflow.',
          ...(duplicateWarning ? { warning: duplicateWarning } : {}),
        });
        const ref = data.referenceNumber || '';
        const prog = data.program || form.program || '';
        const q = new URLSearchParams();
        if (ref) q.set('ref', ref);
        if (prog) q.set('program', prog);
        const suffix = q.toString() ? `?${q.toString()}` : '';
        const nextStepUrl =
          typeof data.nextStepUrl === 'string' && data.nextStepUrl.startsWith('/')
            ? data.nextStepUrl
            : `/apply/success${suffix}`;
        setTimeout(() => router.push(nextStepUrl), 1200);
      } else {
        setResult({
          success: false,
          error: data.error || 'The application could not be submitted. Please review the form and try again.',
        });
      }
    } catch (error) {
      persist(step);
      setResult({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'The application service could not be reached. Your progress is saved on this device. Please try again. If the issue continues, call (317) 314-3757.',
      });
    } finally {
      setSubmitting(false);
    }
  }

  const fieldClass =
    'w-full rounded-lg border border-slate-400 bg-white px-4 py-3 text-base text-slate-950 focus:border-brand-red-600 focus:outline-none focus:ring-2 focus:ring-red-100';
  const labelClass = 'mb-1 block text-sm font-bold text-slate-950';

  if (result?.success) {
    return (
      <div className="rounded-xl border border-green-300 bg-white p-8 text-center sm:p-12">
        <h3 className="text-2xl font-black text-slate-950">Application Submitted</h3>
        <p className="mt-3 text-base text-slate-800">{result.message}</p>
        {result.warning && (
          <div className="mx-auto mt-4 max-w-md rounded-lg border border-amber-300 bg-amber-50 p-3 text-left text-sm text-amber-950">
            <strong>Note:</strong> {result.warning}
          </div>
        )}
        <p className="mt-4 text-sm font-semibold text-slate-800">Opening your confirmation page…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-slate-300 bg-white p-6 sm:p-8">
      {showResume && savedData && (
        <div className="mb-6 rounded-xl border border-blue-300 bg-blue-50 p-4 text-slate-950">
          <p className="font-black">You have a saved application</p>
          <p className="mt-1 text-sm">
            Saved {savedAt ? savedAt.toLocaleString() : 'recently'}. Resume where you left off or start fresh.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={resumeDraft} className="rounded-lg bg-brand-blue-700 px-4 py-2 text-sm font-bold text-white">
              Resume application
            </button>
            <button
              type="button"
              onClick={() => {
                clearDraft();
                setTransferHoursDocument(null);
                setShowResume(false);
              }}
              className="rounded-lg border border-slate-400 bg-white px-4 py-2 text-sm font-bold text-slate-950"
            >
              Start fresh
            </button>
          </div>
        </div>
      )}

      <div className="mb-8">
        <div className="mb-3 flex items-center justify-between text-sm font-bold text-slate-700">
          <span>Step {step} of 5</span>
          <button type="button" onClick={() => persist(step)} className="text-brand-blue-700 underline">
            Save progress
          </button>
        </div>
        <div className="grid grid-cols-5 gap-1">
          {STEP_LABELS.map((label, index) => {
            const number = index + 1;
            return (
              <div key={label} className="text-center">
                <div className={`h-2 rounded-full ${number <= step ? 'bg-brand-red-600' : 'bg-slate-200'}`} />
                <span className={`mt-2 hidden text-xs sm:block ${number === step ? 'font-black text-slate-950' : 'text-slate-500'}`}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {step === 1 && (
        <section className="space-y-5">
          <div>
            <h3 className="text-xl font-black text-slate-950">Personal and contact information</h3>
            <p className="mt-1 text-sm text-slate-700">Use your legal name and current contact information.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className={labelClass}>First Name *</label><input aria-label="First Name" name="firstName" required value={form.firstName} onChange={handleChange} className={fieldClass} autoComplete="given-name" /></div>
            <div><label className={labelClass}>Last Name *</label><input aria-label="Last Name" name="lastName" required value={form.lastName} onChange={handleChange} className={fieldClass} autoComplete="family-name" /></div>
            <div><label className={labelClass}>Date of Birth *</label><input aria-label="Date of Birth" type="date" name="dateOfBirth" required value={form.dateOfBirth} onChange={handleChange} className={fieldClass} /></div>
            <div><label className={labelClass}>Preferred Contact</label><select name="preferredContact" value={form.preferredContact} onChange={handleChange} className={fieldClass}><option value="phone">Phone</option><option value="text">Text</option><option value="email">Email</option></select></div>
            <div><label className={labelClass}>Email *</label><input aria-label="Email" type="email" name="email" required value={form.email} onChange={handleChange} className={fieldClass} autoComplete="email" /></div>
            <div><label className={labelClass}>Phone *</label><input aria-label="Phone" type="tel" name="phone" required value={form.phone} onChange={handleChange} className={fieldClass} autoComplete="tel" /></div>
            <div className="sm:col-span-2"><label className={labelClass}>Street Address *</label><input aria-label="Street Address" name="address" required value={form.address} onChange={handleChange} className={fieldClass} autoComplete="street-address" /></div>
            <div><label className={labelClass}>City *</label><input aria-label="City" name="city" required value={form.city} onChange={handleChange} className={fieldClass} /></div>
            <div><label className={labelClass}>State *</label><input aria-label="State" name="state" required value={form.state} onChange={handleChange} className={fieldClass} /></div>
            <div><label className={labelClass}>ZIP Code *</label><input aria-label="ZIP Code" name="zipCode" required value={form.zipCode} onChange={handleChange} className={fieldClass} inputMode="numeric" maxLength={10} /></div>
            <div><label className={labelClass}>County of Residence</label><input aria-label="County of Residence" name="countyOfResidence" value={form.countyOfResidence} onChange={handleChange} className={fieldClass} /></div>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="space-y-5">
          <div>
            <h3 className="text-xl font-black text-slate-950">Program and training preferences</h3>
            <p className="mt-1 text-sm text-slate-700">Tell us what you want to study and how you prefer to train.</p>
          </div>
          <div><label className={labelClass}>Program of Interest *</label><select name="program" required value={form.program} onChange={handleChange} className={fieldClass}><option value="">Select a program</option>{PROGRAMS.map((program) => <option key={program.value} value={program.value}>{program.label}</option>)}</select></div>
          <div><label className={labelClass}>Training Preference</label><select name="modalityPreference" value={form.modalityPreference} onChange={handleChange} className={fieldClass}><option value="">No preference</option><option value="in_person">In person</option><option value="hybrid">Hybrid</option><option value="online">Online where available</option></select></div>
          {isApprenticeship && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
              <h4 className="font-black text-slate-950">Apprenticeship placement information</h4>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div><label className={labelClass}>Do you already have a Host Shop?</label><select name="hasHostShop" value={form.hasHostShop} onChange={handleChange} className={fieldClass}><option value="">Select</option><option value="yes">Yes</option><option value="no">No</option><option value="need_help">I need placement help</option></select></div>
                <div><label className={labelClass}>Host Shop Name</label><input name="hostShopName" value={form.hostShopName} onChange={handleChange} className={fieldClass} /></div>
                <div><label className={labelClass}>Prior/Transfer Hours Claimed</label><input type="number" min="0" name="transferHours" value={form.transferHours} onChange={handleChange} className={fieldClass} /><p className="mt-1 text-xs text-slate-600">Claimed hours require documentation and verification before credit is awarded.</p></div>
                {transferHoursClaimed > 0 && (
                  <div className="sm:col-span-2 rounded-lg border border-amber-300 bg-amber-50 p-4">
                    <label className={labelClass}>Transfer Hours Documentation *</label>
                    <input
                      type="file"
                      required
                      accept={TRANSFER_HOURS_EVIDENCE_ACCEPT}
                      onChange={(event) => {
                        setTransferHoursDocument(event.target.files?.[0] ?? null);
                        setResult(null);
                      }}
                      className="block w-full rounded-lg border border-amber-300 bg-white px-3 py-3 text-sm text-slate-950 file:mr-4 file:rounded-md file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:font-bold file:text-white"
                    />
                    <p className="mt-2 text-xs font-semibold text-amber-950">Upload an official transcript, hours statement, state-board record, prior school record, or employer/apprenticeship hours verification. PDF, JPG, PNG, or WEBP; maximum 10 MB.</p>
                    {transferHoursDocument && <p className="mt-2 text-xs text-slate-700">Selected: {transferHoursDocument.name}</p>}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      {step === 3 && (
        <section className="space-y-5">
          <div><h3 className="text-xl font-black text-slate-950">Funding and eligibility</h3><p className="mt-1 text-sm text-slate-700">Funding eligibility is determined by the applicable workforce agency, not by submitting this form.</p></div>
          {isApprenticeship ? <ApprenticeshipFundingNotice /> : null}
          <div><label className={labelClass}>How do you plan to pay? *</label><select name="fundingSource" required value={form.fundingSource} onChange={handleChange} className={fieldClass}><option value="">Select an option</option><option value="self_pay">Self-pay / Payment plan</option><option value="wioa">WIOA / WorkOne funding{isApprenticeship ? ' — prior approval required' : ''}</option><option value="wrg">Workforce Ready Grant{isApprenticeship ? ' — prior approval required' : ''}</option><option value="jri">Job Ready Indy / Reentry funding{isApprenticeship ? ' — prior approval required' : ''}</option><option value="employer_sponsored">Employer sponsored{isApprenticeship ? ' — prior approval required' : ''}</option>{!isApprenticeship ? <option value="not_sure">Not sure yet</option> : null}</select></div>
          {apprenticeshipFundingSelected ? <label className="flex items-start gap-3 rounded-xl border-2 border-red-300 bg-red-50 p-4 text-sm font-bold text-red-950"><input type="checkbox" checked={apprenticeshipFundingConfirmed} onChange={(event) => setApprenticeshipFundingConfirmed(event.target.checked)} className="mt-1 h-5 w-5" /><span>I confirm that I already have written approval for this apprenticeship funding or an Elevate enrollment representative specifically told me it is available for my application.</span></label> : null}
          {requiresWorkOne && (
            <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-5 text-amber-950">
              <h4 className="font-black">WorkOne intake required for this funding path</h4>
              <p className="mt-2 text-sm leading-6">Schedule or begin your WorkOne intake before submitting a WIOA/WRG-funded application.</p>
              <a href={WORKONE_INTAKE_URL} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-extrabold text-white">Schedule WorkOne Intake</a>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div><label className={labelClass}>WorkOne Status</label><select name="fundingEligibilityStatus" value={form.fundingEligibilityStatus} onChange={handleChange} className={fieldClass}><option value="">Select</option><option value="needs_appointment">Need appointment</option><option value="appointment_scheduled">Appointment scheduled</option><option value="in_process">Eligibility in process</option><option value="approved">Approved / referred</option></select></div>
                <div><label className={labelClass}>WorkOne Center / Region</label><input name="workoneCenter" value={form.workoneCenter} onChange={handleChange} className={fieldClass} /></div>
              </div>
              <label className="mt-4 flex items-start gap-3 text-sm font-bold"><input type="checkbox" checked={workOneAcknowledged} onChange={(event) => setWorkOneAcknowledged(event.target.checked)} className="mt-1 h-5 w-5" /><span>I have scheduled the WorkOne intake appointment or I am already working with WorkOne on this funding request.</span></label>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className={labelClass}>Referred by WorkOne?</label><select name="hasWorkOneReferral" value={form.hasWorkOneReferral} onChange={handleChange} className={fieldClass}><option value="">Select</option><option value="yes">Yes</option><option value="no">No</option></select></div>
            <div><label className={labelClass}>Household Size</label><input type="number" min="1" name="familySize" value={form.familySize} onChange={handleChange} className={fieldClass} /></div>
            <div><label className={labelClass}>Approximate Annual Household Income</label><input type="number" min="0" name="householdIncome" value={form.householdIncome} onChange={handleChange} className={fieldClass} /><p className="mt-1 text-xs text-slate-600">Used only for preliminary funding/support screening. Workforce agencies make final eligibility decisions.</p></div>
          </div>
        </section>
      )}

      {step === 4 && (
        <section className="space-y-5">
          <div><h3 className="text-xl font-black text-slate-950">Background and support needs</h3><p className="mt-1 text-sm text-slate-700">These answers help admissions and workforce staff identify the correct pathway and support services.</p></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className={labelClass}>Employment Status</label><select name="employmentStatus" value={form.employmentStatus} onChange={handleChange} className={fieldClass}><option value="">Select</option><option value="unemployed">Unemployed</option><option value="part_time">Employed part-time</option><option value="full_time">Employed full-time</option><option value="self_employed">Self-employed</option></select></div>
            <div><label className={labelClass}>Current Employer</label><input name="currentEmployer" value={form.currentEmployer} onChange={handleChange} className={fieldClass} /></div>
            <div><label className={labelClass}>Highest Education</label><select name="highestEducation" value={form.highestEducation} onChange={handleChange} className={fieldClass}><option value="">Select</option><option value="less_than_hs">Less than high school</option><option value="hs_ged">High school / GED / HSE</option><option value="some_college">Some college</option><option value="associate">Associate degree</option><option value="bachelor_plus">Bachelor degree or higher</option></select></div>
            <div><label className={labelClass}>Military Connected?</label><select name="militaryConnected" value={form.militaryConnected} onChange={handleChange} className={fieldClass}><option value="">Select</option><option value="yes">Yes</option><option value="no">No</option></select></div>
            <div><label className={labelClass}>Criminal Record?</label><select name="felonRecord" value={form.felonRecord} onChange={handleChange} className={fieldClass}><option value="">Prefer not to answer / Select</option><option value="none">No</option><option value="misdemeanor">Misdemeanor</option><option value="felony">Felony</option></select></div>
            {form.felonRecord && form.felonRecord !== 'none' && <div><label className={labelClass}>Record Details / Reentry Support Needed</label><input name="felonDetails" value={form.felonDetails} onChange={handleChange} className={fieldClass} /></div>}
            <div><label className={labelClass}>Do you have a Case Manager?</label><select name="hasCaseManager" value={form.hasCaseManager} onChange={handleChange} className={fieldClass}><option value="">Select</option><option value="yes">Yes</option><option value="no">No</option></select></div>
            {form.hasCaseManager === 'yes' && <div><label className={labelClass}>Case Manager / Agency</label><input name="caseManagerAgency" value={form.caseManagerAgency} onChange={handleChange} className={fieldClass} /></div>}
            <div><label className={labelClass}>Transportation Support Needed?</label><select name="transportationNeeds" value={form.transportationNeeds} onChange={handleChange} className={fieldClass}><option value="">Select</option><option value="yes">Yes</option><option value="no">No</option></select></div>
            <div><label className={labelClass}>Childcare Support Needed?</label><select name="childcareNeeds" value={form.childcareNeeds} onChange={handleChange} className={fieldClass}><option value="">Select</option><option value="yes">Yes</option><option value="no">No</option></select></div>
          </div>
          <div><label className={labelClass}>Other Support Needs</label><textarea name="supportNeeds" rows={3} value={form.supportNeeds} onChange={handleChange} className={fieldClass} placeholder="Housing, technology, uniforms, testing accommodations, scheduling, etc." /></div>
          <div><label className={labelClass}>Career Goals</label><textarea name="goals" rows={3} value={form.goals} onChange={handleChange} className={fieldClass} /></div>
          <div><label className={labelClass}>How did you hear about Elevate?</label><select name="howDidYouHear" value={form.howDidYouHear} onChange={handleChange} className={fieldClass}><option value="">Select</option><option value="workone">WorkOne / workforce agency</option><option value="referral">Referral</option><option value="google">Google / web search</option><option value="social">Social media</option><option value="community">Community event / organization</option><option value="employer">Employer</option><option value="other">Other</option></select></div>
        </section>
      )}

      {step === 5 && (
        <section className="space-y-5">
          <div><h3 className="text-xl font-black text-slate-950">Review and certify</h3><p className="mt-1 text-sm text-slate-700">Review the key information below before submission.</p></div>
          <div className="grid gap-3 rounded-xl bg-slate-50 p-5 text-sm text-slate-900 sm:grid-cols-2">
            <p><strong>Applicant:</strong> {form.firstName} {form.lastName}</p>
            <p><strong>Program:</strong> {PROGRAMS.find((p) => p.value === form.program)?.label || form.program}</p>
            <p><strong>Email:</strong> {form.email}</p>
            <p><strong>Phone:</strong> {form.phone}</p>
            <p><strong>Location:</strong> {form.city}, {form.state} {form.zipCode}</p>
            <p><strong>Funding:</strong> {form.fundingSource || 'Not selected'}</p>
            {isApprenticeship && <p><strong>Host Shop:</strong> {form.hasHostShop === 'yes' ? form.hostShopName || 'Yes' : form.hasHostShop || 'Not provided'}</p>}
            {isApprenticeship && transferHoursClaimed > 0 && <p><strong>Transfer Hours:</strong> {transferHoursClaimed.toLocaleString()} claimed — evidence: {transferHoursDocument?.name || 'required'}</p>}
          </div>
          <label className="flex items-start gap-3 rounded-xl border border-slate-300 p-4 text-sm font-semibold leading-6 text-slate-900">
            <input type="checkbox" checked={consentAcknowledged} onChange={(event) => setConsentAcknowledged(event.target.checked)} className="mt-1 h-5 w-5 shrink-0" />
            <span>I certify that the information provided is accurate to the best of my knowledge. I authorize Elevate for Humanity to use this information for admissions, program placement, funding coordination, credential verification, and necessary communication with workforce or training partners involved in my enrollment. I understand that submitting an application does not guarantee admission or public funding.</span>
          </label>
        </section>
      )}

      {result?.error && <div role="alert" className="mt-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm font-bold text-red-950">{result.error}</div>}

      <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-between">
        {step > 1 ? <button type="button" onClick={previousStep} className="rounded-xl border-2 border-slate-300 px-6 py-3 font-bold text-slate-900">Back</button> : <span />}
        {step < 5 ? <button type="button" onClick={nextStep} className="rounded-xl bg-brand-red-600 px-8 py-3 font-extrabold text-white hover:bg-brand-red-700">Continue</button> : <button type="submit" disabled={submitting || (applicationIntent === 'enrollment' && !paymentSessionId)} className="rounded-xl bg-brand-red-600 px-8 py-3 font-extrabold text-white hover:bg-brand-red-700 disabled:cursor-not-allowed disabled:bg-slate-600">{submitting ? 'Submitting…' : applicationIntent === 'enrollment' && !paymentSessionId ? 'Payment Required to Submit' : 'Submit Application'}</button>}
      </div>
    </form>
  );
}
