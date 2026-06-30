export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import type { Metadata } from 'next';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Application Received | Cosmetology Apprenticeship',
  description: 'Your cosmetology apprenticeship application has been received. Check your email for next steps.',
  robots: { index: false },
};

export default function CosmetologyApplySuccessPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full">
        {/* Success card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-9 h-9 text-brand-green-600" />
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-2">Application Received!</h1>
          <p className="text-slate-600 mb-6">
            Check your email — we've sent a confirmation with your enrollment details and next steps.
          </p>

          {/* Next steps */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-left">
            <div className="font-semibold text-blue-900 mb-2">What's Next?</div>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Review your welcome email</li>
              <li>Complete your profile setup</li>
              <li>Schedule your first day</li>
              <li>Prepare required documents</li>
            </ul>
          </div>

          <p className="text-sm text-slate-500 mb-6">
            Questions? Contact us at <a href="mailto:elevate4humanityedu@gmail.com" className="text-brand-blue-600 hover:underline">elevate4humanityedu@gmail.com</a> or call <a href={`tel:${PLATFORM_DEFAULTS.supportPhone.replace(/[^0-9]/g, "")}`} className="text-brand-blue-600 hover:underline">{PLATFORM_DEFAULTS.supportPhone}</a>
          </p>

          <div className="space-y-3">
            <Link
              href="/learner/dashboard"
              className="block w-full px-6 py-3 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition font-semibold"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/programs/cosmetology-apprenticeship"
              className="block w-full px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
            >
              Back to Program
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
