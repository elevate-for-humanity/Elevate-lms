import { Metadata } from 'next';
import Link from 'next/link';
import { AlertTriangle, CreditCard, Mail, Phone } from 'lucide-react';

export const metadata: Metadata = {
  title: 'License Suspended | Elevate for Humanity',
  description: 'Your license has been suspended. Please update your billing to restore access.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/license-suspended',
  },
};

export default function LicenseSuspendedPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* Warning Icon */}
        <div className="w-16 h-16 bg-brand-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-brand-red-600" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          License Suspended
        </h1>

        {/* Message */}
        <p className="text-slate-600 mb-8">
          Your platform license has been suspended due to a billing issue. 
          Please update your payment method to restore access to your account.
        </p>

        {/* Actions */}
        <div className="space-y-4">
          {/* Update Billing Button */}
          <Link
            href="/billing"
            className="flex items-center justify-center gap-2 w-full bg-brand-orange-600 hover:bg-brand-orange-700 text-white font-semibold py-3 px-6 rounded-lg transition"
          >
            <CreditCard className="w-5 h-5" />
            Update Billing
          </Link>

          {/* Contact Support */}
          <div className="pt-4 border-t border-slate-200">
            <p className="text-sm text-slate-500 mb-4">
              Need help? Contact our support team:
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="/contact"
                className="flex items-center justify-center gap-2 text-slate-700 hover:text-brand-orange-600 transition"
              >
                <Mail className="w-4 h-4" />
                <span className="text-sm">Email Support</span>
              </a>
              
              <a
                href="tel:+1-800-555-0123"
                className="flex items-center justify-center gap-2 text-slate-700 hover:text-brand-orange-600 transition"
              >
                <Phone className="w-4 h-4" />
                <span className="text-sm">Call Support</span>
              </a>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-xs text-slate-400 mt-8">
          If you believe this is an error, please contact support immediately.
          Your data is safe and will be restored once billing is resolved.
        </p>
      </div>
    </div>
  );
}
