'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

const REASON_MESSAGES: Record<string, { title: string; body: string }> = {
  missing_params: {
    title: 'Payment Session Expired',
    body: 'Your payment session is missing required information. This can happen if you navigated back or the session timed out. Please try again.',
  },
  context_not_found: {
    title: 'Payment Session Not Found',
    body: 'We could not locate your payment session. Please try starting your enrollment again.',
  },
  charge_failed: {
    title: 'Payment Declined',
    body: 'Your payment could not be processed. Please check your information with your financing provider and try again.',
  },
  enrollment_failed: {
    title: 'Enrollment Error',
    body: 'Your payment was processed but we encountered an issue completing your enrollment. Please contact support — you will not be charged twice.',
  },
};

function PaymentErrorContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason') ?? 'unknown';
  const msg = REASON_MESSAGES[reason] ?? {
    title: 'Something Went Wrong',
    body: 'An unexpected error occurred during your payment. Please try again or contact support.',
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-rose-100">
      <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{msg.title}</h1>
        <p className="text-gray-600 mb-6">{msg.body}</p>
        <p className="text-xs text-gray-400 mb-6">Error code: {reason}</p>
        <div className="flex flex-col gap-3">
          <Link
            href="/programs"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Browse Programs
          </Link>
          <Link
            href="/contact"
            className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
          >
            Contact Support
          </Link>
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-600 transition"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    }>
      <PaymentErrorContent />
    </Suspense>
  );
}
