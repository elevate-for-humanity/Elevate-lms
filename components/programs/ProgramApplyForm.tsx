'use client';

import { useState } from 'react';
import { submitStudentApplication } from '@/app/apply/actions';

interface Props {
  programSlug: string;
  programTitle: string;
}

const FUNDING_OPTIONS = [
  { value: 'wioa', label: 'WIOA / WorkOne' },
  { value: 'wrg', label: 'Workforce Ready Grant' },
  { value: 'employer', label: 'Employer Sponsored' },
  { value: 'self-pay', label: 'Self-Pay' },
  { value: 'unsure', label: 'Not Sure Yet' },
];

export default function ProgramApplyForm({ programSlug, programTitle }: Props) {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    zipCode: '',
    requestedFundingSource: '',
    goals: '',
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('submitting');
    setErrorMsg('');

    try {
      await submitStudentApplication({
        role: 'student',
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        zipCode: form.zipCode,
        // Use slug as programInterest so program_id resolves correctly in DB
        programInterest: programSlug,
        requestedFundingSource: form.requestedFundingSource,
        goals: form.goals,
        applicationType: 'enrollment',
        source: `program-page-${programSlug}`,
        // Required by interface — not shown to user on this short form
        password: Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2),
      });
      setStatus('success');
    } catch {
      setStatus('error');
      setErrorMsg('Something went wrong. Please try again or call us directly.');
    }
  }

  if (status === 'success') {
    return (
      <div className="rounded-2xl bg-brand-green-50 border border-brand-green-200 p-8 text-center">
        <div className="text-4xl mb-3">✅</div>
        <h3 className="text-xl font-bold text-brand-green-800 mb-2">Application Received!</h3>
        <p className="text-brand-green-700">
          Thank you for applying to <strong>{programTitle}</strong>. An enrollment advisor will
          contact you within 1 business day to discuss next steps and funding options.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor={`${programSlug}-firstName`} className="block text-sm font-medium text-slate-700 mb-1">
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            id={`${programSlug}-firstName`}
            name="firstName"
            type="text"
            required
            value={form.firstName}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red-500"
          />
        </div>
        <div>
          <label htmlFor={`${programSlug}-lastName`} className="block text-sm font-medium text-slate-700 mb-1">
            Last Name <span className="text-red-500">*</span>
          </label>
          <input
            id={`${programSlug}-lastName`}
            name="lastName"
            type="text"
            required
            value={form.lastName}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor={`${programSlug}-email`} className="block text-sm font-medium text-slate-700 mb-1">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            id={`${programSlug}-email`}
            name="email"
            type="email"
            required
            value={form.email}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red-500"
          />
        </div>
        <div>
          <label htmlFor={`${programSlug}-phone`} className="block text-sm font-medium text-slate-700 mb-1">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <input
            id={`${programSlug}-phone`}
            name="phone"
            type="tel"
            required
            value={form.phone}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor={`${programSlug}-zipCode`} className="block text-sm font-medium text-slate-700 mb-1">
            ZIP Code
          </label>
          <input
            id={`${programSlug}-zipCode`}
            name="zipCode"
            type="text"
            inputMode="numeric"
            maxLength={10}
            value={form.zipCode}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red-500"
          />
        </div>
        <div>
          <label htmlFor={`${programSlug}-funding`} className="block text-sm font-medium text-slate-700 mb-1">
            How do you plan to pay?
          </label>
          <select
            id={`${programSlug}-funding`}
            name="requestedFundingSource"
            value={form.requestedFundingSource}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red-500"
          >
            <option value="">Select an option</option>
            {FUNDING_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor={`${programSlug}-goals`} className="block text-sm font-medium text-slate-700 mb-1">
          Why are you interested in this program?
        </label>
        <textarea
          id={`${programSlug}-goals`}
          name="goals"
          rows={3}
          value={form.goals}
          onChange={handleChange}
          placeholder="Tell us a little about your goals..."
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red-500 resize-none"
        />
      </div>

      {status === 'error' && (
        <p className="text-sm text-red-600">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="w-full sm:w-auto px-8 py-3 bg-brand-red-600 hover:bg-brand-red-700 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors"
      >
        {status === 'submitting' ? 'Submitting…' : 'Submit Application'}
      </button>

      <p className="text-xs text-slate-500">
        By submitting, you agree to be contacted by an Elevate enrollment advisor. No payment is
        required at this stage.
      </p>
    </form>
  );
}
