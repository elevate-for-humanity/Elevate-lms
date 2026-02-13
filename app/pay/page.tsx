// app/pay/page.tsx
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import type { Metadata } from 'next';
import Link from 'next/link';
import { CreditCard, CheckCircle, DollarSign } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Payment Options | Elevate for Humanity',
  description:
    'See tuition payment options: pay in full, payment plans, or buy now pay later with Klarna, Afterpay, or Zip.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/pay',
  },
};

export default function PayPage() {
  return (
    <div className="min-h-screen bg-slate-50">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Pay" }]} />
      </div>
<section className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-3xl md:text-4xl font-bold text-black mb-2">
          Payment Options
        </h1>
        <p className="text-black mb-6">
          If you&apos;re not using WIOA/WRG/JRI or other funding, you can pay with
          card, bank transfer, or split your payment with Klarna, Afterpay, or Zip.
        </p>

        {/* Funding Check */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-blue-900 mb-2">
            • Check Free Funding First!
          </h2>
          <p className="text-black mb-4">
            Most students qualify for 100% FREE training through WIOA, WRG, or JRI.
          </p>
          <Link
            href="/apply"
            className="inline-block px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700"
          >
            Register at Indiana Career Connect
          </Link>
        </div>

        {/* Payment Options */}
        <div className="space-y-6">
          {/* Pay in Full */}
          <div className="bg-white rounded-xl p-6 border-2 border-green-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-black mb-2">Pay in Full</h3>
                <p className="text-slate-600 mb-4">
                  One-time payment with credit card, debit card, or bank transfer (ACH).
                  Start training immediately after payment.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-slate-100 rounded-full text-sm">Visa</span>
                  <span className="px-3 py-1 bg-slate-100 rounded-full text-sm">Mastercard</span>
                  <span className="px-3 py-1 bg-slate-100 rounded-full text-sm">Amex</span>
                  <span className="px-3 py-1 bg-slate-100 rounded-full text-sm">ACH</span>
                </div>
              </div>
            </div>
          </div>

          {/* Buy Now Pay Later */}
          <div className="bg-white rounded-xl p-6 border-2 border-blue-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-black mb-2">Pay in 4</h3>
                <p className="text-slate-600 mb-4">
                  Split your payment into 4 interest-free installments with Klarna, 
                  Afterpay, or Zip. Get instant approval at checkout.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm font-medium">Klarna</span>
                  <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm font-medium">Afterpay</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">Zip</span>
                </div>
              </div>
            </div>
          </div>

          {/* Other Payment Methods */}
          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-slate-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-black mb-2">Other Payment Methods</h3>
                <p className="text-slate-600 mb-4">
                  We also accept Cash App, PayPal, Venmo, and other digital wallets.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">Cash App</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">PayPal</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">Venmo</span>
                  <span className="px-3 py-1 bg-slate-100 rounded-full text-sm">Link</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="mt-8 bg-slate-100 rounded-xl p-6">
          <h3 className="text-lg font-bold text-black mb-4">All Payments Include:</h3>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-black">Secure payment via Stripe</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-black">Instant enrollment confirmation</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-black">All materials included</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-black">Job placement assistance</span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <Link
            href="/programs"
            className="inline-block px-8 py-4 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 text-lg"
          >
            View Programs & Enroll
          </Link>
          <p className="mt-4 text-slate-600">
            Questions? Call <a href="https://calendly.com/elevate-for-humanity/advisor-call" target="_blank" rel="noopener noreferrer" className="text-orange-600 font-bold">Schedule a Meeting</a>
          </p>
        </div>
      </section>
    </div>
  );
}
