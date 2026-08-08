'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const WORKONE_INTAKE_URL = 'https://WorkOneIndy.as.me/IntakeApptwithCN';

interface StudentApplicationFormProps {
  initialProgram?: string;
}

type SubmissionResult = {
  success: boolean;
  message?: string;
  error?: string;
  warning?: string;
};

type ApiResult = Record<string, any>;

async function postApplication(payload: Record<string, unknown>) {
  const endpoints = ['/api/applications', '/api/apply'];
  let lastError: unknown = null;

  for (const endpoint of endpoints) {
    try {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 20000);
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'same-origin',
        cache: 'no-store',
        signal: controller.signal,
        body: JSON.stringify(payload),
      });
      window.clearTimeout(timeout);
      const data = (await res.json().catch(() => ({}))) as ApiResult;

      // A real HTTP response means the network path worked. Return it even when
      // validation failed so the applicant receives the server's useful message.
      return { res, data };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Application service unavailable');
}

export default function StudentApplicationForm({ initialProgram = '' }: StudentApplicationFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    program: initialProgram,
    fundingSource: '',
    hasWorkOneReferral: '',
    zipCode: '',
    militaryConnected: '',
    felonRecord: '',
    felonDetails: '',
    goals: '',
  });
  const [workOneAcknowledged, setWorkOneAcknowledged] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmissionResult | null>(null);

  const requiresWorkOne = form.fundingSource === 'wioa' || form.fundingSource === 'wrg';

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === 'fundingSource' && value !== 'wioa' && value !== 'wrg') {
      setWorkOneAcknowledged(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);

    if (requiresWorkOne && !workOneAcknowledged) {
      setResult({
        success: false,
        error:
          'WIOA and Workforce Ready Grant applicants must schedule or begin the WorkOne intake step before submitting this funded application.',
      });
      return;
    }

    setSubmitting(true);

    const payload = {
      ...form,
      fundingType: form.fundingSource || undefined,
      funding: form.fundingSource || undefined,
      zip: form.zipCode || undefined,
      workoneIntakeCompleted: requiresWorkOne ? 'scheduled_or_in_process' : undefined,
      workOneAppointmentConfirmed: requiresWorkOne ? workOneAcknowledged : false,
      workoneChecklist: requiresWorkOne
        ? ['WorkOne intake appointment scheduled or intake process started']
        : undefined,
      workOneAppointmentUrl: requiresWorkOne ? WORKONE_INTAKE_URL : undefined,
      source: 'student-application',
    };

    try {
      const { res, data } = await postApplication(payload);
      if (res.ok && (data.ok ?? data.success ?? true)) {
        const duplicateWarning = data.duplicateWarning || undefined;
        setResult({
          success: true,
          message:
            'Application submitted successfully. Your application is now in the review workflow.',
          ...(duplicateWarning ? { warning: duplicateWarning } : {}),
        });
        const ref = data.referenceNumber || '';
        const prog = data.program || form.program || '';
        const q = new URLSearchParams();
        if (ref) q.set('ref', ref);
        if (prog) q.set('program', prog);
        const suffix = q.toString() ? `?${q.toString()}` : '';
        setTimeout(() => router.push(`/apply/success${suffix}`), 1200);
      } else {
        setResult({
          success: false,
          error:
            data.error ||
            'The application could not be submitted. Please review the form and try again.',
        });
      }
    } catch {
      setResult({
        success: false,
        error:
          'The application service could not be reached. Please try again. If the issue continues, call (317) 314-3757.',
      });
    } finally {
      setSubmitting(false);
    }
  }

  const PROGRAMS = [
    { value: 'cna', label: 'Certified Nursing Assistant (CNA)' },
    { value: 'medical-assistant', label: 'Medical Assistant' },
    { value: 'hvac-technician', label: 'HVAC Technician' },
    { value: 'cdl-training', label: 'CDL Training (Class A/B)' },
    { value: 'barber-apprenticeship', label: 'Barber Apprenticeship' },
    { value: 'cosmetology-apprenticeship', label: 'Cosmetology Apprenticeship' },
    { value: 'phlebotomy', label: 'Phlebotomy Technician' },
    { value: 'qma', label: 'Qualified Medication Aide (QMA)' },
    { value: 'it-help-desk', label: 'IT Help Desk' },
    { value: 'bookkeeping', label: 'Bookkeeping & QuickBooks' },
    { value: 'welding', label: 'Welding' },
    { value: 'other', label: 'Other / Not sure yet' },
  ];

  const fieldClass =
    'w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-base text-slate-950 focus:border-transparent focus:ring-2 focus:ring-brand-red-500';
  const labelClass = 'mb-1 block text-sm font-bold text-slate-900';

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
      {result?.success ? (
        <div className="py-12 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-10 w-10 text-green-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="mb-3 text-2xl font-bold text-slate-950">Application Submitted</h3>
          <p className="mb-2 text-base text-slate-800">{result.message}</p>
          {result.warning && (
            <div className="mx-auto mt-4 max-w-md rounded-lg border border-amber-300 bg-amber-50 p-3 text-left">
              <p className="text-sm text-amber-950">
                <strong>Note:</strong> {result.warning}
              </p>
            </div>
          )}
          <p className="mt-3 text-sm font-semibold text-slate-800">Opening your confirmation page…</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="firstName" className={labelClass}>First Name *</label>
              <input type="text" id="firstName" name="firstName" required value={form.firstName} onChange={handleChange} className={fieldClass} autoComplete="given-name" />
            </div>
            <div>
              <label htmlFor="lastName" className={labelClass}>Last Name *</label>
              <input type="text" id="lastName" name="lastName" required value={form.lastName} onChange={handleChange} className={fieldClass} autoComplete="family-name" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="email" className={labelClass}>Email Address *</label>
              <input type="email" id="email" name="email" required value={form.email} onChange={handleChange} className={fieldClass} autoComplete="email" />
            </div>
            <div>
              <label htmlFor="phone" className={labelClass}>Phone Number *</label>
              <input type="tel" id="phone" name="phone" required value={form.phone} onChange={handleChange} className={fieldClass} autoComplete="tel" />
            </div>
          </div>

          <div>
            <label htmlFor="program" className={labelClass}>Program of Interest *</label>
            <select id="program" name="program" required value={form.program} onChange={handleChange} className={fieldClass}>
              <option value="">Select a program</option>
              {PROGRAMS.map((program) => <option key={program.value} value={program.value}>{program.label}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="fundingSource" className={labelClass}>How do you plan to pay?</label>
            <select id="fundingSource" name="fundingSource" value={form.fundingSource} onChange={handleChange} className={fieldClass}>
              <option value="">Select an option</option>
              <option value="wioa">WIOA / WorkOne funding</option>
              <option value="wrg">Workforce Ready Grant</option>
              <option value="jri">Job Ready Indy / Reentry funding</option>
              <option value="employer_sponsored">Employer sponsored</option>
              <option value="self_pay">Self-pay / Payment plan</option>
              <option value="not_sure">Not sure yet</option>
            </select>
          </div>

          {requiresWorkOne && (
            <section className="rounded-xl border-2 border-amber-300 bg-amber-50 p-5" aria-labelledby="workone-required-heading">
              <h3 id="workone-required-heading" className="text-lg font-black text-amber-950">WorkOne intake is required for this funding path</h3>
              <p className="mt-2 text-sm font-medium leading-6 text-amber-950">Before Elevate can treat this as a WIOA/Workforce Ready Grant-funded application, schedule or begin your WorkOne intake. Funding is not guaranteed by submitting this form.</p>
              <a href={WORKONE_INTAKE_URL} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-extrabold text-white hover:bg-slate-800">Schedule WorkOne Intake</a>
              <label className="mt-4 flex items-start gap-3 text-sm font-bold text-amber-950">
                <input type="checkbox" checked={workOneAcknowledged} onChange={(event) => setWorkOneAcknowledged(event.target.checked)} className="mt-1 h-5 w-5 shrink-0" />
                <span>I have scheduled the WorkOne intake appointment or I am already working with WorkOne on this funding request.</span>
              </label>
            </section>
          )}

          <div>
            <label htmlFor="zipCode" className={labelClass}>ZIP Code</label>
            <input type="text" id="zipCode" name="zipCode" value={form.zipCode} onChange={handleChange} className={fieldClass} inputMode="numeric" maxLength={5} />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="hasWorkOneReferral" className={labelClass}>Referred by WorkOne?</label>
              <select id="hasWorkOneReferral" name="hasWorkOneReferral" value={form.hasWorkOneReferral} onChange={handleChange} className={fieldClass}><option value="">Select</option><option value="yes">Yes</option><option value="no">No</option></select>
            </div>
            <div>
              <label htmlFor="militaryConnected" className={labelClass}>Military connected?</label>
              <select id="militaryConnected" name="militaryConnected" value={form.militaryConnected} onChange={handleChange} className={fieldClass}><option value="">Select</option><option value="yes">Yes</option><option value="no">No</option></select>
            </div>
            <div>
              <label htmlFor="felonRecord" className={labelClass}>Criminal record?</label>
              <select id="felonRecord" name="felonRecord" value={form.felonRecord} onChange={handleChange} className={fieldClass}><option value="">Select</option><option value="none">No</option><option value="misdemeanor">Misdemeanor</option><option value="felony">Felony</option></select>
            </div>
          </div>

          <div>
            <label htmlFor="goals" className={labelClass}>Career goals (optional)</label>
            <textarea id="goals" name="goals" value={form.goals} onChange={handleChange} rows={3} className={fieldClass} />
          </div>

          {result?.error && <div role="alert" className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm font-bold text-red-950">{result.error}</div>}

          <div className="sticky bottom-3 z-10 rounded-2xl bg-white/95 p-2 shadow-lg ring-1 ring-slate-200 backdrop-blur-sm sm:static sm:bg-transparent sm:p-0 sm:shadow-none sm:ring-0">
            <button type="submit" disabled={submitting} className="w-full rounded-xl bg-brand-red-600 py-4 text-base font-extrabold text-white transition-colors hover:bg-brand-red-700 disabled:cursor-wait disabled:bg-slate-700">
              {submitting ? 'Submitting…' : 'Submit Application'}
            </button>
          </div>

          <p className="text-center text-sm font-medium leading-6 text-slate-800">By submitting, you agree to the Privacy Policy. Submission does not guarantee admission or public funding.</p>
        </form>
      )}
    </div>
  );
}
