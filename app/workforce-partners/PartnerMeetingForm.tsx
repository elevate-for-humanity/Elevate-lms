'use client';

import { useState } from 'react';
import { CheckCircle, ArrowRight } from 'lucide-react';

const AGENCY_TYPES = [
  'WorkOne / American Job Center',
  'Workforce Development Board',
  'State Agency (DWD, DOC, etc.)',
  'Community Action Agency',
  'Nonprofit / Social Services',
  'Employer / HR Department',
  'School / Educational Institution',
  'Other',
];

const INTERESTS = [
  'Training delivery for our participants',
  'Co-enrollment / WIOA ITA coordination',
  'Managed program operation',
  'Testing center services',
  'Cohort / group referral',
  'General partnership inquiry',
];

export default function PartnerMeetingForm() {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState('');
  const [org, setOrg] = useState('');
  const [agencyType, setAgencyType] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [interest, setInterest] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !email.trim() || !org.trim()) {
      setError('Name, organization, phone, and email are required.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/funnel/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          email,
          program: interest || 'Partnership inquiry',
          employment: agencyType,
          goals: `Org: ${org}${message ? ` | Message: ${message}` : ''}`,
          source: 'workforce-partners',
        }),
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

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-9 h-9 text-green-600" />
        </div>
        <h3 className="text-xl font-extrabold text-slate-900 mb-3">Request received</h3>
        <p className="text-slate-600 mb-2">We&apos;ll reach out within 24 hours to schedule your meeting.</p>
        <p className="text-slate-500 text-sm">
          Can&apos;t wait? Call or text{' '}
          <a href="tel:3173143757" className="text-brand-red-600 font-bold">(317) 314-3757</a>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Your Name *</label>
          <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            className="w-full min-h-[48px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-transparent" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Organization *</label>
          <input type="text" required value={org} onChange={(e) => setOrg(e.target.value)}
            placeholder="Agency or organization name"
            className="w-full min-h-[48px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-transparent" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1">Agency Type</label>
        <select value={agencyType} onChange={(e) => setAgencyType(e.target.value)}
          className="w-full min-h-[48px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-transparent bg-white">
          <option value="">Select agency type</option>
          {AGENCY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Phone *</label>
          <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)}
            placeholder="(317) 000-0000"
            className="w-full min-h-[48px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-transparent" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Email *</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="you@agency.org"
            className="w-full min-h-[48px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-transparent" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1">What are you interested in?</label>
        <select value={interest} onChange={(e) => setInterest(e.target.value)}
          className="w-full min-h-[48px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-transparent bg-white">
          <option value="">Select an option</option>
          {INTERESTS.map((i) => <option key={i} value={i}>{i}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1">
          Tell us more <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4}
          placeholder="Number of participants, target occupation, funding stream, timeline, or anything else we should know..."
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-transparent resize-none" />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm">{error}</div>
      )}

      <button type="submit" disabled={submitting}
        className="w-full flex items-center justify-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl text-base transition-colors">
        {submitting ? 'Sending...' : 'Request a Partnership Meeting'}
        {!submitting && <ArrowRight className="w-5 h-5" />}
      </button>

      <p className="text-center text-xs text-slate-400">
        We respond within 24 hours. Call or text{' '}
        <a href="tel:3173143757" className="text-slate-600 font-semibold">(317) 314-3757</a>
      </p>
    </form>
  );
}
