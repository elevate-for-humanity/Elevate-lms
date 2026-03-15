'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';

type SubmitState =
  | { type: 'idle' }
  | { type: 'loading' }
  | { type: 'success'; statusToken: string }
  | { type: 'error'; message: string };

const PROGRAM_OPTIONS = [
  { value: '', label: 'Select a program' },
  { value: 'HVAC', label: 'HVAC Technician' },
  { value: 'Barbering', label: 'Barber Training / Apprenticeship' },
  { value: 'CDL', label: 'Commercial Driver License (CDL)' },
  { value: 'CNA', label: 'Certified Nursing Assistant (CNA)' },
  { value: 'Medical Assistant', label: 'Medical Assistant' },
  { value: 'Phlebotomy', label: 'Phlebotomy Technician' },
  { value: 'Cybersecurity', label: 'Cybersecurity' },
  { value: 'IT Support', label: 'IT Support' },
  { value: 'Electrical', label: 'Electrical Apprenticeship' },
  { value: 'Welding', label: 'Welding' },
  { value: 'Cosmetology', label: 'Cosmetology' },
  { value: 'Business', label: 'Business / Entrepreneurship' },
  { value: 'Healthcare Other', label: 'Other Healthcare' },
  { value: 'Skilled Trades Other', label: 'Other Skilled Trades' },
  { value: 'Not sure yet', label: 'Not sure yet' },
];

const FUNDING_OPTIONS = [
  { value: '', label: 'Choose one' },
  { value: 'WIOA / workforce funding', label: 'WIOA / workforce funding' },
  { value: 'Employer sponsored', label: 'Employer sponsored' },
  { value: 'Self pay', label: 'Self pay' },
  { value: 'Not sure', label: 'Not sure — help me figure it out' },
];

const inputClass =
  'w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 focus:border-brand-blue-500 focus:ring-2 focus:ring-brand-blue-200 focus:outline-none transition';
const selectClass = `${inputClass} bg-white`;

export default function StartForm() {
  const searchParams = useSearchParams();
  const preselectedProgram = searchParams.get('program') || '';

  const [submitState, setSubmitState] = useState<SubmitState>({ type: 'idle' });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitState({ type: 'loading' });

    const formData = new FormData(e.currentTarget);

    const payload = {
      full_name: String(formData.get('full_name') || '').trim(),
      email: String(formData.get('email') || '').trim(),
      phone: String(formData.get('phone') || '').trim(),
      program_interest: String(formData.get('program_interest') || '').trim(),
      funding_interest: String(formData.get('funding_interest') || '').trim(),
      state: String(formData.get('state') || '').trim(),
      has_indiana_career_connect:
        String(formData.get('has_indiana_career_connect') || '') === 'yes',
      has_workone_appointment:
        String(formData.get('has_workone_appointment') || '') === 'yes',
    };

    try {
      const res = await fetch('/api/intake/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || 'Submission failed.');
      }

      setSubmitState({
        type: 'success',
        statusToken: data.statusToken,
      });
    } catch (err) {
      setSubmitState({
        type: 'error',
        message: err instanceof Error ? err.message : 'Something went wrong.',
      });
    }
  }

  if (submitState.type === 'success') {
    return (
      <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-green-100">
          <svg className="h-6 w-6 text-brand-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">You&apos;re in the system.</h2>
        <p className="mt-3 text-gray-700">
          We received your intake. Your next steps depend on your funding status,
          and we&apos;ll guide you through them.
        </p>

        <div className="mt-6 rounded-2xl bg-gray-50 p-4">
          <div className="font-medium text-gray-900">Track your status</div>
          <a
            href={`/status/application?token=${submitState.statusToken}`}
            className="mt-2 inline-block font-medium text-brand-blue-600 underline hover:text-brand-blue-800"
          >
            View your application tracker &rarr;
          </a>
        </div>

        <p className="mt-4 text-sm text-gray-500">
          Check your email — we&apos;ll send confirmation and next steps within 24 hours.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm"
    >
      <h2 className="mb-6 text-xl font-bold text-gray-900">Start your application</h2>

      <div className="grid gap-4">
        <div>
          <label htmlFor="full_name" className="mb-1 block text-sm font-medium text-gray-700">
            Full name
          </label>
          <input
            id="full_name"
            name="full_name"
            required
            autoComplete="name"
            className={inputClass}
            placeholder="First and last name"
          />
        </div>

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className={inputClass}
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="phone" className="mb-1 block text-sm font-medium text-gray-700">
            Phone <span className="text-slate-500">(optional)</span>
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            className={inputClass}
            placeholder="(317) 555-0100"
          />
        </div>

        <div>
          <label htmlFor="program_interest" className="mb-1 block text-sm font-medium text-gray-700">
            Program interest
          </label>
          <select
            id="program_interest"
            name="program_interest"
            required
            defaultValue={preselectedProgram}
            className={selectClass}
          >
            {PROGRAM_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="funding_interest" className="mb-1 block text-sm font-medium text-gray-700">
            How do you plan to pay?
          </label>
          <select
            id="funding_interest"
            name="funding_interest"
            required
            className={selectClass}
          >
            {FUNDING_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="state" className="mb-1 block text-sm font-medium text-gray-700">
            State
          </label>
          <input
            id="state"
            name="state"
            defaultValue="Indiana"
            autoComplete="address-level1"
            className={inputClass}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="has_indiana_career_connect"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Indiana Career Connect account?
            </label>
            <select
              id="has_indiana_career_connect"
              name="has_indiana_career_connect"
              required
              className={selectClass}
            >
              <option value="">Choose</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="has_workone_appointment"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              WorkOne appointment scheduled?
            </label>
            <select
              id="has_workone_appointment"
              name="has_workone_appointment"
              required
              className={selectClass}
            >
              <option value="">Choose</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
        </div>

        {submitState.type === 'error' && (
          <div className="rounded-2xl border border-brand-red-200 bg-brand-red-50 p-4 text-brand-red-700">
            {submitState.message}
          </div>
        )}

        <button
          type="submit"
          disabled={submitState.type === 'loading'}
          className="mt-2 rounded-2xl bg-brand-red-600 px-6 py-4 font-semibold text-white transition hover:bg-brand-red-700 disabled:opacity-60"
        >
          {submitState.type === 'loading' ? 'Submitting...' : 'Start my application'}
        </button>

        <p className="text-center text-xs text-slate-500">
          Your information is secure and never shared without your consent.
        </p>
      </div>
    </form>
  );
}
