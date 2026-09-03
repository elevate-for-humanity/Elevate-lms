import { Metadata } from 'next';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
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
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const refNumber = params.ref && typeof params.ref === 'string' ? decodeURIComponent(params.ref) : null;
  const programSlug = params.program && typeof params.program === 'string' ? decodeURIComponent(params.program) : null;
  // Additional params from program-specific success pages
  const paymentType = params.payment && typeof params.payment === 'string' ? params.payment : null;
  const sessionId = params.session_id && typeof params.session_id === 'string' ? params.session_id : null;
  const isFunded = params.funded === '1';
  const warning = params.warning && typeof params.warning === 'string' ? decodeURIComponent(params.warning) : null;
  // Params from legacy /apply/success (role-based flows)
  const role = (params.role && typeof params.role === 'string' ? params.role : 'student') as string;
  const isEnrolled = params.enrolled === 'true';
  const funding = params.funding && typeof params.funding === 'string' ? params.funding : null;
  const hasPassword = params.pw === '1';

  // Map program slug to display name
  const PROGRAM_DISPLAY_NAMES: Record<string, string> = {
    'barber-apprenticeship': 'Barber Apprenticeship',
    'cosmetology-apprenticeship': 'Cosmetology Apprenticeship',
    'esthetician-apprenticeship': 'Esthetician Apprenticeship',
    'nail-technician-apprenticeship': 'Nail Technician Apprenticeship',
    'hvac-technician': 'HVAC Technician',
    'peer-recovery-specialist': 'Peer Recovery Specialist',
    'qma': 'Qualified Medication Aide (QMA)',
    'cna': 'Certified Nursing Assistant (CNA)',
    'phlebotomy': 'Phlebotomy',
    'medical-assistant': 'Medical Assistant',
    'pharmacy-tech': 'Pharmacy Technician',
  };
  const programName = programSlug ? (PROGRAM_DISPLAY_NAMES[programSlug] || programSlug.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())) : null;

  // Only create Supabase client if configured — prevents build-time crashes
  let supabaseAvailable = false;
  try {
    if (!isSupabaseConfigured()) {
      supabaseAvailable = false;
    } else {
      const supabase = await createClient();
      supabaseAvailable = !!supabase;
      // Non-critical logging — don't block on failure
      if (supabaseAvailable) {
        try {
          await supabase.from('page_views').insert({ page: 'application_confirmation' }).select();
        } catch { /* non-critical */ }
      }
    }
  } catch {
    supabaseAvailable = false;
  }
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

            {/* Role-based title */}
            {isEnrolled ? (
              <h1 className="text-3xl sm:text-4xl font-bold text-black mb-4">
                You&apos;re Approved — Let&apos;s Get Started!
              </h1>
            ) : role === 'employer' ? (
              <h1 className="text-3xl sm:text-4xl font-bold text-black mb-4">
                Employer Application Submitted
              </h1>
            ) : role === 'program-holder' ? (
              <h1 className="text-3xl sm:text-4xl font-bold text-black mb-4">
                Partnership Application Submitted
              </h1>
            ) : role === 'staff' ? (
              <h1 className="text-3xl sm:text-4xl font-bold text-black mb-4">
                Staff Application Submitted
              </h1>
            ) : (
              <h1 className="text-3xl sm:text-4xl font-bold text-black mb-4">
                Application Received!
              </h1>
            )}

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

            {(paymentType || sessionId) && (
              <p className="text-sm font-semibold text-brand-green-700 bg-brand-green-50 border border-brand-green-100 rounded-lg px-4 py-2 mb-4 inline-block">
                Payment {paymentType === 'stripe' ? 'via Card' : paymentType === 'bnpl' ? 'via BNPL' : 'Confirmed'}
                {sessionId && ` — Session ${sessionId.slice(0, 16)}…`}
              </p>
            )}

            {/* Role-based description */}
            {isEnrolled ? (
              <p className="text-lg text-black mb-8">
                Your enrollment has been approved. Create your account now to access your courses and complete onboarding.
              </p>
            ) : role === 'employer' ? (
              <p className="text-lg text-black mb-8">
                Our employer relations team will review your submission and contact you within 2 business days.
              </p>
            ) : role === 'program-holder' ? (
              <p className="text-lg text-black mb-8">
                Our team will review your organization details and contact you within 2 business days to discuss partnership options.
              </p>
            ) : role === 'staff' ? (
              <p className="text-lg text-black mb-8">
                HR will review your application. Qualified candidates will be contacted for interviews.
              </p>
            ) : (
              <p className="text-lg text-black mb-8">
                Thank you for applying to {PLATFORM_DEFAULTS.orgName}. We&apos;ve received your application and
                will review it within 1–2 business days.
                {refNumber && (
                  <> Save your reference number — you&apos;ll need it to track your application status.</>
                )}
              </p>
            )}

            {/* Duplicate-application warning */}
            {warning && (
              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3 text-left">
                <p className="text-sm text-amber-800">
                  <strong>Note:</strong> {warning}
                </p>
              </div>
            )}

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

            {/* Next steps — role-based CTAs */}
            <div className="mt-8 pt-8 border-t border-slate-200 flex flex-col sm:flex-row gap-3">
              {/* Enrolled — show account creation */}
              {isEnrolled && (
                <Link
                  href="/login?redirect=/onboarding/learner"
                  className="inline-flex items-center justify-center bg-brand-green-600 hover:bg-brand-green-700 text-white font-bold px-6 py-3 rounded-lg transition-colors text-sm"
                >
                  Create My Account <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              )}
              {/* Employer — employer resources */}
              {role === 'employer' && !isEnrolled && (
                <Link
                  href="/employer"
                  className="inline-flex items-center justify-center bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold px-6 py-3 rounded-lg transition-colors text-sm"
                >
                  Employer Resources <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              )}
              {/* Program-holder — browse programs */}
              {role === 'program-holder' && !isEnrolled && (
                <Link
                  href="/programs"
                  className="inline-flex items-center justify-center bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold px-6 py-3 rounded-lg transition-colors text-sm"
                >
                  Browse Programs <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              )}
              {/* Student — explore funding */}
              {role === 'student' && !isEnrolled && (
                <Link
                  href="/funding"
                  className="inline-flex items-center justify-center bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-6 py-3 rounded-lg transition-colors text-sm"
                >
                  Explore Funding Options <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              )}
              {/* Track Application */}
              {refNumber && (
                <Link
                  href={`/apply/track?id=${encodeURIComponent(refNumber)}`}
                  className="inline-flex items-center justify-center border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold px-6 py-3 rounded-lg transition-colors text-sm"
                >
                  Track Application
                </Link>
              )}
              {/* Return home */}
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

          {/* Workforce funding notice for WIOA/WorkOne students */}
          {role === 'student' && !isEnrolled && funding && (funding.toLowerCase().includes('wioa') || funding.toLowerCase().includes('workone') || funding.toLowerCase().includes('workforce') || funding.toLowerCase().includes('employindy') || funding.toLowerCase().includes('impact')) && (
            <div className="mt-6 bg-amber-50 border-2 border-amber-400 rounded-xl p-5 text-left">
              <h3 className="font-bold text-amber-900 mb-2">Action Required — Register on Indiana Career Connect</h3>
              <p className="text-sm text-amber-800 mb-3">
                To receive {funding} funding, you must be registered on Indiana Career Connect and have an active case with your local WorkOne office before enrollment can be finalized.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <a
                  href="https://www.indianacareerconnect.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors"
                >
                  Go to Indiana Career Connect
                </a>
                <a
                  href="https://www.workone.in.gov/find-a-workone"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 border border-amber-400 text-amber-800 hover:bg-amber-100 font-semibold px-4 py-2 rounded-lg text-xs transition-colors"
                >
                  Find My WorkOne Office
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
