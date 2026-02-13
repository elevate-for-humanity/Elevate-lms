
'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { logger } from '@/lib/logger';
import React from 'react';

import { useEffect, useState, Suspense } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import {
  Check,
  X,
  Loader2,
  CreditCard,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';

interface SubscriptionPlan {
  product_id: string;
  product_name: string;
  description: string;
  features: string[];
  price_id: string;
  stripe_price_id: string;
  interval: string;
  amount_cents: number;
  amount_dollars: number;
  billing_period: string;
  effective_monthly_price: number;
  trial_period_days: number | null;
}

interface ActiveSubscription {
  id: string;
  status: string;
  cancel_at_period_end: boolean;
  current_period_end: string;
  trial_end: string | null;
  store_products: {
    name: string;
    features: string[];
  };
  store_prices: {
    amount_cents: number;
    interval: string;
  };
}

function SubscriptionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [activeSubscription, setActiveSubscription] =
    useState<ActiveSubscription | null>(null);

  useEffect(() => {
    loadUser();
    loadPlans();
    loadActiveSubscription();

    // Handle success/cancel redirects
    if (searchParams.get('success')) {
      toast.success('Subscription activated! Welcome aboard.');
      router.replace('/store/subscriptions');
    }
    if (searchParams.get('canceled')) {
      toast.error('Subscription canceled. You can try again anytime.');
      router.replace('/store/subscriptions');
    }
  }, [searchParams]);

  async function loadUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUser(user);
  }

  async function loadPlans() {
    const { data, error }: any = await supabase
      .from('store_subscription_pricing')
      .select('*')
      .order('amount_cents', { ascending: true });

    if (error) {
      logger.error('Error loading plans:', error);
      toast.error('Failed to load subscription plans');
    } else {
      setPlans(data || []);
    }
    setLoading(false);
  }

  async function loadActiveSubscription() {
    if (!user) return;

    const { data, error }: any = await supabase
      .from('store_subscriptions')
      .select('*, store_products(*), store_prices(*)')
      .eq('user_id', user.id)
      .in('status', ['trialing', 'active'])
      .single();

    if (!error && data) {
      setActiveSubscription(data);
    }
  }

  async function handleSubscribe(priceId: string) {
    if (!user) {
      toast.error('Please log in to subscribe');
      router.push('/login?redirect=/store/subscriptions');
      return;
    }

    setSubscribing(priceId);

    try {
      const response = await fetch('/api/store/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          userId: user.id,
          userEmail: user.email,
          userName: user.user_metadata?.full_name || user.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      logger.error('Subscription err:', err instanceof Error ? err : new Error(String(err)));
      toast.error(
        (err instanceof Error ? err.message : String(err)) ||
          'Failed to start subscription'
      );
      setSubscribing(null);
    }
  }

  async function handleManageSubscription() {
    if (!user) return;

    try {
      const response = await fetch('/api/store/customer-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to open customer portal');
      }

      // Redirect to Stripe Customer Portal
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      logger.error('Portal err:', err instanceof Error ? err : new Error(String(err)));
      toast.error(
        (err instanceof Error ? err.message : String(err)) ||
          'Failed to open billing portal'
      );
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Store", href: "/store" }, { label: "Subscriptions" }]} />
      </div>
<div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Store Subscriptions
          </h1>
          <p className="text-xl text-gray-600">
            Choose the plan that fits your needs
          </p>
        </div>

        {/* Active Subscription Banner */}
        {activeSubscription && (
          <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  Active Subscription: {activeSubscription.store_products.name}
                </h3>
                <p className="text-blue-700 mb-2">
                  Status:{' '}
                  <span className="font-medium capitalize">
                    {activeSubscription.status}
                  </span>
                </p>
                {activeSubscription.trial_end && (
                  <p className="text-blue-700 mb-2">
                    <Calendar className="inline h-4 w-4 mr-1" />
                    Trial ends:{' '}
                    {new Date(
                      activeSubscription.trial_end
                    ).toLocaleDateString()}
                  </p>
                )}
                <p className="text-blue-700">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  {activeSubscription.cancel_at_period_end
                    ? 'Cancels'
                    : 'Renews'}{' '}
                  on:{' '}
                  {new Date(
                    activeSubscription.current_period_end
                  ).toLocaleDateString()}
                </p>
                {activeSubscription.cancel_at_period_end && (
                  <div className="mt-2 flex items-center text-orange-700">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    <span className="text-sm">
                      Your subscription will end at the current period
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={handleManageSubscription}
                className="flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition-colors"
              >
                <CreditCard className="h-4 w-4" />
                Manage Subscription
              </button>
            </div>
          </div>
        )}

        {/* Subscription Plans */}
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const isCurrentPlan =
              activeSubscription?.store_products.name === plan.product_name;
            const isMonthly = plan.interval === 'month';

            return (
              <div
                key={plan.price_id}
                className={`bg-white rounded-lg shadow-lg overflow-hidden ${
                  isCurrentPlan ? 'ring-2 ring-blue-600' : ''
                }`}
              >
                {/* Plan Header */}
                <div className="bg-slate-700 text-white p-6">
                  <h3 className="text-2xl font-bold mb-2">
                    {plan.product_name}
                  </h3>
                  <p className="text-blue-100 text-sm mb-4">
                    {plan.description}
                  </p>
                  <div className="flex items-baseline">
                    <span className="text-4xl font-bold">
                      ${plan.amount_dollars}
                    </span>
                    <span className="text-blue-100 ml-2">
                      / {plan.billing_period.toLowerCase()}
                    </span>
                  </div>
                  {!isMonthly && (
                    <p className="text-blue-100 text-sm mt-2">
                      ${plan.effective_monthly_price}/month effective
                    </p>
                  )}
                  {plan.trial_period_days && (
                    <p className="text-blue-100 text-sm mt-2">
                      {plan.trial_period_days}-day free trial
                    </p>
                  )}
                </div>

                {/* Features */}
                <div className="p-6">
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature: string, idx: number) => (
                      <li key={idx} className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  {isCurrentPlan ? (
                    <button
                      disabled
                      className="w-full py-3 px-4 bg-gray-100 text-gray-500 rounded-lg font-semibold cursor-not-allowed"
                    >
                      Current Plan
                    </button>
                  ) : activeSubscription ? (
                    <button
                      onClick={handleManageSubscription}
                      className="w-full py-3 px-4 bg-brand-blue-600 text-white rounded-lg font-semibold hover:bg-brand-blue-700 transition-colors"
                    >
                      Switch to This Plan
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSubscribe(plan.stripe_price_id)}
                      disabled={subscribing === plan.stripe_price_id}
                      className="w-full py-3 px-4 bg-brand-blue-600 text-white rounded-lg font-semibold hover:bg-brand-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {subscribing === plan.stripe_price_id ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin mr-2" />
                          Processing...
                        </>
                      ) : (
                        'Subscribe Now'
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-6 shadow">
              <h3 className="font-semibold text-gray-900 mb-2">
                Can I cancel anytime?
              </h3>
              <p className="text-gray-600">
                Yes, you can cancel your subscription at any time. You'll
                continue to have access until the end of your billing period.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow">
              <h3 className="font-semibold text-gray-900 mb-2">
                Can I switch plans?
              </h3>
              <p className="text-gray-600">
                Yes, you can upgrade or downgrade your plan at any time through
                the customer portal.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow">
              <h3 className="font-semibold text-gray-900 mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-gray-600">
                We accept all major credit cards through Stripe's secure payment
                processing.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SubscriptionsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-blue-600" />
        </div>
      }
    >
      <SubscriptionsContent />
    </Suspense>
  );
}
