import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, CheckCircle, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Application Received | Elevate for Humanity',
  description: 'Your program holder application has been received. Check your email for next steps.',
};

export default function ProgramHolderConfirmationPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <Image
            src="/images/Elevate_for_Humanity_logo_81bf0fab.jpg"
            alt="Elevate for Humanity"
            width={140}
            height={48}
            className="mx-auto h-auto"
          />
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-brand-blue-600 px-8 py-6 text-center">
            <div className="flex justify-center mb-3">
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-xl font-bold text-white">Application Received</h1>
            <p className="text-blue-100 text-sm mt-1">Your account has been created</p>
          </div>

          {/* Body */}
          <div className="px-8 py-8">
            {/* Check email callout */}
            <div className="flex items-start gap-4 bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <Mail className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-900 text-sm">Check your email now</p>
                <p className="text-amber-800 text-sm mt-1 leading-relaxed">
                  We sent you an onboarding link. Click it to access your portal and
                  complete the required steps — no password needed.
                </p>
                <p className="text-amber-900 text-sm mt-2 font-semibold">
                  ⚠️ The link expires in 1 hour. Open it before it expires.
                </p>
              </div>
            </div>

            {/* Steps */}
            <div className="mb-6">
              <p className="text-sm font-semibold text-slate-700 mb-3">Your onboarding steps:</p>
              <ol className="space-y-2">
                {[
                  'Sign the Memorandum of Understanding (MOU)',
                  'Acknowledge the Program Holder Handbook',
                  'Acknowledge Rights & Responsibilities',
                  'Upload required documents',
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-black">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-brand-blue-100 text-brand-blue-700 font-bold text-xs flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            {/* Didn't get email */}
            <div className="border-t border-slate-100 pt-5">
              <p className="text-xs text-black mb-3">
                Didn&apos;t receive the email, or the link expired? Check your spam folder, then contact us for a new link:
              </p>
              <div className="flex flex-col sm:flex-row gap-2 text-sm">
                <a
                  href="mailto:elevate4humanityedu@gmail.com"
                  className="flex items-center gap-1.5 text-brand-blue-600 hover:text-brand-blue-700 font-medium"
                >
                  <Mail className="w-4 h-4" />
                  elevate4humanityedu@gmail.com
                </a>
                <span className="hidden sm:inline text-white">|</span>
                <a
                  href="tel:3173143757"
                  className="text-brand-blue-600 hover:text-brand-blue-700 font-medium"
                >
                  (317) 314-3757
                </a>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-slate-50 px-8 py-4 border-t border-slate-100 flex items-center justify-between">
            <Link
              href="/"
              className="text-sm text-black hover:text-slate-700"
            >
              Return to home
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-1.5 text-sm font-semibold text-brand-blue-600 hover:text-brand-blue-700"
            >
              Go to login
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-black mt-6">
          Elevate for Humanity · 8888 Keystone Crossing Suite 1300, Indianapolis, IN 46240
        </p>
      </div>
    </div>
  );
}
