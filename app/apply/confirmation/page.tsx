import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { CheckCircle, Phone, Mail, ArrowRight, Hash } from 'lucide-react';
import ConfirmationTracking from './ConfirmationTracking';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Application Received',
  description: 'Your application has been received. We will contact you soon.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; program?: string }>;
}) {
  const params = await searchParams;
  const refNumber = params.ref ? decodeURIComponent(params.ref) : null;
  const programName = params.program ? decodeURIComponent(params.program) : null;

  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Service Unavailable</h1>
          <p className="text-slate-600">Please try again later.</p>
        </div>
      </div>
    );
  }

  // Log confirmation page visit
  try { await supabase.from('page_views').insert({ page: 'application_confirmation' }).select(); } catch { /* non-critical */ }
  return (
    <>
      <ConfirmationTracking />
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Apply', href: '/apply' }, { label: 'Confirmation' }]} />
        </div>
      </div>
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
        <div className="max-w-2xl w-full">
          {/* Success Card */}
          <div className="bg-white border border-slate-200 rounded-lg p-8 sm:p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-6">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-black mb-4">
              Application Received!
            </h1>

            {/* Reference number — shown when available */}
            {refNumber && (
              <div className="inline-flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-lg px-4 py-2 mb-6">
                <Hash className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-600">Reference number:</span>
                <span className="font-mono font-bold text-slate-900 tracking-wide">{refNumber}</span>
              </div>
            )}

            {programName && (
              <p className="text-sm font-semibold text-brand-blue-700 bg-brand-blue-50 border border-brand-blue-100 rounded-lg px-4 py-2 mb-6 inline-block">
                Program: {programName}
              </p>
            )}

            <p className="text-lg text-black mb-8">
              Thank you for applying to {PLATFORM_DEFAULTS.orgName}. We've received your application and
              will review it within 1–2 business days.
              {refNumber && (
                <> Save your reference number — you&apos;ll need it to track your application status.</>
              )}
            </p>

            {/* What's Next */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 mb-8 text-left">
              <h2 className="text-xl font-bold text-black mb-4">What Happens Next?</h2>
              <ol className="space-y-3 text-black">
                <li className="flex items-start">
                  <span className="inline-flex items-center justify-center w-6 h-6 bg-emerald-600 text-white text-sm font-bold rounded-full mr-3 flex-shrink-0 mt-0.5">
                    1
                  </span>
                  <span>Our team will review your application and verify your eligibility</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-flex items-center justify-center w-6 h-6 bg-emerald-600 text-white text-sm font-bold rounded-full mr-3 flex-shrink-0 mt-0.5">
                    2
                  </span>
                  <span>We'll contact you via email or phone to discuss next steps</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-flex items-center justify-center w-6 h-6 bg-emerald-600 text-white text-sm font-bold rounded-full mr-3 flex-shrink-0 mt-0.5">
                    3
                  </span>
                  <span>If eligible, we'll schedule your enrollment and orientation</span>
                </li>
              </ol>
            </div>

            {/* Contact Options */}
            <div className="border-t border-slate-200 pt-8">
              <p className="text-sm font-semibold text-black mb-4">Questions? Contact us:</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href={`tel:${PLATFORM_DEFAULTS.supportPhone.replace(/[^0-9]/g, "")}`}
                  className="inline-flex items-center justify-center px-6 py-3 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  {PLATFORM_DEFAULTS.supportPhone}
                </a>
                <a
                  href="mailto:elevate4humanityedu@gmail.com"
                  className="inline-flex items-center justify-center px-6 py-3 bg-white border-2 border-slate-300 text-black font-semibold rounded-lg hover:border-slate-400 transition-colors"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Email Us
                </a>
              </div>
            </div>

            {/* Next steps */}
            <div className="mt-8 pt-8 border-t border-slate-200 flex flex-col sm:flex-row gap-3">
              <Link
                href="/onboarding/learner"
                className="inline-flex items-center justify-center bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-6 py-3 rounded-lg transition-colors text-sm"
              >
                Start Onboarding
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
              {refNumber && (
                <Link
                  href={`/apply/track?id=${encodeURIComponent(refNumber)}`}
                  className="inline-flex items-center justify-center border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold px-6 py-3 rounded-lg transition-colors text-sm"
                >
                  Track Application
                </Link>
              )}
              <Link
                href="/"
                className="inline-flex items-center justify-center border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold px-6 py-3 rounded-lg transition-colors text-sm"
              >
                Return to Home
              </Link>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-6 text-center">
            <p className="text-sm text-black">
              Check your email (including spam folder) for a confirmation message.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
