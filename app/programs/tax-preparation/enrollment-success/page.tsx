import { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle, BookOpen, ExternalLink } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title:
    'You Are Enrolled | Tax Preparation & Financial Services | Elevate for Humanity',
  description:
    'Your enrollment in the Tax Preparation & Financial Services program is confirmed.',
};

export default function EnrollmentSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="max-w-3xl mx-auto px-4 py-16">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            You&apos;re Enrolled!
          </h1>
          <p className="text-lg text-gray-600">
            Tax Preparation &amp; Financial Services Career Certificate (IRS
            VITA Track)
          </p>
          <p className="text-sm text-gray-500 mt-2">
            No cost to you — funded through WIOA
          </p>
        </div>

        {/* What Happens Next */}
        <div className="bg-white rounded-xl shadow-sm border p-8 mb-8">
          <h2 className="text-xl font-semibold mb-6">
            Your First 3 Steps
          </h2>
          <ol className="space-y-6">
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                1
              </span>
              <div>
                <h3 className="font-medium text-gray-900">
                  Set up your IRS Link &amp; Learn account
                </h3>
                <p className="text-gray-600 text-sm mt-1">
                  This is where you&apos;ll take your VITA/TCE certification
                  exam in Week 10.
                </p>
                <a
                  href="https://apps.irs.gov/app/vita/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-green-600 text-sm mt-2 hover:underline"
                >
                  Create account at IRS Link &amp; Learn
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                2
              </span>
              <div>
                <h3 className="font-medium text-gray-900">
                  Enroll in Intuit for Education (free)
                </h3>
                <p className="text-gray-600 text-sm mt-1">
                  Your financial literacy curriculum in Week 5 is delivered
                  through this platform.
                </p>
                <a
                  href="https://intuit4education.app.intuit.com/login"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-green-600 text-sm mt-2 hover:underline"
                >
                  Sign up at Intuit for Education
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                3
              </span>
              <div>
                <h3 className="font-medium text-gray-900">
                  Start Week 1: Orientation &amp; Ethics
                </h3>
                <p className="text-gray-600 text-sm mt-1">
                  Begin your 10-week journey with program orientation and
                  federal tax law fundamentals.
                </p>
                <Link
                  href="/courses/tax-prep-financial-services"
                  className="inline-flex items-center gap-1 text-green-600 text-sm mt-2 hover:underline"
                >
                  Go to Week 1
                  <BookOpen className="w-3 h-3" />
                </Link>
              </div>
            </li>
          </ol>
        </div>

        {/* Program Summary */}
        <div className="bg-gray-50 rounded-xl p-6 text-sm text-gray-600">
          <h3 className="font-medium text-gray-900 mb-3">Program at a Glance</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-gray-500">Duration:</span> 10 weeks
            </div>
            <div>
              <span className="text-gray-500">Hours:</span> 150 total
            </div>
            <div>
              <span className="text-gray-500">Delivery:</span> Hybrid
            </div>
            <div>
              <span className="text-gray-500">Cost:</span> $0 (WIOA funded)
            </div>
            <div className="col-span-2">
              <span className="text-gray-500">Credentials:</span> IRS VITA/TCE,
              QuickBooks ProAdvisor, Microsoft 365, Rise Up, Certificate of
              Completion
            </div>
          </div>
        </div>

        {/* Help */}
        <p className="text-center text-sm text-gray-500 mt-8">
          Questions? Call{' '}
          <a href="tel:317-314-3757" className="text-green-600 hover:underline">
            317-314-3757
          </a>{' '}
          or email{' '}
          <a
            href="mailto:info@elevateforhumanity.org"
            className="text-green-600 hover:underline"
          >
            info@elevateforhumanity.org
          </a>
        </p>
      </div>
    </div>
  );
}
