'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Phone, MapPin, Loader2 } from 'lucide-react';
import { Suspense } from 'react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState<'completing' | 'done'>('completing');
  const [confirmationCode, setConfirmationCode] = useState<string | null>(null);
  const [addOn, setAddOn] = useState(false);
  const attempted = useRef(false);

  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;

    const raw = sessionStorage.getItem('pendingBooking');
    sessionStorage.removeItem('pendingBooking');

    if (!raw) {
      // No pending booking — webhook already handled it (org booking)
      setStatus('done');
      return;
    }

    let pending: Record<string, unknown>;
    try {
      pending = JSON.parse(raw);
    } catch {
      setStatus('done');
      return;
    }

    const hasAddOn = pending.addOn === true;
    setAddOn(hasAddOn);

    // Complete the booking now that Stripe payment is confirmed
    fetch('/api/testing/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        examType:         pending.examType,
        examName:         pending.examName,
        bookingType:      pending.bookingType ?? 'individual',
        firstName:        pending.firstName,
        lastName:         pending.lastName,
        email:            pending.email,
        phone:            pending.phone ?? null,
        organization:     pending.organization ?? null,
        participantCount: pending.participantCount ?? 1,
        preferredDate:    pending.preferredDate ?? null,
        preferredTime:    pending.preferredTime ?? null,
        slotId:           pending.slotId ?? null,
        notes:            pending.notes ?? null,
        addOn:            hasAddOn,
        paymentStatus:    'paid',
        stripeSessionId:  sessionId,
      }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.confirmationCode) setConfirmationCode(data.confirmationCode);
        // Mark lead converted regardless of booking result
        if (pending.email && pending.examType) {
          fetch('/api/testing/leads', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: pending.email, examType: pending.examType }),
          }).catch(() => {});
        }
        setStatus('done');
      })
      .catch(() => setStatus('done'));
  }, [sessionId]);

  if (status === 'completing') {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-[#1E3A5F] animate-spin mx-auto mb-4" />
          <p className="text-slate-500 text-sm">Confirming your booking...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-9 h-9 text-green-600" />
          </div>

          <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Booking Confirmed</h1>

          {confirmationCode && (
            <p className="text-3xl font-black tracking-widest text-[#1E3A5F] my-4">
              {confirmationCode}
            </p>
          )}

          <p className="text-slate-500 text-sm mb-6">
            Check your email for your confirmation code and next steps. Our testing coordinator
            will contact you within 1 business day to confirm your exact date and time.
          </p>

          {addOn && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left mb-6">
              <p className="text-sm font-bold text-amber-900 mb-1">Certification Success Package included</p>
              <p className="text-xs text-amber-700">
                Check your email for access instructions to your practice test and study guide.
              </p>
            </div>
          )}

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left mb-6 space-y-2">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <p className="text-sm text-slate-700">8888 Keystone Crossing Suite 1300, Indianapolis, IN 46240</p>
            </div>
            <div className="flex items-start gap-2">
              <Phone className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <p className="text-sm text-slate-700">
                Questions?{' '}
                <a href="tel:+13173143757" className="font-semibold text-[#1E3A5F] hover:underline">(317) 314-3757</a>
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Link href="/certification-testing" className="w-full bg-[#1E3A5F] hover:bg-[#162d4a] text-white font-bold py-3 rounded-xl transition-colors text-sm">
              Back to Testing Center
            </Link>
            <Link href="/" className="w-full border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium py-3 rounded-xl transition-colors text-sm">
              Go to Homepage
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function TestingBookSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
