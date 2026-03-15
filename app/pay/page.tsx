// app/pay/page.tsx
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import type { Metadata } from 'next';
import Link from 'next/link';
import { CreditCard, DollarSign } from 'lucide-react';
import { ACTIVE_BNPL_PROVIDERS, BNPL_PROVIDER_NAMES } from '@/lib/bnpl-config';

export const metadata: Metadata = {
  title: 'Payment Options | Elevate for Humanity',
  description:
    'See tuition payment options: pay in full, payment plans, or buy now pay later.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/pay',
  },
};

export default function PayPage() {
  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Pay" }]} />
      </div>
<section className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-3xl md:text-4xl font-bold text-black mb-2">
          Payment Options
        </h1>
        <p className="text-black mb-6">
          If you&apos;re not using WIOA/WRG/JRI or other funding, you can pay with
          card, bank transfer, or split your payment with {BNPL_PROVIDER_NAMES}.
        </p>

        {/* Funding Check */}
        <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-brand-blue-900 mb-2">
            • Check Free Funding First!
          </h2>
          <p className="text-black mb-4">
            Many students qualify for no-cost training through WIOA, WRG, or JRI.
          </p>
          <Link
            href="/start"
            className="inline-block px-6 py-3 bg-brand-blue-600 text-white font-bold rounded-lg hover:bg-brand-blue-700"
          >
            Register at Indiana Career Connect
          </Link>
        </div>

        {/* Payment Options */}
        <div className="space-y-6">
          {/* Pay in Full */}
          <div className="bg-white rounded-xl p-6 border-2 border-brand-green-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-brand-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-brand-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-black mb-2">Pay in Full</h3>
                <p className="text-slate-600 mb-4">
                  One-time payment with credit card, debit card, or bank transfer (ACH).
                  Start training immediately after payment.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-white rounded-full text-sm">Visa</span>
                  <span className="px-3 py-1 bg-white rounded-full text-sm">Mastercard</span>
                  <span className="px-3 py-1 bg-white rounded-full text-sm">Amex</span>
                  <span className="px-3 py-1 bg-white rounded-full text-sm">ACH</span>
                </div>
              </div>
            </div>
          </div>

          {/* Buy Now Pay Later */}
          <div className="bg-white rounded-xl p-6 border-2 border-brand-blue-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-brand-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-black mb-2">Pay in 4</h3>
                <p className="text-slate-600 mb-4">
                  Split your payment into interest-free installments. Get instant approval at checkout.
                </p>
                <div className="flex flex-wrap gap-2">
                  {ACTIVE_BNPL_PROVIDERS.map((p) => (
                    <span key={p.id} className={`px-3 py-1 ${p.badgeBg} ${p.badgeText} rounded-full text-sm font-medium`}>{p.name}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Other Payment Methods */}
          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-slate-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-black mb-2">Other Payment Methods</h3>
                <p className="text-slate-600 mb-4">
                  We also accept Cash App, PayPal, Venmo, and other digital wallets.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-brand-green-100 text-brand-green-700 rounded-full text-sm">Cash App</span>
                  <span className="px-3 py-1 bg-brand-blue-100 text-brand-blue-700 rounded-full text-sm">PayPal</span>
                  <span className="px-3 py-1 bg-brand-blue-100 text-brand-blue-700 rounded-full text-sm">Venmo</span>
                  <span className="px-3 py-1 bg-white rounded-full text-sm">Link</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="mt-8 bg-white rounded-xl p-6">
          <h3 className="text-lg font-bold text-black mb-4">All Payments Include:</h3>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 flex-shrink-0">•</span>
              <span className="text-black">Secure payment via Stripe</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 flex-shrink-0">•</span>
              <span className="text-black">Instant enrollment confirmation</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 flex-shrink-0">•</span>
              <span className="text-black">All materials included</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 flex-shrink-0">•</span>
              <span className="text-black">Job placement assistance</span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <Link
            href="/programs"
            className="inline-block px-8 py-4 bg-brand-orange-600 text-white font-bold rounded-lg hover:bg-brand-orange-700 text-lg"
          >
            View Programs & Enroll
          </Link>
          <p className="mt-4 text-slate-600">
            Questions? Call <a href="/support" className="text-brand-orange-600 font-bold">support center</a>
          </p>
        </div>
      </section>
    </div>
  );
}
