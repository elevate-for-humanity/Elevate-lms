import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { DollarSign, Phone, XCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Payment Cancelled | Elevate for Humanity',
  description: 'Your payment was cancelled. You can try again anytime.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/payment/cancel',
  },
};

export default async function PaymentCancelPage() {
  const supabase = await createClient();

  
  // Log payment cancellation
  await supabase.from('page_views').insert({ page: 'payment_cancel' }).select();
  return (
    <div className="min-h-screen bg-white  to-white py-20">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Payment", href: "/payment" }, { label: "Cancel" }]} />
      </div>
<div className="container mx-auto px-4 max-w-2xl text-center">
        <div className="bg-white rounded-2xl shadow-xl p-12">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-12 h-12 text-black" />
          </div>

          <h1 className="text-4xl font-bold text-black mb-4 text-2xl md:text-3xl lg:text-4xl">
            Payment Cancelled
          </h1>

          <p className="text-base md:text-lg text-black mb-8">
            Your payment was cancelled. No charges were made to your account.
          </p>

          <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-6 mb-8">
            <h2 className="font-bold text-brand-blue-900 mb-2">Need Help?</h2>
            <p className="text-brand-blue-800 mb-4">
              We're here to help you get started. Here are some options:
            </p>
            <ul className="text-left text-brand-blue-800 space-y-2">
              <li>
                <DollarSign className="w-5 h-5 inline-block" /> Check if you
                qualify for funded training (WIOA, WRG, JRI)
              </li>
              <li>💳 Try a different payment method</li>
              <li>
                <Phone className="w-5 h-5 inline-block" /> Contact us to discuss
                payment plans: support center
              </li>
              <li>💬 Chat with our enrollment team</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/start"
              className="bg-brand-orange-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-brand-orange-700 transition"
            >
              Try Again
            </Link>
            <Link
              href="/programs"
              className="bg-gray-200 text-black px-8 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              View Programs
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
