import { Metadata } from 'next';
import Link from 'next/link';
import { Clock, Mail, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Verification Pending | Program Holder',
  robots: 'noindex',
};

export default async function VerificationPendingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login?redirect=/program-holder/verification-pending');

  const { data: profile } = await supabase
    .from('profiles')
    .select('email, first_name')
    .eq('id', user.id)
    .maybeSingle();

  const email = profile?.email || user.email || '';
  const firstName = profile?.first_name || '';

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-20 h-20 bg-brand-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-10 h-10 text-brand-orange-600" />
          </div>

          <h1 className="text-2xl font-bold text-black mb-3">
            Verification Pending
          </h1>

          <p className="text-gray-600 mb-6">
            {firstName ? `Hi ${firstName}, your` : 'Your'} identity documents have been submitted and are under review.
            Our team will verify your identity within 24–48 hours.
          </p>

          {email && (
            <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3 text-left">
              <Mail className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-brand-blue-800">
                You'll receive an email at <strong>{email}</strong> once your verification is complete.
              </p>
            </div>
          )}

          <div className="space-y-3">
            <Link
              href="/program-holder/dashboard"
              className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-brand-blue-600 text-white rounded-lg font-semibold hover:bg-brand-blue-700 transition"
            >
              Go to Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/program-holder/onboarding"
              className="block w-full px-4 py-3 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-white transition text-center"
            >
              Back to Onboarding
            </Link>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Questions?{' '}
          <Link href="/contact" className="text-brand-blue-600 hover:underline">
            Contact support
          </Link>
        </p>
      </div>
    </div>
  );
}
