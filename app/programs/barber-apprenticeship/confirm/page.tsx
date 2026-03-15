'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { CheckCircle2, XCircle, Loader2, Phone, Mail } from 'lucide-react';

function ConfirmContent() {
  const params = useSearchParams();
  const token = params.get('token');
  const response = params.get('response') as 'yes' | 'no' | null;

  const [status, setStatus] = useState<'loading' | 'success' | 'declined' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token || !response) {
      setStatus('error');
      setMessage('Invalid confirmation link. Please check your email and try again.');
      return;
    }

    fetch('/api/programs/barber-apprenticeship/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, response }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setStatus(response === 'yes' ? 'success' : 'declined');
          setMessage(data.message);
        } else {
          setStatus('error');
          setMessage(data.error || 'Something went wrong.');
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('Network error. Please try again.');
      });
  }, [token, response]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-brand-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Processing your response...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className={`px-8 py-6 text-center ${
            status === 'success' ? 'bg-green-600' :
            status === 'declined' ? 'bg-slate-600' :
            'bg-red-600'
          }`}>
            {status === 'success' && <CheckCircle2 className="w-12 h-12 text-white mx-auto mb-3" />}
            {status === 'declined' && <XCircle className="w-12 h-12 text-white mx-auto mb-3" />}
            {status === 'error' && <XCircle className="w-12 h-12 text-white mx-auto mb-3" />}
            <h1 className="text-xl font-bold text-white">
              {status === 'success' && 'You\'re Confirmed!'}
              {status === 'declined' && 'Response Recorded'}
              {status === 'error' && 'Something Went Wrong'}
            </h1>
          </div>

          {/* Body */}
          <div className="px-8 py-6">
            <p className="text-slate-700 text-center mb-6">{message}</p>

            {status === 'success' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-5 mb-6">
                <h3 className="font-semibold text-green-900 mb-3">What Happens Next</h3>
                <ol className="text-sm text-green-800 space-y-2 list-decimal list-inside">
                  <li>We will call or email you within 24 hours to schedule your orientation</li>
                  <li>During orientation, we walk through the program and answer your questions</li>
                  <li>After orientation, you submit your $500 down payment to secure your spot</li>
                  <li>We match you with a licensed partner barbershop</li>
                  <li>You begin your apprenticeship training</li>
                </ol>
              </div>
            )}

            {status === 'declined' && (
              <div className="bg-white border border-slate-200 rounded-lg p-5 mb-6">
                <p className="text-sm text-slate-600">
                  If you change your mind or have questions about the program, we are here to help.
                  You can reapply at any time.
                </p>
              </div>
            )}

            {/* Contact */}
            <div className="border-t border-slate-200 pt-5">
              <p className="text-sm text-slate-500 text-center mb-3">Questions? Contact us:</p>
              <div className="flex justify-center gap-6 text-sm">
                <a href="tel:+13173143757" className="flex items-center gap-1.5 text-slate-700 hover:text-brand-blue-600">
                  <Phone className="w-4 h-4" /> (317) 314-3757
                </a>
                <a href="mailto:info@elevateforhumanity.org" className="flex items-center gap-1.5 text-slate-700 hover:text-brand-blue-600">
                  <Mail className="w-4 h-4" /> Email Us
                </a>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-white px-8 py-4 text-center border-t border-slate-200">
            <Link href="/programs/barber-apprenticeship" className="text-sm text-brand-blue-600 font-medium hover:underline">
              View Program Details
            </Link>
            <span className="text-slate-300 mx-3">|</span>
            <Link href="/" className="text-sm text-brand-blue-600 font-medium hover:underline">
              Back to Home
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Elevate for Humanity Career &amp; Technical Institute
        </p>
      </div>
    </div>
  );
}

export default function BarberConfirmPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-brand-blue-600 animate-spin" />
      </div>
    }>
      <ConfirmContent />
    </Suspense>
  );
}
