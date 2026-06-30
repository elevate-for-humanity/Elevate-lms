'use client';

import Turnstile from '@/components/Turnstile';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getActivePrograms } from '@/lib/program-registry';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export default function QuickApplyForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!turnstileToken) {
      setError('Please complete the security check before submitting.');
      return;
    }
    setSubmitting(true);

    const fd = new FormData(e.currentTarget);

    try {
      const res = await fetch('/api/apply/student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: fd.get('firstName') as string,
          lastName: fd.get('lastName') as string,
          email: fd.get('email') as string,
          phone: fd.get('phone') as string,
          program: fd.get('programInterest') as string,
          source: 'quick_apply',
          turnstileToken,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || `Something went wrong. Please try again or call ${PLATFORM_DEFAULTS.supportPhone}.`);
        return;
      }

      router.push('/apply/confirmation');
    } catch {
      setError(`Something went wrong. Please try again or call ${PLATFORM_DEFAULTS.supportPhone}.`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-5"
    >
      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1" htmlFor="firstName">
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            required
            autoComplete="given-name"
            className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1" htmlFor="lastName">
            Last Name <span className="text-red-500">*</span>
          </label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            required
            autoComplete="family-name"
            className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1" htmlFor="email">
          Email Address <span className="text-red-500">*</span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1" htmlFor="phone">
          Phone Number <span className="text-red-500">*</span>
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          required
          autoComplete="tel"
          className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      <div>
        <label
          className="block text-sm font-semibold text-slate-700 mb-1"
          htmlFor="programInterest"
        >
          Program of Interest <span className="text-red-500">*</span>
        </label>
        <select
          id="programInterest"
          name="programInterest"
          required
          className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
        >
          <option value="">Select a program…</option>
          {getActivePrograms().map((p) => (
            <option key={p.slug} value={p.name}>
              {p.name}
            </option>
          ))}
          <option value="Other">Other / Not Sure Yet</option>
        </select>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      <Turnstile
        onVerify={setTurnstileToken}
        onExpire={() => setTurnstileToken('')}
        formId="quick-apply"
      />

      <button
        type="submit"
        disabled={submitting || !turnstileToken}
        className="w-full py-3 px-6 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {submitting ? 'Submitting…' : 'Submit Application'}
      </button>

      <p className="text-xs text-slate-500 text-center">
        We'll contact you within 1–2 business days. Need help?{' '}
        <a href={`tel:${PLATFORM_DEFAULTS.supportPhone.replace(/[^0-9]/g, "")}`} className="text-emerald-600 hover:underline">
          {PLATFORM_DEFAULTS.supportPhone}
        </a>
      </p>
    </form>
  );
}
