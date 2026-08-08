'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ExternalLink, CheckCircle2, DollarSign } from 'lucide-react';
import { WORKONE_INDY_INTAKE_URL } from '@/lib/programs/funding-registry';

interface ProgramOption {
  id: string;
  title: string;
  slug: string;
  fundingTier: 'workforce-funded' | 'self-pay';
  wioaEligible: boolean;
  wrgEligible: boolean;
  topJobsStars: number | null;
}

interface IntakeFormInnerProps {
  programs: ProgramOption[];
  initialProgram?: string;
}

type ApiResult = Record<string, any>;

async function submitIntake(payload: Record<string, unknown>) {
  const endpoints = ['/api/apply', '/api/applications'];
  let lastError: unknown = null;

  for (const endpoint of endpoints) {
    try {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 20000);
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        credentials: 'same-origin',
        cache: 'no-store',
        signal: controller.signal,
        body: JSON.stringify(payload),
      });
      window.clearTimeout(timeout);
      const data = (await res.json().catch(() => ({}))) as ApiResult;
      return { res, data };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Application service unavailable');
}

export default function IntakeFormInner({ programs, initialProgram = '' }: IntakeFormInnerProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    programInterest: initialProgram,
    fundingInterest: '',
    workOneAppointmentConfirmed: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null);

  const selectedProgram = useMemo(
    () => programs.find((program) => program.slug === form.programInterest) ?? null,
    [form.programInterest, programs],
  );
  const fundedTrack = selectedProgram?.fundingTier === 'workforce-funded';

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
      ...(name === 'programInterest' ? { fundingInterest: '', workOneAppointmentConfirmed: false } : {}),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);

    if (!selectedProgram) {
      setResult({ success: false, error: 'Select a program before submitting.' });
      return;
    }

    if (fundedTrack && !form.workOneAppointmentConfirmed) {
      setResult({
        success: false,
        error:
          'Schedule your WorkOne intake appointment and confirm that step before submitting a funded-program application.',
      });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        program: form.programInterest,
        programSlug: form.programInterest,
        funding: form.fundingInterest,
        fundingType: form.fundingInterest,
        fundingTrack: fundedTrack ? 'workforce-funded' : 'self-pay',
        workOneAppointmentConfirmed: fundedTrack ? form.workOneAppointmentConfirmed : false,
        workOneAppointmentUrl: fundedTrack ? WORKONE_INDY_INTAKE_URL : null,
        source: 'quick-intake',
      };

      const { res, data } = await submitIntake(payload);
      if (res.ok && (data.ok ?? data.success ?? true)) {
        setResult({ success: true, message: 'Application received. Check your email for next steps.' });
        const q = new URLSearchParams();
        if (data.referenceNumber) q.set('ref', data.referenceNumber);
        if (data.program || form.programInterest) q.set('program', data.program || form.programInterest);
        q.set('track', fundedTrack ? 'workforce-funded' : 'self-pay');
        setTimeout(() => router.push(`/apply/success?${q.toString()}`), 1200);
      } else {
        setResult({ success: false, error: data.error || 'Something went wrong. Please try again.' });
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

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-base font-bold text-slate-900 mb-2">First Name *</label>
            <input id="firstName" name="firstName" required value={form.firstName} onChange={handleChange} className="w-full px-4 py-3.5 text-base text-slate-950 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-red-500" />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-base font-bold text-slate-900 mb-2">Last Name *</label>
            <input id="lastName" name="lastName" required value={form.lastName} onChange={handleChange} className="w-full px-4 py-3.5 text-base text-slate-950 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-red-500" />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-base font-bold text-slate-900 mb-2">Email Address *</label>
          <input type="email" id="email" name="email" required value={form.email} onChange={handleChange} className="w-full px-4 py-3.5 text-base text-slate-950 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-red-500" />
        </div>

        <div>
          <label htmlFor="phone" className="block text-base font-bold text-slate-900 mb-2">Phone Number *</label>
          <input type="tel" id="phone" name="phone" required value={form.phone} onChange={handleChange} className="w-full px-4 py-3.5 text-base text-slate-950 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-red-500" placeholder="(317) 314-3757" />
        </div>

        <div>
          <label htmlFor="programInterest" className="block text-base font-bold text-slate-900 mb-2">Program of Interest *</label>
          <select id="programInterest" name="programInterest" required value={form.programInterest} onChange={handleChange} className="w-full px-4 py-3.5 text-base text-slate-950 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-brand-red-500">
            <option value="">Select a program</option>
            <optgroup label="Workforce-funded programs">
              {programs.filter((p) => p.fundingTier === 'workforce-funded').map((p) => (
                <option key={p.id} value={p.slug}>{p.title}{p.topJobsStars ? ` · ${p.topJobsStars}★ Top Jobs` : ''}</option>
              ))}
            </optgroup>
            <optgroup label="Regular / self-pay programs">
              {programs.filter((p) => p.fundingTier === 'self-pay').map((p) => (
                <option key={p.id} value={p.slug}>{p.title}</option>
              ))}
            </optgroup>
          </select>
        </div>

        {selectedProgram && fundedTrack ? (
          <div className="rounded-2xl border-2 border-brand-green-300 bg-brand-green-50 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-brand-green-700" />
              <div>
                <h3 className="text-xl font-extrabold text-slate-950">WorkOne intake is required</h3>
                <p className="mt-2 text-base font-medium leading-relaxed text-slate-800">
                  This program is in Elevate&apos;s verified workforce-funded track. Funding is not approved by Elevate. WorkOne must determine eligibility and authorize WIOA or Workforce Ready Grant funding before funded enrollment is completed.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedProgram.wioaEligible && <span className="rounded-full bg-white px-3 py-1.5 text-sm font-bold text-brand-green-900 border border-brand-green-200">WIOA</span>}
                  {selectedProgram.wrgEligible && <span className="rounded-full bg-white px-3 py-1.5 text-sm font-bold text-brand-green-900 border border-brand-green-200">Workforce Ready Grant</span>}
                  {selectedProgram.topJobsStars && <span className="rounded-full bg-white px-3 py-1.5 text-sm font-bold text-slate-900 border border-slate-200">Top Jobs: {selectedProgram.topJobsStars}★</span>}
                </div>
                <a href={WORKONE_INDY_INTAKE_URL} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-red-600 px-5 py-3 text-base font-bold text-white hover:bg-brand-red-700">
                  Schedule WorkOne Intake <ExternalLink className="h-4 w-4" />
                </a>
                <label className="mt-5 flex items-start gap-3 rounded-xl bg-white p-4 border border-brand-green-200">
                  <input type="checkbox" name="workOneAppointmentConfirmed" checked={form.workOneAppointmentConfirmed} onChange={handleChange} required className="mt-1 h-5 w-5" />
                  <span className="text-base font-bold text-slate-900">I scheduled or already have my required WorkOne intake appointment.</span>
                </label>
              </div>
            </div>
          </div>
        ) : selectedProgram ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <DollarSign className="mt-0.5 h-6 w-6 shrink-0 text-slate-800" />
              <div>
                <h3 className="text-xl font-extrabold text-slate-950">Regular / self-pay program</h3>
                <p className="mt-2 text-base font-medium leading-relaxed text-slate-800">
                  This program is not currently in Elevate&apos;s verified WIOA/Workforce Ready Grant track under the ETPL + Top Jobs rule. Self-pay and available payment-plan options apply.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        <div>
          <label htmlFor="fundingInterest" className="block text-base font-bold text-slate-900 mb-2">Payment / funding path *</label>
          <select id="fundingInterest" name="fundingInterest" required value={form.fundingInterest} onChange={handleChange} className="w-full px-4 py-3.5 text-base text-slate-950 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-brand-red-500">
            <option value="">Select an option</option>
            {fundedTrack && selectedProgram?.wioaEligible && <option value="wioa">WIOA / WorkOne funding</option>}
            {fundedTrack && selectedProgram?.wrgEligible && <option value="wrg">Workforce Ready Grant</option>}
            {!fundedTrack && <option value="self_pay">Self-pay / Payment plan</option>}
            <option value="employer_sponsored">Employer sponsored</option>
            <option value="other">Other / Need guidance</option>
          </select>
        </div>

        {result?.error && <div role="alert" className="bg-red-50 border border-red-300 text-red-950 px-4 py-3 rounded-xl text-base font-bold">{result.error}</div>}

        <div className="sticky bottom-3 z-10 rounded-2xl bg-white/95 p-2 shadow-lg ring-1 ring-slate-200 backdrop-blur-sm sm:static sm:bg-transparent sm:p-0 sm:shadow-none sm:ring-0">
          <button type="submit" disabled={submitting} className="w-full bg-brand-red-600 hover:bg-brand-red-700 disabled:bg-slate-700 text-white text-lg font-extrabold py-4 rounded-xl transition-colors">
            {submitting ? 'Submitting...' : 'Submit Application'}
          </button>
        </div>

        <p className="text-sm font-medium text-slate-800 text-center">
          By submitting, you agree to our <Link href="/privacy" className="text-brand-red-700 font-bold hover:underline">Privacy Policy</Link>. Funding is never guaranteed and must be authorized by the responsible agency.
        </p>
      </form>
    </div>
  );
}
