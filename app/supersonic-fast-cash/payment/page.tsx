'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, Shield, CheckCircle, Lock, AlertCircle } from 'lucide-react';

export default function PaymentGatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');

  // Check if already paid — redirect immediately if so
  useEffect(() => {
    fetch('/api/supersonic-fast-cash/payment-status')
      .then(r => r.json())
      .then(data => {
        if (data.paid) {
          router.replace('/supersonic-fast-cash/upload-documents');
        } else {
          setChecking(false);
        }
      })
      .catch(() => setChecking(false));
  }, [router]);

  const handlePay = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/supersonic-fast-cash/create-payment-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();

      if (data.already_paid) {
        router.push('/supersonic-fast-cash/upload-documents');
        return;
      }
      if (!res.ok || !data.url) {
        setError(data.error || 'Failed to start checkout. Please try again.');
        return;
      }
      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-black text-sm">Checking payment status…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-slate-800 text-white py-8 px-4">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
            <CreditCard className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Secure Your Spot</h1>
            <p className="text-white text-sm mt-1">
              SupersonicFastCash · Step 3 of 4
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8 text-sm">
          {['Intake', 'Agreement', 'Payment', 'Upload Docs'].map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 font-medium ${i === 2 ? 'text-orange-600' : i < 2 ? 'text-green-600' : 'text-black'}`}>
                {i < 2 ? <CheckCircle className="w-4 h-4" /> : <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${i === 2 ? 'bg-orange-500 text-white' : 'bg-gray-200 text-black'}`}>{i + 1}</span>}
                {step}
              </div>
              {i < 3 && <span className="text-gray-300">→</span>}
            </div>
          ))}
        </div>

        {/* Payment card */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-6">
          <div className="bg-orange-50 border-b border-orange-100 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-700 font-medium">Intake Deposit</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">$49</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-black">Applied toward total fee</p>
                <p className="text-xs text-black mt-1">Remainder due at completion</p>
              </div>
            </div>
          </div>

          <div className="px-6 py-5 space-y-3">
            {[
              'Secures your spot in the queue',
              'PTIN-credentialed preparer assigned to your return',
              'Applied toward your total preparation fee',
              'Refundable if we cannot complete your return',
            ].map(item => (
              <div key={item} className="flex items-start gap-2.5 text-sm text-gray-700">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                {item}
              </div>
            ))}
          </div>

          <div className="px-6 pb-6">
            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm mb-4">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}
            <button
              onClick={handlePay}
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-lg transition-colors text-base flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              {loading ? 'Redirecting to Stripe…' : 'Pay $49 Deposit — Secure Checkout'}
            </button>
            <div className="flex items-center justify-center gap-2 mt-3 text-xs text-black">
              <Shield className="w-3 h-3" />
              Powered by Stripe · 256-bit SSL · PCI compliant
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-black">
          SupersonicFastCash · 2Exclusive LLC-S · PTIN-credentialed preparers
        </p>
      </div>
    </div>
  );
}
