'use client';

import React from 'react';


import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSafeSearchParams } from '@/hooks/useSafeSearchParams';
import Link from 'next/link';
import { CheckCircle, Loader2 } from 'lucide-react';

function AffirmConfirmContent() {
  const searchParams = useSafeSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [transactionId, setTransactionId] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const checkout_token = searchParams.get('checkout_token');

    if (!checkout_token) {
      setStatus('error');
      setErrorMessage('No checkout token provided');
      return;
    }

    // Authorize the transaction
    authorizeTransaction(checkout_token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const authorizeTransaction = async (checkout_token: string) => {
    try {
      const response = await fetch('/api/affirm/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkout_token,
          action: 'authorize',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to authorize payment');
      }

      const data = await response.json();
      setTransactionId(data.transaction_id);
      setStatus('success');

      // Redirect to success page after 3 seconds
      setTimeout(() => {
        router.push(`/payment/success?transaction_id=${data.transaction_id}&provider=affirm`);
      }, 3000);
    } catch (error) {
      /* Error handled silently */
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to process payment');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {status === 'processing' && (
          <div className="text-center">
            <Loader2 className="w-16 h-16 text-brand-blue-600 animate-spin mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-black mb-2">Processing Payment</h1>
            <p className="text-black">Please wait while we confirm your payment with Affirm...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-brand-green-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-black mb-2">Payment Successful!</h1>
            <p className="text-black mb-4">Your payment has been processed successfully.</p>
            {transactionId && (
              <p className="text-sm text-black mb-6">Transaction ID: {transactionId}</p>
            )}
            <p className="text-sm text-black">Redirecting to confirmation page...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-brand-orange-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-black mb-2">Payment Failed</h1>
            <p className="text-black mb-6">
              {errorMessage || 'There was an error processing your payment.'}
            </p>
            <div className="flex flex-col gap-3">
              <Link
                href="/programs"
                className="inline-block px-6 py-3 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700 transition-colors"
              >
                Browse Programs
              </Link>
              <Link
                href="/contact"
                className="inline-block px-6 py-3 bg-slate-100 text-black font-semibold rounded-lg hover:bg-slate-200 transition-colors"
              >
                Contact Support
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AffirmConfirmPage() {
  return (
          <AffirmConfirmContent />
  );
}
