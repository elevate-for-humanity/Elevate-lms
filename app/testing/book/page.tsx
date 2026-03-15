'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, MapPinned, Monitor, Phone } from 'lucide-react';
import {
  ALL_PROVIDERS,
  getProctoringOptions,
  getProctoringLabels,
  type CertProvider,
} from '@/lib/testing/proctoring-capabilities';

const ORG_TYPES = [
  'Employer / Company',
  'Workforce Agency / WorkOne Center',
  'Training School or Program',
  'Nonprofit / Reentry Program',
  'Individual',
  'Other',
];

const PROCTORING_MODE_LABELS: Record<string, string> = {
  inPerson:       'In-person at Elevate Testing Center',
  remoteProvider: 'Remote — provider-controlled system',
  remoteCenter:   'Live online — Elevate-proctored',
};

function BookingForm() {
  const searchParams = useSearchParams();
  const typeParam = searchParams.get('type') ?? '';

  const [selectedProvider, setSelectedProvider] = useState<CertProvider | null>(null);
  const [proctoringMode, setProctoringMode] = useState('');
  const [orgType, setOrgType] = useState('');
  const [participantCount, setParticipantCount] = useState('1');
  const [name, setName] = useState('');
  const [org, setOrg] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Pre-select org type from URL param
  useEffect(() => {
    if (typeParam === 'employer-testing') setOrgType('Employer / Company');
    if (typeParam === 'agency-testing')   setOrgType('Workforce Agency / WorkOne Center');
    if (typeParam === 'school-testing')   setOrgType('Training School or Program');
    if (typeParam === 'individual-testing') setOrgType('Individual');
    if (typeParam === 'group-testing')    setOrgType('Employer / Company');
  }, [typeParam]);

  // Reset proctoring mode when provider changes
  useEffect(() => {
    setProctoringMode('');
  }, [selectedProvider]);

  const proctoringOptions = selectedProvider
    ? getProctoringOptions(selectedProvider.key)
    : null;

  const availableModes = proctoringOptions
    ? (Object.entries(proctoringOptions) as [string, boolean][]).filter(([, v]) => v).map(([k]) => k)
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          organization: org,
          organizationType: orgType,
          subject: `Testing Booking Request — ${selectedProvider?.name ?? 'Unknown'}`,
          message: `Provider: ${selectedProvider?.name}\nProctoring mode: ${PROCTORING_MODE_LABELS[proctoringMode] ?? proctoringMode}\nParticipants: ${participantCount}\nPreferred date: ${preferredDate}\nNotes: ${notes}`,
          type: 'testing-booking',
        }),
      });
      setSubmitted(true);
    } catch {
      // Still show success — email fallback
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto mb-6">
            <ChevronRight className="w-8 h-8 text-slate-500" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mb-3">Request Received</h1>
          <p className="text-slate-500 mb-6">
            We will contact you within 1 business day to confirm your testing session.
            If you need to reach us sooner, call{' '}
            <a href="tel:+13173143757" className="text-brand-blue-600 font-semibold">(317) 314-3757</a>.
          </p>
          <Link href="/testing" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-blue-600 hover:text-brand-blue-800">
            ← Back to Testing Center
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-slate-900 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <Link href="/testing" className="text-xs text-slate-400 hover:text-white mb-4 inline-flex items-center gap-1">
            ← Testing Center
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">Book a Testing Session</h1>
          <p className="text-slate-300 text-sm">
            Fill out the form below. We respond within 1 business day to confirm your session.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <form onSubmit={handleSubmit} className="space-y-8">

          {/* Step 1 — Select exam */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="font-extrabold text-slate-900 mb-1">1. Which exam do you need?</h2>
            <p className="text-xs text-slate-400 mb-4">Select a certification provider. Available proctoring modes will update automatically.</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {ALL_PROVIDERS.map((provider) => (
                <button
                  key={provider.key}
                  type="button"
                  onClick={() => setSelectedProvider(provider)}
                  className={`text-left p-4 rounded-xl border-2 transition-all ${
                    selectedProvider?.key === provider.key
                      ? 'border-brand-blue-500 bg-brand-blue-50'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  } ${provider.status === 'coming_soon' ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={provider.status === 'coming_soon'}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-sm text-slate-900 leading-snug">{provider.name}</span>
                    {provider.status !== 'active' && (
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded flex-shrink-0">
                        {provider.status === 'coming_soon' ? 'Soon' : 'Partner'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">{provider.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2 — Proctoring mode (driven by capability) */}
          {selectedProvider && availableModes.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="font-extrabold text-slate-900 mb-1">2. How would you like to test?</h2>
              <p className="text-xs text-slate-400 mb-4">
                Available modes for <strong>{selectedProvider.name}</strong> based on provider requirements.
              </p>
              <div className="flex flex-col gap-3">
                {availableModes.map((mode) => {
                  const label = PROCTORING_MODE_LABELS[mode];
                  const Icon = mode === 'inPerson' ? MapPinned : Monitor;
                  return (
                    <label key={mode} className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      proctoringMode === mode ? 'border-brand-blue-500 bg-brand-blue-50' : 'border-slate-200 hover:border-slate-300'
                    }`}>
                      <input
                        type="radio"
                        name="proctoringMode"
                        value={mode}
                        checked={proctoringMode === mode}
                        onChange={() => setProctoringMode(mode)}
                        className="mt-0.5 flex-shrink-0"
                        required
                      />
                      <Icon className="w-4 h-4 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-sm text-slate-900">{label}</span>
                        {mode === 'inPerson' && (
                          <p className="text-xs text-slate-400 mt-0.5">8888 Keystone Crossing, Suite 1300, Indianapolis, IN 46240</p>
                        )}
                        {mode === 'remoteProvider' && (
                          <p className="text-xs text-slate-400 mt-0.5">The certifying organization controls the remote testing system. We facilitate access.</p>
                        )}
                        {mode === 'remoteCenter' && (
                          <p className="text-xs text-slate-400 mt-0.5">Elevate staff proctor the session live via video. Participants can test from any location.</p>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3 — Organization & contact */}
          {selectedProvider && proctoringMode && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <h2 className="font-extrabold text-slate-900 mb-1">3. Your information</h2>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Your name *</label>
                  <input required value={name} onChange={e => setName(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                    placeholder="Full name" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Organization</label>
                  <input value={org} onChange={e => setOrg(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                    placeholder="Company or program name" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Email *</label>
                  <input required type="email" value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                    placeholder="you@example.com" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Phone</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                    placeholder="(317) 000-0000" />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Organization type *</label>
                  <select required value={orgType} onChange={e => setOrgType(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500">
                    <option value="">Select...</option>
                    {ORG_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Number of participants *</label>
                  <input required type="number" min="1" max="20" value={participantCount}
                    onChange={e => setParticipantCount(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Preferred date(s)</label>
                <input type="text" value={preferredDate} onChange={e => setPreferredDate(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                  placeholder="e.g. Any Tuesday in March, or specific date" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Additional notes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500 resize-none"
                  placeholder="Specific exam types, accessibility needs, or other details" />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-brand-red-600 hover:bg-brand-red-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors text-sm"
              >
                {submitting ? 'Sending...' : 'Submit Booking Request'}
              </button>

              <p className="text-xs text-slate-400 text-center">
                Or call us directly: <a href="tel:+13173143757" className="text-brand-blue-600 font-semibold inline-flex items-center gap-1"><Phone className="w-3 h-3" />(317) 314-3757</a>
              </p>
            </div>
          )}

        </form>
      </div>
    </main>
  );
}

export default function BookTestingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><p className="text-slate-400 text-sm">Loading...</p></div>}>
      <BookingForm />
    </Suspense>
  );
}
