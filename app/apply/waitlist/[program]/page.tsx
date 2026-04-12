'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

const WAITLIST_PROGRAMS: Record<string, { name: string; description: string; estimatedWait: string }> = {
  'cdl-training': {
    name: 'CDL (Commercial Driver\'s License)',
    description: 'Earn your Class A CDL and launch a high-demand career in transportation and logistics.',
    estimatedWait: '4–8 weeks',
  },
  'barber-apprenticeship': {
    name: 'Barber Apprenticeship',
    description: 'Complete your Indiana barber apprenticeship and earn your license.',
    estimatedWait: '2–6 weeks',
  },
};

export default function WaitlistPage() {
  const params = useParams();
  const router = useRouter();
  const programSlug = params.program as string;
  const program = WAITLIST_PROGRAMS[programSlug];

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    fundingInterest: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; position?: number; message?: string; error?: string } | null>(null);

  if (!program) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center max-w-md px-6">
          <h1 className="text-2xl font-bold text-slate-800 mb-4">Program Not Found</h1>
          <p className="text-black mb-6">This program does not currently have a waitlist.</p>
          <Link href="/apply/student" className="text-brand-blue-600 underline">View all programs</Link>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName:       form.firstName,
          lastName:        form.lastName,
          email:           form.email,
          phone:           form.phone,
          programSlug,
          fundingInterest: form.fundingInterest,
          notes:           form.notes,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResult({ success: true, position: data.position, message: data.message });
      } else {
        setResult({ success: false, error: data.error ?? 'Something went wrong. Please try again.' });
      }
    } catch {
      setResult({ success: false, error: 'Network error. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  }

  if (result?.success) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg max-w-lg w-full p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-3">You're on the waitlist!</h2>
          <p className="text-black mb-2">
            You are <span className="font-bold text-brand-blue-600">#{result.position}</span> on the
            waitlist for <strong>{program.title || program?.title || program?.name}</strong>.
          </p>
          <p className="text-black text-sm mb-6">
            We'll email you as soon as a seat opens. Check your inbox for a confirmation.
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-left mb-6">
            <p className="text-sm font-semibold text-amber-800 mb-2">
              Indiana residents — start your funding now
            </p>
            <p className="text-sm text-amber-700 leading-relaxed">
              Don't wait for your seat to open. Visit{' '}
              <a href="https://www.workone.in.gov" target="_blank" rel="noopener noreferrer"
                 className="font-semibold underline">WorkOne</a>{' '}
              or{' '}
              <a href="https://www.employindy.org" target="_blank" rel="noopener noreferrer"
                 className="font-semibold underline">EmployIndy</a>{' '}
              (Marion County) to get pre-approved for WIOA or other funding.
              Pre-approval means you can enroll immediately when your spot is ready.
            </p>
          </div>

          <Link href="/" className="text-brand-blue-600 text-sm underline">Return to homepage</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <span className="inline-block bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
            Waitlist Open
          </span>
          <h1 className="text-3xl font-bold text-slate-800 mb-3">{program.title || program?.title || program?.name}</h1>
          <p className="text-black">{program.description}</p>
          <p className="text-sm text-black mt-2">
            Estimated wait: <strong>{program.estimatedWait}</strong>
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-6">Join the Waitlist</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">First Name *</label>
                <input
                  type="text" required
                  value={form.firstName}
                  onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent text-sm"
                  placeholder="First name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Last Name *</label>
                <input
                  type="text" required
                  value={form.lastName}
                  onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent text-sm"
                  placeholder="Last name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address *</label>
              <input
                type="email" required
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent text-sm"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent text-sm"
                placeholder="(317) 000-0000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                How do you plan to pay for this program?
              </label>
              <select
                value={form.fundingInterest}
                onChange={e => setForm(f => ({ ...f, fundingInterest: e.target.value }))}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent text-sm bg-white"
              >
                <option value="">Select an option</option>
                <option value="self_pay">Self-pay / Out of pocket</option>
                <option value="wioa">WIOA / WorkOne funding</option>
                <option value="employ_indy">EmployIndy (Marion County)</option>
                <option value="workforce_ready">Workforce Ready Grant</option>
                <option value="employer_sponsored">Employer sponsored</option>
                <option value="other_federal">Other federal/state funding</option>
                <option value="unsure">Not sure yet</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Anything else you'd like us to know? <span className="text-black font-normal">(optional)</span>
              </label>
              <textarea
                rows={3}
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent text-sm resize-none"
                placeholder="e.g. preferred start date, questions about the program..."
              />
            </div>

            {/* Funding disclosure */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-amber-800 mb-1">
                Important — State or Federal Funding
              </p>
              <p className="text-xs text-amber-700 leading-relaxed">
                If you plan to use WIOA, WorkOne, EmployIndy, Workforce Ready Grant, or any
                state/federal funding, you must receive <strong>written approval from your
                funding agency before enrollment can be finalized</strong>. We recommend
                starting that process now while you wait.{' '}
                <a href="https://www.workone.in.gov" target="_blank" rel="noopener noreferrer"
                   className="underline font-semibold">Find your WorkOne office →</a>
              </p>
            </div>

            {result?.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">{result.error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-brand-blue-600 hover:bg-brand-blue-700 disabled:opacity-60 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-sm"
            >
              {submitting ? 'Joining waitlist...' : 'Join the Waitlist'}
            </button>

            <p className="text-center text-xs text-black">
              Already approved for funding?{' '}
              <Link href={`/apply/student?program=${programSlug}`} className="text-brand-blue-600 underline">
                Apply to enroll directly →
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
