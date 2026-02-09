'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle,
  Download,
  BookOpen,
  MessageCircle,
  Calendar,
  ArrowRight,
  Loader2,
} from 'lucide-react';

const LICENSES: Record<string, { name: string; price: number }> = {
  'starter-license': { name: 'Elevate LMS Starter License', price: 299 },
  'pro-license': { name: 'Elevate LMS Pro License', price: 999 },
  'enterprise-clone-license': { name: 'Elevate LMS Enterprise License', price: 5000 },
};

function TrialSuccessContent() {
  const searchParams = useSearchParams();
  const licenseSlug = searchParams.get('license') || 'starter-license';
  const license = LICENSES[licenseSlug] || LICENSES['starter-license'];

  const trialEndDate = new Date();
  trialEndDate.setDate(trialEndDate.getDate() + 14);

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-2xl mx-auto px-4">
        {/* Success Header */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-3">
            Your Trial Has Started!
          </h1>
          <p className="text-lg text-gray-600">
            You now have full access to {license.name}
          </p>
        </div>

        {/* Trial Info Card */}
        <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
          <div className="flex items-center gap-4 p-4 bg-amber-50 rounded-xl mb-6">
            <Calendar className="w-6 h-6 text-amber-600" />
            <div>
              <p className="font-bold text-amber-900">
                Trial ends {trialEndDate.toLocaleDateString('en-US', { 
                  weekday: 'long',
                  month: 'long', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </p>
              <p className="text-sm text-amber-700">
                You'll be charged ${license.price.toLocaleString()} after the trial unless you cancel.
              </p>
            </div>
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-4">Next Steps</h2>
          
          <div className="space-y-4">
            <div className="flex gap-4 p-4 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Download className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Download the codebase</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Access the complete Next.js codebase from your dashboard.
                </p>
                <Link 
                  href="/account/licenses" 
                  className="text-blue-600 text-sm font-medium hover:underline inline-flex items-center gap-1"
                >
                  Go to My Licenses <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="flex gap-4 p-4 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Read the documentation</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Learn how to deploy, customize, and configure your platform.
                </p>
                <Link 
                  href="/docs" 
                  className="text-blue-600 text-sm font-medium hover:underline inline-flex items-center gap-1"
                >
                  View Documentation <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="flex gap-4 p-4 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Get support</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Have questions? Our team is here to help you succeed.
                </p>
                <Link 
                  href="/contact" 
                  className="text-green-600 text-sm font-medium hover:underline inline-flex items-center gap-1"
                >
                  Contact Support <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Cancel Info */}
        <div className="text-center text-sm text-gray-500">
          <p>
            Need to cancel? Go to{' '}
            <Link href="/account/billing" className="text-blue-600 hover:underline">
              Account → Billing
            </Link>
            {' '}anytime before your trial ends.
          </p>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
    </div>
  );
}

export default function TrialSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <TrialSuccessContent />
    </Suspense>
  );
}
