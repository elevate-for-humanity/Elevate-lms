export const revalidate = 3600;

import { Metadata } from 'next';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { APP_STORE_PRODUCTS } from '@/lib/stripe/app-store-products';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/pricing',
  },
  title: 'Pricing',
  description:
    'Choose your access level. Free to download. Platform access starts at $39/month for enrolled learners.',
};

// Pricing is driven by APP_STORE_PRODUCTS — the single source of truth
// that must stay in sync with Stripe and app store listings.
export default async function PricingPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Pricing' }]} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-16 px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-black mb-4">
            Choose Your Access Level
          </h1>
          <p className="text-base md:text-lg text-black max-w-3xl mx-auto">
            The app is free to download. Some programs and services require paid platform access.
          </p>
          <p className="text-sm text-slate-500 mt-2">
            Payments are processed securely outside the app.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {APP_STORE_PRODUCTS.map((product) => (
            <div
              key={product.id}
              className={`bg-white rounded-2xl shadow-lg p-8 relative ${
                product.recommended ? 'ring-2 ring-orange-500' : ''
              }`}
            >
              {product.recommended && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand-orange-600 text-white px-4 py-2 rounded-full text-sm font-bold">
                  Recommended
                </div>
              )}

              <div className="mb-6">
                <h2 className="text-2xl font-bold text-black mb-2">{product.name}</h2>
                <p className="text-black text-sm mb-4">{product.description}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-black">
                    {product.priceDisplay.split('/')[0]}
                  </span>
                  {product.interval === 'month' && product.price > 0 && (
                    <span className="text-black">/month</span>
                  )}
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {product.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check className="text-brand-green-600 flex-shrink-0 mt-0.5" size={20} />
                    <span className="text-black text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              {product.tier === 'free' && (
                <Link
                  href="/mobile-app"
                  className="block w-full text-center bg-slate-900 text-white px-6 py-3 rounded-lg font-bold hover:bg-slate-800 transition"
                >
                  Download App
                </Link>
              )}

              {product.tier === 'student' && (
                <Link
                  href="/apply"
                  className="block w-full text-center bg-brand-orange-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-brand-orange-600 transition"
                >
                  Get Started
                </Link>
              )}

              {product.tier === 'career' && (
                <Link
                  href="/apply"
                  className="block w-full text-center bg-brand-orange-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-brand-orange-600 transition"
                >
                  Get Started
                </Link>
              )}

              {product.tier === 'partner' && (
                <Link
                  href="/contact"
                  className="block w-full text-center bg-slate-900 text-white px-6 py-3 rounded-lg font-bold hover:bg-slate-800 transition"
                >
                  Contact Us
                </Link>
              )}
            </div>
          ))}
        </div>

        {/* Important Notes */}
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-black mb-4">Important Information</h2>
          <div className="space-y-4 text-black">
            <p>
              <strong>Platform Access:</strong> Prices apply to platform access for enrolled
              learners. Training and services may be paid separately through our website.
            </p>
            <p>
              <strong>Payment Processing:</strong> All payments are processed securely through our
              website using Stripe. We do not process payments through app store billing.
            </p>
            <p>
              <strong>Enrollment:</strong> Student and Career Track access requires enrollment in a
              program. Apply through our inquiry form to get started.
            </p>
            <p>
              <strong>Cancellation:</strong> You can cancel your subscription at any time. Access
              continues until the end of your billing period.
            </p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-black mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow">
              <h3 className="text-lg font-bold text-black mb-2">Is the app really free?</h3>
              <p className="text-black">
                Yes! The app download is completely free. You can browse programs, submit inquiries,
                and view public content without paying anything.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow">
              <h3 className="text-lg font-bold text-black mb-2">
                What's included in Student Access?
              </h3>
              <p className="text-black">
                Student Access ($39/month) gives you full LMS access, assigned courses, progress
                tracking, and certificates. This is for enrolled learners actively taking courses.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow">
              <h3 className="text-lg font-bold text-black mb-2">How do I pay for access?</h3>
              <p className="text-black">
                Payments are processed securely on our website through Stripe. After enrolling,
                you'll receive a payment link to set up your subscription.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow">
              <h3 className="text-lg font-bold text-black mb-2">Can I try before I buy?</h3>
              <p className="text-black">
                Yes! Download the free app to explore programs and content. When you're ready to
                enroll, submit an inquiry and we'll guide you through the process.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-black mb-4">Ready to Get Started?</h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/mobile-app"
              className="inline-flex items-center justify-center bg-slate-900 text-white px-8 py-4 rounded-lg font-bold hover:bg-slate-800 transition"
            >
              Download Free App
            </Link>
            <Link
              href="/apply"
              className="inline-flex items-center justify-center bg-brand-orange-600 text-white px-8 py-4 rounded-lg font-bold hover:bg-brand-orange-600 transition"
            >
              Apply to Enroll
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
