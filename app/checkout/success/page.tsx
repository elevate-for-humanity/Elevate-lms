import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Checkout Success | Elevate For Humanity',
  description: 'Elevate For Humanity - Career training and workforce development',
};

import { Suspense } from 'react';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

function SuccessContent({
  searchParams,
}: {
  searchParams: { session_id?: string };
}) {
  const sessionId = searchParams.session_id;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-2xl w-full bg-white shadow-lg rounded-lg p-8 md:p-12">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />

          <h1 className="text-3xl font-bold text-black mb-4">
            Payment Successful!
          </h1>

          <p className="text-lg text-black mb-8">
            Thank you for choosing Elevate for Humanity. Your platform license
            is being activated.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 text-left">
            <h2 className="text-xl font-semibold text-black mb-4">
              What happens next?
            </h2>
            <ol className="space-y-3 text-black">
              <li className="flex items-start">
                <span className="font-semibold mr-2">1.</span>
                <span>
                  You'll receive a confirmation email within 5 minutes with your
                  receipt and next steps.
                </span>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">2.</span>
                <span>
                  Our onboarding team will contact you within 24 hours to
                  schedule your kickoff call.
                </span>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">3.</span>
                <span>
                  We'll set up your account and have you live within 2-4 weeks.
                </span>
              </li>
            </ol>
          </div>

          {sessionId && (
            <div className="bg-gray-50 rounded-lg p-4 mb-8">
              <p className="text-sm text-black">
                <span className="font-semibold">Session ID:</span>{' '}
                <code className="bg-gray-200 px-2 py-2 rounded text-xs">
                  {sessionId}
                </code>
              </p>
              <p className="text-xs text-black mt-2">
                Save this for your records
              </p>
            </div>
          )}

          <div className="space-y-3">
            <Link
              href="/contact?topic=onboarding"
              className="block w-full bg-blue-600 text-white text-center py-3 rounded-lg hover:bg-blue-700 transition"
            >
              Schedule Onboarding Call
            </Link>

            <Link
              href="/"
              className="block w-full bg-gray-200 text-black text-center py-3 rounded-lg hover:bg-gray-300 transition"
            >
              Return to Homepage
            </Link>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-black">
              Questions? Contact us at{' '}
              <a
                href="mailto:elevate4humanityedu@gmail.com"
                className="text-blue-600 hover:underline"
              >
                elevate4humanityedu@gmail.com
              </a>{' '}
              or call{' '}
              <a
                href="/support"
                className="text-blue-600 hover:underline"
              >
                Get Help Online
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: { session_id?: string };
}) {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
  
  // Log checkout success
  await supabase.from('page_views').insert({ page: 'checkout_success' }).select();

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SuccessContent searchParams={searchParams} />
    </Suspense>
  );
}
