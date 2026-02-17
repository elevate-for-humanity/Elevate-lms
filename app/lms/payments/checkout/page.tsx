'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CreditCard, Lock, ArrowLeft } from 'lucide-react';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const program = searchParams.get('program') || 'cna';
  const amount = searchParams.get('amount') || '200';
  const type = searchParams.get('type') || 'down-payment';
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const programNames: Record<string, string> = {
    cna: 'CNA Certification',
    barber: 'Barber Apprenticeship',
    hvac: 'HVAC Technician',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsProcessing(true);

    try {
      // Create Stripe checkout session for enrollment payment
      const response = await fetch('/api/enroll/payment', {
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

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to create checkout session');
      }
    } catch (err) {
      setError('Payment processing failed. Please try again.');
      setIsProcessing(false);
    }
  };

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
              {programNames[program] || program} - {type === 'down-payment' ? 'Down Payment' : 'Full Payment'}
            </p>
          </div>

          <div className="bg-brand-blue-50 rounded-xl p-4 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Amount Due Today</span>
              <span className="text-2xl font-bold text-brand-blue-600">${amount}</span>
            </div>
            {type === 'down-payment' && (
              <p className="text-sm text-gray-600 mt-2">
                Weekly payments of $50 will begin next Monday
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cardholder Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Smith"
                required
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Card Number
              </label>
              <input
                type="text"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
                placeholder="4242 4242 4242 4242"
                required
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Date
                </label>
                <input
                  type="text"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  placeholder="MM/YY"
                  required
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CVC
                </label>
                <input
                  type="text"
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="123"
                  required
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                />
              </div>
            </div>

            {error && (
              <div className="bg-brand-red-50 border border-brand-red-200 text-brand-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full bg-brand-blue-600 text-white py-4 rounded-lg font-bold hover:bg-brand-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                'Processing...'
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  Pay ${amount} Securely
                </>
              )}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
            <Lock className="w-4 h-4" />
            <span>Secured by Stripe - 256-bit SSL encryption</span>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Questions? Contact us at</p>
          <p className="font-medium">info@elevateforhumanity.org</p>
        </div>
      </div>
    </div>
  );
}

export default function LMSPaymentCheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading checkout...</p>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
