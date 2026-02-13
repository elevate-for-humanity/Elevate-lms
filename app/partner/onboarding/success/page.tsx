import { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle, Mail, Clock, ArrowRight } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Application Submitted | Partner Shop | Elevate for Humanity',
};

export default function PartnerOnboardingSuccessPage() {
  return (
    <div className="min-h-screen bg-slate-800">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Partner', href: '/partner' }, { label: 'Onboarding', href: '/partner/onboarding' }, { label: 'Success' }]} />
        </div>
      </div>

      <div className="py-12 px-4 flex items-center justify-center">
      <div className="max-w-lg w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Application Submitted!
          </h1>
          <p className="text-slate-600 mb-8">
            Thank you for applying to become a Partner Shop with Elevate for Humanity.
          </p>

          <div className="bg-slate-50 rounded-lg p-6 text-left space-y-4 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900">Check Your Email</p>
                <p className="text-sm text-slate-600">
                  We've sent a confirmation to your email address with your application details.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900">Review Process</p>
                <p className="text-sm text-slate-600">
                  Our team will review your application within 1-3 business days. We'll notify you via email once a decision is made.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <ArrowRight className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900">Next Steps</p>
                <p className="text-sm text-slate-600">
                  Once approved, you'll receive a magic link to activate your Partner Dashboard and start hosting apprentices.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Link
              href="/programs/barber-apprenticeship"
              className="block w-full py-3 px-6 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Back to Barber Program
            </Link>
            <Link
              href="/"
              className="block w-full py-3 px-6 text-slate-600 hover:text-slate-900 font-medium"
            >
              Return to Homepage
            </Link>
          </div>

          <p className="mt-8 text-sm text-slate-500">
            Questions? Contact us at{' '}
            <a href="/support" className="text-blue-600 hover:underline">
              Get Help Online
            </a>
          </p>
        </div>
      </div>
      </div>
    </div>
  );
}
