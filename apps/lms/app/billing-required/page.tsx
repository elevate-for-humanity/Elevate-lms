import type { Metadata } from 'next';
import Link from 'next/link';
import { CreditCard, Mail, LogIn } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Payment Required',
  description:
    'Your Elevate for Humanity access is paused because a tuition payment is past due. Pay your balance to restore access.',
  robots: { index: false, follow: false },
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/billing-required',
  },
};

/**
 * Payment Required Page
 *
 * Landing page for a student whose login access has been denied for
 * non-payment. Reached from the LMS payment guard
 * (lib/auth/route-guards.ts requirePortalAccess) and from the
 * checkBarberSuspension 402 response (lib/barber/suspension.ts).
 *
 * This page must stay reachable by a denied student, so it performs no auth
 * checks and calls no auth guard: it is billing-exempt in
 * lib/auth/route-guards.ts (BILLING_EXEMPT_PREFIXES), it is not in the LMS
 * middleware PROTECTED_PREFIXES, and no layout above it enforces login.
 * Do not add requireUser / requirePortalAccess here — that would bounce the
 * student to /unauthorized before they can see how to pay.
 */
export default async function BillingRequiredPage({
  searchParams,
}: {
  searchParams?: Promise<{ reason?: string | string[] }>;
}) {
  const params = (await searchParams) ?? {};
  const reason = Array.isArray(params.reason) ? params.reason[0] : params.reason;
  const paymentFailed = reason === 'payment_failed';

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          {/* Icon */}
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CreditCard className="w-8 h-8 text-red-600" />
          </div>

          {/* Heading */}
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Payment Required</h1>

          {/* Message */}
          <p className="text-slate-600 mb-2">
            {paymentFailed
              ? 'Your most recent payment did not go through, and your Elevate for Humanity login access is paused until the past-due balance is paid.'
              : 'Your Elevate for Humanity login access is paused because a tuition payment is past due.'}
          </p>
          <p className="text-sm text-slate-500 mb-6">
            This applies to every student — no one is exempt. Once your payment is made, your
            access is restored.
          </p>

          {/* Reassurance */}
          <div className="bg-white rounded-lg p-4 mb-6">
            <p className="text-sm text-slate-500">
              Your progress, hours, and coursework are safe. Paying your balance restores full
              access to your courses, dashboard, and timeclock.
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Link
              href="/billing"
              className="w-full inline-flex items-center justify-center gap-2 bg-brand-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-blue-700 transition-colors"
            >
              <CreditCard className="w-5 h-5" />
              Pay Your Balance
            </Link>

            <a
              href="mailto:billing@elevateforhumanity.org"
              className="w-full inline-flex items-center justify-center gap-2 bg-slate-100 text-slate-700 px-6 py-3 rounded-lg font-semibold hover:bg-slate-200 transition-colors"
            >
              <Mail className="w-5 h-5" />
              Contact Billing Support
            </a>

            <Link
              href="/login"
              className="w-full inline-flex items-center justify-center gap-2 text-slate-600 px-6 py-3 rounded-lg font-medium hover:bg-white transition-colors"
            >
              <LogIn className="w-5 h-5" />
              Back to Sign In
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-slate-500 mt-6">
          If you believe this is an error, please email{' '}
          <a
            href="mailto:billing@elevateforhumanity.org"
            className="text-brand-blue-600 hover:underline"
          >
            billing@elevateforhumanity.org
          </a>
          .
        </p>
      </div>
    </div>
  );
}
