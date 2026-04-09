'use client';

import { useState } from 'react';
import { Loader2, CheckCircle2, AlertCircle, Scissors, Sparkles, Hand } from 'lucide-react';

const PROGRAMS = [
  {
    slug: 'cosmetology-apprenticeship',
    label: 'Cosmetology',
    detail: '1,500 hours · 12–18 months',
    icon: <Scissors className="w-5 h-5" />,
    color: 'border-purple-400 bg-purple-50 text-purple-700',
    selectedColor: 'border-purple-600 bg-purple-600 text-white',
  },
  {
    slug: 'esthetician-apprenticeship',
    label: 'Esthetician',
    detail: '700 hours · 6–9 months',
    icon: <Sparkles className="w-5 h-5" />,
    color: 'border-rose-400 bg-rose-50 text-rose-700',
    selectedColor: 'border-rose-600 bg-rose-600 text-white',
  },
  {
    slug: 'nail-technician-apprenticeship',
    label: 'Nail Technician',
    detail: '450 hours · 4–6 months',
    icon: <Hand className="w-5 h-5" />,
    color: 'border-pink-400 bg-pink-50 text-pink-700',
    selectedColor: 'border-pink-600 bg-pink-600 text-white',
  },
];

const FUNDING_OPTIONS = [
  'WIOA / Workforce funding',
  'Employer-sponsored',
  'Self-pay',
  'Not sure yet',
];

export default function MesmerizedApplyForm() {
  const [program, setProgram]           = useState('');
  const [firstName, setFirstName]       = useState('');
  const [lastName, setLastName]         = useState('');
  const [email, setEmail]               = useState('');
  const [phone, setPhone]               = useState('');
  const [city, setCity]                 = useState('');
  const [funding, setFunding]           = useState('');
  const [experience, setExperience]     = useState('');
  const [notes, setNotes]               = useState('');
  const [submitting, setSubmitting]     = useState(false);
  const [success, setSuccess]           = useState(false);
  const [error, setError]               = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!program) { setError('Please select a program.'); return; }
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/schools/mesmerized-by-beauty/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName, lastName, email, phone, city,
          programInterest: program,
          fundingSource: funding || null,
          priorExperience: experience || null,
          notes: notes || null,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || 'Submission failed. Please try again.');
        setSubmitting(false);
        return;
      }

      setSuccess(true);
    } catch {
      setError('Network error. Please try again.');
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="bg-white border-2 border-emerald-200 rounded-2xl p-10 text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="w-9 h-9 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-3">Application Submitted</h2>
        <p className="text-slate-600 mb-6 max-w-sm mx-auto">
          Thank you! We&apos;ve sent a confirmation to <strong>{email}</strong>. Our admissions team will be in touch within 2–3 business days.
        </p>
        <div className="bg-slate-50 rounded-xl p-5 text-left space-y-2 max-w-xs mx-auto">
          <h3 className="font-semibold text-slate-900 text-sm mb-3">What happens next</h3>
          {[
            'Admissions review within 2–3 business days',
            'Interview scheduled by phone or email',
            'Placement at a licensed partner salon',
            'Access to Elevate LMS theory coursework',
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
              <span className="w-5 h-5 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
              {step}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-8 space-y-7 shadow-sm">

      {/* Program selection */}
      <div>
        <label className="block text-sm font-bold text-slate-900 mb-3">
          Select a program <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PROGRAMS.map((p) => {
            const selected = program === p.slug;
            return (
              <button
                key={p.slug}
                type="button"
                onClick={() => setProgram(p.slug)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center ${
                  selected ? p.selectedColor : `${p.color} hover:opacity-80`
                }`}
              >
                {p.icon}
                <span className="font-bold text-sm">{p.label}</span>
                <span className={`text-xs ${selected ? 'text-white/80' : 'opacity-70'}`}>{p.detail}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Name */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5" htmlFor="firstName">
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            id="firstName" type="text" required
            value={firstName} onChange={e => setFirstName(e.target.value)}
            className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Jane"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5" htmlFor="lastName">
            Last Name <span className="text-red-500">*</span>
          </label>
          <input
            id="lastName" type="text" required
            value={lastName} onChange={e => setLastName(e.target.value)}
            className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Smith"
          />
        </div>
      </div>

      {/* Contact */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5" htmlFor="email">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            id="email" type="email" required
            value={email} onChange={e => setEmail(e.target.value)}
            className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="jane@email.com"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5" htmlFor="phone">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <input
            id="phone" type="tel" required
            value={phone} onChange={e => setPhone(e.target.value)}
            className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="(317) 555-0100"
          />
        </div>
      </div>

      {/* City */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5" htmlFor="city">City</label>
        <input
          id="city" type="text"
          value={city} onChange={e => setCity(e.target.value)}
          className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          placeholder="Indianapolis"
        />
      </div>

      {/* Funding */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5" htmlFor="funding">
          How do you plan to fund your training?
        </label>
        <select
          id="funding"
          value={funding} onChange={e => setFunding(e.target.value)}
          className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
        >
          <option value="">Select an option</option>
          {FUNDING_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>

      {/* Prior experience */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5" htmlFor="experience">
          Any prior beauty industry experience? (optional)
        </label>
        <input
          id="experience" type="text"
          value={experience} onChange={e => setExperience(e.target.value)}
          className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          placeholder="e.g. 2 years as a salon assistant"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5" htmlFor="notes">
          Anything else you&apos;d like us to know? (optional)
        </label>
        <textarea
          id="notes" rows={3}
          value={notes} onChange={e => setNotes(e.target.value)}
          className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
          placeholder="Questions, scheduling preferences, etc."
        />
      </div>

      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-base"
      >
        {submitting
          ? <><Loader2 className="w-5 h-5 animate-spin" /> Submitting…</>
          : 'Submit Application — Free'}
      </button>

      <p className="text-xs text-slate-500 text-center">
        Free to apply. No commitment required.{' '}
        Questions?{' '}
        <a href="mailto:mesmerizedbybeautyl@yahoo.com" className="text-purple-600 hover:underline">
          mesmerizedbybeautyl@yahoo.com
        </a>
      </p>
    </form>
  );
}
