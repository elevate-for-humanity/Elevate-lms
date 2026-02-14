"use client";

import { Check } from 'lucide-react';
import Link from 'next/link';
import { APP_STORE_PRODUCTS } from '@/lib/stripe/app-store-products';

/**
 * In-App Pricing Screen
 *
 * IMPORTANT: This component is designed for app store compliance.
 * - Shows all pricing tiers
 * - Directs to external checkout (Stripe)
 * - Uses approved language
 *
 * DO NOT modify pricing or wording without checking app store guidelines.
 */
export function AppPricingScreen() {
  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">
            Choose Your Access Level
          </h1>
          <p className="text-black">
            The app is free to download. Some programs require paid platform access.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="space-y-4 mb-8">
          {APP_STORE_PRODUCTS.map((product) => (
            <div
              key={product.id}
              className={`bg-white rounded-xl shadow-lg p-6 ${
                product.recommended ? 'ring-2 ring-orange-500' : ''
              }`}
            >
              {product.recommended && (
                <div className="bg-orange-500 text-white px-3 py-2 rounded-full text-xs font-bold inline-block mb-3">
                  Recommended
                </div>
              )}

              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold text-black">
                    {product.name}
                  </h2>
                  <p className="text-sm text-black mt-1">
                    {product.description}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-black">
                    {product.priceDisplay.split('/')[0]}
                  </div>
                  {product.interval === 'month' && product.price > 0 && (
                    <div className="text-xs text-black">/month</div>
                  )}
                </div>
              </div>

              <ul className="space-y-2 mb-4">
                {product.features.slice(0, 4).map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <Check className="text-green-600 flex-shrink-0 mt-0.5" size={16} />
                    <span className="text-black">{feature}</span>
                  </li>
                ))}
                {product.features.length > 4 && (
                  <li className="text-sm text-slate-500 ml-6">
                    +{product.features.length - 4} more features
                  </li>
                )}
              </ul>

              {product.tier === 'free' && (
                <div className="text-center py-2 text-sm text-black font-medium">
                  Already Active
                </div>
              )}

              {(product.tier === 'student' || product.tier === 'career') && (
                <Link
                  href="/apply"
                  className="block w-full text-center bg-orange-500 text-white px-4 py-3 rounded-lg font-bold hover:bg-orange-600 transition"
                >
                  Get Started
                </Link>
              )}

              {product.tier === 'partner' && (
                <Link
                  href="/contact"
                  className="block w-full text-center bg-slate-900 text-white px-4 py-3 rounded-lg font-bold hover:bg-slate-800 transition"
                >
                  Contact Us
                </Link>
              )}
            </div>
          ))}
        </div>

        {/* Footer Note - REQUIRED FOR APP STORE COMPLIANCE */}
        <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-xl p-4 text-sm text-black">
          <p className="font-semibold mb-2">Important:</p>
          <p>
            Prices apply to platform access. Training and services may be paid separately through our website.
          </p>
          <p className="mt-2">
            <strong>Payments are processed securely on our website.</strong>
          </p>
        </div>

        {/* Help Link */}
        <div className="text-center mt-6">
          <Link
            href="/contact"
            className="text-orange-600 font-semibold hover:text-orange-700"
          >
            Questions? Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}
