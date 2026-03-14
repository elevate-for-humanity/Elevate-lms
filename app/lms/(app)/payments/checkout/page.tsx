'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CreditCard, Lock, ArrowLeft, AlertCircle } from 'lucide-react';

/**
 * Exam fee checkout page.
 *
 * Entry points:
 *   /lms/payments/checkout?attemptId=<uuid>   — credential pipeline (exam fee)
 *   /lms/payments/checkout?program=cna&amount=200&type=down-payment  — legacy enrollment
 *
 * Funding guard (exam fee path):
 *   funding_source != self_pay AND funding_status = approved → block checkout, show sponsor message
 *   funding_source != self_pay AND funding_status = pending  → block checkout, show review message
 *   everything else → proceed to Stripe checkout
 */

function CheckoutContent() {
  const searchParams = useSearchParams();
  const attemptId = searchParams.get('attemptId');
  const program = searchParams.get('program') || 'cna';
  const amount = searchParams.get('amount') || '200';
  const type = searchParams.get('type') || 'down-payment';

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [blockedMessage, setBlockedMessage] = useState('');
  const [name, setName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');

  const programNames: Record<string, string> = {
    cna: 'CNA Certification',
    barber: 'Barber Apprenticeship',
    hvac: 'HVAC Technician',
  };

  const SOURCE_LABELS: Record<string, string> = {
    elevate: 'Elevate for Humanity',
    grant: 'a grant',
    employer: 'your employer',
    partner: 'a partner organization',
    scholarship: 'a scholarship',
  };

  // ── Exam fee checkout (attemptId path) ──────────────────────────────
  const handleExamFeeCheckout = async () => {
    setError('');
    setIsProcessing(true);
    try {
      const fundingRes = await fetch(`/api/credentials/funding-decision?attemptId=${attemptId}`);
      const funding = await fundingRes.json();
      if (!fundingRes.ok) throw new Error(funding.error || 'Failed to load funding decision');

      // Hard guard: sponsored + approved → no checkout
      if (funding.fundingSource !== 'self_pay' && funding.fundingStatus === 'approved') {
        setBlockedMessage(
          `${SOURCE_LABELS[funding.fundingSource] ?? 'Your sponsor'} is covering your exam fee. No payment is required. Return to your credentials page to schedule your exam.`
        );
        setIsProcessing(false);
        return;
      }

      // Sponsored but not yet approved → pending review
      if (funding.fundingSource !== 'self_pay' && funding.fundingStatus === 'pending') {
        setBlockedMessage(
          'Your funding request is under review. You will be notified when it is approved. Questions? Call (317) 314-3757.'
        );
        setIsProcessing(false);
        return;
      }

      // Self-pay or unresolved → Stripe checkout
      const res = await fetch('/api/credentials/exam-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to create checkout session');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment processing failed. Please try again.');
      setIsProcessing(false);
    }
  };

  // ── Legacy enrollment checkout ──────────────────────────────────────
  const handleLegacySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsProcessing(true);
    try {
      const res = await fetch('/api/enroll/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseInt(amount),
          program,
          paymentType: type,
          description: `${programNames[program] || program} - ${type === 'down-payment' ? 'Down Payment' : 'Full Payment'}`,
          successUrl: `${window.location.origin}/lms/payments/success?program=${program}&type=${type}`,
          cancelUrl: `${window.location.origin}/programs/${program}-certification/enroll`,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to create checkout session');
      }
    } catch {
      setError('Payment processing failed. Please try again.');
      setIsProcessing(false);
    }
  };

  // ── Blocked (sponsored or pending) ─────────────────────────────────
  if (blockedMessage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-lg w-full bg-white rounded-2xl shadow-lg border p-8 text-center">
          <div className="w-16 h-16 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-brand-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-3">No Payment Required</h1>
          <p className="text-slate-600 mb-6">{blockedMessage}</p>
          <Link
            href="/lms/certification"
            className="inline-flex items-center gap-2 bg-brand-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-blue-700 transition"
          >
            View My Credentials
          </Link>
        </div>
      </div>
    );
  }

  // ── Exam fee checkout UI ────────────────────────────────────────────
  if (attemptId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-lg mx-auto px-4 py-12">
          <Link href="/lms/certification" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8">
            <ArrowLeft className="w-4 h-4" />
            Back to My Credentials
          </Link>
          <div className="bg-white rounded-2xl shadow-lg border p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-brand-blue-600" />
              </div>
              <h1 className="text-2xl font-bold">Exam Fee Payment</h1>
              <p className="text-gray-600 mt-2">Pay your credential exam fee to schedule your exam</p>
            </div>
            {error && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}
            <div className="bg-slate-50 rounded-xl p-4 mb-6 text-sm text-slate-600 flex items-start gap-2">
              <Lock className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
              <span>Secured by Stripe. Your card details are never stored on our servers.</span>
            </div>
            <button
              onClick={handleExamFeeCheckout}
              disabled={isProcessing}
              className="w-full bg-brand-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-brand-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Loading...' : 'Proceed to Payment'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Legacy enrollment checkout UI ───────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-12">
        <Link href={`/programs/${program}-certification/enroll`} className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Enrollment
        </Link>
        <div className="bg-white rounded-2xl shadow-lg border p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-8 h-8 text-brand-blue-600" />
            </div>
            <h1 className="text-2xl font-bold">Complete Payment</h1>
            <p className="text-gray-600 mt-2">
              {programNames[program] || program} — {type === 'down-payment' ? 'Down Payment' : 'Full Payment'}
            </p>
          </div>
          {error && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
          <div className="bg-brand-blue-50 rounded-xl p-4 mb-6 flex justify-between items-center">
            <span className="font-medium text-brand-blue-900">
              {type === 'down-payment' ? 'Down Payment' : 'Total'}
            </span>
            <span className="text-2xl font-bold text-brand-blue-900">${amount}</span>
          </div>
          <form onSubmit={handleLegacySubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name on card</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                placeholder="Full name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Card number</label>
              <input type="text" value={cardNumber} onChange={e => setCardNumber(e.target.value)} required maxLength={19}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                placeholder="1234 5678 9012 3456" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expiry</label>
                <input type="text" value={expiry} onChange={e => setExpiry(e.target.value)} required maxLength={5}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                  placeholder="MM/YY" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CVC</label>
                <input type="text" value={cvc} onChange={e => setCvc(e.target.value)} required maxLength={4}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                  placeholder="123" />
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Lock className="w-3 h-3" />
              <span>Secured by Stripe. Your card details are never stored on our servers.</span>
            </div>
            <button type="submit" disabled={isProcessing}
              className="w-full bg-brand-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-brand-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
              {isProcessing ? 'Processing...' : `Pay $${amount}`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-blue-600 border-t-transparent" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
