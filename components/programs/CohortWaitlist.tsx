'use client';

import { useState } from 'react';
import { Calendar, MapPin, Users, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface CohortWaitlistProps {
  programSlug: string;
  programName: string;
}

export default function CohortWaitlist({ programSlug, programName }: CohortWaitlistProps) {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, programSlug }),
      });
      const data = await res.json();

      if (res.ok) {
        setResult({ success: true, message: data.message || 'You have been added to the waitlist!' });
        setForm({ firstName: '', lastName: '', email: '', phone: '' });
      } else {
        setResult({ success: false, message: data.error || 'Something went wrong.' });
      }
    } catch {
      setResult({ success: false, message: 'Network error. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="bg-white rounded-xl shadow-sm border p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-brand-blue-100 rounded-lg">
          <Calendar className="w-5 h-5 text-brand-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">Join the Waitlist</h3>
          <p className="text-sm text-slate-600">Get notified when the next {programName} cohort opens</p>
        </div>
      </div>

      {result ? (
        <div className={`flex items-start gap-3 p-4 rounded-lg ${result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {result.success ? <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />}
          <div>
            <p className="font-medium">{result.message}</p>
            {result.success && (
              <p className="text-sm mt-1">We&apos;ll email you when enrollment opens. You can also <a href="/apply" className="underline font-medium">apply now</a> to start your onboarding early.</p>
            )}
            {!result.success && (
              <button onClick={() => setResult(null)} className="text-sm underline mt-1">Try again</button>
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor={`wl-fn-${programSlug}`} className="block text-sm font-medium text-slate-700 mb-1">First Name *</label>
              <input
                id={`wl-fn-${programSlug}`}
                required
                value={form.firstName}
                onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
              />
            </div>
            <div>
              <label htmlFor={`wl-ln-${programSlug}`} className="block text-sm font-medium text-slate-700 mb-1">Last Name *</label>
              <input
                id={`wl-ln-${programSlug}`}
                required
                value={form.lastName}
                onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor={`wl-em-${programSlug}`} className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
              <input
                id={`wl-em-${programSlug}`}
                type="email"
                required
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
              />
            </div>
            <div>
              <label htmlFor={`wl-ph-${programSlug}`} className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
              <input
                id={`wl-ph-${programSlug}`}
                type="tel"
                value={form.phone}
                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-brand-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-brand-blue-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Joining...' : 'Join Waitlist'}
          </button>
          <p className="text-xs text-slate-500 text-center">
            Already ready to start? <a href={`/apply?program=${programSlug}`} className="text-brand-blue-600 underline">Apply now</a> instead.
          </p>
        </form>
      )}
    </section>
  );
}
