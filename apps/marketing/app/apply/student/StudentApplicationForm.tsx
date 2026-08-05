'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface StudentApplicationFormProps {
  initialProgram?: string;
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
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message?: string;
    error?: string;
  } | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);

    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          source: 'student-application',
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        const duplicateWarning = data.duplicateWarning || undefined;
        setResult({
          success: true,
          message: 'Application submitted successfully! We will contact you within one business day.',
          ...(duplicateWarning ? { warning: duplicateWarning } : {}),
        });
        const ref = data.referenceNumber || '';
        const prog = data.program || '';
        const q = new URLSearchParams();
        if (ref) q.set('ref', ref);
        if (prog) q.set('program', prog);
        const suffix = q.toString() ? '?' + q.toString() : '';
        setTimeout(() => router.push('/apply/success' + suffix), 3000);
      } else {
        setResult({ success: false, error: data.error || 'Something went wrong. Please try again.' });
      }
    } catch {
      setResult({ success: false, error: 'Network error. Please try again.' });
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

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      {result?.success ? (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-3">Application Submitted!</h3>
          <p className="text-slate-600 mb-2">{result.message}</p>
          {result.warning && (
            <div className="mt-4 mx-auto max-w-md bg-amber-50 border border-amber-200 rounded-lg p-3 text-left">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> {result.warning}
              </p>
            </div>
          )}
          <p className="text-sm text-slate-500 mt-3">Redirecting...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-slate-700 mb-1">First Name *</label>
              <input type="text" id="firstName" name="firstName" required value={form.firstName} onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-transparent"
                placeholder="Jane" />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-slate-700 mb-1">Last Name *</label>
              <input type="text" id="lastName" name="lastName" required value={form.lastName} onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-transparent"
                placeholder="Smith" />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Email Address *</label>
              <input type="email" id="email" name="email" required value={form.email} onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-transparent"
                placeholder="jane.smith@email.com" />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
              <input type="tel" id="phone" name="phone" value={form.phone} onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-transparent"
                placeholder="(317) 314-3757" />
            </div>
          </div>

          <div>
            <label htmlFor="program" className="block text-sm font-medium text-slate-700 mb-1">Program of Interest *</label>
            <select id="program" name="program" required value={form.program} onChange={handleChange}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-transparent bg-white">
              <option value="">Select a program</option>
              {PROGRAMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="fundingSource" className="block text-sm font-medium text-slate-700 mb-1">How do you plan to pay?</label>
            <select id="fundingSource" name="fundingSource" value={form.fundingSource} onChange={handleChange}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-transparent bg-white">
              <option value="">Select an option</option>
              <option value="wioa">WIOA / WorkOne funding</option>
              <option value="wrg">Workforce Ready Grant</option>
              <option value="jri">Job Ready Indy (Justice-Involved)</option>
              <option value="employer_sponsored">Employer sponsored</option>
              <option value="self_pay">Self-pay / Payment plan</option>
              <option value="not_sure">Not sure yet</option>
            </select>
          </div>

          <div>
            <label htmlFor="zipCode" className="block text-sm font-medium text-slate-700 mb-1">ZIP Code</label>
            <input type="text" id="zipCode" name="zipCode" value={form.zipCode} onChange={handleChange}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-transparent"
              placeholder="46204" maxLength={5} />
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="hasWorkOneReferral" className="block text-sm font-medium text-slate-700 mb-1">Referred by WorkOne?</label>
              <select id="hasWorkOneReferral" name="hasWorkOneReferral" value={form.hasWorkOneReferral} onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-transparent bg-white">
                <option value="">Select</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
            <div>
              <label htmlFor="militaryConnected" className="block text-sm font-medium text-slate-700 mb-1">Military connected?</label>
              <select id="militaryConnected" name="militaryConnected" value={form.militaryConnected} onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-transparent bg-white">
                <option value="">Select</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
            <div>
              <label htmlFor="felonRecord" className="block text-sm font-medium text-slate-700 mb-1">Criminal record?</label>
              <select id="felonRecord" name="felonRecord" value={form.felonRecord} onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-transparent bg-white">
                <option value="">Select</option>
                <option value="none">No</option>
                <option value="misdemeanor">Misdemeanor</option>
                <option value="felony">Felony</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="goals" className="block text-sm font-medium text-slate-700 mb-1">Career goals (optional)</label>
            <textarea id="goals" name="goals" value={form.goals} onChange={handleChange} rows={3}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-transparent"
              placeholder="Tell us about your career goals and any questions you have..." />
          </div>

          {result?.error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {result.error}
            </div>
          )}

          <button type="submit" disabled={submitting}
            className="w-full bg-brand-red-600 hover:bg-brand-red-700 disabled:bg-slate-400 text-white font-bold py-4 rounded-xl transition-colors">
            {submitting ? 'Submitting...' : 'Submit Application'}
          </button>

          <p className="text-xs text-slate-500 text-center">
            By submitting, you agree to our Privacy Policy. No commitment required.
            We will contact you within one business day to schedule your orientation.
          </p>
        </form>
      )}
    </div>
  );
}
