'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle, ArrowRight, Phone } from 'lucide-react';

const PROGRAMS = [
  'CNA (Certified Nursing Assistant)',
  'HVAC Technician',
  'IT / Certiport Certifications',
  'Barber Apprenticeship',
  'CDL Class A',
  'Phlebotomy Technician',
  'Medical Assistant',
  'Cosmetology Apprenticeship',
  'Not Sure Yet',
];

const EMPLOYMENT_STATUS = [
  'Unemployed',
  'Underemployed / Part-time',
  'Employed — looking to change careers',
  'Recently laid off',
  'Other',
];

export default function ApplyStartPage() {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [program, setProgram] = useState('');
  const [employment, setEmployment] = useState('');
  const [goals, setGoals] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !email.trim()) {
      setError('Name, phone, and email are required.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/funnel/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email, program, employment, goals, source: 'apply-start' }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Submission failed');
      }
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please call (317) 314-3757.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-slate-900 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-white font-bold text-sm hover:text-brand-red-300 transition-colors">
          ← Elevate for Humanity
        </Link>
        <a href="tel:3173143757" className="flex items-center gap-2 text-white text-sm font-semibold hover:text-brand-red-300 transition-colors">
          <Phone className="w-4 h-4" />
          (317) 314-3757
        </a>
      </div>

      <div className="max-w-xl mx-auto px-4 py-12">
        {!submitted ? (
          <>
            <p className="text-xs font-bold uppercase tracking-widest text-brand-red-600 mb-3">Free to apply</p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">Start Your Application</h1>
            <p className="text-black text-sm mb-8">
              Fill in your info below. We&apos;ll reach out within 24 hours to walk you through your options and funding.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name *</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full min-h-[48px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-transparent" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Phone Number *</label>
                <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)}
                  placeholder="(317) 000-0000"
                  className="w-full min-h-[48px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-transparent" />
                <p className="text-xs text-black mt-1">We may text you — reply STOP to opt out anytime.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Email Address *</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="w-full min-h-[48px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-transparent" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Program Interest</label>
                <select value={program} onChange={(e) => setProgram(e.target.value)}
                  className="w-full min-h-[48px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-transparent bg-white">
                  <option value="">Select a program</option>
                  {PROGRAMS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Employment Status</label>
                <select value={employment} onChange={(e) => setEmployment(e.target.value)}
                  className="w-full min-h-[48px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-transparent bg-white">
                  <option value="">Select status</option>
                  {EMPLOYMENT_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">What are you looking to do? <span className="text-black font-normal">(optional)</span></label>
                <textarea value={goals} onChange={(e) => setGoals(e.target.value)} rows={3}
                  placeholder="e.g. Get a better-paying job, change careers, get certified..."
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-transparent resize-none" />
              </div>

              {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm">{error}</div>}

              <button type="submit" disabled={submitting}
                className="w-full flex items-center justify-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl text-base transition-colors">
                {submitting ? 'Submitting...' : 'Submit Application'}
                {!submitting && <ArrowRight className="w-5 h-5" />}
              </button>

              <p className="text-center text-xs text-black">
                We respond within 24 hours. Questions? Call or text{' '}
                <a href="tel:3173143757" className="text-black font-semibold">(317) 314-3757</a>
              </p>
            </form>
          </>
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-9 h-9 text-green-600" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 mb-3">Application received!</h2>
            <p className="text-black mb-2">We&apos;ll reach out within 24 hours to walk you through your funding options and next steps.</p>
            <p className="text-black text-sm mb-8">
              Can&apos;t wait? Call or text us now:{' '}
              <a href="tel:3173143757" className="text-brand-red-600 font-bold">(317) 314-3757</a>
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/programs" className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-3.5 rounded-lg transition-colors">
                Browse Programs
              </Link>
              <Link href="/" className="border border-slate-300 text-slate-700 font-semibold px-8 py-3.5 rounded-lg hover:bg-slate-50 transition-colors">
                Back to Home
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
