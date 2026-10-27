'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, CheckCircle, CreditCard, ShieldCheck } from 'lucide-react';
import { useSafeSearchParams } from '@/hooks/useSafeSearchParams';
import { TESTING_CENTER } from '@/lib/testing/testing-config';
import { validTestingReference } from '@/lib/testing/booking-calendar';

type Confirmation = { found: boolean; paid?: boolean; schedulingPending?: boolean; examName?: string; confirmationCode?: string; appointment?: string; googleCalendarUrl?: string };

export default function BookTestingPage() {
  const searchParams = useSafeSearchParams();
  const invoiceParam = searchParams.get('invoice_id') || '';
  const tokenParam = searchParams.get('booking_token') || '';
  const [hasCheckout, setHasCheckout] = useState(false);
  const [checking, setChecking] = useState(true);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let invoiceId = invoiceParam;
    let token = tokenParam;
    try {
      const saved = JSON.parse(sessionStorage.getItem('testingCheckout') || '{}');
      // Never pair a link for one invoice with a token for a different checkout.
      if (!invoiceId) { invoiceId = saved.invoiceId || ''; token = token || saved.bookingToken || ''; }
      else if (invoiceId === saved.invoiceId) token = token || saved.bookingToken || '';
    } catch { /* A confirmation email link works without browser storage. */ }
    setHasCheckout(Boolean(invoiceId));
    setConfirmation(null);
    setError('');
    if (!invoiceId) { setChecking(false); return; }
    if (!validTestingReference(invoiceId) || !validTestingReference(token)) {
      setError('Open the private confirmation link in your booking email. Contact the Testing Center if you need help finding it.');
      setChecking(false);
      return;
    }
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const controller = new AbortController();
    setChecking(true);
    let attempts = 0;
    let paid = false;
    async function poll() {
      try {
        const params = new URLSearchParams({ invoice_id: invoiceId, booking_token: token });
        const response = await fetch(`/api/testing/booking-status?${params}`, { cache: 'no-store', signal: controller.signal });
        const data: Confirmation = await response.json();
        if (cancelled) return;
        paid = paid || Boolean(data.paid);
        if (response.ok && data.found) {
          setConfirmation(data); setChecking(false); return;
        }
        if (response.status === 400 || response.status === 404) {
          setError('Use the private booking link from your confirmation email or contact the Testing Center.');
          setChecking(false); return;
        }
      } catch { if (cancelled) return; }
      if (cancelled) return;
      attempts += 1;
      if (attempts < 5) { timer = setTimeout(poll, 2000); return; }
      setChecking(false);
      setError(paid
        ? 'Payment is confirmed. Your appointment reservation is still being processed. Check again shortly or contact the Testing Center.'
        : 'Payment has not been confirmed yet. If you paid, check again shortly or contact the Testing Center before starting another checkout.');
    }
    void poll();
    return () => { cancelled = true; controller.abort(); if (timer) clearTimeout(timer); };
  }, [invoiceParam, tokenParam, retry]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-16">
      <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
        {confirmation?.found ? (
          <>
            <CheckCircle className="mx-auto h-14 w-14 text-emerald-600" />
            <h1 className="mt-5 text-center text-3xl font-extrabold text-slate-950">Testing appointment confirmed</h1>
            <p className="mt-3 text-center text-lg font-bold text-slate-800">{confirmation.examName}</p>
            <p className="mt-2 text-center font-semibold text-slate-700">{confirmation.appointment}</p>
            <p className="mt-3 text-center text-sm text-slate-600">Confirmation code: <strong>{confirmation.confirmationCode}</strong></p>
            <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-5 text-center">
              <p className="text-sm leading-relaxed text-blue-900">Your testing time is reserved. Save it to your Google Calendar so you have the date, time, and location handy.</p>
              {confirmation.googleCalendarUrl ? (
                <a href={confirmation.googleCalendarUrl} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-blue-700 px-5 py-3 font-bold text-white">
                  <CalendarDays className="h-5 w-5" /> Add to Google Calendar
                </a>
              ) : null}
            </div>
            <div className="mt-6 rounded-xl bg-slate-50 p-5 text-sm leading-relaxed text-slate-700">
              <p className="font-bold">Exam day checklist</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Bring a valid government-issued photo ID.</li>
                <li>Arrive {TESTING_CENTER.policy.arriveMinutesBefore} minutes early.</li>
                <li>Location: {TESTING_CENTER.address}</li>
              </ul>
            </div>
          </>
        ) : checking || hasCheckout ? (
          <>
            <ShieldCheck className="mx-auto h-12 w-12 text-brand-blue-700" />
            <h1 className="mt-5 text-center text-3xl font-extrabold text-slate-950">{checking ? 'Verifying your booking' : 'Booking confirmation pending'}</h1>
            <p className="mt-4 text-center leading-relaxed text-slate-600">{error || 'We are checking your payment and reserved testing appointment.'}</p>
            {!checking ? <button type="button" onClick={() => setRetry((value) => value + 1)} className="mt-6 w-full rounded-xl bg-brand-blue-700 px-5 py-3 font-bold text-white">Check again</button> : null}
          </>
        ) : (
          <>
            <CreditCard className="mx-auto h-12 w-12 text-brand-red-600" />
            <h1 className="mt-5 text-center text-3xl font-extrabold text-slate-950">Book your testing day</h1>
            <p className="mt-4 text-center leading-relaxed text-slate-600">Choose your exact exam and an available testing date, then complete secure checkout. We will email your reserved appointment and Google Calendar reminder link after payment is confirmed.</p>
            <Link href="/testing/checkout" className="mt-6 flex items-center justify-center rounded-xl bg-brand-red-600 px-6 py-3.5 font-bold text-white">Choose Exam & Testing Date</Link>
          </>
        )}
        <p className="mt-7 text-center text-sm text-slate-600">Questions? <a href={`tel:${TESTING_CENTER.phoneTel}`} className="font-semibold text-brand-blue-700">{TESTING_CENTER.phone}</a></p>
        <Link href="/testing" className="mt-4 block text-center text-sm font-bold text-slate-700">Back to Testing</Link>
      </div>
    </main>
  );
}
