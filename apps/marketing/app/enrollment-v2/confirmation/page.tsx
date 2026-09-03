import { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle, Phone, Mail, ArrowRight, Hash, Calendar, FileText, CreditCard } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Application Submitted — Elevate for Humanity',
  description: 'Your application has been received. We will contact you within 1–2 business days.',
  robots: { index: false, follow: false },
};

export default async function EnrollmentV2ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ confirmation?: string; program?: string; firstName?: string }>;
}) {
  const params = await searchParams;
  const confirmationNumber = params.confirmation || null;
  const programName = params.program ? decodeURIComponent(params.program) : null;
  const firstName = params.firstName ? decodeURIComponent(params.firstName) : null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-slate-900">Elevate</span>
            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">for Humanity</span>
          </Link>
          <Link href="/" className="text-sm text-slate-600 hover:text-slate-900">Return Home</Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Success Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Application Received!
          </h1>

          <p className="text-lg text-slate-600 mb-8">
            {firstName ? `Thank you, ${firstName}! ` : ''}Your application has been submitted successfully.
            {programName ? ` We'll review your ${programName} application within 1–2 business days.` : ''}
          </p>

          {/* Confirmation Number */}
          {confirmationNumber && (
            <div className="inline-flex items-center gap-3 bg-slate-900 text-white rounded-xl px-6 py-4 mb-8">
              <Hash className="w-5 h-5 text-slate-400" />
              <div className="text-left">
                <p className="text-xs text-slate-400 uppercase tracking-wider">Reference Number</p>
                <p className="font-mono font-bold text-lg tracking-widest">{confirmationNumber}</p>
              </div>
            </div>
          )}

          {/* Save your number notice */}
          {confirmationNumber && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-8 text-sm text-amber-800">
              <strong>Save your reference number.</strong> Keep it handy to check your application status.
            </div>
          )}

          {/* What Happens Next */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-8 text-left">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand-blue-600" />
              What Happens Next
            </h2>
            <ol className="space-y-4">
              {[
                { icon: FileText, text: 'Admissions team reviews your application', sub: '1–2 business days' },
                { icon: Phone, text: 'We contact you to discuss funding and next steps', sub: 'Phone or email' },
                { icon: CreditCard, text: 'Complete funding screening or enrollment agreement', sub: 'Quick process' },
                { icon: ArrowRight, text: 'Get access to your student portal and start training', sub: 'When enrolled' },
              ].map(({ icon: Icon, text, sub }, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="inline-flex items-center justify-center w-7 h-7 bg-brand-blue-600 text-white text-sm font-bold rounded-full flex-shrink-0">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-slate-800 font-medium">{text}</p>
                    <p className="text-xs text-slate-500">{sub}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Contact Options */}
          <div className="border-t border-slate-200 pt-8">
            <p className="text-sm font-semibold text-slate-700 mb-4">Questions? We're here to help:</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href={`tel:${PLATFORM_DEFAULTS.supportPhone.replace(/[^0-9]/g, '')}`}
                className="inline-flex items-center justify-center px-6 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors"
              >
                <Phone className="w-4 h-4 mr-2" />
                {PLATFORM_DEFAULTS.supportPhone}
              </a>
              <a
                href="mailto:admissions@elevateforhumanity.org"
                className="inline-flex items-center justify-center px-6 py-3 bg-white border-2 border-slate-300 text-slate-700 font-semibold rounded-xl hover:border-slate-400 transition-colors"
              >
                <Mail className="w-4 h-4 mr-2" />
                Email Admissions
              </a>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/enrollment-v2/funding"
            className="inline-flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl transition-colors"
          >
            Explore Funding Options
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Return to Home
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-slate-500">
            Check your email (including spam) for a confirmation message from admissions.
          </p>
        </div>
      </div>
    </div>
  );
}
