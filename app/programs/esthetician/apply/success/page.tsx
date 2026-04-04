
import { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle, Phone, Mail, UserPlus } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Enrollment Confirmed | Esthetician Apprenticeship',
  robots: 'noindex',
};

export default function EstheticianApplySuccessPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <CheckCircle className="w-12 h-12 text-brand-blue-600" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 mb-3">Payment Received</h1>
          <p className="text-black text-lg">
            Your enrollment in the Esthetician Apprenticeship program is confirmed.
          </p>
        </div>

        {/* Account creation CTA */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden mb-6">
          <div className="bg-brand-blue-600 px-6 py-4">
            <div className="flex items-center gap-3">
              <UserPlus className="w-6 h-6 text-white flex-shrink-0" />
              <div>
                <h2 className="font-bold text-white text-lg leading-tight">Create your account</h2>
                <p className="text-brand-blue-100 text-sm">Required to access orientation and your apprentice dashboard</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <p className="text-black text-sm mb-4">
              Use the same email address you used at checkout. Your enrollment will be linked automatically.
            </p>
            <Link
              href="/signup?role=apprentice&redirect=/programs/esthetician/enrollment-success"
              className="block w-full text-center py-3 bg-brand-blue-600 text-white font-bold rounded-lg hover:bg-brand-blue-700 transition"
            >
              Create Account &amp; Continue
            </Link>
            <p className="text-center text-xs text-black mt-3">
              Already have an account?{' '}
              <Link href="/login?redirect=/programs/esthetician/enrollment-success" className="text-brand-blue-600 hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden mb-8">
          <div className="p-6 space-y-4">
            <h2 className="font-bold text-slate-900 text-lg">What happens next</h2>
            <div className="space-y-3">
              {[
                'Create your account above using the same email you used at checkout.',
                'Complete orientation — takes about 10 minutes.',
                'Upload your ID to verify your identity.',
                'Weekly payments (if applicable) will begin the following Friday.',
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-brand-blue-100 text-brand-blue-700 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">
                    {i + 1}
                  </div>
                  <p className="text-sm text-black">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 mb-6">
          <p className="text-black text-sm text-center mb-4">Questions? We're here to help.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="tel:3173143757"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition text-sm font-medium"
            >
              <Phone className="w-4 h-4" />
              (317) 314-3757
            </a>
            <a
              href="mailto:info@elevateforhumanity.org"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition text-sm font-medium"
            >
              <Mail className="w-4 h-4" />
              Email Us
            </a>
          </div>
        </div>

        <div className="text-center">
          <Link
            href="/programs/esthetician"
            className="text-slate-500 hover:text-slate-700 transition text-sm"
          >
            Back to Program Details
          </Link>
        </div>
      </div>
    </div>
  );
}
