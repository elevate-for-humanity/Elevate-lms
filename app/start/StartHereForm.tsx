'use client';

import { useState } from 'react';
import { ArrowRight, CheckCircle, Loader2 } from 'lucide-react';

const PROGRAMS = [
  'HVAC / Building Technician',
  'Certified Nursing Assistant (CNA)',
  "Commercial Driver's License (CDL)",
  'Barber Apprenticeship',
  'Cosmetology Apprenticeship',
  'IT Help Desk Technician',
  'Cybersecurity Analyst',
  'Medical Assistant',
  'Pharmacy Technician',
  'Phlebotomy',
  'Welding',
  'Electrical Apprenticeship',
  'Plumbing',
  'Diesel Mechanic',
  'Forklift Operator',
  'Tax Preparation',
  'Bookkeeping & Accounting',
  'Business Administration',
  'Software Development',
  'Web Development',
  'Peer Recovery Specialist',
  'CPR, AED & First Aid',
  'Other / Not Sure Yet',
];

export default function StartHereForm() {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const fd = new FormData(e.currentTarget);
    const [firstName, ...rest] = (fd.get('name') as string).trim().split(' ');
    const lastName = rest.join(' ') || '';

    try {
      const res = await fetch('/api/intake/interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          email: fd.get('email'),
          phone: fd.get('phone'),
          careerInterest: fd.get('program'),
          source: 'start-page',
        }),
      });

      if (!res.ok) throw new Error('Submission failed');
      setStep('success');
    } catch {
      setError('Something went wrong. Please try again or call us directly.');
    } finally {
      setLoading(false);
    }
  }

  if (step === 'success') {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="w-14 h-14 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-brand-green-600" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 mb-2">You're on your way</h2>
        <p className="text-slate-600 mb-6">
          A career advisor will reach out within one business day to walk you through
          funding options and next steps. No paperwork yet — just a conversation.
        </p>
        <div className="bg-white rounded-xl p-4 text-left space-y-2 text-sm text-slate-700">
          <p className="font-semibold text-slate-900 mb-1">What happens next:</p>
          <p>1. Advisor calls or emails you within 1 business day</p>
          <p>2. We check your eligibility for free training funding</p>
          <p>3. You enroll — we handle the paperwork</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <h2 className="text-2xl font-extrabold text-slate-900 mb-1">Start Your Application</h2>
      <p className="text-slate-500 text-sm mb-6">
        Takes 60 seconds. A career advisor will contact you — no commitment required.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name</label>
          <input
            name="name"
            placeholder="Jane Smith"
            required
            className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
          <input
            name="email"
            type="email"
            placeholder="jane@email.com"
            required
            className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Phone</label>
          <input
            name="phone"
            type="tel"
            placeholder="(317) 555-0100"
            className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Program of Interest</label>
          <select
            name="program"
            required
            className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent bg-white"
          >
            <option value="">Select a program</option>
            {PROGRAMS.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {error && (
          <p className="text-brand-red-600 text-sm">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-red-600 hover:bg-brand-red-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
          ) : (
            <>Get Started <ArrowRight className="w-4 h-4" /></>
          )}
        </button>

        <p className="text-xs text-slate-500 text-center">
          Most students qualify for free training. We'll confirm your eligibility on the call.
        </p>
      </form>
    </div>
  );
}
