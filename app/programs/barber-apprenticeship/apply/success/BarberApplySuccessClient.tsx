'use client';

import Link from 'next/link';
import { CheckCircle, Scissors, LogIn } from 'lucide-react';
import { useSafeSearchParams } from '@/hooks/useSafeSearchParams';

export default function BarberApplySuccessClient() {
  const searchParams = useSafeSearchParams();
  const isFunded = searchParams.get('funded') === '1';

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-9 h-9 text-brand-green-600" />
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-2">Application Received!</h1>
          <p className="text-slate-600 mb-6">
            {isFunded
              ? 'Our enrollment team will contact you within 2 business days to verify your funding and finalize enrollment.'
              : "Check your email — we've sent a confirmation with your enrollment details and next steps."}
          </p>

          {!isFunded && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-left">
              <div className="flex gap-3">
                <Scissors className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-900 mb-1">
                    Automatic Weekly Billing
                  </p>
                  <p className="text-sm text-amber-800">
                    Your card on file will be charged automatically every Friday until your balance
                    is paid in full. If a payment fails you will receive an email and have 7 days to
                    update your card.
                  </p>
                </div>
              </div>
            </div>
          )}

          {isFunded && (
            <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-xl p-4 mb-6 text-left text-sm text-brand-blue-900">
              <p className="font-semibold mb-1">Next steps</p>
              <ul className="list-disc pl-5 space-y-1 text-brand-blue-800">
                <li>Keep your WorkOne, ICC, or FSSA approval letters handy if you have them.</li>
                <li>Watch for email from our enrollment team with document requests.</li>
                <li>Do not pay tuition until your funding path is confirmed.</li>
              </ul>
            </div>
          )}

          <div className="space-y-3 mb-8">
            <Link
              href="/programs/barber-apprenticeship/orientation"
              className="w-full flex items-center justify-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-colors"
            >
              <Scissors className="w-5 h-5" />
              Continue to Orientation
            </Link>
            <Link
              href="/login?redirect=/programs/barber-apprenticeship/orientation"
              className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              <LogIn className="w-5 h-5" />
              Sign In to Your Account
            </Link>
          </div>

          <p className="text-xs text-slate-400">
            Questions? Email us at{' '}
            <a
              href="mailto:elevate4humanityedu@gmail.com"
              className="text-brand-blue-600 hover:underline"
            >
              elevate4humanityedu@gmail.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
