'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle, ChevronRight, AlertCircle, Loader2,
  Calendar, Clock, Users, User, Building2, FileText,
} from 'lucide-react';

const EXAM_TYPES = [
  {
    id: 'certiport',
    label: 'Certiport / Microsoft Office Specialist',
    provider: 'Certiport (Pearson VUE)',
    exams: [
      'Microsoft Office Specialist — Word',
      'Microsoft Office Specialist — Excel',
      'Microsoft Office Specialist — PowerPoint',
      'Microsoft Office Specialist — Outlook',
      'IC3 Digital Literacy',
      'IT Specialist',
      'Entrepreneurship & Small Business (ESB)',
      'Intuit QuickBooks Certified User',
    ],
  },
  {
    id: 'epa608',
    label: 'EPA Section 608 — HVAC Refrigerant Certification',
    provider: 'ESCO Institute',
    exams: [
      'EPA 608 Core',
      'EPA 608 Type I — Small Appliances',
      'EPA 608 Type II — High-Pressure Systems',
      'EPA 608 Type III — Low-Pressure Systems',
      'EPA 608 Universal (all types)',
    ],
  },
  {
    id: 'osha',
    label: 'OSHA Safety Certification',
    provider: 'CareerSafe / OSHA',
    exams: [
      'OSHA 10-Hour General Industry',
      'OSHA 10-Hour Construction',
      'OSHA 30-Hour General Industry',
      'OSHA 30-Hour Construction',
    ],
  },
  {
    id: 'riseup',
    label: 'Rise Up — National Retail Federation',
    provider: 'NRF Foundation',
    exams: [
      'Customer Service & Sales',
      'Retail Industry Fundamentals',
    ],
  },
  {
    id: 'workkeys',
    label: 'ACT WorkKeys / NCRC',
    provider: 'ACT',
    exams: [
      'Applied Math',
      'Workplace Documents',
      'Business Writing',
      'National Career Readiness Certificate (NCRC)',
    ],
  },
  {
    id: 'other',
    label: 'Other / Not Listed',
    provider: '',
    exams: ['Other exam — describe in notes'],
  },
];

const TIMES = [
  '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM',
  '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '1:00 PM', '1:30 PM', '2:00 PM',
  '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM',
];

// Minimum date = tomorrow
function minDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

function BookingForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [step, setStep] = useState<'type' | 'details' | 'schedule' | 'review' | 'done'>('type');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');

  const [form, setForm] = useState({
    examType: searchParams.get('exam') ?? '',
    examName: '',
    bookingType: 'individual' as 'individual' | 'organization',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    organization: '',
    participantCount: 1,
    preferredDate: '',
    preferredTime: '',
    alternateDate: '',
    notes: '',
  });

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const selectedExamType = EXAM_TYPES.find(e => e.id === form.examType);

  async function submit() {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/testing/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Booking failed');
      setConfirmationCode(data.confirmationCode);
      setStep('done');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  // ── Done ──────────────────────────────────────────────────────────────────
  if (step === 'done') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-10 text-center">
          <CheckCircle className="w-16 h-16 text-brand-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Booking Received!</h2>
          <p className="text-slate-500 mb-4">
            We'll confirm your exam seat within 1 business day and send details to <strong>{form.email}</strong>.
          </p>
          <div className="bg-slate-50 rounded-xl p-4 mb-6">
            <p className="text-xs text-slate-400 mb-1">Confirmation Code</p>
            <p className="text-2xl font-black tracking-widest text-brand-blue-700">{confirmationCode}</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 mb-6 text-left">
            <p className="font-semibold mb-1">What happens next:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>HR reviews your request (1 business day)</li>
              <li>You receive a confirmation email with your exact date, time, and seat</li>
              <li>Bring a valid government-issued ID on exam day</li>
              <li>Arrive 15 minutes early for check-in</li>
            </ol>
          </div>
          <div className="flex gap-3">
            <Link href="/testing" className="flex-1 py-3 border rounded-xl text-slate-700 font-medium hover:bg-slate-50 text-sm">
              Back to Testing
            </Link>
            <Link href="/" className="flex-1 py-3 bg-brand-blue-600 text-white rounded-xl font-semibold hover:bg-brand-blue-700 text-sm">
              Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <Link href="/testing" className="text-sm text-slate-500 hover:text-brand-blue-600">← Testing Center</Link>
            <span className="text-slate-300">/</span>
            <span className="text-sm font-semibold text-slate-900">Book an Exam Seat</span>
          </div>
          {/* Step indicators */}
          <div className="flex items-center gap-1">
            {(['type', 'details', 'schedule', 'review'] as const).map((s, i) => {
              const idx = ['type', 'details', 'schedule', 'review'].indexOf(step);
              return (
                <div key={s} className="flex items-center gap-1 flex-1">
                  <div className={`h-1.5 flex-1 rounded-full transition-colors ${idx >= i ? 'bg-brand-blue-600' : 'bg-slate-200'}`} />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-1">
            {['Exam Type', 'Your Info', 'Schedule', 'Review'].map((label, i) => {
              const idx = ['type', 'details', 'schedule', 'review'].indexOf(step);
              return (
                <span key={label} className={`text-xs ${idx >= i ? 'text-brand-blue-600 font-semibold' : 'text-slate-400'}`}>
                  {label}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* ── Step 1: Exam Type ── */}
        {step === 'type' && (
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">What exam are you booking?</h1>
            <p className="text-slate-500 text-sm mb-6">Select the certification or exam type. All exams are proctored on-site at our Indianapolis testing center.</p>
            <div className="space-y-3 mb-6">
              {EXAM_TYPES.map(et => (
                <button key={et.id} type="button" onClick={() => set('examType', et.id)}
                  className={`w-full text-left p-5 rounded-xl border-2 transition-all ${
                    form.examType === et.id ? 'border-brand-blue-600 bg-brand-blue-50' : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${
                      form.examType === et.id ? 'border-brand-blue-600 bg-brand-blue-600' : 'border-slate-300'
                    }`}>
                      {form.examType === et.id && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{et.label}</p>
                      {et.provider && <p className="text-xs text-slate-400 mt-0.5">{et.provider}</p>}
                    </div>
                  </div>
                </button>
              ))}
            </div>
            {selectedExamType && selectedExamType.exams.length > 1 && (
              <div className="bg-white rounded-xl border p-5 mb-6">
                <p className="text-sm font-semibold text-slate-700 mb-3">Which specific exam?</p>
                <div className="space-y-2">
                  {selectedExamType.exams.map(e => (
                    <button key={e} type="button" onClick={() => set('examName', e)}
                      className={`w-full text-left px-4 py-2.5 rounded-lg border text-sm transition-all ${
                        form.examName === e ? 'border-brand-blue-600 bg-brand-blue-50 text-brand-blue-800 font-medium' : 'border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}>{e}</button>
                  ))}
                </div>
              </div>
            )}
            <button onClick={() => setStep('details')}
              disabled={!form.examType || (selectedExamType && selectedExamType.exams.length > 1 && !form.examName)}
              className="w-full flex items-center justify-center gap-2 bg-brand-blue-600 text-white font-semibold py-3.5 rounded-xl hover:bg-brand-blue-700 disabled:opacity-40">
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── Step 2: Contact Details ── */}
        {step === 'details' && (
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Your information</h1>
            <p className="text-slate-500 text-sm mb-6">We'll send your confirmation and exam details to the email you provide.</p>

            {/* Booking type */}
            <div className="flex gap-3 mb-6">
              {[
                { id: 'individual', label: 'Individual', icon: User, desc: '1 person' },
                { id: 'organization', label: 'Organization', icon: Building2, desc: 'Multiple seats' },
              ].map(({ id, label, icon: Icon, desc }) => (
                <button key={id} type="button" onClick={() => set('bookingType', id)}
                  className={`flex-1 flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                    form.bookingType === id ? 'border-brand-blue-600 bg-brand-blue-50' : 'border-slate-200 bg-white'
                  }`}>
                  <Icon className={`w-5 h-5 ${form.bookingType === id ? 'text-brand-blue-600' : 'text-slate-400'}`} />
                  <div className="text-left">
                    <p className={`font-semibold text-sm ${form.bookingType === id ? 'text-brand-blue-800' : 'text-slate-700'}`}>{label}</p>
                    <p className="text-xs text-slate-400">{desc}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="bg-white rounded-xl border p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">First Name *</label>
                  <input value={form.firstName} onChange={e => set('firstName', e.target.value)}
                    className="w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Last Name *</label>
                  <input value={form.lastName} onChange={e => set('lastName', e.target.value)}
                    className="w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-blue-500 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address *</label>
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-blue-500 focus:outline-none" />
              </div>
              {form.bookingType === 'organization' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Organization Name *</label>
                    <input value={form.organization} onChange={e => set('organization', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-blue-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Number of Participants *</label>
                    <input type="number" min={2} max={30} value={form.participantCount}
                      onChange={e => set('participantCount', parseInt(e.target.value) || 1)}
                      className="w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-blue-500 focus:outline-none" />
                    <p className="text-xs text-slate-400 mt-1">Maximum 30 seats per session. Contact us for larger groups.</p>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep('type')} className="flex-1 py-3 border rounded-xl text-slate-700 font-medium hover:bg-slate-50">Back</button>
              <button onClick={() => setStep('schedule')}
                disabled={!form.firstName || !form.lastName || !form.email || (form.bookingType === 'organization' && !form.organization)}
                className="flex-1 flex items-center justify-center gap-2 bg-brand-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-brand-blue-700 disabled:opacity-40">
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Schedule ── */}
        {step === 'schedule' && (
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Choose your date &amp; time</h1>
            <p className="text-slate-500 text-sm mb-6">Testing is available Monday–Friday, 8 AM–4 PM at our Indianapolis center. We'll confirm availability within 1 business day.</p>
            <div className="bg-white rounded-xl border p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Preferred Date *</label>
                <input type="date" min={minDate()} value={form.preferredDate}
                  onChange={e => set('preferredDate', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Preferred Time *</label>
                <div className="grid grid-cols-4 gap-2">
                  {TIMES.map(t => (
                    <button key={t} type="button" onClick={() => set('preferredTime', t)}
                      className={`py-2 rounded-lg border text-xs font-medium transition-all ${
                        form.preferredTime === t
                          ? 'border-brand-blue-600 bg-brand-blue-600 text-white'
                          : 'border-slate-200 text-slate-700 hover:border-brand-blue-300'
                      }`}>{t}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Alternate Date (optional)</label>
                <input type="date" min={minDate()} value={form.alternateDate}
                  onChange={e => set('alternateDate', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-blue-500 focus:outline-none" />
                <p className="text-xs text-slate-400 mt-1">Provide a backup date in case your first choice is unavailable.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Additional Notes</label>
                <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3}
                  placeholder="Accommodations needed, specific exam version, funding source, etc."
                  className="w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-blue-500 focus:outline-none resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep('details')} className="flex-1 py-3 border rounded-xl text-slate-700 font-medium hover:bg-slate-50">Back</button>
              <button onClick={() => setStep('review')}
                disabled={!form.preferredDate || !form.preferredTime}
                className="flex-1 flex items-center justify-center gap-2 bg-brand-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-brand-blue-700 disabled:opacity-40">
                Review Booking <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 4: Review ── */}
        {step === 'review' && (
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Review your booking</h1>
            <p className="text-slate-500 text-sm mb-6">Confirm the details below before submitting.</p>
            <div className="bg-white rounded-xl border divide-y mb-6">
              {[
                { label: 'Exam', value: form.examName || selectedExamType?.label || form.examType },
                { label: 'Provider', value: selectedExamType?.provider || '—' },
                { label: 'Booking Type', value: form.bookingType === 'organization' ? `Organization (${form.participantCount} seats)` : 'Individual' },
                { label: 'Name', value: `${form.firstName} ${form.lastName}` },
                { label: 'Email', value: form.email },
                { label: 'Phone', value: form.phone || '—' },
                ...(form.organization ? [{ label: 'Organization', value: form.organization }] : []),
                { label: 'Preferred Date', value: form.preferredDate ? new Date(form.preferredDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : '—' },
                { label: 'Preferred Time', value: form.preferredTime },
                ...(form.alternateDate ? [{ label: 'Alternate Date', value: new Date(form.alternateDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) }] : []),
                ...(form.notes ? [{ label: 'Notes', value: form.notes }] : []),
              ].map(({ label, value }) => (
                <div key={label} className="px-5 py-3.5 flex gap-4">
                  <span className="text-sm text-slate-400 w-32 flex-shrink-0">{label}</span>
                  <span className="text-sm font-medium text-slate-900">{value}</span>
                </div>
              ))}
            </div>
            <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-xl p-4 text-sm text-brand-blue-800 mb-6">
              <strong>Location:</strong> 8888 Keystone Crossing Suite 1300, Indianapolis, IN 46240 · Bring a valid government-issued ID.
            </div>
            {error && (
              <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setStep('schedule')} className="flex-1 py-3 border rounded-xl text-slate-700 font-medium hover:bg-slate-50">Back</button>
              <button onClick={submit} disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 bg-brand-green-600 text-white font-semibold py-3 rounded-xl hover:bg-brand-green-700 disabled:opacity-40">
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : 'Confirm Booking'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TestingBookPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-blue-600" /></div>}>
      <BookingForm />
    </Suspense>
  );
}
