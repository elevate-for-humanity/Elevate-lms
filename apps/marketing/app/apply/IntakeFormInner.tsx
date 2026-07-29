'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface IntakeFormInnerProps {
  programs: Array<{ id: string; title: string; slug: string }>;
}

export default function IntakeFormInner({ programs }: IntakeFormInnerProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    programInterest: '',
    fundingInterest: '',
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
      const res = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResult({ success: true, message: 'Application received! Check your email for next steps.' });
        setTimeout(() => router.push('/apply/success'), 1500);
      } else {
        setResult({ success: false, error: data.error || 'Something went wrong. Please try again.' });
      }
    } catch {
      setResult({ success: false, error: 'Network error. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      {result?.success ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Application Received!</h3>
          <p className="text-slate-600 mb-4">{result.message}</p>
          <p className="text-sm text-slate-500">Redirecting...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-slate-700 mb-1">
                First Name *
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                required
                value={form.firstName}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-transparent"
                placeholder="Jane"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-slate-700 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                required
                value={form.lastName}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-transparent"
                placeholder="Smith"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              value={form.email}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-transparent"
              placeholder="jane.smith@email.com"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-transparent"
              placeholder="(317) 314-3757"
            />
          </div>

          <div>
            <label htmlFor="programInterest" className="block text-sm font-medium text-slate-700 mb-1">
              Program of Interest
            </label>
            <select
              id="programInterest"
              name="programInterest"
              value={form.programInterest}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-transparent bg-white"
            >
              <option value="">Select a program</option>
              {programs.map(p => (
                <option key={p.id} value={p.slug}>{p.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="fundingInterest" className="block text-sm font-medium text-slate-700 mb-1">
              How do you plan to pay?
            </label>
            <select
              id="fundingInterest"
              name="fundingInterest"
              value={form.fundingInterest}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-transparent bg-white"
            >
              <option value="">Select an option</option>
              <option value="wioa">WIOA / WorkOne funding</option>
              <option value="wrg">Workforce Ready Grant</option>
              <option value="employ_indy">EmployIndy (Marion County)</option>
              <option value="employer_sponsored">Employer sponsored</option>
              <option value="self_pay">Self-pay / Payment plan</option>
              <option value="other">Other / Not sure yet</option>
            </select>
          </div>

          {result?.error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {result.error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-brand-red-600 hover:bg-brand-red-700 disabled:bg-slate-400 text-white font-bold py-4 rounded-xl transition-colors"
          >
            {submitting ? 'Submitting...' : 'Check My Eligibility'}
          </button>

          <p className="text-xs text-slate-500 text-center">
            By submitting, you agree to our{' '}
            <Link href="/privacy" className="text-brand-red-600 hover:underline">Privacy Policy</Link>.
            No commitment required.
          </p>
        </form>
      )}
    </div>
  );
}
