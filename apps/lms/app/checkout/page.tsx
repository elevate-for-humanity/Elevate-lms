import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { getStripe, stripeCall } from '@/lib/stripe/client';
import { hydrateProcessEnv } from '@/lib/secrets';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { PRICES } from '@/lib/stripe/prices';

export const dynamic = 'force-dynamic';

const PLANS = {
  starter: { name: 'Starter', priceId: PRICES.STARTER_MONTHLY },
  pro: { name: 'Professional', priceId: PRICES.PROFESSIONAL_MONTHLY },
} as const;

type PlanKey = keyof typeof PLANS;

export const metadata: Metadata = {
  title: 'Secure Checkout | Elevate',
  robots: { index: false, follow: false },
};

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const { plan: requestedPlan } = await searchParams;
  if (!requestedPlan || !(requestedPlan in PLANS)) redirect('/pricing/sponsor-licensing?error=invalid-plan');
  const plan = requestedPlan as PlanKey;

  await hydrateProcessEnv().catch(() => undefined);
  const stripe = getStripe();
  if (!stripe) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
          <h1 className="mb-4 text-2xl font-bold text-slate-900">Payment Temporarily Unavailable</h1>
          <p className="mb-4 text-slate-600">Online payments are temporarily unavailable. Please contact us to complete your purchase.</p>
          <a href="/contact" className="block w-full rounded-lg bg-blue-600 py-3 text-center text-white hover:bg-blue-700">Contact Us</a>
          <p className="mt-4 text-center text-sm text-slate-500">Or call {PLATFORM_DEFAULTS.supportPhone}</p>
        </div>
      </div>
    );
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || PLATFORM_DEFAULTS.siteUrl;

    const session = await stripeCall(() => stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: PLANS[plan].priceId, quantity: 1 }],
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing/sponsor-licensing?canceled=true`,
      customer_email: user?.email,
      metadata: { plan, userId: user?.id || 'guest' },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      phone_number_collection: { enabled: true },
    }));

    if (user) await supabase.from('license_leads').insert({ email: user.email, plan, source: 'website' });
    if (!session.url) redirect('/pricing/sponsor-licensing?error=checkout');
    redirect(session.url);
  } catch {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
          <h1 className="mb-4 text-2xl font-bold text-red-600">Checkout Error</h1>
          <p className="mb-4 text-black">We encountered an error creating your checkout session. Please try again or contact support.</p>
          <div className="space-y-3">
            <a href="/pricing/sponsor-licensing" className="block w-full rounded-lg bg-blue-600 py-3 text-center text-white hover:bg-blue-700">Back to Pricing</a>
            <a href="/contact?topic=licensing-enterprise" className="block w-full rounded-lg bg-slate-200 py-3 text-center text-black hover:bg-slate-300">Contact Support</a>
          </div>
        </div>
      </div>
    );
  }
}
