import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/payment',
  },
  title: 'Payment Options | Elevate For Humanity',
  description:
    'Explore payment options for your training programs including financing and payment plans.',
};

export default async function PaymentPage() {
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
  
  // Fetch payment options
  const { data: options } = await db
    .from('payment_options')
    .select('*')
    .order('order_index');
  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Payment" }]} />
      </div>
{/* Hero Section */}
      <section className="bg-white text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Payment Options
            </h1>
            <p className="text-lg text-brand-blue-100">
              Flexible payment solutions to help you invest in your future.
            </p>
          </div>
        </div>
      </section>

      {/* Payment Options */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Full Payment */}
              <div className="bg-white rounded-lg shadow-sm border p-8">
                <h2 className="text-2xl font-bold mb-4">Pay in Full</h2>
                <p className="text-gray-600 mb-6">
                  Pay the full tuition amount upfront and get started
                  immediately.
                </p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center">
                    <span className="text-slate-500 flex-shrink-0">•</span>
                    Instant enrollment
                  </li>
                  <li className="flex items-center">
                    <span className="text-slate-500 flex-shrink-0">•</span>
                    No additional fees
                  </li>
                  <li className="flex items-center">
                    <span className="text-slate-500 flex-shrink-0">•</span>
                    Credit/debit cards accepted
                  </li>
                </ul>
                <Link
                  href="/store"
                  className="block w-full bg-brand-blue-600 hover:bg-brand-blue-700 text-white text-center px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Pay Now
                </Link>
              </div>

              {/* Buy Now Pay Later */}
              <div className="bg-white rounded-lg shadow-sm border p-8">
                <h2 className="text-2xl font-bold mb-4">Pay in 4</h2>
                <p className="text-gray-600 mb-6">
                  Split your payment into 4 interest-free installments with
                  Klarna, Afterpay, or Zip.
                </p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center">
                    <span className="text-slate-500 flex-shrink-0">•</span>
                    4 interest-free payments
                  </li>
                  <li className="flex items-center">
                    <span className="text-slate-500 flex-shrink-0">•</span>
                    Instant approval at checkout
                  </li>
                  <li className="flex items-center">
                    <span className="text-slate-500 flex-shrink-0">•</span>
                    Klarna, Afterpay, or Zip
                  </li>
                </ul>
                <Link
                  href="/programs"
                  className="block w-full bg-brand-orange-600 hover:bg-brand-orange-700 text-white text-center px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  View Programs & Pay in 4
                </Link>
              </div>
            </div>

            {/* Barber Program Payment */}
            <div className="mt-12 bg-gradient-to-r from-brand-orange-500 to-brand-orange-600 rounded-lg shadow-lg p-8 text-white">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">
                    Barber Apprenticeship Program
                  </h2>
                  <p className="text-brand-orange-100 mb-4">
                    Start your career as a licensed barber. USDOL registered apprenticeship with flexible payment options.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <span className="text-slate-500 flex-shrink-0">•</span>
                      $1,743 setup fee + weekly payments
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-slate-500 flex-shrink-0">•</span>
                      Total program: $4,980
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-slate-500 flex-shrink-0">•</span>
                      WIOA funding may cover full cost
                    </li>
                  </ul>
                </div>
                <div className="flex flex-col gap-3">
                  <Link
                    href="/programs/barber-apprenticeship"
                    className="bg-white text-brand-orange-600 hover:bg-brand-orange-50 px-8 py-4 rounded-lg font-bold text-center transition-colors"
                  >
                    Enroll & Pay with Stripe
                  </Link>
                  <Link
                    href="/check-eligibility"
                    className="border-2 border-white text-white hover:bg-white/10 px-8 py-3 rounded-lg font-semibold text-center transition-colors"
                  >
                    Check WIOA Eligibility
                  </Link>
                </div>
              </div>
            </div>

            {/* Funding Options */}
            <div className="mt-12 bg-white rounded-lg shadow-sm border p-8">
              <h2 className="text-2xl font-bold mb-4 text-center">
                Additional Funding Options
              </h2>
              <p className="text-gray-600 text-center mb-8">
                You may qualify for free or reduced-cost training through
                workforce development programs.
              </p>
              <div className="grid md:grid-cols-3 gap-6">
                <Link
                  href="/funding"
                  className="text-center p-4 rounded-lg hover:bg-white transition-colors border"
                >
                  <h3 className="font-semibold mb-2">WIOA Funding</h3>
                  <p className="text-sm text-gray-600">
                    Workforce Innovation and Opportunity Act - may cover 100% of tuition
                  </p>
                </Link>
                <Link
                  href="/grants"
                  className="text-center p-4 rounded-lg hover:bg-white transition-colors border"
                >
                  <h3 className="font-semibold mb-2">Grants</h3>
                  <p className="text-sm text-gray-600">
                    Available grants and scholarships
                  </p>
                </Link>
                <Link
                  href="/check-eligibility"
                  className="text-center p-4 rounded-lg hover:bg-white transition-colors border"
                >
                  <h3 className="font-semibold mb-2">Check Eligibility</h3>
                  <p className="text-sm text-gray-600">
                    See if you qualify for free training
                  </p>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Help Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4">Need Help?</h2>
            <p className="text-gray-600 mb-6">
              Our team is here to help you find the best payment option for your
              situation.
            </p>
            <Link
              href="/contact"
              className="inline-block bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
