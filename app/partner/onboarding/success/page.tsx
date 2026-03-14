
import Image from 'next/image';
import { Metadata } from 'next';
import Link from 'next/link';
import { Mail, Clock, ArrowRight, CheckCircle, DollarSign } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Application Submitted | Partner Shop | Elevate for Humanity',
};

export default function PartnerOnboardingSuccessPage() {

  return (
    <div className="min-h-screen bg-slate-800">

      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px] overflow-hidden">
        <Image src="/images/pages/partner-page-10.jpg" alt="Onboarding complete" fill sizes="100vw" className="object-cover" priority />
      </section>
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Partner', href: '/partner' }, { label: 'Onboarding', href: '/partner/onboarding' }, { label: 'Success' }]} />
        </div>
      </div>

      <div className="py-12 px-4 flex items-center justify-center">
      <div className="max-w-lg w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-brand-green-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Application Submitted!
          </h1>
          <p className="text-slate-600 mb-8">
            Thank you for applying to become a Partner Shop with Elevate for Humanity.
          </p>

          <div className="bg-slate-50 rounded-lg p-6 text-left space-y-4 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-brand-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-brand-blue-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900">Check Your Email</p>
                <p className="text-sm text-slate-600">
                  We've sent a confirmation to your email address with your application details.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-brand-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-brand-blue-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900">Review Process</p>
                <p className="text-sm text-slate-600">
                  Our team will review your application within 1-3 business days. We'll notify you via email once a decision is made.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-brand-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <ArrowRight className="w-5 h-5 text-brand-green-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900">Next Steps</p>
                <p className="text-sm text-slate-600">
                  Once approved, you'll receive a magic link to activate your Partner Dashboard and start hosting apprentices.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-brand-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-5 h-5 text-brand-green-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900">Set Up Payroll</p>
                <p className="text-sm text-slate-600">
                  Connect your bank account or Elevate Pay Card and submit your W-9 so you can receive payroll deposits and program revenue.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Link
              href="/partner-portal"
              className="block w-full py-3 px-6 bg-brand-blue-600 text-white rounded-lg font-medium hover:bg-brand-blue-700 transition-colors"
            >
              Go to Partner Dashboard
            </Link>
            <Link
              href="/onboarding/payroll-setup"
              className="block w-full py-3 px-6 bg-brand-green-600 text-white rounded-lg font-medium hover:bg-brand-green-700 transition-colors"
            >
              Set Up Payroll &amp; Pay Method
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
            <a href="/support" className="text-brand-blue-600 hover:underline">
              (317) 314-3757
            </a>
          </p>
        </div>
      </div>
      </div>
    </div>
  );
}
