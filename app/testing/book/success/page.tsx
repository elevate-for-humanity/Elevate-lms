'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Phone, MapPin, Calendar, Loader2 } from 'lucide-react';
import { TESTING_CENTER } from '@/lib/testing/testing-config';

interface BookingStatus {
  found: boolean;
  confirmationCode?: string;
  examName?: string;
  calendlySchedulingUrl?: string;
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  const [status, setStatus] = useState<BookingStatus | null>(null);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    sessionStorage.removeItem('pendingBooking');
  }, []);

  // Poll /api/testing/booking-status until the webhook has fired and the
  // booking row exists (usually < 2s). Give up after 10 attempts (~20s).
  useEffect(() => {
    if (!sessionId) return;

    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(
          `/api/testing/booking-status?session_id=${encodeURIComponent(sessionId!)}`,
          { cache: 'no-store' }
        );
        const data: BookingStatus = await res.json();
        if (cancelled) return;

        if (data.found) {
          setStatus(data);
          return;
        }

        setAttempts(prev => {
          const next = prev + 1;
          if (next < 10) {
            setTimeout(poll, 2000);
          } else {
            // Give up — show generic success without the link
            setStatus({ found: false });
          }
          return next;
        });
      } catch {
        if (!cancelled) setStatus({ found: false });
      }
    }

    poll();
    return () => { cancelled = true; };
  }, [sessionId]);

  const loading = status === null && sessionId;
  const hasLink = status?.found && status.calendlySchedulingUrl;

  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">

          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-9 h-9 text-green-600" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Payment Received</h1>
            {status?.confirmationCode && (
              <p className="text-slate-500 text-sm">
                Confirmation:{' '}
                <span className="font-mono font-bold text-slate-800 tracking-widest">
                  {status.confirmationCode}
                </span>
              </p>
            )}
          </div>

          {/* Calendly CTA — primary action */}
          {loading ? (
            <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-xl p-5 mb-6 flex items-center justify-center gap-3 text-brand-blue-700 text-sm">
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              Preparing your scheduling link…
            </div>
          ) : hasLink ? (
            <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-xl p-5 mb-6 text-center">
              <Calendar className="w-6 h-6 text-brand-blue-600 mx-auto mb-2" />
              <p className="font-bold text-brand-blue-900 text-sm mb-1">
                Next Step: Pick Your Exam Date
              </p>
              <p className="text-brand-blue-700 text-xs mb-4">
                Your payment is confirmed. Use the link below to choose a date and time.
              </p>
              <a
                href={status.calendlySchedulingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-brand-blue-700 hover:bg-brand-blue-800 text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm"
              >
                <Calendar className="w-4 h-4" />
                Schedule Your Exam →
              </a>
              <p className="text-xs text-slate-400 mt-3">
                This link is single-use. A copy was also sent to your email.
              </p>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-6">
              <p className="text-slate-600 text-sm text-center">
                Check your email for your confirmation and scheduling link.
                Our coordinator will also reach out within 1 business day.
              </p>
            </div>
          )}

          {/* Location + contact */}
          <div className="space-y-2 mb-6">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-brand-blue-600 shrink-0 mt-0.5" />
              <p className="text-sm text-slate-700">
                <strong>Location:</strong> {TESTING_CENTER.address}
              </p>
            </div>
            <div className="flex items-start gap-2">
              <Phone className="w-4 h-4 text-brand-blue-600 shrink-0 mt-0.5" />
              <p className="text-sm text-slate-700">
                <strong>Questions?</strong>{' '}
                <a
                  href={`tel:${TESTING_CENTER.phoneTel}`}
                  className="font-semibold text-brand-blue-600 hover:underline"
                >
                  {TESTING_CENTER.phone}
                </a>
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-400 text-center mb-6">
            Bring a valid government-issued photo ID. Arrive 15 minutes early.
          </p>

          <div className="flex flex-col gap-3">
            <Link
              href="/testing"
              className="w-full bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold py-3 rounded-xl transition-colors text-sm text-center"
            >
              Back to Testing Center
            </Link>
            <Link
              href="/"
              className="w-full border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium py-3 rounded-xl transition-colors text-sm text-center"
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
        <p className="text-slate-500 text-sm">Loading…</p>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
