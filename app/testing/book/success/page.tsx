'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Phone, MapPin } from 'lucide-react';
import { TESTING_CENTER } from '@/lib/testing/testing-config';
import { Suspense } from 'react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Clear any pending booking from session storage
    sessionStorage.removeItem('pendingBooking');
    setChecked(true);
  }, []);

  if (!checked) return null;

  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <div className="w-16 h-16 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-9 h-9 text-brand-green-600" />
          </div>

          <h1 className="text-2xl font-extrabold text-slate-900 mb-2">
            Payment Received
          </h1>
          <p className="text-slate-500 mb-6">
            Your exam booking is confirmed. Check your email for your confirmation code and next steps.
          </p>

          <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-xl p-4 text-left mb-6 space-y-2">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-brand-blue-600 shrink-0 mt-0.5" />
              <p className="text-sm text-brand-blue-900">
                <strong>Location:</strong> {TESTING_CENTER.address}
              </p>
            </div>
            <div className="flex items-start gap-2">
              <Phone className="w-4 h-4 text-brand-blue-600 shrink-0 mt-0.5" />
              <p className="text-sm text-brand-blue-900">
                <strong>Questions?</strong>{' '}
                <a href={`tel:${TESTING_CENTER.phoneTel}`} className="font-semibold hover:underline">{TESTING_CENTER.phone}</a>
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-400 mb-6">
            Our testing coordinator will contact you within 1 business day to confirm your date and time.
            {sessionId && (
              <> Reference: <span className="font-mono">{sessionId.slice(-8).toUpperCase()}</span></>
            )}
          </p>

          <div className="flex flex-col gap-3">
            <Link
              href="/testing"
              className="w-full bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold py-3 rounded-xl transition-colors text-sm"
            >
              Back to Testing Center
            </Link>
            <Link
              href="/"
              className="w-full border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium py-3 rounded-xl transition-colors text-sm"
            >
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-slate-500 text-sm">Loading...</p>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
