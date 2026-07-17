import { redirect } from 'next/navigation';
import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

// Plan configuration
const PLANS = {
  starter: {
    name: 'Starter',
    priceId: process.env.STRIPE_PRICE_STARTER || 'price_starter_monthly',
    setupFeeAmount: 150000, // $1,500 in cents
    monthlyAmount: 75000, // $750 in cents
  },
  pro: {
    name: 'Pro',
    priceId: process.env.STRIPE_PRICE_PRO || 'price_pro_monthly',
    setupFeeAmount: 500000, // $5,000 in cents
    monthlyAmount: 250000, // $2,500 in cents
  },
} as const;

type PlanKey = keyof typeof PLANS;

export const metadata: Metadata = {
  title: 'Payment System Not Configured',
  robots: { index: false, follow: false },
};

export default async function CheckoutPage({ searchParams }: { searchParams: { plan?: string } }) {
  const plan = searchParams.plan as PlanKey;

  // Validate plan
  if (!plan || !PLANS[plan]) {
    redirect('/pricing/sponsor-licensing?error=invalid-plan');
  }

  // Check if Stripe is configured
  if (!process.env.STRIPE_SECRET_KEY) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Payment Temporarily Unavailable</h1>
          <p className="text-slate-600 mb-4">
            Online payments are temporarily unavailable. Please contact us to complete your
            purchase.
          </p>
          <a
            href="/contact"
            className="block w-full bg-blue-600 text-white text-center py-3 rounded-lg hover:bg-blue-700"
          >
            Contact Us
          </a>
          <p className="text-center text-sm text-slate-500 mt-4">Or call {PLATFORM_DEFAULTS.supportPhone}</p>
        </div>
      </div>
    );
  }

  try {
    // Initialize Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-11-20.acacia',
    });

    // Get current user (optional - can checkout as guest)
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
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Get base URL
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || PLATFORM_DEFAULTS.siteUrl;

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: PLANS[plan].priceId,
          quantity: 1,
        },
      ],
      // Add setup fee as one-time payment
      invoice_creation: {
        enabled: true,
        invoice_data: {
          description: `${PLANS[plan].name} Plan Setup Fee`,
        },
      },
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing/sponsor-licensing?canceled=true`,
      customer_email: user?.email,
      metadata: {
        plan,
        userId: user?.id || 'guest',
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      phone_number_collection: {
        enabled: true,
      },
    });

    // Log checkout attempt
    if (user) {
      await supabase.from('license_leads').insert({
        email: user.email,
        plan,
        source: 'website',
      });
    }

    // Redirect to Stripe Checkout
    redirect(session.url!);
  } catch (error) {
    /* Error handled silently */

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Checkout Error</h1>
          <p className="text-black mb-4">
            We encountered an error creating your checkout session. Please try again or contact
            support.
          </p>
          <div className="space-y-3">
            <a
              href="/pricing/sponsor-licensing"
              className="block w-full bg-blue-600 text-white text-center py-3 rounded-lg hover:bg-blue-700"
            >
              Back to Pricing
            </a>
            <a
              href="/contact?topic=licensing-enterprise"
              className="block w-full bg-slate-200 text-black text-center py-3 rounded-lg hover:bg-slate-300"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    );
  }
}
