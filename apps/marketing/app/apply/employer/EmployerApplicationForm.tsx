'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function EmployerApplicationForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    industry: '',
    employeeCount: '',
    city: '',
    state: 'Indiana',
    website: '',
    interestedIn: '',
    hiringRoles: '',
    openings: '',
    wageRange: '',
    workSchedule: '',
    startTimeline: '',
    ojtInterest: '',
    apprenticeshipInterest: '',
    wexInterest: '',
    accommodations: '',
    notes: '',
  });
  const [draftReady, setDraftReady] = useState(false);
  const [draftNotice, setDraftNotice] = useState('');
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('elevate-employer-application-draft-v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          setForm(
            (current) =>
              Object.fromEntries(
                Object.entries(current).map(([key, value]) => [
                  key,
                  typeof parsed[key] === 'string' ? parsed[key].slice(0, 4000) : value,
                ]),
              ) as typeof current,
          );
          setDraftNotice(
            'Your unfinished application was restored. Please review it and certify it again before submitting.',
          );
        }
      }
    } catch {
      setDraftNotice(
        'Draft recovery is unavailable in this browser. Keep this page open until submission is confirmed.',
      );
    }
    setDraftReady(true);
  }, []);
  useEffect(() => {
    if (!draftReady) return;
    try {
      sessionStorage.setItem('elevate-employer-application-draft-v1', JSON.stringify(form));
    } catch {
      setDraftNotice(
        'Draft saving is unavailable in this browser. Keep this page open until submission is confirmed.',
      );
    }
  }, [form, draftReady]);
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message?: string; error?: string; reference?: string } | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setResult(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);

    if (!consent) {
      setResult({ success: false, error: 'Confirm the employer partnership certification before submitting.' });
      return;
    }

    setSubmitting(true);
    const hiringNeeds = [
      form.interestedIn ? `Primary interest: ${form.interestedIn}` : '',
      form.hiringRoles ? `Roles/occupations: ${form.hiringRoles}` : '',
      form.openings ? `Number of openings: ${form.openings}` : '',
      form.wageRange ? `Expected wage/range: ${form.wageRange}` : '',
      form.workSchedule ? `Work schedule: ${form.workSchedule}` : '',
      form.startTimeline ? `Hiring timeline: ${form.startTimeline}` : '',
      form.ojtInterest ? `OJT interest: ${form.ojtInterest}` : '',
      form.apprenticeshipInterest ? `Registered apprenticeship interest: ${form.apprenticeshipInterest}` : '',
      form.wexInterest ? `Work experience/WEX interest: ${form.wexInterest}` : '',
    ].filter(Boolean).join(' | ');

    const notes = [
      form.city || form.state ? `Location: ${[form.city, form.state].filter(Boolean).join(', ')}` : '',
      form.website ? `Website: ${form.website}` : '',
      form.accommodations ? `Accessibility/accommodation capacity or notes: ${form.accommodations}` : '',
      form.notes ? `Additional notes: ${form.notes}` : '',
      'Employer certification/partnership consent acknowledged: yes',
    ].filter(Boolean).join(' | ');

    try {
      const res = await fetch('/api/employer/apply', {
        method: 'POST',
        signal: AbortSignal.timeout(60_000),
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          companyName: form.companyName,
          contactName: form.contactName,
          email: form.email,
          phone: form.phone,
          industry: form.industry,
          employeeCount: form.employeeCount,
          hiringNeeds,
          notes,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        try { sessionStorage.removeItem('elevate-employer-application-draft-v1'); } catch { /* Submission is already confirmed. */ }
        const reference = data.referenceNumber || data.applicationId || '';
        setResult({
          success: true,
          reference,
          message: 'Employer partnership application received. Our workforce team will review your hiring and training needs.',
        });
        const q = new URLSearchParams();
        if (reference) q.set('ref', reference);
        q.set('type', 'employer');
        setTimeout(() => router.push(`/apply/success?${q.toString()}`), 1500);
      } else {
        setResult({ success: false, error: data.error || 'The employer application could not be submitted.' });
      }
    } catch {
      setResult({ success: false, error: 'Network error. Your employer application was not confirmed. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  }

  const fieldClass = 'w-full rounded-lg border border-slate-400 bg-white px-4 py-3 text-slate-950 focus:border-brand-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100';
  const labelClass = 'mb-1 block text-sm font-bold text-slate-950';

  if (result?.success) {
    return (
      <div className="rounded-xl border border-green-300 bg-white p-8 text-center">
        <h3 className="text-2xl font-black text-slate-950">Employer Application Received</h3>
        <p className="mt-3 text-slate-800">{result.message}</p>
        {result.reference && <p className="mt-4 rounded-lg bg-slate-100 p-3 font-bold">Reference: {result.reference}</p>}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-7">
      <p
        role="status"
        className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-slate-900"
      >
        {draftNotice ||
          'Your entries are kept in this browser tab while you finish. A saved draft is not a submitted application. Wait for a confirmation reference after submitting.'}
      </p>
      <section>
        <h3 className="mb-4 text-xl font-black text-slate-950">Company and contact</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><label htmlFor="companyName" className={labelClass}>Company / Organization Name *</label><input id="companyName" name="companyName" required value={form.companyName} onChange={handleChange} className={fieldClass} /></div>
          <div><label htmlFor="contactName" className={labelClass}>Primary Contact *</label><input id="contactName" name="contactName" required value={form.contactName} onChange={handleChange} className={fieldClass} /></div>
          <div><label htmlFor="email" className={labelClass}>Email *</label><input id="email" type="email" name="email" required value={form.email} onChange={handleChange} className={fieldClass} /></div>
          <div><label htmlFor="phone" className={labelClass}>Phone</label><input id="phone" type="tel" name="phone" value={form.phone} onChange={handleChange} className={fieldClass} /></div>
          <div><label htmlFor="industry" className={labelClass}>Industry</label><input id="industry" name="industry" value={form.industry} onChange={handleChange} className={fieldClass} placeholder="Healthcare, construction, transportation, etc." /></div>
          <div><label htmlFor="employeeCount" className={labelClass}>Employee Count</label><select id="employeeCount" name="employeeCount" value={form.employeeCount} onChange={handleChange} className={fieldClass}><option value="">Select</option><option value="1-10">1–10</option><option value="11-50">11–50</option><option value="51-200">51–200</option><option value="201-500">201–500</option><option value="500+">500+</option></select></div>
          <div><label htmlFor="city" className={labelClass}>City</label><input id="city" name="city" value={form.city} onChange={handleChange} className={fieldClass} /></div>
          <div><label htmlFor="state" className={labelClass}>State</label><input id="state" name="state" value={form.state} onChange={handleChange} className={fieldClass} /></div>
          <div className="sm:col-span-2"><label htmlFor="website" className={labelClass}>Company Website</label><input id="website" type="url" name="website" value={form.website} onChange={handleChange} className={fieldClass} placeholder="https://" /></div>
        </div>
      </section>

      <section className="border-t border-slate-200 pt-7">
        <h3 className="mb-4 text-xl font-black text-slate-950">Hiring and workforce needs</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label htmlFor="interestedIn" className={labelClass}>Primary Partnership Interest *</label><select id="interestedIn" name="interestedIn" required value={form.interestedIn} onChange={handleChange} className={fieldClass}><option value="">Select</option><option value="hire_graduates">Hire trained graduates</option><option value="sponsor_apprentice">Employ / host registered apprentices</option><option value="ojt">On-the-Job Training reimbursement</option><option value="wex">Work Experience / WEX</option><option value="custom_training">Custom training cohort</option><option value="multiple">Multiple workforce services</option></select></div>
          <div><label htmlFor="openings" className={labelClass}>Number of Current/Expected Openings</label><input id="openings" type="number" min="0" name="openings" value={form.openings} onChange={handleChange} className={fieldClass} /></div>
          <div className="sm:col-span-2"><label htmlFor="hiringRoles" className={labelClass}>Roles / Occupations You Need</label><textarea id="hiringRoles" name="hiringRoles" rows={3} value={form.hiringRoles} onChange={handleChange} className={fieldClass} placeholder="CNA, medical assistant, HVAC technician, CDL driver, barber, etc." /></div>
          <div><label htmlFor="wageRange" className={labelClass}>Expected Wage / Wage Range</label><input id="wageRange" name="wageRange" value={form.wageRange} onChange={handleChange} className={fieldClass} placeholder="$18–$24/hour" /></div>
          <div><label htmlFor="workSchedule" className={labelClass}>Work Schedule</label><input id="workSchedule" name="workSchedule" value={form.workSchedule} onChange={handleChange} className={fieldClass} placeholder="Full-time days, evenings, weekends, etc." /></div>
          <div><label htmlFor="startTimeline" className={labelClass}>Hiring Timeline</label><select id="startTimeline" name="startTimeline" value={form.startTimeline} onChange={handleChange} className={fieldClass}><option value="">Select</option><option value="immediate">Immediately</option><option value="30_days">Within 30 days</option><option value="60_90_days">Within 60–90 days</option><option value="ongoing">Ongoing hiring</option><option value="planning">Planning / future need</option></select></div>
        </div>
      </section>

      <section className="border-t border-slate-200 pt-7">
        <h3 className="mb-4 text-xl font-black text-slate-950">Workforce program participation</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div><label htmlFor="ojtInterest" className={labelClass}>Interested in OJT reimbursement?</label><select id="ojtInterest" name="ojtInterest" value={form.ojtInterest} onChange={handleChange} className={fieldClass}><option value="">Select</option><option value="yes">Yes</option><option value="no">No</option><option value="learn_more">Need information</option></select></div>
          <div><label htmlFor="apprenticeshipInterest" className={labelClass}>Registered Apprenticeship?</label><select id="apprenticeshipInterest" name="apprenticeshipInterest" value={form.apprenticeshipInterest} onChange={handleChange} className={fieldClass}><option value="">Select</option><option value="yes">Yes</option><option value="no">No</option><option value="learn_more">Need information</option></select></div>
          <div><label htmlFor="wexInterest" className={labelClass}>Work Experience / WEX?</label><select id="wexInterest" name="wexInterest" value={form.wexInterest} onChange={handleChange} className={fieldClass}><option value="">Select</option><option value="yes">Yes</option><option value="no">No</option><option value="learn_more">Need information</option></select></div>
        </div>
        <div className="mt-4"><label htmlFor="accommodations" className={labelClass}>Accessibility / Accommodation Capacity or Questions</label><textarea id="accommodations" name="accommodations" rows={2} value={form.accommodations} onChange={handleChange} className={fieldClass} /></div>
        <div className="mt-4"><label htmlFor="notes" className={labelClass}>Additional Information</label><textarea id="notes" name="notes" rows={3} value={form.notes} onChange={handleChange} className={fieldClass} /></div>
      </section>

      <label className="flex items-start gap-3 rounded-xl border border-slate-300 p-4 text-sm font-semibold leading-6 text-slate-900">
        <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-1 h-5 w-5 shrink-0" />
        <span>I certify that I am authorized to submit this employer partnership request and authorize Elevate for Humanity to contact the organization about hiring, OJT, apprenticeship, WEX, training, and related workforce services. Program participation and reimbursements remain subject to applicable workforce-agency eligibility and agreements.</span>
      </label>

      {result?.error && <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm font-bold text-red-950">{result.error}</div>}
      <button type="submit" disabled={submitting || !draftReady} className="w-full rounded-xl bg-brand-blue-700 py-4 font-extrabold text-white hover:bg-brand-blue-800 disabled:bg-slate-600">{submitting ? 'Submitting…' : 'Submit Employer Application'}</button>
    </form>
  );
}
