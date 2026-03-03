import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Phone, Mail } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Application Submitted | Building Technician with HVAC Fundamentals',
  robots: 'noindex',
};

export default function HvacApplicationSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-lg w-full">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-brand-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Application Submitted
          </h1>

          <p className="text-gray-600 mb-8">
            Thank you for applying to the HVAC Technician program.
            We&apos;ve received your application and will be in touch soon.
          </p>

          <div className="bg-gray-50 rounded-xl p-6 text-left mb-8">
            <h2 className="font-semibold text-gray-900 mb-4">What Happens Next</h2>
            <div className="space-y-3">
              {[
                'We review your application and funding eligibility within 2 business days',
                'You\'ll receive an email with your enrollment status and next steps',
                'If approved, you\'ll complete orientation and start your 12-week program',
                'Our team is available to answer questions at any time',
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-brand-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-brand-blue-600 text-xs font-bold">{i + 1}</span>
                  </div>
                  <p className="text-sm text-gray-700">{step}</p>
                </div>
              ))}
            </div>
          </div>

          <Link
            href="/onboarding/learner"
            className="w-full inline-flex items-center justify-center gap-2 bg-brand-green-600 hover:bg-brand-green-700 text-white px-6 py-3 rounded-lg font-bold transition-colors mb-3"
          >
            Start Onboarding <ArrowRight className="w-4 h-4" />
          </Link>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/programs/hvac-technician"
              className="flex-1 inline-flex items-center justify-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Program Details <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/support"
              className="flex-1 inline-flex items-center justify-center gap-2 border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <Phone className="w-4 h-4" /> Contact Us
            </Link>
          </div>

          <p className="mt-6 text-sm text-gray-500">
            Questions? Email{' '}
            <a href="mailto:info@elevateforhumanity.org" className="text-brand-blue-600 font-medium hover:underline">
              info@elevateforhumanity.org
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
