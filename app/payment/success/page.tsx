import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Payment Successful | Elevate for Humanity',
  description: 'Your payment was successful. Welcome to Elevate for Humanity!',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/payment/success',
  },
};

export default async function PaymentSuccessPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
  
  // Log payment success
  await db.from('page_views').insert({ page: 'payment_success' }).select();
  return (
    <div className="min-h-screen bg-zinc-900  to-white py-20">
      <div className="container mx-auto px-4 max-w-2xl text-center">
        <div className="bg-white rounded-2xl shadow-xl p-12">
          <div className="w-20 h-20 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-slate-400 flex-shrink-0">•</span>
          </div>

          <h1 className="text-4xl font-bold text-black mb-4 text-2xl md:text-3xl lg:text-4xl">
            Payment Successful!
          </h1>

          <p className="text-base md:text-lg text-black mb-8">
            Thank you for enrolling in Elevate for Humanity. Your payment has
            been processed successfully.
          </p>

          <div className="bg-brand-green-50 border border-brand-green-200 rounded-lg p-6 mb-8">
            <h2 className="font-bold text-brand-green-900 mb-2">What's Next?</h2>
            <ul className="text-left text-brand-green-800 space-y-2">
              <li>
                <span className="text-slate-400 flex-shrink-0">•</span> Check your
                email for enrollment confirmation
              </li>
              <li>
                <span className="text-slate-400 flex-shrink-0">•</span> You'll receive
                your welcome packet within 24 hours
              </li>
              <li>
                <span className="text-slate-400 flex-shrink-0">•</span> Access your
                student portal to get started
              </li>
              <li>
                <span className="text-slate-400 flex-shrink-0">•</span> Our team will
                contact you to schedule orientation
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/learner/dashboard"
              className="bg-brand-orange-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-brand-orange-700 transition"
            >
              Go to Student Portal
            </Link>
            <Link
              href="/"
              className="bg-gray-200 text-black px-8 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              Return Home
            </Link>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-black">
              Questions? Contact us at{' '}
              <a
                href="/support"
                className="text-brand-orange-600 hover:underline"
              >
                support center
              </a>{' '}
              or{' '}
              <a
                href="/contact"
                className="text-brand-orange-600 hover:underline"
              >
                our contact form
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
