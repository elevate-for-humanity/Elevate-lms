import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateMetadata } from '@/lib/seo/metadata';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = generateMetadata({
  title: 'Application-Success',
  description: 'Application-Success - Elevate for Humanity workforce training and career development programs in Indianapolis.',
  path: '/application-success',
});

import Link from 'next/link';
import { PartyPopper } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export default async function ApplicationSuccessPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

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
  
  // Log success page visit
  await db.from('page_views').insert({ page: 'application_success' }).select();
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Apply', href: '/apply' }, { label: 'Success' }]} />
        </div>
      </div>

    <div className="mx-auto max-w-2xl px-4 py-16">
      <div className="rounded-2xl border bg-white p-8 shadow-sm text-center">
        <div className="text-5xl mb-4">
          <PartyPopper className="w-5 h-5 inline-block" />
        </div>
        <h1 className="text-3xl font-bold text-black mb-4">
          Application Received
        </h1>
        <p className="text-lg text-black mb-4">
          Your application is received and time-stamped. You'll receive an email update. From here, your application moves into review.
        </p>
        <p className="text-base text-gray-600 mb-8">
          One of two things happens: you'll be approved and receive your next step to enroll, or we'll send you a request for any missing items and your application pauses until it's provided.
        </p>

        <div className="rounded-xl border bg-gray-50 p-6 text-left mb-8">
          <h2 className="text-lg font-semibold text-black mb-4">
            Next: Review & Enrollment Steps
          </h2>
          <ol className="space-y-3 text-black">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-brand-blue-600 text-white text-sm font-semibold">
                1
              </span>
              <span>
                Create an account at{' '}
                <a
                  href="https://www.indianacareerconnect.com"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold underline"
                >
                  www.indianacareerconnect.com
                </a>
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-brand-blue-600 text-white text-sm font-semibold">
                2
              </span>
              <span>Schedule a WorkOne appointment</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-brand-blue-600 text-white text-sm font-semibold">
                3
              </span>
              <span>
                Tell them you are enrolling with{' '}
                <strong>Elevate for Humanity</strong>
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-brand-blue-600 text-white text-sm font-semibold">
                4
              </span>
              <span>
                Once scheduled, contact us back so we can track your progress
              </span>
            </li>
          </ol>
        </div>

        <div className="space-y-3">
          <a
            href="https://calendly.com/elevate-for-humanity/advisor-call"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full rounded-xl bg-brand-blue-600 px-6 py-3 text-center font-semibold text-white hover:bg-brand-blue-700 transition-colors"
          >
            Schedule a Meeting With an Advisor
          </a>
          <Link
            href="/"
            className="block w-full rounded-xl border px-6 py-3 text-center font-semibold text-black hover:bg-gray-50"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
    </div>
  );
}
