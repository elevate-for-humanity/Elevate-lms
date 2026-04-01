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

type YesNo = 'yes' | 'no' | null;

export default function CheckEligibilityPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1
  const [q1, setQ1] = useState<YesNo>(null);
  const [q2, setQ2] = useState<YesNo>(null);
  const [q3, setQ3] = useState<YesNo>(null);

  // Step 2
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [program, setProgram] = useState('');
  const [employment, setEmployment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const allAnswered = q1 !== null && q2 !== null && q3 !== null;

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
        body: JSON.stringify({
          name, phone, email, program, employment,
          source: 'check-eligibility',
          qualifierAnswers: { unemployedOrUnder: q1, indianaResident: q2, wantsCert: q3 },
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Submission failed');
      }
      setStep(3);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please call (317) 314-3757.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
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

        {/* STEP 1 */}
        {step === 1 && (
          <div>
            <div className="flex items-center gap-2 mb-8">
              <div className="flex-1 h-1.5 rounded-full bg-brand-red-600" />
              <div className="flex-1 h-1.5 rounded-full bg-slate-200" />
              <span className="text-xs text-slate-400 ml-1">Step 1 of 2</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">
              Check if you qualify for funded training
            </h1>
            <p className="text-slate-500 text-sm mb-8">Answer 3 quick questions. Takes 30 seconds.</p>
            <div className="space-y-5">
              {[
                { q: 'Are you currently unemployed or underemployed?', val: q1, set: setQ1 },
                { q: 'Do you live in Indiana?', val: q2, set: setQ2 },
                { q: 'Are you interested in getting certified for a job?', val: q3, set: setQ3 },
              ].map(({ q, val, set }) => (
                <div key={q} className="bg-white border border-slate-200 rounded-xl p-5">
                  <p className="font-semibold text-slate-900 mb-4">{q}</p>
                  <div className="flex gap-3">
                    {(['yes', 'no'] as const).map((v) => (
                      <button
                        key={v}
                        onClick={() => set(v)}
                        className={`flex-1 py-3 rounded-lg font-bold text-sm border-2 transition-colors ${
                          val === v
                            ? 'bg-brand-red-600 border-brand-red-600 text-white'
                            : 'bg-white border-slate-300 text-slate-700 hover:border-brand-red-400'
                        }`}
                      >
                        {v === 'yes' ? 'Yes' : 'No'}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setStep(2)}
              disabled={!allAnswered}
              className="mt-8 w-full flex items-center justify-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl text-base transition-colors"
            >
              See My Results <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div>
            <div className="flex items-center gap-2 mb-8">
              <div className="flex-1 h-1.5 rounded-full bg-brand-red-600" />
              <div className="flex-1 h-1.5 rounded-full bg-brand-red-600" />
              <span className="text-xs text-slate-400 ml-1">Step 2 of 2</span>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-8 flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold text-green-900 text-base">You may qualify for free or low-cost training</p>
                <p className="text-green-800 text-sm mt-1">
                  WIOA, Workforce Ready Grant, and Job Ready Indy may cover your full tuition, books, and certification fees.
                  Fill in your info and we&apos;ll confirm your options.
                </p>
              </div>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 mb-6">Tell us about yourself</h2>
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
                <p className="text-xs text-slate-400 mt-1">We may text you — reply STOP to opt out anytime.</p>
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
              {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm">{error}</div>}
              <button type="submit" disabled={submitting}
                className="w-full flex items-center justify-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl text-base transition-colors mt-2">
                {submitting ? 'Submitting...' : 'Start My Application'}
                {!submitting && <ArrowRight className="w-5 h-5" />}
              </button>
              <p className="text-center text-xs text-slate-400">
                We respond within 24 hours. Questions? Call or text{' '}
                <a href="tel:3173143757" className="text-slate-600 font-semibold">(317) 314-3757</a>
              </p>
            </form>
          </div>
        )}

        {/* STEP 3: CONFIRMATION */}
        {step === 3 && (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-9 h-9 text-green-600" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 mb-3">You&apos;re in the queue!</h2>
            <p className="text-slate-600 mb-2">We received your info and will reach out within 24 hours to confirm your funding options and next steps.</p>
            <p className="text-slate-500 text-sm mb-8">
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
