import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { XCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Payment Cancelled',
  description: 'Payment was cancelled',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/payment/affirm/cancel',
  },
};

export default async function AffirmCancelPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Service Unavailable</h1>
          <p className="text-slate-600">Please try again later.</p>
        </div>
      </div>
    );
  }

  // Log affirm cancellation
  try { await supabase.from('page_views').insert({ page: 'affirm_cancel' }).select(); } catch { /* non-critical */ }
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <XCircle className="w-16 h-16 text-brand-orange-600 mx-auto mb-4" />

        <h1 className="text-2xl font-bold text-black mb-2">Payment Cancelled</h1>

        <p className="text-black mb-6">
          You cancelled the payment process. No charges were made to your account.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>Need help?</strong> Our team is here to assist you with any questions about
            payment options or enrollment.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/programs"
            className="inline-block px-6 py-3 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700 transition-colors"
          >
            Browse Programs
          </Link>

          <Link
            href="/contact"
            className="inline-block px-6 py-3 bg-slate-100 text-black font-semibold rounded-lg hover:bg-slate-200 transition-colors"
          >
            Contact Us
          </Link>

          <Link href="/" className="text-black hover:text-black transition-colors">
            Return to Homepage
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-200">
          <p className="text-sm text-black">
            Remember: Most of our programs are 100% FREE through WIOA, WRG, or JRI funding.
          </p>
          <Link
            href="/programs"
            className="text-sm text-brand-blue-600 hover:text-brand-blue-700 font-semibold"
          >
            Learn about funded training options →
          </Link>
        </div>
      </div>
    </div>
  );
}
