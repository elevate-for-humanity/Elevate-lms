import { Metadata } from 'next';
import Link from 'next/link';
import { PauseCircle, Mail, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Access Paused | Elevate For Humanity',
  description: 'Your access has been paused. Please contact your administrator.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/access-paused',
  },
};

/**
 * Access Paused Page
 * 
 * Shown to non-admin users when their organization's license has expired.
 * Clear, non-alarming message directing them to contact their admin.
 */
export default function AccessPausedPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          {/* Icon */}
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <PauseCircle className="w-8 h-8 text-amber-600" />
          </div>

          {/* Heading */}
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Access Paused
          </h1>

          {/* Message */}
          <p className="text-slate-600 mb-2">
            Your organization&apos;s subscription needs attention.
            Please contact your administrator to restore access.
          </p>
          <p className="text-sm text-slate-500 mb-6">
            You were redirected here because your organization&apos;s license has expired or is being renewed.
          </p>

          {/* Reassurance */}
          <div className="bg-white rounded-lg p-4 mb-6">
            <p className="text-sm text-slate-500">
              Your progress and data are safe.
              Once your administrator resolves the billing, you&apos;ll have full access again.
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Link
              href="/contact?topic=support"
              className="w-full inline-flex items-center justify-center gap-2 bg-brand-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-blue-700 transition-colors"
            >
              <Mail className="w-5 h-5" />
              Contact Support
            </Link>
            
            <Link
              href="/"
              className="w-full inline-flex items-center justify-center gap-2 text-slate-600 px-6 py-3 rounded-lg font-medium hover:bg-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Home
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-slate-500 mt-6">
          If you believe this is an error, please{' '}
          <Link href="/support/contact" className="text-brand-blue-600 hover:underline">
            contact support
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
