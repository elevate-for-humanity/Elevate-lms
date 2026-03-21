'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function CnaWaitlistPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const form = e.currentTarget;
    const data = {
      full_name: (form.elements.namedItem('full_name') as HTMLInputElement).value,
      email: (form.elements.namedItem('email') as HTMLInputElement).value,
      phone: (form.elements.namedItem('phone') as HTMLInputElement).value,
      program_of_interest: 'CNA Certification',
      preferred_start_date: (form.elements.namedItem('preferred_start_date') as HTMLInputElement).value,
      city_state: (form.elements.namedItem('city_state') as HTMLInputElement).value,
      employed_in_healthcare: (form.elements.namedItem('employed_in_healthcare') as HTMLSelectElement).value,
    };
    try {
      const res = await fetch('/api/waitlist/cna', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Submission failed');
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again or contact us directly.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-100 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Link href="/programs/cna" className="text-brand-blue-600 text-sm font-semibold hover:underline mb-4 inline-block">
            ← CNA Program
          </Link>
          <p className="text-brand-blue-600 text-xs font-bold uppercase tracking-widest mb-2">CNA Program</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3">CNA Waiting List</h1>
          <p className="text-slate-600 text-base leading-relaxed">
            Complete the form below to join the waiting list for upcoming CNA cohorts. We will use this information to send official updates as program details are finalized.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-12">
        {submitted ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 mb-3">You&apos;re on the waiting list.</h2>
            <p className="text-slate-600 text-base leading-relaxed">
              We&apos;ll send updates as soon as enrollment details and cohort dates are finalized.
            </p>
            <Link href="/" className="mt-6 inline-block text-brand-blue-600 font-semibold text-sm hover:underline">
              Return to Home
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-8">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Join the CNA Waiting List</h2>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="full_name" className="block text-sm font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input id="full_name" name="full_name" type="text" required
                  className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                  placeholder="Your full name" />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input id="email" name="email" type="email" required
                  className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                  placeholder="you@email.com" />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-slate-700 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input id="phone" name="phone" type="tel" required
                  className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                  placeholder="(317) 555-0000" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Program of Interest
                </label>
                <input type="text" value="CNA Certification" readOnly
                  className="w-full border border-slate-100 rounded-lg px-4 py-2.5 text-sm text-slate-500 bg-slate-50 cursor-default" />
              </div>

              <div>
                <label htmlFor="preferred_start_date" className="block text-sm font-semibold text-slate-700 mb-1">
                  Preferred Start Date <span className="text-red-500">*</span>
                </label>
                <input id="preferred_start_date" name="preferred_start_date" type="text" required
                  className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                  placeholder="e.g. October 2025, As soon as possible" />
              </div>

              <div>
                <label htmlFor="city_state" className="block text-sm font-semibold text-slate-700 mb-1">
                  City and State <span className="text-red-500">*</span>
                </label>
                <input id="city_state" name="city_state" type="text" required
                  className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                  placeholder="Indianapolis, IN" />
              </div>

              <div>
                <label htmlFor="employed_in_healthcare" className="block text-sm font-semibold text-slate-700 mb-1">
                  Are you currently employed in healthcare? <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <select id="employed_in_healthcare" name="employed_in_healthcare"
                  className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue-500 bg-white">
                  <option value="">Prefer not to say</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-brand-blue-700 hover:bg-brand-blue-800 text-white font-bold py-3 rounded-xl transition-colors text-sm disabled:opacity-60">
                {loading ? 'Submitting…' : 'Join the Waiting List'}
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
