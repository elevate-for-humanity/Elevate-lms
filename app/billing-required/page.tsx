'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertTriangle, CheckCircle, Phone, Mail, Loader2 } from 'lucide-react';

function BillingRequiredContent() {
  const searchParams = useSearchParams();
  const updated = searchParams.get('updated') === '1';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpdatePayment() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/barber/update-payment', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        return;
      }
      window.location.href = data.url;
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="max-w-lg w-full">

        {updated ? (
          /* ── Payment updated confirmation ── */
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 mb-2">Payment Method Updated</h1>
            <p className="text-slate-600 mb-6">
              Your payment method has been updated. Access is restored after the past-due balance is successfully processed.
            </p>
            <a
              href="/learner/dashboard"
              className="inline-block bg-brand-orange-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-brand-orange-700 transition-colors"
            >
              Go to Dashboard
            </a>
          </div>
        ) : (
          /* ── Suspended / past due state ── */
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-red-600 px-6 py-5">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-white flex-shrink-0" />
                <h1 className="text-xl font-black text-white">Account Access Suspended</h1>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <p className="text-slate-700">
                Your barber apprenticeship access has been suspended because a weekly tuition payment could not be processed.
              </p>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800 space-y-1">
                <p className="font-semibold">Your progress is safe.</p>
                <p>All logged hours, competency records, and course progress are preserved. Access is restored immediately once payment is updated.</p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                onClick={handleUpdatePayment}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-brand-orange-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-brand-orange-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Opening payment portal…
                  </>
                ) : (
                  'Update Payment Method'
                )}
              </button>

              <p className="text-xs text-slate-500 text-center">
                You will be redirected to Stripe's secure payment portal.
              </p>

              <div className="border-t pt-4 space-y-2">
                <p className="text-sm font-medium text-slate-700">Need help?</p>
                <a
                  href="tel:+13173143757"
                  className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
                >
                  <Phone className="w-4 h-4" />
                  (317) 314-3757
                </a>
                <a
                  href="mailto:elevate4humanityedu@gmail.com"
                  className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
                >
                  <Mail className="w-4 h-4" />
                  elevate4humanityedu@gmail.com
                </a>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default function BillingRequiredPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    }>
      <BillingRequiredContent />
    </Suspense>
  );
}
