'use client';

import { useState } from 'react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

const PROGRAMS = [
  { value: 'cosmetology-apprenticeship',     label: 'Cosmetology Apprenticeship (2,000 hrs)' },
  { value: 'esthetician-apprenticeship',     label: 'Esthetician Apprenticeship (700 hrs)' },
  { value: 'nail-technician-apprenticeship', label: 'Nail Technician Apprenticeship (400 hrs)' },
];

const FUNDING_OPTIONS = [
  { value: 'wioa',     label: 'WIOA / Workforce Ready Grant' },
  { value: 'self-pay', label: 'Self-Pay' },
  { value: 'employer', label: 'Employer Sponsored' },
  { value: 'unsure',   label: 'Not Sure Yet' },
];

type Status = 'idle' | 'submitting' | 'success' | 'error';

export default function MesmerizedApplyForm() {
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    city: '', zip: '', dateOfBirth: '',
    programInterest: '', fundingSource: '', priorExperience: '', notes: '',
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('submitting');
    setErrorMsg('');
    try {
      const res = await fetch('/api/schools/mesmerized-by-beauty/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? 'Submission failed');
      }
      setStatus('success');
    } catch (err: any) {
      setErrorMsg(err.message ?? 'Something went wrong. Please try again.');
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className="bg-white rounded-2xl p-8 text-center border border-purple-200">
        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        </div>
        <h3 className="text-2xl font-bold text-slate-900 mb-2">Application Received!</h3>
        <p className="text-slate-600">We'll review your application and reach out within 2 business days to discuss next steps and funding options.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 border border-purple-200 space-y-6">
      <h3 className="text-2xl font-bold text-slate-900">Apply Now</h3>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">First Name *</label>
          <input required value={form.firstName} onChange={set('firstName')} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Last Name *</label>
          <input required value={form.lastName} onChange={set('lastName')} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
          <input required type="email" value={form.email} onChange={set('email')} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Phone *</label>
          <input required type="tel" value={form.phone} onChange={set('phone')} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
          <input value={form.city} onChange={set('city')} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">ZIP Code</label>
          <input value={form.zip} onChange={set('zip')} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth</label>
          <input type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Program Interest *</label>
        <select required value={form.programInterest} onChange={set('programInterest')} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent">
          <option value="">Select a program…</option>
          {PROGRAMS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">How do you plan to pay for training?</label>
        <select value={form.fundingSource} onChange={set('fundingSource')} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent">
          <option value="">Select…</option>
          {FUNDING_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Prior Beauty Industry Experience</label>
        <textarea value={form.priorExperience} onChange={set('priorExperience')} rows={3} placeholder="Describe any relevant experience (optional)" className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Additional Notes</label>
        <textarea value={form.notes} onChange={set('notes')} rows={2} placeholder="Anything else you'd like us to know (optional)" className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
      </div>

      {status === 'error' && (
        <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3">{errorMsg}</p>
      )}

      <button type="submit" disabled={status === 'submitting'} className="w-full bg-purple-700 hover:bg-purple-800 disabled:opacity-60 text-white font-bold py-3 px-6 rounded-xl transition">
        {status === 'submitting' ? 'Submitting…' : 'Submit Application'}
      </button>

      <p className="text-xs text-slate-500 text-center">By submitting, you agree to be contacted by Mesmerized by Beauty and {PLATFORM_DEFAULTS.orgName} regarding your application.</p>
    </form>
  );
}
