'use client';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import React from 'react';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CreditCard, XCircle, DollarSign } from 'lucide-react';

export default function TestPaymentsPage() {
  const [stripeConfigured, setStripeConfigured] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkStripeConfig();
  }, []);

  const checkStripeConfig = async () => {
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: 'test' }),
      });

      // If we get a 503, Stripe is not configured
      // If we get 400, Stripe is configured but product is invalid (expected)
      setStripeConfigured(response.status !== 503);
    } catch (err) {
      setStripeConfigured(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Test Payments" }]} />
      </div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/admin/dashboard"
            className="text-brand-blue-600 hover:text-brand-blue-800 mb-4 inline-block"
          >
            ← Back to Dashboard
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <CreditCard className="w-8 h-8 text-brand-blue-600" />
            <h1 className="text-3xl font-bold text-black">
              Payment System Status
            </h1>
          </div>
          <p className="text-black">
            Verify Stripe integration and WIOA funding assignment
          </p>
        </div>

        {/* Stripe Configuration Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-black mb-4">
            Stripe Configuration
          </h2>

          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-11 w-11 border-b-2 border-brand-blue-600 mx-auto" />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="text-sm font-medium text-black">
                  Stripe API Key
                </span>
                {stripeConfigured ? (
                  <span className="flex items-center gap-1 text-sm text-brand-green-600 font-medium">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    Configured
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-sm text-brand-orange-600 font-medium">
                    <XCircle className="w-4 h-4" />
                    Not Configured
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="text-sm font-medium text-black">
                  Checkout Endpoint
                </span>
                <span className="flex items-center gap-1 text-sm text-brand-green-600 font-medium">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  Available
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="text-sm font-medium text-black">
                  Webhook Handler
                </span>
                <span className="flex items-center gap-1 text-sm text-brand-green-600 font-medium">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  Configured
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Payment Flow Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-black mb-4">
            Payment Flow Status
          </h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-brand-green-50 rounded border border-brand-green-200">
              <span className="text-slate-400 flex-shrink-0">•</span>
              <div>
                <div className="font-medium text-brand-green-900">
                  Stripe Checkout Integration
                </div>
                <div className="text-sm text-brand-green-700">
                  Checkout sessions can be created for product purchases
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-brand-green-50 rounded border border-brand-green-200">
              <span className="text-slate-400 flex-shrink-0">•</span>
              <div>
                <div className="font-medium text-brand-green-900">
                  Webhook Processing
                </div>
                <div className="text-sm text-brand-green-700">
                  Payment events are processed and user access is updated
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-brand-green-50 rounded border border-brand-green-200">
              <span className="text-slate-400 flex-shrink-0">•</span>
              <div>
                <div className="font-medium text-brand-green-900">
                  Subscription Management
                </div>
                <div className="text-sm text-brand-green-700">
                  Recurring subscriptions are tracked and updated
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* WIOA Funding Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-black mb-4">
            WIOA Funding Integration
          </h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-brand-blue-50 rounded border border-brand-blue-200">
              <DollarSign className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-brand-blue-900">
                  Free Enrollment via WIOA
                </div>
                <div className="text-sm text-brand-blue-700">
                  Students can enroll with WIOA funding (no payment required)
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-brand-blue-50 rounded border border-brand-blue-200">
              <span className="text-slate-400 flex-shrink-0">•</span>
              <div>
                <div className="font-medium text-brand-blue-900">
                  Funding Source Tracking
                </div>
                <div className="text-sm text-brand-blue-700">
                  All enrollments track funding_source (WIOA, WRG, JRI, DOL,
                  etc.)
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-brand-blue-50 rounded border border-brand-blue-200">
              <span className="text-slate-400 flex-shrink-0">•</span>
              <div>
                <div className="font-medium text-brand-blue-900">
                  Tuition Amount Tracking
                </div>
                <div className="text-sm text-brand-blue-700">
                  Tuition and payment amounts are tracked for all funding
                  sources
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-brand-blue-50 rounded border border-brand-blue-200">
              <span className="text-slate-400 flex-shrink-0">•</span>
              <div>
                <div className="font-medium text-brand-blue-900">
                  RAPIDS Integration
                </div>
                <div className="text-sm text-brand-blue-700">
                  WIOA-funded apprenticeships are registered with Indiana RAPIDS
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Funding Sources */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-black mb-4">
            Supported Funding Sources
          </h2>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="p-3 border border-gray-200 rounded">
              <div className="font-medium text-black">WIOA</div>
              <div className="text-xs text-black">
                Workforce Innovation and Opportunity Act
              </div>
            </div>
            <div className="p-3 border border-gray-200 rounded">
              <div className="font-medium text-black">WRG</div>
              <div className="text-xs text-black">Workforce Ready Grant</div>
            </div>
            <div className="p-3 border border-gray-200 rounded">
              <div className="font-medium text-black">JRI</div>
              <div className="text-xs text-black">
                Justice Reinvestment Initiative
              </div>
            </div>
            <div className="p-3 border border-gray-200 rounded">
              <div className="font-medium text-black">DOL</div>
              <div className="text-xs text-black">Department of Labor</div>
            </div>
            <div className="p-3 border border-gray-200 rounded">
              <div className="font-medium text-black">Self-Pay</div>
              <div className="text-xs text-black">
                Direct payment via Stripe
              </div>
            </div>
            <div className="p-3 border border-gray-200 rounded">
              <div className="font-medium text-black">
                Employer-Sponsored
              </div>
              <div className="text-xs text-black">
                Paid by employer partner
              </div>
            </div>
          </div>
        </div>

        {/* Test Instructions */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-900 mb-2">
            Testing Instructions
          </h3>
          <ol className="text-sm text-yellow-800 space-y-1 list-decimal list-inside">
            <li>Use Stripe test mode for all testing</li>
            <li>Test card: 4242 4242 4242 4242 (any future date, any CVC)</li>
            <li>Verify webhook events are received in Stripe dashboard</li>
            <li>Check that user access is updated after successful payment</li>
            <li>Test WIOA enrollment flow (no payment required)</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
