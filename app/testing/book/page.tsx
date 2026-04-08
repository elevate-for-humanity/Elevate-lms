'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, MapPinned, Monitor, Phone, AlertTriangle, CreditCard } from 'lucide-react';
import {
  ALL_PROVIDERS,
  getProctoringOptions,
  type CertProvider,
} from '@/lib/testing/proctoring-capabilities';
import { TESTING_CENTER, CALENDLY_CONFIG } from '@/lib/testing/testing-config';

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
  const examParam = searchParams.get('exam') ?? '';

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
  const [addOnSelected, setAddOnSelected] = useState(false);
  const [leadCaptured, setLeadCaptured] = useState(false);
  const [slots, setSlots] = useState<{ id: string; examType: string; startTime: string; endTime: string; location: string; spotsRemaining: number }[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [enforcementHold, setEnforcementHold] = useState<{
    id: string; enforcement_type: string; fee_cents: number;
  } | null>(null);
  const [checkingHold, setCheckingHold] = useState(false);
  const [payingFee, setPayingFee] = useState(false);

  // Capture lead as soon as email is entered — fires follow-up sequence if they abandon
  const captureLead = async (emailVal: string) => {
    if (!emailVal || !emailVal.includes('@') || leadCaptured) return;
    try {
      await fetch('/api/testing/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailVal,
          examType: selectedProvider?.key ?? 'nha',
          firstName: name.trim().split(' ')[0] || undefined,
          phone: phone || undefined,
          source: 'booking_form',
        }),
      });
      setLeadCaptured(true);
    } catch {
      // non-blocking — never interrupt the booking flow
    }
  };

  // Check for no-show/retake hold when email is entered.
  // Debounced 400ms + aborts in-flight requests to prevent stacked calls on fast typing.
  const enforcementAbortRef = useRef<AbortController | null>(null);
  const enforcementTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkEnforcementHold = (emailVal: string) => {
    // Cancel any pending debounce
    if (enforcementTimerRef.current) clearTimeout(enforcementTimerRef.current);
    // Abort any in-flight request
    if (enforcementAbortRef.current) enforcementAbortRef.current.abort();

    if (!emailVal || !emailVal.includes('@')) {
      setEnforcementHold(null);
      setCheckingHold(false);
      return;
    }

    enforcementTimerRef.current = setTimeout(async () => {
      const controller = new AbortController();
      enforcementAbortRef.current = controller;
      setCheckingHold(true);
      try {
        const res = await fetch(
          `/api/testing/enforcement?email=${encodeURIComponent(emailVal)}`,
          { signal: controller.signal }
        );
        const data = await res.json();
        setEnforcementHold(data.hasHold ? data.holds[0] : null);
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          // non-blocking — don't block booking if check fails
        }
      } finally {
        setCheckingHold(false);
      }
    }, 400);
  };

  const handlePayEnforcementFee = async () => {
    if (!enforcementHold) return;
    setPayingFee(true);
    try {
      const res = await fetch('/api/testing/enforcement/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enforcementId: enforcementHold.id, email }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      alert(`Unable to start payment. Please call ${TESTING_CENTER.phone}.`);
    } finally {
      setPayingFee(false);
    }
  };

  // Pre-select org type from URL param
  useEffect(() => {
    if (typeParam === 'employer-testing') setOrgType('Employer / Company');
    if (typeParam === 'agency-testing')   setOrgType('Workforce Agency / WorkOne Center');
    if (typeParam === 'school-testing')   setOrgType('Training School or Program');
    if (typeParam === 'individual-testing') setOrgType('Individual');
    if (typeParam === 'group-testing')    setOrgType('Employer / Company');
  }, [typeParam]);

  // Pre-select provider from ?exam= param (set by /testing/[provider] Book button)
  useEffect(() => {
    if (!examParam) return;
    const match = ALL_PROVIDERS.find(p => p.key === examParam);
    if (match && match.status !== 'coming_soon') setSelectedProvider(match);
  }, [examParam]);

  // Reset proctoring mode, add-on, and slot when provider changes
  useEffect(() => {
    setProctoringMode('');
    setAddOnSelected(false);
    setSelectedSlotId('');
    setSlots([]);
    if (!selectedProvider) return;
    setSlotsLoading(true);
    fetch(`/api/testing/slots/public?examType=${encodeURIComponent(selectedProvider.key)}`)
      .then(r => r.json())
      .then(data => setSlots(data.slots ?? []))
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [selectedProvider]);

  const proctoringOptions = selectedProvider
    ? getProctoringOptions(selectedProvider.key)
    : null;

  const availableModes = proctoringOptions
    ? (Object.entries(proctoringOptions) as [string, boolean][]).filter(([, v]) => v).map(([k]) => k)
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProvider) return;

    // Block if unpaid enforcement hold exists
    if (enforcementHold) return;

    setSubmitting(true);
    const [firstName, ...rest] = name.trim().split(' ');
    const lastName = rest.join(' ') || '';
    const isOrg = orgType !== 'Individual' && orgType !== '';
    const qty = parseInt(participantCount, 10) || 1;

    try {
      // For individual bookings with a fee — go to Stripe first, booking created on success
      const fee = selectedProvider.fees?.[0];
      if (fee && !isOrg) {
        const addOnCents = addOnSelected ? (selectedProvider.addOn?.amountCents ?? 0) : 0;
        const totalCents = fee.amount * 100 + addOnCents;
        const res = await fetch('/api/testing/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            examType: selectedProvider.key,
            examName: selectedProvider.name,
            feeCents: totalCents,
            bookingType: 'individual',
            participantCount: 1,
            email,
            name,
            addOn: addOnSelected,
            addOnCents,
            slotId: selectedSlotId || null,
          }),
        });
        const data = await res.json();
        if (data.url) {
          // Mark lead converted — they're going to Stripe, follow-ups not needed
          fetch('/api/testing/leads', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, examType: selectedProvider.key }),
          }).catch(() => {});
          // Save booking intent to session storage so success page can complete it
          sessionStorage.setItem('pendingBooking', JSON.stringify({
            examType: selectedProvider.key,
            examName: selectedProvider.name,
            bookingType: 'individual',
            firstName, lastName, email, phone,
            organization: org, participantCount: 1,
            preferredDate, preferredTime: '',
            slotId: selectedSlotId || null,
            notes,
            addOn: addOnSelected,
          }));
          window.location.href = data.url;
          return;
        }
      }

      // Organizations and waived-fee bookings — submit directly
      const res = await fetch('/api/testing/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examType: selectedProvider.key,
          examName: selectedProvider.name,
          bookingType: isOrg ? 'organization' : 'individual',
          firstName, lastName, email,
          phone: phone || null,
          organization: org || null,
          participantCount: qty,
          preferredDate,
          preferredTime: '',
          slotId: selectedSlotId || null,
          notes: notes || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        // Mark lead converted so follow-up emails don't fire
        fetch('/api/testing/leads', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, examType: selectedProvider.key }),
        }).catch(() => {});
        setSubmitted(true);
      } else {
        alert(data.error ?? `Booking failed. Please call ${TESTING_CENTER.phone}.`);
      }
    } catch {
      setSubmitted(true); // email fallback
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
            <a href={`tel:${TESTING_CENTER.phoneTel}`} className="text-brand-blue-600 font-semibold">{TESTING_CENTER.phone}</a>.
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
      <div className="bg-brand-blue-700 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <Link href="/testing" className="text-xs text-slate-400 hover:text-white mb-4 inline-flex items-center gap-1">
            ← Testing Center
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">Book a Testing Session</h1>
          <p className="text-white/80 text-sm">
            Complete the form below to reserve your exam seat. Payment is required to confirm your booking.
          </p>
        </div>
      </div>

      {/* Server-rendered booking summary — visible without JS, helps crawlers and screen readers */}
      <div className="bg-slate-50 border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5">
          <h2 className="font-bold text-slate-900 mb-3 text-sm uppercase tracking-wide">How Booking Works</h2>
          <ol className="grid sm:grid-cols-2 gap-x-8 gap-y-1 text-sm text-slate-600 list-none">
            <li><span className="font-semibold text-slate-800">1.</span> Select your exam provider and type</li>
            <li><span className="font-semibold text-slate-800">2.</span> Choose an available date and time</li>
            <li><span className="font-semibold text-slate-800">3.</span> Enter your contact information</li>
            <li><span className="font-semibold text-slate-800">4.</span> Complete payment to confirm your seat</li>
            <li><span className="font-semibold text-slate-800">5.</span> Receive email confirmation within 1 business day</li>
          </ol>
          <div className="mt-3 pt-3 border-t border-slate-200 text-xs text-slate-500 space-y-0.5">
            <p>• <strong>Appointments required</strong> — walk-ins are not accepted</p>
            <p>• <strong>Arrive 15 minutes early</strong> with a valid government-issued photo ID</p>
            <p>• <strong>Cancellations:</strong> reschedule with at least 24 hours&apos; notice — fees are non-refundable once reserved</p>
            <p>• Exam fees are set by the credentialing provider and may change without notice</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">

        {/* Calendly quick-schedule option */}
        <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-2xl p-5 mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <p className="font-bold text-brand-blue-900 text-sm mb-1">Schedule directly on our calendar</p>
            <p className="text-brand-blue-700 text-xs leading-relaxed">
              Pick a date and time that works for you. We'll confirm your exam and send instructions.
            </p>
          </div>
          <a
            href={CALENDLY_CONFIG.testingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center gap-2 bg-brand-blue-700 hover:bg-brand-blue-800 text-white font-bold px-5 py-3 rounded-xl transition-colors text-sm whitespace-nowrap"
          >
            Open Calendar →
          </a>
        </div>

        <div className="flex items-center gap-3 mb-8">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs text-slate-400 font-medium">or fill out the request form below</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">

          {/* Step 1 — Select exam */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="font-extrabold text-slate-900 mb-1">1. Which exam do you need?</h2>
            <p className="text-xs text-slate-500 mb-4">Select a certification provider. Available proctoring modes will update automatically.</p>
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
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">{provider.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* NHA accommodation deadline notice */}
          {selectedProvider?.key === 'nha' && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-900 text-sm">Testing Accommodations — 30-Day Deadline</p>
                <p className="text-amber-800 text-xs mt-1 leading-relaxed">
                  If you require testing accommodations (extended time, screen reader, etc.), NHA requires requests to be submitted <strong>at least 30 days before your exam date</strong>. Submit your request early to avoid delays or missed testing opportunities.
                </p>
                <a
                  href="/testing/accommodations"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-900 mt-2"
                >
                  Accommodations Request Info →
                </a>
              </div>
            </div>
          )}

          {/* Fee summary — shown immediately after provider selection */}
          {selectedProvider && selectedProvider.fees && selectedProvider.fees.length > 0 && (
            <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-2xl p-5">
              <h2 className="font-extrabold text-slate-900 mb-3 flex items-center gap-2">
                <span className="text-brand-blue-600">$</span> Fees for {selectedProvider.name}
              </h2>
              <div className="space-y-2 mb-3">
                {selectedProvider.fees.map(fee => (
                  <div key={fee.label} className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{fee.label}</p>
                      {fee.note && <p className="text-xs text-slate-500">{fee.note}</p>}
                    </div>
                    <span className="text-brand-red-600 font-black text-xl shrink-0">${fee.amount}</span>
                  </div>
                ))}
              </div>
              {selectedProvider.groupDiscount && (
                <p className="text-xs text-brand-blue-700 bg-brand-blue-100 rounded-lg px-3 py-2">
                  {selectedProvider.groupDiscount}
                </p>
              )}
              <p className="text-xs text-slate-400 mt-3">Payment due at time of booking confirmation.</p>
            </div>
          )}

          {/* Add-on upsell — NHA only, shown for individual or unset org type */}
          {selectedProvider?.addOn && (orgType === 'Individual' || orgType === '') && (
            <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-5">
              <p className="text-amber-700 text-xs font-semibold uppercase tracking-widest mb-3">
                Recommended for first-time test takers
              </p>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addOnSelected}
                  onChange={e => setAddOnSelected(e.target.checked)}
                  className="mt-1 w-4 h-4 accent-amber-600 flex-shrink-0"
                />
                <div>
                  <p className="font-bold text-slate-900 text-sm">
                    {selectedProvider.addOn.label}{' '}
                    <span className="text-amber-700">+${(selectedProvider.addOn.amountCents / 100).toFixed(0)}</span>
                  </p>
                  <p className="text-slate-500 text-xs mt-0.5">{selectedProvider.addOn.description}</p>
                  <ul className="mt-2 space-y-1">
                    {selectedProvider.addOn.includes.map(item => (
                      <li key={item} className="flex items-start gap-1.5 text-xs text-slate-600">
                        <span className="text-amber-500 font-bold mt-0.5">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </label>
            </div>
          )}

          {/* Dynamic price summary — shown for individual or unset org type */}
          {selectedProvider?.fees && selectedProvider.fees.length > 0 && (orgType === 'Individual' || orgType === '') && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Order Summary</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-700">
                  <span>NHA Certification Exam</span>
                  <span className="font-semibold">$149</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Testing &amp; Administration</span>
                  <span className="font-semibold">$94</span>
                </div>
                {addOnSelected && selectedProvider.addOn && (
                  <div className="flex justify-between text-amber-700">
                    <span>{selectedProvider.addOn.label}</span>
                    <span className="font-semibold">+${(selectedProvider.addOn.amountCents / 100).toFixed(0)}</span>
                  </div>
                )}
                <div className="border-t border-slate-200 pt-2 flex justify-between font-extrabold text-slate-900 text-base">
                  <span>Total</span>
                  <span>
                    ${(
                      (selectedProvider.fees[0].amount) +
                      (addOnSelected && selectedProvider.addOn ? selectedProvider.addOn.amountCents / 100 : 0)
                    ).toFixed(0)}
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-3">Secure checkout · Instant confirmation · No hidden fees</p>
            </div>
          )}

          {/* Step 2 — Proctoring mode (driven by capability) */}
          {selectedProvider && availableModes.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="font-extrabold text-slate-900 mb-1">2. How would you like to test?</h2>
              <p className="text-xs text-slate-500 mb-4">
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
                          <p className="text-xs text-slate-500 mt-0.5">{TESTING_CENTER.address}</p>
                        )}
                        {mode === 'remoteProvider' && (
                          <p className="text-xs text-slate-500 mt-0.5">The certifying organization controls the remote testing system. We facilitate access.</p>
                        )}
                        {mode === 'remoteCenter' && (
                          <p className="text-xs text-slate-500 mt-0.5">Elevate staff proctor the session live via video. Participants can test from any location.</p>
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
                  <input required type="email" value={email}
                    onChange={e => { setEmail(e.target.value); setEnforcementHold(null); }}
                    onBlur={e => { checkEnforcementHold(e.target.value); captureLead(e.target.value); }}
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

              {/* Slot picker — pulls live availability from DB */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Select a testing date &amp; time *
                </label>
                {slotsLoading ? (
                  <p className="text-xs text-slate-400 py-2">Loading available slots...</p>
                ) : slots.length === 0 ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                    <p className="text-xs text-amber-800 font-medium">No slots currently available online.</p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      Call <a href={`tel:${TESTING_CENTER.phoneTel}`} className="font-semibold underline">{TESTING_CENTER.phone}</a> to schedule directly.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {slots.map(slot => {
                      const start = new Date(slot.startTime);
                      const end   = new Date(slot.endTime);
                      const dateLabel = start.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
                      const timeLabel = `${start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} – ${end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
                      const selected  = selectedSlotId === slot.id;
                      const almostFull = slot.spotsRemaining <= 2;
                      return (
                        <label
                          key={slot.id}
                          className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                            selected ? 'border-brand-blue-500 bg-brand-blue-50' : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="slotId"
                            value={slot.id}
                            checked={selected}
                            onChange={() => {
                              setSelectedSlotId(slot.id);
                              setPreferredDate(start.toISOString().split('T')[0]);
                            }}
                            className="mt-0.5 flex-shrink-0"
                            required
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-900">{dateLabel}</p>
                            <p className="text-xs text-slate-500">{timeLabel}</p>
                          </div>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                            almostFull ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                          }`}>
                            {slot.spotsRemaining} spot{slot.spotsRemaining !== 1 ? 's' : ''} left
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Additional notes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500 resize-none"
                  placeholder="Specific exam types, accessibility needs, or other details" />
              </div>

              {/* Enforcement hold — must pay fee before booking */}
              {checkingHold && (
                <p className="text-xs text-slate-500 text-center">Checking account status...</p>
              )}
              {enforcementHold && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-bold text-red-900 text-sm">
                        {enforcementHold.enforcement_type === 'no_show'
                          ? 'Missed Appointment Fee Required'
                          : enforcementHold.enforcement_type === 'retake'
                          ? 'Retake Fee Required'
                          : 'Reschedule Fee Required'}
                      </p>
                      <p className="text-red-700 text-xs mt-1">
                        A ${(enforcementHold.fee_cents / 100).toFixed(0)} fee must be paid before you can book a new session.
                      </p>
                      <button
                        type="button"
                        onClick={handlePayEnforcementFee}
                        disabled={payingFee}
                        className="mt-3 inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        {payingFee ? 'Redirecting...' : `Pay $${(enforcementHold.fee_cents / 100).toFixed(0)} to Unlock Booking`}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !!enforcementHold || checkingHold}
                className="w-full bg-brand-red-600 hover:bg-brand-red-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors text-sm"
              >
                {submitting
                  ? 'Processing...'
                  : selectedProvider?.fees?.length && orgType === 'Individual'
                  ? `Pay & Book — $${
                      selectedProvider.fees[0].amount +
                      (addOnSelected && selectedProvider.addOn ? selectedProvider.addOn.amountCents / 100 : 0)
                    }`
                  : 'Submit Booking Request'}
              </button>

              <p className="text-xs text-slate-500 text-center">
                Or call us directly: <a href={`tel:${TESTING_CENTER.phoneTel}`} className="text-brand-blue-600 font-semibold inline-flex items-center gap-1"><Phone className="w-3 h-3" />{TESTING_CENTER.phone}</a>
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
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><p className="text-slate-500 text-sm">Loading...</p></div>}>
      <BookingForm />
    </Suspense>
  );
}
